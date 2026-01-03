import { memo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail, Float } from "@react-three/drei";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { A11y } from "@react-three/a11y";
import * as THREE from "three";
import { DISC_RADIUS, DISC_HEIGHT, DISC_COLOR } from "@/constants";
import { disc as discQuery, ECS, registerDisposable, type Entity } from "@/ecs";
import { useReducedMotion } from "@/hooks";

// Shared material for disc (created once, disposed on HMR)
const discMaterial = new THREE.MeshStandardMaterial({ color: DISC_COLOR });
registerDisposable(discMaterial);

// Inner component that receives the disc entity (memoized to prevent unnecessary re-renders)
const DiscRenderer = memo(function DiscRenderer({
  entity,
}: {
  entity: Entity;
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 1, 0));
  const spinRef = useRef(0);
  const isCurrentlyFlying = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const discEntity = entity;

  // Store rigid body reference in ECS entity, cleanup on unmount
  useEffect(() => {
    if (rigidBodyRef.current && discEntity?.physicsRef) {
      discEntity.physicsRef.rigidBody = rigidBodyRef.current;
    }
    return () => {
      if (discEntity?.physicsRef) {
        discEntity.physicsRef.rigidBody = null;
      }
    };
  }, [discEntity]);

  useFrame((_, delta) => {
    if (!groupRef.current || !discEntity) return;

    const isFlying = discEntity.disc?.inFlight ?? false;
    const rb = rigidBodyRef.current;

    if (isFlying && rb) {
      // ECS is the authority for disc physics - sync TO Rapier for visual/collision only
      // discSystem.ts handles gravity, air resistance, and position updates
      rb.setTranslation(
        {
          x: discEntity.position.x,
          y: discEntity.position.y,
          z: discEntity.position.z,
        },
        true
      );
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true); // Clear Rapier velocity, ECS handles physics

      // Realistic flying saucer spin (skip if reduced motion preferred)
      if (!prefersReducedMotion && discEntity.velocity) {
        // Fast spin around vertical axis (frisbees spin 5-10 revolutions per second)
        spinRef.current += delta * 40; // ~6 rotations per second

        // Calculate tilt based on velocity direction
        // Disc tilts slightly in the direction of travel
        const vx = discEntity.velocity.x;
        const vz = discEntity.velocity.z;
        const horizontalSpeed = Math.sqrt(vx * vx + vz * vz);

        // Tilt angle - subtle, max ~15 degrees when moving fast
        const maxTilt = 0.26; // ~15 degrees in radians
        const tiltAmount = Math.min(horizontalSpeed / 40, 1) * maxTilt;

        // Calculate tilt direction (perpendicular to velocity for banking effect)
        // Also add slight nose-down pitch based on vertical velocity
        const pitchFromDescent = Math.max(0, -discEntity.velocity.y * 0.02);

        // Apply rotation: spin + tilt
        // The disc mesh is already rotated 90° on X to be flat
        // We apply additional tilt on X (pitch) and Z (roll) based on velocity
        groupRef.current.rotation.set(
          tiltAmount * 0.3 + pitchFromDescent, // Slight forward tilt
          spinRef.current, // Main spin
          (vx / (horizontalSpeed + 0.1)) * tiltAmount * 0.5 // Side bank based on x velocity
        );
      }
    } else if (rb) {
      // When held, move to holder position (kinematic-like behavior)
      targetPosition.current.set(
        discEntity.position.x,
        discEntity.position.y,
        discEntity.position.z
      );

      rb.setTranslation(
        {
          x: targetPosition.current.x,
          y: targetPosition.current.y,
          z: targetPosition.current.z,
        },
        true
      );
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // Reset rotation when held (disc should be flat)
      groupRef.current.rotation.set(0, 0, 0);
      spinRef.current = 0;
    }

    // Store flying state in ref for use in render (avoids duplicate check)
    isCurrentlyFlying.current = isFlying;
  });

  // Use ref value to avoid duplicate state access
  const isFlying = isCurrentlyFlying.current;
  const description = isFlying ? "Frisbee in flight" : "Frisbee held by player";

  const discMesh = (
    <group ref={groupRef}>
      {/* Simple flat cylinder disc */}
      <mesh castShadow>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, 32]} />
        <primitive object={discMaterial} attach="material" />
      </mesh>
    </group>
  );

  // Wrap in physics rigid body
  const physicsDisc = (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[
        discEntity.position.x,
        discEntity.position.y,
        discEntity.position.z,
      ]}
      colliders={false}
      linearDamping={0.1}
      angularDamping={0.5}
      userData={{ type: "disc" }}
      gravityScale={isFlying ? 0.3 : 0} // Reduced gravity for floaty disc flight
    >
      <CylinderCollider
        args={[DISC_HEIGHT / 2, DISC_RADIUS]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {discMesh}
    </RigidBody>
  );

  // Add trail when flying, float when stationary (skip effects if reduced motion)
  if (prefersReducedMotion) {
    // No animated effects for reduced motion
    return (
      <A11y role="content" description={description}>
        {physicsDisc}
      </A11y>
    );
  }

  if (isFlying) {
    return (
      <A11y role="content" description={description}>
        <Trail width={0.5} length={8} color="white" attenuation={(t) => t * t}>
          {physicsDisc}
        </Trail>
      </A11y>
    );
  }

  return (
    <A11y role="content" description={description}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
        {physicsDisc}
      </Float>
    </A11y>
  );
});

// Wrapper component that uses ECS.Entities for automatic subscription
export const Disc = memo(function Disc() {
  return (
    <ECS.Entities in={discQuery}>
      {(entity) => <DiscRenderer key={entity.id} entity={entity} />}
    </ECS.Entities>
  );
});
