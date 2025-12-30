/**
 * Road network builder using a grid-based approach.
 *
 * Creates a 2D grid where each cell can contain a road tile.
 * Handles the ring road around the dome and connections to the outer city grid.
 */

import {
  CITY_SIZE,
  BLOCK_SIZE,
  DOME_WIDTH,
  DOME_LENGTH,
  DOME_BUFFER,
} from "@/constants";
import {
  RoadTile,
  RoadTileType,
  getTileType,
  TileConnections,
} from "./roadTypes";

// Ring road margin outside the dome buffer
const RING_ROAD_MARGIN = 5;

// Calculate ring road bounds
const RING_HALF_WIDTH = DOME_WIDTH / 2 + DOME_BUFFER + RING_ROAD_MARGIN;
const RING_HALF_LENGTH = DOME_LENGTH / 2 + DOME_BUFFER + RING_ROAD_MARGIN;

/**
 * Grid cell states
 */
enum CellState {
  EMPTY = 0, // No road
  ROAD = 1, // Has road
  EXCLUDED = 2, // Inside dome exclusion zone (no roads allowed)
}

/**
 * The road network as a collection of tiles
 */
export interface RoadNetwork {
  tiles: RoadTile[];
  gridWidth: number;
  gridHeight: number;
}

/**
 * Convert grid indices to world coordinates (center of tile)
 */
function gridToWorld(
  gx: number,
  gz: number
): { worldX: number; worldZ: number } {
  const halfGrid = CITY_SIZE / 2;
  const worldX = gx * BLOCK_SIZE - halfGrid;
  const worldZ = gz * BLOCK_SIZE - halfGrid;
  return { worldX, worldZ };
}

/**
 * Check if a world position is inside the dome exclusion zone
 */
function isInsideDomeZone(worldX: number, worldZ: number): boolean {
  // Use a slightly smaller buffer to ensure ring road is outside
  const bufferX = DOME_WIDTH / 2 + DOME_BUFFER;
  const bufferZ = DOME_LENGTH / 2 + DOME_BUFFER;
  return Math.abs(worldX) < bufferX && Math.abs(worldZ) < bufferZ;
}

/**
 * Check if a world position is on the ring road
 */
function isOnRingRoad(worldX: number, worldZ: number): boolean {
  const absX = Math.abs(worldX);
  const absZ = Math.abs(worldZ);

  // Ring road boundary tolerance
  const tolerance = BLOCK_SIZE / 2;

  // On north or south edge of ring
  const onNSEdge =
    Math.abs(absZ - RING_HALF_LENGTH) < tolerance &&
    absX <= RING_HALF_WIDTH + tolerance;

  // On east or west edge of ring
  const onEWEdge =
    Math.abs(absX - RING_HALF_WIDTH) < tolerance &&
    absZ <= RING_HALF_LENGTH + tolerance;

  return onNSEdge || onEWEdge;
}

/**
 * Build the road network grid
 */
export function buildRoadNetwork(): RoadNetwork {
  const gridSize = Math.ceil(CITY_SIZE / BLOCK_SIZE) + 1;
  const grid: CellState[][] = [];

  // Initialize grid
  for (let gz = 0; gz < gridSize; gz++) {
    grid[gz] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      grid[gz][gx] = CellState.EMPTY;
    }
  }

  // Step 1: Mark exclusion zone (inside dome buffer)
  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const { worldX, worldZ } = gridToWorld(gx, gz);
      if (isInsideDomeZone(worldX, worldZ)) {
        grid[gz][gx] = CellState.EXCLUDED;
      }
    }
  }

  // Step 2: Place ring road around dome
  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize; gx++) {
      if (grid[gz][gx] === CellState.EXCLUDED) continue;

      const { worldX, worldZ } = gridToWorld(gx, gz);
      if (isOnRingRoad(worldX, worldZ)) {
        grid[gz][gx] = CellState.ROAD;
      }
    }
  }

  // Step 3: Place outer grid roads
  // Create a full grid of streets in all areas outside the ring road
  // Streets form a regular grid at BLOCK_SIZE intervals
  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize; gx++) {
      if (grid[gz][gx] !== CellState.EMPTY) continue;

      const { worldX, worldZ } = gridToWorld(gx, gz);

      // Check if this position is completely outside the ring road area
      const outsideRingX = Math.abs(worldX) > RING_HALF_WIDTH + BLOCK_SIZE / 4;
      const outsideRingZ = Math.abs(worldZ) > RING_HALF_LENGTH + BLOCK_SIZE / 4;

      // Place road if outside the ring in at least one direction
      if (outsideRingX || outsideRingZ) {
        grid[gz][gx] = CellState.ROAD;
      }
    }
  }

  // Step 4: Generate tiles with proper connections
  const tiles: RoadTile[] = [];

  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize; gx++) {
      if (grid[gz][gx] !== CellState.ROAD) continue;

      const { worldX, worldZ } = gridToWorld(gx, gz);

      // Determine connections by checking adjacent cells
      const connections: TileConnections = {
        north: gz > 0 && grid[gz - 1][gx] === CellState.ROAD,
        south: gz < gridSize - 1 && grid[gz + 1][gx] === CellState.ROAD,
        west: gx > 0 && grid[gz][gx - 1] === CellState.ROAD,
        east: gx < gridSize - 1 && grid[gz][gx + 1] === CellState.ROAD,
      };

      const type = getTileType(connections);

      // Skip tiles with no connections (isolated)
      if (type === RoadTileType.EMPTY) continue;

      tiles.push({
        gridX: gx,
        gridZ: gz,
        worldX,
        worldZ,
        type,
        connections,
      });
    }
  }

  return {
    tiles,
    gridWidth: gridSize,
    gridHeight: gridSize,
  };
}

/**
 * Get tiles grouped by type for instanced rendering
 */
export function groupTilesByType(
  tiles: RoadTile[]
): Map<RoadTileType, RoadTile[]> {
  const groups = new Map<RoadTileType, RoadTile[]>();

  for (const tile of tiles) {
    if (tile.type === RoadTileType.EMPTY) continue;

    if (!groups.has(tile.type)) {
      groups.set(tile.type, []);
    }
    groups.get(tile.type)!.push(tile);
  }

  return groups;
}

/**
 * Calculate statistics about the road network
 */
export function getNetworkStats(network: RoadNetwork): {
  totalTiles: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};

  for (const tile of network.tiles) {
    byType[tile.type] = (byType[tile.type] || 0) + 1;
  }

  return {
    totalTiles: network.tiles.length,
    byType,
  };
}
