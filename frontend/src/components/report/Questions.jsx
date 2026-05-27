import { useState, memo } from "react";
import QuestionCard from "./QuestionCard.jsx";
import { ERROR_TYPES } from "../../constants/errorTypes.js";

const FILTER_BAR = { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 };
const EMPTY      = { fontSize: 13, color: "var(--text3)", textAlign: "center", padding: "30px 0" };
const CARDS_WRAP = { display: "flex", flexDirection: "column", gap: 8 };

// Correct question summary card — collapsed by default, no expand needed
const CORRECT_CARD_STYLE = {
  border: "1px solid #1a3d26",
  borderRadius: "var(--radius-lg)",
  padding: "10px 16px",
  background: "var(--green-bg)",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

function CorrectCard({ q }) {
  return (
    <div style={CORRECT_CARD_STYLE} aria-label={`Question ${q.number} correct: ${q.topic}`}>
      <div
        style={{
          width: 30, height: 30, borderRadius: 6, background: "#1a4a2a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600, color: "var(--green)", flexShrink: 0,
        }}
      >
        Q{q.number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
          {q.topic}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          Answer: <span style={{ color: "var(--green)" }}>{q.correctAnswer}</span>
        </div>
      </div>
      <span style={{ fontSize: 16, color: "var(--green)" }} aria-hidden="true">✓</span>
    </div>
  );
}

const Questions = memo(function Questions({ data }) {
  const [filter,      setFilter]      = useState("all");
  const [showCorrect, setShowCorrect] = useState(false);

  const wrong   = data.questions.filter((q) => !q.isCorrect);
  const correct = data.questions.filter((q) => q.isCorrect);
  const filtered = filter === "all" ? wrong : wrong.filter((q) => q.errorType === filter);

  return (
    <div>
      {/* Filter bar */}
      <div style={FILTER_BAR} role="group" aria-label="Filter questions by error type">
        <button
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            border: `1px solid ${filter === "all" ? "var(--text2)" : "var(--border)"}`,
            background: filter === "all" ? "var(--surface2)" : "transparent",
            color: filter === "all" ? "var(--text)" : "var(--text3)",
            fontWeight: filter === "all" ? 600 : 400,
          }}
        >
          All incorrect ({wrong.length})
        </button>

        {ERROR_TYPES.filter((et) => (data.errorBreakdown[et.key] || 0) > 0).map((et) => (
          <button
            key={et.key}
            onClick={() => setFilter(et.type)}
            aria-pressed={filter === et.type}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${filter === et.type ? et.color : "var(--border)"}`,
              background: filter === et.type ? et.bg : "transparent",
              color: filter === et.type ? et.color : "var(--text3)",
              fontWeight: filter === et.type ? 600 : 400,
            }}
          >
            {et.label} ({data.errorBreakdown[et.key]})
          </button>
        ))}
      </div>

      {/* Incorrect cards */}
      <div style={CARDS_WRAP}>
        {filtered.length === 0 ? (
          <p style={EMPTY}>No questions match this filter.</p>
        ) : (
          filtered.map((q) => <QuestionCard key={q.number} q={q} />)
        )}
      </div>

      {/* Show correct toggle */}
      {correct.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowCorrect((s) => !s)}
            aria-expanded={showCorrect}
            aria-controls="correct-questions-list"
            style={{
              fontSize: 12,
              color: "var(--text3)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "7px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden="true">{showCorrect ? "▾" : "▸"}</span>
            {showCorrect ? "Hide" : "Show"} correct answers ({correct.length})
          </button>

          {showCorrect && (
            <div id="correct-questions-list" style={{ ...CARDS_WRAP, marginTop: 10 }}>
              {correct.map((q) => <CorrectCard key={q.number} q={q} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Questions;
