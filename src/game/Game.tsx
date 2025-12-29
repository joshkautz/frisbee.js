import { Canvas } from "@react-three/fiber";
import { Field } from "./Field";
import { Team } from "./Team";
import { Disc } from "./Disc";

const FIELD_LENGTH = 100;
const DISC_HEIGHT = 0.1;

export function Game() {
  return (
    <Canvas
      orthographic
      camera={{
        zoom: 10,
        position: [0, 100, 0],
        near: 0.1,
        far: 1000,
      }}
      style={{ background: "#1a1a1a" }}
    >
      {/* Field */}
      <Field />

      {/* Home team (blue) */}
      <Team color={0x3366cc} startX={-FIELD_LENGTH / 4} />

      {/* Away team (red) */}
      <Team color={0xcc3333} startX={FIELD_LENGTH / 4} />

      {/* Disc */}
      <Disc position={[0, DISC_HEIGHT / 2 + 0.5, 0]} />
    </Canvas>
  );
}
