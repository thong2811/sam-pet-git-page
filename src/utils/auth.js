// ============================================================
// Quản lý xác thực nhân viên SamPet (Staff Auth & 7-Day Session)
// ============================================================
import { CONFIG } from "../config.js";

const AUTH_STORAGE_KEY = "sampet_staff_session_v2";
const AUTH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

/**
 * Kiểm tra xem phiên đăng nhập nhân viên hiện tại có hợp lệ không (còn hạn 7 ngày)
 * @returns {boolean}
 */
export function isAuthenticated() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session || !session.authenticated || !session.timestamp) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
    const isExpired = Date.now() - session.timestamp > AUTH_EXPIRY_MS;
    if (isExpired) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Auth check error:", err);
    return false;
  }
}

/**
 * Xác thực mã PIN người dùng nhập
 * @param {string} inputPin
 * @returns {boolean} true nếu đúng PIN và đã ghi nhớ phiên
 */
export function verifyAndSaveSession(inputPin) {
  const targetPin = String(CONFIG.STAFF_PIN || "110899").trim();
  const cleanInput = String(inputPin || "").trim();

  if (cleanInput === targetPin) {
    try {
      const session = {
        authenticated: true,
        timestamp: Date.now()
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn("Could not save session to localStorage:", err);
    }
    return true;
  }
  return false;
}

/**
 * Đăng xuất tài khoản nhân viên (xóa phiên khỏi thiết bị)
 */
export function clearSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear session:", err);
  }
}
