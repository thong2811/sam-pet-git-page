// ============================================================
//  CẤU HÌNH MÔI TRƯỜNG & BIẾN TOÀN CỤC (ENVIRONMENT VARIABLES)
//  Tệp này chứa các cấu hình quan trọng của ứng dụng SAM Pet.
// ============================================================
const root = typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : this);

root.ENV = {
  // Đường link Web App Google Apps Script kết nối Google Sheet
  SHEETS_URL: "https://script.google.com/macros/s/AKfycbyE6Sms6dOVaqowarrIx8Jdj53PcvZzqua4bafuiXhu2W9eWrQW57Tmw1d7lsAneo4/exec",

  // Mã PIN bảo mật truy cập trang nhân viên (Ghi nhớ 7 ngày)
  STAFF_PIN: "032023",

  // Mã PIN bảo mật dùng cho chức năng Khóa / Mở khóa ngày sổ sách
  LOCK_DATE_PIN: "110899",

  // Tên các tab trong Google Sheet
  SHEET_NAME_PHIEUXUAT: "PhieuXuat",
  SHEET_NAME_REPACKAGE: "repackage",

  // Phiên bản ứng dụng
  APP_VERSION: "1.0.0",

  // Thông tin cửa hàng & Liên hệ khách hàng (Trang Grooming)
  STORE_NAME: "Sam Pet - Dịch Vụ Thú Cưng",
  ADDRESS: "số 105, Phan Văn Năm, Phường Cái Vồn, Tỉnh Vĩnh Long",
  STORE_ADDRESS: "số 105, Phan Văn Năm, Phường Cái Vồn, Tỉnh Vĩnh Long",
  HOTLINE: "0379793780",
  ZALO_PHONE: "0379793780"
};
