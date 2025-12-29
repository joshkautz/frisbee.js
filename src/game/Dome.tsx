import { useMemo } from "react";
import * as THREE from "three";
import { DOME_LENGTH, DOME_WIDTH } from "./Field";

// Dome dimensions
const DOME_HEIGHT = 25;

export function Dome() {
  // Create an elongated dome shape (like an inflatable sports dome)
  const domeGeometry = useMemo(() => {
    // Create a custom shape using a half-ellipsoid stretched along Z
    const geometry = new THREE.BufferGeometry();

    const widthSegments = 48;
    const heightSegments = 24;
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // Generate vertices for an elongated dome
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const phi = (v * Math.PI) / 2; // Only top half (0 to PI/2)

      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const theta = u * Math.PI * 2;

        // Elongated ellipsoid formula
        const px = (DOME_WIDTH / 2) * Math.cos(theta) * Math.cos(phi);
        const py = DOME_HEIGHT * Math.sin(phi);
        const pz = (DOME_LENGTH / 2) * Math.sin(theta) * Math.cos(phi);

        vertices.push(px, py, pz);

        // Calculate normal
        const nx = (2 * px) / (DOME_WIDTH * DOME_WIDTH / 4);
        const ny = (2 * py) / (DOME_HEIGHT * DOME_HEIGHT);
        const nz = (2 * pz) / (DOME_LENGTH * DOME_LENGTH / 4);
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals.push(nx / len, ny / len, nz / len);

        uvs.push(u, v);
      }
    }

    // Generate indices
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * (widthSegments + 1) + x;
        const b = a + widthSegments + 1;
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

    return geometry;
  }, []);

  return (
    <group>
      {/* Main dome structure - semi-transparent white fabric */}
      <mesh geometry={domeGeometry}>
        <meshStandardMaterial
          color={0xffffff}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dome frame/ribs for structure visibility */}
      <mesh geometry={domeGeometry}>
        <meshStandardMaterial
          color={0xe8e8e8}
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Base ring of the dome */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[DOME_WIDTH / 2 - 0.5, DOME_WIDTH / 2, 64]} />
        <meshStandardMaterial color={0x444444} />
      </mesh>
    </group>
  );
}
