// ============================================================
// View Phiếu Xuất (Giỏ hàng phiếu xuất)
// ============================================================
import { $ } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { escapeHtml, toNumber, unixNow, pad, csvEscape, formatNgayXuat, todayInputValue } from "../../utils/formatters.js";
import { state, genLineId, getField } from "../../state/app-state.js";
import { renderProducts } from "./products-view.js";
import { openExportModal } from "./export-modal.js";

const EXPORT_HEADER = [
  "id", "date", "productId", "productName",
  "quantity", "sellingPrice", "purchasePrice",
  "note", "createdAt", "updatedAt"
];

export function addToPhieu(product) {
  const maSP = getField(product, "maSP");
  const tenSP = getField(product, "tenSP");
  const donVi = getField(product, "donVi");
  const giaBan = toNumber(getField(product, "giaBan"), 0);
  const giaNhap = toNumber(getField(product, "giaNhap"), 0);

  const now = unixNow();
  state.phieu.push({
    id: genLineId(),
    productId: maSP,
    productName: tenSP,
    donVi: donVi || "",
    quantity: 1,
    sellingPrice: giaBan,
    purchasePrice: giaNhap,
    note: "",
    createdAt: now,
    updatedAt: now
  });
  renderPhieu();
  renderProducts();
  toast(`Đã thêm ${tenSP}`, "success");
}

export function renderPhieu() {
  const hasRows = state.phieu.length > 0;
  if ($("phieu-empty")) $("phieu-empty").classList.toggle("hidden", hasRows);
  if ($("btn-xoa-phieu")) $("btn-xoa-phieu").disabled = !hasRows;
  if ($("btn-export-csv")) $("btn-export-csv").disabled = !hasRows;
  if ($("btn-xuat-sheets")) $("btn-xuat-sheets").disabled = !hasRows;

  const tongSL = state.phieu.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const tongTien = state.phieu.reduce((sum, row) => sum + (Number(row.quantity || 0) * Number(row.sellingPrice || 0)), 0);

  if (state.activeTab === "xuat" && $("badge-chip")) {
    $("badge-chip").textContent = `Phiếu: ${state.phieu.length} dòng`;
  }
  if ($("phieu-summary")) {
    $("phieu-summary").textContent = hasRows
      ? `${state.phieu.length} dòng · Tổng SL ${tongSL.toLocaleString("vi-VN")} · Tổng tiền ${tongTien.toLocaleString("vi-VN")} đ`
      : "Chưa có sản phẩm nào trong phiếu.";
  }

  const tbody = $("phieu-body");
  if (tbody) {
    tbody.innerHTML = state.phieu.map((row, idx) => {
      const rowTotal = (Number(row.quantity) || 0) * (Number(row.sellingPrice) || 0);
      return `
      <tr data-id="${escapeHtml(row.id)}" class="${idx % 2 === 0 ? "bg-white" : "bg-slate-100/60"}">
        <td class="px-4 py-2.5 text-slate-400 text-xs">${idx + 1}</td>
        <td class="px-4 py-2.5 whitespace-nowrap font-mono text-xs">${escapeHtml(row.productId)}</td>
        <td class="px-4 py-2.5 font-medium">${escapeHtml(row.productName)}</td>
        <td class="px-4 py-2.5 text-slate-500">${escapeHtml(row.donVi || "—")}</td>
        <td class="px-4 py-2.5">
          <div class="flex items-center gap-1">
            <button type="button" data-action="qty-dec"
              class="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-base flex items-center justify-center">−</button>
            <input type="number" min="1" step="1" value="${escapeHtml(String(row.quantity))}"
              data-action="qty"
              class="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pine-500" />
            <button type="button" data-action="qty-inc"
              class="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-base flex items-center justify-center">+</button>
          </div>
        </td>
        <td class="px-4 py-2.5">
          <input type="number" min="0" step="1" value="${escapeHtml(String(row.sellingPrice))}"
            data-action="price"
            class="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500" />
        </td>
        <td class="px-4 py-2.5 text-right font-semibold text-pine-700 whitespace-nowrap" data-field="row-total">${rowTotal.toLocaleString("vi-VN")} đ</td>
        <td class="px-4 py-2.5">
          <input type="text" maxlength="200" value="${escapeHtml(row.note || "")}"
            data-action="note" placeholder="Ghi chú…"
            class="w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500" />
        </td>
        <td class="px-4 py-2.5 text-right">
          <button type="button" data-action="delete"
            class="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Xóa</button>
        </td>
      </tr>`;
    }).join("");
  }

  const cardsEl = $("phieu-cards");
  if (cardsEl) {
    cardsEl.innerHTML = state.phieu.map((row, idx) => {
      const rowTotal = (Number(row.quantity) || 0) * (Number(row.sellingPrice) || 0);
      return `
      <div data-id="${escapeHtml(row.id)}" class="px-4 py-3 space-y-2 border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-100/60"}">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-medium text-sm">${escapeHtml(row.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(row.productId)} · ${escapeHtml(row.donVi || "—")}</p>
          </div>
          <button type="button" data-action="delete"
            class="shrink-0 rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-100">Xóa</button>
        </div>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Số lượng</label>
              <div class="flex items-center gap-1.5">
                <button type="button" data-action="qty-dec"
                  class="w-9 h-9 shrink-0 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center">−</button>
                <input type="number" min="1" step="1" value="${escapeHtml(String(row.quantity))}"
                  data-action="qty"
                  class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-pine-500" />
                <button type="button" data-action="qty-inc"
                  class="w-9 h-9 shrink-0 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center">+</button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Giá bán</label>
              <input type="number" min="0" step="1" value="${escapeHtml(String(row.sellingPrice))}"
                data-action="price"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500" />
            </div>
          </div>
          <div class="flex items-center justify-between text-xs bg-pine-50/70 rounded-lg px-3 py-1.5 border border-pine-100">
            <span class="text-slate-500">Tổng tiền:</span>
            <span data-field="row-total" class="font-bold text-pine-700 text-sm">${rowTotal.toLocaleString("vi-VN")} đ</span>
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Ghi chú</label>
            <input type="text" maxlength="200" value="${escapeHtml(row.note || "")}"
              data-action="note" placeholder="Ghi chú…"
              class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pine-500" />
          </div>
        </div>
      </div>`;
    }).join("");
  }
}

