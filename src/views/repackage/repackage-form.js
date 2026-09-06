// ============================================================
// View Lập Phiếu Chiết Hàng (1 Nguồn -> Nhiều Đích)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { escapeHtml } from "../../utils/formatters.js";
import { state, genLineId, getField } from "../../state/app-state.js";
import { findProductByMa, filterProducts } from "../export/products-view.js";
import { openRepackageModal, initRepackageModal } from "./repackage-modal.js";

export function renderRepackageSourceDropdown(query = "") {
  const dropdown = $("repackage-src-dropdown");
  if (!dropdown) return;
  const matched = filterProducts(query, 30);

  if (!matched.length) {
    dropdown.innerHTML = `<div class="p-3 text-center text-xs text-slate-400">Không tìm thấy sản phẩm phù hợp.</div>`;
    dropdown.classList.remove("hidden");
    return;
  }

  dropdown.innerHTML = matched.map((p) => {
    const ma = getField(p, "maSP");
    const ten = getField(p, "tenSP");
    const dv = getField(p, "donVi") || "—";
    const isSelected = ma === state.repackage.sourceId;

    return `
      <div data-action="select-src-product" data-masp="${escapeHtml(ma)}"
        class="px-3.5 py-2.5 hover:bg-pine-50 cursor-pointer flex items-center justify-between gap-2 transition-colors ${isSelected ? 'bg-pine-100/70 font-medium' : ''}">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink truncate">${escapeHtml(ten)}</p>
          <p class="text-xs text-slate-500 mt-0.5">Đơn vị: <span class="font-sans font-medium text-slate-700">${escapeHtml(dv)}</span></p>
        </div>
      </div>`;
  }).join("");

  dropdown.classList.remove("hidden");
}

export function selectRepackageSourceProduct(maSP) {
  const p = findProductByMa(maSP);
  if (!p) return;

  state.repackage.sourceId = maSP;
  const ten = getField(p, "tenSP");
  const dv = getField(p, "donVi") || "—";

  if ($("repackage-src-search")) $("repackage-src-search").value = ten;
  if ($("repackage-src-dropdown")) $("repackage-src-dropdown").classList.add("hidden");

  if ($("repackage-src-name")) $("repackage-src-name").textContent = ten;
  if ($("repackage-src-unit")) $("repackage-src-unit").textContent = dv;

  if ($("repackage-src-search-wrap")) $("repackage-src-search-wrap").classList.add("hidden");
  if ($("repackage-src-selected-wrap")) $("repackage-src-selected-wrap").classList.remove("hidden");

  updateRepackageSummary();
}

export function clearRepackageSource(shouldFocus = false) {
  state.repackage.sourceId = "";
  if ($("repackage-src-search")) $("repackage-src-search").value = "";
  if ($("repackage-src-dropdown")) $("repackage-src-dropdown").classList.add("hidden");

  if ($("repackage-src-selected-wrap")) $("repackage-src-selected-wrap").classList.add("hidden");
  if ($("repackage-src-search-wrap")) $("repackage-src-search-wrap").classList.remove("hidden");

  if (shouldFocus && $("repackage-src-search")) {
    setTimeout(() => {
      $("repackage-src-search").focus();
      renderRepackageSourceDropdown("");
    }, 50);
  }

  updateRepackageSummary();
}

export function addRepackageTargetRow() {
  const newTarget = {
    id: genLineId(),
    productId: "",
    quantity: 1,
    note: ""
  };
  state.repackage.targets.push(newTarget);
  renderRepackageTargets();
}

export function removeRepackageTargetRow(id) {
  state.repackage.targets = state.repackage.targets.filter((t) => t.id !== id);
  renderRepackageTargets();
}

export function updateRepackageTargetField(id, field, value) {
  const row = state.repackage.targets.find((t) => t.id === id);
  if (!row) return;
  if (field === "productId") {
    row.productId = value;
  } else if (field === "quantity") {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      toast("Số lượng đích phải lớn hơn 0.", "warning");
      return;
    }
    row.quantity = n;
  } else if (field === "note") {
    row.note = value;
  }
  updateRepackageSummary();
}

