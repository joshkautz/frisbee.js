import { memo } from "react";
import { useSpring, animated, config } from "@react-spring/web";
import { useSimulationStore } from "@/stores";
import { useReducedMotion, useStallCount } from "@/hooks";
import { MAX_STALL_COUNT } from "@/constants";

/** Consistent color for phase/status text */
const PHASE_COLOR = "#ffffff";

/**
 * Animated score display with spring animation on mount.
 * Uses key prop from parent to only animate when score changes.
 */
function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const prefersReducedMotion = useReducedMotion();

  // Animate on mount only (no reset: true), parent uses key={score} to remount on change
  const spring = useSpring({
    from: { scale: 1.3 },
    to: { scale: 1 },
    config: config.wobbly,
    immediate: prefersReducedMotion,
  });

  return (
    <div style={{ textAlign: "center", minWidth: 40 }}>
      <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.85)" }}>
        {label}
      </div>
      <animated.div
        style={{
          fontSize: 24,
          fontWeight: "bold",
          transform: spring.scale.to((s) => `scale(${s})`),
        }}
      >
        {score}
      </animated.div>
    </div>
  );
}

/**
 * Display labels for game phases.
 */
const PHASE_LABELS: Record<string, string> = {
  pull: "pulling",
  playing: "playing",
  stalling: "stalling",
  score: "score",
  turnover: "turnover",
};

/**
 * Game phase indicator.
 */
function PhaseDisplay({
  phase,
  isStalling,
}: {
  phase: string;
  isStalling: boolean;
}) {
  // Show "stalling" instead of "playing" when stall count is active
  const displayPhase = phase === "playing" && isStalling ? "stalling" : phase;

  return (
    <div
      style={{
        fontSize: 14,
        textTransform: "uppercase",
        fontWeight: 600,
        color: PHASE_COLOR,
      }}
    >
      {PHASE_LABELS[displayPhase] ?? displayPhase}
    </div>
  );
}

/**
 * Get stall count color with linear interpolation from green to red.
 * Each count (1-10) has a unique color along the gradient.
 */
function getStallColor(count: number): string {
  // Clamp to 1-10 range, normalize to 0-1
  const t = Math.max(0, Math.min(1, (count - 1) / (MAX_STALL_COUNT - 1)));

  // Green (74, 222, 128) -> Red (239, 68, 68)
  const r = Math.round(74 + t * (239 - 74));
  const g = Math.round(222 + t * (68 - 222));
  const b = Math.round(128 + t * (68 - 128));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Stall count indicator shown when a defender is marking the thrower.
 * Fades in/out smoothly instead of appearing/disappearing abruptly.
 */
function StallIndicator({
  count,
  isActive,
}: {
  count: number;
  isActive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isVisible = isActive && count > 0;

  const spring = useSpring({
    opacity: isVisible ? 1 : 0,
    scale: isVisible ? 1 : 0.8,
    config: config.gentle,
    immediate: prefersReducedMotion,
  });

  const color = getStallColor(count);

  return (
    <animated.div
      style={{
        opacity: spring.opacity,
        transform: spring.scale.to((s) => `scale(${s})`),
        display: "flex",
        justifyContent: "center",
        marginTop: 4,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      role="status"
      aria-live="assertive"
      aria-label={
        isVisible ? `Stall count: ${count} of ${MAX_STALL_COUNT}` : ""
      }
      aria-hidden={!isVisible}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color,
          textShadow: `0 0 8px ${color}`,
        }}
      >
        {count}
      </span>
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
  const { count: stallCount, isStalling } = useStallCount();

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
      <ScoreDisplay key={`home-${homeScore}`} score={homeScore} label="HOME" />
      <div
        style={{
          textAlign: "center",
          width: 90, // Fixed width to prevent layout shift when phase text changes
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.85)" }}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
        <PhaseDisplay phase={phase} isStalling={isStalling} />
        <StallIndicator count={stallCount} isActive={isStalling} />
      </div>
      <ScoreDisplay key={`away-${awayScore}`} score={awayScore} label="AWAY" />
    </animated.div>
  );
});
