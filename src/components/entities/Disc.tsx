import { memo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail, Float } from "@react-three/drei";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { A11y } from "@react-three/a11y";
import * as THREE from "three";
import {
  DISC_RADIUS,
  DISC_HEIGHT,
  DISC_COLOR,
  DISC_RIM_COLOR,
} from "@/constants";
import { disc as discQuery, ECS, registerDisposable, type Entity } from "@/ecs";
import { useReducedMotion } from "@/hooks";

// Shared materials for all discs (created once, disposed on HMR)
const discMaterial = new THREE.MeshStandardMaterial({ color: DISC_COLOR });
const rimMaterial = new THREE.MeshStandardMaterial({ color: DISC_RIM_COLOR });

// Register materials for disposal during HMR cleanup
registerDisposable(discMaterial);
registerDisposable(rimMaterial);

// Inner component that receives the disc entity
function DiscRenderer({ entity }: { entity: Entity }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 1, 0));
  const spinRef = useRef(0);
  const wasFlying = useRef(false);
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
      // When flying, sync ECS position from physics
      const pos = rb.translation();
      discEntity.position.x = pos.x;
      discEntity.position.y = pos.y;
      discEntity.position.z = pos.z;

      // Apply air resistance (drag)
      const vel = rb.linvel();
      const drag = 0.98;
      rb.setLinvel({ x: vel.x * drag, y: vel.y, z: vel.z * drag }, true);

      // Spin while in flight (skip if reduced motion preferred)
      if (!prefersReducedMotion) {
        spinRef.current += delta * 15;
        groupRef.current.rotation.y = spinRef.current;
      }

      // Check if disc hit the ground
      if (pos.y <= 0.2 && wasFlying.current) {
        // Ground contact - stop flight
        discEntity.disc!.inFlight = false;
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
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
    }

    wasFlying.current = isFlying;
  });

  const isFlying = discEntity.disc?.inFlight ?? false;
  const description = isFlying ? "Frisbee in flight" : "Frisbee held by player";

  const discMesh = (
    <group ref={groupRef}>
      {/* Main disc body */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, 32]} />
        <primitive object={discMaterial} attach="material" />
      </mesh>

      {/* Disc rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[DISC_RADIUS - 0.01, 0.015, 8, 32]} />
        <primitive object={rimMaterial} attach="material" />
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
}

// Wrapper component that uses ECS.Entities for automatic subscription
export const Disc = memo(function Disc() {
  return (
    <ECS.Entities in={discQuery}>
      {(entity) => <DiscRenderer key={entity.id} entity={entity} />}
    </ECS.Entities>
  );
});