export function renderRepackageTargets() {
  const targets = state.repackage.targets;
  const isEmpty = targets.length === 0;
  if ($("repackage-targets-empty")) $("repackage-targets-empty").classList.toggle("hidden", !isEmpty);
  if ($("repackage-target-count-badge")) $("repackage-target-count-badge").textContent = targets.length;

  if (state.activeTab === "chiet" && $("badge-chip")) {
    $("badge-chip").textContent = `Đích: ${targets.length} SP`;
  }

  const tbody = $("repackage-targets-body");
  if (tbody) {
    tbody.innerHTML = targets.map((t, idx) => {
      const p = findProductByMa(t.productId);
      const name = p ? getField(p, "tenSP") : "";
      const unit = p ? getField(p, "donVi") : "—";
      const isSelected = !!t.productId;

      const targetSelectUI = isSelected
        ? `
          <div class="flex items-center justify-between gap-2 p-2 px-3 bg-emerald-50/80 border-2 border-emerald-400/80 rounded-xl">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              <div class="min-w-0">
                <p class="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider leading-none">Đã chọn SP đích</p>
                <p class="text-sm font-bold text-emerald-950 truncate mt-0.5" title="${escapeHtml(name)}">${escapeHtml(name)}</p>
              </div>
            </div>
            <button type="button" data-action="target-clear-product" data-targetid="${escapeHtml(t.id)}"
              class="text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors shadow-xs">
              Đổi SP
            </button>
          </div>`
        : `
          <div class="relative">
            <input type="search" autocomplete="off" data-action="target-search" data-targetid="${escapeHtml(t.id)}"
              placeholder="🔍 Gõ tên hoặc mã SP đích để chọn…"
              class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500 font-medium text-ink" />
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
            <div data-dropdown-for="${escapeHtml(t.id)}" class="hidden absolute z-[100] left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto scroll-thin bg-white rounded-xl shadow-2xl border border-slate-300 divide-y divide-slate-100 min-w-[320px]">
            </div>
          </div>`;

      return `
      <tr data-targetid="${escapeHtml(t.id)}" class="relative ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}">
        <td class="px-3 py-2.5 text-center text-xs text-slate-400 font-medium">${idx + 1}</td>
        <td class="px-3 py-2.5">${targetSelectUI}</td>
        <td class="px-3 py-2.5 text-slate-600 text-sm font-medium text-center" data-field="unit-label">${escapeHtml(unit)}</td>
        <td class="px-3 py-2.5">
          <div class="flex items-center justify-center gap-1">
            <button type="button" data-action="target-qty-dec" data-targetid="${escapeHtml(t.id)}"
              class="w-8 h-8 shrink-0 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-base flex items-center justify-center select-none shadow-xs">−</button>
            <input type="number" min="0.01" step="any" value="${escapeHtml(String(t.quantity))}" data-action="target-qty" data-targetid="${escapeHtml(t.id)}"
              class="w-16 rounded-lg border border-slate-200 bg-white px-1 py-1.5 text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-pine-500" />
            <button type="button" data-action="target-qty-inc" data-targetid="${escapeHtml(t.id)}"
              class="w-8 h-8 shrink-0 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-base flex items-center justify-center select-none shadow-xs">+</button>
          </div>
        </td>
        <td class="px-3 py-2.5">
          <input type="text" maxlength="200" value="${escapeHtml(t.note || "")}" data-action="target-note" data-targetid="${escapeHtml(t.id)}" placeholder="Ghi chú chiết…"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500" />
        </td>
        <td class="px-3 py-2.5 text-right">
          <button type="button" data-action="target-delete" data-targetid="${escapeHtml(t.id)}" class="rounded-lg p-2 text-red-600 hover:bg-red-50 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </td>
      </tr>`;
    }).join("");
  }

  const cardsEl = $("repackage-targets-cards");
  if (cardsEl) {
    cardsEl.innerHTML = targets.map((t, idx) => {
      const p = findProductByMa(t.productId);
      const name = p ? getField(p, "tenSP") : "";
      const unit = p ? getField(p, "donVi") : "—";
      const isSelected = !!t.productId;

      const targetSelectUI = isSelected
        ? `
          <div class="flex items-center justify-between gap-2 p-2.5 bg-emerald-50/80 border-2 border-emerald-400/80 rounded-xl">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              <div class="min-w-0">
                <p class="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider leading-none">Đã chọn SP đích</p>
                <p class="text-sm font-bold text-emerald-950 truncate mt-0.5">${escapeHtml(name)}</p>
              </div>
            </div>
            <button type="button" data-action="target-clear-product" data-targetid="${escapeHtml(t.id)}"
              class="text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg font-medium shrink-0 shadow-xs">
              Đổi SP
            </button>
          </div>`
        : `
          <div class="relative">
            <input type="search" autocomplete="off" data-action="target-search" data-targetid="${escapeHtml(t.id)}"
              placeholder="🔍 Gõ tên hoặc mã SP đích để chọn…"
              class="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500 font-medium" />
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
            <div data-dropdown-for="${escapeHtml(t.id)}" class="hidden absolute z-[100] left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto scroll-thin bg-white rounded-xl shadow-2xl border border-slate-300 divide-y divide-slate-100">
            </div>
          </div>`;

      return `
      <div data-targetid="${escapeHtml(t.id)}" class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3 relative">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-pine-800 bg-pine-100 px-2.5 py-0.5 rounded-md">Đích #${idx + 1}</span>
          <button type="button" data-action="target-delete" data-targetid="${escapeHtml(t.id)}" class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-md border border-red-100">Xóa</button>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Sản phẩm đích</label>
          ${targetSelectUI}
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1 font-medium">Số lượng nhận</label>
            <div class="flex items-center gap-1.5">
              <button type="button" data-action="target-qty-dec" data-targetid="${escapeHtml(t.id)}"
                class="w-10 h-10 shrink-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center select-none shadow-xs">−</button>
              <input type="number" min="0.01" step="any" value="${escapeHtml(String(t.quantity))}" data-action="target-qty" data-targetid="${escapeHtml(t.id)}"
                class="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-pine-500" />
              <button type="button" data-action="target-qty-inc" data-targetid="${escapeHtml(t.id)}"
                class="w-10 h-10 shrink-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center select-none shadow-xs">+</button>
            </div>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1 font-medium">Đơn vị tính</label>
            <input readonly value="${escapeHtml(unit)}" data-field="unit-input" class="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600 font-medium" />
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Ghi chú</label>
          <input type="text" maxlength="200" value="${escapeHtml(t.note || "")}" data-action="target-note" data-targetid="${escapeHtml(t.id)}" placeholder="Ghi chú chiết…"
            class="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500" />
        </div>
      </div>`;
    }).join("");
  }

  updateRepackageSummary();
}

