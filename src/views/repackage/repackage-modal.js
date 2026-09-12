// ============================================================
// Modal Xác Nhận Chiết Hàng (1 Nguồn -> N Đích)
// ============================================================
import { $, setButtonLoading, showLoadingOverlay, hideLoadingOverlay } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { formatNgayXuat, formatLockDateVN, unixNow, todayInputValue, escapeHtml, toYMD } from "../../utils/formatters.js";
import { state, isDateLocked, getLockDate, genLineId, getField } from "../../state/app-state.js";
import { saveRepackageAPI } from "../../services/api.js";
import { updateGlobalHeaderSync } from "../../utils/sync-indicator.js";
import { findProductByMa } from "../export/products-view.js";
import { getMinAllowedDate } from "../common/lock-date-modal.js";

let onRepackageSuccessCallback = null;

export function setRepackageSuccessCallback(cb) {
  onRepackageSuccessCallback = cb;
}

export function openRepackageModal() {
  const srcId = state.repackage.sourceId;
  const srcQty = Number($("repackage-source-qty").value || 1);
  const srcProduct = findProductByMa(srcId);
  const validTargets = state.repackage.targets.filter((t) => t.productId && Number(t.quantity) > 0);

  if (!srcProduct || !validTargets.length) {
    toast("Vui lòng chọn sản phẩm nguồn và ít nhất 1 sản phẩm đích.", "error");
    return;
  }

  const srcName = getField(srcProduct, "tenSP");
  const srcUnit = getField(srcProduct, "donVi") || "";

  if ($("repackage-modal-source-name")) $("repackage-modal-source-name").textContent = srcName;
  if ($("repackage-modal-source-badge")) $("repackage-modal-source-badge").textContent = `-${srcQty} ${srcUnit}`.trim();

  if ($("repackage-modal-targets-list")) {
    $("repackage-modal-targets-list").innerHTML = validTargets.map((t) => {
      const tp = findProductByMa(t.productId);
      const name = tp ? getField(tp, "tenSP") : t.productId;
      const unit = tp ? getField(tp, "donVi") : "";
      return `
        <li class="flex items-center justify-between gap-2 py-1 text-xs">
          <span class="font-medium text-slate-800 truncate">${escapeHtml(name)} ${t.note ? `<span class="text-slate-400 font-normal italic">(${escapeHtml(t.note)})</span>` : ""}</span>
          <span class="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">+${t.quantity} ${unit}</span>
        </li>`;
    }).join("");
  }

  const minDate = getMinAllowedDate();
  const dateInput = $("repackage-modal-date");
  if (dateInput) {
    if (minDate) dateInput.min = minDate;
    else dateInput.removeAttribute("min");

    const savedDate = localStorage.getItem("sam_pet_repackage_date") || todayInputValue();
    dateInput.value = isDateLocked(savedDate) ? (minDate || todayInputValue()) : savedDate;
  }

  if ($("repackage-export-modal")) $("repackage-export-modal").classList.remove("hidden");
}

export function closeRepackageModal() {
  if ($("repackage-export-modal")) $("repackage-export-modal").classList.add("hidden");
}

export async function confirmRepackageToSheets(resetFormFn) {
  const dateInput = $("repackage-modal-date");
  const selectedDate = dateInput ? dateInput.value : "";
  if (!selectedDate) {
    toast("Vui lòng chọn ngày thực hiện chiết hàng.", "error");
    return;
  }

  if (isDateLocked(selectedDate)) {
    toast(`Ngày chiết (${formatNgayXuat(selectedDate)}) đã bị khóa sổ (từ ngày ${formatLockDateVN(getLockDate())} trở về trước). Vui lòng chọn ngày sau ngày khóa!`, "error");
    return;
  }

  localStorage.setItem("sam_pet_repackage_date", selectedDate);

  const srcId = state.repackage.sourceId;
  const srcQty = Number($("repackage-source-qty").value || 1);
  const srcProduct = findProductByMa(srcId);
  const validTargets = state.repackage.targets.filter((t) => t.productId && Number(t.quantity) > 0);

  const now = unixNow();
  const dateFormatted = formatNgayXuat(selectedDate);
  const sessionId = "repack_" + genLineId();

  const newRows = validTargets.map((t, idx) => {
    const tp = findProductByMa(t.productId);
    return {
      id: genLineId(),
      sessionId: sessionId,
      date: dateFormatted,
      fromProductId: "'" + String(srcId).replace(/^'+/, ""),
      fromProductName: getField(srcProduct, "tenSP"),
      toProductId: "'" + String(t.productId).replace(/^'+/, ""),
      toProductName: tp ? getField(tp, "tenSP") : t.productId,
      fromQuantity: idx === 0 ? srcQty : 0,
      sessionFromQty: srcQty,
      toQuantity: Number(t.quantity),
      note: t.note || "",
      createdAt: now,
      updatedAt: now
    };
  });

  const btnConfirm = $("btn-repackage-modal-confirm");
  const btnCancel = $("btn-repackage-modal-cancel");
  if (btnCancel) btnCancel.disabled = true;
  setButtonLoading(btnConfirm, true, `Đang chiết ${newRows.length} mặt hàng…`);
  showLoadingOverlay("Đang lưu phiếu chiết hàng…", `Đang đồng bộ ${newRows.length} mặt hàng chiết lên Google Sheets`);
  updateGlobalHeaderSync("syncing", "Đang chiết hàng…");

  try {
    const data = await saveRepackageAPI(newRows);
    if (data && data.status === "error") {
      toast(data.message || "Lỗi khi đồng bộ chiết hàng.", "error");
      return;
    }

    toast(data.message || (`Chiết hàng thành công! Đã ghi nhận phiếu chiết gồm ${newRows.length} mặt hàng đích.`), "success");
    closeRepackageModal();
    if (resetFormFn) resetFormFn();
    if (onRepackageSuccessCallback) onRepackageSuccessCallback(newRows);
  } catch (err) {
    toast("Lỗi khi đồng bộ chiết hàng: " + err.message, "error");
  } finally {
    hideLoadingOverlay();
    if (btnCancel) btnCancel.disabled = false;
    setButtonLoading(btnConfirm, false);
  }
}

export function initRepackageModal(resetFormFn) {
  const btnCancel = $("btn-repackage-modal-cancel");
  if (btnCancel) btnCancel.addEventListener("click", closeRepackageModal);

  const modalEl = $("repackage-export-modal");
  if (modalEl) {
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeRepackageModal();
    });
  }

  const btnConfirm = $("btn-repackage-modal-confirm");
  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => confirmRepackageToSheets(resetFormFn));
  }
}
