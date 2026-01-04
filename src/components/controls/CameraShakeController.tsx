/**
 * Camera shake controller component.
 *
 * Uses drei's CameraShake with intensity controlled by game events.
 * Subscribes to the useCameraShake store for reactive intensity changes.
 *
 * NOTE: This component is currently NOT USED because drei's CameraShake
 * conflicts with OrbitControls (both try to control the camera). The shake
 * events are still triggered in simulationStore.ts but have no visible effect.
 * To enable camera shake, either:
 * 1. Replace OrbitControls with manual camera controls
 * 2. Implement custom shake logic that works with OrbitControls
 *
 * @module components/controls/CameraShakeController
 */

import { useRef, useEffect, memo, type ComponentRef } from "react";
import { CameraShake } from "@react-three/drei";
import { useCameraShake } from "@/hooks";
import { useReducedMotion } from "@/hooks";

/**
 * Camera shake controller that responds to game events.
 *
 * Integrates with useCameraShake store to provide impact feedback for:
 * - Catches: Light shake
 * - Turnovers: Medium shake
 * - Scores: Strong shake
 *
 * Respects reduced motion preferences for accessibility.
 */
export const CameraShakeController = memo(function CameraShakeController() {
  const shakeRef = useRef<ComponentRef<typeof CameraShake>>(null);
  const intensity = useCameraShake((s) => s.intensity);
  const isShaking = useCameraShake((s) => s.isShaking);
  const prefersReducedMotion = useReducedMotion();

  // Update shake intensity when it changes
  useEffect(() => {
    if (shakeRef.current && !prefersReducedMotion) {
      // CameraShake uses setIntensity method
      shakeRef.current.setIntensity(isShaking ? intensity : 0);
    }
  }, [intensity, isShaking, prefersReducedMotion]);

  // Don't render shake for users who prefer reduced motion
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <CameraShake
      ref={shakeRef}
      maxYaw={0.02}
      maxPitch={0.02}
      maxRoll={0.02}
      yawFrequency={8}
      pitchFrequency={8}
      rollFrequency={8}
      intensity={0}
      decay
      decayRate={0.5}
    />
  );
});
