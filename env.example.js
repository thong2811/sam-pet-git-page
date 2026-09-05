// ============================================================
//  TỆP MẪU CẤU HÌNH MÔI TRƯỜNG (ENV TEMPLATE)
//  Tạo bản sao tệp này thành env.js và điền thông tin của bạn.
// ============================================================
const root = typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : this);

root.ENV = {
  SHEETS_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  LOCK_DATE_PIN: "110899",
  SHEET_NAME_PHIEUXUAT: "PhieuXuat",
  SHEET_NAME_REPACKAGE: "repackage",
  APP_VERSION: "1.0.0"
};
