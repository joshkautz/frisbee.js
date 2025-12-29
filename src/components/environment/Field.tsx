import { Line } from "@react-three/drei";
import {
  FIELD_LENGTH,
  FIELD_WIDTH,
  END_ZONE_DEPTH,
  DOME_LENGTH,
  DOME_WIDTH,
  GRASS_COLOR,
  FIELD_COLOR,
  END_ZONE_COLOR,
} from "@/constants";

export function Field() {
  const playingFieldStart = -FIELD_LENGTH / 2 + END_ZONE_DEPTH;
  const playingFieldEnd = FIELD_LENGTH / 2 - END_ZONE_DEPTH;

  const boundaryPoints: [number, number, number][] = [
    [-FIELD_WIDTH / 2, 0.02, -FIELD_LENGTH / 2],
    [FIELD_WIDTH / 2, 0.02, -FIELD_LENGTH / 2],
    [FIELD_WIDTH / 2, 0.02, FIELD_LENGTH / 2],
    [-FIELD_WIDTH / 2, 0.02, FIELD_LENGTH / 2],
    [-FIELD_WIDTH / 2, 0.02, -FIELD_LENGTH / 2],
  ];

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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[DOME_WIDTH, DOME_LENGTH]} />
        <meshStandardMaterial color={GRASS_COLOR} />
      </mesh>

      {/* Main playing surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_WIDTH, FIELD_LENGTH]} />
        <meshStandardMaterial color={FIELD_COLOR} />
      </mesh>

      {/* Near end zone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, -(FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2)]}
        receiveShadow
      >
        <planeGeometry args={[FIELD_WIDTH, END_ZONE_DEPTH]} />
        <meshStandardMaterial color={END_ZONE_COLOR} />
      </mesh>

      {/* Far end zone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[FIELD_WIDTH, END_ZONE_DEPTH]} />
        <meshStandardMaterial color={END_ZONE_COLOR} />
      </mesh>

      {/* Field lines */}
      <Line points={boundaryPoints} color="white" lineWidth={2} />
      <Line points={nearGoalPoints} color="white" lineWidth={2} />
      <Line points={farGoalPoints} color="white" lineWidth={2} />

      {/* Center line */}
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
