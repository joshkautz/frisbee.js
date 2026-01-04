/**
 * Ultimate frisbee field dimensions (in meters)
 * Based on official USA Ultimate regulations (11th Edition)
 *
 * USA Ultimate dimensions:
 * - Playing field proper: 70 yards × 40 yards (64m × 36.6m)
 * - End zones: 25 yards deep each (22.9m)
 * - Total: 120 yards × 40 yards (109.7m × 36.6m)
 */

// Field dimensions (converted from yards to meters)
export const FIELD_LENGTH = 110; // 120 yards = 109.7m (rounded)
export const FIELD_WIDTH = 37; // 40 yards = 36.6m (rounded)
export const END_ZONE_DEPTH = 23; // 25 yards = 22.86m (rounded)

// Buffer around the field (inside dome)
export const GRASS_PADDING = 15;

// Derived dome footprint dimensions
export const DOME_LENGTH = FIELD_LENGTH + GRASS_PADDING * 2;
export const DOME_WIDTH = FIELD_WIDTH + GRASS_PADDING * 2;

// Dome structure
export const DOME_HEIGHT = 25;
export const DOME_FOUNDATION_WIDTH = 1.5;

// Team configuration
export const PLAYERS_PER_TEAM = 7;
