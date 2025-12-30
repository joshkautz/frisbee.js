// World and React API
export { world, ECS } from "./world";

// Queries
export { allPlayers, homePlayers, awayPlayers, disc } from "./world";

// Entity factories
export {
  createPlayer,
  createDisc,
  initializeEntities,
  clearEntities,
} from "./world";

// Resource management
export { registerDisposable } from "./world";

// Types
export type {
  Entity,
  Position,
  Velocity,
  PlayerComponent,
  DiscComponent,
  AIComponent,
  PhysicsRef,
  MeshRef,
} from "./world";
