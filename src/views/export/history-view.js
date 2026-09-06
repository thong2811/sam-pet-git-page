// ============================================================
// View Quản Lý Xuất Hàng (Google Sheets) & Thống Kê Theo Ngày
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { escapeHtml, formatNgayXuat, formatLockDateVN, csvEscape, toYMD } from "../../utils/formatters.js";
import { state, isDateLocked, getLockDate } from "../../state/app-state.js";
import { loadSheetHistoryAPI, deleteSheetHistoryRowsAPI } from "../../services/api.js";
import { openEditModal, setEditRowCallback } from "../common/edit-row-modal.js";
import { setExportSuccessCallback } from "./export-modal.js";
import { updateLockDateUI } from "../common/lock-date-modal.js";

const EXPORT_HEADER = [
  "id", "date", "productId", "productName",
  "quantity", "sellingPrice", "purchasePrice",
  "note", "staff", "createdAt", "updatedAt"
];

export async function loadSheetHistory() {
  if ($("history-summary")) $("history-summary").textContent = "Đang tải dữ liệu…";
  if ($("history-error")) $("history-error").classList.add("hidden");
  if ($("history-empty")) $("history-empty").classList.add("hidden");

  const btnReload = $("btn-reload-history");
  if (btnReload) {
    btnReload.disabled = true;
    const icon = btnReload.querySelector("svg");
    if (icon) icon.classList.add("animate-spin");
  }

  const loadingTableHtml = `
    <tr>
      <td colspan="10" class="py-12 text-center bg-white">
        <div class="inline-flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 border-4 border-pine-200 border-t-pine-600 rounded-full animate-spin"></div>
          <p class="text-sm font-medium text-pine-900">Đang tải lịch sử xuất hàng từ Google Sheets…</p>
          <p class="text-xs text-slate-400">Vui lòng đợi trong giây lát</p>
        </div>
      </td>
    </tr>`;

  const loadingCardsHtml = `
    <div class="py-12 px-4 text-center bg-white">
      <div class="inline-flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 border-4 border-pine-200 border-t-pine-600 rounded-full animate-spin"></div>
        <p class="text-sm font-medium text-pine-900">Đang tải lịch sử xuất hàng từ Google Sheets…</p>
        <p class="text-xs text-slate-400">Vui lòng đợi trong giây lát</p>
      </div>
    </div>`;

  if ($("history-body")) $("history-body").innerHTML = loadingTableHtml;
  if ($("history-cards")) $("history-cards").innerHTML = loadingCardsHtml;

  try {
    const rows = await loadSheetHistoryAPI();
    state.sheetHistory = rows;
    state.historySelected.clear();
    updateLockDateUI();
    renderHistory();
    renderStats();
  } catch (err) {
    if ($("history-error")) {
      $("history-error").textContent = "Không tải được dữ liệu: " + err.message;
      $("history-error").classList.remove("hidden");
    }
    if ($("history-summary")) $("history-summary").textContent = "Tải thất bại.";
    if ($("history-body")) $("history-body").innerHTML = "";
    if ($("history-cards")) $("history-cards").innerHTML = "";
  } finally {
    if (btnReload) {
      btnReload.disabled = false;
      const icon = btnReload.querySelector("svg");
      if (icon) icon.classList.remove("animate-spin");
    }
  }
}

export function getFilteredHistory() {
  const searchInput = $("history-search");
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const dateFilterInput = $("history-filter-date");
  const dateFilter = dateFilterInput ? dateFilterInput.value.trim() : "";
  const dateStr = dateFilter ? formatNgayXuat(dateFilter) : "";

  return state.sheetHistory.filter((r) => {
    const matchDate = !dateStr || (r.date || "") === dateStr;
    const matchKw = !keyword ||
      (r.productId || "").toLowerCase().includes(keyword) ||
      (r.productName || "").toLowerCase().includes(keyword) ||
      (r.note || "").toLowerCase().includes(keyword);
    return matchDate && matchKw;
  });
}

