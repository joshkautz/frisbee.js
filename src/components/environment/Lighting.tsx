import { DOME_LENGTH, MOONLIGHT_COLOR } from "@/constants";

/**
 * Lighting setup for the dome environment.
 *
 * Optimized for performance:
 * - Only 2 shadow-casting spotlights (reduced from 4)
 * - Additional non-shadow fill lights for even coverage
 * - Lower shadow map resolution for better performance
 */
export function Lighting() {
  return (
    <>
      {/* Ambient light - base illumination */}
      <ambientLight intensity={0.35} />

      {/* Main stadium spotlights - only 2 cast shadows for performance */}
      <spotLight
        position={[0, 24, -DOME_LENGTH / 4]}
        intensity={2.5}
        angle={Math.PI / 3}
        penumbra={0.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      <spotLight
        position={[0, 24, DOME_LENGTH / 4]}
        intensity={2.5}
        angle={Math.PI / 3}
        penumbra={0.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Side fill lights - no shadows, just fill illumination */}
      <spotLight
        position={[-25, 20, 0]}
        intensity={1.2}
        angle={Math.PI / 2.5}
        penumbra={0.8}
      />
      <spotLight
        position={[25, 20, 0]}
        intensity={1.2}
        angle={Math.PI / 2.5}
        penumbra={0.8}
      />

      {/* Fill lights for even coverage */}
      <directionalLight position={[-50, 30, 0]} intensity={0.4} />
      <directionalLight position={[50, 30, 0]} intensity={0.4} />

      {/* Hemisphere light - sky/ground ambient */}
      <hemisphereLight
        color={0x606080}
        groundColor={0x202020}
        intensity={0.5}
      />

      {/* Moonlight - subtle outdoor atmosphere */}
      <directionalLight
        position={[100, 150, 100]}
        intensity={0.2}
        color={MOONLIGHT_COLOR}
      />
    </>
  );
}
