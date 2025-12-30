/**
 * Main game component containing the 3D canvas and all game systems.
 *
 * Manages the simulation loop, physics, rendering, and UI overlays.
 *
 * @module components/game/Game
 */

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, PerformanceMonitor, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { A11yAnnouncer } from "@react-three/a11y";
import { TEAM_HOME_COLOR, TEAM_AWAY_COLOR, FOG_COLOR } from "@/constants";
import { Field, Dome, City, Lighting, PhysicsWorld } from "../environment";
import { Team, Disc } from "../entities";
import { Scoreboard, MobileControls } from "../ui";
import { CameraControls, KeyboardHandler } from "../controls";
import { SimulationController } from "../core";
import { ScaleReference, DimensionsPanel } from "../debug";
import { useLevaControls } from "./useLevaControls";

/**
 * Loading fallback for Suspense - shown while physics engine initializes.
 */
function PhysicsLoadingFallback() {
  return (
    <mesh position={[0, 5, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4caf50" wireframe />
    </mesh>
  );
}

/**
 * Keyboard control mapping for game controls.
 */
const KEYBOARD_MAP = [
  { name: "pause", keys: ["Space"] },
  { name: "speedUp", keys: ["ArrowUp", "KeyW"] },
  { name: "slowDown", keys: ["ArrowDown", "KeyS"] },
  { name: "resetCamera", keys: ["KeyR"] },
];

/**
 * Main game component.
 *
 * Orchestrates all game systems including:
 * - 3D rendering with React Three Fiber
 * - Physics simulation with Rapier
 * - Post-processing effects
 * - UI overlays and accessibility
 */
export function Game() {
  const { showStats, enableEffects, bloomIntensity, showScaleReference } =
    useLevaControls();

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div style={{ width: "100%", height: "100%" }}>
        {/* UI Overlays */}
        <Scoreboard />
        <MobileControls />
        {showScaleReference && <DimensionsPanel />}

        {/* 3D Canvas */}
        <Canvas
          camera={{
            fov: 50,
            position: [0, 80, 120],
            near: 0.1,
            far: 1000,
          }}
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
          }}
          style={{
            background:
              "linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
          }}
          role="application"
          aria-label="3D Ultimate Frisbee simulation - interactive game view"
        >
          {/* Game Systems */}
          <SimulationController />
          <KeyboardHandler />

          {/* Lighting & Atmosphere */}
          <Lighting />
          <fog attach="fog" args={[FOG_COLOR, 100, 400]} />

          {/* Physics World */}
          <Suspense fallback={<PhysicsLoadingFallback />}>
            <Physics gravity={[0, -9.81, 0]}>
              <PhysicsWorld />
              <Team team="home" color={TEAM_HOME_COLOR} />
              <Team team="away" color={TEAM_AWAY_COLOR} />
              <Disc />
            </Physics>
          </Suspense>

          {/* Static Environment */}
          <City />
          <Dome />
          <Field />

          {/* Camera */}
          <CameraControls />

          {/* Debug Tools */}
          {showScaleReference && <ScaleReference />}

          {/* Post-processing Effects */}
          {enableEffects && (
            <EffectComposer multisampling={0}>
              <SMAA />
              <Bloom
                luminanceThreshold={0.9}
                luminanceSmoothing={0.3}
                intensity={bloomIntensity}
              />
              <Vignette offset={0.3} darkness={0.5} />
            </EffectComposer>
          )}

          {/* Performance Monitoring */}
          <PerformanceMonitor />
          {showStats && <Stats />}
        </Canvas>

        {/* Accessibility Announcer */}
        <A11yAnnouncer />
      </div>
    </KeyboardControls>
  );
}
