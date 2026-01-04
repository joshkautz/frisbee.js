/**
 * Simulation loop hook.
 *
 * Manages game initialization, the pull throw to start each point,
 * AI player behavior, and disc physics updates.
 *
 * Uses frame-based timing instead of setTimeout for proper simulation speed
 * support and pause-awareness.
 *
 * @module hooks/useSimulation
 */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimulationStore } from "@/stores";
import {
  initializeEntities,
  clearEntities,
  allPlayers,
  disc,
  awayPlayers,
} from "@/ecs";
import {
  updateDiscFlight,
  throwDisc,
  giveDiscTo,
  updateDiscToFollowHolder,
  updateAI,
  handleDiscThrow,
  executePull,
  updateStallCount,
  resetStallCount,
} from "@/systems";
import { distanceSquared2D } from "@/utils";

// ============================================================================
// Constants
// ============================================================================

/** Player ID for the designated puller (home team player 4) */
const PULLER_ID = "home-4";

// ============================================================================
// Pull Execution
// ============================================================================

/**
 * Find the player closest to a target position.
 *
 * @param targetX - Target X position
 * @param targetZ - Target Z position
 * @param players - Array of player entities to search
 * @returns The closest player entity, or null if none found
 */
function findClosestPlayer(
  targetX: number,
  targetZ: number,
  players: typeof awayPlayers.entities
): (typeof players)[number] | null {
  let closest: (typeof players)[number] | null = null;
  let closestDistSq = Infinity;

  const targetPos = { x: targetX, y: 0, z: targetZ };

  for (const player of players) {
    const distSq = distanceSquared2D(player.position, targetPos);
    if (distSq < closestDistSq) {
      closestDistSq = distSq;
      closest = player;
    }
  }

  return closest;
}

/**
 * Execute the pull throw to start a point.
 *
 * 1. Gets the puller's actual hand position for exact trajectory calculation
 * 2. Calculates the pull trajectory to a random endzone position
 * 3. Designates the closest receiving team player to catch the pull
 * 4. Throws the disc with the calculated velocity
 *
 * The designated pull receiver will be the only player who chases the disc.
 * Other players on the receiving team will set up offensive positions.
 */
function performPull(): void {
  // Find the puller to get their actual hand position
  let pullerHandPosition: { x: number; y: number; z: number } | undefined;
  for (const player of allPlayers) {
    if (player.id === PULLER_ID && player.handWorldPosition) {
      pullerHandPosition = { ...player.handWorldPosition };
      break;
    }
  }

  // Calculate trajectory using actual hand position for exact accuracy
  const pullData = executePull(pullerHandPosition);
  const discEntity = disc.first;

  if (discEntity?.disc) {
    // Set the disc's target position for visualization
    const targetPosition = {
      x: pullData.targetX,
      y: 0,
      z: pullData.targetZ,
    };
    discEntity.disc.targetPosition = targetPosition;

    // Find the closest player on the receiving team (away team receives the pull)
    // Skip if debug flag is set (allows testing disc landing on ground)
    const disablePullCatch = (
      window as unknown as { disablePullCatch?: boolean }
    ).disablePullCatch;

    if (!disablePullCatch) {
      const receivingTeam = awayPlayers.entities;
      const pullReceiver = findClosestPlayer(
        pullData.targetX,
        pullData.targetZ,
        receivingTeam
      );

      // Designate this player as the pull receiver
      discEntity.disc.pullReceiverId = pullReceiver?.id ?? null;

      // Immediately set the receiver's AI to run toward the landing spot
      // (don't wait for their decision timer to expire)
      if (pullReceiver?.ai) {
        pullReceiver.ai.state = "catching";
        pullReceiver.ai.targetPosition = { ...targetPosition };
        pullReceiver.ai.decision = 0; // Force immediate re-evaluation after catch
      }
    }
  }

  // Execute the throw
  throwDisc({ x: pullData.x, y: pullData.y, z: pullData.z }, null);

  // Transition to playing phase
  useSimulationStore.getState().setPhase("playing");
}

/**
 * Set the puller's AI state to "pulling" to trigger the wind-up animation.
 */
function startPullAnimation(): void {
  for (const player of allPlayers) {
    if (player.id === PULLER_ID && player.ai) {
      player.ai.state = "pulling";
      return;
    }
  }
}

/**
 * Restart the current point - resets all entities and starts a new pull.
 *
 * Uses frame-based timing through the store's pullTiming state, which is
 * advanced each frame in useFrame. This ensures:
 * - Timing respects simulation speed changes dynamically
 * - Timing pauses when game is paused
 * - No cleanup needed (no dangling timeouts)
 */
