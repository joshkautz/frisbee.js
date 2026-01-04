/**
 * Game state type definitions.
 *
 * Defines the types used for game phases, teams, and simulation state.
 *
 * @module types/game
 */

/**
 * Game phases in ultimate frisbee.
 *
 * - `pregame`: Before the game starts
 * - `pull`: Defensive team throws to offensive team
 * - `playing`: Active play
 * - `score`: After a score, brief celebration
 * - `turnover`: Possession change
 * - `halftime`: Between halves
 * - `endgame`: Game over
 */
export type GamePhase =
  | "pregame"
  | "pull"
  | "playing"
  | "score"
  | "turnover"
  | "halftime"
  | "endgame";

/**
 * Team identifier.
 */
export type Team = "home" | "away";

/**
 * Player role on the team.
 *
 * - `handler`: Primary disc handlers, typically near the disc
 * - `cutter`: Players who cut for passes downfield
 */
export type PlayerRole = "handler" | "cutter";

/**
 * AI behavior states for player decision-making.
 *
 * - `idle`: Standing still, waiting
 * - `cutting`: Running to get open for a pass
 * - `defending`: Guarding an opponent
 * - `throwing`: About to throw a quick pass during gameplay
 * - `catching`: Running to catch the disc
 * - `pulling`: Winding up for the initial pull throw (longer animation)
 */
export type AIState =
  | "idle"
  | "cutting"
  | "defending"
  | "throwing"
  | "catching"
  | "pulling";

/**
 * Attacking direction for each team.
 * 1 = attacking positive Z (toward away end zone)
 * -1 = attacking negative Z (toward home end zone)
 */
export interface AttackingDirection {
  home: 1 | -1;
  away: 1 | -1;
}

/**
 * Pull timing phases for frame-based timing.
 *
 * - `setup`: Waiting before animation starts
 * - `animating`: Animation playing, waiting for release point
 */
export type PullTimingPhase = "setup" | "animating";

/**
 * Pull timing state for frame-based timing.
 * Null when no pull timing is active.
 */
export interface PullTimingState {
  phase: PullTimingPhase;
  elapsed: number; // Elapsed simulation time in current phase (seconds)
}

/**
 * Celebration timing state for frame-based timing after a score.
 * Null when no celebration is active.
 */
export interface CelebrationTimingState {
  elapsed: number; // Elapsed simulation time (seconds)
  duration: number; // Total duration to wait (seconds)
  nextPossession: Team; // Team that gets possession after celebration
  nextPhase: GamePhase; // Phase to transition to (usually "pull")
  nextHalf?: 2; // If set, transition to second half
}

/**
 * Simulation state managed by Zustand store.
 * Includes both game state and simulation controls.
 */
export interface SimulationState {
  // Game state
  homeScore: number;
  awayScore: number;
  possession: Team;
  phase: GamePhase;
  gameTime: number;
  half: 1 | 2;

  // Game structure (USA Ultimate rules)
  pointsToWin: number;
  halftimeAt: number;
  attackingDirection: AttackingDirection;
  isGameOver: boolean;
  winner: Team | null;

  // Disc state
  discHeldBy: string | null;
  discInFlight: boolean;

  // Simulation controls
  isPaused: boolean;
  simulationSpeed: number;

  // Frame-based timing (replaces setTimeout)
  pullTiming: PullTimingState | null;
  celebrationTiming: CelebrationTimingState | null;

  // Actions
  score: (team: Team) => void;
  turnover: () => void;
  setPhase: (phase: GamePhase) => void;
  setDiscHolder: (playerId: string | null) => void;
  throwDisc: () => void;
  catchDisc: (playerId: string) => void;
  togglePause: () => void;
  setIsPaused: (paused: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  tick: (delta: number) => void;
  reset: () => void;

  // Pull timing actions
  startPullTiming: () => void;
  advancePullTiming: (delta: number) => PullTimingPhase | "complete" | null;
  clearPullTiming: () => void;

  // Celebration timing actions
  advanceCelebrationTiming: (delta: number) => "complete" | null;
  clearCelebrationTiming: () => void;
}
