/**
 * Simulation state management using Zustand.
 *
 * Manages game state, scores, possession, and simulation controls.
 * Uses subscribeWithSelector for granular React re-renders.
 *
 * @module stores/simulationStore
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  GamePhase,
  Team,
  SimulationState,
  AttackingDirection,
  PullTimingPhase,
  CelebrationTimingState,
} from "@/types";
import {
  SCORE_CELEBRATION_TIME,
  POINTS_TO_WIN,
  HALFTIME_POINTS,
  PULL_ANIMATION_DURATION,
} from "@/constants";
import { useCameraShake } from "@/hooks/useCameraShake";

// ============================================================================
// Pull Timing Constants (in seconds, for frame-based timing)
// ============================================================================

/** Delay before pull animation starts (seconds) */
const PULL_SETUP_DURATION = 0.5;

/** Pull release timing (disc leaves hand at 75% through animation) */
const PULL_RELEASE_PHASE = 0.75;

/** Time from animation start to disc release (seconds) */
const PULL_ANIMATION_TO_RELEASE = PULL_ANIMATION_DURATION * PULL_RELEASE_PHASE;

const INITIAL_STATE = {
  homeScore: 0,
  awayScore: 0,
  possession: "home" as Team,
  phase: "pull" as GamePhase,
  gameTime: 0,
  half: 1 as const,

  // Game structure (USA Ultimate rules)
  pointsToWin: POINTS_TO_WIN,
  halftimeAt: HALFTIME_POINTS,
  attackingDirection: { home: 1, away: -1 } as AttackingDirection,
  isGameOver: false,
  winner: null as Team | null,

  // Disc state
  discHeldBy: null,
  discInFlight: false,

  // Simulation controls
  isPaused: false,
  simulationSpeed: 1,

  // Frame-based timing
  pullTiming: null as { phase: PullTimingPhase; elapsed: number } | null,
  celebrationTiming: null as CelebrationTimingState | null,
};