export function showTargetSearchDropdown(targetId, query = "") {
  const dropdowns = Array.from(document.querySelectorAll(`[data-dropdown-for="${targetId}"]`));
  if (!dropdowns.length) return;

  document.querySelectorAll("[data-dropdown-for]").forEach((el) => {
    if (!dropdowns.includes(el)) el.classList.add("hidden");
  });
  document.querySelectorAll("#repackage-targets-body tr, #repackage-targets-cards > div").forEach((el) => {
    el.classList.remove("z-50");
  });

  dropdowns.forEach((dd) => {
    const parentContainer = dd.closest("tr, [data-targetid]");
    if (parentContainer) parentContainer.classList.add("z-50");
  });

  const matched = filterProducts(query, 30);
  const htmlContent = !matched.length
    ? `<div class="p-3 text-center text-xs text-slate-400">Không tìm thấy sản phẩm phù hợp.</div>`
    : matched.map((p) => {
        const ma = getField(p, "maSP");
        const ten = getField(p, "tenSP");
        const dv = getField(p, "donVi") || "—";

        return `
          <div data-action="select-target-product" data-targetid="${escapeHtml(targetId)}" data-masp="${escapeHtml(ma)}"
            class="px-3.5 py-2.5 hover:bg-pine-50 cursor-pointer flex items-center justify-between gap-2 transition-colors">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-ink truncate">${escapeHtml(ten)}</p>
              <p class="text-xs text-slate-500 mt-0.5">Đơn vị: <span class="font-sans font-medium text-slate-700">${escapeHtml(dv)}</span></p>
            </div>
          </div>`;
      }).join("");

  dropdowns.forEach((dd) => {
    dd.innerHTML = htmlContent;
    dd.classList.remove("hidden");
  });
}

