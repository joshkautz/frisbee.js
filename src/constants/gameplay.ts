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

/**
 * Initial height when player catches/receives disc (meters).
 * Used for initial positioning; actual hand position is computed dynamically
 * by Player.tsx and updates the disc position every frame.
 */
export const DISC_HELD_HEIGHT = 1.25;

/** Height when disc is released during throw (meters) */
export const DISC_THROW_HEIGHT = 1.5;

/** Ground collision threshold (meters) */
export const DISC_GROUND_LEVEL = 0.1;

// ============================================================================
// Stall Count Rules (USA Ultimate)
// ============================================================================

/** Maximum stall count before turnover */
export const MAX_STALL_COUNT = 10;

/** Time between stall count increments (seconds) */
export const STALL_INTERVAL = 1.0;

/** Distance at which a marker can establish stall count (meters) */
export const MARKING_DISTANCE = 3.0;

// ============================================================================
// Game Structure (USA Ultimate)
// ============================================================================

/** Points to win the game */
export const POINTS_TO_WIN = 15;

/** Points at halftime */
export const HALFTIME_POINTS = 8;

// ============================================================================
// Animations
// ============================================================================

/** Duration of pull animation in seconds (longer wind-up for dramatic effect) */
export const PULL_ANIMATION_DURATION = 1.2;

/** Duration of regular throw animation in seconds (quick pass) */
export const THROW_ANIMATION_DURATION = 0.5;
