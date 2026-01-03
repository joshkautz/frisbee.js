import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Game, ErrorBoundary } from "@/components";
import { useSimulationStore } from "@/stores";
import { clearEntities } from "@/ecs";

const container = document.getElementById("game-container");
const loading = document.getElementById("loading");

if (!container) {
  throw new Error("Game container not found!");
}

// Hide loading indicator when React takes over
function hideLoading() {
  if (loading) {
    loading.hidden = true;
  }
  // Clear timeout warning if it exists
  if (loadingTimeoutId) {
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
  }
}

// Show warning if loading takes too long (15 seconds)
const LOADING_TIMEOUT_MS = 15000;
let loadingTimeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
  if (loading && !loading.hidden) {
    const warningEl = document.createElement("p");
    warningEl.textContent =
      "Loading is taking longer than expected. Please check your connection or try refreshing.";
    warningEl.style.cssText =
      "color: #fbbf24; font-size: 0.875rem; margin-top: 1rem; text-align: center;";
    loading.appendChild(warningEl);
  }
  loadingTimeoutId = null;
}, LOADING_TIMEOUT_MS);

// Create the React root (only once)
const root = createRoot(container);

// Loading spinner shown during async component load
function LoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading game"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "4px solid rgba(255,255,255,0.2)",
            borderTopColor: "#4caf50",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p>Loading game...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function render() {
  root.render(
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Game />
      </Suspense>
    </ErrorBoundary>
  );
  hideLoading();
}

render();

// Vite HMR handling - properly cleanup before hot reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Cleanup before re-render
    clearEntities();
    useSimulationStore.getState().reset();
    render();
  });

  import.meta.hot.dispose(() => {
    // Cleanup when module is disposed
    clearEntities();
    useSimulationStore.getState().reset();
  });
}
