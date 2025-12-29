import { ROAD_COLOR, SIDEWALK_COLOR, ROAD_LINE_COLOR, SIDEWALK_WIDTH } from "@/constants";
import type { RoadProps } from "@/types";

export function Road({ position, width, length, rotation = 0 }: RoadProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Road surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={ROAD_COLOR} />
      </mesh>

      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.3, length]} />
        <meshStandardMaterial color={ROAD_LINE_COLOR} />
      </mesh>

      {/* Sidewalks */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[width / 2 + SIDEWALK_WIDTH / 2, 0.04, 0]}
        receiveShadow
      >
        <planeGeometry args={[SIDEWALK_WIDTH, length]} />
        <meshStandardMaterial color={SIDEWALK_COLOR} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-width / 2 - SIDEWALK_WIDTH / 2, 0.04, 0]}
        receiveShadow
      >
        <planeGeometry args={[SIDEWALK_WIDTH, length]} />
        <meshStandardMaterial color={SIDEWALK_COLOR} />
      </mesh>
    </group>
  );
}
