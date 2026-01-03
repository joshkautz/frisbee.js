import { memo } from "react";
import { useSpring, animated, config } from "@react-spring/web";
import { useSimulationStore } from "@/stores";
import { useReducedMotion } from "@/hooks";

/**
 * Phase-specific colors for the game status indicator
 */
const PHASE_COLORS: Record<string, string> = {
  score: "#4ade80", // Green for score
  turnover: "#f87171", // Red for turnover
  playing: "#ffffff", // White for playing
  pull: "#60a5fa", // Blue for pull
};

/**
 * Phase-specific icons for accessibility (not color-only)
 */
const PHASE_ICONS: Record<string, string> = {
  score: "🎯", // Target for score
  turnover: "↺", // Rotate for turnover
  playing: "●", // Dot for playing
  pull: "↗", // Arrow for pull
};

/**
 * Animated score display with spring animation.
 * Respects user's reduced motion preference.
 */
function AnimatedScore({ score, label }: { score: number; label: string }) {
  const prefersReducedMotion = useReducedMotion();

  const scaleSpring = useSpring({
    scale: 1,
    from: { scale: 1.3 },
    config: config.wobbly,
    reset: true,
    immediate: prefersReducedMotion,
  });

  const numberSpring = useSpring({
    number: score,
    config: config.molasses,
    immediate: prefersReducedMotion,
  });

  return (
    <div style={{ textAlign: "center", minWidth: 40 }}>
      <div style={{ fontSize: 10, opacity: 0.7 }}>{label}</div>
      <animated.div
        style={{
          fontSize: 24,
          fontWeight: "bold",
          transform: scaleSpring.scale.to((s: number) => `scale(${s})`),
        }}
      >
        {numberSpring.number.to((n: number) => Math.floor(n))}
      </animated.div>
    </div>
  );
}

/**
 * Animated game phase indicator with fade/slide animation.
 * Respects user's reduced motion preference.
 */
function AnimatedPhase({ phase }: { phase: string }) {
  const prefersReducedMotion = useReducedMotion();

  const spring = useSpring({
    opacity: 1,
    y: 0,
    from: { opacity: 0, y: -10 },
    config: config.gentle,
    reset: true,
    immediate: prefersReducedMotion,
  });

  return (
    <animated.div
      style={{
        fontSize: 14,
        textTransform: "uppercase",
        fontWeight: 600,
        color: PHASE_COLORS[phase] ?? "#ffffff",
        opacity: spring.opacity,
        transform: spring.y.to((y) => `translateY(${y}px)`),
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span aria-hidden="true">{PHASE_ICONS[phase] ?? "●"}</span>
      {phase}
    </animated.div>
  );
}

/**
 * Game scoreboard overlay displaying scores, time, and game phase.
 * Memoized to prevent excessive re-renders.
 * Fully accessible with ARIA attributes for screen readers.
 */
export const Scoreboard = memo(function Scoreboard() {
  const homeScore = useSimulationStore((s) => s.homeScore);
  const awayScore = useSimulationStore((s) => s.awayScore);
  const phase = useSimulationStore((s) => s.phase);
  // Only re-render when the displayed second changes, not every frame
  const gameTime = useSimulationStore((s) => Math.floor(s.gameTime));
  const prefersReducedMotion = useReducedMotion();

  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;

  // Animate container background on phase changes
  const containerSpring = useSpring({
    backgroundColor:
      phase === "score"
        ? "rgba(34, 197, 94, 0.8)"
        : phase === "turnover"
          ? "rgba(239, 68, 68, 0.8)"
          : "rgba(0, 0, 0, 0.7)",
    config: config.gentle,
    immediate: prefersReducedMotion,
  });

  return (
    <animated.div
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "8px 16px",
        borderRadius: 8,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        gap: 16,
        alignItems: "center",
        zIndex: 10,
        maxWidth: "calc(100vw - 16px)",
        ...containerSpring,
      }}
      role="status"
      aria-live="polite"
      aria-label={`Score: Home ${homeScore}, Away ${awayScore}. Time: ${minutes}:${seconds.toString().padStart(2, "0")}`}
    >
      <AnimatedScore score={homeScore} label="HOME" />
      <div style={{ textAlign: "center", minWidth: 50 }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
        <AnimatedPhase phase={phase} />
      </div>
      <AnimatedScore score={awayScore} label="AWAY" />
    </animated.div>
  );
});
