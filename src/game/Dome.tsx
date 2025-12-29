import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { DOME_LENGTH, DOME_WIDTH } from "./Field";

// Dome dimensions
const DOME_HEIGHT = 25;

// Attempt to replicate a squircle - this creates a rounded rectangle shape that transitions with the exponent
// see: https://en.wikipedia.org/wiki/Superellipse
function signedPow(base: number, exp: number): number {
  return Math.sign(base) * Math.pow(Math.abs(base), exp);
}

export function Dome() {
  // Create a rectangular dome that rounds as it goes up
  const domeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    const perimeterSegments = 96; // Segments around the perimeter
    const heightSegments = 32; // Segments from base to top
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // Generate vertices
    for (let h = 0; h <= heightSegments; h++) {
      const heightRatio = h / heightSegments;

      // Height follows a sine curve for dome shape
      const y = DOME_HEIGHT * Math.sin(heightRatio * Math.PI / 2);

      // The "roundness" exponent: starts rectangular (high n) at base, becomes round (n=2) at top
      // n=2 is ellipse, n>2 is more rectangular (superellipse)
      const baseExponent = 6; // More rectangular at base
      const topExponent = 2; // Circular at top
      const n = baseExponent + (topExponent - baseExponent) * heightRatio;

      // Scale factor - how much the perimeter shrinks as we go up
      const scale = Math.cos(heightRatio * Math.PI / 2);

      const halfWidth = (DOME_WIDTH / 2) * scale;
      const halfLength = (DOME_LENGTH / 2) * scale;

      for (let p = 0; p <= perimeterSegments; p++) {
        const u = p / perimeterSegments;
        const theta = u * Math.PI * 2;

        // Superellipse formula for rectangular-to-round shape
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Calculate radius at this angle using superellipse
        // |x/a|^n + |z/b|^n = 1, parameterized
        const px = halfWidth * signedPow(cosTheta, 2 / n);
        const pz = halfLength * signedPow(sinTheta, 2 / n);

        vertices.push(px, y, pz);

        // Calculate normal using gradient of superellipse
        // For superellipse: gradient is (n*|x|^(n-1)*sign(x)/a^n, 0, n*|z|^(n-1)*sign(z)/b^n)
        // Plus vertical component based on dome slope
        const eps = 0.001;
        const nx = Math.abs(cosTheta) > eps
          ? signedPow(cosTheta, 2 / n - 1) / halfWidth
          : 0;
        const nz = Math.abs(sinTheta) > eps
          ? signedPow(sinTheta, 2 / n - 1) / halfLength
          : 0;
        const ny = 0.5 * (1 - scale); // Upward component increases toward top

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        normals.push(nx / len, ny / len, nz / len);

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
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals(); // Recalculate for smooth shading

    return geometry;
  }, []);

  // Create base outline points (rectangular with rounded corners)
  const baseOutlinePoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const segments = 96;
    const n = 6; // Same as base exponent

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = (DOME_WIDTH / 2) * signedPow(Math.cos(theta), 2 / n);
      const z = (DOME_LENGTH / 2) * signedPow(Math.sin(theta), 2 / n);
      points.push([x, 0.1, z]);
    }

    return points;
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

      {/* Base platform/foundation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <shapeGeometry args={[createBaseShape()]} />
        <meshStandardMaterial color={0x444444} />
      </mesh>
    </group>
  );
}

// Create the base shape as a rounded rectangle
function createBaseShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const segments = 96;
  const n = 6;

  // Start at first point
  const startX = (DOME_WIDTH / 2) * signedPow(Math.cos(0), 2 / n);
  const startZ = (DOME_LENGTH / 2) * signedPow(Math.sin(0), 2 / n);
  shape.moveTo(startX, startZ);

  // Draw the superellipse outline
  for (let i = 1; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = (DOME_WIDTH / 2) * signedPow(Math.cos(theta), 2 / n);
    const z = (DOME_LENGTH / 2) * signedPow(Math.sin(theta), 2 / n);
    shape.lineTo(x, z);
  }

  // Create inner cutout for the ring effect
  const innerScale = 0.97;
  const hole = new THREE.Path();
  const innerStartX = (DOME_WIDTH / 2) * innerScale * signedPow(Math.cos(0), 2 / n);
  const innerStartZ = (DOME_LENGTH / 2) * innerScale * signedPow(Math.sin(0), 2 / n);
  hole.moveTo(innerStartX, innerStartZ);

  for (let i = 1; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = (DOME_WIDTH / 2) * innerScale * signedPow(Math.cos(theta), 2 / n);
    const z = (DOME_LENGTH / 2) * innerScale * signedPow(Math.sin(theta), 2 / n);
    hole.lineTo(x, z);
  }

  shape.holes.push(hole);

  return shape;
}
