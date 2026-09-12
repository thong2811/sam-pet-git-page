// ============================================================
// Quản Lý Hiển Thị Trạng Thái Đồng Bộ Google Sheets (UI Indicator)
// ============================================================
import { $ } from "./dom.js";

/**
 * Cập nhật chip đồng bộ toàn cục trên thanh Header chính
 */
export function updateGlobalHeaderSync(status, label) {
  const pill = $("header-sync-pill");
  const dot = $("header-sync-dot");
  const text = $("header-sync-text");
  if (!pill || !dot) return;

  if (status === "syncing") {
    dot.className = "h-2 w-2 rounded-full bg-amber-400 animate-pulse";
    if (text) text.textContent = label || "Đang đồng bộ…";
    pill.className = "inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium border border-amber-400/30 text-amber-200 transition-all cursor-default";
  } else if (status === "retrying") {
    dot.className = "h-2 w-2 rounded-full bg-amber-400 animate-ping";
    if (text) text.textContent = label || "Đang thử lại…";
    pill.className = "inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium border border-amber-400/30 text-amber-200 transition-all cursor-default";
  } else if (status === "synced") {
    dot.className = "h-2 w-2 rounded-full bg-emerald-400";
    if (text) text.textContent = label || "Đã đồng bộ";
    pill.className = "inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-2.5 py-1 text-[11px] font-medium border border-white/15 shadow-xs text-pine-100 transition-all cursor-default";
  } else if (status === "offline") {
    dot.className = "h-2 w-2 rounded-full bg-slate-400";
    if (text) text.textContent = label || "Bản lưu";
    pill.className = "inline-flex items-center gap-1.5 rounded-full bg-slate-700/40 px-2.5 py-1 text-[11px] font-medium border border-slate-500/30 text-slate-300 transition-all cursor-default";
  }
}

/**
 * Cập nhật badge đồng bộ chuyên biệt tại từng tab (Xuất hàng, Chiết hàng, Kiểm kê)
 */
export function updateSectionSyncBadge(elementId, status, detail = {}) {
  const el = $(elementId);
  if (!el) return;

  if (status === "cached-syncing") {
    el.innerHTML = `<span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span><span>Đang đồng bộ…</span>`;
    el.className = "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200";
    updateGlobalHeaderSync("syncing", "Đang đồng bộ…");
  } else if (status === "retrying") {
    el.innerHTML = `<span class="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span><span>Thử lại ${detail.attempt || 1}/${detail.maxRetries || 2}…</span>`;
    el.className = "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200";
    updateGlobalHeaderSync("retrying", `Thử lại ${detail.attempt || 1}…`);
  } else if (status === "synced") {
    const time = detail.time || new Date().toLocaleTimeString("vi-VN");
    el.innerHTML = `<span class="h-2 w-2 rounded-full bg-emerald-500"></span><span>Đã đồng bộ (${time})</span>`;
    el.className = "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200";
    updateGlobalHeaderSync("synced", "Đã đồng bộ");
  } else if (status === "offline-fallback") {
    el.innerHTML = `<span class="h-2 w-2 rounded-full bg-slate-400"></span><span>Bản lưu (${detail.time || ""})</span>`;
    el.className = "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200";
    updateGlobalHeaderSync("offline", "Bản lưu");
  } else if (status === "loading-fresh") {
    el.innerHTML = `<span class="h-2 w-2 rounded-full bg-pine-500 animate-pulse"></span><span>Đang tải mới…</span>`;
    el.className = "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-pine-50 text-pine-700 border border-pine-200";
    updateGlobalHeaderSync("syncing", "Đang tải…");
  }
}
