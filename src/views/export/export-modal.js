// ============================================================
// Modal Xác Nhận Xuất Lên Google Sheets (Xuất Hàng)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { formatNgayXuat, formatLockDateVN, unixNow, todayInputValue } from "../../utils/formatters.js";
import { state, isDateLocked, getLockDate } from "../../state/app-state.js";
import { appendPhieuXuatAPI } from "../../services/api.js";
import { renderPhieu } from "./ticket-view.js";
import { getMinAllowedDate } from "../common/lock-date-modal.js";

let onExportSuccessCallback = null;

export function setExportSuccessCallback(cb) {
  onExportSuccessCallback = cb;
}

export function openExportModal() {
  if (!state.phieu.length) {
    toast("Phiếu xuất đang trống.", "error");
    return;
  }

  const count = state.phieu.length;
  const totalQty = state.phieu.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const totalMoney = state.phieu.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.sellingPrice || 0)), 0);

  if ($("export-modal-count")) $("export-modal-count").textContent = `${count} dòng`;
  if ($("export-modal-qty")) $("export-modal-qty").textContent = totalQty.toLocaleString("vi-VN");
  if ($("export-modal-total")) $("export-modal-total").textContent = `${totalMoney.toLocaleString("vi-VN")} đ`;

  const dateInput = $("export-modal-date");
  if (dateInput) {
    const savedDate = localStorage.getItem("sam_pet_export_date") || todayInputValue();
    dateInput.value = savedDate;

    const minDate = getMinAllowedDate();
    if (minDate) dateInput.min = minDate;
    else dateInput.removeAttribute("min");
  }

  if ($("export-modal")) $("export-modal").classList.remove("hidden");
}

export function closeExportModal() {
  if ($("export-modal")) $("export-modal").classList.add("hidden");
}

export async function confirmExportToSheets() {
  const dateInput = $("export-modal-date");
  const selectedDate = dateInput ? dateInput.value : "";

  if (!selectedDate) {
    toast("Vui lòng chọn ngày xuất hàng.", "error");
    return;
  }

  if (isDateLocked(selectedDate)) {
    toast(`Ngày xuất (${formatNgayXuat(selectedDate)}) đã bị khóa sổ (từ ngày ${formatLockDateVN(getLockDate())} trở về trước). Vui lòng chọn ngày sau ngày khóa!`, "error");
    return;
  }

  localStorage.setItem("sam_pet_export_date", selectedDate);

  const now = unixNow();
  const dateFormatted = formatNgayXuat(selectedDate);

  const rows = state.phieu.map((row) => ({
    id: "'" + String(row.id || "").replace(/^'+/, ""),
    date: dateFormatted,
    productId: "'" + String(row.productId || "").replace(/^'+/, ""),
    productName: row.productName,
    quantity: row.quantity,
    sellingPrice: row.sellingPrice,
    purchasePrice: row.purchasePrice,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || now
  }));

  const btnConfirm = $("btn-export-modal-confirm");
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = "Đang gửi…";
  }

  try {
    const data = await appendPhieuXuatAPI(rows);
    if (data && data.status === "error") {
      toast(data.message || "Lỗi khi lưu lên Sheets.", "error");
      return;
    }
    toast(data.message || (`Đã gửi ${rows.length} dòng lên Google Sheets!`), "success");
    state.phieu = [];
    renderPhieu();
    closeExportModal();
    if (onExportSuccessCallback) onExportSuccessCallback();
  } catch (err) {
    toast("Lỗi khi gửi lên Sheets: " + err.message, "error");
  } finally {
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> Xác nhận xuất`;
    }
  }
}

export function initExportModal() {
  const btnCancel = $("btn-export-modal-cancel");
  if (btnCancel) btnCancel.addEventListener("click", closeExportModal);

  const modalEl = $("export-modal");
  if (modalEl) {
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeExportModal();
    });
  }

  const btnConfirm = $("btn-export-modal-confirm");
  if (btnConfirm) btnConfirm.addEventListener("click", confirmExportToSheets);
}
