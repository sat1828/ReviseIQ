import { useState, useCallback } from "react";
import { Card } from "./components/ui/index.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import UploadView from "./components/upload/UploadView.jsx";
import ReportView from "./components/report/ReportView.jsx";
import ErrorBoundary from "./components/ui/ErrorBoundary.jsx";

const HEADER_WRAP = {
  padding: "28px 0 24px",
  borderBottom: "1px solid var(--border)",
  marginBottom: 28,
};
const HEADER_ROW = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 4,
};
const LOGO_ICON = { fontSize: 20 };
const LOGO_TEXT = {
  fontSize: 18,
  fontWeight: 700,
  color: "var(--text)",
  letterSpacing: "-0.02em",
};
const BETA_BADGE = {
  fontSize: 10,
  fontWeight: 500,
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "2px 7px",
  color: "var(--text3)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const TAGLINE = {
  fontSize: 12,
  color: "var(--text3)",
  maxWidth: 480,
  lineHeight: 1.6,
};
const FOOTER = {
  textAlign: "center",
  marginTop: 16,
  fontSize: 11,
  color: "var(--text3)",
};

export default function App() {
  const [report, setReport] = useState(null);

  const handleResult = useCallback((r) => setReport(r), []);
  const handleReset  = useCallback(() => setReport(null), []);

  return (
    <div className="app-shell">
      <div className="app-container">
        <header style={HEADER_WRAP}>
          <div style={HEADER_ROW}>
            <span style={LOGO_ICON} aria-hidden="true">🔬</span>
            <span style={LOGO_TEXT}>ReviseIQ</span>
            <span style={BETA_BADGE} aria-label="Beta version">Beta</span>
          </div>
          <p style={TAGLINE}>
            Upload your answered exam paper. Get a surgical, question-by-question forensic
            diagnosis. Know exactly why you failed — not a score, a roadmap.
          </p>
        </header>

        <main>
          <Card>
            {report ? (
              <ErrorBoundary>
                <ReportView data={report} onReset={handleReset} />
              </ErrorBoundary>
            ) : (
              <UploadView onResult={handleResult} />
            )}
          </Card>
        </main>

        <footer style={FOOTER}>
          Powered by Claude Sonnet · API key never exposed to browser
        </footer>
      </div>
      {/* Toast notifications — rendered outside Card so they overlay everything */}
      <ToastProvider />
    </div>
  );
}
