// ============================================================
// Formatting & Parsing Utilities
// ============================================================

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatVND(value) {
  const n = toNumber(value, 0);
  return n.toLocaleString("vi-VN") + " đ";
}

export function formatNumber(value) {
  const n = toNumber(value, 0);
  return n.toLocaleString("vi-VN");
}

export function formatCell(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{10}$/.test(raw)) {
    const d = new Date(Number(raw) * 1000);
    if (!Number.isNaN(d.getTime())) {
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  if (/^-?\d+(\.\d+)?$/.test(raw) && raw.length <= 12) {
    const num = Number(raw);
    if (Number.isFinite(num) && Math.abs(num) >= 1000) return num.toLocaleString("vi-VN");
  }
  return raw;
}

export function todayInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toYMD(dateStr) {
  if (!dateStr) return "";
  const s = String(dateStr).trim();
  const clean = s.split("T")[0].trim();
  const delimiter = clean.includes("/") ? "/" : clean.includes("-") ? "-" : null;
  if (!delimiter) return clean;

  const parts = clean.split(delimiter);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}`;
    }
    return `${parts[2]}-${pad(parts[1])}-${pad(parts[0])}`;
  }
  return clean;
}

export function normalizeDateVN(raw) {
  if (!raw) return "";
  const ymd = toYMD(raw);
  const parts = ymd.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${pad(parts[2])}-${pad(parts[1])}-${parts[0]}`;
  }
  return String(raw).trim();
}

export function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function formatNgayXuat(iso) {
  if (!iso) return "";
  const ymd = toYMD(iso);
  const parts = ymd.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${pad(parts[2])}-${pad(parts[1])}-${parts[0]}`;
  }
  return String(iso);
}

export function formatLockDateVN(iso) {
  if (!iso) return "";
  return formatNgayXuat(toYMD(iso));
}

export function unixNow() {
  return Math.floor(Date.now() / 1000);
}

export const COLUMN_LABELS = {
  id: "Mã SP",
  masp: "Mã SP",
  ma_sp: "Mã SP",
  productid: "Mã SP",
  name: "Tên SP",
  tensp: "Tên SP",
  ten_sp: "Tên SP",
  productname: "Tên SP",
  unit: "Đơn vị",
  donvi: "Đơn vị",
  don_vi: "Đơn vị",
  sellingprice: "Giá bán",
  purchaseprice: "Giá nhập",
  initstock: "Tồn kho",
  repackagestock: "Tồn đóng gói",
  invoicecheck: "Kiểm HĐ",
  createdat: "Ngày tạo",
  updatedat: "Ngày cập nhật",
  note: "Ghi chú",
  ghichu: "Ghi chú"
};

export const KEY_CANDIDATES = {
  maSP: ["masp", "ma_sp", "id", "productid", "ma"],
  tenSP: ["tensp", "ten_sp", "name", "productname", "ten"],
  donVi: ["donvi", "don_vi", "unit", "dvt"],
  giaBan: ["sellingprice", "giaban", "gia_ban"],
  giaNhap: ["purchaseprice", "gianhap", "gia_nhap"],
  initStock: ["initstock", "init_stock", "tonkho", "ton_kho"],
  repackageStock: ["repackagestock", "repackage_stock", "tonchiet"]
};

export function normalizeHeader(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function labelFor(column) {
  return COLUMN_LABELS[normalizeHeader(column)] || column;
}

export function detectKeys(columns) {
  const normalized = columns.map((c) => ({ raw: c, norm: normalizeHeader(c) }));
  const pick = (candidates) => {
    const found = normalized.find((c) => candidates.includes(c.norm));
    return found ? found.raw : null;
  };
  return {
    maSP: pick(KEY_CANDIDATES.maSP),
    tenSP: pick(KEY_CANDIDATES.tenSP),
    donVi: pick(KEY_CANDIDATES.donVi),
    giaBan: pick(KEY_CANDIDATES.giaBan),
    giaNhap: pick(KEY_CANDIDATES.giaNhap),
    initStock: pick(KEY_CANDIDATES.initStock),
    repackageStock: pick(KEY_CANDIDATES.repackageStock)
  };
}

export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
  }
  return rows;
}

export function rowsToObjects(rows) {
  if (!rows.length) return { columns: [], products: [] };
  const columns = rows[0].map((h) => String(h).trim());
  const products = rows.slice(1).map((cells, index) => {
    const item = { __index: index };
    columns.forEach((col, i) => {
      item[col] = cells[i] != null ? String(cells[i]).trim() : "";
    });
    return item;
  });
  return { columns, products };
}
