// Single source of truth for error type metadata.
// Used by: AutopsySummary, QuestionCard, Questions filter, WeaknessMap.
export const ERROR_TYPES = [
  { key: "conceptualGap",        label: "Conceptual Gap",        type: "Conceptual Gap",        color: "#e05555", bg: "#1f1010" },
  { key: "calculationError",     label: "Calculation Error",     type: "Calculation Error",     color: "#d48c2a", bg: "#1a1508" },
  { key: "misreadQuestion",      label: "Misread Question",      type: "Misread Question",      color: "#4a8fd4", bg: "#0d1520" },
  { key: "partialUnderstanding", label: "Partial Understanding", type: "Partial Understanding", color: "#3d9e6e", bg: "#0c1a13" },
  { key: "knowledgeGap",         label: "Knowledge Gap",         type: "Knowledge Gap",         color: "#8b74d4", bg: "#140f1f" },
  { key: "flagged",              label: "Flagged",               type: "Flagged",               color: "#999999", bg: "#1a1a1a" },
];

export function etColor(type) {
  return ERROR_TYPES.find((e) => e.type === type)?.color ?? "#999999";
}

export function etBg(type) {
  return ERROR_TYPES.find((e) => e.type === type)?.bg ?? "#1a1a1a";
}
