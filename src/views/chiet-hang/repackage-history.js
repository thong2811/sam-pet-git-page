// ============================================================
// View Quản Lý Lịch Sử Chiết Hàng (Gom nhóm theo Phiếu/Session)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { escapeHtml, formatNgayXuat, formatLockDateVN, unixNow, toYMD } from "../../utils/formatters.js";
import { state, isDateLocked, getLockDate } from "../../state/app-state.js";
import { loadRepackageHistoryAPI, deleteRepackageRowsAPI, updateRepackageSessionAPI } from "../../services/api.js";
import { getMinAllowedDate, updateLockDateUI } from "../common/lock-date-modal.js";
import { setRepackageSuccessCallback } from "./repackage-modal.js";

export async function loadRepackageHistory() {
  if ($("repackage-history-summary")) $("repackage-history-summary").textContent = "Đang tải dữ liệu chiết hàng…";
  if ($("repackage-history-empty")) $("repackage-history-empty").classList.add("hidden");

  const btnReload = $("btn-repackage-reload-history");
  if (btnReload) {
    btnReload.disabled = true;
    const icon = btnReload.querySelector("svg");
    if (icon) icon.classList.add("animate-spin");
  }

  const loadingTableHtml = `
    <tr>
      <td colspan="7" class="py-12 text-center bg-white">
        <div class="inline-flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 border-4 border-pine-200 border-t-pine-600 rounded-full animate-spin"></div>
          <p class="text-sm font-medium text-pine-900">Đang tải lịch sử chiết hàng từ Google Sheets…</p>
          <p class="text-xs text-slate-400">Vui lòng đợi trong giây lát</p>
        </div>
      </td>
    </tr>`;

  const loadingCardsHtml = `
    <div class="py-12 px-4 text-center bg-white">
      <div class="inline-flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 border-4 border-pine-200 border-t-pine-600 rounded-full animate-spin"></div>
        <p class="text-sm font-medium text-pine-900">Đang tải lịch sử chiết hàng từ Google Sheets…</p>
        <p class="text-xs text-slate-400">Vui lòng đợi trong giây lát</p>
      </div>
    </div>`;

  if ($("repackage-history-body")) $("repackage-history-body").innerHTML = loadingTableHtml;
  if ($("repackage-history-cards")) $("repackage-history-cards").innerHTML = loadingCardsHtml;

  try {
    const rows = await loadRepackageHistoryAPI();
    state.repackageHistory = rows;
    updateLockDateUI();
    renderRepackageHistory();
  } catch (err) {
    console.warn("Lỗi khi tải lịch sử chiết:", err);
    if ($("repackage-history-summary")) $("repackage-history-summary").textContent = "Tải thất bại: " + err.message;
    if ($("repackage-history-body")) $("repackage-history-body").innerHTML = "";
    if ($("repackage-history-cards")) $("repackage-history-cards").innerHTML = "";
  } finally {
    if (btnReload) {
      btnReload.disabled = false;
      const icon = btnReload.querySelector("svg");
      if (icon) icon.classList.remove("animate-spin");
    }
  }
}

export function getRepackageSessions() {
  const map = new Map();
  state.repackageHistory.forEach((r) => {
    const key = r.sessionId || (r.createdAt ? `${r.date}_${r.fromProductId}_${r.createdAt}` : r.id);
    if (!map.has(key)) {
      map.set(key, {
        sessionId: key,
        date: r.date,
        fromProductId: r.fromProductId,
        fromProductName: r.fromProductName,
        fromQuantity: Number(r.sessionFromQty || r.fromQuantity || 0),
        sessionFromQty: Number(r.sessionFromQty || 0),
        createdAt: r.createdAt,
        items: []
      });
    }
    const session = map.get(key);
    const itemSessionQty = Number(r.sessionFromQty || 0);
    const itemFromQty = Number(r.fromQuantity || 0);
    if (itemSessionQty > 0) {
      session.fromQuantity = itemSessionQty;
      session.sessionFromQty = itemSessionQty;
    } else if (itemFromQty > 0 && session.fromQuantity === 0) {
      session.fromQuantity = itemFromQty;
    }
    session.items.push(r);
  });
  return [...map.values()];
}

