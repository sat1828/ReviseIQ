import { useState, memo } from "react";
import { Tag } from "../ui/index.jsx";
import { etColor, etBg } from "../../constants/errorTypes.js";

// Static style constants — never re-allocated
const CARD = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  background: "var(--surface)",
};
const HEADER_BTN = {
  width: "100%",
  textAlign: "left",
  padding: "12px 16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
};
const Q_NUM = {
  width: 30, height: 30, borderRadius: 6,
  background: "var(--surface2)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 11, fontWeight: 600, color: "var(--text2)", flexShrink: 0,
};
const CHEVRON_BASE = { color: "var(--text3)", fontSize: 12, flexShrink: 0, transition: "transform 0.2s" };
const DETAIL_WRAP  = { borderTop: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 12 };
const STAT_CELL    = { background: "var(--surface2)", borderRadius: "var(--radius)", padding: "8px 12px" };
const STAT_LABEL   = { fontSize: 10, color: "var(--text3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" };

const INSIGHT_CONFIGS = [
  { key: "whyItWentWrong",       label: "🔍 Why it went wrong",          accentVar: "--red",   bgVar: "--red-bg"   },
  { key: "whatMasteryLooksLike", label: "✦ What mastery looks like",     accentVar: "--green", bgVar: "--green-bg" },
  { key: "microExercise",        label: "⏱ Micro-exercise (30 min)",     accentVar: "--blue",  bgVar: "--blue-bg"  },
];

const QuestionCard = memo(function QuestionCard({ q }) {
  const [open, setOpen] = useState(false);
  if (q.isCorrect) return null;

  const detailId = `q-detail-${q.number}`;

  return (
    <div style={CARD}>
      <button
        style={HEADER_BTN}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailId}
        aria-label={`Question ${q.number}: ${q.topic}. Error type: ${q.errorType}. ${open ? "Collapse" : "Expand"} details.`}
      >
        <div style={Q_NUM} aria-hidden="true">Q{q.number}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
            {q.topic}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
            Student:{" "}
            <span style={{ color: "var(--red)" }}>{q.studentAnswer || "blank"}</span>
            &nbsp;·&nbsp; Correct:{" "}
            <span style={{ color: "var(--green)" }}>{q.correctAnswer}</span>
          </div>
        </div>

        <Tag label={q.errorType} color={etColor(q.errorType)} bg={etBg(q.errorType)} />

        <span
          aria-hidden="true"
          style={{ ...CHEVRON_BASE, transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div id={detailId} style={DETAIL_WRAP}>
          <div className="question-detail-grid">
            {[
              ["Student's answer", q.studentAnswer || "Blank", "var(--red)"],
              ["Correct answer",   q.correctAnswer,            "var(--green)"],
              ["Working detected", q.workingDetected,          "var(--text2)"],
            ].map(([l, v, c]) => (
              <div key={l} style={STAT_CELL}>
                <div style={STAT_LABEL}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {INSIGHT_CONFIGS.map(({ key, label, accentVar, bgVar }) => {
            const text = q[key];
            if (!text) return null;
            return (
              <div
                key={key}
                style={{
                  background: `var(${bgVar})`,
                  borderRadius: "var(--radius)",
                  padding: "12px 14px",
                  borderLeft: `2px solid var(${accentVar})`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: `var(${accentVar})`,
                    fontWeight: 600,
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </div>
                <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7 }}>{text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default QuestionCard;
