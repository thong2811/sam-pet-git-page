// ============================================================
// View Danh Sách Sản Phẩm (Tab Xuất Hàng)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { escapeHtml, labelFor, formatCell } from "../../utils/formatters.js";
import { state, getField } from "../../state/app-state.js";
import { addToPhieu } from "./ticket-view.js";

export function orderedColumns() {
  return [
    state.keys.maSP,
    state.keys.tenSP,
    state.keys.donVi,
    state.keys.giaBan
  ].filter(Boolean);
}

export function renderProductHead() {
  const cols = orderedColumns();
  const thead = $("product-head");
  if (!thead) return;

  thead.innerHTML = `<tr>${
    cols.map((c) => `<th class="px-4 py-3 font-semibold whitespace-nowrap">${escapeHtml(labelFor(c))}</th>`).join("")
  }<th class="px-3 py-3"></th></tr>`;
}

export function renderProducts() {
  const searchInput = $("search");
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const cols = orderedColumns();
  const maCol = state.keys.maSP;
  const tenCol = state.keys.tenSP;

  const filtered = state.products.filter((p) => {
    if (!keyword) return true;
    const ma = String(p[maCol] || "").toLowerCase();
    const ten = String(p[tenCol] || "").toLowerCase();
    return ma.includes(keyword) || ten.includes(keyword);
  });

  const countEl = $("product-count");
  if (countEl) {
    countEl.textContent = keyword
      ? `Hiển thị ${filtered.length} / ${state.products.length} sản phẩm`
      : `Đã tải ${state.products.length} sản phẩm`;
  }

  const emptyEl = $("product-empty");
  if (emptyEl) {
    emptyEl.classList.toggle("hidden", filtered.length > 0 || !state.products.length);
  }

  const bodyEl = $("product-body");
  if (bodyEl) {
    bodyEl.innerHTML = filtered.map((p, idx) => {
      const ma = getField(p, "maSP");
      const inPhieu = state.phieu.some((r) => r.productId === ma);
      const cells = cols.map((c) =>
        `<td class="px-4 py-2.5 whitespace-nowrap ${c === tenCol ? "font-medium text-ink" : "text-slate-600"}">${escapeHtml(formatCell(p[c]))}</td>`
      ).join("");
      const rowBg = inPhieu ? "bg-pine-100 ring-1 ring-inset ring-pine-300" : (idx % 2 === 0 ? "bg-white" : "bg-slate-100/60");
      return `<tr data-masp="${escapeHtml(ma)}" class="hover:bg-pine-100 ${rowBg}">
        ${cells}
        <td class="px-3 py-2">
          <button type="button" data-action="add-to-phieu" data-masp="${escapeHtml(ma)}"
            class="rounded-lg w-8 h-8 flex items-center justify-center bg-pine-700 hover:bg-pine-800 text-white text-lg font-bold leading-none">+</button>
        </td>
      </tr>`;
    }).join("");
  }

  const cardsEl = $("product-cards");
  if (cardsEl) {
    cardsEl.innerHTML = filtered.map((p, idx) => {
      const ma = getField(p, "maSP");
      const ten = getField(p, "tenSP");
      const donVi = getField(p, "donVi");
      const giaBan = getField(p, "giaBan");
      const inPhieu = state.phieu.some((r) => r.productId === ma);
      const cardBg = inPhieu ? "bg-pine-100" : (idx % 2 === 0 ? "bg-white" : "bg-slate-100/60");
      return `
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 ${cardBg}">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">${escapeHtml(ten)}</p>
            <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(ma)} · ${escapeHtml(donVi || "—")}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <p class="text-sm font-semibold text-pine-700">${giaBan ? Number(giaBan).toLocaleString("vi-VN") : "—"}</p>
            <button type="button" data-action="add-to-phieu" data-masp="${escapeHtml(ma)}"
              class="rounded-lg w-9 h-9 flex items-center justify-center bg-pine-700 hover:bg-pine-800 text-white text-xl font-bold leading-none">+</button>
          </div>
        </div>`;
    }).join("");
  }
}

export function findProductByMa(maSP) {
  if (!maSP) return null;
  const col = state.keys.maSP;
  return state.products.find((p) => String(p[col]) === String(maSP));
}

export function filterProducts(query, limit = 40) {
  const q = String(query || "").trim().toLowerCase();
  const maCol = state.keys.maSP;
  const tenCol = state.keys.tenSP;
  if (!q) return state.products.slice(0, limit);
  return state.products.filter((p) => {
    const ma = String(p[maCol] || "").toLowerCase();
    const ten = String(p[tenCol] || "").toLowerCase();
    return ma.includes(q) || ten.includes(q);
  }).slice(0, limit);
}

export function initProductsView() {
  const searchInput = $("search");
  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  const onAddClick = (e) => {
    const btn = e.target.closest('[data-action="add-to-phieu"]');
    if (!btn) return;
    const masp = btn.dataset.masp;
    const p = findProductByMa(masp);
    if (p) addToPhieu(p);
  };

  const bodyEl = $("product-body");
  if (bodyEl) bodyEl.addEventListener("click", onAddClick);

  const cardsEl = $("product-cards");
  if (cardsEl) cardsEl.addEventListener("click", onAddClick);
}
