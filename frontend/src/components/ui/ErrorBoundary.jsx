import { Component } from "react";

/**
 * ErrorBoundary
 * Catches any render-time JavaScript error in its subtree
 * and shows a recovery UI instead of a blank white screen.
 *
 * Usage: <ErrorBoundary><ReportView /></ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--text2)",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8,
              color: "var(--text)",
            }}
          >
            Something went wrong rendering the report
          </div>
          <p style={{ fontSize: 12, marginBottom: 20, color: "var(--text3)" }}>
            {this.state.error?.message || "An unexpected JavaScript error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 18px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
