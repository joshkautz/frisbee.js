import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Field } from "./Field";
import { Team } from "./Team";
import { Disc } from "./Disc";
import { Lighting } from "./Lighting";

const FIELD_LENGTH = 100;

export function Game() {
  return (
    <Canvas
      camera={{
        fov: 45,
        position: [0, 60, 80],
        near: 0.1,
        far: 500,
      }}
      shadows
      style={{ background: "#87CEEB" }}
      role="img"
      aria-label="3D Ultimate Frisbee game field with two teams of 7 players each"
    >
      {/* Lighting */}
      <Lighting />

      {/* Field - rotated so length runs along Z axis (into the screen) */}
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
        minDistance={30}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
