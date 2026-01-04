/**
 * Disc physics and state management system.
 *
 * Handles disc flight physics, catch detection, and scoring.
 *
 * Physics Integration:
 * - ECS entity is the source of truth for disc state
 * - Physics rigid body is synced on throw (for collision detection during flight)
 * - Physics body is not synced when disc lands/caught (not in flight)
 *
 * State Transitions:
 * - [Held] --throwDisc()--> [InFlight] --land()--> [OnGround]
 * - [InFlight] --catch()--> [Held]
 * - [Held] --giveDiscTo()--> [Held] (possession transfer)
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
  DISC_HELD_HEIGHT,
  DISC_THROW_HEIGHT,
  DISC_GROUND_LEVEL,
} from "@/constants";
import { isInEndZone, distanceSquared3D, isInBounds } from "@/utils";
import { FIELD_LENGTH, FIELD_WIDTH } from "@/constants";
import type { Team } from "@/types";

// Pre-compute squared catch radius for faster distance checks
const CATCH_RADIUS_SQ = CATCH_RADIUS * CATCH_RADIUS;

/**
 * Reset all disc flight-related state to default values.
 * Called when disc lands, is caught, or game resets.
 */
function resetDiscFlightState(discEntity: Entity): void {
  if (!discEntity.disc || !discEntity.velocity) return;

  discEntity.disc.inFlight = false;
  discEntity.disc.thrownBy = null;
  discEntity.disc.pullReceiverId = null;
  discEntity.disc.targetPosition = null;
  discEntity.disc.flightTime = 0;
  discEntity.velocity.x = 0;
  discEntity.velocity.y = 0;
  discEntity.velocity.z = 0;
}

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

  // Check for out-of-bounds (skip during pull - different rules apply)
  if (state.phase !== "pull" && !isInBounds(discEntity.position)) {
    // Disc went OOB - turnover at the boundary
    const halfWidth = FIELD_WIDTH / 2;
    const halfLength = FIELD_LENGTH / 2;

    // Clamp disc to boundary where it went out
    discEntity.position.x = Math.max(
      -halfWidth,
      Math.min(halfWidth, discEntity.position.x)
    );
    discEntity.position.z = Math.max(
      -halfLength,
      Math.min(halfLength, discEntity.position.z)
    );
    discEntity.position.y = DISC_GROUND_LEVEL;

    resetDiscFlightState(discEntity);
    state.turnover();
    return;
  }

  // Check if disc hit the ground
  if (discEntity.position.y <= DISC_GROUND_LEVEL) {
    discEntity.position.y = DISC_GROUND_LEVEL;
    resetDiscFlightState(discEntity);
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
 * Resets disc flight state and transfers possession to catcher.
 */
function completeCatch(
  discEntity: Entity,
  player: Entity,
  state: ReturnType<typeof useSimulationStore.getState>
): void {
  if (!discEntity.disc || !discEntity.velocity || !player.player) return;

  // Stop disc flight and clear all flight-related state
  resetDiscFlightState(discEntity);

  // Move disc to catcher's position
  discEntity.position.x = player.position.x;
  discEntity.position.y = DISC_HELD_HEIGHT;
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

    // Use hand position as the release point (where the disc actually is)
    if (holder.handWorldPosition) {
      discEntity.position.x = holder.handWorldPosition.x;
      discEntity.position.y = holder.handWorldPosition.y;
      discEntity.position.z = holder.handWorldPosition.z;
    } else {
      // Fallback to player center if hand position not available
      discEntity.position.x = holder.position.x;
      discEntity.position.y = DISC_THROW_HEIGHT;
      discEntity.position.z = holder.position.z;
    }

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
  // Only update target position if a target entity is provided
  // (preserves existing targetPosition set by pull system)
  if (targetEntity) {
    discEntity.disc.targetPosition = targetEntity.position;
  }

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

    // Move disc to holder and reset flight state
    discEntity.position.x = newHolder.position.x;
    discEntity.position.y = DISC_HELD_HEIGHT;
    discEntity.position.z = newHolder.position.z;
    resetDiscFlightState(discEntity);

    state.setDiscHolder(playerId);
  }
}

/**
 * Update disc position to follow the current holder's hand.
 * Called each frame when disc is not in flight.
 *
 * Uses the hand world position computed by Player.tsx, which accounts
 * for all transforms (player position, facing, body rotation, arm animation).
 */
export function updateDiscToFollowHolder(): void {
  const discEntity = disc.first;
  if (!discEntity?.disc || discEntity.disc.inFlight) return;

  // Find the current holder
  let holder: Entity | null = null;
  for (const p of allPlayers) {
    if (p.player?.hasDisc) {
      holder = p;
      break;
    }
  }

  if (!holder?.handWorldPosition) return;

  // Check if hand position has been calculated yet (not still at default origin).
  // On the first frame, Player.tsx hasn't run useFrame yet, so handWorldPosition
  // is still (0,0,0). Fall back to player position to avoid disc flashing at origin.
  const isValidHandPos =
    holder.handWorldPosition.x !== 0 ||
    holder.handWorldPosition.y !== 0 ||
    holder.handWorldPosition.z !== 0;

  if (!isValidHandPos) {
    // Fall back to player position until hand position is calculated
    discEntity.position.x = holder.position.x;
    discEntity.position.y = DISC_HELD_HEIGHT;
    discEntity.position.z = holder.position.z;
    return;
  }

  // Use the computed hand world position directly
  discEntity.position.x = holder.handWorldPosition.x;
  discEntity.position.y = holder.handWorldPosition.y;
  discEntity.position.z = holder.handWorldPosition.z;
}
