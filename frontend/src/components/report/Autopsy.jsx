import { memo } from "react";
import ScoreRing from "./ScoreRing.jsx";
import { Bar } from "../ui/index.jsx";
import { ERROR_TYPES, etColor } from "../../constants/errorTypes.js";

// Static style objects — defined outside component to avoid re-allocation on render
const STAT_WRAP = {
  background: "var(--surface2)",
  borderRadius: "var(--radius)",
  padding: "10px 14px",
};
const STAT_LABEL = {
  fontSize: 10,
  color: "var(--text3)",
  marginBottom: 2,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const DIAG_BLOCK = {
  background: "var(--surface2)",
  borderRadius: "var(--radius)",
  padding: "14px 16px",
  borderLeft: "3px solid var(--amber)",
};
const DIAG_TITLE = {
  fontSize: 10,
  color: "var(--amber)",
  fontWeight: 600,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const DIAG_TEXT = { fontSize: 13, color: "var(--text)", lineHeight: 1.7 };
const BD_TITLE = {
  fontSize: 11,
  color: "var(--text3)",
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 600,
};
const BD_ROW = { display: "flex", alignItems: "center", gap: 10 };
const BD_COUNT = { width: 20, fontSize: 12, fontWeight: 600, color: "var(--text)", textAlign: "right", flexShrink: 0 };
const BD_PCT   = { width: 34, fontSize: 11, color: "var(--text3)", flexShrink: 0 };

const STATS = [
  { l: "Questions", k: null,          c: "var(--text)"  },
  { l: "Correct",   k: "obtained",    c: "var(--green)" },
  { l: "Incorrect", k: "incorrect",   c: "var(--red)"   },
  { l: "Flagged",   k: "flagged",     c: "var(--text2)" },
];

const Autopsy = memo(function Autopsy({ data }) {
  const { score, errorBreakdown, diagnosticSummary, totalQuestions } = data;
  const incorrect = totalQuestions - score.obtained;

  function statValue(k) {
    if (k === null)       return totalQuestions;
    if (k === "obtained") return score.obtained;
    if (k === "incorrect") return incorrect;
    if (k === "flagged")  return errorBreakdown.flagged;
    return 0;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="score-header">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <ScoreRing p={score.percentage} />
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
            {score.obtained} / {score.total} marks
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}
          >
            {STATS.map(({ l, k, c }) => (
              <div key={l} style={STAT_WRAP}>
                <div style={STAT_LABEL}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{statValue(k)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={DIAG_BLOCK}>
        <div style={DIAG_TITLE}>Diagnostic summary</div>
        <p style={DIAG_TEXT}>{diagnosticSummary}</p>
      </div>

      <div>
        <div style={BD_TITLE}>Error breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {ERROR_TYPES.map(({ key, label, type, color }) => {
            const count = errorBreakdown[key] || 0;
            const pct   = incorrect ? Math.round((count / incorrect) * 100) : 0;
            return (
              <div key={key} style={BD_ROW}>
                <div className="breakdown-label">{label}</div>
                <Bar value={count} max={Math.max(incorrect, 1)} color={etColor(type)} />
                <div style={BD_COUNT}>{count}</div>
                <div style={BD_PCT}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Autopsy;
