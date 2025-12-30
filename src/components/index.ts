/**
 * Component exports.
 *
 * @module components
 */

// Main game component
export * from "./game";

// Core components (to be moved to subfolders in Phase 6)
export { ErrorBoundary } from "./ErrorBoundary";
export { CameraControls } from "./CameraControls";
export { SimulationController } from "./SimulationController";
export { KeyboardHandler } from "./KeyboardHandler";

// Feature modules
export * from "./entities";
export * from "./environment";
export * from "./ui";
export * from "./debug";
