// ============================================================
// Modal Quản Lý Nhân Viên (Root) & Tự Đổi PIN Cá Nhân (Staff)
// ============================================================
import { $ } from "../../utils/dom.js";
import { escapeHtml } from "../../utils/formatters.js";
import { toast } from "../../utils/toast.js";
import { getCurrentUser, isRootUser, getStaffList } from "../../state/app-state.js";
import { selfChangePin, rootAddStaff, rootUpdateStaff, rootDeleteStaff, syncStaffList } from "../../utils/auth.js";

let editingStaffId = null;

// ============================================================
// 1. MODAL TỰ ĐỔI PIN CÁ NHÂN (Dành cho mọi nhân viên)
// ============================================================

export function openSelfChangePinModal() {
  const user = getCurrentUser();
  if (!user) {
    toast("Bạn chưa đăng nhập.", "error");
    return;
  }

  const nameEl = $("self-change-pin-username");
  if (nameEl) nameEl.textContent = user.name;

  if ($("self-change-pin-old")) $("self-change-pin-old").value = "";
  if ($("self-change-pin-new")) $("self-change-pin-new").value = "";
  if ($("self-change-pin-confirm")) $("self-change-pin-confirm").value = "";

  const modal = $("modal-self-change-pin");
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => $("self-change-pin-old")?.focus(), 50);
  }
}

export function closeSelfChangePinModal() {
  const modal = $("modal-self-change-pin");
  if (modal) modal.classList.add("hidden");
}

async function handleSelfChangePinSubmit() {
  const oldPin = ($("self-change-pin-old")?.value || "").trim();
  const newPin = ($("self-change-pin-new")?.value || "").trim();
  const confirmPin = ($("self-change-pin-confirm")?.value || "").trim();

  if (!oldPin) {
    toast("Vui lòng nhập mã PIN hiện tại!", "error");
    $("self-change-pin-old")?.focus();
    return;
  }

  if (!newPin) {
    toast("Vui lòng nhập mã PIN mới!", "error");
    $("self-change-pin-new")?.focus();
    return;
  }

  if (newPin.length < 4 || newPin.length > 8) {
    toast("Mã PIN mới phải từ 4 đến 8 chữ số!", "error");
    $("self-change-pin-new")?.focus();
    return;
  }

  if (newPin !== confirmPin) {
    toast("Mã PIN xác nhận không trùng khớp với mã PIN mới!", "error");
    $("self-change-pin-confirm")?.focus();
    return;
  }

  if (oldPin === newPin) {
    toast("Mã PIN mới phải khác mã PIN hiện tại!", "error");
    $("self-change-pin-new")?.focus();
    return;
  }

  const btnSave = $("btn-self-change-pin-save");
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = "Đang đổi PIN…";
  }

  try {
    const res = await selfChangePin(oldPin, newPin);
    if (res.success) {
      toast(res.message || "Đổi mã PIN thành công! Vui lòng ghi nhớ mã mới.", "success");
      closeSelfChangePinModal();
    } else {
      toast(res.message || "Không thể đổi mã PIN.", "error");
    }
  } catch (err) {
    toast("Lỗi: " + err.message, "error");
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = "Lưu Mã PIN Mới";
    }
  }
}

// ============================================================
// 2. MODAL QUẢN LÝ NHÂN VIÊN & PIN (Dành riêng cho ROOT)
// ============================================================

export async function openStaffManageModal() {
  if (!isRootUser()) {
    toast("Chức năng này chỉ dành cho Quản trị viên (Root).", "error");
    return;
  }

  const modal = $("modal-root-staff-manage");
  if (!modal) return;
  modal.classList.remove("hidden");

  // Reset form thêm
  resetAddStaffForm();
  renderStaffList();

  // Tải danh sách mới nhất từ server ngầm
  try {
    await syncStaffList();
    renderStaffList();
  } catch (e) {
    console.warn("Không sync được staff:", e);
  }
}

