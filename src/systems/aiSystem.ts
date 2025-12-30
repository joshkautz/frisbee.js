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

import { allPlayers, disc, type Entity, type Position } from "@/ecs";
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
} from "@/constants";
import {
  distance2D,
  clampToField,
  isInEndZone,
  getTeamDirection,
} from "@/utils";

/**
 * Find an open position for cutting.
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

  // Generate potential positions
  const candidates: Position[] = [];

  // Try cutting towards the end zone
  for (let i = 0; i < CUT_CANDIDATES; i++) {
    const angle = (Math.random() - 0.5) * Math.PI;
    const dist = 10 + Math.random() * 15;
    candidates.push(
      clampToField({
        x: player.position.x + Math.sin(angle) * dist,
        y: 0,
        z: player.position.z + direction * Math.abs(Math.cos(angle)) * dist,
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

    // Avoid being too close to opponents
    for (const opp of opponents) {
      const d = distance2D(pos, opp.position);
      if (d < AI_MEDIUM_RANGE) {
        score -= (AI_MEDIUM_RANGE - d) * OPPONENT_PROXIMITY_WEIGHT;
      }
    }

    // Avoid bunching with teammates
    for (const tm of teammates) {
      if (tm.id === player.id) continue;
      const d = distance2D(pos, tm.position);
      if (d < AI_WIDE_RANGE) {
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

    const d = distance2D(thrower.position, tm.position);
    if (d > THROW_RANGE) continue; // Too far

    let score = 0;

    // Prefer forward passes
    const zAdvance = (tm.position.z - thrower.position.z) * direction;
    score += zAdvance * FORWARD_PASS_WEIGHT;

    // Prefer shorter passes (safer)
    score -= d * PASS_DISTANCE_PENALTY;

    // Check for defenders
    for (const opp of opponents) {
      const dToReceiver = distance2D(opp.position, tm.position);
      if (dToReceiver < DEFENDER_COVERAGE_CLOSE) {
        score -= HEAVY_GUARD_PENALTY;
      } else if (dToReceiver < DEFENDER_COVERAGE_MEDIUM) {
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

  if (state.isPaused || state.phase === "score" || state.phase === "pregame") {
    return;
  }

  const scaledDelta = delta * state.simulationSpeed;
  const discEntity = disc.first;
  const players = [...allPlayers];

  const homePlayers = players.filter((p) => p.player?.team === "home");
  const awayPlayers = players.filter((p) => p.player?.team === "away");

  const offensiveTeam = state.possession === "home" ? homePlayers : awayPlayers;
  const defensiveTeam = state.possession === "home" ? awayPlayers : homePlayers;

  for (const player of players) {
    if (!player.ai || !player.player) continue;

    // Update decision timer
    player.ai.decision -= scaledDelta;

    const isOffense = player.player.team === state.possession;
    const teammates = isOffense ? offensiveTeam : defensiveTeam;
    const opponents = isOffense ? defensiveTeam : offensiveTeam;

    // Make decisions periodically
    if (player.ai.decision <= 0) {
      player.ai.decision = DECISION_INTERVAL + Math.random() * 0.3;

      if (isOffense) {
        if (player.player.hasDisc) {
          // Player has disc - decide to throw
          player.ai.state = "throwing";
        } else if (
          discEntity?.disc?.inFlight &&
          discEntity.disc.targetPosition
        ) {
          // Disc in flight - try to catch
          player.ai.state = "catching";
          player.ai.targetPosition = discEntity.disc.targetPosition;
        } else {
          // Cut to get open
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
        const mark = offensiveTeam.find(
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
 * Handle disc throwing logic
 */
export function handleDiscThrow(): {
  target: Entity;
  velocity: Position;
} | null {
  const state = useSimulationStore.getState();
  const players = [...allPlayers];

  const thrower = players.find((p) => p.player?.hasDisc);
  if (!thrower) return null;

  const offensiveTeam = players.filter(
    (p) => p.player?.team === state.possession
  );
  const defensiveTeam = players.filter(
    (p) => p.player?.team !== state.possession
  );

  const target = findBestReceiver(thrower, offensiveTeam, defensiveTeam);
  if (!target) return null;

  // Calculate throw velocity
  const dx = target.position.x - thrower.position.x;
  const dz = target.position.z - thrower.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // Guard against division by zero (target at same position as thrower)
  if (dist < 0.1) return null;

  const throwSpeed = 20 + Math.random() * 10; // Variable throw speed

  return {
    target,
    velocity: {
      x: (dx / dist) * throwSpeed,
      y: 2 + Math.random() * 2, // Arc
      z: (dz / dist) * throwSpeed,
    },
  };
}
