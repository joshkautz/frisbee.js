/**
 * Player model dimensions (proportional to field scale)
 * Based on realistic human proportions for ~6 ft (1.83m) athlete
 * Scaled up 25% for better visibility in the game view
 *
 * Total height breakdown (scaled):
 * - Legs: 1.06m - athletic build
 * - Torso: 0.69m - includes shoulders
 * - Head: 0.14m radius × 2 = 0.28m
 * - Total: ~2.3m (scaled for visibility)
 */

// Scale factor for player visibility
const PLAYER_SCALE = 1.25;

// Body dimensions (torso)
export const BODY_HEIGHT = 0.55 * PLAYER_SCALE; // Torso height
export const BODY_RADIUS = 0.18 * PLAYER_SCALE; // Chest diameter

// Head dimensions
export const HEAD_RADIUS = 0.11 * PLAYER_SCALE; // Head diameter

// Leg dimensions
export const LEG_HEIGHT = 0.85 * PLAYER_SCALE; // Leg length
export const LEG_RADIUS = 0.07 * PLAYER_SCALE; // Thigh diameter

// Arm dimensions
export const ARM_LENGTH = 0.55 * PLAYER_SCALE; // Arm length (cylinder portion)
export const ARM_RADIUS = 0.05 * PLAYER_SCALE; // Arm diameter

/**
 * Total arm length including end caps.
 * Capsule geometry = cylinder (ARM_LENGTH) + 2 hemisphere caps (ARM_RADIUS each)
 */
export const ARM_TOTAL_LENGTH = ARM_LENGTH + 2 * ARM_RADIUS;

/**
 * Offset to position arm mesh so shoulder end is at pivot point.
 * The capsule origin is at center, so we offset by half the total length.
 */
export const ARM_PIVOT_OFFSET = -(ARM_LENGTH / 2 + ARM_RADIUS);

/**
 * Total leg length including end caps.
 * Capsule geometry = cylinder (LEG_HEIGHT) + 2 hemisphere caps (LEG_RADIUS each)
 */
export const LEG_TOTAL_LENGTH = LEG_HEIGHT + 2 * LEG_RADIUS;

/**
 * Offset to position leg mesh so hip end is at pivot point.
 * The capsule origin is at center, so we offset by half the total length.
 */
export const LEG_PIVOT_OFFSET = -(LEG_HEIGHT / 2 + LEG_RADIUS);

// Disc dimensions (standard ultimate disc is ~27cm diameter)
// Scaled up 50% for visibility (actual disc would be tiny at game scale)
export const DISC_RADIUS = 0.2; // Visible disc radius (~40cm diameter)
export const DISC_HEIGHT = 0.04; // Disc thickness
