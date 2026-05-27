import { useState, useCallback, memo } from "react";
import { TabNav } from "../nav/TabNav.jsx";
import { SectionTitle } from "../ui/index.jsx";
import ErrorBoundary from "../ui/ErrorBoundary.jsx";
import { useToast } from "../ui/Toast.jsx";
import Autopsy from "./Autopsy.jsx";
import Questions from "./Questions.jsx";
import WeaknessMap from "./WeaknessMap.jsx";
import { RevisionPlan } from "./RevisionPlan.jsx";
import TeacherReport from "./TeacherReport.jsx";

const HEADER = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
  flexWrap: "wrap",
  gap: 10,
};
const META_TITLE = { fontSize: 15, fontWeight: 700, color: "var(--text)" };
const META_SUB   = { fontSize: 11, color: "var(--text3)" };
const ACTION_ROW = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const BTN_SM = {
  fontSize: 11,
  color: "var(--text3)",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function exportJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `reviseiq-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyText(data, toast) {
  const lines = [
    `ReviseIQ Report — ${data.subject} (${data.examBoard})`,
    `Score: ${data.score.obtained}/${data.score.total} (${data.score.percentage}%)`,
    "",
    "DIAGNOSTIC SUMMARY",
    data.diagnosticSummary,
    "",
    "INCORRECT QUESTIONS",
    ...(data.questions || [])
      .filter((q) => !q.isCorrect)
      .map(
        (q) =>
          `Q${q.number} [${q.errorType}] — ${q.topic}\n  Why: ${q.whyItWentWrong}\n  Exercise: ${q.microExercise}`
      ),
  ];
  navigator.clipboard
    .writeText(lines.join("\n"))
    .then(() => toast("Report copied to clipboard.", "success"))
    .catch(() => toast("Copy failed — use Export JSON instead.", "error"));
}

const TABS = (wrongCount) => [
  { id: "autopsy",   icon: "🔬", label: "Autopsy" },
  { id: "questions", icon: "📋", label: "Questions", badge: wrongCount },
  { id: "map",       icon: "🗺",  label: "Weakness map" },
  { id: "plan",      icon: "📅", label: "3-Day plan" },
  { id: "teacher",  icon: "👩‍🏫", label: "Teacher report" },
];

const ReportView = memo(function ReportView({ data, onReset }) {
  const [tab, setTab] = useState("autopsy");
  const wrong = (data.questions || []).filter((q) => !q.isCorrect);
  const { toast } = useToast();

  const handleReset = useCallback(() => onReset(), [onReset]);

  return (
    <div className="report-content fade-in">
      <div style={HEADER}>
        <div>
          <div style={META_TITLE}>{data.subject}</div>
          <div style={META_SUB}>
            {data.examBoard} · {data.totalQuestions} questions
          </div>
        </div>

        <div style={ACTION_ROW} data-no-print>
          <button style={BTN_SM} onClick={() => copyText(data, toast)} aria-label="Copy report as plain text">
            📋 Copy
          </button>
          <button style={BTN_SM} onClick={() => exportJson(data)} aria-label="Export report as JSON file">
            ⬇ Export
          </button>
          <button style={BTN_SM} onClick={() => window.print()} aria-label="Print report">
            🖨 Print
          </button>
          <button style={BTN_SM} onClick={handleReset} aria-label="Start a new analysis">
            ← New
          </button>
        </div>
      </div>

      <TabNav active={tab} onChange={setTab} tabs={TABS(wrong.length)} />

      <ErrorBoundary>
        {tab === "autopsy" && (
          <section role="tabpanel" id="panel-autopsy" aria-labelledby="tab-autopsy" className="fade-in">
            <SectionTitle icon="🔬" title="Exam autopsy" sub="Forensic breakdown of your performance" />
            <Autopsy data={data} />
          </section>
        )}

        {tab === "questions" && (
          <section role="tabpanel" id="panel-questions" aria-labelledby="tab-questions" className="fade-in">
            <SectionTitle icon="📋" title="Question-by-question breakdown" sub={`${wrong.length} incorrect answers analysed`} />
            <Questions data={data} />
          </section>
        )}

        {tab === "map" && (
          <section role="tabpanel" id="panel-map" aria-labelledby="tab-map" className="fade-in">
            <SectionTitle icon="🗺" title="Personal weakness concept map" sub="Your knowledge vulnerabilities mapped by severity" />
            <WeaknessMap map={data.weaknessMap} />
          </section>
        )}

        {tab === "plan" && (
          <section role="tabpanel" id="panel-plan" aria-labelledby="tab-plan" className="fade-in">
            <SectionTitle icon="📅" title="3-Day targeted revision plan" sub="Calibrated precisely to your weakness profile" />
            <RevisionPlan plan={data.revisionPlan} />
          </section>
        )}

        {tab === "teacher" && (
          <section role="tabpanel" id="panel-teacher" aria-labelledby="tab-teacher" className="fade-in">
            <SectionTitle icon="👩‍🏫" title="Teacher / Parent dashboard" sub="Professional summary for educators and parents" />
            <TeacherReport data={data} />
          </section>
        )}
      </ErrorBoundary>
    </div>
  );
});

export default ReportView;
