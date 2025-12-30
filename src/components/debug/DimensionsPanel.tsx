import { memo, useState } from "react";
import { getDimensionsData, type DimensionInfo } from "./ScaleReference";

const STATUS_COLORS = {
  correct: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
};

const STATUS_LABELS = {
  correct: "✓",
  warning: "⚠",
  error: "✗",
};

/**
 * UI overlay panel showing scene dimensions in feet/inches
 */
export const DimensionsPanel = memo(function DimensionsPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const dimensions = getDimensionsData();

  // Group by category
  const grouped = dimensions.reduce(
    (acc, dim) => {
      if (!acc[dim.category]) {
        acc[dim.category] = [];
      }
      acc[dim.category].push(dim);
      return acc;
    },
    {} as Record<string, DimensionInfo[]>
  );

  const errorCount = dimensions.filter((d) => d.status === "error").length;
  const warningCount = dimensions.filter((d) => d.status === "warning").length;

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "#fff",
        padding: "1rem",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        maxWidth: "380px",
        maxHeight: "80vh",
        overflow: "auto",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          borderBottom: "1px solid #444",
          paddingBottom: "0.5rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "14px" }}>📐 Scale Reference</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {errorCount > 0 && (
            <span
              style={{
                backgroundColor: STATUS_COLORS.error,
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "10px",
              }}
            >
              {errorCount} errors
            </span>
          )}
          {warningCount > 0 && (
            <span
              style={{
                backgroundColor: STATUS_COLORS.warning,
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "10px",
                color: "#000",
              }}
            >
              {warningCount} warnings
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "none",
              border: "1px solid #666",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Controls */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
              />
              Show real-world comparison
            </label>
          </div>

          {/* Dimensions by category */}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} style={{ marginBottom: "1rem" }}>
              <h4
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "12px",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {category}
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {items.map((dim, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #333",
                      }}
                    >
                      <td
                        style={{
                          padding: "4px 0",
                          color: STATUS_COLORS[dim.status],
                        }}
                      >
                        {STATUS_LABELS[dim.status]}
                      </td>
                      <td style={{ padding: "4px 8px" }}>{dim.name}</td>
                      <td
                        style={{
                          padding: "4px 8px",
                          textAlign: "right",
                          color: "#aaa",
                        }}
                      >
                        {dim.meters.toFixed(2)}m
                      </td>
                      <td
                        style={{
                          padding: "4px 0",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {dim.feet}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showDetails && (
                <div style={{ marginTop: "0.25rem" }}>
                  {items.map((dim, i) =>
                    dim.realWorld ? (
                      <div
                        key={i}
                        style={{
                          fontSize: "10px",
                          color: "#666",
                          paddingLeft: "1rem",
                        }}
                      >
                        {dim.name}: {dim.realWorld}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Legend */}
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid #444",
              fontSize: "10px",
              color: "#666",
            }}
          >
            <div style={{ marginBottom: "0.25rem" }}>
              <span style={{ color: STATUS_COLORS.correct }}>✓</span> Correct
              scale
            </div>
            <div style={{ marginBottom: "0.25rem" }}>
              <span style={{ color: STATUS_COLORS.warning }}>⚠</span> Minor
              deviation
            </div>
            <div>
              <span style={{ color: STATUS_COLORS.error }}>✗</span> Needs
              adjustment
            </div>
          </div>

          {/* Instructions */}
          <div
            style={{
              marginTop: "1rem",
              padding: "0.5rem",
              backgroundColor: "rgba(51, 102, 204, 0.2)",
              borderRadius: "4px",
              fontSize: "10px",
            }}
          >
            💡 Look for reference people near the field to compare player size
            visually. Green = realistic human, Red = current game player.
          </div>
        </>
      )}
    </div>
  );
});
