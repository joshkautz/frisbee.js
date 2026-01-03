/**
 * RoadSystem - High-performance road renderer using merged geometry.
 *
 * Instead of individual meshes per road tile, this creates three merged
 * BufferGeometries (roads, lines, sidewalks) for the entire network.
 * This reduces draw calls from 1000+ to just 3.
 *
 * @module components/environment/roads/RoadSystem
 */

import { memo, useMemo, useEffect } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  ROAD_WIDTH,
  SIDEWALK_WIDTH,
  BLOCK_SIZE,
  CENTER_LINE_WIDTH,
  ROAD_COLOR,
  ROAD_LINE_COLOR,
  SIDEWALK_COLOR,
} from "@/constants";
import { getStandardMaterial } from "@/utils";
import { buildRoadNetwork } from "./roadNetwork";
import { RoadTileType, getConnectionsFromType } from "./roadTypes";

// Geometry Y positions for proper layering
const ROAD_Y = 0.02;
const LINE_Y = 0.03;
const SIDEWALK_Y = 0.04;

// Half dimensions
const HALF_TILE = BLOCK_SIZE / 2;
const HALF_ROAD = ROAD_WIDTH / 2;
const HALF_SIDEWALK = SIDEWALK_WIDTH / 2;

// Shared materials (cached globally, disposed on HMR)
const roadMaterial = getStandardMaterial("road", { color: ROAD_COLOR });
const lineMaterial = getStandardMaterial("roadLine", {
  color: ROAD_LINE_COLOR,
});
const sidewalkMaterial = getStandardMaterial("sidewalk", {
  color: SIDEWALK_COLOR,
});

/**
 * Create a horizontal plane geometry at specified world position
 */
function createPlane(
  width: number,
  depth: number,
  worldX: number,
  y: number,
  worldZ: number
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth);
  geo.rotateX(-Math.PI / 2);
  geo.translate(worldX, y, worldZ);
  return geo;
}

/**
 * Build all road geometries for the network
 */
