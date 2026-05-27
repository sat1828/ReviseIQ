// Loading — shows real progress stages emitted by the backend over SSE.
// The stages are not fake timers — they map to actual server milestones.

const STAGES = [
  "Received file — beginning extraction…",
  "Classifying errors for each question…",
  "Building weakness concept map…",
  "Generating 3-day revision plan…",
];

const OUTER = { textAlign: "center", padding: "60px 20px" };
const SPINNER = {
  fontSize: 32,
  animation: "spin 1.2s linear infinite",
  display: "inline-block",
  marginBottom: 16,
};
const HEADING = { fontSize: 15, fontWeight: 600, marginBottom: 24, color: "var(--text)" };
const LIST = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxWidth: 360,
  margin: "0 auto",
  textAlign: "left",
};
const FOOT = { marginTop: 32, fontSize: 11, color: "var(--text3)" };

export default function Loading({ stage, message }) {
  // Use the backend-emitted message if available, fall back to local label
  const currentLabel = message || STAGES[stage] || STAGES[0];

  return (
    <div style={OUTER} role="status" aria-live="polite" aria-label={`Analysing: ${currentLabel}`}>
      <div style={SPINNER} aria-hidden="true">⚙</div>
      <div style={HEADING}>Analysing your exam paper…</div>
      <div style={LIST}>
        {STAGES.map((s, i) => {
          const done    = i < stage;
          const current = i === stage;
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  fontSize: 13,
                  color: done ? "var(--green)" : current ? "var(--amber)" : "var(--text3)",
                }}
              >
                {done ? "✓" : current ? "◌" : "○"}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: done ? "var(--green)" : current ? "var(--text)" : "var(--text3)",
                }}
              >
                {/* Show live backend message for the current step */}
                {current && message ? message : s}
              </span>
            </div>
          );
        })}
      </div>
      <div style={FOOT}>This typically takes 15–40 seconds depending on paper length.</div>
    </div>
  );
}
