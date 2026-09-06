// ============================================================
// Điểm khởi động chính của ứng dụng SAM Pet (Main Entrypoint)
// ============================================================
import "./style.css";
import { $ } from "./utils/dom.js";
import { escapeHtml } from "./utils/formatters.js";
import { toast } from "./utils/toast.js";
import { state, getCurrentUser, isRootUser, getStaffList } from "./state/app-state.js";
import { loadProductsData } from "./services/api.js";
import { CONFIG } from "./config.js";
import { isAuthenticated, authenticateUserPin, authenticatePin, clearSession, syncStaffList } from "./utils/auth.js";

// Common modals
import { initLockDateModal, fetchLockDate } from "./views/common/lock-date-modal.js";
import { initEditRowModal } from "./views/common/edit-row-modal.js";
import { initStaffModals, openStaffManageModal, openSelfChangePinModal } from "./views/common/staff-manage-modal.js";

// Export views
import { initProductsView, renderProductHead, renderProducts } from "./views/export/products-view.js";
import { initPhieuView, renderPhieu } from "./views/export/ticket-view.js";
import { initExportModal } from "./views/export/export-modal.js";
import { initHistoryView, loadSheetHistory } from "./views/export/history-view.js";

// Repackage views
import { initRepackageForm, renderRepackageTargets } from "./views/repackage/repackage-form.js";
import { initRepackageHistory, loadRepackageHistory } from "./views/repackage/repackage-history.js";

export function hideSplash() {
  const splash = $("splash");
  if (splash) splash.classList.add("hidden");
}

export function setStatus(text, tone) {
  const chip = $("status-chip");
  if (chip) {
    const dot = tone === "ok"
      ? "bg-emerald-400"
      : tone === "err"
        ? "bg-red-400"
        : "bg-amber-300 animate-pulse";
    chip.innerHTML = `<span class="h-2 w-2 rounded-full ${dot}"></span>${escapeHtml(text)}`;
  }
  const sideCsv = $("sidebar-csv-status");
  if (sideCsv) sideCsv.textContent = text;
}

export function openSidebar() {
  const drawer = $("sidebar-drawer");
  const backdrop = $("sidebar-drawer-backdrop");
  if (!drawer || !backdrop) return;
  drawer.classList.remove("-translate-x-full");
  drawer.classList.add("translate-x-0");
  backdrop.classList.remove("opacity-0", "pointer-events-none");
  backdrop.classList.add("opacity-100");
  document.body.classList.add("overflow-hidden");
}

export function closeSidebar() {
  const drawer = $("sidebar-drawer");
  const backdrop = $("sidebar-drawer-backdrop");
  if (!drawer || !backdrop) return;
  drawer.classList.add("-translate-x-full");
  drawer.classList.remove("translate-x-0");
  backdrop.classList.add("opacity-0", "pointer-events-none");
  backdrop.classList.remove("opacity-100");
  document.body.classList.remove("overflow-hidden");
}

