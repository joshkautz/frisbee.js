/**
 * Simulation controller component.
 *
 * Runs the ECS simulation loop inside the Canvas context.
 *
 * @module components/core/SimulationController
 */

import { useSimulation } from "@/hooks";

/**
 * Component that runs the simulation loop inside the Canvas.
 *
 * Must be a child of Canvas to access useFrame for per-frame updates.
 * Delegates all simulation logic to the useSimulation hook.
 */
export function SimulationController() {
  useSimulation();
  return null;
}
