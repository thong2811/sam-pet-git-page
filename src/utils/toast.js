// ============================================================
// Toast Notification Utility
// ============================================================
import { $ } from "./dom.js";

const colors = {
  success: "bg-pine-800 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-800 text-white",
  warning: "bg-amber-500 text-ink"
};

export function toast(message, type = "info") {
  const container = $("toasts");
  if (!container) {
    console.log(`[Toast ${type}]`, message);
    return;
  }
  const el = document.createElement("div");
  el.className = `toast-enter rounded-xl px-4 py-3 text-sm shadow-lift ${colors[type] || colors.info}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .25s";
    setTimeout(() => el.remove(), 250);
  }, 3200);
}
