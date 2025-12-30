import { memo, useMemo } from "react";
import { Text, Line } from "@react-three/drei";
import {
  FIELD_LENGTH,
  FIELD_WIDTH,
  END_ZONE_DEPTH,
  DOME_HEIGHT,
  DOME_LENGTH,
  DOME_WIDTH,
  BODY_HEIGHT,
  LEG_HEIGHT,
  HEAD_RADIUS,
  DISC_RADIUS,
  BUILDING_MIN_HEIGHT,
  BUILDING_MAX_HEIGHT,
  ROAD_WIDTH,
  LIGHT_POLE_HEIGHT,
} from "@/constants";

// Conversion: 1 meter = 3.28084 feet
const METERS_TO_FEET = 3.28084;

/**
 * Convert meters to feet and inches string
 */
function metersToFeetInches(meters: number): string {
  const totalInches = meters * METERS_TO_FEET * 12;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (feet === 0) {
    return `${inches}"`;
  }
  if (inches === 0) {
    return `${feet}'`;
  }
  return `${feet}'${inches}"`;
}

/**
 * Convert meters to feet (decimal)
 */
function metersToFeet(meters: number): string {
  return `${(meters * METERS_TO_FEET).toFixed(1)} ft`;
}

interface RulerProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  color?: string;
  tickInterval?: number;
}

/**
 * 3D ruler with tick marks and label
 */
const Ruler = memo(function Ruler({
  start,
  end,
  label,
  color = "#ffff00",
  tickInterval = 10,
}: RulerProps) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 2,
    (start[2] + end[2]) / 2,
  ];

  // Calculate tick positions
  const ticks = useMemo(() => {
    const result: [number, number, number][][] = [];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const numTicks = Math.floor(length / tickInterval);

    for (let i = 0; i <= numTicks; i++) {
      const t = i / numTicks;
      const x = start[0] + dx * t;
      const y = start[1] + dy * t;
      const z = start[2] + dz * t;

      // Perpendicular tick (in Y direction for horizontal rulers)
      result.push([
        [x, y, z],
        [x, y + 1, z],
      ]);
    }

    return result;
  }, [start, end, tickInterval]);

  return (
    <group>
      {/* Main ruler line */}
      <Line points={[start, end]} color={color} lineWidth={3} />

      {/* Tick marks */}
      {ticks.map((tick, i) => (
        <Line key={i} points={tick} color={color} lineWidth={2} />
      ))}

      {/* Label */}
      <Text
        position={midpoint}
        fontSize={2}
        color={color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
});

interface ReferencePersonProps {
  position: [number, number, number];
  height: number;
  label: string;
  color?: string;
}

/**
 * Simple reference person silhouette for scale comparison
 */
const ReferencePerson = memo(function ReferencePerson({
  position,
  height,
  label,
  color = "#00ff00",
}: ReferencePersonProps) {
  const headRadius = height * 0.12;
  const bodyHeight = height * 0.4;
  const legHeight = height * 0.48;

  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, legHeight + bodyHeight / 2, 0]}>
        <capsuleGeometry args={[height * 0.1, bodyHeight * 0.6, 4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, legHeight + bodyHeight + headRadius, 0]}>
        <sphereGeometry args={[headRadius, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Legs */}
      <mesh position={[-height * 0.05, legHeight / 2, 0]}>
        <capsuleGeometry args={[height * 0.05, legHeight * 0.8, 4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[height * 0.05, legHeight / 2, 0]}>
        <capsuleGeometry args={[height * 0.05, legHeight * 0.8, 4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Height label */}
      <Text
        position={[1, height / 2, 0]}
        fontSize={0.5}
        color={color}
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Height ruler */}
      <Line
        points={[
          [0.8, 0, 0],
          [0.8, height, 0],
        ]}
        color={color}
        lineWidth={2}
      />
      <Line
        points={[
          [0.6, 0, 0],
          [1, 0, 0],
        ]}
        color={color}
        lineWidth={2}
      />
      <Line
        points={[
          [0.6, height, 0],
          [1, height, 0],
        ]}
        color={color}
        lineWidth={2}
      />
    </group>
  );
});

