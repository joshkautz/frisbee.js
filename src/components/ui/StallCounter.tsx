import { memo } from "react";
import { useSpring, animated, config } from "@react-spring/web";
import { disc } from "@/ecs";
import { useReducedMotion } from "@/hooks";
import { useSimulationStore } from "@/stores";
import { MAX_STALL_COUNT } from "@/constants";

/**
 * Get color based on stall count urgency.
 * Transitions from green (low) to yellow (medium) to red (high).
 */
function getStallColor(count: number): string {
  if (count <= 3) return "#4ade80"; // Green - safe
  if (count <= 6) return "#facc15"; // Yellow - getting urgent
  if (count <= 8) return "#fb923c"; // Orange - urgent
  return "#ef4444"; // Red - critical
}

/**
 * Stall count visual indicator.
 * Displays current stall count with color urgency as count rises.
 * Only visible when stall is active (marker within range).
 */
export const StallCounter = memo(function StallCounter() {
  const phase = useSimulationStore((s) => s.phase);
  const prefersReducedMotion = useReducedMotion();

  // Read stall state from ECS entity
  const discEntity = disc.first;
  const stallCount = discEntity?.stall?.count ?? 0;
  const isActive = discEntity?.stall?.isActive ?? false;

  // Animate the scale when count changes
  const scaleSpring = useSpring({
    scale: stallCount > 0 ? 1 : 0.8,
    from: { scale: 1.2 },
    config: config.wobbly,
    reset: stallCount > 0,
    immediate: prefersReducedMotion,
  });

  // Animate opacity
  const opacitySpring = useSpring({
    opacity: isActive && stallCount > 0 ? 1 : 0,
    config: config.gentle,
    immediate: prefersReducedMotion,
  });

  // Don't render if not in playing phase or stall not active
  if (phase !== "playing" || !isActive || stallCount === 0) {
    return null;
  }

  const color = getStallColor(stallCount);
  const isCritical = stallCount >= 7;

  return (
    <animated.div
      style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        opacity: opacitySpring.opacity,
      }}
      role="status"
      aria-live="assertive"
      aria-label={`Stall count: ${stallCount} of ${MAX_STALL_COUNT}`}
    >
      <animated.div
        style={{
          fontSize: isCritical ? 64 : 48,
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          color,
          textShadow: `2px 2px 4px rgba(0,0,0,0.5), 0 0 ${isCritical ? 20 : 10}px ${color}`,
          transform: scaleSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        {stallCount}
      </animated.div>
      <div
        style={{
          fontSize: 12,
          textAlign: "center",
          color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        STALL
      </div>
    </animated.div>
  );
});
