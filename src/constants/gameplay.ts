/**
 * Gameplay constants for simulation, AI, and physics.
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

/** Gravity acceleration for disc flight (m/s^2) */
export const DISC_GRAVITY = -15;

/** Air drag coefficient (0-1, applied per frame) */
export const AIR_RESISTANCE = 0.98;

// ============================================================================
// Game Timing (seconds)
// ============================================================================

/** Minimum time between throws */
export const THROW_INTERVAL = 2;

/** Delay before executing pull after score */
export const PULL_DELAY = 2;

/** Celebration time after scoring */
export const SCORE_CELEBRATION_TIME = 3;

/** Delay before pickup after turnover */
export const TURNOVER_PICKUP_DELAY = 1;

/** Delay before game starts after initialization */
export const GAME_INIT_DELAY = 1;

// ============================================================================
// Catch Mechanics
// ============================================================================

/** Probability of successful catch (0-1) */
export const CATCH_SUCCESS_RATE = 0.9;