export const useSimulationStore = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    score: (team: Team) => {
      const currentState = get();
      const newHomeScore =
        team === "home" ? currentState.homeScore + 1 : currentState.homeScore;
      const newAwayScore =
        team === "away" ? currentState.awayScore + 1 : currentState.awayScore;

      // Check for halftime (first team to reach halftimeAt points)
      const reachedHalftime =
        !currentState.isGameOver &&
        currentState.half === 1 &&
        ((team === "home" && newHomeScore === currentState.halftimeAt) ||
          (team === "away" && newAwayScore === currentState.halftimeAt));

      // Check for game over (first team to reach pointsToWin)
      const gameOver =
        newHomeScore >= currentState.pointsToWin ||
        newAwayScore >= currentState.pointsToWin;
      const winner = gameOver
        ? newHomeScore >= currentState.pointsToWin
          ? "home"
          : "away"
        : null;

      // Determine next phase
      let nextPhase: GamePhase = "score";
      if (gameOver) {
        nextPhase = "endgame";
      } else if (reachedHalftime) {
        nextPhase = "halftime";
      }

      set({
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        phase: nextPhase,
        discHeldBy: null,
        discInFlight: false,
        isGameOver: gameOver,
        winner,
        // Switch attacking directions after each score
        attackingDirection: {
          home: (currentState.attackingDirection.home * -1) as 1 | -1,
          away: (currentState.attackingDirection.away * -1) as 1 | -1,
        },
      });

      // Trigger strong camera shake for score
      useCameraShake.getState().shake("score");

      // Start frame-based celebration timing (unless game over)
      const nextPossession: Team = team === "home" ? "away" : "home";

      if (!gameOver && !reachedHalftime) {
        // Normal score - start celebration timer
        set({
          celebrationTiming: {
            elapsed: 0,
            duration: SCORE_CELEBRATION_TIME,
            nextPossession,
            nextPhase: "pull",
          },
        });
      } else if (reachedHalftime) {
        // Halftime - longer celebration, transition to second half
        set({
          celebrationTiming: {
            elapsed: 0,
            duration: SCORE_CELEBRATION_TIME * 2, // Longer delay for halftime
            nextPossession,
            nextPhase: "pull",
            nextHalf: 2,
          },
        });
      }
      // If game over, don't start celebration timing
    },

    turnover: () => {
      // Only update state - phase transition to "playing" is handled by
      // useSimulation after disc pickup to avoid race conditions
      set((state) => ({
        possession: state.possession === "home" ? "away" : "home",
        phase: "turnover",
        discInFlight: false,
      }));

      // Trigger medium camera shake for turnover
      useCameraShake.getState().shake("turnover");
    },

    setPhase: (phase: GamePhase) => set({ phase }),

    setDiscHolder: (playerId: string | null) =>
      set({
        discHeldBy: playerId,
        discInFlight: false,
      }),

    throwDisc: () =>
      set({
        discHeldBy: null,
        discInFlight: true,
      }),

    catchDisc: (playerId: string) => {
      const state = get();
      // Determine if catch is by same team or interception
      const playerTeam = playerId.startsWith("home") ? "home" : "away";

      if (playerTeam !== state.possession) {
        // Interception - turnover (use turnover shake instead)
        set({
          discHeldBy: playerId,
          discInFlight: false,
          possession: playerTeam,
          phase: "playing",
        });
        useCameraShake.getState().shake("turnover");
      } else {
        // Successful catch - light shake
        set({
          discHeldBy: playerId,
          discInFlight: false,
        });
        useCameraShake.getState().shake("catch");
      }
    },

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

    setIsPaused: (paused: boolean) => set({ isPaused: paused }),

    setSimulationSpeed: (speed: number) => set({ simulationSpeed: speed }),

    tick: (delta: number) => {
      const state = get();
      if (state.isPaused) return;

      set((state) => ({
        gameTime: state.gameTime + delta * state.simulationSpeed,
      }));
    },

    reset: () => {
      // Preserve simulation speed when resetting
      const currentSpeed = get().simulationSpeed;
      set({ ...INITIAL_STATE, simulationSpeed: currentSpeed });
    },

    // ========================================================================
    // Pull Timing Actions (frame-based timing)
    // ========================================================================

    startPullTiming: () => {
      set({ pullTiming: { phase: "setup", elapsed: 0 } });
    },

    advancePullTiming: (delta: number): PullTimingPhase | "complete" | null => {
      const state = get();
      if (!state.pullTiming || state.isPaused) return null;

      const scaledDelta = delta * state.simulationSpeed;
      const newElapsed = state.pullTiming.elapsed + scaledDelta;

      if (state.pullTiming.phase === "setup") {
        if (newElapsed >= PULL_SETUP_DURATION) {
          // Transition to animating phase
          set({
            pullTiming: {
              phase: "animating",
              elapsed: newElapsed - PULL_SETUP_DURATION,
            },
          });
          return "animating";
        }
        // Still in setup phase
        set({ pullTiming: { phase: "setup", elapsed: newElapsed } });
        return "setup";
      }

      if (state.pullTiming.phase === "animating") {
        if (newElapsed >= PULL_ANIMATION_TO_RELEASE) {
          // Pull timing complete - clear timing state
          set({ pullTiming: null });
          return "complete";
        }
        // Still animating
        set({ pullTiming: { phase: "animating", elapsed: newElapsed } });
        return "animating";
      }

      return null;
    },

    clearPullTiming: () => {
      set({ pullTiming: null });
    },

    // ========================================================================
    // Celebration Timing Actions (frame-based timing)
    // ========================================================================

    advanceCelebrationTiming: (delta: number): "complete" | null => {
      const state = get();
      if (!state.celebrationTiming || state.isPaused) return null;

      const scaledDelta = delta * state.simulationSpeed;
      const newElapsed = state.celebrationTiming.elapsed + scaledDelta;

      if (newElapsed >= state.celebrationTiming.duration) {
        // Celebration complete - apply the transition
        const { nextPossession, nextPhase, nextHalf } = state.celebrationTiming;

        set({
          celebrationTiming: null,
          possession: nextPossession,
          phase: nextPhase,
          ...(nextHalf ? { half: nextHalf } : {}),
        });

        return "complete";
      }

      // Still celebrating
      set({
        celebrationTiming: {
          ...state.celebrationTiming,
          elapsed: newElapsed,
        },
      });
      return null;
    },

    clearCelebrationTiming: () => {
      set({ celebrationTiming: null });
    },
  }))
);
