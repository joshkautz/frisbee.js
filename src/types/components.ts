/**
 * Component prop type definitions.
 *
 * Centralized location for all React component prop interfaces.
 * Import types from this module rather than defining inline.
 *
 * @module types/components
 */

import type { Vector3Tuple } from "./vectors";
import type { Team } from "./game";
import type { Entity } from "@/ecs";

// ============================================================================
// Environment Component Props
// ============================================================================

/**
 * Props for the Building component.
 */
export interface BuildingProps {
  /** Position as [x, y, z] tuple */
  position: Vector3Tuple;
  /** Building width (X axis) */
  width: number;
  /** Building depth (Z axis) */
  depth: number;
  /** Building height (Y axis) */
  height: number;
  /** Hex color value for the building */
  color: number;
}

/**
 * Props for the StreetLight component.
 */
export interface StreetLightProps {
  /** Position as [x, y, z] tuple */
  position: Vector3Tuple;
}

// ============================================================================
// Entity Component Props
// ============================================================================

/**
 * Props for the Player component.
 */
export interface PlayerProps {
  /** The ECS entity representing the player */
  entity: Entity;
  /** Hex color value for the player's jersey */
  color: number;
}

/**
 * Props for the Team component.
 */
export interface TeamProps {
  /** Which team to render */
  team: Team;
  /** Hex color value for the team's jerseys */
  color: number;
}

// ============================================================================
// Camera Component Props
// ============================================================================

/**
 * Props for the CameraControls component.
 */
export interface CameraControlsProps {
  /** Minimum zoom distance from target */
  minDistance?: number;
  /** Maximum zoom distance from target */
  maxDistance?: number;
  /** Maximum polar angle (prevents camera going underground) */
  maxPolarAngle?: number;
}
