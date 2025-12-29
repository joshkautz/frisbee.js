import { useMemo } from "react";
import {
  DOME_LENGTH,
  DOME_WIDTH,
  CITY_SIZE,
  BLOCK_SIZE,
  BUILDING_GAP,
  ROAD_WIDTH,
  BUILDING_MIN_WIDTH,
  BUILDING_MAX_WIDTH,
  BUILDING_MIN_HEIGHT,
  BUILDING_MAX_HEIGHT,
  STREET_LIGHT_COUNT,
  CITY_GROUND_COLOR,
  PARKING_LOT_COLOR,
  BUILDING_COLORS,
} from "@/constants";
import type { BuildingProps, RoadProps, Position3D } from "@/types";
import { createSeededRandom } from "@/utils";
import { Building } from "./Building";
import { Road } from "./Road";
import { StreetLight } from "./StreetLight";

export function City() {
  const buildings = useMemo(() => {
    const result: BuildingProps[] = [];
    const random = createSeededRandom(12345);

    const domeRadiusX = DOME_WIDTH / 2 + 20;
    const domeRadiusZ = DOME_LENGTH / 2 + 20;

    for (let x = -CITY_SIZE / 2; x < CITY_SIZE / 2; x += BLOCK_SIZE) {
      for (let z = -CITY_SIZE / 2; z < CITY_SIZE / 2; z += BLOCK_SIZE) {
        // Skip if inside dome area
        const distX = Math.abs(x) / domeRadiusX;
        const distZ = Math.abs(z) / domeRadiusZ;
        if (distX * distX + distZ * distZ < 1.2) continue;

        // Skip road intersections
        if (
          Math.abs(x % BLOCK_SIZE) < ROAD_WIDTH ||
          Math.abs(z % BLOCK_SIZE) < ROAD_WIDTH
        )
          continue;

        const width =
          BUILDING_MIN_WIDTH + random() * (BUILDING_MAX_WIDTH - BUILDING_MIN_WIDTH);
        const depth =
          BUILDING_MIN_WIDTH + random() * (BUILDING_MAX_WIDTH - BUILDING_MIN_WIDTH);
        const height =
          BUILDING_MIN_HEIGHT +
          random() * (BUILDING_MAX_HEIGHT - BUILDING_MIN_HEIGHT);
        const color =
          BUILDING_COLORS[Math.floor(random() * BUILDING_COLORS.length)];

        const offsetX = x + BUILDING_GAP + width / 2;
        const offsetZ = z + BUILDING_GAP + depth / 2;

        result.push({
          position: [offsetX, 0, offsetZ],
          width,
          depth,
          height,
          color,
        });
      }
    }

    return result;
  }, []);

  const roads = useMemo(() => {
    const result: RoadProps[] = [];

    // Horizontal roads
    for (let z = -CITY_SIZE / 2; z <= CITY_SIZE / 2; z += BLOCK_SIZE) {
      if (Math.abs(z) < DOME_LENGTH / 2 + 30) continue;
      result.push({
        position: [0, 0, z],
        width: ROAD_WIDTH,
        length: CITY_SIZE,
        rotation: Math.PI / 2,
      });
    }

    // Vertical roads
    for (let x = -CITY_SIZE / 2; x <= CITY_SIZE / 2; x += BLOCK_SIZE) {
      if (Math.abs(x) < DOME_WIDTH / 2 + 30) continue;
      result.push({
        position: [x, 0, 0],
        width: ROAD_WIDTH,
        length: CITY_SIZE,
        rotation: 0,
      });
    }

    // Ring road around dome
    const ringRadius = Math.max(DOME_WIDTH, DOME_LENGTH) / 2 + 25;
    result.push({
      position: [0, 0, -ringRadius],
      width: ROAD_WIDTH,
      length: DOME_WIDTH + 60,
      rotation: Math.PI / 2,
    });
    result.push({
      position: [0, 0, ringRadius],
      width: ROAD_WIDTH,
      length: DOME_WIDTH + 60,
      rotation: Math.PI / 2,
    });
    result.push({
      position: [-ringRadius + 20, 0, 0],
      width: ROAD_WIDTH,
      length: DOME_LENGTH + 60,
      rotation: 0,
    });
    result.push({
      position: [ringRadius - 20, 0, 0],
      width: ROAD_WIDTH,
      length: DOME_LENGTH + 60,
      rotation: 0,
    });

    return result;
  }, []);

  const streetLightPositions = useMemo(() => {
    const positions: Position3D[] = [];
    const radius = Math.max(DOME_WIDTH, DOME_LENGTH) / 2 + 15;

    for (let i = 0; i < STREET_LIGHT_COUNT; i++) {
      const angle = (i / STREET_LIGHT_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.7;
      const z = Math.sin(angle) * radius;
      positions.push([x, 0, z]);
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
        <meshStandardMaterial color={CITY_GROUND_COLOR} />
      </mesh>

      {/* Parking lot around dome */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[DOME_WIDTH + 40, DOME_LENGTH + 40]} />
        <meshStandardMaterial color={PARKING_LOT_COLOR} />
      </mesh>

      {/* Roads */}
      {roads.map((road, i) => (
        <Road key={`road-${i}`} {...road} />
      ))}

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
}
