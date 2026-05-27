import { useState, useCallback } from "react";

/**
 * useAnalysis
 * Sends exam file to /api/analyse via POST, reads the SSE stream,
 * and surfaces real progress stages emitted by the backend.
 *
 * Stage values: 0 = received, 1 = classifying, 2 = weakness map, 3 = plan
 * These correspond to actual server milestones — not fake timers.
 */
export function useAnalysis() {
  const [loading,      setLoading]      = useState(false);
  const [stage,        setStage]        = useState(0);
  const [stageMessage, setStageMessage] = useState("");
  const [error,        setError]        = useState("");

  const runAnalysis = useCallback(async ({ file, answerKey, context }, onResult) => {
    setLoading(true);
    setError("");
    setStage(0);
    setStageMessage("Sending to server…");

    const form = new FormData();
    form.append("examFile",  file);
    form.append("answerKey", answerKey);
    form.append("context",   context);

    try {
      const response = await fetch("/api/analyse", { method: "POST", body: form });

      if (!response.ok || !response.body) {
        // Non-streaming error (e.g. rate limit 429, multer rejection 400)
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop(); // hold incomplete last line

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const payload = JSON.parse(raw);
              if (currentEvent === "status") {
                setStage(payload.stage ?? 0);
                setStageMessage(payload.message ?? "");
              } else if (currentEvent === "result") {
                onResult(payload);
              } else if (currentEvent === "error") {
                setError(payload.message || "Unknown error from server.");
              }
            } catch { /* malformed SSE data — ignore */ }
            currentEvent = ""; // reset after consuming
          }
        }
      }
    } catch (err) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, stage, stageMessage, error, setError, runAnalysis };
}
