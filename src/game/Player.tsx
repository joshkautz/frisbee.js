import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PLAYER_RADIUS = 0.8;
const PLAYER_HEIGHT = 0.5;

interface PlayerProps {
  position: [number, number, number];
  color: number;
  velocity?: THREE.Vector3;
}

export function Player({ position, color, velocity }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(velocity ?? new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Apply velocity to position
    meshRef.current.position.x += velocityRef.current.x * delta;
    meshRef.current.position.z += velocityRef.current.z * delta;

    // Apply friction
    velocityRef.current.multiplyScalar(0.98);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
