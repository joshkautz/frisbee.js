/**
 * Pull throw system for initiating points of play.
 *
 * The "pull" is the initial throw that starts each point in ultimate frisbee.
 * One team throws the disc to the other team's end zone, similar to a kickoff
 * in football. This system handles:
 *
 * - Calculating a random target position within the receiving team's end zone
 * - Computing the velocity required to land the disc at that target
 * - Simulating the trajectory to verify landing position
 *
 * The pull uses realistic disc physics including gravity, lift, and air resistance.
 *
 * @module systems/pullSystem
 */

import {
  FIELD_WIDTH,
  FIELD_LENGTH,
  END_ZONE_DEPTH,
  DISC_GRAVITY,
  AIR_RESISTANCE,
  DISC_LIFT_COEFFICIENT,
  DISC_LIFT_MIN_SPEED,
  DISC_THROW_HEIGHT,
  DISC_GROUND_LEVEL,
} from "@/constants";

// ============================================================================
// Local Constants
// ============================================================================

/** Simulation timestep for trajectory calculation (60fps equivalent) */
const SIMULATION_TIMESTEP = 1 / 60;

/** Maximum simulation duration in seconds (prevents infinite loops) */
const MAX_SIMULATION_TIME = 10;

/** Padding from field lines for target positions (meters) */
const TARGET_PADDING = 2;

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a pull velocity calculation.
 * Contains the velocity vector and the intended target position.
 */
export interface PullVelocity {
  /** X component of velocity (lateral, meters/second) */
  x: number;
  /** Y component of velocity (vertical, meters/second) */
  y: number;
  /** Z component of velocity (downfield, meters/second) */
  z: number;
  /** Target X position in the end zone (meters) */
  targetX: number;
  /** Target Z position in the end zone (meters) */
  targetZ: number;
}

/**
 * Configuration for a pull throw.
 */
export interface PullConfig {
  /** Z position of the thrower (pulling team's end zone line) */
  throwerZ: number;
  /** Start of the target end zone (Z coordinate) */
  endZoneStart: number;
  /** End of the target end zone (Z coordinate) */
  endZoneEnd: number;
}

// ============================================================================
// Trajectory Simulation
// ============================================================================

/**
 * Simulate disc trajectory to find landing Z position.
 *
 * Uses the same physics model as the main disc system:
 * - Gravity pulls the disc down
 * - Lift from spinning disc counters some gravity at high speeds
 * - Air resistance slows horizontal velocity over time
 *
 * @param vx - Initial X velocity (meters/second)
 * @param vy - Initial Y velocity (meters/second)
 * @param vz - Initial Z velocity (meters/second)
 * @param startZ - Starting Z position (meters)
 * @returns Z position where the disc lands
 */
function simulateTrajectory(
  vx: number,
  vy: number,
  vz: number,
  startZ: number
): number {
  let y = DISC_THROW_HEIGHT;
  let z = startZ;
  let velX = vx;
  let velY = vy;
  let velZ = vz;

  // Simulate until disc hits ground or max time reached
  for (let t = 0; t < MAX_SIMULATION_TIME; t += SIMULATION_TIMESTEP) {
    // Calculate horizontal speed for lift calculation
    const horizontalSpeed = Math.sqrt(velX * velX + velZ * velZ);

    // Apply gravity (always pulls down)
    velY += DISC_GRAVITY * SIMULATION_TIMESTEP;

    // Apply lift - spinning disc generates upward force at higher speeds
    if (horizontalSpeed > DISC_LIFT_MIN_SPEED) {
      velY += horizontalSpeed * DISC_LIFT_COEFFICIENT * SIMULATION_TIMESTEP;
    }

    // Apply air resistance (drag) to horizontal velocity
    const dragFactor = Math.pow(AIR_RESISTANCE, SIMULATION_TIMESTEP * 60);
    velX *= dragFactor;
    velZ *= dragFactor;

    // Update position
    y += velY * SIMULATION_TIMESTEP;
    z += velZ * SIMULATION_TIMESTEP;

    // Check if disc has landed
    if (y <= DISC_GROUND_LEVEL) {
      return z;
    }
  }

  // Return final position if max time reached (shouldn't happen normally)
  return z;
}

