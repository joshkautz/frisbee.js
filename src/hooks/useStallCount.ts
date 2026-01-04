/**
 * Hook to subscribe to stall count changes from ECS.
 *
 * Since the stall count is stored in ECS (not Zustand), we need to poll it
 * using requestAnimationFrame to trigger React re-renders when it changes.
 *
 * @module hooks/useStallCount
 */

import { useState, useEffect } from "react";
import { disc } from "@/ecs";

interface StallState {
  count: number;
  isActive: boolean;
  markerId: string | null;
  /** True when actively stalling with count > 0 (for UI display) */
  isStalling: boolean;
}

/**
 * Subscribe to stall count changes from the disc entity in ECS.
 *
 * @returns Current stall state (count, isActive, markerId)
 */
export function useStallCount(): StallState {
  const [stallState, setStallState] = useState<StallState>({
    count: 0,
    isActive: false,
    markerId: null,
    isStalling: false,
  });

  useEffect(() => {
    let animationFrameId: number;

    function pollStallState() {
      const discEntity = disc.first;
      const count = discEntity?.stall?.count ?? 0;
      const isActive = discEntity?.stall?.isActive ?? false;
      const newState: StallState = {
        count,
        isActive,
        markerId: discEntity?.stall?.markerId ?? null,
        isStalling: isActive && count > 0,
      };

      // Only update if state actually changed (avoid unnecessary re-renders)
      setStallState((prev) => {
        if (
          prev.count !== newState.count ||
          prev.isActive !== newState.isActive ||
          prev.markerId !== newState.markerId
        ) {
          return newState;
        }
        return prev;
      });

      animationFrameId = requestAnimationFrame(pollStallState);
    }

    // Start polling
    animationFrameId = requestAnimationFrame(pollStallState);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return stallState;
}
