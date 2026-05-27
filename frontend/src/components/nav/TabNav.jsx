// TabNav — WCAG-compliant tab list component.
// Uses role="tablist" / role="tab" / aria-selected / aria-controls.
const TAB_ACTIVE = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderRadius: "var(--radius)",
  border: "none",
  fontWeight: 600,
  fontSize: 13,
  background: "var(--surface)",
  color: "var(--text)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  transition: "all 0.15s",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const TAB_INACTIVE = {
  ...TAB_ACTIVE,
  background: "transparent",
  color: "var(--text3)",
  fontWeight: 400,
  boxShadow: "none",
};

const BADGE_STYLE = {
  background: "var(--surface2)",
  borderRadius: 10,
  fontSize: 10,
  padding: "1px 6px",
  color: "var(--text3)",
};

function Tab({ id, active, onClick, icon, label, badge, panelId }) {
  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={panelId || `panel-${id}`}
      onClick={onClick}
      style={active ? TAB_ACTIVE : TAB_INACTIVE}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
      {badge != null && <span style={BADGE_STYLE}>{badge}</span>}
    </button>
  );
}

export function TabNav({ active, onChange, tabs }) {
  return (
    <div role="tablist" aria-label="Report sections" className="tab-bar">
      {tabs.map((t) => (
        <Tab
          key={t.id}
          id={t.id}
          active={active === t.id}
          onClick={() => onChange(t.id)}
          icon={t.icon}
          label={t.label}
          badge={t.badge}
        />
      ))}
    </div>
  );
}