/**
 * Find the Z velocity needed to land at a specific target Z position.
 *
 * Uses binary search to iteratively refine the velocity estimate.
 * Simulates the full trajectory for each candidate velocity.
 *
 * @param targetZ - Desired landing Z position (meters)
 * @param vy - Vertical velocity component (meters/second)
 * @param vx - Lateral velocity component (meters/second)
 * @param throwerZ - Starting Z position of thrower (meters)
 * @returns Z velocity that will land the disc at the target
 */
function findVelocityForTargetZ(
  targetZ: number,
  vy: number,
  vx: number,
  throwerZ: number
): number {
  // Binary search bounds (reasonable range for ultimate throws)
  let lowVelocity = 10;
  let highVelocity = 100;

  // 20 iterations gives ~0.0001 precision, more than enough
  for (let iteration = 0; iteration < 20; iteration++) {
    const midVelocity = (lowVelocity + highVelocity) / 2;
    const landingZ = simulateTrajectory(vx, vy, midVelocity, throwerZ);

    if (landingZ < targetZ) {
      // Disc landed short - need more velocity
      lowVelocity = midVelocity;
    } else {
      // Disc landed long - need less velocity
      highVelocity = midVelocity;
    }
  }

  return (lowVelocity + highVelocity) / 2;
}

// ============================================================================
// Pull Calculation
// ============================================================================

/**
 * Calculate the velocity needed for a pull throw to land at a random
 * position within the opposing team's end zone.
 *
 * The pull targets a random position across the FULL end zone:
 * - X: Sideline to sideline (full field width)
 * - Z: Front of end zone to back (full end zone depth)
 *
 * This creates realistic variety in pull placement, forcing the receiving
 * team to adjust their positioning each point.
 *
 * @param config - Pull configuration (thrower position, end zone bounds)
 * @returns Velocity vector and target position for the pull
 *
 * @example
 * ```typescript
 * const pullConfig = getDefaultPullConfig();
 * const pull = calculatePullVelocity(pullConfig);
 *
 * // Set disc target for visualization
 * disc.targetPosition = { x: pull.targetX, y: 0, z: pull.targetZ };
 *
 * // Execute the throw
 * throwDisc({ x: pull.x, y: pull.y, z: pull.z }, null);
 * ```
 */
export function calculatePullVelocity(config: PullConfig): PullVelocity {
  const { throwerZ, endZoneStart, endZoneEnd } = config;

  // Random target position across the FULL end zone
  // Z: anywhere from front line to back line (with padding from lines)
  const targetZ =
    endZoneStart +
    TARGET_PADDING +
    Math.random() * (endZoneEnd - endZoneStart - TARGET_PADDING * 2);

  // X: full field width, sideline to sideline (with padding)
  const targetX = (Math.random() - 0.5) * (FIELD_WIDTH - TARGET_PADDING * 2);

  // Vertical velocity for a nice high arc (10-15 m/s up)
  const yVelocity = 10 + Math.random() * 5;

  // Calculate X velocity needed to reach target X position
  // Estimate flight time based on horizontal distance
  const horizontalDistance = Math.sqrt(
    targetX * targetX + (targetZ - throwerZ) * (targetZ - throwerZ)
  );
  const estimatedFlightTime = horizontalDistance / 25; // rough estimate at ~25 m/s
  const xVelocity = targetX / estimatedFlightTime;

  // Calculate Z velocity needed to reach target Z position
  const zVelocity = findVelocityForTargetZ(
    targetZ,
    yVelocity,
    xVelocity,
    throwerZ
  );

  return {
    x: xVelocity,
    y: yVelocity,
    z: zVelocity,
    targetX,
    targetZ,
  };
}

/**
 * Get the default pull configuration for the home team pulling to the away end zone.
 *
 * Standard ultimate frisbee setup:
 * - Home team pulls from their end zone line (negative Z)
 * - Target is the away team's end zone (positive Z)
 *
 * @returns Default pull configuration
 */
export function getDefaultPullConfig(): PullConfig {
  const halfLength = FIELD_LENGTH / 2;

  return {
    // Thrower stands at their end zone line
    throwerZ: -(halfLength - END_ZONE_DEPTH),
    // Target is the opposing end zone
    endZoneStart: halfLength - END_ZONE_DEPTH,
    endZoneEnd: halfLength,
  };
}

/**
 * Execute a pull throw.
 *
 * Convenience function that combines configuration, calculation,
 * and provides the result in a ready-to-use format.
 *
 * @returns Pull velocity and target position
 */
export function executePull(): PullVelocity {
  const config = getDefaultPullConfig();
  return calculatePullVelocity(config);
}
