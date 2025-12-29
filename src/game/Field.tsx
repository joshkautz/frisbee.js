import { Line } from "@react-three/drei";

// Ultimate frisbee field dimensions (in meters)
// Standard field: 100m x 37m with 18m end zones
export const FIELD_LENGTH = 100;
export const FIELD_WIDTH = 37;
export const END_ZONE_DEPTH = 18;
export const GRASS_PADDING = 15; // Extra grass buffer around the field

// Total dome footprint dimensions
export const DOME_LENGTH = FIELD_LENGTH + GRASS_PADDING * 2;
export const DOME_WIDTH = FIELD_WIDTH + GRASS_PADDING * 2;

export function Field() {
  const playingFieldStart = -FIELD_LENGTH / 2 + END_ZONE_DEPTH;
  const playingFieldEnd = FIELD_LENGTH / 2 - END_ZONE_DEPTH;

  // Boundary line points (length along Z, width along X)
  const boundaryPoints: [number, number, number][] = [
    [-FIELD_WIDTH / 2, 0.02, -FIELD_LENGTH / 2],
    [FIELD_WIDTH / 2, 0.02, -FIELD_LENGTH / 2],
    [FIELD_WIDTH / 2, 0.02, FIELD_LENGTH / 2],
    [-FIELD_WIDTH / 2, 0.02, FIELD_LENGTH / 2],
    [-FIELD_WIDTH / 2, 0.02, -FIELD_LENGTH / 2],
  ];

  // Goal line points (horizontal lines across field width)
  const nearGoalPoints: [number, number, number][] = [
    [-FIELD_WIDTH / 2, 0.02, playingFieldStart],
    [FIELD_WIDTH / 2, 0.02, playingFieldStart],
  ];

  const farGoalPoints: [number, number, number][] = [
    [-FIELD_WIDTH / 2, 0.02, playingFieldEnd],
    [FIELD_WIDTH / 2, 0.02, playingFieldEnd],
  ];

  return (
    <group>
      {/* Grass buffer/padding around field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[DOME_WIDTH, DOME_LENGTH]} />
        <meshStandardMaterial color={0x228b22} />
      </mesh>

      {/* Main playing surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_WIDTH, FIELD_LENGTH]} />
        <meshStandardMaterial color={0x2d8a37} />
      </mesh>

      {/* Near end zone (closer to camera) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, -(FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2)]}
        receiveShadow
      >
        <planeGeometry args={[FIELD_WIDTH, END_ZONE_DEPTH]} />
        <meshStandardMaterial color={0x1e6d2b} />
      </mesh>

      {/* Far end zone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[FIELD_WIDTH, END_ZONE_DEPTH]} />
        <meshStandardMaterial color={0x1e6d2b} />
      </mesh>

      {/* Field lines */}
      <Line points={boundaryPoints} color="white" lineWidth={2} />
      <Line points={nearGoalPoints} color="white" lineWidth={2} />
      <Line points={farGoalPoints} color="white" lineWidth={2} />

      {/* Center line (brick mark area) */}
      <Line
        points={[
          [-FIELD_WIDTH / 2, 0.02, 0],
          [FIELD_WIDTH / 2, 0.02, 0],
        ]}
        color="white"
        lineWidth={1}
        dashed
        dashSize={2}
        gapSize={2}
      />
    </group>
  );
}
