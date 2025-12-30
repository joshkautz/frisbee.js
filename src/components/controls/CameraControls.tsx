/**
 * Camera controls component with keyboard panning.
 *
 * Provides orbit controls with WASD/arrow key panning within city bounds.
 *
 * @module components/controls/CameraControls
 */

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CITY_SIZE } from "@/constants";
import type { CameraControlsProps } from "@/types";

// Camera bounds (half the city size gives reasonable limits)
const CAMERA_BOUNDS = CITY_SIZE / 2 - 50;

/**
 * Camera controls with orbit and keyboard panning.
 *
 * Supports:
 * - Mouse orbit, zoom, and pan
 * - WASD/Arrow keys for camera panning
 * - Bounds clamping to stay within city limits
 */
export function CameraControls({
  minDistance = 40,
  maxDistance = 250,
  maxPolarAngle = Math.PI / 2.1,
}: CameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const { camera } = useThree();

  // Reusable vectors to avoid GC pressure
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  // Pan speed in units per second
  const panSpeed = 50;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        keysPressed.current.add(key);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    const keys = keysPressed.current;
    if (keys.size === 0) return;

    // Get camera's forward and right vectors (on XZ plane)
    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();

    right.current.crossVectors(forward.current, up.current).normalize();

    // Reset movement vector
    movement.current.set(0, 0, 0);
    const speed = panSpeed * delta;

    if (keys.has("w") || keys.has("arrowup")) {
      movement.current.addScaledVector(forward.current, speed);
    }
    if (keys.has("s") || keys.has("arrowdown")) {
      movement.current.addScaledVector(forward.current, -speed);
    }
    if (keys.has("a") || keys.has("arrowleft")) {
      movement.current.addScaledVector(right.current, -speed);
    }
    if (keys.has("d") || keys.has("arrowright")) {
      movement.current.addScaledVector(right.current, speed);
    }

    // Calculate new target position
    const newTargetX = controlsRef.current.target.x + movement.current.x;
    const newTargetZ = controlsRef.current.target.z + movement.current.z;

    // Clamp target within bounds
    const clampedX = THREE.MathUtils.clamp(
      newTargetX,
      -CAMERA_BOUNDS,
      CAMERA_BOUNDS
    );
    const clampedZ = THREE.MathUtils.clamp(
      newTargetZ,
      -CAMERA_BOUNDS,
      CAMERA_BOUNDS
    );

    // Calculate actual movement after clamping
    const actualMovementX = clampedX - controlsRef.current.target.x;
    const actualMovementZ = clampedZ - controlsRef.current.target.z;

    // Apply clamped movement to both camera and target
    camera.position.x += actualMovementX;
    camera.position.z += actualMovementZ;
    controlsRef.current.target.x = clampedX;
    controlsRef.current.target.z = clampedZ;
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolarAngle}
      target={[0, 0, 0]}
    />
  );
}
