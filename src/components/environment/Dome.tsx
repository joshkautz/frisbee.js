import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import {
  DOME_LENGTH,
  DOME_WIDTH,
  DOME_HEIGHT,
  DOME_FOUNDATION_WIDTH,
  DOME_FABRIC_COLOR,
  DOME_FRAME_COLOR,
  DOME_OUTLINE_COLOR,
  DOME_FOUNDATION_COLOR,
} from "@/constants";
import { getPointOnPerimeter, generateAnglesWithCorners } from "@/utils";

export function Dome() {
  const domeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    const segmentsPerSide = 32;
    const heightSegments = 32;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const baseAngles = generateAnglesWithCorners(
      segmentsPerSide,
      DOME_WIDTH / 2,
      DOME_LENGTH / 2
    );
    const perimeterSegments = baseAngles.length - 1;

    for (let h = 0; h <= heightSegments; h++) {
      const heightRatio = h / heightSegments;
      const y = DOME_HEIGHT * Math.sin((heightRatio * Math.PI) / 2);
      const rectangleWeight = Math.pow(1 - heightRatio, 2);
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

  const baseOutlinePoints = useMemo(() => {
    const hw = DOME_WIDTH / 2;
    const hl = DOME_LENGTH / 2;
    const y = 0.1;

    return [
      [hw, y, hl],
      [-hw, y, hl],
      [-hw, y, -hl],
      [hw, y, -hl],
      [hw, y, hl],
    ] as [number, number, number][];
  }, []);

  const foundationShape = useMemo(() => {
    const outerHW = DOME_WIDTH / 2;
    const outerHL = DOME_LENGTH / 2;
    const innerHW = outerHW - DOME_FOUNDATION_WIDTH;
    const innerHL = outerHL - DOME_FOUNDATION_WIDTH;

    const shape = new THREE.Shape();
    shape.moveTo(outerHW, outerHL);
    shape.lineTo(-outerHW, outerHL);
    shape.lineTo(-outerHW, -outerHL);
    shape.lineTo(outerHW, -outerHL);
    shape.lineTo(outerHW, outerHL);

    const hole = new THREE.Path();
    hole.moveTo(innerHW, innerHL);
    hole.lineTo(innerHW, -innerHL);
    hole.lineTo(-innerHW, -innerHL);
    hole.lineTo(-innerHW, innerHL);
    hole.lineTo(innerHW, innerHL);

    shape.holes.push(hole);

    return shape;
  }, []);

  return (
    <group>
      {/* Main dome fabric */}
      <mesh geometry={domeGeometry}>
        <meshStandardMaterial
          color={DOME_FABRIC_COLOR}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dome frame/ribs */}
      <mesh geometry={domeGeometry}>
        <meshStandardMaterial
          color={DOME_FRAME_COLOR}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Base outline */}
      <Line points={baseOutlinePoints} color={DOME_OUTLINE_COLOR} lineWidth={2} />

      {/* Foundation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <shapeGeometry args={[foundationShape]} />
        <meshStandardMaterial color={DOME_FOUNDATION_COLOR} />
      </mesh>
    </group>
  );
}
