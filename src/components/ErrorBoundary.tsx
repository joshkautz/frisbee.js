import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error in development for debugging
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: 24,
            backgroundColor: "#1a1a2e",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
          role="alert"
          aria-live="assertive"
        >
          <h1 style={{ marginBottom: 16, fontSize: 24 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#b0b0b0", marginBottom: 24, maxWidth: 400 }}>
            The game encountered an error. You can try again or reload the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                backgroundColor: "rgba(255,0,0,0.1)",
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
                maxWidth: "100%",
                overflow: "auto",
                fontSize: 12,
                textAlign: "left",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={this.handleRetry}
              aria-label="Try again to recover from error"
              className="error-btn error-btn-retry"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              aria-label="Reload the entire page"
              className="error-btn error-btn-reload"
            >
              Reload Page
            </button>
            <style>{`
              .error-btn {
                padding: 12px 24px;
                font-size: 16px;
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.1s;
              }
              .error-btn:focus-visible {
                outline: 3px solid #fff;
                outline-offset: 2px;
              }
              .error-btn:hover {
                transform: translateY(-1px);
              }
              .error-btn:active {
                transform: translateY(0);
              }
              .error-btn-retry {
                background-color: #4caf50;
              }
              .error-btn-reload {
                background-color: #3366cc;
              }
            `}</style>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
