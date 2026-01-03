/**
 * Hook for calculating building transparency based on camera position.
 *
 * Buildings that would render on top of the dome become transparent
 * using screen-space bounding box intersection testing.
 *
 * @module hooks/useBuildingTransparency
 */

import type React from "react";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types";
import {
  lerp,
  projectBoxToScreen,
  boundsOverlap,
  createScreenBounds,
} from "@/utils";
import { DOME_WIDTH, DOME_LENGTH, DOME_HEIGHT } from "@/constants";

/** Target opacity when building is occluding the view */
const FADE_OPACITY = 0.15;

/** Speed of opacity transitions (higher = faster) */
const FADE_SPEED = 8;

/** Padding around dome bounds for more generous occlusion detection */
const DOME_PADDING = 10;

// Dome bounding box (centered at origin)
const domeBounds = new THREE.Box3(
  new THREE.Vector3(
    -DOME_WIDTH / 2 - DOME_PADDING,
    0,
    -DOME_LENGTH / 2 - DOME_PADDING
  ),
  new THREE.Vector3(
    DOME_WIDTH / 2 + DOME_PADDING,
    DOME_HEIGHT + DOME_PADDING,
    DOME_LENGTH / 2 + DOME_PADDING
  )
);

// Reusable objects to avoid allocations
const _buildingBox = new THREE.Box3();
const _screenBoundsA = createScreenBounds();
const _screenBoundsB = createScreenBounds();
const _buildingMin = new THREE.Vector3();
const _buildingMax = new THREE.Vector3();
const _buildingCenter = new THREE.Vector3();
const _domeCenter = new THREE.Vector3(0, DOME_HEIGHT / 2, 0);

/**
 * Calculate building transparency based on screen-space occlusion.
 *
 * Projects both dome and building bounding boxes to screen space
 * and checks if they overlap. Buildings that overlap the dome's
 * screen projection will fade out.
 *
 * @param position - Building world position [x, y, z]
 * @param width - Building width
 * @param height - Building height
 * @param depth - Building depth
 * @returns Ref containing current opacity (read in useFrame for live values)
 */
export function useBuildingTransparency(
  position: Vector3Tuple,
  width: number = 10,
  height: number = 20,
  depth: number = 10
): React.MutableRefObject<number> {
  const { camera } = useThree();
  const opacityRef = useRef(1);

  useFrame((_, delta) => {
    // Create building bounding box using reusable vectors
    _buildingMin.set(
      position[0] - width / 2,
      position[1],
      position[2] - depth / 2
    );
    _buildingMax.set(
      position[0] + width / 2,
      position[1] + height,
      position[2] + depth / 2
    );
    _buildingBox.set(_buildingMin, _buildingMax);

    // Project dome bounds to screen
    const domeVisible = projectBoxToScreen(domeBounds, camera, _screenBoundsA);

    // Project building bounds to screen
    const buildingVisible = projectBoxToScreen(
      _buildingBox,
      camera,
      _screenBoundsB
    );

    // Check if building is in front of dome (closer to camera)
    _buildingCenter.set(position[0], position[1] + height / 2, position[2]);
    const cameraPos = camera.position;

    const distToBuilding = cameraPos.distanceTo(_buildingCenter);
    const distToDome = cameraPos.distanceTo(_domeCenter);
    const buildingCloser = distToBuilding < distToDome;

    // Building occludes if:
    // 1. Both are visible on screen
    // 2. Their screen projections overlap
    // 3. Building is closer to camera than dome
    const isOccluding =
      domeVisible &&
      buildingVisible &&
      buildingCloser &&
      boundsOverlap(_screenBoundsA, _screenBoundsB);

    // Calculate target opacity
    const targetOpacity = isOccluding ? FADE_OPACITY : 1;

    // Smoothly interpolate toward target
    opacityRef.current = lerp(
      opacityRef.current,
      targetOpacity,
      Math.min(1, delta * FADE_SPEED)
    );
  });

  return opacityRef;
}
