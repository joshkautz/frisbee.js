import { Line } from "@react-three/drei";
import * as THREE from "three";

// Ultimate frisbee field dimensions (in meters)
// Standard field: 100m x 37m with 18m end zones
const FIELD_LENGTH = 100;
const FIELD_WIDTH = 37;
const END_ZONE_DEPTH = 18;

export function Field() {
  const playingFieldStart = -FIELD_LENGTH / 2 + END_ZONE_DEPTH;
  const playingFieldEnd = FIELD_LENGTH / 2 - END_ZONE_DEPTH;

  // Boundary line points
  const boundaryPoints: [number, number, number][] = [
    [-FIELD_LENGTH / 2, 0.02, -FIELD_WIDTH / 2],
    [FIELD_LENGTH / 2, 0.02, -FIELD_WIDTH / 2],
    [FIELD_LENGTH / 2, 0.02, FIELD_WIDTH / 2],
    [-FIELD_LENGTH / 2, 0.02, FIELD_WIDTH / 2],
    [-FIELD_LENGTH / 2, 0.02, -FIELD_WIDTH / 2],
  ];

  // Goal line points
  const leftGoalPoints: [number, number, number][] = [
    [playingFieldStart, 0.02, -FIELD_WIDTH / 2],
    [playingFieldStart, 0.02, FIELD_WIDTH / 2],
  ];

  const rightGoalPoints: [number, number, number][] = [
    [playingFieldEnd, 0.02, -FIELD_WIDTH / 2],
    [playingFieldEnd, 0.02, FIELD_WIDTH / 2],
  ];

  return (
    <group>
      {/* Main playing surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FIELD_LENGTH, FIELD_WIDTH]} />
        <meshBasicMaterial color={0x2d5a27} side={THREE.DoubleSide} />
      </mesh>

      {/* Left end zone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-(FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2), 0.01, 0]}
      >
        <planeGeometry args={[END_ZONE_DEPTH, FIELD_WIDTH]} />
        <meshBasicMaterial color={0x1e4d2b} side={THREE.DoubleSide} />
      </mesh>

      {/* Right end zone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2, 0.01, 0]}
      >
        <planeGeometry args={[END_ZONE_DEPTH, FIELD_WIDTH]} />
        <meshBasicMaterial color={0x1e4d2b} side={THREE.DoubleSide} />
      </mesh>

      {/* Field lines */}
      <Line points={boundaryPoints} color="white" lineWidth={2} />
      <Line points={leftGoalPoints} color="white" lineWidth={2} />
      <Line points={rightGoalPoints} color="white" lineWidth={2} />
    </group>
  );
}