export function updatePhieuField(id, field, value) {
  const row = state.phieu.find((r) => r.id === id);
  if (!row) return;

  if (field === "qty") {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      toast("Số lượng phải lớn hơn 0.", "warning");
      renderPhieu();
      return;
    }
    row.quantity = n;
  } else if (field === "price") {
    const n = Number(value);
    if (n < 0) {
      toast("Giá không được âm.", "warning");
      renderPhieu();
      return;
    }
    row.sellingPrice = n;
  } else if (field === "note") {
    row.note = value;
  }
  row.updatedAt = unixNow();

  const rowTotal = (Number(row.quantity) || 0) * (Number(row.sellingPrice) || 0);
  document.querySelectorAll(`[data-id="${id}"] [data-field="row-total"]`).forEach((el) => {
    el.textContent = `${rowTotal.toLocaleString("vi-VN")} đ`;
  });

  const tongSL = state.phieu.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const tongTien = state.phieu.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.sellingPrice || 0)), 0);
  if ($("phieu-summary")) {
    $("phieu-summary").textContent = `${state.phieu.length} dòng · Tổng SL ${tongSL.toLocaleString("vi-VN")} · Tổng tiền ${tongTien.toLocaleString("vi-VN")} đ`;
  }
}

export function removeRow(id) {
  const row = state.phieu.find((r) => r.id === id);
  state.phieu = state.phieu.filter((r) => r.id !== id);
  renderPhieu();
  renderProducts();
  toast(row ? `Đã xóa ${row.productName}` : "Đã xóa dòng", "info");
}

export function exportCSV() {
  if (!state.phieu.length) {
    toast("Phiếu xuất đang trống, không thể xuất file.", "error");
    return;
  }
  const savedDate = localStorage.getItem("sam_pet_export_date") || todayInputValue();
  const date = formatNgayXuat(savedDate);
  const now = unixNow();
  const lines = [EXPORT_HEADER.map(csvEscape).join(",")];

  state.phieu.forEach((row) => {
    lines.push([
      row.id,
      date,
      row.productId,
      row.productName,
      row.quantity,
      row.sellingPrice,
      row.purchasePrice,
      row.note,
      row.createdAt,
      row.updatedAt || now
    ].map(csvEscape).join(","));
  });

  const stampDate = new Date();
  const stamp = `${stampDate.getFullYear()}${pad(stampDate.getMonth() + 1)}${pad(stampDate.getDate())}_${pad(stampDate.getHours())}${pad(stampDate.getMinutes())}${pad(stampDate.getSeconds())}`;
  const filename = `PhieuXuat_${stamp}.csv`;
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Đã xuất ${filename}`, "success");
}

export function initPhieuView() {
  const handlePhieuEvents = (e) => {
    const rowEl = e.target.closest("[data-id]");
    if (!rowEl) return;
    const id = rowEl.dataset.id;
    const action = e.target.dataset.action;

    if (action === "delete") {
      removeRow(id);
    } else if (action === "qty-dec") {
      const input = rowEl.querySelector('[data-action="qty"]');
      if (input) {
        input.value = Math.max(1, (Number(input.value) || 1) - 1);
        updatePhieuField(id, "qty", input.value);
      }
    } else if (action === "qty-inc") {
      const input = rowEl.querySelector('[data-action="qty"]');
      if (input) {
        input.value = (Number(input.value) || 0) + 1;
        updatePhieuField(id, "qty", input.value);
      }
    }
  };

  const handlePhieuInput = (e) => {
    const rowEl = e.target.closest("[data-id]");
    if (!rowEl) return;
    const id = rowEl.dataset.id;
    const action = e.target.dataset.action;
    if (action === "qty" || action === "price" || action === "note") {
      updatePhieuField(id, action, e.target.value);
    }
  };

  const tbody = $("phieu-body");
  if (tbody) {
    tbody.addEventListener("click", handlePhieuEvents);
    tbody.addEventListener("input", handlePhieuInput);
  }

  const cardsEl = $("phieu-cards");
  if (cardsEl) {
    cardsEl.addEventListener("click", handlePhieuEvents);
    cardsEl.addEventListener("input", handlePhieuInput);
  }

  const btnXoa = $("btn-xoa-phieu");
  if (btnXoa) {
    btnXoa.addEventListener("click", () => {
      if (!state.phieu.length) return;
      if (!confirm("Bạn có chắc muốn xóa toàn bộ phiếu xuất hiện tại?")) return;
      state.phieu = [];
      renderPhieu();
      renderProducts();
      toast("Đã xóa phiếu xuất.", "info");
    });
  }

  const btnExportCsv = $("btn-export-csv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", exportCSV);
  }

  const btnXuatSheets = $("btn-xuat-sheets");
  if (btnXuatSheets) {
    btnXuatSheets.addEventListener("click", openExportModal);
  }
}
