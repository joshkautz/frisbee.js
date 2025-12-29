import { useMemo } from "react";
import { DOME_LENGTH, DOME_WIDTH } from "./Field";

// City layout constants
const CITY_SIZE = 400;
const ROAD_WIDTH = 12;
const SIDEWALK_WIDTH = 3;
const BLOCK_SIZE = 40;
const BUILDING_GAP = 4;

// Colors
const ROAD_COLOR = 0x333333;
const SIDEWALK_COLOR = 0x888888;
const GROUND_COLOR = 0x2a4a2a;

interface BuildingProps {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  color: number;
}

function Building({ position, width, depth, height, color }: BuildingProps) {
  return (
    <group position={position}>
      {/* Main building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Windows - simple darker rectangles on sides */}
      <mesh position={[width / 2 + 0.01, height / 2, 0]}>
        <planeGeometry args={[0.1, height * 0.9]} />
        <meshStandardMaterial color={0x1a1a2e} />
      </mesh>
      <mesh position={[-width / 2 - 0.01, height / 2, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.1, height * 0.9]} />
        <meshStandardMaterial color={0x1a1a2e} />
      </mesh>

      {/* Roof detail */}
      <mesh position={[0, height + 0.5, 0]} castShadow>
        <boxGeometry args={[width * 0.8, 1, depth * 0.8]} />
        <meshStandardMaterial color={0x444444} />
      </mesh>
    </group>
  );
}

function Road({
  position,
  width,
  length,
  rotation = 0
}: {
  position: [number, number, number];
  width: number;
  length: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={ROAD_COLOR} />
      </mesh>

      {/* Center line (dashed yellow) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.3, length]} />
        <meshStandardMaterial color={0xffcc00} />
      </mesh>

      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2 + SIDEWALK_WIDTH / 2, 0.04, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, length]} />
        <meshStandardMaterial color={SIDEWALK_COLOR} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width / 2 - SIDEWALK_WIDTH / 2, 0.04, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_WIDTH, length]} />
        <meshStandardMaterial color={SIDEWALK_COLOR} />
      </mesh>
    </group>
  );
}

// Simple seeded random number generator
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function City() {
  // Generate procedural buildings
  const buildings = useMemo(() => {
    const result: BuildingProps[] = [];
    const random = createSeededRandom(12345);

    // Building colors palette
    const colors = [
      0x8b7355, // tan
      0x6b6b6b, // gray
      0x8b4513, // brown
      0x4a4a4a, // dark gray
      0x696969, // dim gray
      0x5c4033, // dark brown
      0x7a7a7a, // silver
      0x8b8682, // light gray
    ];

    // Generate buildings in a grid pattern around the dome
    const domeRadiusX = DOME_WIDTH / 2 + 20;
    const domeRadiusZ = DOME_LENGTH / 2 + 20;

    for (let x = -CITY_SIZE / 2; x < CITY_SIZE / 2; x += BLOCK_SIZE) {
      for (let z = -CITY_SIZE / 2; z < CITY_SIZE / 2; z += BLOCK_SIZE) {
        // Skip if inside dome area (with buffer)
        const distX = Math.abs(x) / domeRadiusX;
        const distZ = Math.abs(z) / domeRadiusZ;
        if (distX * distX + distZ * distZ < 1.2) continue;

        // Skip road intersections
        if (Math.abs(x % BLOCK_SIZE) < ROAD_WIDTH || Math.abs(z % BLOCK_SIZE) < ROAD_WIDTH) continue;

        // Random building properties
        const width = 10 + random() * 15;
        const depth = 10 + random() * 15;
        const height = 15 + random() * 60;
        const color = colors[Math.floor(random() * colors.length)];

        // Offset from grid to account for roads/sidewalks
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

  // Generate roads
  const roads = useMemo(() => {
    const result: { position: [number, number, number]; width: number; length: number; rotation: number }[] = [];

    // Main roads (horizontal - along X axis)
    for (let z = -CITY_SIZE / 2; z <= CITY_SIZE / 2; z += BLOCK_SIZE) {
      // Skip roads that would intersect the dome
      if (Math.abs(z) < DOME_LENGTH / 2 + 30) continue;
      result.push({
        position: [0, 0, z],
        width: ROAD_WIDTH,
        length: CITY_SIZE,
        rotation: Math.PI / 2,
      });
    }

    // Cross roads (vertical - along Z axis)
    for (let x = -CITY_SIZE / 2; x <= CITY_SIZE / 2; x += BLOCK_SIZE) {
      // Skip roads that would intersect the dome
      if (Math.abs(x) < DOME_WIDTH / 2 + 30) continue;
      result.push({
        position: [x, 0, 0],
        width: ROAD_WIDTH,
        length: CITY_SIZE,
        rotation: 0,
      });
    }

    // Ring road around the dome
    const ringRadius = Math.max(DOME_WIDTH, DOME_LENGTH) / 2 + 25;
    // Simplified as straight segments
    result.push({ position: [0, 0, -ringRadius], width: ROAD_WIDTH, length: DOME_WIDTH + 60, rotation: Math.PI / 2 });
    result.push({ position: [0, 0, ringRadius], width: ROAD_WIDTH, length: DOME_WIDTH + 60, rotation: Math.PI / 2 });
    result.push({ position: [-ringRadius + 20, 0, 0], width: ROAD_WIDTH, length: DOME_LENGTH + 60, rotation: 0 });
    result.push({ position: [ringRadius - 20, 0, 0], width: ROAD_WIDTH, length: DOME_LENGTH + 60, rotation: 0 });

    return result;
  }, []);

  return (
    <group>
      {/* Ground plane for the entire city */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[CITY_SIZE, CITY_SIZE]} />
        <meshStandardMaterial color={GROUND_COLOR} />
      </mesh>

      {/* Parking lot / plaza around dome */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[DOME_WIDTH + 40, DOME_LENGTH + 40]} />
        <meshStandardMaterial color={0x555555} />
      </mesh>

      {/* Roads */}
      {roads.map((road, i) => (
        <Road key={`road-${i}`} {...road} />
      ))}

      {/* Buildings */}
      {buildings.map((building, i) => (
        <Building key={`building-${i}`} {...building} />
      ))}

      {/* Street lights around the dome */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const radius = Math.max(DOME_WIDTH, DOME_LENGTH) / 2 + 15;
        const x = Math.cos(angle) * radius * 0.7;
        const z = Math.sin(angle) * radius;
        return (
          <group key={`light-${i}`} position={[x, 0, z]}>
            {/* Light pole */}
            <mesh position={[0, 4, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.2, 8, 8]} />
              <meshStandardMaterial color={0x333333} />
            </mesh>
            {/* Light fixture */}
            <mesh position={[0, 8, 0]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshStandardMaterial color={0xffffee} emissive={0xffffaa} emissiveIntensity={0.5} />
            </mesh>
            {/* Point light */}
            <pointLight position={[0, 8, 0]} intensity={0.3} distance={20} color={0xffffee} />
          </group>
        );
      })}
    </group>
  );
}
