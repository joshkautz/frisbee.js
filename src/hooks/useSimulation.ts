/**
 * Simulation loop hook.
 *
 * Manages game initialization, disc physics updates, and the pull throw.
 *
 * @module hooks/useSimulation
 */

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimulationStore } from "@/stores";
import { initializeEntities, clearEntities } from "@/ecs";
import { updateDiscFlight, throwDisc, giveDiscTo } from "@/systems/discSystem";
import {
  FIELD_WIDTH,
  FIELD_LENGTH,
  END_ZONE_DEPTH,
  DISC_GRAVITY,
  AIR_RESISTANCE,
  DISC_LIFT_COEFFICIENT,
  DISC_LIFT_MIN_SPEED,
} from "@/constants";

/** Delay before pull throw in milliseconds */
const PULL_DELAY_MS = 1000;

/** Simulation timestep for trajectory calculation (60fps) */
const SIM_DELTA = 1 / 60;

/** Thrower's Z position (home end zone line) */
const THROWER_Z = -(FIELD_LENGTH / 2 - END_ZONE_DEPTH);

/** Release height of disc */
const RELEASE_HEIGHT = 1.5;

/** Target end zone boundaries */
const END_ZONE_START = FIELD_LENGTH / 2 - END_ZONE_DEPTH;
const END_ZONE_END = FIELD_LENGTH / 2;

/**
 * Simulate disc trajectory and return landing Z position.
 * Uses the same physics formulas as discSystem.ts.
 */
function simulateTrajectory(vx: number, vy: number, vz: number): number {
  let y = RELEASE_HEIGHT;
  let z = THROWER_Z;
  let velX = vx;
  let velY = vy;
  let velZ = vz;

  // Simulate until disc hits ground (max 10 seconds)
  for (let t = 0; t < 10; t += SIM_DELTA) {
    const horizontalSpeed = Math.sqrt(velX * velX + velZ * velZ);

    // Apply gravity and lift
    velY += DISC_GRAVITY * SIM_DELTA;
    if (horizontalSpeed > DISC_LIFT_MIN_SPEED) {
      velY += horizontalSpeed * DISC_LIFT_COEFFICIENT * SIM_DELTA;
    }

    // Apply air resistance
    const dragFactor = Math.pow(AIR_RESISTANCE, SIM_DELTA * 60);
    velX *= dragFactor;
    velZ *= dragFactor;

    // Update position
    y += velY * SIM_DELTA;
    z += velZ * SIM_DELTA;

    if (y <= 0.1) {
      return z;
    }
  }

  return z;
}

/**
 * Find the Z velocity needed to land at a target Z position.
 * Uses binary search for accuracy.
 */
function findVelocityForTarget(
  targetZ: number,
  vy: number,
  vx: number
): number {
  let low = 10;
  let high = 100;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const landingZ = simulateTrajectory(vx, vy, mid);

    if (landingZ < targetZ) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Calculate pull throw velocity to land in the opposing end zone.
 */
function calculatePullVelocity(): { x: number; y: number; z: number } {
  // Random target position in away end zone
  const targetZ =
    END_ZONE_START + Math.random() * (END_ZONE_END - END_ZONE_START);
  const targetX = (Math.random() - 0.5) * FIELD_WIDTH * 0.6;

  // Vertical velocity for nice arc
  const yVelocity = 10 + Math.random() * 5;

  // Small X velocity for curve
  const xVelocity = targetX * 0.05 + (Math.random() - 0.5);

  // Calculate Z velocity needed to reach target
  const zVelocity = findVelocityForTarget(targetZ, yVelocity, xVelocity);

  return { x: xVelocity, y: yVelocity, z: zVelocity };
}

/**
 * Restart the throw - resets entities and throws again.
 */
function restartThrow(setPhase: (phase: "pull" | "playing") => void): void {
  initializeEntities();
  giveDiscTo("home-4");

  setTimeout(() => {
    const velocity = calculatePullVelocity();
    throwDisc(velocity, null);
    setPhase("playing");
  }, 500);
}

// Global type declaration for restart function
declare global {
  interface Window {
    restartThrow?: () => void;
  }
}

/**
 * Hook that manages the simulation loop.
 * Initializes entities, schedules the pull throw, and updates disc physics.
 */
export function useSimulation() {
  const phase = useSimulationStore((s) => s.phase);
  const possession = useSimulationStore((s) => s.possession);
  const isPaused = useSimulationStore((s) => s.isPaused);
  const setPhase = useSimulationStore((s) => s.setPhase);
  const reset = useSimulationStore((s) => s.reset);

  // Initialize entities and schedule throw on mount
  useEffect(() => {
    initializeEntities();
    giveDiscTo("home-4");

    // Expose restart function for UI
    window.restartThrow = () => restartThrow(setPhase);

    // Schedule the pull throw
    const throwTimeout = setTimeout(() => {
      const velocity = calculatePullVelocity();
      throwDisc(velocity, null);
      setPhase("playing");
    }, PULL_DELAY_MS);

    return () => {
      clearTimeout(throwTimeout);
      delete window.restartThrow;
      clearEntities();
      reset();
    };
  }, [setPhase, reset]);

  // Game loop - update disc physics each frame
  useFrame((_, delta) => {
    const state = useSimulationStore.getState();
    if (state.isPaused) return;

    if (state.discInFlight) {
      updateDiscFlight(delta);
    }
  });

  return { phase, possession, isPaused };
}
