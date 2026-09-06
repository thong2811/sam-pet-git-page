// ============================================================
// Cấu hình môi trường ứng dụng SAM Pet
// ============================================================
const env = (typeof window !== "undefined" && window.ENV) || {};

export const CONFIG = {
  SHEETS_URL: env.SHEETS_URL || "https://script.google.com/macros/s/AKfycbyE6Sms6dOVaqowarrIx8Jdj53PcvZzqua4bafuiXhu2W9eWrQW57Tmw1d7lsAneo4/exec",
  LOCK_DATE_PIN: env.LOCK_DATE_PIN || "110899",
  SHEET_NAME_PHIEUXUAT: env.SHEET_NAME_PHIEUXUAT || "PhieuXuat",
  SHEET_NAME_REPACKAGE: env.SHEET_NAME_REPACKAGE || "repackage",
  APP_VERSION: env.APP_VERSION || "2.0.0",
  CSV_PRODUCTS_PATH: "products.csv"
};
