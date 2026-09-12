// ============================================================
// Modal Cập nhật dòng xuất hàng đã có trên Sheets
// ============================================================
import { $, setButtonLoading, showLoadingOverlay, hideLoadingOverlay } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { formatNgayXuat, formatLockDateVN, toYMD, unixNow } from "../../utils/formatters.js";
import { state, isDateLocked, getLockDate } from "../../state/app-state.js";
import { updateSheetHistoryRowAPI } from "../../services/api.js";
import { updateGlobalHeaderSync } from "../../utils/sync-indicator.js";
import { getMinAllowedDate } from "./lock-date-modal.js";

let onSaveCallback = null;

export function setEditRowCallback(cb) {
  onSaveCallback = cb;
}

export function openEditModal(rowId) {
  const row = state.sheetHistory.find((r) => r.id === rowId);
  if (!row) return;

  $("edit-id").value = row.id;
  $("edit-productid").value = row.productId || "";
  $("edit-productname").value = row.productName || "";
  $("edit-quantity").value = row.quantity || "";
  $("edit-sellingprice").value = row.sellingPrice || "";
  $("edit-purchaseprice").value = row.purchasePrice || "";
  $("edit-note").value = row.note || "";

  if (row.date) {
    const parts = row.date.split("-");
    if (parts.length === 3) {
      $("edit-date").value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const isLocked = isDateLocked(row.date);
  const warnEl = $("edit-modal-locked-warning");
  const btnSave = $("btn-edit-save");

  if (warnEl) {
    if (isLocked) {
      warnEl.innerHTML = `🔒 <strong>Đã khóa sổ:</strong> Dòng xuất hàng ngày <strong>${row.date}</strong> thuộc khoảng ngày đã khóa (≤ ${formatLockDateVN(getLockDate())}), không thể chỉnh sửa.`;
      warnEl.classList.remove("hidden");
    } else {
      warnEl.classList.add("hidden");
    }
  }

  $("edit-date").disabled = isLocked;
  $("edit-quantity").disabled = isLocked;
  $("edit-sellingprice").disabled = isLocked;
  $("edit-note").disabled = isLocked;
  $("btn-edit-qty-dec").disabled = isLocked;
  $("btn-edit-qty-inc").disabled = isLocked;
  btnSave.disabled = isLocked;

  const minDate = getMinAllowedDate();
  if (!isLocked && minDate) {
    $("edit-date").min = minDate;
  } else {
    $("edit-date").removeAttribute("min");
  }

  $("edit-modal").classList.remove("hidden");
  if (!isLocked) $("edit-quantity").focus();
}

export function closeEditModal() {
  $("edit-modal").classList.add("hidden");
}

export async function saveEditModal() {
  const id = $("edit-id").value;
  const quantityRaw = Number($("edit-quantity").value);
  const sellingPrice = Number($("edit-sellingprice").value);
  const purchasePrice = Number($("edit-purchaseprice").value);
  const note = $("edit-note").value.trim();
  const dateIso = $("edit-date").value;

  const originalRow = state.sheetHistory.find((r) => r.id === id);
  if (originalRow && isDateLocked(originalRow.date)) {
    toast(`Dòng này thuộc ngày ${originalRow.date} đã bị khóa sổ, không thể chỉnh sửa.`, "error");
    return;
  }
  if (dateIso && isDateLocked(dateIso)) {
    toast(`Ngày xuất mới (${formatNgayXuat(dateIso)}) thuộc khoảng ngày đã khóa sổ (≤ ${formatLockDateVN(getLockDate())}).`, "error");
    return;
  }

  if (!Number.isFinite(quantityRaw) || quantityRaw <= 0) {
    toast("Số lượng phải lớn hơn 0.", "error");
    return;
  }
  if (sellingPrice < 0 || purchasePrice < 0) {
    toast("Giá không được âm.", "error");
    return;
  }

  const btnSave = $("btn-edit-save");
  const btnClose = $("btn-edit-close");
  const btnCancel = $("btn-edit-cancel");
  if (btnClose) btnClose.disabled = true;
  if (btnCancel) btnCancel.disabled = true;
  setButtonLoading(btnSave, true, "Đang lưu thay đổi…");
  showLoadingOverlay("Đang cập nhật dòng xuất hàng…", "Đang đồng bộ dữ liệu sửa đổi lên Google Sheets");
  updateGlobalHeaderSync("syncing", "Đang sửa dòng…");

  try {
    const data = await updateSheetHistoryRowAPI({
      id,
      date: dateIso ? formatNgayXuat(dateIso) : undefined,
      quantity: quantityRaw,
      sellingPrice,
      purchasePrice,
      note,
      updatedAt: unixNow()
    });

    if (data && data.status === "error") {
      toast(data.message || "Lỗi khi cập nhật.", "error");
      return;
    }

    const local = state.sheetHistory.find((r) => r.id === id);
    if (local) {
      if (dateIso) local.date = formatNgayXuat(dateIso);
      local.quantity = String(quantityRaw);
      local.sellingPrice = String(sellingPrice);
      local.purchasePrice = String(purchasePrice);
      local.note = note;
    }

    toast(data.message || "Đã cập nhật thành công.", "success");
    closeEditModal();
    if (onSaveCallback) onSaveCallback();
  } catch (err) {
    toast("Lỗi khi lưu: " + err.message, "error");
  } finally {
    hideLoadingOverlay();
    if (btnClose) btnClose.disabled = false;
    if (btnCancel) btnCancel.disabled = false;
    setButtonLoading(btnSave, false);
  }
}

export function initEditRowModal() {
  const btnClose = $("btn-edit-close");
  if (btnClose) btnClose.addEventListener("click", closeEditModal);

  const btnCancel = $("btn-edit-cancel");
  if (btnCancel) btnCancel.addEventListener("click", closeEditModal);

  const modalEl = $("edit-modal");
  if (modalEl) {
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeEditModal();
    });
  }

  const btnSave = $("btn-edit-save");
  if (btnSave) btnSave.addEventListener("click", saveEditModal);

  const btnDec = $("btn-edit-qty-dec");
  if (btnDec) {
    btnDec.addEventListener("click", () => {
      const q = $("edit-quantity");
      if (q) q.value = Math.max(1, (Number(q.value) || 1) - 1);
    });
  }

  const btnInc = $("btn-edit-qty-inc");
  if (btnInc) {
    btnInc.addEventListener("click", () => {
      const q = $("edit-quantity");
      if (q) q.value = (Number(q.value) || 0) + 1;
    });
  }
}
