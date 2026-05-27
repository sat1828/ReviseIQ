import { memo } from "react";
import { useToast } from "../ui/Toast.jsx";

// ── Static styles ─────────────────────────────────────────────────────────────
const BLOCK = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  marginBottom: 14,
};
const BLOCK_HEADER = (accent) => ({
  background: "var(--surface2)",
  padding: "10px 16px",
  borderLeft: `3px solid ${accent}`,
  fontSize: 11,
  fontWeight: 600,
  color: accent,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
});
const BLOCK_BODY = { padding: "14px 16px" };
const ROW = { display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" };
const ROW_KEY = { width: 160, fontSize: 11, color: "var(--text3)", flexShrink: 0, paddingTop: 1 };
const ROW_VAL = { fontSize: 12, color: "var(--text)", lineHeight: 1.5 };
const GAP_ITEM = {
  background: "var(--red-bg)",
  border: "1px solid #4a1b0c",
  borderRadius: "var(--radius)",
  padding: "10px 14px",
  marginBottom: 8,
};
const GAP_NUM = { fontSize: 11, fontWeight: 600, color: "var(--red)", marginBottom: 3 };
const GAP_TEXT = { fontSize: 12, color: "var(--text2)", lineHeight: 1.5 };
const ACTION_ITEM = {
  display: "flex",
  gap: 10,
  marginBottom: 8,
  alignItems: "flex-start",
};
const ACTION_DOT = { fontSize: 14, flexShrink: 0, marginTop: 1 };
const ACTION_TEXT = { fontSize: 12, color: "var(--text2)", lineHeight: 1.5 };
const READINESS_COLORS = {
  Low:    { color: "var(--red)",   bg: "var(--red-bg)"   },
  Medium: { color: "var(--amber)", bg: "var(--amber-bg)" },
  High:   { color: "var(--green)", bg: "var(--green-bg)" },
};
const PRINT_BTN = {
  fontSize: 12,
  color: "var(--text2)",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "7px 12px",
  cursor: "pointer",
  marginBottom: 16,
};

// ── Derive teacher-level data from the report JSON ────────────────────────────
function deriveTeacherData(data) {
  const { score, errorBreakdown, questions = [], weaknessMap, totalQuestions } = data;
  const incorrect = totalQuestions - score.obtained;

  // Top 3 critical gaps (from weaknessMap.critical, fall back to moderate)
  const criticalAreas = [
    ...(weaknessMap?.critical || []),
    ...(weaknessMap?.moderate || []),
  ].slice(0, 3);

  // Effort indicators
  const attempted       = questions.filter((q) => q.studentAnswer && q.studentAnswer !== "blank").length;
  const workingShown    = questions.filter((q) => q.workingDetected === "Yes" || q.workingDetected === "Partial").length;
  const conceptualCount = (errorBreakdown.conceptualGap || 0) + (errorBreakdown.partialUnderstanding || 0);
  const executionCount  = (errorBreakdown.calculationError || 0) + (errorBreakdown.misreadQuestion || 0);

  let errorPattern = "Mixed conceptual and execution errors";
  if (conceptualCount > executionCount * 2) errorPattern = "Primarily conceptual blind spots — needs re-teaching, not more practice";
  else if (executionCount > conceptualCount * 2) errorPattern = "Primarily execution errors — concepts understood, needs exam technique work";
  else if (errorBreakdown.knowledgeGap > 2) errorPattern = "Significant preparation gap — content not covered or memorised";

  // Readiness score
  const pct = score.percentage;
  const readiness = pct >= 70 ? "High" : pct >= 45 ? "Medium" : "Low";
  const projected = Math.min(100, pct + (pct < 50 ? 18 : pct < 70 ? 12 : 6));

  // Teacher action recommendations
  const actions = [];
  if (conceptualCount >= 3) {
    actions.push(`One-on-one session recommended on: ${(weaknessMap?.critical?.[0]?.subConcepts || []).map(s => s.name).join(", ") || "core conceptual gaps identified in report"}`);
  }
  if (errorBreakdown.misreadQuestion >= 2) {
    actions.push("Exam technique coaching — student is misreading question instructions. Practice with highlighter annotation of key command words.");
  }
  if (errorBreakdown.knowledgeGap >= 2) {
    actions.push("Check whether student has adequate study materials for flagged topics. Knowledge gaps suggest under-preparation, not learning difficulty.");
  }
  if (pct < 40) {
    actions.push("Consider diagnostic conversation before next unit — score suggests either significant preparation gap or test anxiety affecting performance.");
  }
  if (actions.length === 0) {
    actions.push("Continue current support. Targeted revision on identified weak concepts should close the remaining gap before the next assessment.");
  }

  return { criticalAreas, attempted, workingShown, errorPattern, readiness, projected, actions, incorrect };
}

// ── Component ─────────────────────────────────────────────────────────────────
const TeacherReport = memo(function TeacherReport({ data }) {
  const { toast } = useToast();
  const td = deriveTeacherData(data);
  const readinessSty = READINESS_COLORS[td.readiness] || READINESS_COLORS.Medium;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function copyTeacherReport() {
    const lines = [
      `REVISEIQ TEACHER REPORT — ${today}`,
      `Subject: ${data.subject} | Exam Board: ${data.examBoard}`,
      `Score: ${data.score.percentage}% (${data.score.obtained}/${data.score.total})`,
      "",
      "PERFORMANCE SNAPSHOT",
      `Total questions: ${data.totalQuestions} | Incorrect: ${td.incorrect} | Attempted all: ${td.attempted >= data.totalQuestions ? "Yes" : "No"}`,
      `Working shown: ${td.workingShown} questions | Error pattern: ${td.errorPattern}`,
      `Next test readiness: ${td.readiness} | Projected improvement: +${td.projected - data.score.percentage}% if revision plan followed`,
      "",
      "CRITICAL LEARNING GAPS IDENTIFIED",
      ...td.criticalAreas.map((a, i) =>
        `${i + 1}. ${a.area}: ${(a.subConcepts || []).map(s => s.name).join(", ")}`
      ),
      "",
      "RECOMMENDED TEACHER ACTIONS",
      ...td.actions.map((a, i) => `${i + 1}. ${a}`),
      "",
      "DIAGNOSTIC SUMMARY",
      data.diagnosticSummary,
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast("Teacher report copied.", "success"))
      .catch(() => toast("Copy failed.", "error"));
  }

  return (
    <div>
      <button style={PRINT_BTN} onClick={copyTeacherReport} data-no-print>
        📋 Copy teacher report
      </button>

      {/* Header */}
      <div style={{ ...BLOCK }}>
        <div style={BLOCK_HEADER("var(--text2)")}>Performance snapshot</div>
        <div style={BLOCK_BODY}>
          <div style={ROW}>
            <div style={ROW_KEY}>Subject</div>
            <div style={ROW_VAL}>{data.subject}</div>
          </div>
          <div style={ROW}>
            <div style={ROW_KEY}>Exam board</div>
            <div style={ROW_VAL}>{data.examBoard}</div>
          </div>
          <div style={ROW}>
            <div style={ROW_KEY}>Score</div>
            <div style={ROW_VAL}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{data.score.percentage}%</span>
              <span style={{ color: "var(--text3)", marginLeft: 6 }}>
                ({data.score.obtained} / {data.score.total} marks)
              </span>
            </div>
          </div>
          <div style={ROW}>
            <div style={ROW_KEY}>Questions attempted</div>
            <div style={ROW_VAL}>
              {td.attempted} / {data.totalQuestions}
              {td.attempted < data.totalQuestions && (
                <span style={{ color: "var(--amber)", marginLeft: 6, fontSize: 11 }}>
                  ⚠ {data.totalQuestions - td.attempted} unattempted
                </span>
              )}
            </div>
          </div>
          <div style={ROW}>
            <div style={ROW_KEY}>Working shown</div>
            <div style={ROW_VAL}>{td.workingShown} of {data.totalQuestions - data.score.obtained} incorrect questions</div>
          </div>
          <div style={ROW}>
            <div style={ROW_KEY}>Error pattern</div>
            <div style={ROW_VAL}>{td.errorPattern}</div>
          </div>
        </div>
      </div>

      {/* Critical gaps */}
      <div style={BLOCK}>
        <div style={BLOCK_HEADER("var(--red)")}>Critical learning gaps identified</div>
        <div style={BLOCK_BODY}>
          {td.criticalAreas.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text3)" }}>
              No critical conceptual gaps identified — errors are primarily execution-level.
            </p>
          ) : (
            td.criticalAreas.map((area, i) => (
              <div key={i} style={GAP_ITEM}>
                <div style={GAP_NUM}>{i + 1}. {area.area}</div>
                <div style={GAP_TEXT}>
                  {(area.subConcepts || []).map((sc) => (
                    <span key={sc.name}>
                      <strong>{sc.name}</strong>
                      {sc.affectsQuestions?.length > 0 && (
                        <span style={{ color: "var(--text3)", marginLeft: 4 }}>
                          (Q{sc.affectsQuestions.join(", Q")})
                        </span>
                      )}
                      {"  "}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recommended actions */}
      <div style={BLOCK}>
        <div style={BLOCK_HEADER("var(--blue)")}>Recommended teacher actions</div>
        <div style={BLOCK_BODY}>
          {td.actions.map((action, i) => (
            <div key={i} style={ACTION_ITEM}>
              <span style={ACTION_DOT} aria-hidden="true">→</span>
              <span style={ACTION_TEXT}>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic summary */}
      <div style={BLOCK}>
        <div style={BLOCK_HEADER("var(--amber)")}>Diagnostic summary</div>
        <div style={BLOCK_BODY}>
          <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.75 }}>
            {data.diagnosticSummary}
          </p>
        </div>
      </div>

      {/* Readiness + projection */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div
          style={{
            background: readinessSty.bg,
            borderRadius: "var(--radius-lg)",
            padding: "14px 16px",
            border: `1px solid ${readinessSty.color}40`,
          }}
        >
          <div style={{ fontSize: 10, color: readinessSty.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Next test readiness
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: readinessSty.color }}>
            {td.readiness}
          </div>
        </div>
        <div
          style={{
            background: "var(--green-bg)",
            borderRadius: "var(--radius-lg)",
            padding: "14px 16px",
            border: "1px solid #1a3d26",
          }}
        >
          <div style={{ fontSize: 10, color: "var(--green)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Projected score
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--green)" }}>
            ~{td.projected}%
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>if revision plan followed</div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 14, lineHeight: 1.6 }}>
        Generated by ReviseIQ · {today} · Based on Claude Sonnet vision analysis.
        Projections are estimates — individual results vary with study effort and prior knowledge.
      </p>
    </div>
  );
});

export default TeacherReport;