export function getFilteredRepackageSessions() {
  const searchInput = $("repackage-history-search");
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const dateInput = $("repackage-history-filter-date");
  const dateFilter = dateInput ? dateInput.value.trim() : "";
  const dateStr = dateFilter ? formatNgayXuat(dateFilter) : "";

  const sessions = getRepackageSessions();

  return sessions.filter((s) => {
    const matchDate = !dateStr || (s.date || "") === dateStr;
    const matchKw = !keyword ||
      (s.fromProductId || "").toLowerCase().includes(keyword) ||
      (s.fromProductName || "").toLowerCase().includes(keyword) ||
      s.items.some((it) =>
        (it.toProductId || "").toLowerCase().includes(keyword) ||
        (it.toProductName || "").toLowerCase().includes(keyword) ||
        (it.note || "").toLowerCase().includes(keyword)
      );
    return matchDate && matchKw;
  });
}

export function renderRepackageHistory() {
  const filtered = getFilteredRepackageSessions();
  const allSessions = getRepackageSessions();
  const isEmpty = filtered.length === 0;

  if ($("repackage-history-empty")) $("repackage-history-empty").classList.toggle("hidden", !isEmpty);

  const dateFilter = $("repackage-history-filter-date") ? $("repackage-history-filter-date").value : "";
  const keyword = $("repackage-history-search") ? $("repackage-history-search").value.trim() : "";
  const isFiltered = dateFilter || keyword;

  if ($("repackage-history-summary")) {
    $("repackage-history-summary").textContent = isFiltered
      ? `Hiển thị ${filtered.length} / ${allSessions.length} phiếu chiết`
      : `${allSessions.length} phiếu chiết · cập nhật lúc ${new Date().toLocaleTimeString("vi-VN")}`;
  }

  const tbody = $("repackage-history-body");
  if (tbody) {
    tbody.innerHTML = filtered.map((session, idx) => {
      const checked = state.repackageSelected.has(session.sessionId) ? "checked" : "";
      const rowBg = state.repackageSelected.has(session.sessionId) ? "bg-pine-50" : (idx % 2 === 0 ? "bg-white" : "bg-slate-50/50");
      return `
      <tr data-sessionid="${escapeHtml(session.sessionId)}" class="hover:bg-pine-50/80 transition-colors ${rowBg}">
        <td class="px-3 py-3 align-top">
          <input type="checkbox" data-action="repackcheck" value="${escapeHtml(session.sessionId)}" ${checked} class="rounded text-pine-600 focus:ring-pine-500" />
        </td>
        <td class="px-3 py-3 align-top text-slate-400 text-xs font-mono">${idx + 1}</td>
        <td class="px-4 py-3 align-top whitespace-nowrap text-slate-700 font-medium text-xs">${escapeHtml(session.date || "")}</td>
        <td class="px-4 py-3 align-top">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="inline-flex items-center font-bold text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-md text-xs">-${session.fromQuantity}</span>
            <span class="font-semibold text-pine-900 text-xs">${escapeHtml(session.fromProductName || session.fromProductId)}</span>
          </div>
        </td>
        <td class="px-4 py-3 align-top">
          <div class="space-y-1.5">
            ${session.items.map((it) => `
              <div class="flex items-center gap-1.5 text-xs flex-wrap">
                <span class="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-xs shrink-0">+${it.toQuantity}</span>
                <span class="font-medium text-slate-800">${escapeHtml(it.toProductName || it.toProductId)}</span>
              </div>
            `).join("")}
          </div>
        </td>
        <td class="px-4 py-3 align-top text-xs text-slate-500">
          ${session.items.map((it) => it.note ? `<div class="truncate max-w-[14rem] py-0.5">📝 ${escapeHtml(it.note)}</div>` : "").filter(Boolean).join("") || "—"}
        </td>
        <td class="px-4 py-3 align-top text-right whitespace-nowrap">
          <button type="button" data-action="repack-edit" data-sessionid="${escapeHtml(session.sessionId)}"
            class="rounded-lg px-2.5 py-1 text-xs font-medium text-pine-700 hover:bg-pine-100/70 border border-pine-200 shadow-sm transition-colors">Sửa</button>
        </td>
      </tr>`;
    }).join("");
  }

  const cardsEl = $("repackage-history-cards");
  if (cardsEl) {
    cardsEl.innerHTML = filtered.map((session, idx) => {
      const checked = state.repackageSelected.has(session.sessionId) ? "checked" : "";
      const cardBg = state.repackageSelected.has(session.sessionId) ? "bg-pine-50" : (idx % 2 === 0 ? "bg-white" : "bg-slate-50/50");
      return `
      <div class="p-4 space-y-3 ${cardBg}">
        <div class="flex items-start justify-between gap-2">
          <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
            <input type="checkbox" data-action="repackcheck" value="${escapeHtml(session.sessionId)}" ${checked} class="rounded shrink-0 text-pine-600 focus:ring-pine-500" />
            <div class="min-w-0">
              <span class="text-xs text-slate-400 font-medium">${escapeHtml(session.date || "")}</span>
              <p class="font-semibold text-sm text-pine-900 truncate">
                ${escapeHtml(session.fromProductName || session.fromProductId)} &rarr; ${session.items.length} mặt hàng đích
              </p>
            </div>
          </label>
          <button type="button" data-action="repack-edit" data-sessionid="${escapeHtml(session.sessionId)}"
            class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-pine-700 border border-pine-200 hover:bg-pine-50">Sửa</button>
        </div>

        <div class="bg-white/90 rounded-xl p-3 text-xs space-y-2 border border-slate-100">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span class="text-slate-500 font-medium">Hàng nguồn (Giảm):</span>
            <span class="font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">-${session.fromQuantity} ${escapeHtml(session.fromProductName || session.fromProductId)}</span>
          </div>
          <div class="space-y-1.5 pt-0.5">
            <span class="text-slate-500 font-medium block">Hàng đích (Tăng):</span>
            <div class="space-y-1 pl-2">
              ${session.items.map((it) => `
                <div class="flex items-center justify-between gap-2">
                  <span class="text-slate-700 font-medium truncate">${escapeHtml(it.toProductName || it.toProductId)}</span>
                  <span class="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">+${it.toQuantity}</span>
                </div>
                ${it.note ? `<p class="text-[11px] text-slate-400 pl-1 italic truncate">📝 ${escapeHtml(it.note)}</p>` : ""}
              `).join("")}
            </div>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  updateRepackageSelectionUI();
}

export function updateRepackageSelectionUI() {
  const count = state.repackageSelected.size;
  const countEl = $("repackage-selected-count");
  if (countEl) countEl.textContent = count;
  if ($("btn-repackage-delete-selected")) $("btn-repackage-delete-selected").disabled = count === 0;

  const filtered = getFilteredRepackageSessions();
  const allChecked = filtered.length > 0 && filtered.every((s) => state.repackageSelected.has(s.sessionId));
  const checkAll = $("repackage-history-check-all");
  if (checkAll) {
    checkAll.checked = allChecked;
    checkAll.indeterminate = !allChecked && filtered.some((s) => state.repackageSelected.has(s.sessionId));
  }
}

export async function deleteSelectedRepackageRows() {
  const selectedSessionIds = [...state.repackageSelected];
  if (!selectedSessionIds.length) return;

  const sessions = getRepackageSessions();
  const lockedSessions = sessions.filter((s) => selectedSessionIds.includes(s.sessionId) && isDateLocked(s.date));
  if (lockedSessions.length > 0) {
    toast(`Không thể xóa: Có ${lockedSessions.length} phiếu chiết thuộc ngày đã khóa sổ (≤ ${formatLockDateVN(getLockDate())}).`, "error");
    return;
  }

  if (!confirm(`Xóa ${selectedSessionIds.length} phiếu chiết hàng đã chọn?`)) return;

  const btnDelete = $("btn-repackage-delete-selected");
  if (btnDelete) {
    btnDelete.disabled = true;
    btnDelete.textContent = "Đang xóa…";
  }

  try {
    const rowsToDelete = state.repackageHistory.filter((r) => {
      const key = r.sessionId || (r.createdAt ? `${r.date}_${r.fromProductId}_${r.createdAt}` : r.id);
      return selectedSessionIds.includes(key) || selectedSessionIds.includes(r.id);
    });
    const idsToDelete = rowsToDelete.map((r) => r.id);

    if (idsToDelete.length > 0) {
      const data = await deleteRepackageRowsAPI(idsToDelete);
      if (data && data.status === "error") {
        toast(data.message || "Lỗi khi xóa chiết hàng.", "error");
        return;
      }
    }

    state.repackageHistory = state.repackageHistory.filter((r) => !idsToDelete.includes(r.id));
    toast(`Đã xóa ${selectedSessionIds.length} phiếu chiết hàng (${idsToDelete.length} dòng quy cách).`, "success");
    state.repackageSelected.clear();
    renderRepackageHistory();
  } catch (err) {
    toast("Lỗi khi xóa: " + err.message, "error");
  } finally {
    updateRepackageSelectionUI();
  }
}

export function openRepackageEditModal(sessionId) {
  const sessions = getRepackageSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);
  if (!session) return;

  $("repackage-edit-sessionid").value = session.sessionId;
  $("repackage-edit-fromname").value = session.fromProductName || session.fromProductId;
  $("repackage-edit-fromqty").value = session.fromQuantity;

  if (session.date) {
    const parts = session.date.split("-");
    if (parts.length === 3) {
      $("repackage-edit-date").value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const isLocked = isDateLocked(session.date);
  const warnEl = $("repackage-edit-modal-locked-warning");
  const btnSave = $("btn-repackage-edit-save");

  if (warnEl) {
    if (isLocked) {
      warnEl.innerHTML = `🔒 <strong>Đã khóa sổ:</strong> Phiếu chiết ngày <strong>${session.date}</strong> thuộc khoảng ngày đã khóa (≤ ${formatLockDateVN(getLockDate())}), không thể chỉnh sửa.`;
      warnEl.classList.remove("hidden");
    } else {
      warnEl.classList.add("hidden");
    }
  }

  $("repackage-edit-date").disabled = isLocked;
  $("repackage-edit-fromqty").disabled = isLocked;
  if ($("btn-repackage-edit-fromqty-inc")) $("btn-repackage-edit-fromqty-inc").disabled = isLocked;
  if ($("btn-repackage-edit-fromqty-dec")) $("btn-repackage-edit-fromqty-dec").disabled = isLocked;
  if (btnSave) btnSave.disabled = isLocked;

  const minDate = getMinAllowedDate();
  if (!isLocked && minDate) {
    $("repackage-edit-date").min = minDate;
  } else {
    $("repackage-edit-date").removeAttribute("min");
  }

  const container = $("repackage-edit-targets-container");
  if (container) {
    container.innerHTML = session.items.map((it, idx) => `
      <div class="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2.5" data-target-row-id="${escapeHtml(it.id)}">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">${idx + 1}</span>
            <span class="font-semibold text-pine-900 text-sm">${escapeHtml(it.toProductName || it.toProductId)}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div class="sm:col-span-6 flex items-center justify-between sm:justify-start gap-2 bg-white/80 p-1.5 rounded-lg border border-emerald-200/60">
            <span class="text-xs font-semibold text-emerald-800 shrink-0">SL nhận:</span>
            <div class="flex items-center gap-1">
              <button type="button" data-action="repack-edit-qty-dec" ${isLocked ? "disabled" : ""}
                class="w-8 h-8 shrink-0 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center select-none shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed">−</button>
              <input type="number" min="0.01" step="any" value="${it.toQuantity}" ${isLocked ? "disabled" : ""}
                class="repack-edit-item-qty w-20 rounded-lg bg-white border border-slate-300 px-1.5 py-1 text-sm font-bold text-emerald-700 text-center focus:outline-none focus:ring-2 focus:ring-pine-500 shadow-inner disabled:bg-slate-100 disabled:text-slate-500" />
              <button type="button" data-action="repack-edit-qty-inc" ${isLocked ? "disabled" : ""}
                class="w-8 h-8 shrink-0 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center select-none shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed">+</button>
            </div>
          </div>
          <div class="sm:col-span-6 flex items-center">
            <input type="text" maxlength="200" value="${escapeHtml(it.note || "")}" ${isLocked ? "disabled" : ""} placeholder="Ghi chú quy cách…"
              class="repack-edit-item-note w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-pine-500 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500" />
          </div>
        </div>
      </div>`).join("");
  }

  $("repackage-edit-modal").classList.remove("hidden");
}

export function closeRepackageEditModal() {
  $("repackage-edit-modal").classList.add("hidden");
}

export async function saveRepackageEditModal() {
  const sessionId = $("repackage-edit-sessionid").value;
  const fromQty = Number($("repackage-edit-fromqty").value);
  const dateIso = $("repackage-edit-date").value;

  const sessions = getRepackageSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);
  if (session && isDateLocked(session.date)) {
    toast(`Phiếu chiết này thuộc ngày ${session.date} đã bị khóa sổ, không thể chỉnh sửa.`, "error");
    return;
  }
  if (dateIso && isDateLocked(dateIso)) {
    toast(`Ngày chiết mới (${formatNgayXuat(dateIso)}) thuộc khoảng ngày đã khóa sổ (≤ ${formatLockDateVN(getLockDate())}).`, "error");
    return;
  }

  if (!Number.isFinite(fromQty) || fromQty <= 0) {
    toast("Số lượng nguồn phải lớn hơn 0.", "error");
    return;
  }

  const container = $("repackage-edit-targets-container");
  const targetDivs = container.querySelectorAll("[data-target-row-id]");
  const targetUpdates = [];

  for (const div of targetDivs) {
    const rowId = div.getAttribute("data-target-row-id");
    const qtyInput = div.querySelector(".repack-edit-item-qty");
    const noteInput = div.querySelector(".repack-edit-item-note");
    const toQty = Number(qtyInput ? qtyInput.value : 0);
    const note = (noteInput ? noteInput.value : "").trim();

    if (!Number.isFinite(toQty) || toQty <= 0) {
      toast("Số lượng đích phải lớn hơn 0.", "error");
      return;
    }

    targetUpdates.push({ id: rowId, toQuantity: toQty, note: note });
  }

  const btnSave = $("btn-repackage-edit-save");
  btnSave.disabled = true;
  btnSave.textContent = "Đang lưu…";

  try {
    const now = unixNow();
    const dateFormatted = dateIso ? formatNgayXuat(dateIso) : undefined;

    const rowsPayload = targetUpdates.map((tu, idx) => ({
      id: tu.id,
      sessionId: sessionId,
      date: dateFormatted,
      fromQuantity: idx === 0 ? fromQty : 0,
      sessionFromQty: fromQty,
      toQuantity: tu.toQuantity,
      note: tu.note,
      updatedAt: now
    }));

    const data = await updateRepackageSessionAPI(rowsPayload);
    if (data && data.status === "error") {
      toast(data.message || "Lỗi khi cập nhật chiết hàng.", "error");
      return;
    }

    targetUpdates.forEach((tu, idx) => {
      const cleanTuId = String(tu.id).replace(/^'+/, "").trim();
      const row = state.repackageHistory.find((r) => String(r.id).replace(/^'+/, "").trim() === cleanTuId);
      if (row) {
        if (dateFormatted) row.date = dateFormatted;
        row.fromQuantity = idx === 0 ? fromQty : 0;
        row.sessionFromQty = fromQty;
        row.toQuantity = tu.toQuantity;
        row.note = tu.note;
        row.updatedAt = now;
      }
    });

    toast(data.message || "Đã cập nhật phiếu chiết hàng.", "success");
    closeRepackageEditModal();
    renderRepackageHistory();
  } catch (err) {
    toast("Lỗi khi cập nhật: " + err.message, "error");
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "Lưu thay đổi";
  }
}

export function initRepackageHistory() {
  setRepackageSuccessCallback(loadRepackageHistory);

  const btnReload = $("btn-repackage-reload-history");
  if (btnReload) btnReload.addEventListener("click", loadRepackageHistory);

  const searchInput = $("repackage-history-search");
  if (searchInput) searchInput.addEventListener("input", renderRepackageHistory);

  const dateFilterInput = $("repackage-history-filter-date");
  if (dateFilterInput) dateFilterInput.addEventListener("change", renderRepackageHistory);

  const btnClearDate = $("btn-repackage-clear-date");
  if (btnClearDate) {
    btnClearDate.addEventListener("click", () => {
      if ($("repackage-history-filter-date")) $("repackage-history-filter-date").value = "";
      renderRepackageHistory();
    });
  }

  const btnDelete = $("btn-repackage-delete-selected");
  if (btnDelete) btnDelete.addEventListener("click", deleteSelectedRepackageRows);

  const checkAllBox = $("repackage-history-check-all");
  if (checkAllBox) {
    checkAllBox.addEventListener("change", (e) => {
      const checked = e.target.checked;
      const filtered = getFilteredRepackageSessions();
      filtered.forEach((s) => {
        if (checked) state.repackageSelected.add(s.sessionId);
        else state.repackageSelected.delete(s.sessionId);
      });
      renderRepackageHistory();
    });
  }

  const handleRowClick = (e) => {
    const target = e.target;
    if (target.dataset.action === "repack-edit") {
      openRepackageEditModal(target.dataset.sessionid);
      return;
    }
    if (target.dataset.action === "repackcheck") {
      const id = target.value;
      if (target.checked) state.repackageSelected.add(id);
      else state.repackageSelected.delete(id);
      renderRepackageHistory();
    }
  };

  const tbody = $("repackage-history-body");
  if (tbody) tbody.addEventListener("click", handleRowClick);

  const cardsEl = $("repackage-history-cards");
  if (cardsEl) cardsEl.addEventListener("click", handleRowClick);

  const btnEditClose = $("btn-repackage-edit-close");
  if (btnEditClose) btnEditClose.addEventListener("click", closeRepackageEditModal);

  const btnEditCancel = $("btn-repackage-edit-cancel");
  if (btnEditCancel) btnEditCancel.addEventListener("click", closeRepackageEditModal);

  const editModalEl = $("repackage-edit-modal");
  if (editModalEl) {
    editModalEl.addEventListener("click", (e) => {
      if (e.target === editModalEl) closeRepackageEditModal();
    });
  }

  const btnEditSave = $("btn-repackage-edit-save");
  if (btnEditSave) btnEditSave.addEventListener("click", saveRepackageEditModal);

  const btnEditFromDec = $("btn-repackage-edit-fromqty-dec");
  if (btnEditFromDec) {
    btnEditFromDec.addEventListener("click", () => {
      const input = $("repackage-edit-fromqty");
      if (!input) return;
      const cur = Number(input.value) || 1;
      if (cur > 0.01) input.value = Math.max(0.01, cur - 1);
    });
  }

  const btnEditFromInc = $("btn-repackage-edit-fromqty-inc");
  if (btnEditFromInc) {
    btnEditFromInc.addEventListener("click", () => {
      const input = $("repackage-edit-fromqty");
      if (!input) return;
      input.value = (Number(input.value) || 0) + 1;
    });
  }

  const editTargetsContainer = $("repackage-edit-targets-container");
  if (editTargetsContainer) {
    editTargetsContainer.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      const rowDiv = e.target.closest("[data-target-row-id]");
      if (!rowDiv) return;
      const qtyInput = rowDiv.querySelector(".repack-edit-item-qty");
      if (!qtyInput) return;

      if (action === "repack-edit-qty-dec") {
        const cur = Number(qtyInput.value) || 1;
        qtyInput.value = Math.max(0.01, cur - 1);
      } else if (action === "repack-edit-qty-inc") {
        const cur = Number(qtyInput.value) || 0;
        qtyInput.value = cur + 1;
      }
    });
  }
}
