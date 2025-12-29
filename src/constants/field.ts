/**
 * Ultimate frisbee field dimensions (in meters)
 * Based on official WFDF/USAU regulations
 */

// Field dimensions
export const FIELD_LENGTH = 100;
export const FIELD_WIDTH = 37;
export const END_ZONE_DEPTH = 18;

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
