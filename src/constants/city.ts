/**
 * City environment dimensions and layout constants
 */

// City layout
export const CITY_SIZE = 400;
export const BLOCK_SIZE = 50; // Size of each city block (including road)
export const BLOCK_INNER_SIZE = 38; // Inner buildable area of block
export const BUILDING_GAP = 2; // Gap between buildings

// Road dimensions
export const ROAD_WIDTH = 12;
export const SIDEWALK_WIDTH = 3;
export const CENTER_LINE_WIDTH = 0.3;

// Dome exclusion zone (no buildings/roads inside this area)
export const DOME_BUFFER = 25; // Extra buffer around dome

// Building dimensions
export const BUILDING_MIN_WIDTH = 8;
export const BUILDING_MAX_WIDTH = 16;
export const BUILDING_MIN_DEPTH = 8;
export const BUILDING_MAX_DEPTH = 14;
export const BUILDING_MIN_HEIGHT = 20;
export const BUILDING_MAX_HEIGHT = 80;

// Street lights
export const STREET_LIGHT_COUNT = 24;
export const STREET_LIGHT_SPACING = 40; // Spacing along roads
export const LIGHT_POLE_HEIGHT = 8;

// Random seed for reproducible city generation
export const CITY_SEED = 12345;
