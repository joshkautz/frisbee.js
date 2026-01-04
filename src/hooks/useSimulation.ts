/**
 * Simulation loop hook.
 *
 * Manages game initialization, the pull throw to start each point,
 * AI player behavior, and disc physics updates.
 *
 * @module hooks/useSimulation
 */

import { useEffect } from "react";
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
import { PULL_ANIMATION_DURATION } from "@/constants";

// ============================================================================
// Constants
// ============================================================================

/** Delay before pull animation starts (allows players to set up) */
const PULL_SETUP_DELAY_MS = 500;

/** Pull release timing (disc leaves hand at 75% through animation) */
const PULL_RELEASE_PHASE = 0.75;

/** Time from animation start to disc release (in milliseconds) */
const PULL_RELEASE_DELAY_MS =
  PULL_ANIMATION_DURATION * PULL_RELEASE_PHASE * 1000;

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
 * 1. Calculates the pull trajectory to a random endzone position
 * 2. Designates the closest receiving team player to catch the pull
 * 3. Throws the disc with the calculated velocity
 *
 * The designated pull receiver will be the only player who chases the disc.
 * Other players on the receiving team will set up offensive positions.
 */
function performPull(): void {
  const pullData = executePull();
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

  // Execute the throw
  throwDisc({ x: pullData.x, y: pullData.y, z: pullData.z }, null);
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
 * Restart the current point - resets all entities and performs a new pull.
 *
 * Sequence:
 * 1. Reset Zustand store to initial state
 * 2. Clear and recreate all ECS entities
 * 3. Give disc to designated puller (resets disc flight state)
 * 4. Start pull animation after setup delay
 * 5. Execute pull throw at animation release point
 *
 * Note: The nested setTimeout calls are not tracked for cleanup. This is
 * acceptable because restartPoint is only called from user actions (not
 * automatically), and the timeouts complete quickly (~1.5s total). In
 * development, HMR may cause brief state inconsistency if triggered during
 * the timeout window, but this has no production impact.
 *
 * @param setPhase - Function to update the game phase
 */
function restartPoint(setPhase: (phase: "pull" | "playing") => void): void {
  // Reset simulation store to initial state
  useSimulationStore.getState().reset();

  // Recreate all entities (creates fresh disc with clean state)
  initializeEntities();

  // Give disc to puller (giveDiscTo also resets disc flight state)
  giveDiscTo(PULLER_ID);

  // Start the pull animation after setup delay
  setTimeout(() => {
    startPullAnimation();

    // Release the disc at the animation release point
    setTimeout(() => {
      performPull();
      setPhase("playing");
    }, PULL_RELEASE_DELAY_MS);
  }, PULL_SETUP_DELAY_MS);
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
 * - Schedule and execute the pull throw
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
  const setPhase = useSimulationStore((s) => s.setPhase);
  const reset = useSimulationStore((s) => s.reset);

  // Initialize entities and schedule the pull throw on mount
  useEffect(() => {
    initializeEntities();
    giveDiscTo(PULLER_ID);

    // Expose restart function for UI
    window.restartThrow = () => restartPoint(setPhase);

    // Start the pull animation after setup delay
    const animationTimeout = setTimeout(() => {
      startPullAnimation();
    }, PULL_SETUP_DELAY_MS);

    // Schedule the pull throw at animation release point
    const pullTimeout = setTimeout(() => {
      performPull();
      setPhase("playing");
    }, PULL_SETUP_DELAY_MS + PULL_RELEASE_DELAY_MS);

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(pullTimeout);
      delete window.restartThrow;
      clearEntities();
      reset();
    };
  }, [setPhase, reset]);

  // Game loop - runs every frame
  useFrame((_, delta) => {
    const state = useSimulationStore.getState();
    if (state.isPaused) return;

    // Update disc physics when in flight, otherwise follow holder
    if (state.discInFlight) {
      updateDiscFlight(delta);
    } else {
      updateDiscToFollowHolder();
    }

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