export function renderHistory() {
  const filtered = getFilteredHistory();
  const total = state.sheetHistory.length;
  const isEmpty = filtered.length === 0;

  if ($("history-empty")) $("history-empty").classList.toggle("hidden", !isEmpty);
  if ($("btn-export-sheets-csv")) $("btn-export-sheets-csv").disabled = filtered.length === 0;

  const dateFilter = $("history-filter-date") ? $("history-filter-date").value : "";
  const keyword = $("history-search") ? $("history-search").value.trim() : "";
  const isFiltered = dateFilter || keyword;

  if ($("history-summary")) {
    $("history-summary").textContent = isFiltered
      ? `Hiển thị ${filtered.length} / ${total} dòng`
      : `${total} dòng · cập nhật lúc ${new Date().toLocaleTimeString("vi-VN")}`;
  }

  const tbody = $("history-body");
  if (tbody) {
    tbody.innerHTML = filtered.map((row, idx) => {
      const checked = state.historySelected.has(row.id) ? "checked" : "";
      const rowBg = state.historySelected.has(row.id) ? "bg-pine-50" : (idx % 2 === 0 ? "bg-white" : "bg-slate-100/60");
      const qty = Number(row.quantity || 0);
      const price = Number(row.sellingPrice || 0);
      const rowTotal = qty * price;
      return `
        <tr data-rowid="${escapeHtml(row.id)}" class="hover:bg-pine-50 ${rowBg}">
          <td class="px-3 py-2.5">
            <input type="checkbox" data-action="rowcheck" value="${escapeHtml(row.id)}" ${checked} class="rounded" />
          </td>
          <td class="px-4 py-2.5 text-slate-400 text-xs">${idx + 1}</td>
          <td class="px-4 py-2.5 whitespace-nowrap text-slate-600">${escapeHtml(row.date || "")}</td>
          <td class="px-4 py-2.5 whitespace-nowrap font-mono text-xs">${escapeHtml(row.productId || "")}</td>
          <td class="px-4 py-2.5 font-medium">
            <div>${escapeHtml(row.productName || "")}</div>
            ${row.staff ? `<span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 mt-0.5">👤 ${escapeHtml(row.staff)}</span>` : ""}
          </td>
          <td class="px-4 py-2.5 text-right font-medium">${escapeHtml(String(row.quantity || ""))}</td>
          <td class="px-4 py-2.5 text-right whitespace-nowrap">${row.sellingPrice ? Number(row.sellingPrice).toLocaleString("vi-VN") : "—"}</td>
          <td class="px-4 py-2.5 text-right font-semibold text-pine-700 whitespace-nowrap">${rowTotal ? rowTotal.toLocaleString("vi-VN") + " đ" : "—"}</td>
          <td class="px-4 py-2.5 text-slate-500 max-w-[12rem] truncate">${escapeHtml(row.note || "—")}</td>
          <td class="px-4 py-2.5 text-right">
            <button type="button" data-action="edit" data-id="${escapeHtml(row.id)}"
              class="rounded-lg px-2.5 py-1 text-xs text-pine-700 hover:bg-pine-100 font-medium">Sửa</button>
          </td>
        </tr>`;
    }).join("");
  }

  const cardsEl = $("history-cards");
  if (cardsEl) {
    cardsEl.innerHTML = filtered.map((row, idx) => {
      const checked = state.historySelected.has(row.id) ? "checked" : "";
      const cardBg = state.historySelected.has(row.id) ? "bg-pine-50" : (idx % 2 === 0 ? "bg-white" : "bg-slate-100/60");
      const qty = Number(row.quantity || 0);
      const price = Number(row.sellingPrice || 0);
      const rowTotal = qty * price;
      return `
        <div data-rowid="${escapeHtml(row.id)}" class="px-4 py-3 space-y-1.5 border-b border-slate-100 ${cardBg}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <input type="checkbox" data-action="rowcheck" value="${escapeHtml(row.id)}" ${checked} class="rounded mt-0.5" />
              <div>
                <p class="font-medium text-sm">${escapeHtml(row.productName || "")}</p>
                <p class="text-xs text-slate-500">${escapeHtml(row.productId || "")} · ${escapeHtml(row.date || "")} ${row.staff ? `· <span class="font-medium text-slate-700">👤 ${escapeHtml(row.staff)}</span>` : ""}</p>
              </div>
            </div>
            <button type="button" data-action="edit" data-id="${escapeHtml(row.id)}"
              class="shrink-0 rounded-lg px-2.5 py-1 text-xs text-pine-700 hover:bg-pine-100 font-medium border border-pine-200">Sửa</button>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-600 pl-6">
            <span>SL: <strong class="text-ink">${escapeHtml(String(row.quantity || ""))}</strong> · Đơn giá: ${row.sellingPrice ? Number(row.sellingPrice).toLocaleString("vi-VN") : "—"}</span>
            <span class="font-semibold text-pine-700 text-sm">${rowTotal ? rowTotal.toLocaleString("vi-VN") + " đ" : "—"}</span>
          </div>
          ${row.note ? `<p class="text-xs text-slate-500 italic pl-6">${escapeHtml(row.note)}</p>` : ""}
        </div>`;
    }).join("");
  }

  updateHistorySelectionUI();
}

function updateHistorySelectionUI() {
  const filtered = getFilteredHistory();
  const allChecked = filtered.length > 0 && filtered.every((r) => state.historySelected.has(r.id));
  const checkAllBox = $("history-check-all");
  if (checkAllBox) checkAllBox.checked = allChecked;

  const btnDelete = $("btn-history-delete");
  if (btnDelete) {
    btnDelete.disabled = state.historySelected.size === 0;
    btnDelete.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Xóa đã chọn (<span id="history-selected-count">${state.historySelected.size}</span>)`;
  }
}

export async function deleteSelectedRows() {
  const ids = [...state.historySelected];
  if (!ids.length) return;

  const lockedRows = state.sheetHistory.filter((r) => state.historySelected.has(r.id) && isDateLocked(r.date));
  if (lockedRows.length > 0) {
    toast(`Không thể xóa: Có ${lockedRows.length} dòng thuộc ngày đã khóa sổ (≤ ${formatLockDateVN(getLockDate())}).`, "error");
    return;
  }

  if (!confirm(`Xóa ${ids.length} dòng đã chọn khỏi Google Sheets?`)) return;

  const btnDelete = $("btn-history-delete");
  if (btnDelete) {
    btnDelete.disabled = true;
    btnDelete.textContent = "Đang xóa…";
  }

  try {
    const data = await deleteSheetHistoryRowsAPI(ids);
    if (data && data.status === "error") {
      toast(data.message || "Lỗi khi xóa dòng đã chọn.", "error");
      return;
    }
    toast(data.message || `Đã xóa ${ids.length} dòng.`, "success");
    state.historySelected.clear();
    await loadSheetHistory();
  } catch (err) {
    toast("Lỗi khi xóa: " + err.message, "error");
  } finally {
    updateHistorySelectionUI();
  }
}

export function exportSheetsCSV() {
  const filtered = getFilteredHistory();
  if (!filtered.length) {
    toast("Không có dữ liệu để xuất.", "error");
    return;
  }

  const lines = [EXPORT_HEADER.map(csvEscape).join(",")];
  filtered.forEach((row) => {
    lines.push([
      row.id, row.date, row.productId, row.productName,
      row.quantity, row.sellingPrice, row.purchasePrice,
      row.note, row.createdAt, row.updatedAt
    ].map(csvEscape).join(","));
  });

  const dateFilter = $("history-filter-date") ? $("history-filter-date").value : "";
  const datePart = dateFilter ? formatNgayXuat(dateFilter).replace(/-/g, "") : "TatCa";
  const filename = `PhieuXuat_${datePart}.csv`;

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Đã xuất ${filtered.length} dòng → ${filename}`, "success");
}

export function renderStats() {
  if (!state.sheetHistory.length) {
    if ($("stats-empty")) $("stats-empty").classList.remove("hidden");
    if ($("stats-body")) $("stats-body").innerHTML = "";
    if ($("stats-cards")) $("stats-cards").innerHTML = "";
    if ($("stats-summary")) $("stats-summary").textContent = "Chưa có dữ liệu.";
    return;
  }
  if ($("stats-empty")) $("stats-empty").classList.add("hidden");

  const byDate = {};
  state.sheetHistory.forEach((row) => {
    const d = row.date || "—";
    if (!byDate[d]) byDate[d] = { rows: 0, qty: 0, selling: 0, purchase: 0 };
    byDate[d].rows += 1;
    byDate[d].qty += Number(row.quantity || 0);
    byDate[d].selling += Number(row.sellingPrice || 0) * Number(row.quantity || 0);
    byDate[d].purchase += Number(row.purchasePrice || 0) * Number(row.quantity || 0);
  });

  const dates = Object.keys(byDate).sort((a, b) => {
    return toYMD(b).localeCompare(toYMD(a));
  });

  const totalSelling = dates.reduce((s, d) => s + byDate[d].selling, 0);
  if ($("stats-summary")) {
    $("stats-summary").textContent = `${dates.length} ngày · Tổng doanh thu: ${totalSelling.toLocaleString("vi-VN")} đ`;
  }

  const tbody = $("stats-body");
  if (tbody) {
    tbody.innerHTML = dates.map((date) => {
      const g = byDate[date];
      return `<tr class="hover:bg-pine-50">
        <td class="px-4 py-2.5 font-medium whitespace-nowrap">${escapeHtml(date)}</td>
        <td class="px-4 py-2.5 text-right text-slate-600">${g.rows}</td>
        <td class="px-4 py-2.5 text-right text-slate-600">${g.qty.toLocaleString("vi-VN")}</td>
        <td class="px-4 py-2.5 text-right font-semibold text-pine-700">${g.selling.toLocaleString("vi-VN")}</td>
        <td class="px-4 py-2.5 text-right">
          <button type="button" data-action="filter-date" data-date="${escapeHtml(date)}"
            class="rounded-lg px-3 py-1 text-xs text-pine-700 border border-pine-200 hover:bg-pine-50">
            Xem
          </button>
        </td>
      </tr>`;
    }).join("");
  }

  const cardsEl = $("stats-cards");
  if (cardsEl) {
    cardsEl.innerHTML = dates.map((date) => {
      const g = byDate[date];
      return `<div class="px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p class="font-medium text-sm">${escapeHtml(date)}</p>
          <p class="text-xs text-slate-500 mt-0.5">${g.rows} dòng · SL ${g.qty.toLocaleString("vi-VN")}</p>
          <p class="text-xs mt-0.5">
            <span class="font-semibold text-pine-700">${g.selling.toLocaleString("vi-VN")} đ</span>
          </p>
        </div>
        <button type="button" data-action="filter-date" data-date="${escapeHtml(date)}"
          class="shrink-0 rounded-lg px-3 py-1.5 text-xs text-pine-700 border border-pine-200 hover:bg-pine-50">
          Xem
        </button>
      </div>`;
    }).join("");
  }
}

export function initHistoryView() {
  setEditRowCallback(loadSheetHistory);
  setExportSuccessCallback(loadSheetHistory);

  const btnReload = $("btn-reload-history");
  if (btnReload) btnReload.addEventListener("click", loadSheetHistory);

  const searchInput = $("history-search");
  if (searchInput) searchInput.addEventListener("input", renderHistory);

  const dateFilterInput = $("history-filter-date");
  if (dateFilterInput) dateFilterInput.addEventListener("change", renderHistory);

  const btnClearDate = $("btn-history-clear-date");
  if (btnClearDate) {
    btnClearDate.addEventListener("click", () => {
      if ($("history-filter-date")) $("history-filter-date").value = "";
      renderHistory();
    });
  }

  const btnExportCsv = $("btn-export-sheets-csv");
  if (btnExportCsv) btnExportCsv.addEventListener("click", exportSheetsCSV);

  const btnDelete = $("btn-history-delete");
  if (btnDelete) btnDelete.addEventListener("click", deleteSelectedRows);

  const checkAllBox = $("history-check-all");
  if (checkAllBox) {
    checkAllBox.addEventListener("change", (e) => {
      const checked = e.target.checked;
      const filtered = getFilteredHistory();
      filtered.forEach((r) => {
        if (checked) state.historySelected.add(r.id);
        else state.historySelected.delete(r.id);
      });
      renderHistory();
    });
  }

  const handleRowClick = (e) => {
    const target = e.target;
    if (target.dataset.action === "edit") {
      openEditModal(target.dataset.id);
      return;
    }
    if (target.dataset.action === "rowcheck") {
      const id = target.value;
      if (target.checked) state.historySelected.add(id);
      else state.historySelected.delete(id);
      renderHistory();
    }
  };

  const tbody = $("history-body");
  if (tbody) tbody.addEventListener("click", handleRowClick);

  const cardsEl = $("history-cards");
  if (cardsEl) cardsEl.addEventListener("click", handleRowClick);

  const handleFilterDateClick = (e) => {
    const btn = e.target.closest('[data-action="filter-date"]');
    if (!btn) return;
    const dateStr = btn.dataset.date;
    const parts = (dateStr || "").split("-");
    if (parts.length === 3 && $("history-filter-date")) {
      $("history-filter-date").value = `${parts[2]}-${parts[1]}-${parts[0]}`;
      renderHistory();
      $("history-filter-date").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const statsBody = $("stats-body");
  if (statsBody) statsBody.addEventListener("click", handleFilterDateClick);

  const statsCards = $("stats-cards");
  if (statsCards) statsCards.addEventListener("click", handleFilterDateClick);
}