export function closeStaffManageModal() {
  const modal = $("modal-root-staff-manage");
  if (modal) modal.classList.add("hidden");
  resetAddStaffForm();
}

function resetAddStaffForm() {
  editingStaffId = null;
  if ($("add-staff-id")) $("add-staff-id").value = "";
  if ($("add-staff-name")) $("add-staff-name").value = "";
  if ($("add-staff-pin")) $("add-staff-pin").value = "";
  if ($("add-staff-form-title")) $("add-staff-form-title").textContent = "Thêm Nhân Viên Mới";
  if ($("btn-submit-staff")) $("btn-submit-staff").textContent = "+ Thêm Nhân Viên";
  if ($("btn-cancel-edit-staff")) $("btn-cancel-edit-staff").classList.add("hidden");
}

export function renderStaffList() {
  const container = $("root-staff-list");
  if (!container) return;

  const staffList = getStaffList().filter((s) => s.status !== "inactive");

  if (!staffList.length) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <p class="text-sm font-medium">Chưa có nhân viên nào trong danh sách.</p>
        <p class="text-xs mt-1 text-slate-400">Hãy thêm nhân viên đầu tiên bên dưới để phân quyền mã PIN riêng.</p>
      </div>`;
    if ($("root-staff-count-badge")) $("root-staff-count-badge").textContent = "0";
    return;
  }

  if ($("root-staff-count-badge")) $("root-staff-count-badge").textContent = staffList.length;

  container.innerHTML = staffList.map((st) => {
    const isEditing = editingStaffId === st.id;
    return `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl border ${isEditing ? "border-amber-400 bg-amber-50/40" : "border-slate-100 bg-white hover:border-slate-200"} shadow-xs transition-all gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-10 w-10 rounded-2xl bg-pine-100 text-pine-900 font-bold flex items-center justify-center shrink-0 shadow-xs">
            ${escapeHtml(st.name.charAt(0).toUpperCase())}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="text-xs sm:text-sm font-bold text-slate-800 truncate">${escapeHtml(st.name)}</h4>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">Nhân viên</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>PIN:</span>
              <span class="staff-pin-display font-mono font-bold tracking-widest text-slate-700" data-pin="${escapeHtml(st.pin)}">••••</span>
              <button type="button" class="btn-toggle-pin-peek text-[11px] text-pine-700 hover:text-pine-900 font-medium ml-1 cursor-pointer">
                Hiện
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button type="button" data-id="${escapeHtml(st.id)}" class="btn-edit-staff px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all">
            Sửa / Đổi PIN
          </button>
          <button type="button" data-id="${escapeHtml(st.id)}" data-name="${escapeHtml(st.name)}" class="btn-delete-staff px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 active:scale-95 transition-all">
            Xóa
          </button>
        </div>
      </div>`;
  }).join("");

  // Gắn sự kiện nút Xem PIN
  container.querySelectorAll(".btn-toggle-pin-peek").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pinSpan = btn.parentElement.querySelector(".staff-pin-display");
      if (!pinSpan) return;
      const actualPin = pinSpan.dataset.pin;
      if (pinSpan.textContent === "••••") {
        pinSpan.textContent = actualPin;
        btn.textContent = "Ẩn";
      } else {
        pinSpan.textContent = "••••";
        btn.textContent = "Hiện";
      }
    });
  });

  // Gắn sự kiện Sửa
  container.querySelectorAll(".btn-edit-staff").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const st = getStaffList().find((s) => s.id === id);
      if (!st) return;

      editingStaffId = st.id;
      if ($("add-staff-id")) $("add-staff-id").value = st.id;
      if ($("add-staff-name")) $("add-staff-name").value = st.name;
      if ($("add-staff-pin")) $("add-staff-pin").value = st.pin;
      if ($("add-staff-form-title")) $("add-staff-form-title").textContent = `Chỉnh Sửa Nhân Viên: ${st.name}`;
      if ($("btn-submit-staff")) $("btn-submit-staff").textContent = "Cập Nhật Thông Tin";
      if ($("btn-cancel-edit-staff")) $("btn-cancel-edit-staff").classList.remove("hidden");

      renderStaffList();
      $("add-staff-name")?.focus();
    });
  });

  // Gắn sự kiện Xóa
  container.querySelectorAll(".btn-delete-staff").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${name}" khỏi hệ thống?\nSau khi xóa, nhân viên này sẽ không thể đăng nhập bằng mã PIN của họ.`)) {
        return;
      }

      try {
        btn.disabled = true;
        btn.textContent = "Đang xóa…";
        await rootDeleteStaff(id);
        toast(`Đã xóa nhân viên "${name}" thành công!`, "success");
        if (editingStaffId === id) resetAddStaffForm();
        renderStaffList();
      } catch (err) {
        toast("Lỗi khi xóa nhân viên: " + err.message, "error");
        btn.disabled = false;
        btn.textContent = "Xóa";
      }
    });
  });
}

