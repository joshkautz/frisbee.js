/**
 * ECS (Entity-Component-System) world and entity definitions.
 *
 * Uses miniplex for entity management with React integration.
 * Defines all entity component types and provides factory functions
 * for creating players and the disc.
 *
 * @module ecs/world
 */

import { World } from "miniplex";
import { createReactAPI } from "miniplex-react";
import * as THREE from "three";
import type { RapierRigidBody } from "@react-three/rapier";
import type { Vector3Object, Team, PlayerRole, AIState } from "@/types";

/**
 * ECS Component Types
 */

/** Position component - alias for Vector3Object */
export type Position = Vector3Object;

/** Velocity component - alias for Vector3Object */
export type Velocity = Vector3Object;

/** Player component with team and role information */
export interface PlayerComponent {
  team: Team;
  number: number;
  role: PlayerRole;
  hasDisc: boolean;
}

/** Disc component tracking flight state */
export interface DiscComponent {
  inFlight: boolean;
  targetPosition: Position | null;
  flightTime: number;
  /** ID of the player who threw the disc (cannot catch their own throw) */
  thrownBy: string | null;
}

/** AI component for player behavior and decision-making */
export interface AIComponent {
  state: AIState;
  targetPosition: Position | null;
  reactionTime: number;
  decision: number;
}

/** Reference to physics rigid body for collision detection */
export interface PhysicsRef {
  rigidBody: RapierRigidBody | null;
}

/** Reference to Three.js mesh for rendering */
export interface MeshRef {
  mesh: THREE.Group | null;
}

/**
 * Entity type combining all possible components
 */
export type Entity = {
  id: string;
  position: Position;
  velocity?: Velocity;
  player?: PlayerComponent;
  disc?: DiscComponent;
  ai?: AIComponent;
  physicsRef?: PhysicsRef;
  meshRef?: MeshRef;
};

/**
 * The ECS world instance
 */
export const world = new World<Entity>();

/**
 * React API for miniplex integration.
 * Provides <ECS.Entities> component for reactive rendering.
 */
export const ECS = createReactAPI(world);

/**
 * Pre-defined queries for common entity sets
 */
export const allPlayers = world.with("player", "position", "ai");
export const homePlayers = world.where(
  (e) => e.player !== undefined && e.player.team === "home"
);
export const awayPlayers = world.where(
  (e) => e.player !== undefined && e.player.team === "away"
);
export const disc = world.with("disc", "position");

/**
 * Type Guards for Entity Components
 *
 * These predicates enable TypeScript to narrow Entity types
 * based on component presence, eliminating need for non-null assertions.
 */

/** Type guard: Entity has player component */
export function isPlayer(
  entity: Entity
): entity is Entity & { player: PlayerComponent; ai: AIComponent } {
  return entity.player !== undefined && entity.ai !== undefined;
}

/** Type guard: Entity is the disc */
export function isDisc(
  entity: Entity
): entity is Entity & { disc: DiscComponent; velocity: Velocity } {
  return entity.disc !== undefined && entity.velocity !== undefined;
}

/** Type guard: Entity has physics rigid body */
export function hasPhysics(
  entity: Entity
): entity is Entity & { physicsRef: PhysicsRef } {
  return (
    entity.physicsRef !== undefined && entity.physicsRef.rigidBody !== null
  );
}

/**
 * Create a player entity with all required components.
 *
 * @param team - Which team the player belongs to
 * @param number - Player jersey number
 * @param role - Player role (handler or cutter)
 * @param x - Initial X position
 * @param z - Initial Z position
 * @returns The created entity
 */
export function createPlayer(
  team: Team,
  number: number,
  role: PlayerRole,
  x: number,
  z: number
): Entity {
  const id = `${team}-${number}`;
  const entity: Entity = {
    id,
    position: { x, y: 0, z },
    velocity: { x: 0, y: 0, z: 0 },
    player: {
      team,
      number,
      role,
      hasDisc: false,
    },
    ai: {
      state: "idle",
      targetPosition: null,
      reactionTime: 0.1 + Math.random() * 0.2,
      decision: 0,
    },
    physicsRef: { rigidBody: null },
    meshRef: { mesh: null },
  };

  world.add(entity);
  return entity;
}

/**
 * Create the disc entity
 */
export function createDisc(x: number, y: number, z: number): Entity {
  const entity: Entity = {
    id: "disc",
    position: { x, y, z },
    velocity: { x: 0, y: 0, z: 0 },
    disc: {
      inFlight: false,
      targetPosition: null,
      flightTime: 0,
      thrownBy: null,
    },
    physicsRef: { rigidBody: null },
    meshRef: { mesh: null },
  };

  world.add(entity);
  return entity;
}

/**
 * Registry for disposable Three.js resources (materials, geometries).
 * Resources are disposed during HMR cleanup to prevent memory leaks.
 */
interface Disposable {
  dispose: () => void;
}
const disposableResources = new Set<Disposable>();

export function registerDisposable(resource: Disposable): void {
  disposableResources.add(resource);
}

/**
 * Clear all entities and dispose registered resources.
 * Called during HMR and game reset.
 */
export function clearEntities(): void {
  const entities = [...world.entities];
  for (const entity of entities) {
    world.remove(entity);
  }

  // Dispose registered resources
  disposableResources.forEach((resource) => {
    try {
      resource.dispose();
    } catch {
      // Ignore disposal errors
    }
  });
  disposableResources.clear();
}

/**
 * Initialize all entities for a new game.
 * Creates 7 players per team lined up on their end zone lines.
 */
export function initializeEntities(): void {
  clearEntities();

  // Field width is 37m, so players spread from -15 to +15 (every 5m)
  const xPositions = [-15, -10, -5, 0, 5, 10, 15];

  // Home team (blue) - lined up on their end zone line (z = -32)
  const homeZ = -32;
  for (let i = 0; i < 7; i++) {
    createPlayer(
      "home",
      i + 1,
      i < 3 ? "handler" : "cutter",
      xPositions[i],
      homeZ
    );
  }

  // Away team (red) - lined up on their end zone line (z = +32)
  const awayZ = 32;
  for (let i = 0; i < 7; i++) {
    createPlayer(
      "away",
      i + 1,
      i < 3 ? "handler" : "cutter",
      xPositions[i],
      awayZ
    );
  }

  // Disc starts with home player #4 (center of the line)
  createDisc(0, 1, homeZ);
}
