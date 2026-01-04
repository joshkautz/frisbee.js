/**
 * Main game component containing the 3D canvas and all game systems.
 *
 * Manages the simulation loop, physics, rendering, and UI overlays.
 *
 * @module components/game/Game
 */

import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, PerformanceMonitor, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { A11yAnnouncer } from "@react-three/a11y";
import { TEAM_HOME_COLOR, TEAM_AWAY_COLOR, FOG_COLOR } from "@/constants";
import { Field, Dome, City, Lighting, PhysicsWorld } from "../environment";
import { Team, Disc } from "../entities";
import { Scoreboard, GameAnnouncer, HelpOverlay, GameOverlay } from "../ui";
import { CameraControls, KeyboardHandler } from "../controls";
import { SimulationController } from "../core";
import { ScaleReference, DimensionsPanel, ThrowTargetZone } from "../debug";
import { useLevaControls } from "./useLevaControls";
import { AdaptiveEffects, type QualityLevel } from "./AdaptiveEffects";

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
  { name: "speedUp", keys: ["Equal", "NumpadAdd"] }, // + key
  { name: "slowDown", keys: ["Minus", "NumpadSubtract"] }, // - key
  { name: "resetCamera", keys: ["KeyR"] },
];

/**
 * Main game component.
 *
 * Orchestrates all game systems including:
 * - 3D rendering with React Three Fiber
 * - Physics simulation with Rapier
 * - Post-processing effects (with adaptive quality)
 * - UI overlays and accessibility
 */
export function Game() {
  const {
    showStats,
    enableEffects,
    bloomIntensity,
    showScaleReference,
    showThrowTargets,
  } = useLevaControls();

  // Adaptive quality based on performance monitoring
  const [quality, setQuality] = useState<QualityLevel>("high");

  // Callbacks for PerformanceMonitor
  const handleIncline = useCallback(() => {
    // Performance is good - increase quality
    setQuality((prev) => (prev === "low" ? "medium" : "high"));
  }, []);

  const handleDecline = useCallback(() => {
    // Performance is dropping - reduce quality
    setQuality((prev) => (prev === "high" ? "medium" : "low"));
  }, []);

  // Adaptive DPR based on quality level
  const dpr: [number, number] =
    quality === "high" ? [1, 2] : quality === "medium" ? [1, 1.5] : [0.75, 1];

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div style={{ width: "100%", height: "100%" }}>
        {/* UI Overlays */}
        <Scoreboard />
        <GameAnnouncer />
        <HelpOverlay />
        <GameOverlay />
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
          dpr={dpr}
          gl={{
            antialias: quality !== "low",
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
          {showThrowTargets && <ThrowTargetZone />}

          {/* Post-processing Effects (adaptive quality) */}
          <AdaptiveEffects
            quality={quality}
            enabled={enableEffects}
            bloomIntensity={bloomIntensity}
          />

          {/* Performance Monitoring with adaptive callbacks */}
          <PerformanceMonitor
            onIncline={handleIncline}
            onDecline={handleDecline}
            flipflops={3}
            factor={1}
          />
          {showStats && <Stats />}
        </Canvas>

        {/* Accessibility Announcer */}
        <A11yAnnouncer />
      </div>
    </KeyboardControls>
  );
}
