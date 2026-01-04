/**
 * Help overlay component showing game controls.
 *
 * Displays keyboard and touch controls when triggered.
 * Can be toggled with the "?" key or via window.showControls().
 *
 * @module components/ui/HelpOverlay
 */

import { memo, useState, useEffect, type CSSProperties } from "react";

const overlayStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 16,
};

const panelStyle: CSSProperties = {
  backgroundColor: "rgba(30, 30, 50, 0.95)",
  borderRadius: 12,
  padding: 24,
  maxWidth: 500,
  width: "100%",
  color: "#fff",
  fontFamily: "system-ui, sans-serif",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
};

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 16,
  textAlign: "center",
};

const sectionStyle: CSSProperties = {
  marginBottom: 16,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#93c5fd", // Lighter blue for better contrast on dark bg
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: 1,
};

const controlRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const keyStyle: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "monospace",
  color: "#fff",
};

const closeButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#3366cc",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 16,
};

const FIRST_VISIT_KEY = "frisbee-js-help-shown";

// Expose global function to show controls
declare global {
  interface Window {
    showControls?: () => void;
  }
}

/**
 * Help overlay showing game controls.
 *
 * Features:
 * - Keyboard controls list
 * - Touch/mouse controls list
 * - Toggle with "?" key
 * - Close with Escape or clicking outside
 * - Can be opened via window.showControls()
 * - Auto-shows on first visit (uses localStorage)
 */
export const HelpOverlay = memo(function HelpOverlay() {
  const [isVisible, setIsVisible] = useState(() => {
    // Auto-show on first visit
    if (typeof window === "undefined") return false;
    try {
      const hasSeenHelp = localStorage.getItem(FIRST_VISIT_KEY);
      if (!hasSeenHelp) {
        localStorage.setItem(FIRST_VISIT_KEY, "true");
        return true;
      }
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
    return false;
  });

  // Expose global function to show controls
  useEffect(() => {
    window.showControls = () => setIsVisible(true);
    return () => {
      delete window.showControls;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      } else if (e.key === "Escape" && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={overlayStyle}
      onClick={() => setIsVisible(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h2 id="help-title" style={titleStyle}>
          Game Controls
        </h2>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Keyboard</h3>
          <div style={controlRowStyle}>
            <span>Pause / Resume</span>
            <span style={keyStyle}>Space</span>
          </div>
          <div style={controlRowStyle}>
            <span>Move Camera Target</span>
            <span style={keyStyle}>W A S D / Arrows</span>
          </div>
          <div style={controlRowStyle}>
            <span>Speed Up</span>
            <span style={keyStyle}>+ (Plus)</span>
          </div>
          <div style={controlRowStyle}>
            <span>Slow Down</span>
            <span style={keyStyle}>- (Minus)</span>
          </div>
          <div style={controlRowStyle}>
            <span>Reset Camera</span>
            <span style={keyStyle}>R</span>
          </div>
          <div style={controlRowStyle}>
            <span>Toggle Help</span>
            <span style={keyStyle}>?</span>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Mouse / Touch</h3>
          <div style={controlRowStyle}>
            <span>Rotate Camera</span>
            <span>Drag / Touch drag</span>
          </div>
          <div style={controlRowStyle}>
            <span>Zoom</span>
            <span>Scroll / Pinch</span>
          </div>
          <div style={controlRowStyle}>
            <span>Pan Camera</span>
            <span>Right-drag / Two-finger drag</span>
          </div>
        </div>

        <button
          style={closeButtonStyle}
          onClick={() => setIsVisible(false)}
          autoFocus
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
});
