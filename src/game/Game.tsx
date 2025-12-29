import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Field, FIELD_LENGTH } from "./Field";
import { Team } from "./Team";
import { Disc } from "./Disc";
import { Lighting } from "./Lighting";
import { Dome } from "./Dome";
import { City } from "./City";

export function Game() {
  return (
    <Canvas
      camera={{
        fov: 50,
        position: [0, 80, 120],
        near: 0.1,
        far: 1000,
      }}
      shadows
      style={{ background: "linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)" }}
      role="img"
      aria-label="3D Ultimate Frisbee game in an inflatable dome surrounded by a city at night"
    >
      {/* Lighting */}
      <Lighting />

      {/* Sky/fog for atmosphere */}
      <fog attach="fog" args={[0x1a1a2e, 100, 400]} />

      {/* City environment (buildings, roads, streets) */}
      <City />

      {/* Inflatable dome over the field */}
      <Dome />

      {/* Field with grass buffer */}
      <Field />

      {/* Home team (blue) - positioned in their half */}
      <Team color={0x3366cc} startZ={-FIELD_LENGTH / 4} />

      {/* Away team (red) - positioned in their half */}
      <Team color={0xcc3333} startZ={FIELD_LENGTH / 4} />

      {/* Disc */}
      <Disc position={[0, 1, 0]} />

      {/* Camera controls for user interaction */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={40}
        maxDistance={250}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