export function selectRepackageTargetProduct(targetId, maSP) {
  const p = findProductByMa(maSP);
  const row = state.repackage.targets.find((t) => t.id === targetId);
  if (!row || !p) return;

  row.productId = maSP;
  renderRepackageTargets();
}

export function updateRepackageSummary() {
  const srcId = state.repackage.sourceId;
  const srcQtyInput = $("repackage-source-qty");
  const srcQty = Number(srcQtyInput ? srcQtyInput.value : 1) || 1;
  const srcProduct = findProductByMa(srcId);
  const targets = state.repackage.targets;
  const validTargets = targets.filter((t) => t.productId && Number(t.quantity) > 0);

  const summaryText = $("repackage-summary-text");
  if (!summaryText) return;

  if (!srcProduct) {
    summaryText.textContent = "Vui lòng chọn sản phẩm nguồn.";
    return;
  }

  const srcText = `-${srcQty} ${getField(srcProduct, "donVi") || ""} ${getField(srcProduct, "tenSP")}`;
  if (!validTargets.length) {
    summaryText.textContent = `Nguồn: ${srcText} ➔ Chưa có sản phẩm đích hợp lệ.`;
    return;
  }

  const destSummary = validTargets.map((t) => {
    const tp = findProductByMa(t.productId);
    const name = tp ? getField(tp, "tenSP") : t.productId;
    const unit = tp ? getField(tp, "donVi") : "";
    return `+${t.quantity} ${unit} ${name}`;
  }).join(", ");

  summaryText.textContent = `Chiết: ${srcText} ➔ Phân bổ: ${destSummary}`;
}

export function resetRepackageForm() {
  clearRepackageSource();
  state.repackage.sourceQty = 1;
  state.repackage.targets = [];
  if ($("repackage-source-qty")) $("repackage-source-qty").value = 1;
  renderRepackageTargets();
  toast("Đã làm mới phiếu chiết.", "info");
}

