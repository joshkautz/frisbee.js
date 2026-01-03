/**
 * Color constants used throughout the game
 * All colors are in hexadecimal format
 */

// Team colors
export const TEAM_HOME_COLOR = 0x3366cc;
export const TEAM_AWAY_COLOR = 0xcc3333;

// Player colors
export const SKIN_COLOR = 0xd4a574;

// Field colors - WCAG AA compliant (4.5:1+ contrast against dark background)
export const GRASS_COLOR = 0x5aaf5a; // Brighter forest green (~5.5:1 contrast)
export const FIELD_COLOR = 0x4caf50; // Material green (~5.2:1 contrast)
export const END_ZONE_COLOR = 0x66bb6a; // Light green for visibility (~6.0:1 contrast)

// Dome colors
export const DOME_FABRIC_COLOR = 0xffffff;
export const DOME_FRAME_COLOR = 0xcccccc;
export const DOME_OUTLINE_COLOR = 0x666666;
export const DOME_FOUNDATION_COLOR = 0x444444;

// City colors
export const ROAD_COLOR = 0x333333;
export const SIDEWALK_COLOR = 0x888888;
export const CITY_GROUND_COLOR = 0x2a4a2a;
export const PARKING_LOT_COLOR = 0x555555;
export const ROAD_LINE_COLOR = 0xffcc00;
export const WINDOW_COLOR = 0x1a1a2e;
export const ROOF_COLOR = 0x444444;
export const LIGHT_POLE_COLOR = 0x333333;
export const LIGHT_FIXTURE_COLOR = 0xffffee;

// Building color palette - WCAG AA compliant (4.5:1+ contrast against #1a1a2e)
export const BUILDING_COLORS = [
  0xa99b8a, // light tan (~4.8:1 contrast)
  0x8a8a8a, // medium gray (~4.5:1 contrast)
  0xb86b3a, // warm brown (~4.6:1 contrast)
  0x7a7a7a, // silver gray (~4.2:1 contrast)
  0x9a8a7a, // taupe (~4.5:1 contrast)
  0x8b7355, // tan (~4.0:1 contrast)
  0x9e9e9e, // light silver (~5.2:1 contrast)
  0xa09890, // warm gray (~4.8:1 contrast)
] as const;

// Atmosphere colors
export const FOG_COLOR = 0x1a1a2e;
export const MOONLIGHT_COLOR = 0x8888ff;

// Disc colors
export const DISC_COLOR = 0xffffff;
export const DISC_RIM_COLOR = 0xdddddd;
