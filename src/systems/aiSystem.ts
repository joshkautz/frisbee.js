/**
 * AI system for player decision-making and movement.
 *
 * Handles offensive and defensive AI behaviors including:
 * - Cutting to open space
 * - Finding receivers for throws
 * - Defensive positioning
 *
 * @module systems/aiSystem
 */

import {
  allPlayers,
  homePlayers,
  awayPlayers,
  disc,
  type Entity,
  type Position,
} from "@/ecs";
import { useSimulationStore } from "@/stores";
import {
  PLAYER_SPEED,
  CUTTING_SPEED,
  THROW_RANGE,
  DECISION_INTERVAL,
  AI_MEDIUM_RANGE,
  AI_WIDE_RANGE,
  OPPONENT_PROXIMITY_WEIGHT,
  TEAMMATE_BUNCHING_WEIGHT,
  END_ZONE_BONUS,
  FORWARD_PASS_WEIGHT,
  PASS_DISTANCE_PENALTY,
  DEFENDER_COVERAGE_CLOSE,
  DEFENDER_COVERAGE_MEDIUM,
  HEAVY_GUARD_PENALTY,
  LOOSE_COVER_PENALTY,
  END_ZONE_PREFERENCE_WEIGHT,
  CUT_CANDIDATES,
  DISC_GRAVITY,
  DISC_LIFT_COEFFICIENT,
  END_ZONE_DEPTH,
} from "@/constants";
import {
  distanceSquared2D,
  clampToField,
  isInEndZone,
  getTeamDirection,
  getEndZoneZ,
} from "@/utils";
import { FIELD_WIDTH, FIELD_LENGTH } from "@/constants";

// Pre-compute squared thresholds to avoid sqrt in hot loops
const AI_MEDIUM_RANGE_SQ = AI_MEDIUM_RANGE * AI_MEDIUM_RANGE;
const AI_WIDE_RANGE_SQ = AI_WIDE_RANGE * AI_WIDE_RANGE;
const THROW_RANGE_SQ = THROW_RANGE * THROW_RANGE;
const DEFENDER_COVERAGE_CLOSE_SQ =
  DEFENDER_COVERAGE_CLOSE * DEFENDER_COVERAGE_CLOSE;
const DEFENDER_COVERAGE_MEDIUM_SQ =
  DEFENDER_COVERAGE_MEDIUM * DEFENDER_COVERAGE_MEDIUM;

/**
 * Find an open position for cutting.
 *
 * Generates candidates across the field with varied angles to ensure
 * players spread out rather than clustering in one area.
 *
 * @param player - Player looking for open space
 * @param teammates - All players on same team
 * @param opponents - All players on opposing team
 * @returns Best position for cutting
 */