export function switchTab(tab) {
  state.activeTab = tab;
  const isXuat = tab === "xuat";

  const tabXuat = $("tab-xuat-container");
  const tabChiet = $("tab-chiet-container");
  const btnXuat = $("tab-btn-xuat");
  const btnChiet = $("tab-btn-chiet");
  const headerTitle = $("header-title");
  const badgeChip = $("badge-chip");

  const sideBtnXuat = $("sidebar-btn-xuat");
  const sideBtnChiet = $("sidebar-btn-chiet");
  const sideBadgeXuat = $("sidebar-badge-xuat");
  const sideBadgeChiet = $("sidebar-badge-chiet");

  if (tabXuat) tabXuat.classList.toggle("hidden", !isXuat);
  if (tabChiet) tabChiet.classList.toggle("hidden", isXuat);

  if (isXuat) {
    if (btnXuat) btnXuat.className = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap bg-white text-pine-900 shadow-sm active:scale-95";
    if (btnChiet) btnChiet.className = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap text-white/80 hover:text-white active:scale-95";
    if (sideBtnXuat) sideBtnXuat.className = "sidebar-nav-item w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left bg-white text-pine-900 shadow-md";
    if (sideBtnChiet) sideBtnChiet.className = "sidebar-nav-item w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-white/80 hover:bg-white/10 hover:text-white";
    if (headerTitle) headerTitle.innerHTML = `<span class="md:hidden">Xuất Hàng</span><span class="hidden md:inline">Phiếu xuất hàng hàng ngày</span>`;
    if (badgeChip) badgeChip.innerHTML = `<span class="sm:hidden font-bold">${state.phieu.length} dòng</span><span class="hidden sm:inline">Phiếu: ${state.phieu.length} dòng</span>`;
  } else {
    if (btnChiet) btnChiet.className = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap bg-white text-pine-900 shadow-sm active:scale-95";
    if (btnXuat) btnXuat.className = "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap text-white/80 hover:text-white active:scale-95";
    if (sideBtnChiet) sideBtnChiet.className = "sidebar-nav-item w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left bg-white text-pine-900 shadow-md";
    if (sideBtnXuat) sideBtnXuat.className = "sidebar-nav-item w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left text-white/80 hover:bg-white/10 hover:text-white";
    if (headerTitle) headerTitle.innerHTML = `<span class="md:hidden">Chiết Hàng</span><span class="hidden md:inline">Chiết hàng & Đóng gói sản phẩm</span>`;
    if (badgeChip) badgeChip.innerHTML = `<span class="sm:hidden font-bold">${state.repackage.targets.length} SP</span><span class="hidden sm:inline">Đích: ${state.repackage.targets.length} SP</span>`;
    renderRepackageTargets();
  }

  if (sideBadgeXuat) sideBadgeXuat.textContent = `${state.phieu.length} dòng`;
  if (sideBadgeChiet) sideBadgeChiet.textContent = `${state.repackage.targets.length} SP`;
}

async function loadProducts() {
  const res = await loadProductsData();
  if (res.success) {
    renderProductHead();
    renderProducts();
    setStatus(`${res.count} sản phẩm · ${res.file}`, "ok");
    if ($("product-count")) $("product-count").textContent = `Đã tải ${res.count} sản phẩm từ ${res.file}`;
    if ($("product-error")) $("product-error").classList.add("hidden");
    toast(`Đã tải ${res.count} sản phẩm từ ${res.file}`, "success");
    hideSplash();
  } else {
    const hint = "Hãy mở trang bằng Live Server hoặc GitHub Pages và đặt file products.csv cùng thư mục với index.html.";
    if ($("product-error")) {
      $("product-error").textContent = (res.error || "Không tải được danh sách sản phẩm.") + " " + hint;
      $("product-error").classList.remove("hidden");
    }
    if ($("product-count")) $("product-count").textContent = "Tải dữ liệu thất bại";
    setStatus("Lỗi tải sản phẩm", "err");
    toast("Không tải được products.csv", "error");
    hideSplash();
  }
}

function initPullToRefresh() {
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    let startY = 0;
    let maxDist = 0;
    let pulling = false;
    let isReloading = false;
    const THRESHOLD = 80;
    const ptr = document.getElementById("ptr-indicator");
    const ptrText = document.getElementById("ptr-text");
    const ptrIcon = document.getElementById("ptr-icon");

    if (!ptr || !ptrText || !ptrIcon) return;

    document.addEventListener("touchstart", (e) => {
      const scrollable = e.target.closest(".scroll-thin, .overflow-x-auto, .overflow-y-auto");
      if (window.scrollY === 0 && !isReloading && !scrollable) {
        startY = e.touches[0].clientY;
        maxDist = 0;
        pulling = true;
      }
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!pulling || isReloading) return;
      const dist = e.touches[0].clientY - startY;
      if (dist > maxDist) maxDist = dist;
      if (dist > 10) {
        ptr.classList.add("ptr-ready");
        ptrText.textContent = dist >= THRESHOLD ? "Thả để tải lại" : "Kéo xuống để tải lại";
      } else {
        ptr.classList.remove("ptr-ready");
      }
    }, { passive: true });

    document.addEventListener("touchend", () => {
      if (!pulling || isReloading) return;
      pulling = false;
      ptr.classList.remove("ptr-ready");
      if (maxDist >= THRESHOLD) {
        isReloading = true;
        ptr.classList.add("ptr-loading");
        ptrText.textContent = "Đang tải lại…";
        ptrIcon.classList.add("ptr-spinner");
        setTimeout(() => window.location.reload(), 500);
      }
    }, { passive: true });

    document.addEventListener("touchcancel", () => {
      pulling = false;
      maxDist = 0;
      ptr.classList.remove("ptr-ready");
    }, { passive: true });
  }
}