function buildRoadGeometries(
  tiles: ReturnType<typeof buildRoadNetwork>["tiles"]
): {
  roadGeometry: THREE.BufferGeometry | null;
  lineGeometry: THREE.BufferGeometry | null;
  sidewalkGeometry: THREE.BufferGeometry | null;
} {
  const roadGeos: THREE.BufferGeometry[] = [];
  const lineGeos: THREE.BufferGeometry[] = [];
  const sidewalkGeos: THREE.BufferGeometry[] = [];

  for (const tile of tiles) {
    const { worldX, worldZ, type } = tile;
    const connections = getConnectionsFromType(type);

    // Skip empty tiles
    if (type === RoadTileType.EMPTY) continue;

    // === ROAD SURFACES ===
    // Center intersection area
    roadGeos.push(createPlane(ROAD_WIDTH, ROAD_WIDTH, worldX, ROAD_Y, worldZ));

    // Extensions toward connections
    const extensionLength = HALF_TILE - HALF_ROAD;
    const extensionOffset = HALF_ROAD + extensionLength / 2;

    if (connections.north) {
      roadGeos.push(
        createPlane(
          ROAD_WIDTH,
          extensionLength,
          worldX,
          ROAD_Y,
          worldZ - extensionOffset
        )
      );
    }
    if (connections.south) {
      roadGeos.push(
        createPlane(
          ROAD_WIDTH,
          extensionLength,
          worldX,
          ROAD_Y,
          worldZ + extensionOffset
        )
      );
    }
    if (connections.east) {
      roadGeos.push(
        createPlane(
          extensionLength,
          ROAD_WIDTH,
          worldX + extensionOffset,
          ROAD_Y,
          worldZ
        )
      );
    }
    if (connections.west) {
      roadGeos.push(
        createPlane(
          extensionLength,
          ROAD_WIDTH,
          worldX - extensionOffset,
          ROAD_Y,
          worldZ
        )
      );
    }

    // === CENTER LINES ===
    // N-S center line
    if (connections.north && connections.south) {
      lineGeos.push(
        createPlane(CENTER_LINE_WIDTH, BLOCK_SIZE, worldX, LINE_Y, worldZ)
      );
    } else {
      if (connections.north) {
        lineGeos.push(
          createPlane(
            CENTER_LINE_WIDTH,
            HALF_TILE,
            worldX,
            LINE_Y,
            worldZ - HALF_TILE / 2
          )
        );
      }
      if (connections.south) {
        lineGeos.push(
          createPlane(
            CENTER_LINE_WIDTH,
            HALF_TILE,
            worldX,
            LINE_Y,
            worldZ + HALF_TILE / 2
          )
        );
      }
    }

    // E-W center line
    if (connections.east && connections.west) {
      lineGeos.push(
        createPlane(BLOCK_SIZE, CENTER_LINE_WIDTH, worldX, LINE_Y, worldZ)
      );
    } else {
      if (connections.east) {
        lineGeos.push(
          createPlane(
            HALF_TILE,
            CENTER_LINE_WIDTH,
            worldX + HALF_TILE / 2,
            LINE_Y,
            worldZ
          )
        );
      }
      if (connections.west) {
        lineGeos.push(
          createPlane(
            HALF_TILE,
            CENTER_LINE_WIDTH,
            worldX - HALF_TILE / 2,
            LINE_Y,
            worldZ
          )
        );
      }
    }

    // === SIDEWALKS ===
    // Sidewalks run alongside road segments but NOT across intersections
    // Only place sidewalks on sides where there is NO road connection
    const sidewalkOffset = HALF_ROAD + HALF_SIDEWALK;

    // Sidewalks along the center area - only on sides with no connection
    // North side sidewalk (only if no north connection)
    if (!connections.north) {
      sidewalkGeos.push(
        createPlane(
          ROAD_WIDTH,
          SIDEWALK_WIDTH,
          worldX,
          SIDEWALK_Y,
          worldZ - sidewalkOffset
        )
      );
    }
    // South side sidewalk (only if no south connection)
    if (!connections.south) {
      sidewalkGeos.push(
        createPlane(
          ROAD_WIDTH,
          SIDEWALK_WIDTH,
          worldX,
          SIDEWALK_Y,
          worldZ + sidewalkOffset
        )
      );
    }
    // East side sidewalk (only if no east connection)
    if (!connections.east) {
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          ROAD_WIDTH,
          worldX + sidewalkOffset,
          SIDEWALK_Y,
          worldZ
        )
      );
    }
    // West side sidewalk (only if no west connection)
    if (!connections.west) {
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          ROAD_WIDTH,
          worldX - sidewalkOffset,
          SIDEWALK_Y,
          worldZ
        )
      );
    }

    // Sidewalks along each road extension
    // North extension: sidewalks on E and W
    if (connections.north) {
      const extZ = worldZ - HALF_ROAD - extensionLength / 2;
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          extensionLength,
          worldX + sidewalkOffset,
          SIDEWALK_Y,
          extZ
        )
      );
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          extensionLength,
          worldX - sidewalkOffset,
          SIDEWALK_Y,
          extZ
        )
      );
    }

    // South extension: sidewalks on E and W
    if (connections.south) {
      const extZ = worldZ + HALF_ROAD + extensionLength / 2;
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          extensionLength,
          worldX + sidewalkOffset,
          SIDEWALK_Y,
          extZ
        )
      );
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          extensionLength,
          worldX - sidewalkOffset,
          SIDEWALK_Y,
          extZ
        )
      );
    }

    // East extension: sidewalks on N and S
    if (connections.east) {
      const extX = worldX + HALF_ROAD + extensionLength / 2;
      sidewalkGeos.push(
        createPlane(
          extensionLength,
          SIDEWALK_WIDTH,
          extX,
          SIDEWALK_Y,
          worldZ - sidewalkOffset
        )
      );
      sidewalkGeos.push(
        createPlane(
          extensionLength,
          SIDEWALK_WIDTH,
          extX,
          SIDEWALK_Y,
          worldZ + sidewalkOffset
        )
      );
    }

    // West extension: sidewalks on N and S
    if (connections.west) {
      const extX = worldX - HALF_ROAD - extensionLength / 2;
      sidewalkGeos.push(
        createPlane(
          extensionLength,
          SIDEWALK_WIDTH,
          extX,
          SIDEWALK_Y,
          worldZ - sidewalkOffset
        )
      );
      sidewalkGeos.push(
        createPlane(
          extensionLength,
          SIDEWALK_WIDTH,
          extX,
          SIDEWALK_Y,
          worldZ + sidewalkOffset
        )
      );
    }

    // Corner sidewalks - only where two adjacent sides have NO connection
    // NE corner (no north AND no east)
    if (!connections.north && !connections.east) {
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          SIDEWALK_WIDTH,
          worldX + sidewalkOffset,
          SIDEWALK_Y,
          worldZ - sidewalkOffset
        )
      );
    }
    // NW corner (no north AND no west)
    if (!connections.north && !connections.west) {
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          SIDEWALK_WIDTH,
          worldX - sidewalkOffset,
          SIDEWALK_Y,
          worldZ - sidewalkOffset
        )
      );
    }
    // SE corner (no south AND no east)
    if (!connections.south && !connections.east) {
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          SIDEWALK_WIDTH,
          worldX + sidewalkOffset,
          SIDEWALK_Y,
          worldZ + sidewalkOffset
        )
      );
    }
    // SW corner (no south AND no west)
    if (!connections.south && !connections.west) {
      sidewalkGeos.push(
        createPlane(
          SIDEWALK_WIDTH,
          SIDEWALK_WIDTH,
          worldX - sidewalkOffset,
          SIDEWALK_Y,
          worldZ + sidewalkOffset
        )
      );
    }
  }

  // Merge all geometries
  const roadGeometry = roadGeos.length > 0 ? mergeGeometries(roadGeos) : null;
  const lineGeometry = lineGeos.length > 0 ? mergeGeometries(lineGeos) : null;
  const sidewalkGeometry =
    sidewalkGeos.length > 0 ? mergeGeometries(sidewalkGeos) : null;

  // Dispose temporary geometries
  roadGeos.forEach((g) => g.dispose());
  lineGeos.forEach((g) => g.dispose());
  sidewalkGeos.forEach((g) => g.dispose());

  return { roadGeometry, lineGeometry, sidewalkGeometry };
}

