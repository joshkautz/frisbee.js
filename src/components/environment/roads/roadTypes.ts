/**
 * Road tile type definitions for the tile-based road system.
 *
 * Each tile represents a BLOCK_SIZE x BLOCK_SIZE area containing:
 * - Road surface (where applicable)
 * - Sidewalks (on edges without road connections)
 * - Center line markings
 */

/**
 * The 10 fundamental road tile types.
 * Named by their connection pattern (which directions have roads).
 */
export enum RoadTileType {
  // No connections - empty/plaza
  EMPTY = "EMPTY",

  // Single connection (dead ends)
  DEAD_END_N = "DEAD_END_N",
  DEAD_END_S = "DEAD_END_S",
  DEAD_END_E = "DEAD_END_E",
  DEAD_END_W = "DEAD_END_W",

  // Two connections - straight roads
  STRAIGHT_NS = "STRAIGHT_NS", // North-South
  STRAIGHT_EW = "STRAIGHT_EW", // East-West

  // Two connections - corners
  CORNER_NE = "CORNER_NE", // North and East
  CORNER_NW = "CORNER_NW", // North and West
  CORNER_SE = "CORNER_SE", // South and East
  CORNER_SW = "CORNER_SW", // South and West

  // Three connections - T-junctions
  T_NORTH = "T_NORTH", // T pointing North (no South connection)
  T_SOUTH = "T_SOUTH", // T pointing South (no North connection)
  T_EAST = "T_EAST", // T pointing East (no West connection)
  T_WEST = "T_WEST", // T pointing West (no East connection)

  // Four connections
  INTERSECTION = "INTERSECTION", // 4-way intersection
}

/**
 * Connection flags for a tile position
 */
export interface TileConnections {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

/**
 * A single tile in the road grid
 */
export interface RoadTile {
  gridX: number; // Grid column index
  gridZ: number; // Grid row index
  worldX: number; // World X coordinate (center of tile)
  worldZ: number; // World Z coordinate (center of tile)
  type: RoadTileType;
  connections: TileConnections;
}

/**
 * Determine the tile type based on connection flags
 */
export function getTileType(connections: TileConnections): RoadTileType {
  const { north, south, east, west } = connections;
  const count = [north, south, east, west].filter(Boolean).length;

  if (count === 0) return RoadTileType.EMPTY;

  if (count === 1) {
    if (north) return RoadTileType.DEAD_END_N;
    if (south) return RoadTileType.DEAD_END_S;
    if (east) return RoadTileType.DEAD_END_E;
    if (west) return RoadTileType.DEAD_END_W;
  }

  if (count === 2) {
    // Straight roads
    if (north && south) return RoadTileType.STRAIGHT_NS;
    if (east && west) return RoadTileType.STRAIGHT_EW;
    // Corners
    if (north && east) return RoadTileType.CORNER_NE;
    if (north && west) return RoadTileType.CORNER_NW;
    if (south && east) return RoadTileType.CORNER_SE;
    if (south && west) return RoadTileType.CORNER_SW;
  }

  if (count === 3) {
    if (!south) return RoadTileType.T_NORTH;
    if (!north) return RoadTileType.T_SOUTH;
    if (!west) return RoadTileType.T_EAST;
    if (!east) return RoadTileType.T_WEST;
  }

  return RoadTileType.INTERSECTION;
}

/**
 * Get connection flags from a tile type
 */
export function getConnectionsFromType(type: RoadTileType): TileConnections {
  const connections: TileConnections = {
    north: false,
    south: false,
    east: false,
    west: false,
  };

  switch (type) {
    case RoadTileType.DEAD_END_N:
      connections.north = true;
      break;
    case RoadTileType.DEAD_END_S:
      connections.south = true;
      break;
    case RoadTileType.DEAD_END_E:
      connections.east = true;
      break;
    case RoadTileType.DEAD_END_W:
      connections.west = true;
      break;
    case RoadTileType.STRAIGHT_NS:
      connections.north = true;
      connections.south = true;
      break;
    case RoadTileType.STRAIGHT_EW:
      connections.east = true;
      connections.west = true;
      break;
    case RoadTileType.CORNER_NE:
      connections.north = true;
      connections.east = true;
      break;
    case RoadTileType.CORNER_NW:
      connections.north = true;
      connections.west = true;
      break;
    case RoadTileType.CORNER_SE:
      connections.south = true;
      connections.east = true;
      break;
    case RoadTileType.CORNER_SW:
      connections.south = true;
      connections.west = true;
      break;
    case RoadTileType.T_NORTH:
      connections.north = true;
      connections.east = true;
      connections.west = true;
      break;
    case RoadTileType.T_SOUTH:
      connections.south = true;
      connections.east = true;
      connections.west = true;
      break;
    case RoadTileType.T_EAST:
      connections.north = true;
      connections.south = true;
      connections.east = true;
      break;
    case RoadTileType.T_WEST:
      connections.north = true;
      connections.south = true;
      connections.west = true;
      break;
    case RoadTileType.INTERSECTION:
      connections.north = true;
      connections.south = true;
      connections.east = true;
      connections.west = true;
      break;
  }

  return connections;
}

/**
 * All tile types that render geometry (excludes EMPTY)
 */
export const RENDERABLE_TILE_TYPES = Object.values(RoadTileType).filter(
  (t) => t !== RoadTileType.EMPTY
) as RoadTileType[];
