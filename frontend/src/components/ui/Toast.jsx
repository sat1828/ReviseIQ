import { useState, useCallback, useEffect, useRef } from "react";

// ── Toast context/hook ────────────────────────────────────────────────────────
// Usage: const { toast } = useToast();
//        toast("Report copied!", "success");
//        toast("Something failed.", "error");

let _setToasts = null; // module-level setter, set once by ToastProvider

export function useToast() {
  const toast = useCallback((message, type = "info", duration = 3000) => {
    if (!_setToasts) return;
    const id = Date.now() + Math.random();
    _setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      _setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  return { toast };
}

// ── Toast item styles (static) ────────────────────────────────────────────────
const TYPE_STYLES = {
  success: { background: "var(--green-bg)", border: "1px solid #1a3d26",   color: "var(--green)", icon: "✓" },
  error:   { background: "var(--red-bg)",   border: "1px solid #4a1b0c",   color: "var(--red)",   icon: "⚠" },
  info:    { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)", icon: "ℹ" },
};

const CONTAINER = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  maxWidth: 320,
  pointerEvents: "none",
};

function ToastItem({ message, type, onDone }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.info;
  const timerRef = useRef(null);

  // Announce to screen readers via aria-live on the container
  return (
    <div
      style={{
        ...s,
        borderRadius: "var(--radius)",
        padding: "10px 14px",
        fontSize: 13,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        animation: "fadeIn 0.2s ease both",
        pointerEvents: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button
        onClick={onDone}
        aria-label="Dismiss notification"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: s.color, fontSize: 14, flexShrink: 0, padding: 0, lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── ToastProvider — render once at app root ───────────────────────────────────
export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  // Register setter at module level so useToast() can push without prop drilling
  useEffect(() => {
    _setToasts = setToasts;
    return () => { _setToasts = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={CONTAINER} role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          message={t.message}
          type={t.type}
          onDone={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
