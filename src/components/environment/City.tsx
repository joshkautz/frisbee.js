/**
 * City environment component.
 *
 * Renders the city surrounding the dome including:
 * - Ground surfaces (city ground, dome plaza)
 * - Road network (using the new tile-based RoadSystem)
 * - Buildings (procedurally generated)
 * - Street lights
 */

import { useMemo, memo } from "react";
import * as THREE from "three";
import {
  DOME_LENGTH,
  DOME_WIDTH,
  CITY_SIZE,
  BLOCK_SIZE,
  BLOCK_INNER_SIZE,
  BUILDING_GAP,
  ROAD_WIDTH,
  SIDEWALK_WIDTH,
  DOME_BUFFER,
  BUILDING_MIN_WIDTH,
  BUILDING_MAX_WIDTH,
  BUILDING_MIN_DEPTH,
  BUILDING_MAX_DEPTH,
  BUILDING_MIN_HEIGHT,
  BUILDING_MAX_HEIGHT,
  CITY_GROUND_COLOR,
  PARKING_LOT_COLOR,
  BUILDING_COLORS,
  CITY_SEED,
} from "@/constants";
import { registerDisposable } from "@/ecs";
import type { BuildingProps, Position3D } from "@/types";
import { createSeededRandom } from "@/utils";
import { Building } from "./Building";
import { StreetLight } from "./StreetLight";
import { RoadSystem } from "./roads";

// Shared materials for city ground surfaces (created once, disposed on HMR)
const cityGroundMaterial = new THREE.MeshStandardMaterial({
  color: CITY_GROUND_COLOR,
});
const parkingLotMaterial = new THREE.MeshStandardMaterial({
  color: PARKING_LOT_COLOR,
});

registerDisposable(cityGroundMaterial);
registerDisposable(parkingLotMaterial);

// Ring road dimensions (for building exclusion zone)
const RING_ROAD_MARGIN = 5;
const RING_HALF_WIDTH = DOME_WIDTH / 2 + DOME_BUFFER + RING_ROAD_MARGIN;
const RING_HALF_LENGTH = DOME_LENGTH / 2 + DOME_BUFFER + RING_ROAD_MARGIN;

export const City = memo(function City() {
  // Generate buildings in valid blocks (outside the ring road)
  const buildings = useMemo(() => {
    const result: BuildingProps[] = [];
    const random = createSeededRandom(CITY_SEED);
    const gridStart = -CITY_SIZE / 2 + BLOCK_SIZE / 2;
    const gridEnd = CITY_SIZE / 2 - BLOCK_SIZE / 2;

    for (let blockX = gridStart; blockX <= gridEnd; blockX += BLOCK_SIZE) {
      for (let blockZ = gridStart; blockZ <= gridEnd; blockZ += BLOCK_SIZE) {
        // Skip blocks inside the ring road
        if (
          blockX > -RING_HALF_WIDTH - BLOCK_SIZE / 2 &&
          blockX < RING_HALF_WIDTH + BLOCK_SIZE / 2 &&
          blockZ > -RING_HALF_LENGTH - BLOCK_SIZE / 2 &&
          blockZ < RING_HALF_LENGTH + BLOCK_SIZE / 2
        ) {
          continue;
        }

        const blockLeft = blockX - BLOCK_INNER_SIZE / 2;
        const blockRight = blockX + BLOCK_INNER_SIZE / 2;
        const blockTop = blockZ - BLOCK_INNER_SIZE / 2;
        const blockBottom = blockZ + BLOCK_INNER_SIZE / 2;

        let currentX = blockLeft + BUILDING_GAP;

        while (currentX < blockRight - BUILDING_MIN_WIDTH) {
          const width =
            BUILDING_MIN_WIDTH +
            random() * (BUILDING_MAX_WIDTH - BUILDING_MIN_WIDTH);
          const adjustedWidth = Math.min(
            width,
            blockRight - currentX - BUILDING_GAP
          );

          if (adjustedWidth < BUILDING_MIN_WIDTH) break;

          // North-facing buildings
          const depth1 =
            BUILDING_MIN_DEPTH +
            random() * (BUILDING_MAX_DEPTH - BUILDING_MIN_DEPTH);
          const height1 =
            BUILDING_MIN_HEIGHT +
            random() * (BUILDING_MAX_HEIGHT - BUILDING_MIN_HEIGHT);
          const color1 =
            BUILDING_COLORS[Math.floor(random() * BUILDING_COLORS.length)];

          result.push({
            position: [
              currentX + adjustedWidth / 2,
              0,
              blockBottom - depth1 / 2 - BUILDING_GAP,
            ],
            width: adjustedWidth,
            depth: depth1,
            height: height1,
            color: color1,
          });

          // South-facing buildings
          const depth2 =
            BUILDING_MIN_DEPTH +
            random() * (BUILDING_MAX_DEPTH - BUILDING_MIN_DEPTH);
          const height2 =
            BUILDING_MIN_HEIGHT +
            random() * (BUILDING_MAX_HEIGHT - BUILDING_MIN_HEIGHT);
          const color2 =
            BUILDING_COLORS[Math.floor(random() * BUILDING_COLORS.length)];

          result.push({
            position: [
              currentX + adjustedWidth / 2,
              0,
              blockTop + depth2 / 2 + BUILDING_GAP,
            ],
            width: adjustedWidth,
            depth: depth2,
            height: height2,
            color: color2,
          });

          currentX += adjustedWidth + BUILDING_GAP;
        }
      }
    }

    return result;
  }, []);

  // Generate street light positions
  const streetLightPositions = useMemo(() => {
    const positions: Position3D[] = [];
    const gridStart = -CITY_SIZE / 2;
    const gridEnd = CITY_SIZE / 2;
    const lightOffset = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 1;

    // Place lights at grid intersections outside the dome zone
    for (let x = gridStart; x <= gridEnd; x += BLOCK_SIZE) {
      for (let z = gridStart; z <= gridEnd; z += BLOCK_SIZE) {
        // Skip positions inside the ring road area
        if (
          Math.abs(x) < RING_HALF_WIDTH + BLOCK_SIZE / 2 &&
          Math.abs(z) < RING_HALF_LENGTH + BLOCK_SIZE / 2
        ) {
          continue;
        }

        // Place light at NE corner of intersection
        positions.push([x + lightOffset, 0, z - lightOffset]);
      }
    }

    // Lights around the dome perimeter (on the plaza)
    const numDomeLights = 16;
    for (let i = 0; i < numDomeLights; i++) {
      const angle = (i / numDomeLights) * Math.PI * 2;
      const px = Math.cos(angle) * (DOME_WIDTH / 2 + DOME_BUFFER - 5);
      const pz = Math.sin(angle) * (DOME_LENGTH / 2 + DOME_BUFFER - 5);
      positions.push([px, 0, pz]);
    }

    return positions;
  }, []);

  return (
    <group>
      {/* City ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[CITY_SIZE, CITY_SIZE]} />
        <primitive object={cityGroundMaterial} attach="material" />
      </mesh>

      {/* Plaza around dome */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[DOME_WIDTH + DOME_BUFFER * 2, DOME_LENGTH + DOME_BUFFER * 2]}
        />
        <primitive object={parkingLotMaterial} attach="material" />
      </mesh>

      {/* Road system (new tile-based implementation) */}
      <RoadSystem />

      {/* Buildings */}
      {buildings.map((building, i) => (
        <Building key={`building-${i}`} {...building} />
      ))}

      {/* Street lights */}
      {streetLightPositions.map((position, i) => (
        <StreetLight key={`light-${i}`} position={position} />
      ))}
    </group>
  );
});
