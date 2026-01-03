/**
 * Debug visualization for throw target zones.
 *
 * Shows where the disc is targeting when in flight,
 * and highlights the endzone areas.
 *
 * @module components/debug/ThrowTargetZone
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { disc as discQuery } from "@/ecs";
import { FIELD_LENGTH, FIELD_WIDTH, END_ZONE_DEPTH } from "@/constants/field";

// Shared materials
const targetMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.6,
});

const endzoneMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0.15,
  side: THREE.DoubleSide,
});

const HALF_LENGTH = FIELD_LENGTH / 2;

/**
 * Visualizes the current throw target and endzone areas.
 *
 * Features:
 * - Green marker at disc target position when in flight
 * - Yellow highlighted endzones
 * - Updates in real-time during gameplay
 */
export function ThrowTargetZone() {
  const markerRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!markerRef.current) return;

    const discEntity = discQuery.first;
    if (discEntity?.disc?.inFlight && discEntity.disc.targetPosition) {
      // Show marker at target position
      markerRef.current.visible = true;
      markerRef.current.position.set(
        discEntity.disc.targetPosition.x,
        0.1,
        discEntity.disc.targetPosition.z
      );
    } else {
      // Hide marker when not throwing
      markerRef.current.visible = false;
    }
  });

  return (
    <group>
      {/* Target position marker (green) */}
      <group ref={markerRef} visible={false}>
        {/* Outer ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2, 32]} />
          <primitive object={targetMaterial} attach="material" />
        </mesh>
        {/* Center dot */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 16]} />
          <primitive object={targetMaterial} attach="material" />
        </mesh>
        {/* Vertical line */}
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 4, 8]} />
          <primitive object={targetMaterial} attach="material" />
        </mesh>
      </group>

      {/* Home endzone highlight (positive Z) */}
      <mesh
        position={[0, 0.05, HALF_LENGTH - END_ZONE_DEPTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[FIELD_WIDTH, END_ZONE_DEPTH]} />
        <primitive object={endzoneMaterial} attach="material" />
      </mesh>

      {/* Away endzone highlight (negative Z) */}
      <mesh
        position={[0, 0.05, -HALF_LENGTH + END_ZONE_DEPTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[FIELD_WIDTH, END_ZONE_DEPTH]} />
        <primitive object={endzoneMaterial} attach="material" />
      </mesh>
    </group>
  );
}
