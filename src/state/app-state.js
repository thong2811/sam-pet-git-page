// ============================================================
// Central Application State
// ============================================================
import { toYMD } from "../utils/formatters.js";

export const state = {
  activeTab: "xuat",
  lockDate: "",
  products: [],
  columns: [],
  keys: {
    maSP: null,
    tenSP: null,
    donVi: null,
    giaBan: null,
    giaNhap: null,
    initStock: null,
    repackageStock: null
  },
  phieu: [],
  usedIds: new Set(),
  sheetHistory: [],
  historySelected: new Set(),
  repackageHistory: [],
  repackageSelected: new Set(),
  repackage: {
    sourceId: "",
    sourceQty: 1,
    targets: []
  },
  currentUser: null,
  staffList: []
};

export function getCurrentUser() {
  return state.currentUser || null;
}

export function setCurrentUser(user) {
  state.currentUser = user;
}

export function isRootUser() {
  return Boolean(state.currentUser && state.currentUser.role === "root");
}

export function getStaffList() {
  return state.staffList || [];
}

export function setStaffList(list) {
  state.staffList = Array.isArray(list) ? list : [];
}

export function genLineId() {
  let id = "";
  do {
    id = (Date.now().toString(16) + Math.random().toString(16).slice(2, 10)).slice(0, 13);
  } while (state.usedIds.has(id));
  state.usedIds.add(id);
  return id;
}

export function getField(product, keyName) {
  if (!product) return "";
  const col = state.keys[keyName];
  return col ? (product[col] || "") : "";
}

export function getLockDate() {
  return state.lockDate || "";
}

export function setLockDate(isoDate) {
  state.lockDate = isoDate ? toYMD(isoDate) : "";
}

export function isDateLocked(dateStr) {
  const lockDate = getLockDate();
  if (!lockDate || !dateStr) return false;
  const ymd = toYMD(dateStr);
  const lockYmd = toYMD(lockDate);
  return ymd <= lockYmd;
}
