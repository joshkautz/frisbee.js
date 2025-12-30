/**
 * Math utility functions for vector operations.
 *
 * Provides consistent distance, interpolation, and vector functions
 * used throughout the game systems.
 *
 * @module utils/math
 */

import type { Vector3Object } from "@/types";

/**
 * Calculate 2D distance on XZ plane (ignoring Y height).
 * Useful for player-to-player or player-to-disc distances on the field.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Distance between points on XZ plane
 *
 * @example
 * const dist = distance2D(player.position, disc.position);
 */
export function distance2D(a: Vector3Object, b: Vector3Object): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate 3D distance between two points.
 * Includes Y axis for catching and flight calculations.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Distance between points in 3D space
 *
 * @example
 * const dist = distance3D(disc.position, player.position);
 */
export function distance3D(a: Vector3Object, b: Vector3Object): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate squared 2D distance (faster, avoids sqrt).
 * Use for comparisons where actual distance isn't needed.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Squared distance between points on XZ plane
 *
 * @example
 * // Check if within 5 meters
 * if (distanceSquared2D(a, b) < 25) { // 5^2 = 25
 *   // Within range
 * }
 */
export function distanceSquared2D(a: Vector3Object, b: Vector3Object): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

/**
 * Clamp a number between min and max values.
 *
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 *
 * @example
 * const speed = clamp(rawSpeed, 0, MAX_SPEED);
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 *
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 *
 * @example
 * const midpoint = lerp(start, end, 0.5);
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Normalize a 2D vector on XZ plane (set length to 1).
 * Returns zero vector if input has zero length.
 *
 * @param v - Vector to normalize
 * @returns Normalized vector (length 1) or zero vector
 *
 * @example
 * const direction = normalize2D(velocity);
 */
export function normalize2D(v: Vector3Object): Vector3Object {
  const length = Math.sqrt(v.x * v.x + v.z * v.z);
  if (length === 0) {
    return { x: 0, y: v.y, z: 0 };
  }
  return {
    x: v.x / length,
    y: v.y,
    z: v.z / length,
  };
}

/**
 * Calculate direction vector from point a to point b (normalized).
 *
 * @param from - Start position
 * @param to - End position
 * @returns Normalized direction vector (XZ plane)
 *
 * @example
 * const dir = direction2D(player.position, target.position);
 */
export function direction2D(
  from: Vector3Object,
  to: Vector3Object
): Vector3Object {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dz * dz);

  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: dx / length,
    y: 0,
    z: dz / length,
  };
}
