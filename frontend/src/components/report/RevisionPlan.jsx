import { memo } from "react";

const DAY_ACCENTS = [
  { color: "var(--red)",   bg: "var(--red-bg)"   },
  { color: "var(--amber)", bg: "var(--amber-bg)"  },
  { color: "var(--green)", bg: "var(--green-bg)"  },
];

const SESSION_WRAP = {
  background: "var(--surface2)",
  borderRadius: "var(--radius)",
  padding: "12px 14px",
};
const SESSION_ROW = { display: "flex", gap: 8 };
const SESSION_KEY = {
  width: 66, fontSize: 10, color: "var(--text3)", flexShrink: 0,
  paddingTop: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
};
const SESSION_VAL = { fontSize: 11, color: "var(--text2)", lineHeight: 1.6 };
const CHK_WRAP = { borderTop: "1px solid var(--border)", paddingTop: 10 };
const CHK_TITLE = {
  fontSize: 10, fontWeight: 600, color: "var(--text3)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};
const CHK_ROW = { display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" };
const CHK_BOX = { fontSize: 12, flexShrink: 0, color: "var(--text3)" };
const CHK_TXT = { fontSize: 11, color: "var(--text2)", lineHeight: 1.5 };

const SESSION_FIELDS = ["goal", "resource", "activity", "selfCheck"];
const SESSION_LABELS = { goal: "Goal", resource: "Resource", activity: "Activity", selfCheck: "Self-check" };

const RevisionDay = memo(function RevisionDay({ data, dayNum }) {
  const { color, bg } = DAY_ACCENTS[dayNum - 1] || DAY_ACCENTS[0];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ background: bg, padding: "12px 16px", borderLeft: `3px solid ${color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              Day {dayNum}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{data.theme}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{data.priority}</div>
          </div>
          <span style={{ background: `${color}20`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color, fontWeight: 500 }}>
            {data.timeEstimate}
          </span>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.sessions || []).map((s, i) => (
          <div key={i} style={SESSION_WRAP}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                Session {i + 1} — {s.topic}
              </div>
              <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                {s.duration}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {SESSION_FIELDS.map((f) =>
                s[f] ? (
                  <div key={f} style={SESSION_ROW}>
                    <div style={SESSION_KEY}>{SESSION_LABELS[f]}</div>
                    <div style={SESSION_VAL}>{s[f]}</div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ))}

        {data.checkpoints?.length > 0 && (
          <div style={CHK_WRAP}>
            <div style={CHK_TITLE}>End-of-day checkpoints</div>
            {data.checkpoints.map((c, i) => (
              <div key={i} style={CHK_ROW}>
                <span style={CHK_BOX} aria-hidden="true">□</span>
                <span style={CHK_TXT}>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const RevisionPlan = memo(function RevisionPlan({ plan }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2, 3].map((n) =>
        plan[`day${n}`] ? (
          <RevisionDay key={n} data={plan[`day${n}`]} dayNum={n} />
        ) : null
      )}
    </div>
  );
});

export { RevisionDay, RevisionPlan };
