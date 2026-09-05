// ============================================================
//  CẤU HÌNH MÔI TRƯỜNG & BIẾN TOÀN CỤC (ENVIRONMENT VARIABLES)
//  Tệp này chứa các cấu hình quan trọng của ứng dụng SAM Pet.
// ============================================================
const root = typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : this);

root.ENV = {
  // Đường link Web App Google Apps Script kết nối Google Sheet
  SHEETS_URL: "https://script.google.com/macros/s/AKfycbyE6Sms6dOVaqowarrIx8Jdj53PcvZzqua4bafuiXhu2W9eWrQW57Tmw1d7lsAneo4/exec",

  // Mã PIN bảo mật dùng cho chức năng Khóa / Mở khóa ngày sổ sách
  LOCK_DATE_PIN: "110899",

  // Tên các tab trong Google Sheet
  SHEET_NAME_PHIEUXUAT: "PhieuXuat",
  SHEET_NAME_REPACKAGE: "repackage",

  // Phiên bản ứng dụng
  APP_VERSION: "1.0.0"
};
