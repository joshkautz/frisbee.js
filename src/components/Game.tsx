import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  FIELD_LENGTH,
  TEAM_HOME_COLOR,
  TEAM_AWAY_COLOR,
  FOG_COLOR,
} from "@/constants";
import { Field, Dome, City, Lighting } from "./environment";
import { Team, Disc } from "./entities";

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
      style={{
        background:
          "linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
      }}
      role="img"
      aria-label="3D Ultimate Frisbee game in an inflatable dome surrounded by a city at night"
    >
      <Lighting />

      <fog attach="fog" args={[FOG_COLOR, 100, 400]} />

      <City />
      <Dome />
      <Field />

      <Team color={TEAM_HOME_COLOR} startZ={-FIELD_LENGTH / 4} />
      <Team color={TEAM_AWAY_COLOR} startZ={FIELD_LENGTH / 4} />

      <Disc position={[0, 1, 0]} />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={40}
        maxDistance={250}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
