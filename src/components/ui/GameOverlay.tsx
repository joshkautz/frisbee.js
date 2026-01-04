import { memo } from "react";
import { useSpring, animated, config } from "@react-spring/web";
import { useSimulationStore } from "@/stores";
import { useReducedMotion } from "@/hooks";

/**
 * Game overlay for halftime and endgame states.
 * Displays a full-screen overlay with game status information.
 */
export const GameOverlay = memo(function GameOverlay() {
  const phase = useSimulationStore((s) => s.phase);
  const winner = useSimulationStore((s) => s.winner);
  const homeScore = useSimulationStore((s) => s.homeScore);
  const awayScore = useSimulationStore((s) => s.awayScore);
  const prefersReducedMotion = useReducedMotion();

  const isVisible = phase === "halftime" || phase === "endgame";

  const fadeSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    config: config.gentle,
    immediate: prefersReducedMotion,
  });

  const contentSpring = useSpring({
    scale: isVisible ? 1 : 0.9,
    y: isVisible ? 0 : 20,
    from: { scale: 0.9, y: 20 },
    config: config.wobbly,
    immediate: prefersReducedMotion,
  });

  if (!isVisible) {
    return null;
  }

  const isHalftime = phase === "halftime";
  const title = isHalftime ? "HALFTIME" : "GAME OVER";
  const subtitle = isHalftime
    ? "Teams switching sides"
    : winner === "home"
      ? "Home Team Wins!"
      : "Away Team Wins!";

  return (
    <animated.div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isHalftime
          ? "rgba(59, 130, 246, 0.9)" // Blue for halftime
          : "rgba(0, 0, 0, 0.9)", // Dark for endgame
        zIndex: 100,
        fontFamily: "system-ui, sans-serif",
        color: "white",
        opacity: fadeSpring.opacity,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: ${subtitle}. Score: Home ${homeScore}, Away ${awayScore}`}
    >
      <animated.div
        style={{
          textAlign: "center",
          transform: contentSpring.scale.to(
            (s) => `scale(${s}) translateY(${contentSpring.y.get()}px)`
          ),
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: "bold",
            marginBottom: 16,
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 24,
            marginBottom: 32,
            opacity: 0.9,
          }}
        >
          {subtitle}
        </p>

        <div
          style={{
            display: "flex",
            gap: 48,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
              HOME
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: winner === "home" ? "#4ade80" : "white",
              }}
            >
              {homeScore}
            </div>
          </div>

          <div
            style={{
              fontSize: 32,
              opacity: 0.5,
            }}
          >
            -
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
              AWAY
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: winner === "away" ? "#4ade80" : "white",
              }}
            >
              {awayScore}
            </div>
          </div>
        </div>

        {isHalftime && (
          <p
            style={{
              marginTop: 32,
              fontSize: 16,
              opacity: 0.7,
            }}
          >
            Game will resume shortly...
          </p>
        )}

        {phase === "endgame" && (
          <p
            style={{
              marginTop: 32,
              fontSize: 16,
              opacity: 0.7,
            }}
          >
            Refresh to play again
          </p>
        )}
      </animated.div>
    </animated.div>
  );
});
