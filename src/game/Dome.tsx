import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { DOME_LENGTH, DOME_WIDTH } from "./Field";

// Dome dimensions
const DOME_HEIGHT = 25;
const FOUNDATION_WIDTH = 1.5; // Consistent border width around dome base

// Interpolate between rectangular corners and ellipse based on height
function getPointOnPerimeter(
  angle: number,
  halfWidth: number,
  halfLength: number,
  rectangleWeight: number // 1 = rectangle, 0 = ellipse
): [number, number] {
  // Ellipse point
  const ellipseX = halfWidth * Math.cos(angle);
  const ellipseZ = halfLength * Math.sin(angle);

  // Rectangle point - find intersection of ray with rectangle
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  let rectX: number, rectZ: number;

  // Determine which edge the ray intersects
  const tanA = Math.abs(sinA / (cosA || 1e-10));
  const aspectRatio = halfLength / halfWidth;

  if (tanA <= aspectRatio) {
    // Intersects left or right edge
    rectX = Math.sign(cosA) * halfWidth;
    rectZ = rectX * (sinA / (cosA || 1e-10));
  } else {
    // Intersects top or bottom edge
    rectZ = Math.sign(sinA) * halfLength;
    rectX = rectZ * (cosA / (sinA || 1e-10));
  }

  // Interpolate between rectangle and ellipse
  const x = rectX * rectangleWeight + ellipseX * (1 - rectangleWeight);
  const z = rectZ * rectangleWeight + ellipseZ * (1 - rectangleWeight);

  return [x, z];
}

// Generate angles that include exact corner angles
function generateAnglesWithCorners(
  segmentsPerSide: number,
  halfWidth: number,
  halfLength: number
): number[] {
  const angles: number[] = [];

  // Corner angles (where the rectangle corners are)
  const cornerAngle = Math.atan2(halfLength, halfWidth);
  const cornerAngles = [
    cornerAngle, // Top-right
    Math.PI - cornerAngle, // Top-left
    Math.PI + cornerAngle, // Bottom-left
    2 * Math.PI - cornerAngle, // Bottom-right
  ];

  // Generate angles for each side, ensuring corners are included
  // We have 4 sides: 0→corner1, corner1→corner2, corner2→corner3, corner3→corner4, corner4→2π
  const sideAngles = [
    { start: 0, end: cornerAngles[0] },
    { start: cornerAngles[0], end: cornerAngles[1] },
    { start: cornerAngles[1], end: cornerAngles[2] },
    { start: cornerAngles[2], end: cornerAngles[3] },
    { start: cornerAngles[3], end: 2 * Math.PI },
  ];

  for (const side of sideAngles) {
    const sideLength = side.end - side.start;
    // More segments for longer sides
    const numSegments = Math.max(
      2,
      Math.round((sideLength / (Math.PI / 2)) * segmentsPerSide)
    );

    for (let j = 0; j < numSegments; j++) {
      const t = j / numSegments;
      angles.push(side.start + t * sideLength);
    }
  }

  // Add final angle to close the loop
  angles.push(2 * Math.PI);

  return angles;
}

export function Dome() {
  // Create a rectangular dome that rounds as it goes up
  const domeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    const segmentsPerSide = 32;
    const heightSegments = 32;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Pre-calculate angles that include corners
    const baseAngles = generateAnglesWithCorners(
      segmentsPerSide,
      DOME_WIDTH / 2,
      DOME_LENGTH / 2
    );
    const perimeterSegments = baseAngles.length - 1;

    // Generate vertices
    for (let h = 0; h <= heightSegments; h++) {
      const heightRatio = h / heightSegments;

      // Height follows a sine curve for dome shape
      const y = DOME_HEIGHT * Math.sin((heightRatio * Math.PI) / 2);

      // Rectangle weight: 1 at base (pure rectangle), 0 at top (pure ellipse)
      // Use a curve that keeps it rectangular longer at the base
      const rectangleWeight = Math.pow(1 - heightRatio, 2);

      // Scale factor - how much the perimeter shrinks as we go up
      const scale = Math.cos((heightRatio * Math.PI) / 2);

      const halfWidth = (DOME_WIDTH / 2) * scale;
      const halfLength = (DOME_LENGTH / 2) * scale;

      for (let p = 0; p < baseAngles.length; p++) {
        const theta = baseAngles[p];
        const u = theta / (2 * Math.PI);

        const [px, pz] = getPointOnPerimeter(
          theta,
          halfWidth,
          halfLength,
          rectangleWeight
        );

        vertices.push(px, y, pz);
        uvs.push(u, heightRatio);
      }
    }

    // Generate indices
    for (let h = 0; h < heightSegments; h++) {
      for (let p = 0; p < perimeterSegments; p++) {
        const a = h * (perimeterSegments + 1) + p;
        const b = a + perimeterSegments + 1;
        const c = a + 1;
        const d = b + 1;

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, []);

  // Create base outline points (true rectangle)
  const baseOutlinePoints = useMemo(() => {
    const hw = DOME_WIDTH / 2;
    const hl = DOME_LENGTH / 2;
    const y = 0.1;

    return [
      [hw, y, hl],
      [-hw, y, hl],
      [-hw, y, -hl],
      [hw, y, -hl],
      [hw, y, hl], // Close the loop
    ] as [number, number, number][];
  }, []);

  return (
    <group>
      {/* Main dome structure - semi-transparent white fabric */}
      <mesh geometry={domeGeometry}>
        <meshStandardMaterial
          color={0xffffff}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dome frame/ribs for structure visibility */}
      <mesh geometry={domeGeometry}>
        <meshStandardMaterial
          color={0xcccccc}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Base outline of the dome */}
      <Line points={baseOutlinePoints} color={0x666666} lineWidth={2} />

      {/* Base platform/foundation - consistent width border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <shapeGeometry args={[createFoundationShape()]} />
        <meshStandardMaterial color={0x444444} />
      </mesh>
    </group>
  );
}

// Create the foundation as a rectangular ring with consistent width
function createFoundationShape(): THREE.Shape {
  const outerHW = DOME_WIDTH / 2;
  const outerHL = DOME_LENGTH / 2;
  const innerHW = outerHW - FOUNDATION_WIDTH;
  const innerHL = outerHL - FOUNDATION_WIDTH;

  // Outer rectangle
  const shape = new THREE.Shape();
  shape.moveTo(outerHW, outerHL);
  shape.lineTo(-outerHW, outerHL);
  shape.lineTo(-outerHW, -outerHL);
  shape.lineTo(outerHW, -outerHL);
  shape.lineTo(outerHW, outerHL);

  // Inner rectangle (hole) - must go opposite direction
  const hole = new THREE.Path();
  hole.moveTo(innerHW, innerHL);
  hole.lineTo(innerHW, -innerHL);
  hole.lineTo(-innerHW, -innerHL);
  hole.lineTo(-innerHW, innerHL);
  hole.lineTo(innerHW, innerHL);

  shape.holes.push(hole);

  return shape;
}
