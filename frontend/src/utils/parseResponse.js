/**
 * parseClaudeResponse
 * Strips optional markdown fences then parses JSON.
 * Throws a descriptive Error on failure — callers decide how to handle it.
 *
 * @param {string} raw - Raw text from the Claude API
 * @returns {object} Parsed JSON object
 */
export function parseClaudeResponse(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Empty or non-string response from model.");
  }
  const clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/\s*```\s*$/i,  "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(
      `Model returned non-JSON output. First 200 chars: ${clean.slice(0, 200)}`
    );
  }
}
