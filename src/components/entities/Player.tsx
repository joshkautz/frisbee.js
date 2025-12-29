import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BODY_HEIGHT,
  BODY_RADIUS,
  HEAD_RADIUS,
  LEG_HEIGHT,
  LEG_RADIUS,
  ARM_LENGTH,
  ARM_RADIUS,
  SKIN_COLOR,
} from "@/constants";
import type { PlayerProps } from "@/types";

export function Player({ position, color, velocity }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(velocity ?? new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Apply velocity to position
    groupRef.current.position.x += velocityRef.current.x * delta;
    groupRef.current.position.z += velocityRef.current.z * delta;

    // Apply friction
    velocityRef.current.multiplyScalar(0.98);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body/Torso */}
      <mesh position={[0, LEG_HEIGHT + BODY_HEIGHT / 2, 0]} castShadow>
        <capsuleGeometry
          args={[BODY_RADIUS, BODY_HEIGHT - BODY_RADIUS * 2, 8, 16]}
        />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Head */}
      <mesh
        position={[0, LEG_HEIGHT + BODY_HEIGHT + HEAD_RADIUS, 0]}
        castShadow
      >
        <sphereGeometry args={[HEAD_RADIUS, 16, 16]} />
        <meshStandardMaterial color={SKIN_COLOR} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-BODY_RADIUS / 2, LEG_HEIGHT / 2, 0]} castShadow>
        <capsuleGeometry args={[LEG_RADIUS, LEG_HEIGHT - LEG_RADIUS * 2, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[BODY_RADIUS / 2, LEG_HEIGHT / 2, 0]} castShadow>
        <capsuleGeometry args={[LEG_RADIUS, LEG_HEIGHT - LEG_RADIUS * 2, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Left Arm */}
      <mesh
        position={[
          -(BODY_RADIUS + ARM_RADIUS),
          LEG_HEIGHT + BODY_HEIGHT - 0.2,
          0,
        ]}
        rotation={[0, 0, Math.PI / 6]}
        castShadow
      >
        <capsuleGeometry args={[ARM_RADIUS, ARM_LENGTH, 4, 8]} />
        <meshStandardMaterial color={SKIN_COLOR} />
      </mesh>

      {/* Right Arm */}
      <mesh
        position={[BODY_RADIUS + ARM_RADIUS, LEG_HEIGHT + BODY_HEIGHT - 0.2, 0]}
        rotation={[0, 0, -Math.PI / 6]}
        castShadow
      >
        <capsuleGeometry args={[ARM_RADIUS, ARM_LENGTH, 4, 8]} />
        <meshStandardMaterial color={SKIN_COLOR} />
      </mesh>
    </group>
  );
}
