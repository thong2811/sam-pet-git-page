// ============================================================
// Cấu hình môi trường ứng dụng SAM Pet
// ============================================================
function getEnv() {
  return (typeof window !== "undefined" && window.ENV) || {};
}

export const CONFIG = {
  get SHEETS_URL() {
    return getEnv().SHEETS_URL || "https://script.google.com/macros/s/AKfycbyE6Sms6dOVaqowarrIx8Jdj53PcvZzqua4bafuiXhu2W9eWrQW57Tmw1d7lsAneo4/exec";
  },
  get ROOT_PIN() {
    return String(getEnv().ROOT_PIN || getEnv().LOCK_DATE_PIN || getEnv().STAFF_PIN || "032023").trim();
  },
  get STAFF_PIN() {
    return this.ROOT_PIN;
  },
  get LOCK_DATE_PIN() {
    return this.ROOT_PIN;
  },
  get SHEET_NAME_PHIEUXUAT() {
    return getEnv().SHEET_NAME_PHIEUXUAT || "PhieuXuat";
  },
  get SHEET_NAME_REPACKAGE() {
    return getEnv().SHEET_NAME_REPACKAGE || "repackage";
  },
  get SHEET_NAME_STAFF() {
    return getEnv().SHEET_NAME_STAFF || "NhanVien";
  },
  get SHEET_NAME_STOCKCHECK() {
    return getEnv().SHEET_NAME_STOCKCHECK || "KiemKe";
  },
  get APP_VERSION() {
    return getEnv().APP_VERSION || "2.0.0";
  },
  CSV_PRODUCTS_PATH: "products.csv",
  get STORE_NAME() {
    return getEnv().STORE_NAME || "Sam Pet - Dịch Vụ Thú Cưng";
  },
  get STORE_ADDRESS() {
    return getEnv().STORE_ADDRESS || getEnv().ADDRESS || "số 105, Phan Văn Năm, Phường Cái Vồn, Tỉnh Vĩnh Long";
  },
  get ADDRESS() {
    return getEnv().ADDRESS || getEnv().STORE_ADDRESS || "số 105, Phan Văn Năm, Phường Cái Vồn, Tỉnh Vĩnh Long";
  },
  get HOTLINE() {
    return getEnv().HOTLINE || "0379793780";
  },
  get ZALO_PHONE() {
    return getEnv().ZALO_PHONE || getEnv().HOTLINE || "0379793780";
  }
};
