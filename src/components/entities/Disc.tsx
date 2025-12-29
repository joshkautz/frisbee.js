import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DISC_RADIUS, DISC_HEIGHT, DISC_COLOR, DISC_RIM_COLOR } from "@/constants";
import type { DiscProps } from "@/types";

export function Disc({ position }: DiscProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const isFlyingRef = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current || !isFlyingRef.current) return;

    // Apply velocity to position
    groupRef.current.position.x += velocityRef.current.x * delta;
    groupRef.current.position.z += velocityRef.current.z * delta;

    // Spin the disc while flying
    groupRef.current.rotation.y += delta * 15;

    // Apply air resistance
    velocityRef.current.multiplyScalar(0.995);

    // Stop flying if velocity is very low
    if (velocityRef.current.length() < 0.1) {
      isFlyingRef.current = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main disc body */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, 32]} />
        <meshStandardMaterial color={DISC_COLOR} />
      </mesh>

      {/* Disc rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[DISC_RADIUS - 0.01, 0.015, 8, 32]} />
        <meshStandardMaterial color={DISC_RIM_COLOR} />
      </mesh>
    </group>
  );
}
