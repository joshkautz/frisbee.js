/**
 * Leva debug controls hook.
 *
 * Provides debug panel controls for simulation parameters
 * and syncs them to the Zustand store.
 *
 * @module components/game/useLevaControls
 */

import { useEffect, useRef } from "react";
import { useControls, folder } from "leva";
import { useSimulationStore } from "@/stores";

/**
 * Return type for useLevaControls hook.
 */
export interface LevaControlValues {
  showStats: boolean;
  enableEffects: boolean;
  bloomIntensity: number;
  showScaleReference: boolean;
  showThrowTargets: boolean;
}

/**
 * Hook for Leva debug panel controls.
 *
 * Provides controls for:
 * - Simulation speed and pause state
 * - Post-processing effects
 * - Debug visualization tools
 *
 * Automatically syncs simulation controls to Zustand store.
 *
 * @returns Control values for rendering decisions
 */
export function useLevaControls(): LevaControlValues {
  const {
    showStats,
    simulationSpeed,
    isPaused,
    enableEffects,
    bloomIntensity,
    showScaleReference,
    showThrowTargets,
  } = useControls({
    Simulation: folder({
      isPaused: {
        value: false,
        label: "Paused",
      },
      simulationSpeed: {
        value: 1,
        min: 0.25,
        max: 4,
        step: 0.25,
        label: "Speed",
      },
      showStats: {
        value: false,
        label: "Show FPS",
      },
    }),
    Effects: folder({
      enableEffects: {
        value: true,
        label: "Enable",
      },
      bloomIntensity: {
        value: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
        label: "Bloom",
      },
    }),
    Debug: folder({
      showScaleReference: {
        value: false,
        label: "Scale Reference",
      },
      showThrowTargets: {
        value: false,
        label: "Throw Targets",
      },
    }),
  });

  // Sync leva controls to zustand store
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);
  const setIsPaused = useSimulationStore((s) => s.setIsPaused);

  // Track previous values to avoid unnecessary store updates
  const prevSpeedRef = useRef(simulationSpeed);
  const prevPausedRef = useRef(isPaused);

  useEffect(() => {
    if (prevSpeedRef.current !== simulationSpeed) {
      setSimulationSpeed(simulationSpeed);
      prevSpeedRef.current = simulationSpeed;
    }
  }, [simulationSpeed, setSimulationSpeed]);

  useEffect(() => {
    if (prevPausedRef.current !== isPaused) {
      setIsPaused(isPaused);
      prevPausedRef.current = isPaused;
    }
  }, [isPaused, setIsPaused]);

  return {
    showStats,
    enableEffects,
    bloomIntensity,
    showScaleReference,
    showThrowTargets,
  };
}
