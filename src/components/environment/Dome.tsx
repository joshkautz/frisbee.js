/**
 * Dome component with distance-based transparency.
 *
 * The dome becomes more transparent as the camera gets closer,
 * allowing players to see inside when zoomed in.
 *
 * @module components/environment/Dome
 */

import { useMemo, useRef, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
import { getPointOnPerimeter, generateAnglesWithCorners, lerp } from "@/utils";
import { useReducedMotion, useDisposableMany } from "@/hooks";

/** Zoom level (camera distance from target) at which dome is most transparent */
const MIN_ZOOM = 40;

/** Zoom level at which dome is least transparent */
const MAX_ZOOM = 200;

/** Opacity when zoomed in close (invisible) */
const ZOOMED_IN_OPACITY_FABRIC = 0;
const ZOOMED_IN_OPACITY_FRAME = 0;

/** Opacity when zoomed out far (fully visible) */
const ZOOMED_OUT_OPACITY_FABRIC = 1.0;
const ZOOMED_OUT_OPACITY_FRAME = 0.4;

/** Speed of opacity transitions */
const OPACITY_LERP_SPEED = 8;

// Foundation material is not transparent
const foundationMaterial = new THREE.MeshStandardMaterial({
  color: DOME_FOUNDATION_COLOR,
});

export const Dome = memo(function Dome() {
  const { camera } = useThree();
  const prefersReducedMotion = useReducedMotion();

  // Create per-instance materials for dynamic opacity
  const fabricMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: DOME_FABRIC_COLOR,
        transparent: true,
        opacity: ZOOMED_OUT_OPACITY_FABRIC,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: DOME_FRAME_COLOR,
        wireframe: true,
        transparent: true,
        opacity: ZOOMED_OUT_OPACITY_FRAME,
      }),
    []
  );

  // Refs for smooth opacity interpolation
  const currentFabricOpacity = useRef(ZOOMED_OUT_OPACITY_FABRIC);
  const currentFrameOpacity = useRef(ZOOMED_OUT_OPACITY_FRAME);

  // Update opacity based on zoom level (camera distance from focus point)
  useFrame((_, delta) => {
    // Zoom level = distance from camera to origin (the focus target)
    // OrbitControls target starts at [0,0,0] which is center of field
    const zoomLevel = camera.position.length();

    // Calculate interpolation factor (0 = zoomed in, 1 = zoomed out)
    const t = Math.max(
      0,
      Math.min(1, (zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM))
    );

    // When zoomed in (t=0): nearly invisible
    // When zoomed out (t=1): clearly visible
    const targetFabricOpacity =
      ZOOMED_IN_OPACITY_FABRIC +
      t * (ZOOMED_OUT_OPACITY_FABRIC - ZOOMED_IN_OPACITY_FABRIC);
    const targetFrameOpacity =
      ZOOMED_IN_OPACITY_FRAME +
      t * (ZOOMED_OUT_OPACITY_FRAME - ZOOMED_IN_OPACITY_FRAME);

    // Smoothly interpolate toward target (skip animation if reduced motion preferred)
    if (prefersReducedMotion) {
      currentFabricOpacity.current = targetFabricOpacity;
      currentFrameOpacity.current = targetFrameOpacity;
    } else {
      currentFabricOpacity.current = lerp(
        currentFabricOpacity.current,
        targetFabricOpacity,
        Math.min(1, delta * OPACITY_LERP_SPEED)
      );
      currentFrameOpacity.current = lerp(
        currentFrameOpacity.current,
        targetFrameOpacity,
        Math.min(1, delta * OPACITY_LERP_SPEED)
      );
    }

    // Apply to materials
    fabricMaterial.opacity = currentFabricOpacity.current;
    frameMaterial.opacity = currentFrameOpacity.current;
  });

  // Cleanup materials on unmount
  useDisposableMany(
    [fabricMaterial, frameMaterial],
    [fabricMaterial, frameMaterial]
  );

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
        <primitive object={fabricMaterial} attach="material" />
      </mesh>

      {/* Dome frame/ribs */}
      <mesh geometry={domeGeometry}>
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Base outline */}
      <Line
        points={baseOutlinePoints}
        color={DOME_OUTLINE_COLOR}
        lineWidth={2}
      />

      {/* Foundation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <shapeGeometry args={[foundationShape]} />
        <primitive object={foundationMaterial} attach="material" />
      </mesh>
    </group>
  );
});
