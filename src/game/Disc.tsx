import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DISC_RADIUS = 0.5;
const DISC_HEIGHT = 0.1;

interface DiscProps {
  position: [number, number, number];
}

export function Disc({ position }: DiscProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const isFlyingRef = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current || !isFlyingRef.current) return;

    // Apply velocity to position
    meshRef.current.position.x += velocityRef.current.x * delta;
    meshRef.current.position.z += velocityRef.current.z * delta;

    // Apply air resistance
    velocityRef.current.multiplyScalar(0.995);

    // Stop flying if velocity is very low
    if (velocityRef.current.length() < 0.1) {
      isFlyingRef.current = false;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, 32]} />
      <meshBasicMaterial color={0xffffff} />
    </mesh>
  );
}
