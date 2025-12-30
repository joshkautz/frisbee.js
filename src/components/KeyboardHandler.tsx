import { useEffect, useRef } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useSimulationStore } from "@/stores";

/**
 * Handles keyboard input for game controls.
 * Uses drei's KeyboardControls for Zustand-powered input management.
 */
export function KeyboardHandler() {
  const setIsPaused = useSimulationStore((s) => s.setIsPaused);
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);

  // Get keyboard state via Zustand selector
  const [subscribeKeys] = useKeyboardControls();

  // Track key state for debouncing
  const pausePressedRef = useRef(false);

  useEffect(() => {
    // Subscribe to key changes
    const unsubscribePause = subscribeKeys(
      (state) => state.pause,
      (pressed) => {
        // Toggle pause on key press (not release)
        if (pressed && !pausePressedRef.current) {
          const currentPaused = useSimulationStore.getState().isPaused;
          setIsPaused(!currentPaused);
        }
        pausePressedRef.current = pressed;
      }
    );

    const unsubscribeSpeedUp = subscribeKeys(
      (state) => state.speedUp,
      (pressed) => {
        if (pressed) {
          const currentSpeed = useSimulationStore.getState().simulationSpeed;
          const newSpeed = Math.min(currentSpeed + 0.25, 4);
          setSimulationSpeed(newSpeed);
        }
      }
    );

    const unsubscribeSlowDown = subscribeKeys(
      (state) => state.slowDown,
      (pressed) => {
        if (pressed) {
          const currentSpeed = useSimulationStore.getState().simulationSpeed;
          const newSpeed = Math.max(currentSpeed - 0.25, 0.25);
          setSimulationSpeed(newSpeed);
        }
      }
    );

    return () => {
      unsubscribePause();
      unsubscribeSpeedUp();
      unsubscribeSlowDown();
    };
  }, [subscribeKeys, setIsPaused, setSimulationSpeed]);

  return null;
}
