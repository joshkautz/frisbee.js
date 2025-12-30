/**
 * Building component with dynamic transparency.
 *
 * Buildings between the camera and dome become transparent to
 * prevent obstructing the game view.
 *
 * @module components/environment/Building
 */

import { memo, useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WINDOW_COLOR, ROOF_COLOR } from "@/constants";
import type { BuildingProps } from "@/types";
import { useBuildingTransparency } from "@/hooks/useBuildingTransparency";

/**
 * Building component with camera-aware transparency.
 *
 * Uses per-instance materials to support independent opacity control.
 * When the building is between the camera and dome, it fades to allow
 * an unobstructed view of the game.
 */
/** Threshold below which we consider a building "transparent" */
const TRANSPARENT_THRESHOLD = 0.99;

export const Building = memo(function Building({
  position,
  width,
  depth,
  height,
  color,
}: BuildingProps) {
  // Get opacity ref (updates each frame in the hook)
  const opacityRef = useBuildingTransparency(position, width, height, depth);

  // Create unique materials per building for opacity control
  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color }),
      window: new THREE.MeshStandardMaterial({ color: WINDOW_COLOR }),
      roof: new THREE.MeshStandardMaterial({ color: ROOF_COLOR }),
    }),
    [color]
  );

  // Refs to update materials in useFrame
  const materialsRef = useRef(materials);
  materialsRef.current = materials;

  // Update material opacity each frame (read from ref for live values)
  useFrame(() => {
    const mats = materialsRef.current;
    const opacity = opacityRef.current;
    const isTransparent = opacity < TRANSPARENT_THRESHOLD;

    // Update all materials with the same opacity
    for (const mat of [mats.body, mats.window, mats.roof]) {
      mat.opacity = opacity;
      // Only trigger needsUpdate when transparent state changes
      if (mat.transparent !== isTransparent) {
        mat.transparent = isTransparent;
        mat.needsUpdate = true;
      }
      mat.depthWrite = !isTransparent;
    }
  });

  // Dispose materials on unmount
  useEffect(() => {
    return () => {
      materials.body.dispose();
      materials.window.dispose();
      materials.roof.dispose();
    };
  }, [materials]);

  return (
    <group position={position}>
      {/* Main building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={materials.body} attach="material" />
      </mesh>

      {/* Windows - simple darker rectangles on sides */}
      <mesh position={[width / 2 + 0.01, height / 2, 0]}>
        <planeGeometry args={[0.1, height * 0.9]} />
        <primitive object={materials.window} attach="material" />
      </mesh>
      <mesh
        position={[-width / 2 - 0.01, height / 2, 0]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[0.1, height * 0.9]} />
        <primitive object={materials.window} attach="material" />
      </mesh>

      {/* Roof detail */}
      <mesh position={[0, height + 0.5, 0]} castShadow>
        <boxGeometry args={[width * 0.8, 1, depth * 0.8]} />
        <primitive object={materials.roof} attach="material" />
      </mesh>
    </group>
  );
});