async function handleStaffFormSubmit() {
  const id = ($("add-staff-id")?.value || "").trim();
  const name = ($("add-staff-name")?.value || "").trim();
  const pin = ($("add-staff-pin")?.value || "").trim();

  if (!name) {
    toast("Vui lòng nhập họ và tên nhân viên!", "error");
    $("add-staff-name")?.focus();
    return;
  }

  if (!pin) {
    toast("Vui lòng nhập mã PIN!", "error");
    $("add-staff-pin")?.focus();
    return;
  }

  if (pin.length < 4 || pin.length > 8) {
    toast("Mã PIN phải từ 4 đến 8 chữ số!", "error");
    $("add-staff-pin")?.focus();
    return;
  }

  const btnSubmit = $("btn-submit-staff");
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Đang lưu lên Sheets…";
  }

  try {
    if (id) {
      // Sửa nhân viên đã có
      await rootUpdateStaff(id, { name, pin });
      toast(`Đã cập nhật thông tin nhân viên "${name}" thành công!`, "success");
    } else {
      // Thêm mới
      await rootAddStaff({ name, pin });
      toast(`Đã thêm nhân viên "${name}" vào Google Sheets thành công!`, "success");
    }
    resetAddStaffForm();
    renderStaffList();
  } catch (err) {
    toast("Lỗi: " + err.message, "error");
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = id ? "Cập Nhật Thông Tin" : "+ Thêm Nhân Viên";
    }
  }
}

// ============================================================
// 3. KHỞI TẠO SỰ KIỆN TOÀN BỘ MODAL
// ============================================================

export function initStaffModals() {
  // Modal Tự Đổi PIN
  $("btn-close-self-change-pin")?.addEventListener("click", closeSelfChangePinModal);
  $("btn-cancel-self-change-pin")?.addEventListener("click", closeSelfChangePinModal);
  $("btn-self-change-pin-save")?.addEventListener("click", handleSelfChangePinSubmit);
  $("modal-self-change-pin")?.addEventListener("click", (e) => {
    if (e.target === $("modal-self-change-pin")) closeSelfChangePinModal();
  });

  // Modal Quản Lý Nhân Viên (Root)
  $("btn-close-root-staff-manage")?.addEventListener("click", closeStaffManageModal);
  $("modal-root-staff-manage")?.addEventListener("click", (e) => {
    if (e.target === $("modal-root-staff-manage")) closeStaffManageModal();
  });

  $("btn-submit-staff")?.addEventListener("click", handleStaffFormSubmit);
  $("btn-cancel-edit-staff")?.addEventListener("click", resetAddStaffForm);

  $("btn-sync-staff-from-sheet")?.addEventListener("click", async () => {
    const btn = $("btn-sync-staff-from-sheet");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Đang đồng bộ…`;
    }
    try {
      const list = await syncStaffList();
      renderStaffList();
      toast(`Đã đồng bộ ${list.length} nhân viên từ Google Sheets!`, "success");
    } catch (err) {
      toast("Lỗi đồng bộ: " + err.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Đồng bộ lại`;
      }
    }
  });
}
