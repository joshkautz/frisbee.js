import { memo, type CSSProperties } from "react";
import { useSimulationStore } from "@/stores";

/**
 * Base button styles for control buttons
 */
const baseButtonStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "none",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  color: "#fff",
  fontSize: 20,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
};

/**
 * Touch-friendly controls overlay for mobile devices.
 * Provides pause/play button and simulation speed controls.
 * Positioned in the bottom-right corner of the screen.
 */
export const MobileControls = memo(function MobileControls() {
  const isPaused = useSimulationStore((s) => s.isPaused);
  const setIsPaused = useSimulationStore((s) => s.setIsPaused);
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleSpeedUp = () => {
    setSimulationSpeed(Math.min(simulationSpeed + 0.5, 4));
  };

  const handleSlowDown = () => {
    setSimulationSpeed(Math.max(simulationSpeed - 0.5, 0.25));
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 10,
      }}
      aria-label="Game controls"
    >
      <button
        onClick={handleSpeedUp}
        style={baseButtonStyle}
        aria-label="Speed up simulation"
        title="Speed up"
      >
        +
      </button>
      <button
        onClick={handlePauseToggle}
        style={{
          ...baseButtonStyle,
          width: 56,
          height: 56,
          fontSize: 24,
          backgroundColor: isPaused
            ? "rgba(76, 175, 80, 0.8)"
            : "rgba(0, 0, 0, 0.6)",
        }}
        aria-label={isPaused ? "Resume game" : "Pause game"}
        aria-pressed={isPaused}
        title={isPaused ? "Play" : "Pause"}
      >
        {isPaused ? "▶" : "⏸"}
      </button>
      <button
        onClick={handleSlowDown}
        style={baseButtonStyle}
        aria-label="Slow down simulation"
        title="Slow down"
      >
        −
      </button>
      <div
        style={{
          textAlign: "center",
          color: "#fff",
          fontSize: 12,
          opacity: 0.7,
        }}
        aria-live="polite"
      >
        {simulationSpeed}x
      </div>
    </div>
  );
});
