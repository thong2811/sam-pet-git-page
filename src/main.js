// ============================================================
// Điểm khởi động chính của ứng dụng SAM Pet (Main Entrypoint)
// ============================================================
import "./style.css";
import { $ } from "./utils/dom.js";
import { escapeHtml } from "./utils/formatters.js";
import { toast } from "./utils/toast.js";
import { state } from "./state/app-state.js";
import { loadProductsData } from "./services/api.js";
import { CONFIG } from "./config.js";
import { isAuthenticated, verifyAndSaveSession, clearSession } from "./utils/auth.js";

// Common modals
import { initLockDateModal, fetchLockDate } from "./views/common/lock-date-modal.js";
import { initEditRowModal } from "./views/common/edit-row-modal.js";

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
  let currentPinInput = "";
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

  function showAuthScreen() {
    const screen = $("staff-auth-screen");
    if (!screen) return;
    screen.classList.remove("hidden");
    currentPinInput = "";
    updatePinDots();
    const errorEl = $("auth-pin-error");
    if (errorEl) errorEl.classList.add("hidden");
  }

  function hideAuthScreen() {
    const screen = $("staff-auth-screen");
    if (!screen) return;
    screen.classList.add("hidden");
    currentPinInput = "";
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
      const targetLen = String(CONFIG.STAFF_PIN || "110899").trim().length;
      if (currentPinInput.length < targetLen) {
        currentPinInput += key;
        updatePinDots();
      }

      if (currentPinInput.length === targetLen) {
        const isValid = verifyAndSaveSession(currentPinInput);
        if (isValid) {
          hideAuthScreen();
          toast("Xác thực thành công! Chào mừng bạn.", "success");
          initAppData();
        } else {
          const dotsContainer = $("auth-pin-dots-container");
          if (dotsContainer) {
            dotsContainer.classList.add("animate-auth-shake");
            setTimeout(() => dotsContainer.classList.remove("animate-auth-shake"), 500);
          }
          if (errorEl) {
            $("auth-pin-error-text").textContent = "Mã PIN không chính xác! Vui lòng thử lại.";
            errorEl.classList.remove("hidden");
          }
          setTimeout(() => {
            currentPinInput = "";
            updatePinDots();
          }, 600);
        }
      }
    }
  }

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
    }
  });

  // Sidebar Drawer Events (Menu Bên Trái)
  $("btn-open-sidebar")?.addEventListener("click", openSidebar);
  $("btn-close-sidebar")?.addEventListener("click", closeSidebar);
  $("sidebar-drawer-backdrop")?.addEventListener("click", closeSidebar);
  $("sidebar-btn-xuat")?.addEventListener("click", () => {
    switchTab("xuat");
    closeSidebar();
  });
  $("sidebar-btn-chiet")?.addEventListener("click", () => {
    switchTab("chiet");
    closeSidebar();
  });
  $("sidebar-btn-lock-date")?.addEventListener("click", () => {
    closeSidebar();
    $("btn-open-lock-date-modal")?.click();
  });
  $("sidebar-btn-logout")?.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất và khóa ứng dụng trên thiết bị này?")) {
      clearSession();
      closeSidebar();
      showAuthScreen();
      toast("Đã khóa màn hình nhân viên", "info");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  // Kiểm tra phiên đăng nhập 7 ngày
  if (!isAuthenticated()) {
    showAuthScreen();
    hideSplash();
  } else {
    hideAuthScreen();
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
