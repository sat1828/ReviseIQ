import { memo } from "react";

const TIERS = [
  {
    key:    "critical",
    label:  "Critical weaknesses",
    desc:   "Conceptual gaps — fix these first",
    accent: "var(--red)",
    bg:     "var(--red-bg)",
    border: "#4a1b0c",
  },
  {
    key:    "moderate",
    label:  "Moderate weaknesses",
    desc:   "Partial understanding / recall gaps",
    accent: "var(--amber)",
    bg:     "var(--amber-bg)",
    border: "#3d2a08",
  },
  {
    key:    "execution",
    label:  "Execution errors",
    desc:   "Calculation & misread — lowest conceptual risk",
    accent: "var(--blue)",
    bg:     "var(--blue-bg)",
    border: "#1a3050",
  },
];

const TIER_WRAP = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
};
const BODY = { padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 };
const AREA_LABEL = {
  fontSize: 11, fontWeight: 600, color: "var(--text2)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};
const CHIP_ROW = { display: "flex", flexWrap: "wrap", gap: 6 };
const CHIP = {
  background: "var(--surface2)",
  borderRadius: "var(--radius)",
  padding: "4px 10px",
  fontSize: 11,
};
const NARRATIVE = {
  fontSize: 12, color: "var(--text2)", lineHeight: 1.8,
  borderLeft: "2px solid var(--border2)", paddingLeft: 12,
};

const WeaknessMap = memo(function WeaknessMap({ map }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {TIERS.map(({ key, label, desc, accent, bg }) => {
        const items = map[key] || [];
        if (!items.length) return null;
        return (
          <div key={key} style={TIER_WRAP}>
            <div
              style={{
                background: bg,
                padding: "10px 14px",
                borderLeft: `3px solid ${accent}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: accent }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{desc}</div>
            </div>
            <div style={BODY}>
              {items.map((area, i) => (
                <div key={i}>
                  <div style={AREA_LABEL}>{area.area}</div>
                  <div style={CHIP_ROW}>
                    {(area.subConcepts || []).map((sc, j) => (
                      <div key={j} style={CHIP}>
                        <span style={{ color: "var(--text)" }}>{sc.name}</span>
                        {sc.affectsQuestions?.length > 0 && (
                          <span style={{ color: "var(--text3)", marginLeft: 5 }}>
                            Q{sc.affectsQuestions.join(", Q")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {map.strongZones?.length > 0 && (
        <div
          style={{
            background: "var(--green-bg)",
            borderRadius: "var(--radius-lg)",
            padding: "12px 14px",
            border: "1px solid #1a3d26",
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 600, color: "var(--green)",
              marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            ✅ Strong zones — reinforce, don&apos;t over-study
          </div>
          <div style={CHIP_ROW}>
            {map.strongZones.map((z, i) => (
              <span
                key={i}
                style={{
                  background: "#1a4a2a", borderRadius: "var(--radius)",
                  padding: "3px 10px", fontSize: 11, color: "var(--green)",
                }}
              >
                {z}
              </span>
            ))}
          </div>
        </div>
      )}

      {map.narrativeSummary && (
        <p style={NARRATIVE}>{map.narrativeSummary}</p>
      )}
    </div>
  );
});

export default WeaknessMap;
