/**
 * Disc landing indicator component.
 *
 * Shows a transparent disc-shaped marker on the ground where the disc
 * is predicted to land during flight.
 *
 * @module components/ui/DiscLandingIndicator
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { disc } from "@/ecs";
import { DISC_RADIUS } from "@/constants";

/** Semi-transparent material for landing indicator */
const indicatorMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});

/**
 * Renders a transparent disc on the ground at the predicted landing position.
 *
 * Only visible when the disc is in flight and has a target position.
 * Uses useFrame for efficient per-frame updates without React re-renders.
 */
export function DiscLandingIndicator() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;

    const discEntity = disc.first;

    // Show indicator only when disc is in flight with a target
    if (discEntity?.disc?.inFlight && discEntity.disc.targetPosition) {
      meshRef.current.visible = true;
      meshRef.current.position.set(
        discEntity.disc.targetPosition.x,
        0.01, // Just above ground to prevent z-fighting
        discEntity.disc.targetPosition.z
      );
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <circleGeometry args={[DISC_RADIUS, 32]} />
      <primitive object={indicatorMaterial} attach="material" />
    </mesh>
  );
}
