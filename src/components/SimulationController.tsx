import { useSimulation } from "@/hooks";

/**
 * Component that runs the simulation loop inside the Canvas.
 * Must be a child of Canvas to access useFrame.
 */
export function SimulationController() {
  useSimulation();
  return null;
}
