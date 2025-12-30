/**
 * Road tile geometry builder.
 *
 * Creates merged BufferGeometry for each tile type, combining:
 * - Road surface
 * - Sidewalks (where no road connection)
 * - Center line markings
 *
 * All geometries are created once and cached for instanced rendering.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  ROAD_WIDTH,
  SIDEWALK_WIDTH,
  BLOCK_SIZE,
  CENTER_LINE_WIDTH,
} from "@/constants";
import { RoadTileType, getConnectionsFromType } from "./roadTypes";

// Geometry heights (Y positions) for proper layering
const ROAD_Y = 0.02;
const LINE_Y = 0.03;
const SIDEWALK_Y = 0.04;

// Half dimensions for easier math
const HALF_TILE = BLOCK_SIZE / 2;
const HALF_ROAD = ROAD_WIDTH / 2;
const HALF_SIDEWALK = SIDEWALK_WIDTH / 2;

/**
 * Cached tile geometries - created once per tile type
 */
const geometryCache = new Map<RoadTileType, THREE.BufferGeometry>();

/**
 * Create a horizontal plane geometry at specified position
 */
function createPlane(
  width: number,
  depth: number,
  x: number,
  y: number,
  z: number
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth);
  geo.rotateX(-Math.PI / 2);
  geo.translate(x, y, z);
  return geo;
}

/**
 * Build road surface geometry for a tile based on connections.
 * The road surface fills the center and extends toward connected directions.
 */
function buildRoadSurface(type: RoadTileType): THREE.BufferGeometry[] {
  const connections = getConnectionsFromType(type);
  const geometries: THREE.BufferGeometry[] = [];

  if (type === RoadTileType.EMPTY) {
    return geometries;
  }

  // Center intersection area (always present for road tiles)
  geometries.push(createPlane(ROAD_WIDTH, ROAD_WIDTH, 0, ROAD_Y, 0));

  // Extend road toward each connected direction
  const extensionLength = HALF_TILE - HALF_ROAD;

  if (connections.north) {
    geometries.push(
      createPlane(
        ROAD_WIDTH,
        extensionLength,
        0,
        ROAD_Y,
        -HALF_ROAD - extensionLength / 2
      )
    );
  }
  if (connections.south) {
    geometries.push(
      createPlane(
        ROAD_WIDTH,
        extensionLength,
        0,
        ROAD_Y,
        HALF_ROAD + extensionLength / 2
      )
    );
  }
  if (connections.east) {
    geometries.push(
      createPlane(
        extensionLength,
        ROAD_WIDTH,
        HALF_ROAD + extensionLength / 2,
        ROAD_Y,
        0
      )
    );
  }
  if (connections.west) {
    geometries.push(
      createPlane(
        extensionLength,
        ROAD_WIDTH,
        -HALF_ROAD - extensionLength / 2,
        ROAD_Y,
        0
      )
    );
  }

  return geometries;
}

/**
 * Build center line geometry for road markings
 */
function buildCenterLines(type: RoadTileType): THREE.BufferGeometry[] {
  const connections = getConnectionsFromType(type);
  const geometries: THREE.BufferGeometry[] = [];

  if (type === RoadTileType.EMPTY) {
    return geometries;
  }

  // N-S center line (for tiles with both north and south connections)
  if (connections.north && connections.south) {
    geometries.push(createPlane(CENTER_LINE_WIDTH, BLOCK_SIZE, 0, LINE_Y, 0));
  } else {
    // Partial lines for connections
    if (connections.north) {
      geometries.push(
        createPlane(CENTER_LINE_WIDTH, HALF_TILE, 0, LINE_Y, -HALF_TILE / 2)
      );
    }
    if (connections.south) {
      geometries.push(
        createPlane(CENTER_LINE_WIDTH, HALF_TILE, 0, LINE_Y, HALF_TILE / 2)
      );
    }
  }

  // E-W center line (for tiles with both east and west connections)
  if (connections.east && connections.west) {
    geometries.push(createPlane(BLOCK_SIZE, CENTER_LINE_WIDTH, 0, LINE_Y, 0));
  } else {
    // Partial lines for connections
    if (connections.east) {
      geometries.push(
        createPlane(HALF_TILE, CENTER_LINE_WIDTH, HALF_TILE / 2, LINE_Y, 0)
      );
    }
    if (connections.west) {
      geometries.push(
        createPlane(HALF_TILE, CENTER_LINE_WIDTH, -HALF_TILE / 2, LINE_Y, 0)
      );
    }
  }

  return geometries;
}

/**
 * Build sidewalk geometry for edges without road connections
 */