/**
 * Scale reference grid and rulers for the scene
 */
export const ScaleReference = memo(function ScaleReference() {
  // Calculate player height from constants
  const currentPlayerHeight = LEG_HEIGHT + BODY_HEIGHT + HEAD_RADIUS * 2;
  const realPersonHeight = 1.78; // 5'10" average

  return (
    <group>
      {/* Field length ruler */}
      <Ruler
        start={[FIELD_WIDTH / 2 + 5, 0.1, -FIELD_LENGTH / 2]}
        end={[FIELD_WIDTH / 2 + 5, 0.1, FIELD_LENGTH / 2]}
        label={`Field: ${FIELD_LENGTH}m (${metersToFeet(FIELD_LENGTH)})`}
        color="#ffff00"
        tickInterval={10}
      />

      {/* Field width ruler */}
      <Ruler
        start={[-FIELD_WIDTH / 2, 0.1, FIELD_LENGTH / 2 + 5]}
        end={[FIELD_WIDTH / 2, 0.1, FIELD_LENGTH / 2 + 5]}
        label={`Width: ${FIELD_WIDTH}m (${metersToFeet(FIELD_WIDTH)})`}
        color="#ffff00"
        tickInterval={10}
      />

      {/* End zone ruler */}
      <Ruler
        start={[-FIELD_WIDTH / 2 - 3, 0.1, -FIELD_LENGTH / 2]}
        end={[-FIELD_WIDTH / 2 - 3, 0.1, -FIELD_LENGTH / 2 + END_ZONE_DEPTH]}
        label={`End Zone: ${END_ZONE_DEPTH}m (${metersToFeet(END_ZONE_DEPTH)})`}
        color="#ff8800"
        tickInterval={5}
      />

      {/* Dome height ruler */}
      <Ruler
        start={[DOME_WIDTH / 2 + 3, 0, 0]}
        end={[DOME_WIDTH / 2 + 3, DOME_HEIGHT, 0]}
        label={`Dome: ${DOME_HEIGHT}m (${metersToFeet(DOME_HEIGHT)})`}
        color="#00ffff"
        tickInterval={5}
      />

      {/* Reference people for scale comparison */}
      {/* Current in-game player */}
      <ReferencePerson
        position={[0, 0, -FIELD_LENGTH / 2 - 10]}
        height={currentPlayerHeight}
        label={`Game Player: ${metersToFeetInches(currentPlayerHeight)}`}
        color="#ff0000"
      />

      {/* Real person (5'10") */}
      <ReferencePerson
        position={[3, 0, -FIELD_LENGTH / 2 - 10]}
        height={realPersonHeight}
        label={`Real Person: ${metersToFeetInches(realPersonHeight)}`}
        color="#00ff00"
      />

      {/* 6 foot reference */}
      <ReferencePerson
        position={[6, 0, -FIELD_LENGTH / 2 - 10]}
        height={1.83}
        label={`6 feet: ${metersToFeetInches(1.83)}`}
        color="#0088ff"
      />

      {/* 10 meter grid for reference */}
      <gridHelper args={[100, 10]} position={[0, 0.05, 0]} />

      {/* Disc reference */}
      <group position={[-5, 1, -FIELD_LENGTH / 2 - 10]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, 0.025, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
        <Text
          position={[0.5, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {`Disc: ${(DISC_RADIUS * 2 * 100).toFixed(0)}cm (${metersToFeetInches(DISC_RADIUS * 2)})`}
        </Text>
      </group>
    </group>
  );
});

/**
 * Dimensions data for the UI overlay
 */
export interface DimensionInfo {
  category: string;
  name: string;
  meters: number;
  feet: string;
  realWorld?: string;
  status: "correct" | "warning" | "error";
}

export function getDimensionsData(): DimensionInfo[] {
  const currentPlayerHeight = LEG_HEIGHT + BODY_HEIGHT + HEAD_RADIUS * 2;

  return [
    // Field dimensions
    {
      category: "Field",
      name: "Length",
      meters: FIELD_LENGTH,
      feet: metersToFeet(FIELD_LENGTH),
      realWorld: "328 ft (official)",
      status: "correct",
    },
    {
      category: "Field",
      name: "Width",
      meters: FIELD_WIDTH,
      feet: metersToFeet(FIELD_WIDTH),
      realWorld: "121 ft (official)",
      status: "correct",
    },
    {
      category: "Field",
      name: "End Zone",
      meters: END_ZONE_DEPTH,
      feet: metersToFeet(END_ZONE_DEPTH),
      realWorld: "59 ft (official)",
      status: "correct",
    },

    // Player dimensions
    {
      category: "Player",
      name: "Total Height",
      meters: currentPlayerHeight,
      feet: metersToFeetInches(currentPlayerHeight),
      realWorld: "5'9\" - 6'1\" typical",
      status: currentPlayerHeight > 2.0 ? "error" : "correct",
    },
    {
      category: "Player",
      name: "Body (torso)",
      meters: BODY_HEIGHT,
      feet: metersToFeetInches(BODY_HEIGHT),
      realWorld: "~1'8\" - 2'",
      status: BODY_HEIGHT > 0.7 ? "error" : "correct",
    },
    {
      category: "Player",
      name: "Legs",
      meters: LEG_HEIGHT,
      feet: metersToFeetInches(LEG_HEIGHT),
      realWorld: "~2'8\" - 3'",
      status: LEG_HEIGHT < 0.7 ? "warning" : "correct",
    },
    {
      category: "Player",
      name: "Head Diameter",
      meters: HEAD_RADIUS * 2,
      feet: metersToFeetInches(HEAD_RADIUS * 2),
      realWorld: '~9" diameter',
      status: HEAD_RADIUS > 0.15 ? "error" : "correct",
    },

    // Disc
    {
      category: "Disc",
      name: "Diameter",
      meters: DISC_RADIUS * 2,
      feet: metersToFeetInches(DISC_RADIUS * 2),
      realWorld: '10.75" (official)',
      status: "correct",
    },

    // Dome
    {
      category: "Dome",
      name: "Height",
      meters: DOME_HEIGHT,
      feet: metersToFeet(DOME_HEIGHT),
      realWorld: "65-115 ft typical",
      status: "correct",
    },
    {
      category: "Dome",
      name: "Length",
      meters: DOME_LENGTH,
      feet: metersToFeet(DOME_LENGTH),
      realWorld: "varies by facility",
      status: "correct",
    },
    {
      category: "Dome",
      name: "Width",
      meters: DOME_WIDTH,
      feet: metersToFeet(DOME_WIDTH),
      realWorld: "varies by facility",
      status: "correct",
    },

    // City
    {
      category: "City",
      name: "Building Min",
      meters: BUILDING_MIN_HEIGHT,
      feet: metersToFeet(BUILDING_MIN_HEIGHT),
      realWorld: "~6 stories",
      status: "correct",
    },
    {
      category: "City",
      name: "Building Max",
      meters: BUILDING_MAX_HEIGHT,
      feet: metersToFeet(BUILDING_MAX_HEIGHT),
      realWorld: "~26 stories",
      status: "correct",
    },
    {
      category: "City",
      name: "Road Width",
      meters: ROAD_WIDTH,
      feet: metersToFeet(ROAD_WIDTH),
      realWorld: "36-48 ft (4-lane)",
      status: "correct",
    },
    {
      category: "City",
      name: "Street Light",
      meters: LIGHT_POLE_HEIGHT,
      feet: metersToFeet(LIGHT_POLE_HEIGHT),
      realWorld: "25-35 ft typical",
      status: "correct",
    },
  ];
}
