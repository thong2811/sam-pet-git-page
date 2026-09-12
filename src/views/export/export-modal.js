// ============================================================
// Modal Xác Nhận Xuất Lên Google Sheets (Xuất Hàng)
// ============================================================
import { $, setButtonLoading, showLoadingOverlay, hideLoadingOverlay } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { formatNgayXuat, formatLockDateVN, toYMD, unixNow, todayInputValue } from "../../utils/formatters.js";
import { state, isDateLocked, getLockDate } from "../../state/app-state.js";
import { appendPhieuXuatAPI } from "../../services/api.js";
import { renderPhieu } from "./ticket-view.js";
import { updateGlobalHeaderSync } from "../../utils/sync-indicator.js";
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
  const btnCancel = $("btn-export-modal-cancel");
  if (btnCancel) btnCancel.disabled = true;
  setButtonLoading(btnConfirm, true, `Đang gửi ${rows.length} dòng lên Sheets…`);
  showLoadingOverlay("Đang xuất phiếu hàng…", `Đang đồng bộ ${rows.length} dòng sản phẩm lên Google Sheets`);
  updateGlobalHeaderSync("syncing", "Đang xuất hàng…");

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
    if (onExportSuccessCallback) onExportSuccessCallback(rows);
  } catch (err) {
    toast("Lỗi khi gửi lên Sheets: " + err.message, "error");
  } finally {
    hideLoadingOverlay();
    if (btnCancel) btnCancel.disabled = false;
    setButtonLoading(btnConfirm, false);
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
