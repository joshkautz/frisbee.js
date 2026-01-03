/**
 * Adaptive post-processing effects component.
 *
 * Applies different levels of post-processing based on
 * the current quality setting for optimal performance.
 *
 * @module components/game/AdaptiveEffects
 */

import { memo } from "react";
import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";

/** Performance quality levels */
export type QualityLevel = "high" | "medium" | "low";

interface AdaptiveEffectsProps {
  /** Current quality level */
  quality: QualityLevel;
  /** Whether effects are enabled */
  enabled: boolean;
  /** Bloom intensity (0-1) */
  bloomIntensity: number;
}

/**
 * Adaptive post-processing effects.
 *
 * Quality levels:
 * - High: SMAA + Bloom + Vignette (8x multisampling)
 * - Medium: Bloom + Vignette (4x multisampling)
 * - Low: Bloom only (no multisampling)
 */
export const AdaptiveEffects = memo(function AdaptiveEffects({
  quality,
  enabled,
  bloomIntensity,
}: AdaptiveEffectsProps) {
  if (!enabled) {
    return null;
  }

  if (quality === "high") {
    return (
      <EffectComposer multisampling={8}>
        <SMAA />
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.3}
          intensity={bloomIntensity}
        />
        <Vignette offset={0.3} darkness={0.5} />
      </EffectComposer>
    );
  }

  if (quality === "medium") {
    return (
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.3}
          intensity={bloomIntensity}
        />
        <Vignette offset={0.3} darkness={0.5} />
      </EffectComposer>
    );
  }

  // Low quality
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.95}
        luminanceSmoothing={0.4}
        intensity={bloomIntensity * 0.7}
      />
    </EffectComposer>
  );
});
