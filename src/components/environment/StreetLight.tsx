import { LIGHT_POLE_COLOR, LIGHT_FIXTURE_COLOR, LIGHT_POLE_HEIGHT } from "@/constants";
import type { StreetLightProps } from "@/types";

export function StreetLight({ position }: StreetLightProps) {
  return (
    <group position={position}>
      {/* Light pole */}
      <mesh position={[0, LIGHT_POLE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, LIGHT_POLE_HEIGHT, 8]} />
        <meshStandardMaterial color={LIGHT_POLE_COLOR} />
      </mesh>

      {/* Light fixture */}
      <mesh position={[0, LIGHT_POLE_HEIGHT, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial
          color={LIGHT_FIXTURE_COLOR}
          emissive={LIGHT_FIXTURE_COLOR}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        position={[0, LIGHT_POLE_HEIGHT, 0]}
        intensity={0.3}
        distance={20}
        color={LIGHT_FIXTURE_COLOR}
      />
    </group>
  );
}
