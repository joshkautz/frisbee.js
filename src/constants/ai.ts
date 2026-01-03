/**
 * AI behavior constants for player decision-making.
 *
 * Controls how AI players evaluate positions, make decisions,
 * and respond to game situations.
 *
 * @module constants/ai
 */

// ============================================================================
// Proximity Thresholds (meters)
// ============================================================================

/** Moderate distance - loosely covered */
export const AI_MEDIUM_RANGE = 5;

/** Wide defensive coverage area */
export const AI_WIDE_RANGE = 8;

// ============================================================================
// Position Scoring Weights
// ============================================================================

/** Penalty per meter when opponent is within range */
export const OPPONENT_PROXIMITY_WEIGHT = 10;

/** Penalty for bunching too close to teammates */
export const TEAMMATE_BUNCHING_WEIGHT = 8;

/** Bonus for end zone targets */
export const END_ZONE_BONUS = 30;

/** Bonus multiplier for forward passes */
export const FORWARD_PASS_WEIGHT = 2;

/** Penalty multiplier for pass distance (longer = riskier) */
export const PASS_DISTANCE_PENALTY = 0.5;

// ============================================================================
// Defender Coverage Thresholds
// ============================================================================

/** Distance at which receiver is considered heavily guarded */
export const DEFENDER_COVERAGE_CLOSE = 3;

/** Distance at which receiver is considered loosely covered */
export const DEFENDER_COVERAGE_MEDIUM = 6;

/** Score penalty for heavily guarded receiver */
export const HEAVY_GUARD_PENALTY = 20;

/** Score penalty for loosely covered receiver */
export const LOOSE_COVER_PENALTY = 5;

// ============================================================================
// Cut Generation Parameters
// ============================================================================

/** Number of cut position candidates to evaluate */
export const CUT_CANDIDATES = 10;

/** Weight for preferring positions closer to end zone */
export const END_ZONE_PREFERENCE_WEIGHT = 0.15;
