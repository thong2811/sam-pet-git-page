// ============================================================
// DOM Utilities & Helpers
// ============================================================

export const $ = (id) => document.getElementById(id);

export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

export function on(element, event, handler, options) {
  if (!element) return;
  element.addEventListener(event, handler, options);
}

export function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Hiển thị trạng thái loading spinner chuyên nghiệp cho nút bấm
 * Tự động ghi nhớ và khôi phục nội dung HTML ban đầu khi kết thúc
 */
export function setButtonLoading(button, isLoading, loadingText = "Đang xử lý…") {
  if (!button) return;
  if (isLoading) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add("opacity-80", "cursor-not-allowed");
    button.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>${loadingText}</span>
    `;
  } else {
    button.disabled = false;
    button.classList.remove("opacity-80", "cursor-not-allowed");
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

/**
 * Hiển thị Overlay toàn màn hình chặn mọi thao tác chuột / phím khi đang thêm/sửa/xóa dữ liệu
 */
export function showLoadingOverlay(title = "Đang xử lý dữ liệu…", subtitle = "Vui lòng chờ trong giây lát và không thao tác") {
  let overlay = $("global-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "global-loading-overlay";
    overlay.className = "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-xs transition-all duration-200 select-none p-4";
    overlay.innerHTML = `
      <div class="bg-white/95 backdrop-blur-md text-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white/50 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        <div class="relative flex items-center justify-center mb-4">
          <div class="w-14 h-14 rounded-full border-4 border-pine-100 border-t-pine-800 animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center text-pine-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
        <h3 id="global-loading-title" class="text-base font-bold text-slate-800 mb-1"></h3>
        <p id="global-loading-subtitle" class="text-xs text-slate-500 font-medium"></p>
        <div class="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-pine-50 border border-pine-100 text-[11px] text-pine-800 font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Đang đồng bộ Google Sheets</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const titleEl = overlay.querySelector("#global-loading-title");
  const subEl = overlay.querySelector("#global-loading-subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;

  overlay.classList.remove("hidden");
  overlay.style.display = "flex";
}

/**
 * Ẩn Overlay toàn màn hình khi xử lý xong
 */
export function hideLoadingOverlay() {
  const overlay = $("global-loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.style.display = "none";
  }
}


