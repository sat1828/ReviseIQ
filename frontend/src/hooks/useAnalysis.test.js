import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalysis } from "../hooks/useAnalysis.js";

// ── SSE stream helper ─────────────────────────────────────────────────────────
function makeSSEStream(events) {
  // events: array of strings like "event: status\ndata: {...}\n\n"
  const body = events.join("");
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return stream;
}

function mockFetchSSE(events, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    body: makeSSEStream(events),
    json: async () => ({ error: "rate limited" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  delete global.fetch;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useAnalysis", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useAnalysis());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.stage).toBe(0);
    expect(result.current.stageMessage).toBe("");
  });

  it("sets loading=true during analysis", async () => {
    // Provide a stream that never closes — to catch mid-flight state
    let resolveStream;
    const neverEndingStream = new ReadableStream({
      start(controller) {
        resolveStream = () => controller.close();
      },
    });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, body: neverEndingStream });

    const { result } = renderHook(() => useAnalysis());
    const onResult = vi.fn();
    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });

    act(() => {
      result.current.runAnalysis({ file, answerKey: "", context: "" }, onResult);
    });

    expect(result.current.loading).toBe(true);
    resolveStream();
  });

  it("calls onResult with parsed report on 'result' event", async () => {
    const fakeReport = { subject: "Chemistry", score: { obtained: 14, total: 20, percentage: 70 } };
    mockFetchSSE([
      `event: status\ndata: ${JSON.stringify({ stage: 0, message: "Starting" })}\n\n`,
      `event: result\ndata: ${JSON.stringify(fakeReport)}\n\n`,
    ]);

    const { result } = renderHook(() => useAnalysis());
    const onResult = vi.fn();
    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runAnalysis({ file, answerKey: "", context: "" }, onResult);
    });

    expect(onResult).toHaveBeenCalledWith(fakeReport);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("sets error state on 'error' event from server", async () => {
    mockFetchSSE([
      `event: error\ndata: ${JSON.stringify({ message: "Analysis failed." })}\n\n`,
    ]);

    const { result } = renderHook(() => useAnalysis());
    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runAnalysis({ file, answerKey: "", context: "" }, vi.fn());
    });

    expect(result.current.error).toBe("Analysis failed.");
    expect(result.current.loading).toBe(false);
  });

  it("sets error state on non-ok HTTP response (e.g. 429 rate limit)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      body: null,
      json: async () => ({ error: "Too many requests." }),
    });

    const { result } = renderHook(() => useAnalysis());
    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runAnalysis({ file, answerKey: "", context: "" }, vi.fn());
    });

    expect(result.current.error).toBe("Too many requests.");
    expect(result.current.loading).toBe(false);
  });

  it("updates stage and stageMessage on 'status' events", async () => {
    const stages = [];
    mockFetchSSE([
      `event: status\ndata: ${JSON.stringify({ stage: 0, message: "Extracting…" })}\n\n`,
      `event: status\ndata: ${JSON.stringify({ stage: 1, message: "Classifying…" })}\n\n`,
      `event: status\ndata: ${JSON.stringify({ stage: 2, message: "Mapping…" })}\n\n`,
      `event: result\ndata: ${JSON.stringify({ subject: "Maths" })}\n\n`,
    ]);

    const { result } = renderHook(() => useAnalysis());
    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runAnalysis({ file, answerKey: "", context: "" }, vi.fn());
    });

    // After stream ends, final stage should be 2 (last status before result)
    expect(result.current.stage).toBe(2);
  });

  it("sets network error when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network unreachable"));

    const { result } = renderHook(() => useAnalysis());
    const file = new File(["x"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runAnalysis({ file, answerKey: "", context: "" }, vi.fn());
    });

    expect(result.current.error).toBe("Network unreachable");
    expect(result.current.loading).toBe(false);
  });

  it("sends FormData with file, answerKey, context to /api/analyse", async () => {
    mockFetchSSE([`event: result\ndata: ${JSON.stringify({ subject: "Physics" })}\n\n`]);

    const { result } = renderHook(() => useAnalysis());
    const file = new File(["img"], "exam.png", { type: "image/png" });

    await act(async () => {
      await result.current.runAnalysis(
        { file, answerKey: "1. A\n2. B", context: "CBSE Class 10" },
        vi.fn()
      );
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/analyse", expect.objectContaining({
      method: "POST",
    }));

    const callArgs = global.fetch.mock.calls[0];
    const formData = callArgs[1].body;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("answerKey")).toBe("1. A\n2. B");
    expect(formData.get("context")).toBe("CBSE Class 10");
  });
});
