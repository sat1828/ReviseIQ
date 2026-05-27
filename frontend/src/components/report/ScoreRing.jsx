import { memo } from "react";

/**
 * ScoreRing
 * SVG donut chart showing the exam score percentage.
 * Reads color from CSS variables at render time so the design token is
 * the single source of truth — changing --green in CSS updates the ring too.
 */
const ScoreRing = memo(function ScoreRing({ p }) {
  const varName = p >= 75 ? "--green" : p >= 50 ? "--amber" : "--red";
  // Guard against SSR / test environments where document is not defined
  const color =
    typeof document !== "undefined"
      ? (getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#999")
      : p >= 75 ? "#3d9e6e" : p >= 50 ? "#d48c2a" : "#e05555";

  const r    = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ - (p / 100) * circ;

  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      role="img"
      aria-label={`Exam score: ${p}%`}
    >
      <title>Exam score: {p}%</title>
      <circle
        cx="55" cy="55" r={r}
        fill="none" stroke="var(--surface2)" strokeWidth="9"
      />
      <circle
        cx="55" cy="55" r={r}
        fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
      <text
        x="55" y="52" textAnchor="middle"
        fontSize="20" fontWeight="700" fill={color}
        aria-hidden="true"
      >
        {p}%
      </text>
      <text
        x="55" y="68" textAnchor="middle"
        fontSize="10" fill="var(--text3)"
        aria-hidden="true"
      >
        score
      </text>
    </svg>
  );
});

export default ScoreRing;