/**
 * RoadSystem component - renders the entire road network efficiently
 */
export const RoadSystem = memo(function RoadSystem() {
  // Build road network and geometries (memoized, runs once)
  const { roadGeometry, lineGeometry, sidewalkGeometry, tileCount } =
    useMemo(() => {
      const network = buildRoadNetwork();
      const geometries = buildRoadGeometries(network.tiles);
      return {
        ...geometries,
        tileCount: network.tiles.length,
      };
    }, []);

  // Cleanup geometries on unmount
  useEffect(() => {
    return () => {
      roadGeometry?.dispose();
      lineGeometry?.dispose();
      sidewalkGeometry?.dispose();
    };
  }, [roadGeometry, lineGeometry, sidewalkGeometry]);

  // Log stats in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[RoadSystem] Rendered ${tileCount} tiles with 3 draw calls`);
    }
  }, [tileCount]);

  return (
    <group>
      {/* Road surfaces */}
      {roadGeometry && (
        <mesh geometry={roadGeometry} receiveShadow>
          <primitive object={roadMaterial} attach="material" />
        </mesh>
      )}

      {/* Center lines */}
      {lineGeometry && (
        <mesh geometry={lineGeometry}>
          <primitive object={lineMaterial} attach="material" />
        </mesh>
      )}

      {/* Sidewalks */}
      {sidewalkGeometry && (
        <mesh geometry={sidewalkGeometry} receiveShadow>
          <primitive object={sidewalkMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
});
