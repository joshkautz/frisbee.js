/**
 * Simulation loop hook.
 *
 * Manages the game loop including AI updates, disc physics,
 * phase transitions, and entity initialization.
 *
 * @module hooks/useSimulation
 */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimulationStore } from "@/stores";
import { initializeEntities, clearEntities, allPlayers, disc } from "@/ecs";
import { updateAI, handleDiscThrow } from "@/systems/aiSystem";
import { updateDiscFlight, throwDisc, giveDiscTo } from "@/systems/discSystem";
import {
  THROW_INTERVAL,
  PULL_DELAY,
  GAME_INIT_DELAY,
  TURNOVER_PICKUP_DELAY,
} from "@/constants";
import { distance2D } from "@/utils";

/**
 * Hook that runs the simulation loop
 */
export function useSimulation() {
  // Use selectors for React re-renders (UI display)
  const phase = useSimulationStore((s) => s.phase);
  const possession = useSimulationStore((s) => s.possession);
  const isPaused = useSimulationStore((s) => s.isPaused);

  // Get stable action references (these don't cause re-renders)
  const setPhase = useSimulationStore((s) => s.setPhase);
  const tick = useSimulationStore((s) => s.tick);
  const reset = useSimulationStore((s) => s.reset);

  const throwTimerRef = useRef(0);
  const phaseTimerRef = useRef(0);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize entities on mount, cleanup on unmount
  useEffect(() => {
    initializeEntities();

    // Give disc to home team handler to start
    initTimeoutRef.current = setTimeout(() => {
      giveDiscTo("home-2"); // Center handler
      setPhase("playing");
    }, GAME_INIT_DELAY * 1000);

    // Cleanup on unmount
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      clearEntities();
      reset();
    };
  }, [setPhase, reset]);

  // Main simulation loop
  useFrame((_, delta) => {
    // Use getState() for real-time values in frame loop (avoids stale closure)
    const state = useSimulationStore.getState();

    if (state.isPaused) return;

    // Update game time
    tick(delta);

    // Handle different phases
    switch (state.phase) {
      case "pull":
        phaseTimerRef.current += delta;
        if (phaseTimerRef.current > PULL_DELAY) {
          // Execute pull
          const pullingTeam = state.possession === "home" ? "away" : "home";
          giveDiscTo(`${pullingTeam}-2`); // Give to center handler of pulling team

          // Throw the pull
          const pullTarget =
            state.possession === "home"
              ? { x: 0, y: 0, z: -30 }
              : { x: 0, y: 0, z: 30 };

          const dx = pullTarget.x;
          const dz = pullTarget.z - (state.possession === "home" ? 35 : -35);
          const distSquared = dx * dx + dz * dz;

          // Guard against division by zero
          if (distSquared > 0.01) {
            const dist = Math.sqrt(distSquared);
            throwDisc(
              {
                x: (dx / dist) * 25,
                y: 8,
                z: (dz / dist) * 25,
              },
              null
            );
          }

          setPhase("playing");
          phaseTimerRef.current = 0;
        }
        break;

      case "playing": {
        // Update AI
        updateAI(delta);

        // Update disc flight
        updateDiscFlight(delta);

        // Handle throwing
        throwTimerRef.current += delta * state.simulationSpeed;

        const holder = [...allPlayers].find((p) => p.player?.hasDisc);
        if (holder && throwTimerRef.current > THROW_INTERVAL) {
          // Decide to throw
          const throwData = handleDiscThrow();
          if (throwData) {
            throwDisc(throwData.velocity, throwData.target);
            throwTimerRef.current = 0;
          }
        }
        break;
      }

      case "turnover":
        phaseTimerRef.current += delta;
        if (phaseTimerRef.current > TURNOVER_PICKUP_DELAY) {
          // Pick up disc - find nearest player on possessing team
          const newPossession = state.possession;
          const discEntity = disc.first;

          if (discEntity) {
            const nearestPlayer = [...allPlayers]
              .filter((p) => p.player?.team === newPossession)
              .sort(
                (a, b) =>
                  distance2D(a.position, discEntity.position) -
                  distance2D(b.position, discEntity.position)
              )[0];

            if (nearestPlayer) {
              giveDiscTo(nearestPlayer.id);
            }
          }

          setPhase("playing");
          phaseTimerRef.current = 0;
          throwTimerRef.current = 0;
        }
        break;

      case "score":
        // Celebration - handled by store timeout
        break;
    }
  });

  return {
    phase,
    possession,
    isPaused,
  };
}
