/**
 * Player component - renders a humanoid player model.
 *
 * Features smooth interpolation, accessibility support,
 * and team-colored jerseys.
 *
 * @module components/entities/Player
 */

import { useRef, useMemo, useEffect, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { A11y } from "@react-three/a11y";
import * as THREE from "three";
import { damp3, dampAngle } from "maath/easing";
import { useReducedMotion } from "@/hooks";
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
import { getStandardMaterial, createUniqueMaterial } from "@/utils";
import type { PlayerProps } from "@/types";

// Shared skin material for all players (cached globally)
const skinMaterial = getStandardMaterial("playerSkin", { color: SKIN_COLOR });

export const Player = memo(function Player({ entity, color }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3());
  const prefersReducedMotion = useReducedMotion();

  // Create jersey material per color (unique per instance)
  const jerseyMaterial = useMemo(
    () => createUniqueMaterial(THREE.MeshStandardMaterial, { color }),
    [color]
  );

  // Dispose jersey material on unmount or color change
  useEffect(() => {
    return () => jerseyMaterial.dispose();
  }, [jerseyMaterial]);

  // Store mesh ref in entity
  useEffect(() => {
    if (groupRef.current && entity.meshRef) {
      entity.meshRef.mesh = groupRef.current;
    }
  }, [entity]);

  // Interpolation to ECS position - respects reduced motion preference
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Update target from ECS
    targetPosition.current.set(
      entity.position.x,
      entity.position.y,
      entity.position.z
    );

    if (prefersReducedMotion) {
      // Instant position update for reduced motion
      groupRef.current.position.copy(targetPosition.current);

      // Instant rotation update
      if (
        entity.velocity &&
        (Math.abs(entity.velocity.x) > 0.1 || Math.abs(entity.velocity.z) > 0.1)
      ) {
        groupRef.current.rotation.y = Math.atan2(
          entity.velocity.x,
          entity.velocity.z
        );
      }
    } else {
      // Smooth damp to target position (better than lerp - physics-based)
      damp3(
        groupRef.current.position,
        targetPosition.current,
        0.15, // smoothTime - lower = faster response
        delta
      );

      // Rotate to face movement direction with smooth damping
      if (
        entity.velocity &&
        (Math.abs(entity.velocity.x) > 0.1 || Math.abs(entity.velocity.z) > 0.1)
      ) {
        const targetAngle = Math.atan2(entity.velocity.x, entity.velocity.z);
        dampAngle(groupRef.current.rotation, "y", targetAngle, 0.1, delta);
      }
    }
  });

  // Build accessible description
  const teamName = entity.player?.team === "home" ? "Home" : "Away";
  const playerNumber = entity.player?.number ?? 0;
  const role = entity.player?.role ?? "player";
  const hasDisc = entity.player?.hasDisc ? ", holding the disc" : "";
  const description = `${teamName} team ${role} number ${playerNumber}${hasDisc}`;

  return (
    <A11y role="content" description={description}>
      <group
        ref={groupRef}
        position={[entity.position.x, entity.position.y, entity.position.z]}
      >
        {/* Body/Torso */}
        <mesh position={[0, LEG_HEIGHT + BODY_HEIGHT / 2, 0]} castShadow>
          <capsuleGeometry
            args={[BODY_RADIUS, BODY_HEIGHT - BODY_RADIUS * 2, 8, 16]}
          />
          <primitive object={jerseyMaterial} attach="material" />
        </mesh>

        {/* Head */}
        <mesh
          position={[0, LEG_HEIGHT + BODY_HEIGHT + HEAD_RADIUS, 0]}
          castShadow
        >
          <sphereGeometry args={[HEAD_RADIUS, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Left Leg */}
        <mesh position={[-BODY_RADIUS / 2, LEG_HEIGHT / 2, 0]} castShadow>
          <capsuleGeometry
            args={[LEG_RADIUS, LEG_HEIGHT - LEG_RADIUS * 2, 4, 8]}
          />
          <primitive object={jerseyMaterial} attach="material" />
        </mesh>

        {/* Right Leg */}
        <mesh position={[BODY_RADIUS / 2, LEG_HEIGHT / 2, 0]} castShadow>
          <capsuleGeometry
            args={[LEG_RADIUS, LEG_HEIGHT - LEG_RADIUS * 2, 4, 8]}
          />
          <primitive object={jerseyMaterial} attach="material" />
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
          <primitive object={skinMaterial} attach="material" />
        </mesh>

        {/* Right Arm */}
        <mesh
          position={[
            BODY_RADIUS + ARM_RADIUS,
            LEG_HEIGHT + BODY_HEIGHT - 0.2,
            0,
          ]}
          rotation={[0, 0, -Math.PI / 6]}
          castShadow
        >
          <capsuleGeometry args={[ARM_RADIUS, ARM_LENGTH, 4, 8]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>
    </A11y>
  );
});