function findOpenSpace(
  player: Entity,
  teammates: Entity[],
  opponents: Entity[]
): Position {
  const team = player.player!.team;
  const direction = getTeamDirection(team);
  const endZoneZ = getEndZoneZ(team);

  // Generate potential positions with full 360-degree spread
  const candidates: Position[] = [];

  for (let i = 0; i < CUT_CANDIDATES; i++) {
    // Full circle of angles for diverse cut options
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 18;

    // Mix of forward, lateral, and comeback cuts
    const forwardBias = 0.3; // Slight preference toward end zone
    const zOffset = Math.cos(angle) * dist + direction * forwardBias * dist;

    // Calculate candidate Z position
    const candidateZ = player.position.z + zOffset;

    // Check if this cut would put us in/near the endzone
    const isEndzoneCut =
      (direction > 0 && candidateZ > endZoneZ - 5) ||
      (direction < 0 && candidateZ < endZoneZ + 5);

    // For endzone cuts, spread across the full width of the field
    // instead of just offsetting from current position
    let candidateX: number;
    if (isEndzoneCut) {
      // Random position across full field width (with padding)
      candidateX = (Math.random() - 0.5) * (FIELD_WIDTH - 4);
    } else {
      candidateX = player.position.x + Math.sin(angle) * dist;
    }

    candidates.push(
      clampToField({
        x: candidateX,
        y: 0,
        z: candidateZ,
      })
    );
  }

  // Score each position based on openness
  let bestPos = candidates[0];
  let bestScore = -Infinity;

  for (const pos of candidates) {
    let score = 0;

    // Prefer positions closer to end zone
    score += pos.z * direction * END_ZONE_PREFERENCE_WEIGHT;

    // Avoid being too close to opponents (use squared distance for speed)
    for (const opp of opponents) {
      const dSq = distanceSquared2D(pos, opp.position);
      if (dSq < AI_MEDIUM_RANGE_SQ) {
        // Only compute sqrt when we need the actual distance for scoring
        const d = Math.sqrt(dSq);
        score -= (AI_MEDIUM_RANGE - d) * OPPONENT_PROXIMITY_WEIGHT;
      }
    }

    // Avoid bunching with teammates (use squared distance for speed)
    for (const tm of teammates) {
      if (tm.id === player.id) continue;
      const dSq = distanceSquared2D(pos, tm.position);
      if (dSq < AI_WIDE_RANGE_SQ) {
        // Only compute sqrt when we need the actual distance for scoring
        const d = Math.sqrt(dSq);
        score -= (AI_WIDE_RANGE - d) * TEAMMATE_BUNCHING_WEIGHT;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  return bestPos;
}

/**
 * Find the best target to throw to.
 *
 * @param thrower - Player throwing the disc
 * @param teammates - All players on same team
 * @param opponents - All players on opposing team
 * @returns Best receiver entity or null if no valid target
 */
function findBestReceiver(
  thrower: Entity,
  teammates: Entity[],
  opponents: Entity[]
): Entity | null {
  const team = thrower.player!.team;
  const direction = getTeamDirection(team);

  let bestTarget: Entity | null = null;
  let bestScore = -Infinity;

  for (const tm of teammates) {
    if (tm.id === thrower.id) continue;
    if (tm.player!.hasDisc) continue;

    // Use squared distance for range check, only compute sqrt if in range
    const dSq = distanceSquared2D(thrower.position, tm.position);
    if (dSq > THROW_RANGE_SQ) continue; // Too far

    const d = Math.sqrt(dSq); // Only compute sqrt for in-range receivers
    let score = 0;

    // Prefer forward passes
    const zAdvance = (tm.position.z - thrower.position.z) * direction;
    score += zAdvance * FORWARD_PASS_WEIGHT;

    // Prefer shorter passes (safer)
    score -= d * PASS_DISTANCE_PENALTY;

    // Check for defenders (use squared distance for speed)
    for (const opp of opponents) {
      const dToReceiverSq = distanceSquared2D(opp.position, tm.position);
      if (dToReceiverSq < DEFENDER_COVERAGE_CLOSE_SQ) {
        score -= HEAVY_GUARD_PENALTY;
      } else if (dToReceiverSq < DEFENDER_COVERAGE_MEDIUM_SQ) {
        score -= LOOSE_COVER_PENALTY;
      }
    }

    // Bonus for end zone targets
    if (isInEndZone(tm.position, team)) {
      score += END_ZONE_BONUS;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTarget = tm;
    }
  }

  return bestTarget;
}

/**
 * Get defensive position relative to an offensive player.
 * Positions defender between attacker and their end zone.
 *
 * @param defender - Defending player
 * @param attacker - Offensive player being guarded
 * @returns Optimal defensive position
 */
function getDefensivePosition(defender: Entity, attacker: Entity): Position {
  const team = defender.player!.team;
  const direction = getTeamDirection(team);

  // Position between attacker and their end zone
  const offset = 2;
  return clampToField({
    x: attacker.position.x,
    y: 0,
    z: attacker.position.z - direction * offset,
  });
}

/**
 * Main AI update function - call this each frame
 */
export function updateAI(delta: number): void {
  const state = useSimulationStore.getState();

  // Only pause AI during score celebration or before game starts
  if (state.isPaused || state.phase === "score" || state.phase === "pregame") {
    return;
  }

  const discEntity = disc.first;

  // OFFSIDES RULE: During pull phase, players must stay in position until disc is released.
  // Both teams freeze until the pull is actually thrown (disc.inFlight becomes true).
  if (state.phase === "pull" && !discEntity?.disc?.inFlight) {
    // Clear velocities so players don't animate as moving
    for (const player of allPlayers) {
      if (player.velocity) {
        player.velocity.x = 0;
        player.velocity.z = 0;
      }
    }
    return;
  }

  const scaledDelta = delta * state.simulationSpeed;

  // Use pre-defined ECS queries directly (no array copy/filter overhead)
  const homeTeam = homePlayers.entities;
  const awayTeam = awayPlayers.entities;

  // During pull phase (disc in flight after pull), the RECEIVING team (opposite of possession)
  // should act as offense because they need to catch/pick up the disc
  const isPullPhase =
    discEntity?.disc?.pullReceiverId !== null && discEntity?.disc?.inFlight;

  // Iterate directly over ECS query (allPlayers already filters for entities with player + position + ai)
  for (const player of allPlayers) {
    if (!player.player) continue;

    // Update decision timer
    player.ai.decision -= scaledDelta;

    // During pull phase:
    // - Receiving team (opposite of possession) is OFFENSE (they catch and start passing)
    // - Pulling team (possession) is DEFENSE (they run down to defend)
    // Normal play: possession team is offense
    const isOffense = isPullPhase
      ? player.player.team !== state.possession // Pull: receiving team is offense
      : player.player.team === state.possession; // Normal: possession team is offense

    // Teammates and opponents are based on actual team membership, not offense/defense role
    const teammates = player.player.team === "home" ? homeTeam : awayTeam;
    const opponents = player.player.team === "home" ? awayTeam : homeTeam;

    // Make decisions periodically
    if (player.ai.decision <= 0) {
      player.ai.decision = DECISION_INTERVAL + Math.random() * 0.3;

      if (isOffense) {
        if (player.player.hasDisc) {
          // Player has disc - decide to throw based on stall count pressure
          const stallCount = discEntity?.stall?.count ?? 0;

          // High stall count (7+): panic mode - must throw immediately
          // Medium stall count (4-6): more aggressive, shorten decision time
          // Low stall count (0-3): normal decision timing
          if (stallCount >= 7) {
            // Panic! Force immediate throw
            player.ai.state = "throwing";
            player.ai.decision = 0; // No delay
          } else if (stallCount >= 4) {
            // Getting urgent - throw soon
            player.ai.state = "throwing";
          } else {
            // Normal pace - throw when ready
            player.ai.state = "throwing";
          }
        } else if (
          discEntity?.disc?.inFlight &&
          discEntity.disc.targetPosition
        ) {
          // Disc in flight - check if this player should catch it
          const isPullReceiver = discEntity.disc.pullReceiverId === player.id;
          // During pull, only designated receiver catches; otherwise any receiver can
          const isDesignatedReceiver =
            discEntity.disc.pullReceiverId === null || isPullReceiver;

          if (isDesignatedReceiver) {
            // This player is designated to catch (or no designation = regular throw)
            player.ai.state = "catching";
            player.ai.targetPosition = discEntity.disc.targetPosition;
          } else {
            // Not the designated receiver - set up for offense instead
            player.ai.state = "cutting";
            player.ai.targetPosition = findOpenSpace(
              player,
              teammates,
              opponents
            );
          }
        } else if (
          state.phase === "turnover" &&
          discEntity &&
          !discEntity.disc?.inFlight
        ) {
          // Disc is on the ground after turnover - closest player runs to pick it up
          const distToDisc = distanceSquared2D(
            player.position,
            discEntity.position
          );

          // Find if this player is closest to disc among teammates
          let isClosest = true;
          for (const tm of teammates) {
            if (tm.id === player.id) continue;
            const tmDist = distanceSquared2D(tm.position, discEntity.position);
            if (tmDist < distToDisc) {
              isClosest = false;
              break;
            }
          }

          if (isClosest) {
            // Run to pick up the disc
            player.ai.state = "catching";
            player.ai.targetPosition = { ...discEntity.position };
          } else {
            // Other players set up for offense
            player.ai.state = "cutting";
            player.ai.targetPosition = findOpenSpace(
              player,
              teammates,
              opponents
            );
          }
        } else {
          // Disc not in flight - cut to get open
          player.ai.state = "cutting";
          player.ai.targetPosition = findOpenSpace(
            player,
            teammates,
            opponents
          );
        }
      } else {
        // Defense
        player.ai.state = "defending";
        // Find player to defend (match by number for simplicity)
        const mark = opponents.find(
          (p) => p.player?.number === player.player?.number
        );
        if (mark) {
          player.ai.targetPosition = getDefensivePosition(player, mark);
        }
      }
    }

    // Execute current state
    if (player.ai.targetPosition) {
      const dx = player.ai.targetPosition.x - player.position.x;
      const dz = player.ai.targetPosition.z - player.position.z;
      const distSquared = dx * dx + dz * dz;

      // Use squared distance comparison to avoid sqrt when possible
      if (distSquared > 0.25) {
        // 0.5^2 = 0.25
        const dist = Math.sqrt(distSquared);
        const speed =
          player.ai.state === "cutting" ? CUTTING_SPEED : PLAYER_SPEED;
        const moveSpeed = speed * scaledDelta;
        const ratio = Math.min(moveSpeed / dist, 1);

        player.position.x += dx * ratio;
        player.position.z += dz * ratio;

        // Update velocity for animation purposes
        if (player.velocity) {
          player.velocity.x = (dx / dist) * speed;
          player.velocity.z = (dz / dist) * speed;
        }
      } else {
        // Reached target
        if (player.velocity) {
          player.velocity.x = 0;
          player.velocity.z = 0;
        }
      }
    }
  }
}

/**
 * Calculate the velocity needed to throw the disc to a specific landing position.
 *
 * Uses projectile motion equations accounting for gravity and approximate lift.
 * The disc releases at height 1.5m and should be catchable at ~1m height.
 *
 * @param from - Thrower position
 * @param to - Target landing position
 * @returns Velocity vector to reach the target
 */
function calculateThrowVelocity(from: Position, to: Position): Position {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);

  // Prevent division by zero
  if (horizontalDist < 0.1) {
    return { x: 0, y: 5, z: 0 };
  }

  // Release height and target catch height
  const releaseHeight = 1.5;
  const catchHeight = 1.0;
  const heightDiff = catchHeight - releaseHeight; // Usually negative (throwing down to catch)

  // Choose throw speed based on distance (faster for longer throws)
  // Typical frisbee throws: 15-30 m/s
  const minSpeed = 15;
  const maxSpeed = 28;
  const throwSpeed = Math.min(
    maxSpeed,
    minSpeed + (horizontalDist / 40) * (maxSpeed - minSpeed)
  );

  // Estimate flight time based on horizontal distance and speed
  const flightTime = horizontalDist / throwSpeed;

  // Calculate required vertical velocity using projectile motion
  // y = y0 + vy*t + 0.5*g*t^2
  // Solving for vy: vy = (y - y0 - 0.5*g*t^2) / t
  // Account for lift by reducing effective gravity
  const effectiveGravity = DISC_GRAVITY * (1 - DISC_LIFT_COEFFICIENT * 2);
  const vy =
    (heightDiff - 0.5 * effectiveGravity * flightTime * flightTime) /
    flightTime;

  // Calculate horizontal velocity components
  const vx = (dx / horizontalDist) * throwSpeed;
  const vz = (dz / horizontalDist) * throwSpeed;

  return { x: vx, y: vy, z: vz };
}

/**
 * Generate a random target position within the opponent's endzone.
 *
 * @param team - The throwing team (targets opponent's endzone)
 * @returns Random position within the endzone bounds
 */
function getRandomEndzoneTarget(team: "home" | "away"): Position {
  const direction = getTeamDirection(team);
  const halfLength = FIELD_LENGTH / 2;
  const halfWidth = FIELD_WIDTH / 2;

  // Endzone Z range (with small padding from lines)
  const endzoneStart =
    direction > 0 ? halfLength - END_ZONE_DEPTH + 2 : -halfLength + 2;
  const endzoneEnd =
    direction > 0 ? halfLength - 2 : -halfLength + END_ZONE_DEPTH - 2;
  const targetZ = endzoneStart + Math.random() * (endzoneEnd - endzoneStart);

  // Full width of field (with padding from sidelines)
  const targetX = (Math.random() - 0.5) * (halfWidth * 2 - 4);

  return { x: targetX, y: 1, z: targetZ };
}

/**
 * Handle disc throwing logic.
 *
 * Picks a receiver, generates a random target position in the endzone,
 * calculates the trajectory to land there, and sets the receiver running to catch.
 */
export function handleDiscThrow(): {
  target: Entity;
  velocity: Position;
  targetPosition: Position;
} | null {
  const state = useSimulationStore.getState();

  // Use ECS queries directly (no array copy overhead)
  let thrower: Entity | null = null;
  for (const p of allPlayers) {
    if (p.player?.hasDisc) {
      thrower = p;
      break;
    }
  }
  if (!thrower) return null;

  const team = thrower.player!.team;
  const offensiveTeam =
    state.possession === "home" ? homePlayers.entities : awayPlayers.entities;
  const defensiveTeam =
    state.possession === "home" ? awayPlayers.entities : homePlayers.entities;

  // Find a receiver to throw to
  const receiver = findBestReceiver(thrower, offensiveTeam, defensiveTeam);
  if (!receiver) return null;

  // Determine target position:
  // If receiver is in/near endzone, target a random spot in the endzone
  // Otherwise, target the receiver's current position (with slight lead)
  let targetPosition: Position;
  const direction = getTeamDirection(team);
  const endZoneZ = getEndZoneZ(team);
  const isDeepThrow =
    (direction > 0 && receiver.position.z > endZoneZ - 10) ||
    (direction < 0 && receiver.position.z < endZoneZ + 10);

  if (isDeepThrow) {
    // Generate random target in the endzone
    targetPosition = getRandomEndzoneTarget(team);
  } else {
    // Target receiver's position with slight lead based on their velocity
    const leadTime = 0.5; // seconds
    targetPosition = {
      x: receiver.position.x + (receiver.velocity?.x ?? 0) * leadTime,
      y: 1,
      z: receiver.position.z + (receiver.velocity?.z ?? 0) * leadTime,
    };
  }

  // Calculate velocity to land at target position
  const velocity = calculateThrowVelocity(thrower.position, targetPosition);

  // Set receiver to run toward the target position
  if (receiver.ai) {
    receiver.ai.targetPosition = targetPosition;
    receiver.ai.state = "catching";
  }

  return {
    target: receiver,
    velocity,
    targetPosition,
  };
}