function restartPoint(): void {
  const store = useSimulationStore.getState();

  // Reset simulation store to initial state
  store.reset();

  // Recreate all entities (creates fresh disc with clean state)
  initializeEntities();

  // Give disc to puller (giveDiscTo also resets disc flight state)
  giveDiscTo(PULLER_ID);

  // Start frame-based pull timing (will be advanced in useFrame)
  store.startPullTiming();
}

// ============================================================================
// Global API
// ============================================================================

// Expose restart function globally for UI/debugging
declare global {
  interface Window {
    restartThrow?: () => void;
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook that manages the complete simulation loop.
 *
 * Responsibilities:
 * - Initialize game entities on mount
 * - Manage pull timing using frame-based accumulators
 * - Update disc physics each frame
 * - Run AI for player movement and decisions
 * - Handle throw execution when AI decides to throw
 *
 * @returns Current game state (phase, possession, isPaused)
 */
export function useSimulation() {
  const phase = useSimulationStore((s) => s.phase);
  const possession = useSimulationStore((s) => s.possession);
  const isPaused = useSimulationStore((s) => s.isPaused);
  const reset = useSimulationStore((s) => s.reset);
  const startPullTiming = useSimulationStore((s) => s.startPullTiming);
  const clearPullTiming = useSimulationStore((s) => s.clearPullTiming);

  // Track previous pull timing phase to detect transitions
  const prevPullPhaseRef = useRef<string | null>(null);

  // Initialize entities and start pull timing on mount
  useEffect(() => {
    initializeEntities();
    giveDiscTo(PULLER_ID);

    // Expose restart function for UI
    window.restartThrow = restartPoint;

    // Start frame-based pull timing (will be advanced in useFrame)
    startPullTiming();

    return () => {
      delete window.restartThrow;
      clearPullTiming();
      clearEntities();
      reset();
    };
  }, [reset, startPullTiming, clearPullTiming]);

  // Game loop - runs every frame
  useFrame((_, delta) => {
    const state = useSimulationStore.getState();
    if (state.isPaused) return;

    // ========================================================================
    // Game Clock
    // ========================================================================
    state.tick(delta);

    // ========================================================================
    // Pull Timing (frame-based)
    // ========================================================================
    // Advance pull timing and react to phase transitions
    const pullPhase = state.advancePullTiming(delta);

    // Detect transition to "animating" phase - start pull animation
    if (pullPhase === "animating" && prevPullPhaseRef.current === "setup") {
      startPullAnimation();
    }

    // Detect completion - execute the pull
    if (pullPhase === "complete") {
      performPull();
    }

    prevPullPhaseRef.current = pullPhase;

    // ========================================================================
    // Celebration Timing (frame-based)
    // ========================================================================
    // Advance celebration timing after scores
    // When complete, the store automatically transitions phase and possession
    state.advanceCelebrationTiming(delta);

    // ========================================================================
    // Disc Physics
    // ========================================================================
    // Update disc physics when in flight, otherwise follow holder
    if (state.discInFlight) {
      updateDiscFlight(delta);
    } else {
      updateDiscToFollowHolder();
    }

    // ========================================================================
    // AI and Gameplay
    // ========================================================================
    // Run AI during active gameplay phases (pull, playing, turnover)
    // Only pause AI during score celebration or pregame
    const activePhases = ["pull", "playing", "turnover"];
    if (activePhases.includes(state.phase)) {
      // Always update AI (players move whether disc is in flight or not)
      updateAI(delta);

      // During turnover, check if a player can pick up the grounded disc
      if (state.phase === "turnover" && !state.discInFlight) {
        const discEntity = disc.first;
        if (discEntity) {
          // Check if any player on the new possession team is close to disc
          for (const player of allPlayers) {
            if (player.player?.team !== state.possession) continue;

            const dx = player.position.x - discEntity.position.x;
            const dz = player.position.z - discEntity.position.z;
            const distSq = dx * dx + dz * dz;

            // Pickup radius: 1.5m
            if (distSq < 2.25) {
              giveDiscTo(player.id);
              useSimulationStore.getState().setPhase("playing");
              break;
            }
          }
        }
      }

      // When disc is not in flight, check if holder wants to throw
      if (state.phase === "playing" && !state.discInFlight) {
        // Update stall count (marker counting when near thrower)
        updateStallCount(delta);

        for (const player of allPlayers) {
          if (player.ai?.state === "throwing" && player.player?.hasDisc) {
            const throwResult = handleDiscThrow();
            if (throwResult) {
              // Set disc target for visualization
              const discEntity = disc.first;
              if (discEntity?.disc) {
                discEntity.disc.targetPosition = throwResult.targetPosition;
              }
              // Reset stall count on throw
              resetStallCount();
              // Execute the throw
              throwDisc(throwResult.velocity, throwResult.target);
            }
            // Reset AI state after throw attempt
            player.ai.state = "idle";
            break;
          }
        }
      }
    }
  });

  return { phase, possession, isPaused };
}
