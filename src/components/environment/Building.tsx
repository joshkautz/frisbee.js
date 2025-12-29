import { WINDOW_COLOR, ROOF_COLOR } from "@/constants";
import type { BuildingProps } from "@/types";

export function Building({ position, width, depth, height, color }: BuildingProps) {
  return (
    <group position={position}>
      {/* Main building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Windows - simple darker rectangles on sides */}
      <mesh position={[width / 2 + 0.01, height / 2, 0]}>
        <planeGeometry args={[0.1, height * 0.9]} />
        <meshStandardMaterial color={WINDOW_COLOR} />
      </mesh>
      <mesh
        position={[-width / 2 - 0.01, height / 2, 0]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[0.1, height * 0.9]} />
        <meshStandardMaterial color={WINDOW_COLOR} />
      </mesh>

      {/* Roof detail */}
      <mesh position={[0, height + 0.5, 0]} castShadow>
        <boxGeometry args={[width * 0.8, 1, depth * 0.8]} />
        <meshStandardMaterial color={ROOF_COLOR} />
      </mesh>
    </group>
  );
}
