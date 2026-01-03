import { memo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { DOME_LENGTH, DOME_WIDTH } from "@/constants";

/**
 * Physics world setup with ground plane, boundaries, and scoring sensors
 */
export const PhysicsWorld = memo(function PhysicsWorld() {
  const halfLength = DOME_LENGTH / 2;
  const halfWidth = DOME_WIDTH / 2;

  return (
    <group>
      {/* Ground plane - static rigid body */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <CuboidCollider args={[halfWidth, 0.5, halfLength]} />
      </RigidBody>

      {/* Boundary walls (invisible) - keep disc in play */}
      {/* North wall */}
      <RigidBody type="fixed" position={[0, 5, halfLength]}>
        <CuboidCollider args={[halfWidth, 5, 1]} />
      </RigidBody>

      {/* South wall */}
      <RigidBody type="fixed" position={[0, 5, -halfLength]}>
        <CuboidCollider args={[halfWidth, 5, 1]} />
      </RigidBody>

      {/* East wall */}
      <RigidBody type="fixed" position={[halfWidth, 5, 0]}>
        <CuboidCollider args={[1, 5, halfLength]} />
      </RigidBody>

      {/* West wall */}
      <RigidBody type="fixed" position={[-halfWidth, 5, 0]}>
        <CuboidCollider args={[1, 5, halfLength]} />
      </RigidBody>

      {/*
        End zone scoring sensors - DISABLED
        These incorrectly triggered scoring when disc entered end zone airspace.
        In ultimate frisbee, scoring requires catching the disc in the end zone.
        Scoring is now handled by checkScoring() in discSystem.ts after catches.
      */}
    </group>
  );
});
