/**
 * Gameplay constants for simulation and physics.
 *
 * @module constants/gameplay
 */

// ============================================================================
// Player Movement
// ============================================================================

/** Base player movement speed (meters per second) */
export const PLAYER_SPEED = 8;

/** Player speed when cutting (meters per second) */
export const CUTTING_SPEED = 10;

// ============================================================================
// AI Decision Making
// ============================================================================

/** Maximum distance for throws (meters) */
export const THROW_RANGE = 25;

/** Time between AI decisions (seconds) */
export const DECISION_INTERVAL = 0.5;

// ============================================================================
// Disc Physics
// ============================================================================

/** Distance to catch disc (meters) */
export const CATCH_RADIUS = 2.5;

/** Gravity acceleration for disc flight (m/s²) */
export const DISC_GRAVITY = -9.8;

/**
 * Air drag coefficient for horizontal velocity (0-1, applied per frame).
 * Higher = less drag. A disc cuts through air efficiently.
 */
export const AIR_RESISTANCE = 0.997;

/**
 * Lift coefficient - how much horizontal speed creates upward force.
 * A spinning frisbee generates lift like a wing.
 */
export const DISC_LIFT_COEFFICIENT = 0.15;

/**
 * Minimum horizontal speed needed to generate lift (m/s).
 * Below this, the disc just falls.
 */
export const DISC_LIFT_MIN_SPEED = 5;

// ============================================================================
// Game Timing
// ============================================================================

/** Celebration time after scoring (seconds) */
export const SCORE_CELEBRATION_TIME = 3;

// ============================================================================
// Catch Mechanics
// ============================================================================

/** Probability of successful catch (0-1) */
export const CATCH_SUCCESS_RATE = 0.9;

// ============================================================================
// Disc Heights
// ============================================================================

/** Height when player holds disc (meters) */
export const DISC_HELD_HEIGHT = 1.0;

/** Height when disc is released during throw (meters) */
export const DISC_THROW_HEIGHT = 1.5;

/** Ground collision threshold (meters) */
export const DISC_GROUND_LEVEL = 0.1;
