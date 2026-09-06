// ============================================================
// Logic Trang Khách Hàng — SamPet Grooming Lookbook
// Tối giản, tập trung vào: Ảnh mẫu đẹp + Nhắn Zalo 1 chạm
// ============================================================
import "./style.css";
import { CONFIG } from "./config.js";
import { $, $$ } from "./utils/dom.js";
import { escapeHtml } from "./utils/formatters.js";
import { GROOMING_CATEGORIES, GROOMING_STYLES } from "./data/grooming-styles.js";

let currentCategory = "all";
let activeStyleForLightbox = null;

function init() {
  renderStoreInfo();
  renderCategories();
  renderStyles();
  setupEventListeners();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function renderStoreInfo() {
  const storeNameEls = $$(".store-name-text");
  storeNameEls.forEach((el) => {
    el.textContent = CONFIG.STORE_NAME || "Sam Pet - Dịch Vụ Thú Cưng";
  });

  const addressEls = $$(".store-address-text");
  addressEls.forEach((el) => {
    el.textContent = CONFIG.STORE_ADDRESS || CONFIG.ADDRESS || "";
  });

  const hotlineEls = $$(".store-hotline-link");
  hotlineEls.forEach((el) => {
    el.href = `tel:${CONFIG.HOTLINE}`;
    const textEl = el.querySelector(".hotline-number");
    if (textEl) textEl.textContent = CONFIG.HOTLINE;
  });

  const zaloEls = $$(".store-zalo-link");
  const zaloUrl = getZaloUrl();
  zaloEls.forEach((el) => {
    el.href = zaloUrl;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });
}

export function getZaloUrl() {
  const raw = String(CONFIG.ZALO_PHONE || "0901234567").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const cleanPhone = raw.replace(/\D/g, "") || "0901234567";
  return `https://zalo.me/${cleanPhone}`;
}

// 1. Render bộ lọc tab
function renderCategories() {
  const container = $("category-filters");
  if (!container) return;

  container.innerHTML = GROOMING_CATEGORIES.map((cat) => {
    const isActive = cat.id === currentCategory;
    return `
      <button type="button" data-category="${escapeHtml(cat.id)}"
        class="category-btn px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95 ${
          isActive
            ? "bg-gradient-to-r from-[#013755] to-[#1c7ab6] text-white shadow-md shadow-[#013755]/25 ring-2 ring-[#55b2e3]/50"
            : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/60"
        }">
        ${escapeHtml(cat.label)}
      </button>
    `;
  }).join("");
}

// 2. Render lưới mẫu Lookbook
function renderStyles() {
  const grid = $("styles-grid");
  if (!grid) return;

  const filtered = currentCategory === "all"
    ? GROOMING_STYLES
    : GROOMING_STYLES.filter((s) => s.category === currentCategory);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <p class="text-sm">Hiện chưa có mẫu nào trong danh mục này.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((style, idx) => `
    <article class="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in-up" style="animation-delay: ${idx * 40}ms">
      <!-- Ảnh Mẫu Thời Trang (Tỉ lệ 4:3 trên mobile vừa vặn màn hình, 4:5 trên desktop) -->
      <div class="relative overflow-hidden aspect-[4/3] sm:aspect-[4/5] bg-slate-100 cursor-pointer"
        data-action="view-image" data-id="${escapeHtml(style.id)}" data-src="${escapeHtml(style.image)}" data-title="${escapeHtml(style.name)}" data-price="${escapeHtml(style.price)}">
        <img src="${escapeHtml(style.image)}" alt="${escapeHtml(style.name)}" loading="lazy"
          class="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" />
        
        <!-- Gradient che nhẹ ở đáy ảnh -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 opacity-75 group-hover:opacity-90 transition-opacity"></div>

        <!-- Badge Phong Cách -->
        <span class="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] sm:text-[11px] font-extrabold text-[#013755] shadow-md border border-white/40">
          ${escapeHtml(style.badge)}
        </span>

        <!-- Nhãn Giá Nổi Trực Tiếp Trên Ảnh -->
        <div class="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 flex items-end justify-between text-white">
          <div>
            <div class="text-[9px] sm:text-[10px] uppercase font-semibold text-white/80">Giá tham khảo</div>
            <div class="text-base sm:text-lg font-black tracking-tight drop-shadow-md text-amber-300">${escapeHtml(style.price)}</div>
          </div>
          <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/20 backdrop-blur-md rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold text-white shadow-xs">
            ⏱️ ${escapeHtml(style.duration)}
          </span>
        </div>
      </div>

      <!-- Thông tin & Nút Zalo Trực Tiếp -->
      <div class="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div>
          <h3 class="text-sm sm:text-base font-bold text-slate-800 group-hover:text-[#1c7ab6] transition-colors leading-snug mb-1">
            ${escapeHtml(style.name)}
          </h3>
          <p class="text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">
            ${escapeHtml(style.description)}
          </p>
        </div>

        <!-- Nút Nhắn Zalo Đặt Mẫu Này (Chuẩn chạm 44px) -->
        <a href="${getZaloUrl()}"
          target="_blank" rel="noopener noreferrer"
          class="w-full min-h-[44px] py-2.5 sm:py-3 px-3.5 sm:px-4 bg-gradient-to-r from-[#013755] to-[#1c7ab6] hover:from-[#002135] hover:to-[#146193] text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-[#013755]/20 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn">
          <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.19.72 4.22 1.94 5.86L2.6 21.4c-.2.6.35 1.15.95.95l3.54-1.34C8.75 21.6 10.33 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.52 0-2.95-.38-4.2-1.04l-.3-.16-2.48.94.94-2.48-.16-.3C5.14 15.71 4.76 14.28 4.76 12c0-3.99 3.25-7.24 7.24-7.24s7.24 3.25 7.24 7.24-3.25 7.24-7.24 7.24z"/>
          </svg>
          <span>Nhắn Zalo Mẫu Này</span>
          <svg class="w-3.5 h-3.5 opacity-70 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </article>
  `).join("");
}

// 3. Phóng to ảnh Lightbox
function openLightbox(src, title, price) {
  const modal = $("lightbox-modal");
  const img = $("lightbox-image");
  const caption = $("lightbox-caption");
  const priceEl = $("lightbox-price");
  const zaloBtn = $("lightbox-zalo-btn");
  if (!modal || !img) return;

  img.src = src;
  if (caption) caption.textContent = title || "";
  if (priceEl) priceEl.textContent = price || "";
  if (zaloBtn) {
    zaloBtn.href = getZaloUrl();
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeLightbox() {
  const modal = $("lightbox-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function setupEventListeners() {
  // Bấm tab lọc
  document.addEventListener("click", (e) => {
    const catBtn = e.target.closest("[data-category]");
    if (catBtn) {
      currentCategory = catBtn.dataset.category;
      renderCategories();
      renderStyles();
      return;
    }

    // Bấm xem ảnh lớn
    const viewImgBtn = e.target.closest("[data-action='view-image']");
    if (viewImgBtn) {
      openLightbox(
        viewImgBtn.dataset.src,
        viewImgBtn.dataset.title,
        viewImgBtn.dataset.price
      );
      return;
    }
  });

  // Đóng lightbox
  $("btn-close-lightbox")?.addEventListener("click", closeLightbox);
  $("lightbox-modal")?.addEventListener("click", (e) => {
    if (e.target === $("lightbox-modal") || e.target.closest("#btn-close-lightbox")) {
      closeLightbox();
    }
  });

  // ESC để đóng lightbox
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}
