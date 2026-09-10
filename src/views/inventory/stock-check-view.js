// ============================================================
// View Kiểm Kê Kho (Stock Check View)
// Tối giản: 1 danh sách sản phẩm, mỗi sản phẩm có 1 input tồn thực tế
// Hỗ trợ nút xóa ✕ từng món và đồng bộ xóa lên Google Sheets
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { escapeHtml, todayInputValue, toYMD } from "../../utils/formatters.js";
import { state, isDateLocked } from "../../state/app-state.js";
import { saveStockCheckAPI, loadStockCheckHistoryAPI } from "../../services/api.js";

let isSaving = false;
let isLoading = false;

/**
 * Lấy danh sách các sản phẩm đã có nhập số tồn thực tế
 */
export function getCountedList() {
  const maCol = state.keys.maSP;
  const tenCol = state.keys.tenSP;
  const donViCol = state.keys.donVi;
  const counts = state.stockCheck.counts || {};

  return state.products
    .map((p) => {
      const ma = String(p[maCol] || "").trim();
      const val = counts[ma];
      if (val === undefined || val === "" || val === null) {
        return null;
      }
      return {
        productId: ma,
        productName: String(p[tenCol] || "").trim(),
        unit: String(p[donViCol] || "").trim(),
        actualStock: Number(val) || 0
      };
    })
    .filter(Boolean);
}

/**
 * Cập nhật số liệu thống kê nhanh trên header và badge
 */
export function updateStockCheckStats() {
  const total = state.products.length;
  const countedItems = getCountedList();
  const countedCount = countedItems.length;

  const totalEl = $("stock-check-stat-total");
  const countedEl = $("stock-check-stat-counted");
  const sidebarBadge = $("sidebar-badge-kiemke");
  const badgeChip = $("badge-chip");

  if (totalEl) totalEl.textContent = `${total} SP`;
  if (countedEl) countedEl.textContent = `${countedCount} SP`;
  if (sidebarBadge) sidebarBadge.textContent = `${countedCount}/${total}`;

  if (state.activeTab === "kiemke" && badgeChip) {
    badgeChip.innerHTML = `<span class="sm:hidden font-bold">${countedCount}/${total}</span><span class="hidden sm:inline">Đã kiểm: ${countedCount}/${total}</span>`;
  }
}

/**
 * Render danh sách sản phẩm kèm ô nhập tồn thực tế và nút xóa ✕
 */
