/**
 * Camera shake hook for game impact effects.
 *
 * Provides a Zustand-based shake control that can be triggered
 * from anywhere in the app (e.g., on score, catch, turnover).
 *
 * @module hooks/useCameraShake
 */

import { create } from "zustand";

/**
 * Shake intensity presets for different game events.
 */
export const SHAKE_PRESETS = {
  /** Light shake for catches */
  catch: { intensity: 0.2, duration: 150 },
  /** Medium shake for turnovers */
  turnover: { intensity: 0.4, duration: 200 },
  /** Strong shake for scores */
  score: { intensity: 0.8, duration: 400 },
} as const;

export type ShakePreset = keyof typeof SHAKE_PRESETS;

interface CameraShakeState {
  /** Current shake intensity (0-1) */
  intensity: number;
  /** Whether shake is active */
  isShaking: boolean;
  /** Trigger a shake with preset */
  shake: (preset: ShakePreset) => void;
  /** Trigger a custom shake */
  shakeCustom: (intensity: number, duration: number) => void;
  /** Reset shake to idle */
  reset: () => void;
}

/**
 * Zustand store for camera shake state.
 * Can be used from any component to trigger shakes.
 * Timeout is encapsulated within the store factory to prevent global state issues.
 */
export const useCameraShake = create<CameraShakeState>(() => {
  // Encapsulated timeout - scoped to this store instance
  let shakeTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    intensity: 0,
    isShaking: false,

    shake: (preset) => {
      const { intensity, duration } = SHAKE_PRESETS[preset];

      // Clear any existing timeout
      if (shakeTimeout) {
        clearTimeout(shakeTimeout);
      }

      // Start shake
      useCameraShake.setState({ intensity, isShaking: true });

      // End shake after duration
      shakeTimeout = setTimeout(() => {
        useCameraShake.setState({ intensity: 0, isShaking: false });
        shakeTimeout = null;
      }, duration);
    },

    shakeCustom: (intensity, duration) => {
      if (shakeTimeout) {
        clearTimeout(shakeTimeout);
      }

      useCameraShake.setState({ intensity, isShaking: true });

      shakeTimeout = setTimeout(() => {
        useCameraShake.setState({ intensity: 0, isShaking: false });
        shakeTimeout = null;
      }, duration);
    },

    reset: () => {
      if (shakeTimeout) {
        clearTimeout(shakeTimeout);
        shakeTimeout = null;
      }
      useCameraShake.setState({ intensity: 0, isShaking: false });
    },
  };
});
