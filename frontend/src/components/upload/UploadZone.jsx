import { useRef, useState, useCallback } from "react";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * UploadZone
 * Drag-and-drop + click file selector.
 * Reports validation errors via onError(message) — no alert().
 * Fully keyboard accessible: Enter/Space triggers the file picker.
 */
export default function UploadZone({ file, onFile, onError }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handle = useCallback(
    (f) => {
      if (!f) return;
      if (!ALLOWED_MIME.includes(f.type)) {
        onError("Please upload a JPG, PNG, WEBP, GIF or PDF file.");
        return;
      }
      if (f.size > MAX_BYTES) {
        onError("File is too large. Maximum size is 15 MB.");
        return;
      }
      onError(""); // clear any previous error
      onFile(f);
    },
    [onFile, onError]
  );

  const ariaLabel = file
    ? `Selected file: ${file.name}. Click or press Enter to change.`
    : "Upload exam paper. Click, press Enter, or drag and drop a file here.";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={`upload-zone${drag ? " drag-over" : ""}${file ? " file-present" : ""}`}
      onClick={() => inputRef.current.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files[0])}
      />
      <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">
        {file ? "✅" : "📄"}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: file ? "var(--green)" : "var(--text)",
        }}
      >
        {file ? file.name : "Drop your exam paper here"}
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
        {file
          ? `${(file.size / 1024).toFixed(0)} KB · click or press Enter to change`
          : "JPG · PNG · WEBP · PDF · max 15 MB · drag & drop or click"}
      </div>
    </div>
  );
}