// Khởi tạo các module và tải dữ liệu khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  // Tab Switcher
  const btnXuat = $("tab-btn-xuat");
  if (btnXuat) btnXuat.addEventListener("click", () => switchTab("xuat"));

  const btnChiet = $("tab-btn-chiet");
  if (btnChiet) btnChiet.addEventListener("click", () => switchTab("chiet"));

  // Khởi tạo các Views & Modals
  initLockDateModal();
  initEditRowModal();
  initProductsView();
  initPhieuView();
  initExportModal();
  initHistoryView();
  initRepackageForm();
  initRepackageHistory();

  // Dọn dẹp cache local cũ nếu có
  localStorage.removeItem("sam_pet_repackage_history");
  localStorage.removeItem("sam_pet_lock_date");

  // ============================================================
  // Logic Xác Thực Nhân Viên (Staff PIN Auth)
  // ============================================================
  // ============================================================
  // Logic Xác Thực Nhân Viên (2 Bước: Chọn Tài Khoản -> Nhập PIN)
  // ============================================================
  let currentPinInput = "";
  let selectedUserForAuth = null;
  let isDataInitialized = false;

  function initAppData() {
    if (isDataInitialized) return;
    isDataInitialized = true;
    renderPhieu();
    fetchLockDate();
    loadProducts();
    loadSheetHistory();
    loadRepackageHistory();
  }

  function updatePinDots() {
    const dots = document.querySelectorAll(".auth-dot");
    dots.forEach((dot, idx) => {
      if (idx < currentPinInput.length) {
        dot.className = "auth-dot h-3.5 w-3.5 rounded-full bg-amber-400 border-2 border-amber-400 shadow-md scale-110 transition-all";
      } else {
        dot.className = "auth-dot h-3.5 w-3.5 rounded-full border-2 border-white/40 transition-all";
      }
    });
  }

  function renderAuthUserPicker() {
    const listEl = $("auth-users-list");
    if (!listEl) return;

    const staffList = getStaffList().filter(
      (s) => s.status !== "inactive" && s.status !== "deleted"
    );

    let html = `
      <!-- Thẻ Quản trị viên (Root) -->
      <button type="button" class="auth-user-card w-full p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35 border border-amber-400/40 text-left flex items-center gap-3 transition-all active:scale-[0.98] group"
        data-id="root" data-role="root" data-name="Quản trị viên (Root)">
        <div class="h-11 w-11 rounded-xl bg-amber-400 text-pine-950 font-bold text-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          👑
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-amber-200 truncate">Quản trị viên (Root)</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-pine-950 font-bold">Root</span>
          </div>
          <p class="text-[11px] text-pine-200/80">Toàn quyền hệ thống & quản lý</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-300/70 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    `;

    if (staffList.length === 0) {
      html += `
        <div class="p-3 text-center text-xs text-pine-300/80 bg-white/5 rounded-2xl border border-white/10">
          Chưa có nhân viên nào trên hệ thống. Quản trị viên có thể đăng nhập bằng Root PIN để thêm nhân viên.
        </div>
      `;
    } else {
      html += staffList.map((st) => {
        const initial = st.name ? st.name.trim().charAt(0).toUpperCase() : "👤";
        const roleLabel = st.role === "manager" ? "Quản lý" : "Nhân viên";
        return `
          <button type="button" class="auth-user-card w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 text-left flex items-center gap-3 transition-all active:scale-[0.98] group"
            data-id="${escapeHtml(st.id)}" data-role="${escapeHtml(st.role || 'staff')}" data-name="${escapeHtml(st.name)}">
            <div class="h-11 w-11 rounded-xl bg-white/20 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              ${escapeHtml(initial)}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-white truncate">${escapeHtml(st.name)}</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-pine-200">${roleLabel}</span>
              </div>
              <p class="text-[11px] text-pine-300">Nhấn để nhập mã PIN</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white/50 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        `;
      }).join("");
    }

    listEl.innerHTML = html;

    listEl.querySelectorAll(".auth-user-card").forEach((card) => {
      card.addEventListener("click", () => {
        selectUserForAuth({
          id: card.dataset.id,
          name: card.dataset.name,
          role: card.dataset.role
        });
      });
    });
  }

  function selectUserForAuth(user) {
    selectedUserForAuth = user;
    currentPinInput = "";
    updatePinDots();

    const picker = $("auth-step-user-picker");
    const pinPad = $("auth-step-pin-pad");
    if (picker) picker.classList.add("hidden");
    if (pinPad) pinPad.classList.remove("hidden");

    const isRoot = user.role === "root" || user.id === "root";
    const nameEl = $("auth-pin-selected-name");
    const roleEl = $("auth-pin-selected-role");
    const avatarEl = $("auth-pin-selected-avatar");

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) {
      roleEl.textContent = isRoot ? "Root Admin" : "Nhân viên";
      roleEl.className = isRoot
        ? "text-[10px] text-pine-950 bg-amber-400 font-bold px-2 py-0.5 rounded-full font-mono"
        : "text-[10px] text-pine-200 bg-white/10 px-2 py-0.5 rounded-full font-mono";
    }
    if (avatarEl) {
      avatarEl.textContent = isRoot ? "👑" : (user.name ? user.name.trim().charAt(0).toUpperCase() : "👤");
      avatarEl.className = isRoot
        ? "h-14 w-14 rounded-2xl bg-amber-400 text-pine-950 font-bold text-2xl flex items-center justify-center shadow-lg ring-2 ring-amber-300"
        : "h-14 w-14 rounded-2xl bg-white/20 text-white font-bold text-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20";
    }

    const errorEl = $("auth-pin-error");
    if (errorEl) errorEl.classList.add("hidden");
  }

  function backToUserPicker() {
    selectedUserForAuth = null;
    currentPinInput = "";
    updatePinDots();

    const picker = $("auth-step-user-picker");
    const pinPad = $("auth-step-pin-pad");
    if (picker) picker.classList.remove("hidden");
    if (pinPad) pinPad.classList.add("hidden");

    const errorEl = $("auth-pin-error");
    if (errorEl) errorEl.classList.add("hidden");

    renderAuthUserPicker();
  }

  function showAuthScreen() {
    const screen = $("staff-auth-screen");
    if (!screen) return;
    screen.classList.remove("hidden");
    backToUserPicker();
    syncStaffList().then(() => renderAuthUserPicker()).catch(() => {});
  }

  function hideAuthScreen() {
    const screen = $("staff-auth-screen");
    if (!screen) return;
    screen.classList.add("hidden");
    selectedUserForAuth = null;
    currentPinInput = "";
  }

  function updateUserUI() {
    const user = getCurrentUser();
    if (!user) return;

    const headerName = $("header-user-name");
    const headerIcon = $("header-user-icon");
    const headerChip = $("header-user-chip");
    const sidebarName = $("sidebar-user-name");
    const sidebarRole = $("sidebar-user-role");
    const sidebarAvatar = $("sidebar-user-avatar");
    const sidebarBtnManage = $("sidebar-btn-manage-staff");

    const isRoot = isRootUser();

    if (headerName) headerName.textContent = isRoot ? "Root Admin" : user.name;
    if (headerIcon) headerIcon.textContent = isRoot ? "👑" : "👤";
    if (headerChip) {
      if (isRoot) {
        headerChip.classList.add("bg-amber-500/25", "border-amber-400/30", "text-amber-200");
      } else {
        headerChip.classList.remove("bg-amber-500/25", "border-amber-400/30", "text-amber-200");
      }
    }

    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarRole) {
      sidebarRole.textContent = isRoot ? "Root Admin" : "Nhân viên";
      if (isRoot) {
        sidebarRole.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400 text-pine-950 font-mono";
      } else {
        sidebarRole.className = "text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/15 text-pine-200";
      }
    }
    if (sidebarAvatar) {
      sidebarAvatar.textContent = isRoot ? "👑" : (user.name ? user.name.charAt(0).toUpperCase() : "👤");
    }

    // Nút Quản lý nhân viên chỉ hiển thị đối với Root
    if (sidebarBtnManage) {
      sidebarBtnManage.classList.toggle("hidden", !isRoot);
    }

    // Cập nhật nhãn và trạng thái nút Khóa ngày theo vai trò
    const sidebarLockTitle = $("sidebar-lock-title");
    const sidebarLockBadge = $("sidebar-lock-badge");
    const btnOpenLockDate = $("btn-open-lock-date-modal");

    if (sidebarLockTitle) {
      sidebarLockTitle.textContent = isRoot ? "Khóa Ngày Sổ Sách" : "Xem Ngày Khóa Sổ";
    }
    if (sidebarLockBadge) {
      if (isRoot) {
        sidebarLockBadge.textContent = "Root 🔒";
        sidebarLockBadge.className = "text-[10px] text-amber-300 font-mono";
      } else {
        sidebarLockBadge.textContent = "Chỉ xem 🔒";
        sidebarLockBadge.className = "text-[10px] text-white/50 font-mono";
      }
    }
    if (btnOpenLockDate) {
      btnOpenLockDate.title = isRoot
        ? "Cài đặt khóa ngày sổ sách (Quyền Root)"
        : "Xem thông tin ngày khóa sổ sách";
    }
  }

  let isAuthenticating = false;

  async function trySubmitPin() {
    if (isAuthenticating) return;
    if (!selectedUserForAuth) {
      toast("Vui lòng chọn tài khoản.", "error");
      backToUserPicker();
      return;
    }

    if (!currentPinInput || currentPinInput.length < 4) {
      const errorEl = $("auth-pin-error");
      if (errorEl) {
        $("auth-pin-error-text").textContent = "Vui lòng nhập ít nhất 4 chữ số.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    isAuthenticating = true;
    const btnSubmit = $("btn-auth-submit");
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="inline-block animate-spin mr-1">⟳</span> Đang kiểm tra…`;
    }

    try {
      const res = await authenticateUserPin(selectedUserForAuth, currentPinInput);
      if (res.success) {
        hideAuthScreen();
        updateUserUI();
        toast("Xin chào " + (res.user ? res.user.name : "bạn") + "!", "success");
        initAppData();
      } else {
        const dotsContainer = $("auth-pin-dots-container");
        if (dotsContainer) {
          dotsContainer.classList.add("animate-auth-shake");
          setTimeout(() => dotsContainer.classList.remove("animate-auth-shake"), 500);
        }
        const errorEl = $("auth-pin-error");
        if (errorEl) {
          $("auth-pin-error-text").textContent = res.message || "Mã PIN không chính xác! Vui lòng thử lại.";
          errorEl.classList.remove("hidden");
        }
        setTimeout(() => {
          currentPinInput = "";
          updatePinDots();
        }, 600);
      }
    } catch (err) {
      toast("Lỗi xác thực: " + err.message, "error");
    } finally {
      isAuthenticating = false;
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Xác Nhận Đăng Nhập</span> <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>`;
      }
    }
  }

  function handlePinKey(key) {
    const errorEl = $("auth-pin-error");
    if (errorEl) errorEl.classList.add("hidden");

    if (key === "clear") {
      currentPinInput = "";
      updatePinDots();
      return;
    }

    if (key === "backspace") {
      currentPinInput = currentPinInput.slice(0, -1);
      updatePinDots();
      return;
    }

    if (/^[0-9]$/.test(key)) {
      if (currentPinInput.length < 8) {
        currentPinInput += key;
        updatePinDots();
      }

      // Tự động kiểm tra nếu là Root 6 số hoặc đạt 6 số
      if (currentPinInput.length === 6 && selectedUserForAuth && selectedUserForAuth.role === "root") {
        trySubmitPin();
      }
    }
  }

  // Nút Quay Lại Chọn Người Khác
  $("btn-auth-back-to-picker")?.addEventListener("click", backToUserPicker);

  // Nút Tải Lại Danh Sách Nhân Viên
  $("btn-auth-refresh-staff")?.addEventListener("click", async () => {
    const btn = $("btn-auth-refresh-staff");
    if (btn) btn.innerHTML = `<span class="inline-block animate-spin mr-1">⟳</span> Đang tải…`;
    try {
      await syncStaffList();
      renderAuthUserPicker();
      toast("Đã làm mới danh sách nhân viên!", "success");
    } catch (e) {
      toast("Không tải được danh sách nhân viên.", "error");
    } finally {
      if (btn) btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span>Tải lại danh sách nhân viên</span>`;
    }
  });

  // Nút Xác Nhận Đăng Nhập
  $("btn-auth-submit")?.addEventListener("click", trySubmitPin);

  // Gắn sự kiện bàn phím số ảo PIN Pad
  document.querySelectorAll(".pin-key").forEach((btn) => {
    btn.addEventListener("click", () => {
      handlePinKey(btn.dataset.key);
    });
  });

  // Bàn phím vật lý trên máy tính
  document.addEventListener("keydown", (e) => {
    const screen = $("staff-auth-screen");
    if (!screen || screen.classList.contains("hidden")) return;
    if (e.key >= "0" && e.key <= "9") {
      handlePinKey(e.key);
    } else if (e.key === "Backspace") {
      handlePinKey("backspace");
    } else if (e.key === "Escape") {
      handlePinKey("clear");
    } else if (e.key === "Enter") {
      trySubmitPin();
    }
  });

  // Sidebar Drawer Events (Menu Bên Trái)
  $("btn-open-sidebar")?.addEventListener("click", openSidebar);
  $("btn-close-sidebar")?.addEventListener("click", closeSidebar);
  $("sidebar-drawer-backdrop")?.addEventListener("click", closeSidebar);
  $("header-user-chip")?.addEventListener("click", openSidebar);

  $("sidebar-btn-xuat")?.addEventListener("click", () => {
    switchTab("xuat");
    closeSidebar();
  });
  $("sidebar-btn-chiet")?.addEventListener("click", () => {
    switchTab("chiet");
    closeSidebar();
  });
  $("sidebar-btn-change-pin")?.addEventListener("click", () => {
    closeSidebar();
    openSelfChangePinModal();
  });
  $("sidebar-btn-manage-staff")?.addEventListener("click", () => {
    closeSidebar();
    openStaffManageModal();
  });
  $("sidebar-btn-lock-date")?.addEventListener("click", () => {
    closeSidebar();
    $("btn-open-lock-date-modal")?.click();
  });
  $("sidebar-btn-logout")?.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất hoặc đổi tài khoản khác?")) {
      clearSession();
      closeSidebar();
      showAuthScreen();
      toast("Đã đăng xuất tài khoản", "info");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  // Khởi tạo các modal nhân viên
  initStaffModals();

  // Nạp danh sách nhân viên ngầm từ Sheets
  syncStaffList().catch(() => {});

  // Kiểm tra phiên đăng nhập
  if (!isAuthenticated()) {
    showAuthScreen();
    hideSplash();
  } else {
    hideAuthScreen();
    updateUserUI();
    initAppData();
  }

  // Đăng ký Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  }

  // Pull-to-refresh
  initPullToRefresh();
});
