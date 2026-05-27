import { useState } from "react";
import UploadZone from "./UploadZone.jsx";
import { useAnalysis } from "../../hooks/useAnalysis.js";
import Loading from "../loading/Loading.jsx";

const LABEL_STYLE = {
  fontSize: 11,
  color: "var(--text3)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: 6,
};

const LABEL_NOTE = {
  fontWeight: 400,
  textTransform: "none",
  letterSpacing: 0,
};

const ERROR_BOX = {
  background: "var(--red-bg)",
  border: "1px solid #4a1b0c",
  borderRadius: "var(--radius)",
  padding: "12px 14px",
  fontSize: 12,
  color: "var(--red)",
};

const PRIVACY_NOTE = {
  fontSize: 11,
  color: "var(--text3)",
  textAlign: "center",
  lineHeight: 1.6,
};

export default function UploadView({ onResult }) {
  const [file,      setFile]      = useState(null);
  const [answerKey, setAnswerKey] = useState("");
  const [context,   setContext]   = useState("");
  const [fileError, setFileError] = useState("");

  const { loading, stage, stageMessage, error, setError, runAnalysis } = useAnalysis();

  function submit() {
    if (!file || loading) return;
    runAnalysis({ file, answerKey, context }, onResult);
  }

  if (loading) return <Loading stage={stage} message={stageMessage} />;

  const displayError = fileError || error;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <UploadZone file={file} onFile={setFile} onError={setFileError} />

      <div>
        <label htmlFor="answer-key" style={LABEL_STYLE}>
          Answer key{" "}
          <span style={LABEL_NOTE}>(recommended — paste one answer per line)</span>
        </label>
        <textarea
          id="answer-key"
          className="form-textarea"
          value={answerKey}
          onChange={(e) => setAnswerKey(e.target.value)}
          placeholder={"1. C\n2. Newton's Third Law\n3. 4.5 mol/L\n4. B"}
          rows={5}
          aria-describedby="answer-key-hint"
        />
        <p id="answer-key-hint" style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          Without an answer key, the model will attempt to infer correct answers but may be less accurate.
        </p>
      </div>

      <div>
        <label htmlFor="context" style={LABEL_STYLE}>
          Context <span style={LABEL_NOTE}>(optional — improves resource recommendations)</span>
        </label>
        <input
          id="context"
          type="text"
          className="form-input"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. CBSE Class 12 Chemistry Unit 3  ·  Odisha HSC Physics 2025"
          aria-describedby="context-hint"
        />
        <p id="context-hint" style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          Include subject, board, and grade level for best results.
        </p>
      </div>

      {displayError && (
        <div role="alert" style={ERROR_BOX}>
          ⚠ {displayError}
          <button
            aria-label="Dismiss error"
            onClick={() => { setFileError(""); setError(""); }}
            style={{ marginLeft: 8, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 13 }}
          >
            ✕
          </button>
        </div>
      )}

      <button
        className="btn-primary"
        onClick={submit}
        disabled={!file}
        aria-disabled={!file}
      >
        {file ? "Run forensic analysis →" : "Upload an exam paper to begin"}
      </button>

      <p style={PRIVACY_NOTE}>
        Your exam paper is sent to Anthropic&apos;s API for analysis only. Nothing is stored.
        API key stays on the backend — never exposed to the browser.
      </p>
    </div>
  );
}
