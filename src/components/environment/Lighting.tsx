import { DOME_LENGTH, DOME_WIDTH, MOONLIGHT_COLOR } from "@/constants";

export function Lighting() {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.3} />

      {/* Stadium lights inside dome */}
      <spotLight
        position={[0, 24, -DOME_LENGTH / 4]}
        intensity={2}
        angle={Math.PI / 3}
        penumbra={0.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[0, 24, DOME_LENGTH / 4]}
        intensity={2}
        angle={Math.PI / 3}
        penumbra={0.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[-DOME_WIDTH / 3, 24, 0]}
        intensity={1.5}
        angle={Math.PI / 3}
        penumbra={0.5}
        castShadow
      />
      <spotLight
        position={[DOME_WIDTH / 3, 24, 0]}
        intensity={1.5}
        angle={Math.PI / 3}
        penumbra={0.5}
        castShadow
      />

      {/* Fill lights */}
      <directionalLight position={[-50, 30, 0]} intensity={0.3} />
      <directionalLight position={[50, 30, 0]} intensity={0.3} />

      {/* Hemisphere light */}
      <hemisphereLight args={[0x606080, 0x202020, 0.4]} />

      {/* Moonlight */}
      <directionalLight
        position={[100, 150, 100]}
        intensity={0.2}
        color={MOONLIGHT_COLOR}
      />
    </>
  );
}
