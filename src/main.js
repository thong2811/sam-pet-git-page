// ============================================================
// Điểm khởi động chính của ứng dụng SAM Pet (Main Entrypoint)
// ============================================================
import "./style.css";
import { $ } from "./utils/dom.js";
import { escapeHtml } from "./utils/formatters.js";
import { toast } from "./utils/toast.js";
import { state } from "./state/app-state.js";
import { loadProductsData } from "./services/api.js";

// Common modals
import { initLockDateModal, fetchLockDate } from "./views/common/lock-date-modal.js";
import { initEditRowModal } from "./views/common/edit-row-modal.js";

// Xuất Hàng views
import { initProductsView, renderProductHead, renderProducts } from "./views/xuat-hang/products-view.js";
import { initPhieuView, renderPhieu } from "./views/xuat-hang/phieu-view.js";
import { initExportModal } from "./views/xuat-hang/export-modal.js";
import { initHistoryView, loadSheetHistory } from "./views/xuat-hang/history-view.js";

// Chiết Hàng views
import { initRepackageForm, renderRepackageTargets } from "./views/chiet-hang/repackage-form.js";
import { initRepackageHistory, loadRepackageHistory } from "./views/chiet-hang/repackage-history.js";

export function hideSplash() {
  const splash = $("splash");
  if (splash) splash.classList.add("hidden");
}

export function setStatus(text, tone) {
  const chip = $("status-chip");
  if (!chip) return;
  const dot = tone === "ok"
    ? "bg-emerald-400"
    : tone === "err"
      ? "bg-red-400"
      : "bg-amber-300 animate-pulse";
  chip.innerHTML = `<span class="h-2 w-2 rounded-full ${dot}"></span>${escapeHtml(text)}`;
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

  if (tabXuat) tabXuat.classList.toggle("hidden", !isXuat);
  if (tabChiet) tabChiet.classList.toggle("hidden", isXuat);

  if (isXuat) {
    if (btnXuat) btnXuat.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all bg-white text-pine-900 shadow-sm";
    if (btnChiet) btnChiet.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-white/80 hover:text-white";
    if (headerTitle) headerTitle.textContent = "Phiếu xuất hàng hàng ngày";
    if (badgeChip) badgeChip.textContent = `Phiếu: ${state.phieu.length} dòng`;
  } else {
    if (btnChiet) btnChiet.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all bg-white text-pine-900 shadow-sm";
    if (btnXuat) btnXuat.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-white/80 hover:text-white";
    if (headerTitle) headerTitle.textContent = "Chiết hàng & Đóng gói sản phẩm";
    if (badgeChip) badgeChip.textContent = `Đích: ${state.repackage.targets.length} SP`;
    renderRepackageTargets();
  }
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

  // Nạp dữ liệu
  renderPhieu();
  fetchLockDate();
  loadProducts();
  loadSheetHistory();
  loadRepackageHistory();

  // Đăng ký Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .catch((err) => console.warn("SW registration failed:", err));
  }

  // Pull-to-refresh
  initPullToRefresh();
});
