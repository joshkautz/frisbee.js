/**
 * Central type definitions for the frisbee.js project.
 *
 * Re-exports all types from specialized modules:
 * - vectors: Vector3Tuple, Vector3Object
 * - game: GamePhase, Team, SimulationState
 * - components: BuildingProps, PlayerProps, TeamProps, etc.
 *
 * @module types
 */

// Vector and position types
export {
  type Vector3Tuple,
  type Vector3Object,
  tupleToObject,
  objectToTuple,
} from "./vectors";

// Game state types
export {
  type GamePhase,
  type Team,
  type PlayerRole,
  type AIState,
  type SimulationState,
  type AttackingDirection,
} from "./game";

// Component prop types
export {
  type BuildingProps,
  type StreetLightProps,
  type PlayerProps,
  type TeamProps,
  type CameraControlsProps,
} from "./components";