function buildSidewalks(type: RoadTileType): THREE.BufferGeometry[] {
  const connections = getConnectionsFromType(type);
  const geometries: THREE.BufferGeometry[] = [];

  // Edge sidewalk positioning
  const edgeOffset = HALF_ROAD + HALF_SIDEWALK;
  const edgeLength = ROAD_WIDTH; // Length of edge sidewalk (between corners)

  // Corner sidewalk positioning
  const cornerOffset = HALF_ROAD + HALF_SIDEWALK;

  // North edge sidewalk (if no north connection)
  if (!connections.north) {
    geometries.push(
      createPlane(edgeLength, SIDEWALK_WIDTH, 0, SIDEWALK_Y, -edgeOffset)
    );
  }

  // South edge sidewalk (if no south connection)
  if (!connections.south) {
    geometries.push(
      createPlane(edgeLength, SIDEWALK_WIDTH, 0, SIDEWALK_Y, edgeOffset)
    );
  }

  // East edge sidewalk (if no east connection)
  if (!connections.east) {
    geometries.push(
      createPlane(SIDEWALK_WIDTH, edgeLength, edgeOffset, SIDEWALK_Y, 0)
    );
  }

  // West edge sidewalk (if no west connection)
  if (!connections.west) {
    geometries.push(
      createPlane(SIDEWALK_WIDTH, edgeLength, -edgeOffset, SIDEWALK_Y, 0)
    );
  }

  // Corner sidewalks (placed where two adjacent edges have no connection)
  // NE corner
  if (!connections.north && !connections.east) {
    geometries.push(
      createPlane(
        SIDEWALK_WIDTH,
        SIDEWALK_WIDTH,
        cornerOffset,
        SIDEWALK_Y,
        -cornerOffset
      )
    );
  }

  // NW corner
  if (!connections.north && !connections.west) {
    geometries.push(
      createPlane(
        SIDEWALK_WIDTH,
        SIDEWALK_WIDTH,
        -cornerOffset,
        SIDEWALK_Y,
        -cornerOffset
      )
    );
  }

  // SE corner
  if (!connections.south && !connections.east) {
    geometries.push(
      createPlane(
        SIDEWALK_WIDTH,
        SIDEWALK_WIDTH,
        cornerOffset,
        SIDEWALK_Y,
        cornerOffset
      )
    );
  }

  // SW corner
  if (!connections.south && !connections.west) {
    geometries.push(
      createPlane(
        SIDEWALK_WIDTH,
        SIDEWALK_WIDTH,
        -cornerOffset,
        SIDEWALK_Y,
        cornerOffset
      )
    );
  }

  return geometries;
}

/**
 * Build complete tile geometry by merging road, lines, and sidewalks.
 * Uses geometry groups to allow multi-material rendering.
 */
function buildTileGeometry(type: RoadTileType): THREE.BufferGeometry {
  if (type === RoadTileType.EMPTY) {
    // Empty tile - just return empty geometry
    return new THREE.BufferGeometry();
  }

  const roadGeos = buildRoadSurface(type);
  const lineGeos = buildCenterLines(type);
  const sidewalkGeos = buildSidewalks(type);

  // Merge each category separately first
  const mergedRoad =
    roadGeos.length > 0
      ? mergeGeometries(roadGeos)
      : new THREE.BufferGeometry();
  const mergedLines =
    lineGeos.length > 0
      ? mergeGeometries(lineGeos)
      : new THREE.BufferGeometry();
  const mergedSidewalks =
    sidewalkGeos.length > 0
      ? mergeGeometries(sidewalkGeos)
      : new THREE.BufferGeometry();

  // Calculate vertex counts for groups
  const roadVertexCount = mergedRoad.attributes.position?.count || 0;
  const lineVertexCount = mergedLines.attributes.position?.count || 0;
  const sidewalkVertexCount = mergedSidewalks.attributes.position?.count || 0;

  // Merge all geometries
  const allGeos = [mergedRoad, mergedLines, mergedSidewalks].filter(
    (g) => g.attributes.position && g.attributes.position.count > 0
  );

  if (allGeos.length === 0) {
    return new THREE.BufferGeometry();
  }

  const merged = mergeGeometries(allGeos);

  // Add groups for multi-material rendering
  // Group 0: Road surface
  // Group 1: Center lines
  // Group 2: Sidewalks
  merged.clearGroups();

  let indexOffset = 0;
  const roadIndexCount = (roadVertexCount / 4) * 6; // 6 indices per quad (2 triangles)
  const lineIndexCount = (lineVertexCount / 4) * 6;
  const sidewalkIndexCount = (sidewalkVertexCount / 4) * 6;

  if (roadIndexCount > 0) {
    merged.addGroup(indexOffset, roadIndexCount, 0);
    indexOffset += roadIndexCount;
  }
  if (lineIndexCount > 0) {
    merged.addGroup(indexOffset, lineIndexCount, 1);
    indexOffset += lineIndexCount;
  }
  if (sidewalkIndexCount > 0) {
    merged.addGroup(indexOffset, sidewalkIndexCount, 2);
  }

  // Cleanup temporary geometries
  roadGeos.forEach((g) => g.dispose());
  lineGeos.forEach((g) => g.dispose());
  sidewalkGeos.forEach((g) => g.dispose());
  mergedRoad.dispose();
  mergedLines.dispose();
  mergedSidewalks.dispose();

  return merged;
}

/**
 * Get cached geometry for a tile type, creating it if needed
 */
export function getTileGeometry(type: RoadTileType): THREE.BufferGeometry {
  if (!geometryCache.has(type)) {
    geometryCache.set(type, buildTileGeometry(type));
  }
  return geometryCache.get(type)!;
}

/**
 * Dispose all cached geometries (call on cleanup/HMR)
 */
export function disposeAllTileGeometries(): void {
  geometryCache.forEach((geo) => geo.dispose());
  geometryCache.clear();
}

/**
 * Pre-build all tile geometries (call during initialization)
 */
export function prebuildAllTileGeometries(): void {
  Object.values(RoadTileType).forEach((type) => {
    if (type !== RoadTileType.EMPTY) {
      getTileGeometry(type);
    }
  });
}
