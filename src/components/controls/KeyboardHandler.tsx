/**
 * Keyboard input handler for game controls.
 *
 * Uses drei's KeyboardControls for Zustand-powered input management.
 *
 * @module components/controls/KeyboardHandler
 */

import { useEffect, useRef } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useSimulationStore } from "@/stores";

/** Debounce delay for speed controls (ms) */
const SPEED_DEBOUNCE_MS = 150;

/**
 * Handles keyboard input for game controls.
 *
 * Supports:
 * - Space: Toggle pause
 * - Arrow Up/W: Increase simulation speed (debounced)
 * - Arrow Down/S: Decrease simulation speed (debounced)
 */
export function KeyboardHandler() {
  const setIsPaused = useSimulationStore((s) => s.setIsPaused);
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);

  // Get keyboard state via Zustand selector
  const [subscribeKeys] = useKeyboardControls();

  // Track key state for debouncing
  const pausePressedRef = useRef(false);
  const lastSpeedChangeRef = useRef(0);

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
          const now = Date.now();
          // Debounce rapid key presses
          if (now - lastSpeedChangeRef.current < SPEED_DEBOUNCE_MS) return;
          lastSpeedChangeRef.current = now;

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
          const now = Date.now();
          // Debounce rapid key presses
          if (now - lastSpeedChangeRef.current < SPEED_DEBOUNCE_MS) return;
          lastSpeedChangeRef.current = now;

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
