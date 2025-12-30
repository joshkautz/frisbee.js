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
  CATCH_SUCCESS_RATE,
} from "@/constants";
import { isInEndZone } from "@/utils";
import type { Team } from "@/types";

/**
 * Check if disc is in an end zone and handle scoring.
 *
 * @param discPos - Current disc position
 */
function checkScoring(discPos: Position): void {
  const state = useSimulationStore.getState();
  const possession = state.possession as Team;

  // Check if disc is in the scoring end zone for possessing team
  if (!isInEndZone(discPos, possession)) {
    return;
  }

  // Check if a player on the possessing team caught it in the end zone
  const players = [...allPlayers];
  const catcher = players.find(
    (p) =>
      p.player?.team === possession &&
      p.player?.hasDisc &&
      isInEndZone(p.position, possession)
  );

  if (catcher) {
    state.score(possession);
  }
}

/**
 * Update disc physics when in flight
 */
export function updateDiscFlight(delta: number): void {
  const state = useSimulationStore.getState();
  const discEntity = disc.first;

  if (!discEntity || !discEntity.disc || !discEntity.velocity) return;
  if (!discEntity.disc.inFlight) return;
  if (state.isPaused) return;

  const scaledDelta = delta * state.simulationSpeed;

  // Apply physics
  discEntity.velocity.y += DISC_GRAVITY * scaledDelta;
  discEntity.velocity.x *= Math.pow(AIR_RESISTANCE, scaledDelta * 60);
  discEntity.velocity.z *= Math.pow(AIR_RESISTANCE, scaledDelta * 60);

  // Update position
  discEntity.position.x += discEntity.velocity.x * scaledDelta;
  discEntity.position.y += discEntity.velocity.y * scaledDelta;
  discEntity.position.z += discEntity.velocity.z * scaledDelta;

  // Update flight time
  discEntity.disc.flightTime += scaledDelta;

  // Check for catches
  const players = [...allPlayers];
  for (const player of players) {
    if (!player.player) continue;

    const dx = player.position.x - discEntity.position.x;
    const dy = player.position.y + 1 - discEntity.position.y; // Player center ~1m up
    const dz = player.position.z - discEntity.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < CATCH_RADIUS) {
      // Caught!
      const catchSuccess = Math.random() < CATCH_SUCCESS_RATE;

      if (catchSuccess) {
        // Successful catch
        discEntity.disc.inFlight = false;
        discEntity.velocity.x = 0;
        discEntity.velocity.y = 0;
        discEntity.velocity.z = 0;

        // Clear old holder
        for (const p of players) {
          if (p.player) p.player.hasDisc = false;
        }

        // Set new holder
        player.player.hasDisc = true;

        // Update store
        state.catchDisc(player.id);

        // Check for scoring
        checkScoring(player.position);

        return;
      }
    }
  }

  // Check if disc hit the ground
  if (discEntity.position.y <= 0.1) {
    discEntity.position.y = 0.1;
    discEntity.disc.inFlight = false;
    discEntity.velocity.x = 0;
    discEntity.velocity.y = 0;
    discEntity.velocity.z = 0;

    // Turnover - disc hit the ground
    state.turnover();
  }
}

/**
 * Throw the disc to a target position
 */
export function throwDisc(
  velocity: Position,
  targetEntity: Entity | null
): void {
  const discEntity = disc.first;
  const state = useSimulationStore.getState();

  if (!discEntity || !discEntity.disc || !discEntity.velocity) return;

  // Find current holder and clear
  const players = [...allPlayers];
  const holder = players.find((p) => p.player?.hasDisc);

  if (holder && holder.player) {
    holder.player.hasDisc = false;

    // Set disc position to thrower
    discEntity.position.x = holder.position.x;
    discEntity.position.y = 1.5; // Release height
    discEntity.position.z = holder.position.z;
  }

  // Set velocity in ECS
  discEntity.velocity.x = velocity.x;
  discEntity.velocity.y = velocity.y;
  discEntity.velocity.z = velocity.z;

  // Apply velocity to physics rigid body if available
  const rb = discEntity.physicsRef?.rigidBody;
  if (rb) {
    // Set physics position
    rb.setTranslation(
      {
        x: discEntity.position.x,
        y: discEntity.position.y,
        z: discEntity.position.z,
      },
      true
    );

    // Apply impulse for throw
    rb.setLinvel(
      {
        x: velocity.x,
        y: velocity.y,
        z: velocity.z,
      },
      true
    );
  }

  // Set flight state
  discEntity.disc.inFlight = true;
  discEntity.disc.flightTime = 0;
  discEntity.disc.targetPosition = targetEntity?.position ?? null;

  // Update store
  state.throwDisc();
}

/**
 * Give the disc to a player (for pull, etc.)
 */
export function giveDiscTo(playerId: string): void {
  const discEntity = disc.first;
  const state = useSimulationStore.getState();
  const players = [...allPlayers];

  if (!discEntity || !discEntity.disc) return;

  // Clear old holder
  for (const p of players) {
    if (p.player) p.player.hasDisc = false;
  }

  // Find new holder
  const newHolder = players.find((p) => p.id === playerId);
  if (newHolder && newHolder.player) {
    newHolder.player.hasDisc = true;

    // Move disc to holder
    discEntity.position.x = newHolder.position.x;
    discEntity.position.y = 1;
    discEntity.position.z = newHolder.position.z;
    discEntity.disc.inFlight = false;

    state.setDiscHolder(playerId);
  }
}
