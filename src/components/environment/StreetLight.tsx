import { memo } from "react";
import * as THREE from "three";
import {
  LIGHT_POLE_COLOR,
  LIGHT_FIXTURE_COLOR,
  LIGHT_POLE_HEIGHT,
} from "@/constants";
import { registerDisposable } from "@/ecs";
import type { StreetLightProps } from "@/types";

// Shared materials for all street lights (created once, disposed on HMR)
const poleMaterial = new THREE.MeshStandardMaterial({
  color: LIGHT_POLE_COLOR,
});
const fixtureMaterial = new THREE.MeshStandardMaterial({
  color: LIGHT_FIXTURE_COLOR,
  emissive: LIGHT_FIXTURE_COLOR,
  emissiveIntensity: 1.0, // Brighter emissive to compensate for removed point light
});

registerDisposable(poleMaterial);
registerDisposable(fixtureMaterial);

export const StreetLight = memo(function StreetLight({
  position,
}: StreetLightProps) {
  return (
    <group position={position}>
      {/* Light pole */}
      <mesh position={[0, LIGHT_POLE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, LIGHT_POLE_HEIGHT, 8]} />
        <primitive object={poleMaterial} attach="material" />
      </mesh>

      {/* Light fixture - uses emissive material for glow effect */}
      <mesh position={[0, LIGHT_POLE_HEIGHT, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <primitive object={fixtureMaterial} attach="material" />
      </mesh>
    </group>
  );
});
