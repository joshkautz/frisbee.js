export function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.4} />

      {/* Main directional light (sun) with shadows */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Fill light from opposite side */}
      <directionalLight position={[-30, 50, -30]} intensity={0.3} />

      {/* Hemisphere light for natural sky/ground coloring */}
      <hemisphereLight args={[0x87ceeb, 0x2d5a27, 0.3]} />
    </>
  );
}
