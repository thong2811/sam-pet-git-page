// ============================================================
// Modal & Logic Khóa Ngày Sổ Sách (Lock Date)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { formatLockDateVN, toYMD, formatNgayXuat, pad } from "../../utils/formatters.js";
import { state, getLockDate, setLockDate } from "../../state/app-state.js";
import { CONFIG } from "../../config.js";
import { fetchLockDateAPI, setLockDateAPI } from "../../services/api.js";

export function getMinAllowedDate() {
  const lock = getLockDate();
  if (!lock) return "";
  const d = new Date(toYMD(lock));
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function setLockDateLoading(isLoading) {
  const textEl = $("lock-date-header-text");
  const iconEl = $("lock-date-header-icon");
  const descEl = $("lock-date-status-desc");

  if (isLoading) {
    if (textEl) textEl.textContent = "Đang kiểm tra…";
    if (iconEl) {
      iconEl.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 text-amber-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>`;
    }
    if (descEl) {
      descEl.innerHTML = `<span class="inline-flex items-center gap-1.5 text-slate-500 font-medium"><span class="w-3.5 h-3.5 border-2 border-pine-500 border-t-transparent rounded-full animate-spin"></span> Đang đồng bộ ngày khóa từ máy chủ…</span>`;
    }
  } else {
    if (iconEl) {
      iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-amber-300" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>`;
    }
    updateLockDateUI();
  }
}

export function updateLockDateUI() {
  const lock = getLockDate();
  const textEl = $("lock-date-header-text");
  const descEl = $("lock-date-status-desc");
  const inputEl = $("lock-date-input");
  const btnOpen = $("btn-open-lock-date-modal");

  if (lock) {
    const vnDate = formatLockDateVN(lock);
    if (textEl) textEl.textContent = `Khóa: ≤ ${vnDate}`;
    if (descEl) descEl.innerHTML = `<span class="text-amber-700 font-semibold">Đang khóa sổ đến: ${vnDate}</span> (Không thể thêm/sửa/xóa từ ngày này trở về trước).`;
    if (inputEl) inputEl.value = toYMD(lock);
    if (btnOpen) {
      btnOpen.classList.add("bg-amber-500/25", "border-amber-400/50");
    }
  } else {
    if (textEl) textEl.textContent = "Khóa ngày";
    if (descEl) descEl.textContent = "Hiện tại chưa đặt ngày khóa sổ.";
    if (inputEl) inputEl.value = "";
    if (btnOpen) {
      btnOpen.classList.remove("bg-amber-500/25", "border-amber-400/50");
    }
  }
}

export async function fetchLockDate() {
  setLockDateLoading(true);
  try {
    const serverLockDate = await fetchLockDateAPI();
    if (serverLockDate !== undefined) {
      state.lockDate = serverLockDate ? toYMD(serverLockDate) : "";
    }
  } catch (err) {
    console.warn("Lỗi khi tải ngày khóa:", err);
  } finally {
    setLockDateLoading(false);
  }
}

export async function openLockDateModal() {
  const lock = getLockDate();
  if ($("lock-date-input")) $("lock-date-input").value = lock ? toYMD(lock) : "";
  if ($("lock-date-pin")) $("lock-date-pin").value = "";
  updateLockDateUI();
  if ($("lock-date-modal")) $("lock-date-modal").classList.remove("hidden");
  if ($("lock-date-pin")) $("lock-date-pin").focus();
  await fetchLockDate();
}

export function closeLockDateModal() {
  if ($("lock-date-pin")) $("lock-date-pin").value = "";
  if ($("lock-date-modal")) $("lock-date-modal").classList.add("hidden");
}

export function initLockDateModal() {
  const btnOpen = $("btn-open-lock-date-modal");
  if (btnOpen) {
    btnOpen.addEventListener("click", openLockDateModal);
  }

  const btnClose = $("btn-lock-date-close");
  if (btnClose) {
    btnClose.addEventListener("click", closeLockDateModal);
  }

  const modalEl = $("lock-date-modal");
  if (modalEl) {
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeLockDateModal();
    });
  }

  const btnSave = $("btn-lock-date-save");
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const isoDate = ($("lock-date-input").value || "").trim();
      const pin = ($("lock-date-pin").value || "").trim();

      if (!isoDate) {
        toast("Vui lòng chọn ngày mốc khóa sổ!", "error");
        return;
      }

      if (pin !== CONFIG.LOCK_DATE_PIN) {
        toast("Mã PIN không chính xác. Vui lòng thử lại!", "error");
        if ($("lock-date-pin")) {
          $("lock-date-pin").value = "";
          $("lock-date-pin").focus();
        }
        return;
      }

      btnSave.disabled = true;
      btnSave.textContent = "Đang lưu…";

      setLockDate(isoDate);

      try {
        const data = await setLockDateAPI(isoDate);
        if (data && data.status === "error") {
          toast(data.message || "Lỗi khi lưu ngày khóa lên server.", "error");
          return;
        }
        toast(data.message || `Đã khóa sổ sách từ ngày ${formatLockDateVN(isoDate)} trở về trước và đồng bộ lên hệ thống.`, "success");
      } catch (err) {
        toast(`Đã khóa cục bộ nhưng chưa đồng bộ được lên server: ${err.message}`, "warning");
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = "Lưu ngày khóa";
        closeLockDateModal();
      }
    });
  }

  const btnClear = $("btn-lock-date-clear");
  if (btnClear) {
    btnClear.addEventListener("click", async () => {
      const pin = ($("lock-date-pin").value || "").trim();

      if (pin !== CONFIG.LOCK_DATE_PIN) {
        toast("Mã PIN không chính xác. Vui lòng thử lại!", "error");
        if ($("lock-date-pin")) {
          $("lock-date-pin").value = "";
          $("lock-date-pin").focus();
        }
        return;
      }

      btnClear.disabled = true;
      btnClear.textContent = "Đang mở…";

      setLockDate("");

      try {
        const data = await setLockDateAPI("");
        if (data && data.status === "error") {
          toast(data.message || "Lỗi khi mở khóa trên server.", "error");
          return;
        }
        toast(data.message || "Đã mở khóa ngày sổ sách trên toàn hệ thống.", "info");
      } catch (err) {
        toast(`Đã mở khóa cục bộ nhưng chưa đồng bộ được: ${err.message}`, "warning");
      } finally {
        btnClear.disabled = false;
        btnClear.textContent = "Mở khóa (Hủy)";
        closeLockDateModal();
      }
    });
  }
}
