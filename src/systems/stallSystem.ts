/**
 * Stall count system for tracking and enforcing the 10-second rule.
 *
 * USA Ultimate Rules:
 * - Marker counts "stalling" 1-10 at one-second intervals
 * - If disc not released by "ten", it's a turnover
 * - Count resets when thrower releases disc
 * - Stall only active when marker is within 3 meters of thrower
 *
 * @module systems/stallSystem
 */

import { disc, allPlayers, homePlayers, awayPlayers, type Entity } from "@/ecs";
import { useSimulationStore } from "@/stores";
import { distanceSquared2D } from "@/utils";
import { MAX_STALL_COUNT, STALL_INTERVAL, MARKING_DISTANCE } from "@/constants";

const MARKING_DISTANCE_SQ = MARKING_DISTANCE * MARKING_DISTANCE;

/**
 * Find the closest defender to the disc holder for marking.
 *
 * @param holder - The player holding the disc
 * @param opponents - Array of opposing team players
 * @returns Closest defender within marking distance, or null if none
 */
function findMarker(holder: Entity, opponents: Entity[]): Entity | null {
  let closest: Entity | null = null;
  let closestDistSq = MARKING_DISTANCE_SQ;

  for (const opp of opponents) {
    const distSq = distanceSquared2D(holder.position, opp.position);
    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closest = opp;
    }
  }

  return closest;
}

/**
 * Update stall count system each frame.
 *
 * Should be called every frame during the "playing" phase when disc is not in flight.
 * Increments the stall count when a marker is within range and triggers
 * a turnover if the count reaches 10.
 *
 * @param delta - Time since last frame in seconds
 */
export function updateStallCount(delta: number): void {
  const state = useSimulationStore.getState();
  const discEntity = disc.first;

  if (!discEntity?.stall) return;
  if (state.isPaused || state.phase !== "playing") return;

  // Find disc holder
  let holder: Entity | null = null;
  for (const player of allPlayers) {
    if (player.player?.hasDisc) {
      holder = player;
      break;
    }
  }

  // If no one has the disc, reset stall
  if (!holder) {
    resetStallCount(discEntity);
    return;
  }

  const team = holder.player!.team;
  const opponents =
    team === "home" ? awayPlayers.entities : homePlayers.entities;

  // Find marker (closest defender within range)
  const marker = findMarker(holder, opponents);

  if (!marker) {
    // No marker in range - stall pauses but doesn't reset
    discEntity.stall.isActive = false;
    discEntity.stall.markerId = null;
    return;
  }

  // Activate stall with marker
  discEntity.stall.isActive = true;
  discEntity.stall.markerId = marker.id;

  // Increment time and check for count increase
  const scaledDelta = delta * state.simulationSpeed;
  discEntity.stall.timeSinceLastCount += scaledDelta;

  if (discEntity.stall.timeSinceLastCount >= STALL_INTERVAL) {
    discEntity.stall.timeSinceLastCount -= STALL_INTERVAL;
    discEntity.stall.count += 1;

    // Check for stall-out turnover
    if (discEntity.stall.count >= MAX_STALL_COUNT) {
      state.turnover();
      resetStallCount(discEntity);
    }
  }
}

/**
 * Reset stall count to zero.
 *
 * Should be called when:
 * - Disc is thrown
 * - Possession changes
 * - No player has the disc
 *
 * @param discEntity - The disc entity (optional, will find if not provided)
 */
export function resetStallCount(discEntity?: Entity): void {
  const entity = discEntity ?? disc.first;
  if (!entity?.stall) return;

  entity.stall.count = 0;
  entity.stall.timeSinceLastCount = 0;
  entity.stall.markerId = null;
  entity.stall.isActive = false;
}

/**
 * Get the current stall count for UI display.
 *
 * @returns Current stall count (0-10) or 0 if not active
 */
export function getStallCount(): number {
  const discEntity = disc.first;
  return discEntity?.stall?.count ?? 0;
}

/**
 * Check if stall count is currently active.
 *
 * @returns True if a marker is actively counting
 */
export function isStallActive(): boolean {
  const discEntity = disc.first;
  return discEntity?.stall?.isActive ?? false;
}
