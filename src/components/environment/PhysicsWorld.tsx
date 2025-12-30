import { memo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import {
  FIELD_LENGTH,
  FIELD_WIDTH,
  END_ZONE_DEPTH,
  DOME_LENGTH,
  DOME_WIDTH,
} from "@/constants";
import { useSimulationStore } from "@/stores";

/**
 * End zone scoring sensor component
 * Detects when the disc enters the end zone
 */
const EndZoneSensor = memo(function EndZoneSensor({
  team,
  position,
}: {
  team: "home" | "away";
  position: [number, number, number];
}) {
  const score = useSimulationStore((s) => s.score);
  const phase = useSimulationStore((s) => s.phase);

  return (
    <RigidBody type="fixed" position={position} sensor>
      <CuboidCollider
        args={[FIELD_WIDTH / 2, 5, END_ZONE_DEPTH / 2]}
        sensor
        onIntersectionEnter={(payload) => {
          // Only score during active play
          if (phase !== "playing") return;

          // Check if it's the disc entering
          const userData = payload.other.rigidBody?.userData as
            | { type?: string }
            | undefined;
          if (userData?.type === "disc") {
            // Home team scores in positive Z end zone, Away in negative Z
            score(team);
          }
        }}
      />
    </RigidBody>
  );
});

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

      {/* End zone scoring sensors */}
      {/* Home team scores at positive Z (away's end zone) */}
      <EndZoneSensor
        team="home"
        position={[0, 2.5, FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2]}
      />

      {/* Away team scores at negative Z (home's end zone) */}
      <EndZoneSensor
        team="away"
        position={[0, 2.5, -(FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2)]}
      />
    </group>
  );
});
