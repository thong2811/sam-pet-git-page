// ============================================================
// Quản lý xác thực nhân viên SamPet (Staff Auth & Audit Identity)
// Single Source of Truth trên Google Sheets (Không lưu PIN vào localStorage)
// ============================================================
import { CONFIG } from "../config.js";
import { state, getCurrentUser, setCurrentUser, isRootUser, getStaffList, setStaffList } from "../state/app-state.js";
import { fetchStaffListAPI, saveStaffListAPI, changeStaffPinAPI } from "../services/api.js";

const AUTH_USER_STORAGE_KEY = "sampet_active_user_v2";
const AUTH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

/**
 * Tải danh sách nhân viên từ Google Sheets vào bộ nhớ RAM
 * @returns {Promise<Array>}
 */
export async function syncStaffList() {
  try {
    const list = await fetchStaffListAPI();
    setStaffList(list);
    return list;
  } catch (err) {
    console.warn("Không tải được danh sách nhân viên từ server:", err);
    return getStaffList();
  }
}

/**
 * Kiểm tra xem phiên đăng nhập hiện tại có hợp lệ không
 * @returns {boolean}
 */
export function isAuthenticated() {
  if (getCurrentUser()) return true;

  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session || !session.user || !session.timestamp) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return false;
    }
    const isExpired = Date.now() - session.timestamp > AUTH_EXPIRY_MS;
    if (isExpired) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return false;
    }

    setCurrentUser(session.user);
    return true;
  } catch (err) {
    console.warn("Auth check error:", err);
    return false;
  }
}

/**
 * Xác thực mã PIN cho một người dùng cụ thể đã được chọn (Root hoặc Nhân viên)
 * @param {{ id: string, name: string, role?: string }} targetUser
 * @param {string} inputPin
 * @returns {Promise<{ success: boolean, user?: Object, message?: string }>}
 */
export async function authenticateUserPin(targetUser, inputPin) {
  if (!targetUser) {
    return { success: false, message: "Vui lòng chọn tài khoản cần đăng nhập!" };
  }

  const cleanPin = String(inputPin || "").trim();
  const rootPin = String(CONFIG.ROOT_PIN || "032023").trim();

  // 1. Quản trị viên (Root)
  if (targetUser.role === "root" || targetUser.id === "root") {
    if (cleanPin === rootPin) {
      const rootUser = {
        id: "root",
        name: "Quản trị viên (Root)",
        role: "root"
      };
      saveUserSession(rootUser);
      return { success: true, user: rootUser, isRoot: true };
    }
    return { success: false, message: "Mã PIN không chính xác! Vui lòng thử lại." };
  }

  // 2. Nhân viên thông thường
  let currentList = getStaffList();
  let staff = currentList.find((s) => s.id === targetUser.id);

  if (!staff) {
    try {
      currentList = await syncStaffList();
      staff = currentList.find((s) => s.id === targetUser.id);
    } catch (e) {
      console.warn("Lỗi syncStaffList:", e);
    }
  }

  if (!staff || staff.status === "inactive" || staff.status === "deleted") {
    return { success: false, message: "Tài khoản nhân viên này không tồn tại hoặc đã bị khóa." };
  }

  if (String(staff.pin).trim() === cleanPin) {
    const staffUser = {
      id: staff.id,
      name: staff.name,
      role: staff.role || "staff"
    };
    saveUserSession(staffUser);
    return { success: true, user: staffUser, isRoot: false };
  }

  return { success: false, message: "Mã PIN không chính xác! Vui lòng thử lại." };
}

/**
 * Xác thực mã PIN trực tiếp (Fallback cho kịch bản không chọn trước)
 * @param {string} inputPin
 * @returns {Promise<{ success: boolean, user?: Object, message?: string }>}
 */
export async function authenticatePin(inputPin) {
  const cleanPin = String(inputPin || "").trim();
  const rootPin = String(CONFIG.ROOT_PIN || "032023").trim();

  // 1. Kiểm tra ROOT_PIN
  if (cleanPin === rootPin) {
    const rootUser = {
      id: "root",
      name: "Quản trị viên (Root)",
      role: "root"
    };
    saveUserSession(rootUser);
    return { success: true, user: rootUser, isRoot: true };
  }

  // 2. Tìm trong danh sách nhân viên
  let currentList = getStaffList();
  let matchedStaffList = currentList.filter((st) => String(st.pin).trim() === cleanPin && st.status !== "inactive");

  if (matchedStaffList.length === 0) {
    try {
      currentList = await syncStaffList();
      matchedStaffList = currentList.filter((st) => String(st.pin).trim() === cleanPin && st.status !== "inactive");
    } catch (e) {
      console.warn("Lỗi syncStaffList:", e);
    }
  }

  if (matchedStaffList.length === 1) {
    const matchedStaff = matchedStaffList[0];
    const staffUser = {
      id: matchedStaff.id,
      name: matchedStaff.name,
      role: matchedStaff.role || "staff"
    };
    saveUserSession(staffUser);
    return { success: true, user: staffUser, isRoot: false };
  }

  // Nếu sai hoặc có hơn 1 người trùng PIN khi không chọn tên trước
  return { success: false, message: "Mã PIN không chính xác! Vui lòng thử lại." };
}

/**
 * Lưu phiên làm việc của nhân viên
 * @param {Object} user { id, name, role }
 */
