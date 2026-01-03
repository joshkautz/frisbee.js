/**
 * Disc physics and state management system.
 *
 * Handles disc flight physics, catch detection, and scoring.
 *
 * @module systems/discSystem
 */

import { disc, allPlayers, type Entity, type Position } from "@/ecs";
import { useSimulationStore } from "@/stores";
import {
  CATCH_RADIUS,
  DISC_GRAVITY,
  AIR_RESISTANCE,
  DISC_LIFT_COEFFICIENT,
  DISC_LIFT_MIN_SPEED,
  CATCH_SUCCESS_RATE,
} from "@/constants";
import { isInEndZone, distanceSquared3D } from "@/utils";
import type { Team } from "@/types";

// Pre-compute squared catch radius for faster distance checks
const CATCH_RADIUS_SQ = CATCH_RADIUS * CATCH_RADIUS;

/**
 * Check if disc is in an end zone and handle scoring.
 */
function checkScoring(discPos: Position): void {
  const state = useSimulationStore.getState();
  const possession = state.possession as Team;

  if (!isInEndZone(discPos, possession)) {
    return;
  }

  // Check if a player on the possessing team caught it in the end zone
  for (const p of allPlayers) {
    if (
      p.player?.team === possession &&
      p.player?.hasDisc &&
      isInEndZone(p.position, possession)
    ) {
      state.score(possession);
      return;
    }
  }
}

/**
 * Update disc physics when in flight.
 * Applies gravity, lift, and air resistance to simulate realistic disc flight.
 */
export function updateDiscFlight(delta: number): void {
  const state = useSimulationStore.getState();
  const discEntity = disc.first;

  if (!discEntity?.disc?.inFlight || !discEntity.velocity) return;
  if (state.isPaused) return;

  const scaledDelta = delta * state.simulationSpeed;

  // Calculate horizontal speed for lift
  const horizontalSpeed = Math.sqrt(
    discEntity.velocity.x ** 2 + discEntity.velocity.z ** 2
  );

  // Apply gravity
  discEntity.velocity.y += DISC_GRAVITY * scaledDelta;

  // Apply lift - a spinning disc generates upward force based on horizontal speed
  if (horizontalSpeed > DISC_LIFT_MIN_SPEED) {
    const liftForce = horizontalSpeed * DISC_LIFT_COEFFICIENT * scaledDelta;
    discEntity.velocity.y += liftForce;
  }

  // Apply air resistance to horizontal velocity
  const dragFactor = Math.pow(AIR_RESISTANCE, scaledDelta * 60);
  discEntity.velocity.x *= dragFactor;
  discEntity.velocity.z *= dragFactor;

  // Update position
  discEntity.position.x += discEntity.velocity.x * scaledDelta;
  discEntity.position.y += discEntity.velocity.y * scaledDelta;
  discEntity.position.z += discEntity.velocity.z * scaledDelta;

  // Update flight time
  discEntity.disc.flightTime += scaledDelta;

  // Check for catches (skip during pull phase - disc lands on ground)
  if (state.phase !== "pull") {
    checkForCatches(discEntity);
  }

  // Check if disc hit the ground
  if (discEntity.position.y <= 0.1) {
    discEntity.position.y = 0.1;
    discEntity.disc.inFlight = false;
    discEntity.velocity.x = 0;
    discEntity.velocity.y = 0;
    discEntity.velocity.z = 0;
    state.turnover();
  }
}

/**
 * Check if any player can catch the disc.
 * Uses squared distance for faster initial check, avoiding sqrt until needed.
 */
function checkForCatches(discEntity: Entity): void {
  if (!discEntity.disc || !discEntity.velocity) return;

  const state = useSimulationStore.getState();

  // Iterate directly over ECS query (no array copy)
  for (const player of allPlayers) {
    if (!player.player) continue;

    // Thrower cannot catch their own throw
    if (player.id === discEntity.disc.thrownBy) continue;

    // Use squared distance for faster check (player catch point is ~1m up)
    const distSq = distanceSquared3D(discEntity.position, player.position, 1);

    if (distSq < CATCH_RADIUS_SQ) {
      // Attempt catch (90% success rate)
      if (Math.random() < CATCH_SUCCESS_RATE) {
        completeCatch(discEntity, player, state);
        return;
      }
      // Dropped catch - disc continues flight
    }
  }
}

/**
 * Complete a successful catch.
 */
function completeCatch(
  discEntity: Entity,
  player: Entity,
  state: ReturnType<typeof useSimulationStore.getState>
): void {
  if (!discEntity.disc || !discEntity.velocity || !player.player) return;

  // Stop disc flight
  discEntity.disc.inFlight = false;
  discEntity.disc.thrownBy = null;
  discEntity.velocity.x = 0;
  discEntity.velocity.y = 0;
  discEntity.velocity.z = 0;

  // Move disc to catcher's position
  discEntity.position.x = player.position.x;
  discEntity.position.y = 1;
  discEntity.position.z = player.position.z;

  // Clear old holder and set new holder (iterate directly over ECS query)
  for (const p of allPlayers) {
    if (p.player) p.player.hasDisc = false;
  }
  player.player.hasDisc = true;

  // Update store and check for scoring
  state.catchDisc(player.id);
  checkScoring(player.position);
}

/**
 * Throw the disc with given velocity.
 */
export function throwDisc(
  velocity: Position,
  targetEntity: Entity | null
): void {
  const discEntity = disc.first;
  const state = useSimulationStore.getState();

  if (!discEntity?.disc || !discEntity.velocity) return;

  // Find current holder and clear (iterate directly over ECS query)
  let holder: Entity | null = null;
  for (const p of allPlayers) {
    if (p.player?.hasDisc) {
      holder = p;
      break;
    }
  }

  if (holder?.player) {
    holder.player.hasDisc = false;

    // Set disc position to thrower's release point
    discEntity.position.x = holder.position.x;
    discEntity.position.y = 1.5;
    discEntity.position.z = holder.position.z;

    // Record thrower (they cannot catch their own throw)
    discEntity.disc.thrownBy = holder.id;
  }

  // Set velocity
  discEntity.velocity.x = velocity.x;
  discEntity.velocity.y = velocity.y;
  discEntity.velocity.z = velocity.z;

  // Sync to physics rigid body if available
  const rb = discEntity.physicsRef?.rigidBody;
  if (rb) {
    rb.setTranslation(
      {
        x: discEntity.position.x,
        y: discEntity.position.y,
        z: discEntity.position.z,
      },
      true
    );
    rb.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
  }

  // Set flight state
  discEntity.disc.inFlight = true;
  discEntity.disc.flightTime = 0;
  discEntity.disc.targetPosition = targetEntity?.position ?? null;

  state.throwDisc();
}

/**
 * Give the disc to a player (for pull setup, etc.)
 */
export function giveDiscTo(playerId: string): void {
  const discEntity = disc.first;
  const state = useSimulationStore.getState();

  if (!discEntity?.disc) return;

  // Clear old holder and find new holder in single pass
  let newHolder: Entity | null = null;
  for (const p of allPlayers) {
    if (p.player) {
      p.player.hasDisc = false;
      if (p.id === playerId) {
        newHolder = p;
      }
    }
  }

  // Set new holder
  if (newHolder?.player) {
    newHolder.player.hasDisc = true;

    // Move disc to holder
    discEntity.position.x = newHolder.position.x;
    discEntity.position.y = 1;
    discEntity.position.z = newHolder.position.z;
    discEntity.disc.inFlight = false;
    discEntity.disc.thrownBy = null;

    state.setDiscHolder(playerId);
  }
}
