/**
 * State management exports.
 *
 * @module stores
 */

export { useSimulationStore } from "./simulationStore";

// Re-export types from central types module for backwards compatibility
export type { SimulationState, GamePhase, Team } from "@/types";
