import { DOME_LENGTH, DOME_WIDTH } from "./Field";

export function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />

      {/* Main overhead lights inside dome (stadium lighting) */}
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

      {/* Fill light from sides */}
      <directionalLight position={[-50, 30, 0]} intensity={0.3} />
      <directionalLight position={[50, 30, 0]} intensity={0.3} />

      {/* Hemisphere light for natural color variation */}
      <hemisphereLight args={[0x606080, 0x202020, 0.4]} />

      {/* Subtle moonlight from above for city atmosphere */}
      <directionalLight
        position={[100, 150, 100]}
        intensity={0.2}
        color={0x8888ff}
      />
    </>
  );
}
