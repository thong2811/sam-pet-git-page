// ============================================================
// API Service for Google Apps Script & Static Data
// ============================================================
import { CONFIG } from "../config.js";
import { parseCSV, rowsToObjects, detectKeys, normalizeDateVN, toYMD } from "../utils/formatters.js";
import { state } from "../state/app-state.js";

/**
 * Tải danh sách sản phẩm từ file CSV cục bộ
 */
export async function loadProductsData() {
  const files = [CONFIG.CSV_PRODUCTS_PATH, "products.csv", "product.csv"];
  let lastError = "";

  for (const file of files) {
    try {
      const res = await fetch(file + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) {
        lastError = `Không đọc được ${file} (HTTP ${res.status}).`;
        continue;
      }
      const text = await res.text();
      if (!text.trim()) {
        lastError = `File ${file} đang trống.`;
        continue;
      }
      const { columns, products } = rowsToObjects(parseCSV(text));
      if (!columns.length || !products.length) {
        lastError = `File ${file} không có dữ liệu sản phẩm.`;
        continue;
      }
      const keys = detectKeys(columns);
      if (!keys.maSP || !keys.tenSP) {
        lastError = `File ${file} thiếu cột Mã SP hoặc Tên SP.`;
        continue;
      }

      state.columns = columns;
      state.products = products;
      state.keys = keys;

      return { success: true, file, count: products.length };
    } catch (err) {
      lastError = `Lỗi khi tải ${file}: ${err.message}`;
    }
  }

  return { success: false, error: lastError };
}

/**
 * Lấy ngày khóa sổ từ Google Apps Script
 */
export async function fetchLockDateAPI() {
  const res = await fetch(CONFIG.SHEETS_URL + "?type=get_lock_date");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.status === "ok" && data.lockDate !== undefined) {
    return data.lockDate ? toYMD(data.lockDate) : "";
  }
  return "";
}

/**
 * Lưu ngày khóa sổ lên Google Apps Script
 */
export async function setLockDateAPI(isoDate) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "set_lock_date", lockDate: isoDate })
  });
  return await res.json();
}

/**
 * Xuất các dòng phiếu xuất lên Google Sheets
 */
export async function appendPhieuXuatAPI(rows) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "append", rows })
  });
  return await res.json();
}

/**
 * Lấy lịch sử xuất hàng từ Google Sheets
 */
export async function loadSheetHistoryAPI() {
  const res = await fetch(CONFIG.SHEETS_URL + "?type=json", { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);

  if (data.lockDate !== undefined) {
    state.lockDate = data.lockDate ? toYMD(data.lockDate) : "";
  }

  const rows = (data.rows || []).map((r) => {
    r.date = normalizeDateVN(r.date);
    if (r.id) r.id = String(r.id).replace(/^'+/, "");
    if (r.productId) r.productId = String(r.productId).replace(/^'+/, "");
    return r;
  }).sort((a, b) => {
    return toYMD(b.date).localeCompare(toYMD(a.date));
  });

  return rows;
}

/**
 * Xóa danh sách các dòng xuất hàng theo ID
 */
export async function deleteSheetHistoryRowsAPI(ids) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "delete", ids })
  });
  return await res.json();
}

/**
 * Cập nhật một dòng xuất hàng
 */
export async function updateSheetHistoryRowAPI(rowPayload) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "update", row: rowPayload })
  });
  return await res.json();
}

/**
 * Ghi nhận phiếu chiết hàng mới
 */
export async function saveRepackageAPI(newRows) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "repackage",
      type: "repackage",
      rows: newRows
    })
  });
  return await res.json();
}

/**
 * Tải lịch sử chiết hàng
 */
export async function loadRepackageHistoryAPI() {
  const res = await fetch(CONFIG.SHEETS_URL + "?type=repackage", { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);

  if (data.lockDate !== undefined) {
    state.lockDate = data.lockDate ? toYMD(data.lockDate) : "";
  }

  const rows = (data.repackageRows || []).map((r) => {
    r.date = normalizeDateVN(r.date);
    if (r.id) r.id = String(r.id).replace(/^'+/, "");
    if (r.fromProductId) r.fromProductId = String(r.fromProductId).replace(/^'+/, "");
    if (r.toProductId) r.toProductId = String(r.toProductId).replace(/^'+/, "");
    return r;
  }).sort((a, b) => {
    return toYMD(b.date).localeCompare(toYMD(a.date));
  });

  return rows;
}

/**
 * Xóa các dòng lịch sử chiết hàng
 */
export async function deleteRepackageRowsAPI(idsToDelete) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "repackage_delete", ids: idsToDelete })
  });
  return await res.json();
}

/**
 * Cập nhật phiên chiết hàng
 */
export async function updateRepackageSessionAPI(rowsPayload) {
  const res = await fetch(CONFIG.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "repackage_update",
      rows: rowsPayload
    })
  });
  return await res.json();
}
