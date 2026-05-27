// Primitive UI components.
// All inline style objects are defined OUTSIDE component functions
// so they are allocated once, not on every render.

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}

// ── Tag (error type badge) ─────────────────────────────────────────────────
const TAG_BASE = {
  display: "inline-block",
  fontSize: 11,
  fontWeight: 500,
  padding: "2px 8px",
  borderRadius: 999,
  whiteSpace: "nowrap",
};

export function Tag({ label, color, bg }) {
  return (
    <span
      style={{
        ...TAG_BASE,
        background: bg,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
const BAR_TRACK = {
  flex: 1,
  background: "var(--surface2)",
  borderRadius: 3,
  height: 6,
  overflow: "hidden",
};

export function Bar({ value, max, color }) {
  const w = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={BAR_TRACK}>
      <div
        style={{
          width: `${w}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
const TITLE_WRAP = { marginBottom: 20 };
const TITLE_ROW  = { display: "flex", alignItems: "center", gap: 8, marginBottom: 2 };
const TITLE_ICON = { fontSize: 16 };
const TITLE_TEXT = { fontSize: 15, fontWeight: 600, color: "var(--text)" };
const TITLE_SUB  = { fontSize: 12, color: "var(--text3)", marginLeft: 24 };

export function SectionTitle({ icon, title, sub }) {
  return (
    <div style={TITLE_WRAP}>
      <div style={TITLE_ROW}>
        <span style={TITLE_ICON} aria-hidden="true">{icon}</span>
        <span style={TITLE_TEXT}>{title}</span>
      </div>
      {sub && <p style={TITLE_SUB}>{sub}</p>}
    </div>
  );
}
