// ============================================================
// Modal & Logic Khóa Ngày Sổ Sách (Lock Date)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { formatLockDateVN, toYMD, formatNgayXuat, pad } from "../../utils/formatters.js";
import { state, getLockDate, setLockDate, isRootUser } from "../../state/app-state.js";
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
    if (textEl) textEl.innerHTML = `<span class="sm:hidden">Tải…</span><span class="hidden sm:inline">Đang kiểm tra…</span>`;
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
  const isRoot = isRootUser();
  const lock = getLockDate();
  const textEl = $("lock-date-header-text");
  const descEl = $("lock-date-status-desc");
  const inputEl = $("lock-date-input");
  const btnOpen = $("btn-open-lock-date-modal");

  if (lock) {
    const vnDate = formatLockDateVN(lock);
    if (textEl) textEl.innerHTML = `<span class="sm:hidden">≤ ${vnDate.slice(0, 5)}</span><span class="hidden sm:inline">Khóa: ≤ ${vnDate}</span>`;
    if (descEl) descEl.innerHTML = `<span class="text-amber-700 font-semibold">Đang khóa sổ đến: ${vnDate}</span> (Không thể thêm/sửa/xóa từ ngày này trở về trước).`;
    if (inputEl) inputEl.value = toYMD(lock);
    if (btnOpen) {
      btnOpen.classList.add("bg-amber-500/25", "border-amber-400/50");
    }
    const sideLock = $("sidebar-lock-status");
    if (sideLock) sideLock.textContent = `≤ ${vnDate}`;
  } else {
    if (textEl) textEl.innerHTML = `<span class="sm:hidden">Mở</span><span class="hidden sm:inline">Khóa ngày</span>`;
    if (descEl) descEl.textContent = "Hiện tại chưa đặt ngày khóa sổ.";
    if (inputEl) inputEl.value = "";
    if (btnOpen) {
      btnOpen.classList.remove("bg-amber-500/25", "border-amber-400/50");
    }
    const sideLock = $("sidebar-lock-status");
    if (sideLock) sideLock.textContent = "Chưa đặt";
  }

  if (btnOpen) {
    if (isRoot) {
      btnOpen.classList.add("cursor-pointer", "hover:bg-white/20");
      btnOpen.classList.remove("cursor-default", "hover:bg-white/10");
      btnOpen.title = "Cài đặt khóa ngày sổ sách (Quyền Root)";
    } else {
      btnOpen.classList.remove("cursor-pointer", "hover:bg-white/20");
      btnOpen.classList.add("cursor-default", "hover:bg-white/10");
      btnOpen.title = lock ? `Đang khóa sổ sách đến ngày ${formatLockDateVN(lock)}` : "Chưa đặt ngày khóa sổ";
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
  if (!isRootUser()) return; // Chỉ Root mới mở popup cài đặt khóa ngày, nhân viên chỉ xem trên header
  const isRoot = isRootUser();
  const lock = getLockDate();

  const inputEl = $("lock-date-input");
  const actionsEl = $("lock-date-action-buttons");
  const staffNoticeEl = $("lock-date-staff-notice");
  const roleBadgeEl = $("lock-date-role-badge");
  const titleEl = $("lock-date-modal-title");

  if (inputEl) {
    inputEl.value = lock ? toYMD(lock) : "";
    inputEl.disabled = !isRoot;
    if (isRoot) {
      inputEl.classList.remove("bg-slate-100", "cursor-not-allowed", "text-slate-500");
      inputEl.classList.add("bg-paper/40", "cursor-pointer", "text-ink");
    } else {
      inputEl.classList.add("bg-slate-100", "cursor-not-allowed", "text-slate-500");
      inputEl.classList.remove("bg-paper/40", "cursor-pointer", "text-ink");
    }
  }

  if (actionsEl) {
    actionsEl.classList.toggle("hidden", !isRoot);
  }
  if (staffNoticeEl) {
    staffNoticeEl.classList.toggle("hidden", isRoot);
  }
  if (roleBadgeEl) {
    if (isRoot) {
      roleBadgeEl.textContent = "👑 Root";
      roleBadgeEl.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/60";
    } else {
      roleBadgeEl.textContent = "👤 Nhân viên (Chỉ xem)";
      roleBadgeEl.className = "text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200";
    }
  }
  if (titleEl) {
    titleEl.textContent = isRoot ? "Khóa Ngày Sổ Sách" : "Thông Tin Khóa Ngày";
  }

  updateLockDateUI();
  if ($("lock-date-modal")) $("lock-date-modal").classList.remove("hidden");
  await fetchLockDate();
}

export function closeLockDateModal() {
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

  const btnCancel = $("btn-lock-date-cancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", closeLockDateModal);
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
      if (!isRootUser()) {
        toast("Chỉ Quản trị viên (Root) mới có quyền Khóa ngày sổ sách!", "error");
        return;
      }

      const isoDate = ($("lock-date-input")?.value || "").trim();
      if (!isoDate) {
        toast("Vui lòng chọn ngày mốc khóa sổ!", "error");
        return;
      }

      btnSave.disabled = true;
      btnSave.textContent = "Đang lưu…";

      setLockDate(isoDate);
      updateLockDateUI();

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
      if (!isRootUser()) {
        toast("Chỉ Quản trị viên (Root) mới có quyền Mở khóa ngày sổ sách!", "error");
        return;
      }

      btnClear.disabled = true;
      btnClear.textContent = "Đang mở…";

      setLockDate("");
      updateLockDateUI();

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
