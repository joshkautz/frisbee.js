/**
 * Field-specific utility functions.
 *
 * Provides functions for field bounds checking, end zone detection,
 * and position clamping based on standard ultimate frisbee field dimensions.
 *
 * @module utils/field
 */

import type { Vector3Object, Team } from "@/types";
import { FIELD_LENGTH, FIELD_WIDTH, END_ZONE_DEPTH } from "@/constants";
import { clamp } from "./math";
import { useSimulationStore } from "@/stores";

/** Half the field width (X bounds) */
const HALF_WIDTH = FIELD_WIDTH / 2;

/** Half the field length (Z bounds) */
const HALF_LENGTH = FIELD_LENGTH / 2;

/** Brick mark distance from goal line (20 yards = ~18.3 meters) */
export const BRICK_MARK_DISTANCE = 18.3;

/**
 * Check if a position is in the scoring end zone for a team.
 *
 * Home team scores in the positive Z end zone.
 * Away team scores in the negative Z end zone.
 *
 * @param pos - Position to check
 * @param team - Team checking for (determines which end zone)
 * @returns True if position is in the team's scoring end zone
 *
 * @example
 * if (isInEndZone(player.position, player.team)) {
 *   // Player is in scoring position
 * }
 */
export function isInEndZone(pos: Vector3Object, team: Team): boolean {
  if (team === "home") {
    // Home team scores at positive Z
    return pos.z > HALF_LENGTH - END_ZONE_DEPTH;
  } else {
    // Away team scores at negative Z
    return pos.z < -HALF_LENGTH + END_ZONE_DEPTH;
  }
}

/**
 * Get the Z coordinate of the end zone boundary for a team.
 *
 * @param team - Team to get end zone for
 * @returns Z coordinate of the end zone line
 *
 * @example
 * const endZoneZ = getEndZoneZ("home"); // Returns positive Z value
 */
export function getEndZoneZ(team: Team): number {
  if (team === "home") {
    return HALF_LENGTH - END_ZONE_DEPTH;
  } else {
    return -HALF_LENGTH + END_ZONE_DEPTH;
  }
}

/**
 * Clamp a position to stay within field bounds.
 *
 * @param pos - Position to clamp
 * @param padding - Optional padding from field edge (default: 1 meter)
 * @returns Position clamped to field bounds
 *
 * @example
 * const safePosition = clampToField(targetPosition);
 */
export function clampToField(
  pos: Vector3Object,
  padding: number = 1
): Vector3Object {
  return {
    x: clamp(pos.x, -HALF_WIDTH + padding, HALF_WIDTH - padding),
    y: pos.y,
    z: clamp(pos.z, -HALF_LENGTH + padding, HALF_LENGTH - padding),
  };
}

/**
 * Check if a position is within field bounds.
 *
 * @param pos - Position to check
 * @param padding - Optional padding from field edge (default: 0)
 * @returns True if position is within field bounds
 *
 * @example
 * if (!isInBounds(player.position)) {
 *   // Player is out of bounds
 * }
 */
export function isInBounds(pos: Vector3Object, padding: number = 0): boolean {
  return (
    pos.x >= -HALF_WIDTH + padding &&
    pos.x <= HALF_WIDTH - padding &&
    pos.z >= -HALF_LENGTH + padding &&
    pos.z <= HALF_LENGTH - padding
  );
}

/**
 * Get the direction multiplier for a team.
 * Direction changes after each score (teams switch ends).
 *
 * @param team - Team to get direction for
 * @returns 1 for attacking positive Z, -1 for attacking negative Z
 *
 * @example
 * const direction = getTeamDirection(player.team);
 * const targetZ = player.z + direction * 10; // Move toward goal
 */
export function getTeamDirection(team: Team): number {
  const attackingDirection = useSimulationStore.getState().attackingDirection;
  return attackingDirection[team];
}

/**
 * Get the Z position of the brick mark for a receiving team.
 * The brick mark is 20 yards from the goal line the team is defending.
 *
 * @param receivingTeam - Team receiving the pull
 * @returns Z coordinate of the brick mark
 */
export function getBrickMarkZ(receivingTeam: Team): number {
  const direction = getTeamDirection(receivingTeam);
  // Brick mark is 18.3m from the goal line they're defending
  // If attacking positive Z, defending goal is at -HALF_LENGTH
  // If attacking negative Z, defending goal is at +HALF_LENGTH
  if (direction > 0) {
    return -HALF_LENGTH + BRICK_MARK_DISTANCE;
  } else {
    return HALF_LENGTH - BRICK_MARK_DISTANCE;
  }
}