export function saveUserSession(user) {
  setCurrentUser(user);
  try {
    const session = {
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn("Could not save session:", err);
  }
}

/**
 * Đăng xuất tài khoản hiện tại
 */
export function clearSession() {
  setCurrentUser(null);
  try {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear session:", err);
  }
}

/**
 * Nhân viên tự đổi mã PIN của mình
 * @param {string} oldPin
 * @param {string} newPin
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function selfChangePin(oldPin, newPin) {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: "Bạn chưa đăng nhập." };
  }

  const cleanOld = String(oldPin || "").trim();
  const cleanNew = String(newPin || "").trim();

  if (!cleanOld || !cleanNew) {
    return { success: false, message: "Vui lòng nhập đầy đủ mã PIN hiện tại và mã PIN mới." };
  }

  if (cleanNew.length !== 6 || !/^\d{6}$/.test(cleanNew)) {
    return { success: false, message: "Mã PIN mới phải bao gồm đúng 6 chữ số." };
  }

  if (cleanOld === cleanNew) {
    return { success: false, message: "Mã PIN mới phải khác mã PIN hiện tại." };
  }

  // Kiểm tra không được trùng với ROOT_PIN
  if (cleanNew === String(CONFIG.ROOT_PIN).trim()) {
    return { success: false, message: "Mã PIN mới không được trùng với mã ROOT_PIN của hệ thống!" };
  }

  // Nếu là Root:
  if (user.role === "root") {
    if (cleanOld !== String(CONFIG.ROOT_PIN).trim()) {
      return { success: false, message: "Mã PIN Root hiện tại không chính xác!" };
    }
    return {
      success: false,
      message: "Mã ROOT_PIN được bảo vệ trong tệp cấu hình (public/env.js). Vui lòng cập nhật biến ROOT_PIN trong env.js để đổi mật khẩu Root vĩnh viễn!"
    };
  }

  // Nếu là nhân viên thường:
  try {
    const res = await changeStaffPinAPI(user.id, cleanOld, cleanNew);
    if (res && res.status === "ok") {
      // Cập nhật RAM
      const list = getStaffList();
      const staffIdx = list.findIndex((s) => s.id === user.id);
      if (staffIdx !== -1) {
        list[staffIdx].pin = cleanNew;
        list[staffIdx].updatedAt = Date.now();
        setStaffList(list);
      }
      return { success: true, message: res.message || "Đổi mã PIN thành công!" };
    }
    return { success: false, message: res?.message || "Lỗi khi đổi mã PIN trên máy chủ." };
  } catch (err) {
    return { success: false, message: "Lỗi kết nối máy chủ: " + err.message };
  }
}

/**
 * Quản trị viên (Root) thêm nhân viên mới
 * @param {{ name: string, pin: string, role?: string }} param0
 */
export async function rootAddStaff({ name, pin, role = "staff" }) {
  if (!isRootUser()) {
    throw new Error("Chỉ Quản trị viên (Root) mới có quyền thực hiện thao tác này.");
  }

  const cleanName = String(name || "").trim();
  const cleanPin = String(pin || "").trim();

  if (!cleanName || !cleanPin) {
    throw new Error("Vui lòng điền đầy đủ Tên nhân viên và Mã PIN.");
  }

  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    throw new Error("Mã PIN phải bao gồm đúng 6 chữ số.");
  }

  // Kiểm tra trùng với ROOT_PIN
  if (cleanPin === String(CONFIG.ROOT_PIN).trim()) {
    throw new Error("Mã PIN này trùng với mã ROOT_PIN của hệ thống!");
  }

  const list = [...getStaffList()];

  const newStaff = {
    id: "nv_" + Date.now().toString(16),
    name: cleanName,
    pin: cleanPin,
    role: role || "staff",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "active"
  };

  list.push(newStaff);
  const res = await saveStaffListAPI(list);
  if (res && res.status === "error") {
    throw new Error(res.message || "Lỗi khi lưu lên Google Sheets.");
  }

  setStaffList(list);
  return newStaff;
}

/**
 * Quản trị viên (Root) cập nhật thông tin nhân viên hoặc đổi PIN
 * @param {string} staffId
 * @param {{ name?: string, pin?: string }} param1
 */
export async function rootUpdateStaff(staffId, { name, pin }) {
  if (!isRootUser()) {
    throw new Error("Chỉ Quản trị viên (Root) mới có quyền thực hiện thao tác này.");
  }

  const list = [...getStaffList()];
  const idx = list.findIndex((s) => s.id === staffId);
  if (idx === -1) {
    throw new Error("Không tìm thấy nhân viên.");
  }

  const cleanName = name !== undefined ? String(name).trim() : list[idx].name;
  const cleanPin = pin !== undefined ? String(pin).trim() : list[idx].pin;

  if (!cleanName) {
    throw new Error("Tên nhân viên không được để trống.");
  }

  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    throw new Error("Mã PIN phải bao gồm đúng 6 chữ số.");
  }

  if (cleanPin === String(CONFIG.ROOT_PIN).trim()) {
    throw new Error("Mã PIN này trùng với mã ROOT_PIN!");
  }

  list[idx].name = cleanName;
  list[idx].pin = cleanPin;
  list[idx].updatedAt = Date.now();

  const res = await saveStaffListAPI(list);
  if (res && res.status === "error") {
    throw new Error(res.message || "Lỗi khi lưu lên Google Sheets.");
  }

  setStaffList(list);
  return list[idx];
}

/**
 * Quản trị viên (Root) xóa nhân viên
 * @param {string} staffId
 */
export async function rootDeleteStaff(staffId) {
  if (!isRootUser()) {
    throw new Error("Chỉ Quản trị viên (Root) mới có quyền thực hiện thao tác này.");
  }

  let list = [...getStaffList()];
  list = list.filter((s) => s.id !== staffId);

  const res = await saveStaffListAPI(list);
  if (res && res.status === "error") {
    throw new Error(res.message || "Lỗi khi xóa trên Google Sheets.");
  }

  setStaffList(list);
  return true;
}