export function initRepackageForm() {
  initRepackageModal(resetRepackageForm);

  const srcSearch = $("repackage-src-search");
  if (srcSearch) {
    srcSearch.addEventListener("focus", () => renderRepackageSourceDropdown(srcSearch.value));
    srcSearch.addEventListener("input", () => renderRepackageSourceDropdown(srcSearch.value));
  }

  const srcDropdown = $("repackage-src-dropdown");
  if (srcDropdown) {
    srcDropdown.addEventListener("click", (e) => {
      const item = e.target.closest('[data-action="select-src-product"]');
      if (item) selectRepackageSourceProduct(item.dataset.masp);
    });
  }

  const btnSrcChange = $("btn-repackage-src-change");
  if (btnSrcChange) {
    btnSrcChange.addEventListener("click", () => clearRepackageSource(true));
  }

  const btnSrcDec = $("btn-repackage-src-qty-dec");
  if (btnSrcDec) {
    btnSrcDec.addEventListener("click", () => {
      const input = $("repackage-source-qty");
      if (!input) return;
      const cur = Number(input.value) || 1;
      if (cur > 1) {
        input.value = cur - 1;
        updateRepackageSummary();
      }
    });
  }

  const btnSrcInc = $("btn-repackage-src-qty-inc");
  if (btnSrcInc) {
    btnSrcInc.addEventListener("click", () => {
      const input = $("repackage-source-qty");
      if (!input) return;
      input.value = (Number(input.value) || 0) + 1;
      updateRepackageSummary();
    });
  }

  const srcQtyInput = $("repackage-source-qty");
  if (srcQtyInput) {
    srcQtyInput.addEventListener("input", updateRepackageSummary);
  }

  const btnAddTarget = $("btn-repackage-add-target");
  if (btnAddTarget) {
    btnAddTarget.addEventListener("click", addRepackageTargetRow);
  }

  const handleTargetContainerEvents = (e) => {
    const targetEl = e.target.closest("[data-targetid]");
    const targetId = targetEl ? targetEl.dataset.targetid : null;
    const action = e.target.dataset.action;

    if (action === "target-delete" && targetId) {
      removeRepackageTargetRow(targetId);
      return;
    }

    if (action === "target-clear-product" && targetId) {
      const row = state.repackage.targets.find((t) => t.id === targetId);
      if (row) {
        row.productId = "";
        renderRepackageTargets();
        setTimeout(() => {
          const input = document.querySelector(`[data-targetid="${targetId}"] [data-action="target-search"]`);
          if (input) {
            input.focus();
            showTargetSearchDropdown(targetId, "");
          }
        }, 50);
      }
      return;
    }

    const selectItem = e.target.closest('[data-action="select-target-product"]');
    if (selectItem) {
      selectRepackageTargetProduct(selectItem.dataset.targetid, selectItem.dataset.masp);
      return;
    }

    if (action === "target-qty-dec" && targetId) {
      const input = targetEl.querySelector('[data-action="target-qty"]');
      if (input) {
        const val = Math.max(0.01, (Number(input.value) || 1) - 1);
        input.value = val;
        updateRepackageTargetField(targetId, "quantity", val);
      }
      return;
    }

    if (action === "target-qty-inc" && targetId) {
      const input = targetEl.querySelector('[data-action="target-qty"]');
      if (input) {
        const val = (Number(input.value) || 0) + 1;
        input.value = val;
        updateRepackageTargetField(targetId, "quantity", val);
      }
      return;
    }
  };

  const handleTargetContainerInputs = (e) => {
    const targetEl = e.target.closest("[data-targetid]");
    if (!targetEl) return;
    const targetId = targetEl.dataset.targetid;
    const action = e.target.dataset.action;

    if (action === "target-search") {
      showTargetSearchDropdown(targetId, e.target.value);
    } else if (action === "target-qty") {
      updateRepackageTargetField(targetId, "quantity", e.target.value);
    } else if (action === "target-note") {
      updateRepackageTargetField(targetId, "note", e.target.value);
    }
  };

  const targetsBody = $("repackage-targets-body");
  if (targetsBody) {
    targetsBody.addEventListener("click", handleTargetContainerEvents);
    targetsBody.addEventListener("input", handleTargetContainerInputs);
    targetsBody.addEventListener("focusin", (e) => {
      if (e.target.dataset.action === "target-search") {
        const targetId = e.target.closest("[data-targetid]").dataset.targetid;
        showTargetSearchDropdown(targetId, e.target.value);
      }
    });
  }

  const targetsCards = $("repackage-targets-cards");
  if (targetsCards) {
    targetsCards.addEventListener("click", handleTargetContainerEvents);
    targetsCards.addEventListener("input", handleTargetContainerInputs);
    targetsCards.addEventListener("focusin", (e) => {
      if (e.target.dataset.action === "target-search") {
        const targetId = e.target.closest("[data-targetid]").dataset.targetid;
        showTargetSearchDropdown(targetId, e.target.value);
      }
    });
  }

  // Click ngoài dropdown để đóng
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#repackage-src-search-wrap")) {
      if ($("repackage-src-dropdown")) $("repackage-src-dropdown").classList.add("hidden");
    }
    if (!e.target.closest('[data-dropdown-for], [data-action="target-search"]')) {
      document.querySelectorAll("[data-dropdown-for]").forEach((el) => el.classList.add("hidden"));
      document.querySelectorAll("#repackage-targets-body tr, #repackage-targets-cards > div").forEach((el) => {
        el.classList.remove("z-50");
      });
    }
  });

  const btnReset = $("btn-repackage-reset");
  if (btnReset) btnReset.addEventListener("click", resetRepackageForm);

  const btnSaveSheets = $("btn-repackage-save-sheets");
  if (btnSaveSheets) btnSaveSheets.addEventListener("click", openRepackageModal);
}
