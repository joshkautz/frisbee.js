/**
 * Vector and position type definitions.
 *
 * This module defines two representations for 3D positions:
 * - Vector3Tuple: Array format [x, y, z] used for React Three Fiber props
 * - Vector3Object: Object format { x, y, z } used for ECS entities and calculations
 *
 * @module types/vectors
 */

/**
 * 3D position as a tuple [x, y, z].
 * Preferred for React Three Fiber component props (position, rotation, scale).
 *
 * @example
 * <mesh position={[0, 1, 0] satisfies Vector3Tuple} />
 */
export type Vector3Tuple = [number, number, number];

/**
 * 3D position as an object with x, y, z properties.
 * Preferred for ECS entity positions and math calculations.
 *
 * @example
 * const pos: Vector3Object = { x: 0, y: 1, z: 0 };
 */
export interface Vector3Object {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert a tuple [x, y, z] to an object { x, y, z }.
 *
 * @param tuple - The tuple to convert
 * @returns Object with x, y, z properties
 *
 * @example
 * const obj = tupleToObject([1, 2, 3]); // { x: 1, y: 2, z: 3 }
 */
export function tupleToObject(tuple: Vector3Tuple): Vector3Object {
  return { x: tuple[0], y: tuple[1], z: tuple[2] };
}

/**
 * Convert an object { x, y, z } to a tuple [x, y, z].
 *
 * @param obj - The object to convert
 * @returns Tuple with [x, y, z] values
 *
 * @example
 * const tuple = objectToTuple({ x: 1, y: 2, z: 3 }); // [1, 2, 3]
 */
export function objectToTuple(obj: Vector3Object): Vector3Tuple {
  return [obj.x, obj.y, obj.z];
}
