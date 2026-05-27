import { describe, it, expect } from "vitest";
import { parseClaudeResponse } from "../utils/parseResponse.js";
import { etColor, etBg, ERROR_TYPES } from "../constants/errorTypes.js";

// ── parseClaudeResponse ───────────────────────────────────────────────────────

describe("parseClaudeResponse", () => {
  it("parses clean JSON", () => {
    const raw = '{"score": 54}';
    expect(parseClaudeResponse(raw)).toEqual({ score: 54 });
  });

  it("strips leading ```json fence", () => {
    const raw = "```json\n{\"score\": 54}\n```";
    expect(parseClaudeResponse(raw)).toEqual({ score: 54 });
  });

  it("strips trailing ``` fence with trailing whitespace", () => {
    const raw = "```json\n{\"score\": 54}\n```   ";
    expect(parseClaudeResponse(raw)).toEqual({ score: 54 });
  });

  it("strips fence without json tag", () => {
    const raw = "```\n{\"score\": 54}\n```";
    expect(parseClaudeResponse(raw)).toEqual({ score: 54 });
  });

  it("throws on empty string", () => {
    expect(() => parseClaudeResponse("")).toThrow("Empty");
  });

  it("throws on non-string input", () => {
    expect(() => parseClaudeResponse(null)).toThrow();
  });

  it("throws on non-JSON text", () => {
    expect(() => parseClaudeResponse("sorry, I cannot help with that")).toThrow(
      "non-JSON"
    );
  });

  it("throws on truncated JSON", () => {
    expect(() => parseClaudeResponse('{"score": 54, "questions": [')).toThrow();
  });

  it("includes first 200 chars in error message for debugging", () => {
    try {
      parseClaudeResponse("not json at all");
    } catch (e) {
      expect(e.message).toContain("not json at all");
    }
  });
});

// ── errorTypes helpers ────────────────────────────────────────────────────────

describe("etColor", () => {
  it("returns correct color for Conceptual Gap", () => {
    expect(etColor("Conceptual Gap")).toBe("#e05555");
  });

  it("returns correct color for Calculation Error", () => {
    expect(etColor("Calculation Error")).toBe("#d48c2a");
  });

  it("returns fallback #999999 for unknown type", () => {
    expect(etColor("Something Unknown")).toBe("#999999");
  });

  it("returns fallback for undefined", () => {
    expect(etColor(undefined)).toBe("#999999");
  });
});

describe("etBg", () => {
  it("returns correct bg for Knowledge Gap", () => {
    expect(etBg("Knowledge Gap")).toBe("#140f1f");
  });

  it("returns fallback for empty string", () => {
    expect(etBg("")).toBe("#1a1a1a");
  });
});

describe("ERROR_TYPES", () => {
  it("has 6 entries", () => {
    expect(ERROR_TYPES).toHaveLength(6);
  });

  it("every entry has required fields", () => {
    for (const et of ERROR_TYPES) {
      expect(et).toHaveProperty("key");
      expect(et).toHaveProperty("label");
      expect(et).toHaveProperty("type");
      expect(et).toHaveProperty("color");
      expect(et).toHaveProperty("bg");
    }
  });

  it("no two entries share the same key", () => {
    const keys = ERROR_TYPES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("no two entries share the same type", () => {
    const types = ERROR_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });
});
