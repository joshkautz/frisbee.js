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
  BODY_RADIUS,
  ARM_RADIUS,
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

/**
 * Horizontal offset of throwing hand from player center.
 * The right arm is positioned at BODY_RADIUS + ARM_RADIUS from the torso center.
 * When facing downfield (+Z), this creates a +X offset for the release point.
 */
const HAND_X_OFFSET = BODY_RADIUS + ARM_RADIUS;

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
  /** Start of the target end zone (Z coordinate) */
  endZoneStart: number;
  /** End of the target end zone (Z coordinate) */
  endZoneEnd: number;
  /**
   * Actual hand position at release time (from handWorldPosition).
   * When provided, the trajectory is calculated from this exact position,
   * ensuring the disc lands precisely on the target.
   */
  handPosition?: { x: number; y: number; z: number };
}

// ============================================================================
// Trajectory Simulation
// ============================================================================

/**
 * Result of trajectory simulation.
 */
interface TrajectoryResult {
  /** X position where disc lands */
  landingX: number;
  /** Z position where disc lands */
  landingZ: number;
  /** Total flight time in seconds */
  flightTime: number;
}

/**
 * Simulate disc trajectory to find landing position.
 *
 * Uses the same physics model as the main disc system:
 * - Gravity pulls the disc down
 * - Lift from spinning disc counters some gravity at high speeds
 * - Air resistance slows horizontal velocity over time
 *
 * @param vx - Initial X velocity (meters/second)
 * @param vy - Initial Y velocity (meters/second)
 * @param vz - Initial Z velocity (meters/second)
 * @param startX - Starting X position (meters)
 * @param startY - Starting Y position (meters)
 * @param startZ - Starting Z position (meters)
 * @returns Landing position (X, Z) and flight time
 */
function simulateTrajectory(
  vx: number,
  vy: number,
  vz: number,
  startX: number,
  startY: number,
  startZ: number
): TrajectoryResult {
  let x = startX;
  let y = startY;
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
    x += velX * SIMULATION_TIMESTEP;
    y += velY * SIMULATION_TIMESTEP;
    z += velZ * SIMULATION_TIMESTEP;

    // Check if disc has landed
    if (y <= DISC_GROUND_LEVEL) {
      return { landingX: x, landingZ: z, flightTime: t };
    }
  }

  // Return final position if max time reached (shouldn't happen normally)
  return { landingX: x, landingZ: z, flightTime: MAX_SIMULATION_TIME };
}

/**
 * Find velocities needed to land at a specific target position.
 *
 * Uses binary search to iteratively refine both X and Z velocities.
 * Simulates the full trajectory for each candidate to ensure accuracy.
 *
 * @param targetX - Desired landing X position (meters)
 * @param targetZ - Desired landing Z position (meters)
 * @param vy - Vertical velocity component (meters/second)
 * @param startX - Starting X position (meters)
 * @param startY - Starting Y position (meters)
 * @param startZ - Starting Z position (meters)
 * @returns Object with vx and vz velocities
 */
function findVelocitiesForTarget(
  targetX: number,
  targetZ: number,
  vy: number,
  startX: number,
  startY: number,
  startZ: number
): { vx: number; vz: number } {
  // Start with rough estimates
  let vx = 0;
  let vz = 20;

  // First, find Z velocity with vx=0 to get approximate flight characteristics
  // Binary search for vz
  let lowVz = 10;
  let highVz = 100;

  for (let iteration = 0; iteration < 20; iteration++) {
    vz = (lowVz + highVz) / 2;
    const result = simulateTrajectory(vx, vy, vz, startX, startY, startZ);

    if (result.landingZ < targetZ) {
      lowVz = vz;
    } else {
      highVz = vz;
    }
  }
  vz = (lowVz + highVz) / 2;

  // Now find X velocity using binary search
  // The X velocity affects flight time slightly (via horizontal speed affecting lift)
  // so we iterate to converge on accurate values
  let lowVx = -30;
  let highVx = 30;

  for (let iteration = 0; iteration < 20; iteration++) {
    vx = (lowVx + highVx) / 2;
    const result = simulateTrajectory(vx, vy, vz, startX, startY, startZ);

    if (result.landingX < targetX) {
      lowVx = vx;
    } else {
      highVx = vx;
    }
  }
  vx = (lowVx + highVx) / 2;

  // Final refinement: re-adjust vz since vx affects lift
  lowVz = vz - 5;
  highVz = vz + 5;

  for (let iteration = 0; iteration < 10; iteration++) {
    vz = (lowVz + highVz) / 2;
    const result = simulateTrajectory(vx, vy, vz, startX, startY, startZ);

    if (result.landingZ < targetZ) {
      lowVz = vz;
    } else {
      highVz = vz;
    }
  }
  vz = (lowVz + highVz) / 2;

  return { vx, vz };
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
  const { endZoneStart, endZoneEnd, handPosition } = config;

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

  // Use actual hand position if provided (exact), otherwise use approximation
  const startX = handPosition?.x ?? HAND_X_OFFSET;
  const startY = handPosition?.y ?? DISC_THROW_HEIGHT;
  const startZ = handPosition?.z ?? -(FIELD_LENGTH / 2 - END_ZONE_DEPTH);

  // Calculate both X and Z velocities using trajectory simulation
  // This ensures the disc lands exactly at the target position
  const { vx, vz } = findVelocitiesForTarget(
    targetX,
    targetZ,
    yVelocity,
    startX,
    startY,
    startZ
  );

  return {
    x: vx,
    y: yVelocity,
    z: vz,
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
 * @param handPosition - Optional actual hand position for exact trajectory calculation
 * @returns Default pull configuration
 */
export function getDefaultPullConfig(handPosition?: {
  x: number;
  y: number;
  z: number;
}): PullConfig {
  const halfLength = FIELD_LENGTH / 2;

  return {
    // Target is the opposing end zone
    endZoneStart: halfLength - END_ZONE_DEPTH,
    endZoneEnd: halfLength,
    // Use actual hand position if provided
    handPosition,
  };
}

/**
 * Execute a pull throw with optional hand position for exact trajectory.
 *
 * @param handPosition - Actual hand position at release time (from handWorldPosition)
 * @returns Pull velocity and target position
 */
export function executePull(handPosition?: {
  x: number;
  y: number;
  z: number;
}): PullVelocity {
  const config = getDefaultPullConfig(handPosition);
  return calculatePullVelocity(config);
}
