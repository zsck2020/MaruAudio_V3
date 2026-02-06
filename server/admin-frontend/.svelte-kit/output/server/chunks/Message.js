let seq = 0;
function isBrowser() {
  return typeof window !== "undefined" && typeof window.dispatchEvent === "function";
}
function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "success" || t === "error" || t === "warning" || t === "info") return t;
  return "info";
}
function showMessage(message, type = "info", duration = 3e3) {
  if (!isBrowser()) return;
  const id = `${Date.now()}_${++seq}`;
  const detail = {
    id,
    type: normalizeType(type),
    message: String(message ?? "")
  };
  window.dispatchEvent(new CustomEvent("show-message", { detail }));
  if (duration && duration > 0) {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("hide-message", { detail: { id } }));
    }, duration);
  }
}
const Message = {
  success(msg, duration) {
    showMessage(msg, "success", duration);
  },
  error(msg, duration) {
    showMessage(msg, "error", duration);
  },
  warning(msg, duration) {
    showMessage(msg, "warning", duration);
  },
  info(msg, duration) {
    showMessage(msg, "info", duration);
  }
};
export {
  Message as M,
  showMessage as s
};
