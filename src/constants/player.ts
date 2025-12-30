/**
 * Player model dimensions (proportional to field scale)
 * Based on realistic human proportions for ~6 ft (1.83m) athlete
 *
 * Total height breakdown:
 * - Legs: 0.85m (~2'9") - athletic build, slightly longer legs
 * - Torso: 0.55m (~1'10") - includes shoulders
 * - Neck+Head: 0.11m radius × 2 = 0.22m (~9")
 * - Total: ~1.83m (6'0")
 */

// Body dimensions (torso)
export const BODY_HEIGHT = 0.55; // ~1'10" torso
export const BODY_RADIUS = 0.18; // ~14" chest diameter

// Head dimensions
export const HEAD_RADIUS = 0.11; // ~9" head diameter (realistic)

// Leg dimensions
export const LEG_HEIGHT = 0.85; // ~2'9" legs (athletic proportion)
export const LEG_RADIUS = 0.07; // ~5.5" thigh diameter

// Arm dimensions
export const ARM_LENGTH = 0.55; // ~22" arm length
export const ARM_RADIUS = 0.05; // ~4" arm diameter

// Disc dimensions (standard ultimate disc is ~27cm diameter)
export const DISC_RADIUS = 0.135; // 10.75" diameter / 2 = 5.375"
export const DISC_HEIGHT = 0.03; // ~1.2" height
