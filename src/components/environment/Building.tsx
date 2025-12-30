import { memo, useMemo, useEffect } from "react";
import * as THREE from "three";
import { WINDOW_COLOR, ROOF_COLOR } from "@/constants";
import { registerDisposable } from "@/ecs";
import type { BuildingProps } from "@/types";

// Shared materials for all buildings (created once, disposed on HMR)
const windowMaterial = new THREE.MeshStandardMaterial({ color: WINDOW_COLOR });
const roofMaterial = new THREE.MeshStandardMaterial({ color: ROOF_COLOR });

registerDisposable(windowMaterial);
registerDisposable(roofMaterial);

export const Building = memo(function Building({
  position,
  width,
  depth,
  height,
  color,
}: BuildingProps) {
  // Memoize building material per color
  const buildingMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color }),
    [color]
  );

  // Dispose building material on unmount or color change
  useEffect(() => {
    return () => buildingMaterial.dispose();
  }, [buildingMaterial]);

  return (
    <group position={position}>
      {/* Main building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={buildingMaterial} attach="material" />
      </mesh>

      {/* Windows - simple darker rectangles on sides */}
      <mesh position={[width / 2 + 0.01, height / 2, 0]}>
        <planeGeometry args={[0.1, height * 0.9]} />
        <primitive object={windowMaterial} attach="material" />
      </mesh>
      <mesh
        position={[-width / 2 - 0.01, height / 2, 0]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[0.1, height * 0.9]} />
        <primitive object={windowMaterial} attach="material" />
      </mesh>

      {/* Roof detail */}
      <mesh position={[0, height + 0.5, 0]} castShadow>
        <boxGeometry args={[width * 0.8, 1, depth * 0.8]} />
        <primitive object={roofMaterial} attach="material" />
      </mesh>
    </group>
  );
});
