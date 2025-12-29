import * as THREE from "three";

/**
 * Common type definitions used throughout the game
 */

// 3D position tuple
export type Position3D = [number, number, number];

// Player props
export interface PlayerProps {
  position: Position3D;
  color: number;
  velocity?: THREE.Vector3;
}

// Team props
export interface TeamProps {
  color: number;
  startZ: number;
}

// Disc props
export interface DiscProps {
  position: Position3D;
}

// Building props for city generation
export interface BuildingProps {
  position: Position3D;
  width: number;
  depth: number;
  height: number;
  color: number;
}

// Road props
export interface RoadProps {
  position: Position3D;
  width: number;
  length: number;
  rotation?: number;
}

// Street light props
export interface StreetLightProps {
  position: Position3D;
}
