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
import type { GamePhase, Team, SimulationState } from "@/types";
import { SCORE_CELEBRATION_TIME } from "@/constants";
import { useCameraShake } from "@/hooks/useCameraShake";

const INITIAL_STATE = {
  homeScore: 0,
  awayScore: 0,
  possession: "home" as Team,
  phase: "pull" as GamePhase,
  gameTime: 0,
  half: 1 as const,
  discHeldBy: null,
  discInFlight: false,
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
      set((state) => ({
        homeScore: team === "home" ? state.homeScore + 1 : state.homeScore,
        awayScore: team === "away" ? state.awayScore + 1 : state.awayScore,
        phase: "score",
        discHeldBy: null,
        discInFlight: false,
      }));

      // Trigger strong camera shake for score
      useCameraShake.getState().shake("score");

      // After celebration, switch possession and go to pull
      scheduleTimeout(() => {
        set({
          possession: team === "home" ? "away" : "home",
          phase: "pull",
        });
      }, SCORE_CELEBRATION_TIME * 1000);
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
