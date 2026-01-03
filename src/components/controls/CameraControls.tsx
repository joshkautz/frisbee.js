/**
 * Camera controls using drei's OrbitControls with WASD target panning.
 *
 * Uses the battle-tested OrbitControls for rotation/zoom,
 * adds WASD movement of the orbit target point.
 *
 * @module components/controls/CameraControls
 */

import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { CameraControlsProps } from "@/types";

// Constants
const TARGET_BOUNDS = 80;
const PAN_SPEED = 40;
const MARKER_COLOR = 0xff4444;

// Valid movement keys
const MOVEMENT_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

// Shared materials for target marker (avoids recreation on each render)
const markerMaterials = {
  ring: new THREE.MeshBasicMaterial({
    color: MARKER_COLOR,
    transparent: true,
    opacity: 0.5,
  }),
  center: new THREE.MeshBasicMaterial({
    color: MARKER_COLOR,
    transparent: true,
    opacity: 0.7,
  }),
  line: new THREE.MeshBasicMaterial({
    color: MARKER_COLOR,
    transparent: true,
    opacity: 0.4,
  }),
};

// Target marker component - shows where the camera orbits around
function TargetMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <primitive object={markerMaterials.ring} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <primitive object={markerMaterials.center} attach="material" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <primitive object={markerMaterials.line} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * OrbitControls with WASD target panning.
 *
 * Behavior:
 * - Left-click + drag: Rotate camera around the target point (via OrbitControls)
 * - Scroll wheel: Zoom in/out (via OrbitControls)
 * - WASD / Arrow keys: Move the target point on the XZ plane
 */
export function CameraControls({
  minDistance = 30,
  maxDistance = 150,
  maxPolarAngle = Math.PI / 2.1,
}: CameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Target position for marker
  const [targetPos, setTargetPos] = useState<[number, number, number]>([
    0, 0, 0,
  ]);

  // Keyboard state
  const keysPressed = useRef(new Set<string>());

  // Reusable vectors
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  // Keyboard handlers for WASD panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (MOVEMENT_KEYS.has(key)) {
        keysPressed.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Update target position based on WASD input
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const keys = keysPressed.current;
    if (keys.size === 0) return;

    const speed = PAN_SPEED * (1 / 60);

    // Calculate forward direction on XZ plane (from camera toward target)
    forward.current
      .set(
        controls.target.x - camera.position.x,
        0,
        controls.target.z - camera.position.z
      )
      .normalize();

    // Calculate right direction (perpendicular to forward on XZ plane)
    right.current.set(-forward.current.z, 0, forward.current.x);

    let moveX = 0;
    let moveZ = 0;

    if (keys.has("w") || keys.has("arrowup")) {
      moveX += forward.current.x * speed;
      moveZ += forward.current.z * speed;
    }
    if (keys.has("s") || keys.has("arrowdown")) {
      moveX -= forward.current.x * speed;
      moveZ -= forward.current.z * speed;
    }
    if (keys.has("a") || keys.has("arrowleft")) {
      moveX -= right.current.x * speed;
      moveZ -= right.current.z * speed;
    }
    if (keys.has("d") || keys.has("arrowright")) {
      moveX += right.current.x * speed;
      moveZ += right.current.z * speed;
    }

    if (moveX === 0 && moveZ === 0) return;

    // Calculate clamped new position
    const newTargetX = THREE.MathUtils.clamp(
      controls.target.x + moveX,
      -TARGET_BOUNDS,
      TARGET_BOUNDS
    );
    const newTargetZ = THREE.MathUtils.clamp(
      controls.target.z + moveZ,
      -TARGET_BOUNDS,
      TARGET_BOUNDS
    );

    // Move camera by same delta to maintain orbit position
    const dx = newTargetX - controls.target.x;
    const dz = newTargetZ - controls.target.z;

    controls.target.x = newTargetX;
    controls.target.z = newTargetZ;
    camera.position.x += dx;
    camera.position.z += dz;

    // Update marker position
    setTargetPos([newTargetX, 0, newTargetZ]);
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={1}
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={maxPolarAngle}
        minPolarAngle={0.1}
        target={[0, 0, 0]}
      />
      <TargetMarker position={targetPos} />
    </>
  );
}