export function renderStockCheck() {
  const searchInput = $("stock-check-search");
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const maCol = state.keys.maSP;
  const tenCol = state.keys.tenSP;
  const donViCol = state.keys.donVi;
  const counts = state.stockCheck.counts || {};

  const filtered = state.products.filter((p) => {
    const ma = String(p[maCol] || "").trim();
    const ten = String(p[tenCol] || "").trim();
    if (!keyword) return true;
    return ma.toLowerCase().includes(keyword) || ten.toLowerCase().includes(keyword);
  });

  const bodyEl = $("stock-check-body");
  const cardsEl = $("stock-check-cards");
  const emptyEl = $("stock-check-empty");
  const summaryEl = $("stock-check-summary");

  if (summaryEl) {
    summaryEl.textContent = keyword
      ? `Hiển thị ${filtered.length} / ${state.products.length} sản phẩm`
      : `Danh mục ${state.products.length} sản phẩm`;
  }

  if (emptyEl) {
    emptyEl.classList.toggle("hidden", filtered.length > 0 || !state.products.length);
  }

  // Render Desktop Table Rows
  if (bodyEl) {
    bodyEl.innerHTML = filtered.map((p, idx) => {
      const ma = String(p[maCol] || "").trim();
      const ten = String(p[tenCol] || "").trim();
      const donVi = String(p[donViCol] || "").trim();
      const val = counts[ma];
      const hasCount = val !== undefined && val !== "" && val !== null;
      const actualVal = hasCount ? val : "";

      const rowBg = hasCount
        ? "bg-amber-50/60 hover:bg-amber-100/60"
        : (idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/60");

      return `
        <tr data-masp="${escapeHtml(ma)}" class="transition-colors border-b border-slate-100 ${rowBg}">
          <td class="px-3 py-2.5 text-center text-xs text-slate-400 font-mono">${idx + 1}</td>
          <td class="px-4 py-2.5 font-mono text-xs font-semibold text-pine-900 whitespace-nowrap">${escapeHtml(ma)}</td>
          <td class="px-4 py-2.5 text-sm font-medium text-slate-900">${escapeHtml(ten)}</td>
          <td class="px-3 py-2.5 text-center text-xs text-slate-600">${escapeHtml(donVi || "—")}</td>
          <td class="px-4 py-2 w-56">
            <div class="flex items-center justify-center gap-1.5">
              <button type="button" data-action="dec" data-masp="${escapeHtml(ma)}"
                class="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-base flex items-center justify-center transition-all shadow-xs">−</button>
              <input type="number" min="0" step="any" data-field="actual-stock" data-masp="${escapeHtml(ma)}"
                value="${escapeHtml(actualVal)}" placeholder="—"
                class="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner ${hasCount ? "text-amber-900 border-amber-300 bg-amber-50/80 font-bold" : "text-slate-700"}" />
              <button type="button" data-action="inc" data-masp="${escapeHtml(ma)}"
                class="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-base flex items-center justify-center transition-all shadow-xs">+</button>
              <button type="button" data-action="clear" data-masp="${escapeHtml(ma)}"
                title="Xóa số tồn món này"
                class="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-bold text-sm flex items-center justify-center transition-all ${hasCount ? "" : "invisible pointer-events-none"}">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Render Mobile Cards List
  if (cardsEl) {
    cardsEl.innerHTML = filtered.map((p) => {
      const ma = String(p[maCol] || "").trim();
      const ten = String(p[tenCol] || "").trim();
      const donVi = String(p[donViCol] || "").trim();
      const val = counts[ma];
      const hasCount = val !== undefined && val !== "" && val !== null;
      const actualVal = hasCount ? val : "";
      const cardBg = hasCount ? "bg-amber-50/60 border-amber-200 ring-1 ring-amber-300/60" : "bg-white border-slate-200";

      return `
        <div class="p-3.5 rounded-2xl border shadow-xs transition-all ${cardBg}" data-masp="${escapeHtml(ma)}">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-bold text-slate-900 leading-snug">${escapeHtml(ten)}</h4>
              <p class="text-xs text-slate-500 mt-0.5 font-mono">Mã: <strong>${escapeHtml(ma)}</strong> · ĐVT: <span class="text-slate-700 font-semibold">${escapeHtml(donVi || "—")}</span></p>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${hasCount ? "bg-amber-200 text-amber-900 font-bold" : "bg-slate-100 text-slate-500"}">
              ${hasCount ? "Đã nhập" : "Chưa nhập"}
            </span>
          </div>

          <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tồn thực tế:</label>
            <div class="flex items-center gap-1.5">
              <button type="button" data-action="dec" data-masp="${escapeHtml(ma)}"
                class="w-9 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-base flex items-center justify-center shadow-xs">−</button>
              <input type="number" min="0" step="any" data-field="actual-stock" data-masp="${escapeHtml(ma)}"
                value="${escapeHtml(actualVal)}" placeholder="—"
                class="w-24 h-9 rounded-xl border border-slate-300 bg-white px-2 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner ${hasCount ? "text-amber-900 border-amber-300 bg-amber-50/80 font-bold" : "text-slate-700"}" />
              <button type="button" data-action="inc" data-masp="${escapeHtml(ma)}"
                class="w-9 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-base flex items-center justify-center shadow-xs">+</button>
              <button type="button" data-action="clear" data-masp="${escapeHtml(ma)}"
                title="Xóa số tồn món này"
                class="w-9 h-9 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-bold text-sm flex items-center justify-center ${hasCount ? "" : "invisible pointer-events-none"}">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  updateStockCheckStats();
}

/**
 * Xử lý khi người dùng xóa trắng số tồn của 1 sản phẩm (bấm nút ✕)
 */
export function clearStockCount(maSP) {
  if (!state.stockCheck.counts) state.stockCheck.counts = {};
  if (!state.stockCheck.deletedProductIds) state.stockCheck.deletedProductIds = [];

  // Ghi nhận món này cần xóa trên Google Sheets
  if (!state.stockCheck.deletedProductIds.includes(maSP)) {
    state.stockCheck.deletedProductIds.push(maSP);
  }

  delete state.stockCheck.counts[maSP];

  // Cập nhật ô input trên màn hình
  const inputs = document.querySelectorAll(`input[data-field="actual-stock"][data-masp="${CSS.escape(maSP)}"]`);
  inputs.forEach((inp) => {
    inp.value = "";
  });

  updateStockCheckStats();
  syncRowVisuals(maSP);
}

/**
 * Xử lý khi người dùng nhập số lượng tồn thực tế
 */
export function handleStockCountInput(maSP, rawValue) {
  if (!state.stockCheck.counts) state.stockCheck.counts = {};
  if (!state.stockCheck.deletedProductIds) state.stockCheck.deletedProductIds = [];

  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    delete state.stockCheck.counts[maSP];
    if (!state.stockCheck.deletedProductIds.includes(maSP)) {
      state.stockCheck.deletedProductIds.push(maSP);
    }
  } else {
    const num = Number(rawValue);
    state.stockCheck.counts[maSP] = isNaN(num) ? 0 : num;
    // Bỏ khỏi danh sách pendingDeletes nếu người dùng nhập lại số
    state.stockCheck.deletedProductIds = state.stockCheck.deletedProductIds.filter((id) => id !== maSP);
  }

  updateStockCheckStats();
  syncRowVisuals(maSP);
}

/**
 * Tăng/giảm nhanh số lượng tồn thực tế (+ / -)
 */
export function changeStockCountStep(maSP, delta) {
  if (!state.stockCheck.counts) state.stockCheck.counts = {};
  const currVal = state.stockCheck.counts[maSP] !== undefined ? Number(state.stockCheck.counts[maSP]) : 0;
  const newVal = Math.max(0, currVal + delta);
  handleStockCountInput(maSP, newVal);

  const inputs = document.querySelectorAll(`input[data-field="actual-stock"][data-masp="${CSS.escape(maSP)}"]`);
  inputs.forEach((inp) => {
    inp.value = newVal;
  });
}

function syncRowVisuals(maSP) {
  const hasCount = state.stockCheck.counts && state.stockCheck.counts[maSP] !== undefined;

  // Desktop row
  const row = document.querySelector(`tr[data-masp="${CSS.escape(maSP)}"]`);
  if (row) {
    row.classList.toggle("bg-amber-50/60", hasCount);
    const input = row.querySelector(`input[data-field="actual-stock"]`);
    if (input) {
      input.classList.toggle("text-amber-900", hasCount);
      input.classList.toggle("border-amber-300", hasCount);
      input.classList.toggle("bg-amber-50/80", hasCount);
      input.classList.toggle("font-bold", hasCount);
    }
    const clearBtn = row.querySelector(`button[data-action="clear"]`);
    if (clearBtn) {
      clearBtn.classList.toggle("invisible", !hasCount);
      clearBtn.classList.toggle("pointer-events-none", !hasCount);
    }
  }

  // Mobile card
  const card = document.querySelector(`div[data-masp="${CSS.escape(maSP)}"]`);
  if (card) {
    card.classList.toggle("bg-amber-50/60", hasCount);
    card.classList.toggle("border-amber-200", hasCount);
    card.classList.toggle("ring-1", hasCount);
    card.classList.toggle("ring-amber-300/60", hasCount);
    const badge = card.querySelector(".font-mono");
    if (badge) {
      badge.textContent = hasCount ? "Đã nhập" : "Chưa nhập";
      badge.className = `text-[10px] font-mono px-2 py-0.5 rounded-full ${hasCount ? "bg-amber-200 text-amber-900 font-bold" : "bg-slate-100 text-slate-500"}`;
    }
    const clearBtn = card.querySelector(`button[data-action="clear"]`);
    if (clearBtn) {
      clearBtn.classList.toggle("invisible", !hasCount);
      clearBtn.classList.toggle("pointer-events-none", !hasCount);
    }
  }
}

/**
 * Lưu kết quả kiểm kê lên Google Sheets (tab KiemKe)
 * Hỗ trợ cập nhật (Upsert) và xóa các món đã đánh dấu xóa
 */
async function saveToGoogleSheets() {
  if (isSaving) return;

  const rowsToSave = getCountedList();
  const deletedPids = state.stockCheck.deletedProductIds || [];

  if (rowsToSave.length === 0 && deletedPids.length === 0) {
    toast("Vui lòng nhập số tồn thực tế cho ít nhất 1 sản phẩm trước khi lưu.", "error");
    return;
  }

  const dateInput = $("stock-check-date");
  const auditDate = (dateInput && dateInput.value) ? dateInput.value : todayInputValue();

  if (!auditDate) {
    toast("Vui lòng chọn ngày kiểm kê.", "error");
    return;
  }

  if (isDateLocked(auditDate)) {
    toast(`Ngày ${auditDate} đã bị khóa sổ sách! Không thể lưu kiểm kê vào ngày này.`, "error");
    return;
  }

  isSaving = true;
  const btn = $("btn-stock-check-save-sheets");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">⟳</span> Đang lưu lên Sheets…`;
  }

  try {
    const res = await saveStockCheckAPI(rowsToSave, auditDate, "", deletedPids);
    if (res && res.status === "ok") {
      state.stockCheck.deletedProductIds = [];
      toast(`Đã lưu thành công lên Google Sheets!`, "success");
      // GIỮ NGUYÊN các số tồn đã nhập trong input để người dùng thấy rõ
      renderStockCheck();
    } else {
      toast(res?.message || "Lỗi lưu dữ liệu lên Google Sheets.", "error");
    }
  } catch (err) {
    toast("Lỗi kết nối khi lưu kiểm kê: " + err.message, "error");
  } finally {
    isSaving = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> <span>Lưu lên Google Sheets</span>`;
    }
  }
}

/**
 * Tải lại số tồn thực tế đã lưu từ Google Sheets về điền vào các ô input
 */
export async function loadStockCheckFromSheets() {
  if (isLoading) return;
  isLoading = true;

  const btnReload = $("btn-stock-check-reload");
  const loadingEl = $("stock-check-loading");
  const contentEl = $("stock-check-content");
  const summaryEl = $("stock-check-summary");

  const setSpinning = (spinning) => {
    if (!btnReload) return;
    btnReload.disabled = spinning;
    btnReload.innerHTML = spinning
      ? `<span class="inline-block animate-spin mr-1">⟳</span> <span>Đang tải…</span>`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> <span>Tải lại</span>`;
  };

  setSpinning(true);
  if (loadingEl) loadingEl.classList.remove("hidden");
  if (contentEl) contentEl.classList.add("hidden");
  if (summaryEl) {
    summaryEl.innerHTML = `<span class="inline-flex items-center gap-1.5 text-pine-700 font-semibold"><span class="h-2 w-2 rounded-full bg-pine-600 animate-ping inline-block"></span> Đang tải dữ liệu kiểm kê từ Google Sheets…</span>`;
  }

  const dateInput = $("stock-check-date");
  const selectedDate = (dateInput && dateInput.value) ? toYMD(dateInput.value) : toYMD(todayInputValue());

  try {
    const rows = await loadStockCheckHistoryAPI();
    state.stockCheck.history = rows || [];

    // Tìm các bản ghi cho ngày được chọn (hoặc bản ghi mới nhất của từng sản phẩm)
    let matchedRows = (rows || []).filter((r) => toYMD(r.date) === selectedDate);
    if (matchedRows.length === 0 && rows && rows.length > 0) {
      matchedRows = rows;
    }

    if (!state.stockCheck.counts) state.stockCheck.counts = {};

    let loadedCount = 0;
    matchedRows.forEach((r) => {
      const pid = String(r.productId || "").replace(/^'+/, "").trim();
      if (pid && state.stockCheck.counts[pid] === undefined) {
        state.stockCheck.counts[pid] = Number(r.actualStock) || 0;
        loadedCount++;
      }
    });

    renderStockCheck();

    if (loadedCount > 0) {
      toast(`Đã tải lại ${loadedCount} số tồn thực tế từ Google Sheets!`, "success");
    } else {
      toast("Chưa có số tồn nào được lưu trên Google Sheets.", "info");
    }
  } catch (err) {
    toast("Không tải được dữ liệu từ Sheets: " + err.message, "error");
  } finally {
    isLoading = false;
    setSpinning(false);
    if (loadingEl) loadingEl.classList.add("hidden");
    if (contentEl) contentEl.classList.remove("hidden");
  }
}

/**
 * Khởi tạo sự kiện cho trang Kiểm Kê Kho
 */
export function initStockCheckView() {
  // Đặt ngày mặc định là hôm nay
  const dateInput = $("stock-check-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = todayInputValue();
  }

  // Khi thay đổi ngày kiểm, tự động tải lại số tồn của ngày đó từ Sheets
  dateInput?.addEventListener("change", () => {
    state.stockCheck.counts = {};
    state.stockCheck.deletedProductIds = [];
    loadStockCheckFromSheets();
  });

  // Tìm kiếm sản phẩm
  const searchInput = $("stock-check-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderStockCheck();
    });
  }

  // Sự kiện nhập, tăng giảm và xóa số tồn trên Desktop Table
  const tableBody = $("stock-check-body");
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const masp = btn.dataset.masp;
      const action = btn.dataset.action;
      if (action === "inc") changeStockCountStep(masp, 1);
      if (action === "dec") changeStockCountStep(masp, -1);
      if (action === "clear") clearStockCount(masp);
    });

    tableBody.addEventListener("input", (e) => {
      const input = e.target;
      const masp = input.dataset.masp;
      if (!masp) return;
      if (input.dataset.field === "actual-stock") {
        handleStockCountInput(masp, input.value);
      }
    });
  }

  // Sự kiện trên Mobile Cards
  const cardsContainer = $("stock-check-cards");
  if (cardsContainer) {
    cardsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const masp = btn.dataset.masp;
      const action = btn.dataset.action;
      if (action === "inc") changeStockCountStep(masp, 1);
      if (action === "dec") changeStockCountStep(masp, -1);
      if (action === "clear") clearStockCount(masp);
    });

    cardsContainer.addEventListener("input", (e) => {
      const input = e.target;
      const masp = input.dataset.masp;
      if (!masp) return;
      if (input.dataset.field === "actual-stock") {
        handleStockCountInput(masp, input.value);
      }
    });
  }


  // Nút Lưu lên Google Sheets
  $("btn-stock-check-save-sheets")?.addEventListener("click", saveToGoogleSheets);

  // Nút Tải lại từ Google Sheets
  $("btn-stock-check-reload")?.addEventListener("click", () => {
    state.stockCheck.counts = {};
    state.stockCheck.deletedProductIds = [];
    loadStockCheckFromSheets();
  });

  // Tải dữ liệu tồn đã lưu từ Google Sheets khi mở trang lần đầu
  loadStockCheckFromSheets();
}
