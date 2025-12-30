/**
 * Screen-space projection utilities.
 *
 * Functions for projecting 3D geometry to 2D screen coordinates
 * and performing intersection tests.
 *
 * @module utils/projection
 */

import * as THREE from "three";

/**
 * 2D screen bounds representation.
 */
export interface ScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Reusable corner vectors to avoid allocations
const _corners = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
];

/**
 * Project a 3D bounding box to 2D screen bounds (NDC coordinates).
 *
 * Projects all 8 corners of the box through the camera and computes
 * the enclosing 2D rectangle in Normalized Device Coordinates (-1 to 1).
 *
 * @param box - The 3D bounding box to project
 * @param camera - The camera to project through
 * @param target - Target object to store the screen bounds
 * @returns True if any part of the box is in front of the camera
 *
 * @example
 * const bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
 * if (projectBoxToScreen(myBox, camera, bounds)) {
 *   // Box is visible, bounds contains screen-space rectangle
 * }
 */
export function projectBoxToScreen(
  box: THREE.Box3,
  camera: THREE.Camera,
  target: ScreenBounds
): boolean {
  // Get all 8 corners of the box
  const { min, max } = box;
  _corners[0].set(min.x, min.y, min.z);
  _corners[1].set(min.x, min.y, max.z);
  _corners[2].set(min.x, max.y, min.z);
  _corners[3].set(min.x, max.y, max.z);
  _corners[4].set(max.x, min.y, min.z);
  _corners[5].set(max.x, min.y, max.z);
  _corners[6].set(max.x, max.y, min.z);
  _corners[7].set(max.x, max.y, max.z);

  target.minX = Infinity;
  target.maxX = -Infinity;
  target.minY = Infinity;
  target.maxY = -Infinity;

  let anyInFront = false;

  // Project each corner to NDC
  for (const corner of _corners) {
    corner.project(camera);

    // Check if point is in front of camera (z < 1 in NDC)
    if (corner.z < 1) {
      anyInFront = true;
      target.minX = Math.min(target.minX, corner.x);
      target.maxX = Math.max(target.maxX, corner.x);
      target.minY = Math.min(target.minY, corner.y);
      target.maxY = Math.max(target.maxY, corner.y);
    }
  }

  return anyInFront;
}

/**
 * Check if two 2D screen bounds overlap.
 *
 * Uses standard AABB intersection test.
 *
 * @param a - First screen bounds
 * @param b - Second screen bounds
 * @returns True if the bounds overlap
 *
 * @example
 * if (boundsOverlap(boundsA, boundsB)) {
 *   // Objects overlap on screen
 * }
 */
export function boundsOverlap(a: ScreenBounds, b: ScreenBounds): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  );
}

/**
 * Create an empty screen bounds object.
 *
 * @returns A new ScreenBounds with zero values
 */
export function createScreenBounds(): ScreenBounds {
  return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
}
