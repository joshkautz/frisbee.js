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
} from "@/types";
import {
  SCORE_CELEBRATION_TIME,
  POINTS_TO_WIN,
  HALFTIME_POINTS,
} from "@/constants";
import { useCameraShake } from "@/hooks/useCameraShake";

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
};

// Store pending timeouts for cleanup
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

function scheduleTimeout(callback: () => void, delay: number) {
  const id = setTimeout(() => {
    pendingTimeouts.delete(id);
    callback();
  }, delay);
  pendingTimeouts.add(id);
  return id;
}

function clearAllTimeouts() {
  pendingTimeouts.forEach((id) => clearTimeout(id));
  pendingTimeouts.clear();
}

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

      // After celebration, switch possession and go to pull (unless game over or halftime)
      if (!gameOver && !reachedHalftime) {
        scheduleTimeout(() => {
          set({
            possession: team === "home" ? "away" : "home",
            phase: "pull",
          });
        }, SCORE_CELEBRATION_TIME * 1000);
      } else if (reachedHalftime) {
        // Halftime: switch sides and possession, then go to pull after delay
        scheduleTimeout(() => {
          set({
            half: 2,
            possession: team === "home" ? "away" : "home",
            phase: "pull",
          });
        }, SCORE_CELEBRATION_TIME * 2000); // Longer delay for halftime
      }
      // If game over, don't schedule any transition
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
      // Clear all pending timeouts before resetting
      clearAllTimeouts();
      set(INITIAL_STATE);
    },
  }))
);
