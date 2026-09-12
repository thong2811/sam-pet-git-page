// ============================================================
// API Service for Google Apps Script & Static Data
// ============================================================
import { CONFIG } from "../config.js";
import { parseCSV, rowsToObjects, detectKeys, normalizeDateVN, toYMD } from "../utils/formatters.js";
import { state, getCurrentUser } from "../state/app-state.js";

/**
 * Hàm fetch an toàn hỗ trợ timeout bằng AbortController và tự động retry (Backoff)
 * Dành riêng cho các request GET đọc dữ liệu để chống lỗi mạng tạm thời hoặc cold start.
 */
export async function fetchWithRetry(url, options = {}, { maxRetries = 2, timeoutMs = 12000, delayMs = 1000, onRetry = null } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      // Nếu server trả về lỗi tạm thời 5xx hoặc 429 và còn lượt thử
      if (!res.ok && (res.status >= 500 || res.status === 429) && attempt < maxRetries) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err.name === "AbortError";
      lastError = isTimeout ? new Error(`Quá thời gian phản hồi (${timeoutMs / 1000}s)`) : err;

      if (attempt < maxRetries) {
        const waitTime = delayMs * (attempt + 1);
        if (typeof onRetry === "function") {
          try {
            onRetry({ attempt: attempt + 1, maxRetries, waitTime, error: lastError });
          } catch (e) {}
        }
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

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
export async function fetchLockDateAPI(onRetry = null) {
  const res = await fetchWithRetry(CONFIG.SHEETS_URL + "?type=get_lock_date", { method: "GET" }, { timeoutMs: 10000, onRetry });
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
  const user = getCurrentUser();
  const staff = user?.name || "";
  const role = user?.role || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "set_lock_date", lockDate: isoDate, staff, role }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Xuất các dòng phiếu xuất lên Google Sheets
 */
export async function appendPhieuXuatAPI(rows) {
  const staff = getCurrentUser()?.name || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "append", rows, staff }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lấy lịch sử xuất hàng từ Google Sheets (có retry và timeout)
 */
export async function loadSheetHistoryAPI(onRetry = null) {
  const res = await fetchWithRetry(CONFIG.SHEETS_URL + "?type=json&_t=" + Date.now(), { method: "GET" }, { timeoutMs: 12000, maxRetries: 2, delayMs: 1000, onRetry });
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "delete", ids }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cập nhật một dòng xuất hàng
 */
export async function updateSheetHistoryRowAPI(rowPayload) {
  const staff = getCurrentUser()?.name || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "update", row: rowPayload, staff }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ghi nhận phiếu chiết hàng mới
 */
export async function saveRepackageAPI(newRows) {
  const staff = getCurrentUser()?.name || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "repackage",
        type: "repackage",
        rows: newRows,
        staff
      }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tải lịch sử chiết hàng (có retry và timeout)
 */
export async function loadRepackageHistoryAPI(onRetry = null) {
  const res = await fetchWithRetry(CONFIG.SHEETS_URL + "?type=repackage&_t=" + Date.now(), { method: "GET" }, { timeoutMs: 12000, maxRetries: 2, delayMs: 1000, onRetry });
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "repackage_delete", ids: idsToDelete }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cập nhật phiên chiết hàng
 */
export async function updateRepackageSessionAPI(rowsPayload) {
  const staff = getCurrentUser()?.name || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "repackage_update",
        rows: rowsPayload,
        staff
      }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tải danh sách nhân viên từ tab NhanVien trên Google Sheets (có retry và timeout)
 */
export async function fetchStaffListAPI(onRetry = null) {
  const res = await fetchWithRetry(CONFIG.SHEETS_URL + "?type=staff&_t=" + Date.now(), { method: "GET" }, { timeoutMs: 10000, maxRetries: 2, delayMs: 1000, onRetry });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.status === "ok") {
    return Array.isArray(data.staffList) ? data.staffList : [];
  }
  return [];
}

/**
 * Lưu/Đồng bộ danh sách nhân viên lên tab NhanVien Google Sheets (Chỉ Root)
 */
export async function saveStaffListAPI(staffList) {
  const staff = getCurrentUser()?.name || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "staff_save",
        staffList: staffList,
        staff
      }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Nhân viên tự đổi mã PIN của chính mình
 */
export async function changeStaffPinAPI(staffId, oldPin, newPin) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "staff_change_pin",
        staffId,
        oldPin,
        newPin
      }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lưu kết quả kiểm kê thực tế lên Google Sheets (tab KiemKe)
 */
export async function saveStockCheckAPI(rows, auditDate, note = "", deletedProductIds = []) {
  const staff = getCurrentUser()?.name || "";
  const formattedRows = rows.map((r) => {
    const cleanId = String(r.productId || "").replace(/^'+/, "").trim();
    return {
      productId: "'" + cleanId,
      productName: r.productName || "",
      unit: r.unit || "",
      actualStock: Number(r.actualStock) || 0,
      date: auditDate,
      note: r.note || note || "",
      staff
    };
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(CONFIG.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "stock_check_save",
        date: auditDate,
        note,
        staff,
        rows: formattedRows,
        deletedProductIds: deletedProductIds || []
      }),
      signal: controller.signal
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tải lịch sử kiểm kê từ Google Sheets (có retry và timeout)
 */
export async function loadStockCheckHistoryAPI(onRetry = null) {
  const res = await fetchWithRetry(CONFIG.SHEETS_URL + "?type=stock_check&_t=" + Date.now(), { method: "GET" }, { timeoutMs: 12000, maxRetries: 2, delayMs: 1000, onRetry });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);

  const rows = (data.rows || []).map((r) => {
    r.date = normalizeDateVN(r.date);
    if (r.id) r.id = String(r.id).replace(/^'+/, "");
    if (r.productId) r.productId = String(r.productId).replace(/^'+/, "");
    return r;
  }).sort((a, b) => {
    const dateComp = toYMD(b.date).localeCompare(toYMD(a.date));
    if (dateComp !== 0) return dateComp;
    return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
  });

  return rows;
}

