const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("\x1b[36m========================================================\x1b[0m");
console.log("\x1b[36m  SAM PET — TỰ ĐỘNG DEPLOY GOOGLE APPS SCRIPT (CLASP)   \x1b[0m");
console.log("\x1b[36m========================================================\x1b[0m\n");

// 1. Kiểm tra file .clasp.json
const claspJsonPath = path.join(PROJECT_ROOT, ".clasp.json");
if (!fs.existsSync(claspJsonPath)) {
  console.error("\x1b[31m[ERROR] Không tìm thấy file .clasp.json ở thư mục gốc!\x1b[0m");
  console.log("Vui lòng tạo file .clasp.json với nội dung:\n{\n  \"scriptId\": \"MÃ_SCRIPT_ID_CỦA_BẠN\",\n  \"rootDir\": \"./backend\"\n}");
  process.exit(1);
}

const claspConfig = JSON.parse(fs.readFileSync(claspJsonPath, "utf-8"));
if (!claspConfig.scriptId || claspConfig.scriptId.includes("PASTE_YOUR_SCRIPT_ID")) {
  console.error("\x1b[31m[ERROR] Bạn chưa cấu hình scriptId trong .clasp.json!\x1b[0m");
  console.log("👉 Vui lòng mở .clasp.json và điền Script ID dự án Apps Script của bạn.");
  process.exit(1);
}

// 2. Lấy Deployment ID từ env.js để giữ nguyên Web App URL
let deploymentId = "";
const envJsPath = path.join(PROJECT_ROOT, "env.js");
if (fs.existsSync(envJsPath)) {
  const envContent = fs.readFileSync(envJsPath, "utf-8");
  const match = envContent.match(/\/macros\/s\/([a-zA-Z0-9_-]+)\/exec/);
  if (match && match[1]) {
    deploymentId = match[1];
  }
}

// 3. Đẩy code lên Google Apps Script
console.log("\x1b[32m[1/2] Đang đẩy mã nguồn backend/Code.gs lên Google Apps Script...\x1b[0m");
try {
  execSync("npx.cmd @google/clasp push -f", {
    cwd: PROJECT_ROOT,
    stdio: "inherit"
  });
} catch (err) {
  console.error("\n\x1b[33m[THÔNG BÁO] Nếu chưa đăng nhập hoặc gặp lỗi xác thực:\x1b[0m");
  console.log("1. Chạy lệnh: npx @google/clasp login");
  console.log("2. Bật Google Apps Script API tại: https://script.google.com/home/usersettings\n");
  process.exit(1);
}

// 4. Cập nhật bản deploy giữ nguyên URL
console.log("\n\x1b[32m[2/2] Đang cập nhật bản Deploy Web App (Giữ nguyên URL)...\x1b[0m");
const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const desc = `"Auto deployed from local at ${now}"`;

try {
  let deployCmd = `npx.cmd @google/clasp deploy --description ${desc}`;
  if (deploymentId) {
    console.log(`\x1b[90m👉 Cập nhật trực tiếp vào Deployment ID: ${deploymentId}\x1b[0m`);
    deployCmd = `npx.cmd @google/clasp deploy -i ${deploymentId} --description ${desc}`;
  }
  execSync(deployCmd, {
    cwd: PROJECT_ROOT,
    stdio: "inherit"
  });
  console.log("\n\x1b[36m========================================================\x1b[0m");
  console.log("\x1b[32m✔ DEPLOY THÀNH CÔNG! Link Web App Google Apps Script giữ nguyên 100%.\x1b[0m");
  if (deploymentId) {
    console.log(`\x1b[36m🔗 URL: https://script.google.com/macros/s/${deploymentId}/exec\x1b[0m`);
  }
  console.log("\x1b[36m========================================================\x1b[0m\n");
} catch (err) {
  console.warn("\x1b[33mCảnh báo: Không thể cập nhật trực tiếp deployment cũ, đang thử tạo bản deploy mới...\x1b[0m");
  try {
    execSync(`npx.cmd @google/clasp deploy --description ${desc}`, {
      cwd: PROJECT_ROOT,
      stdio: "inherit"
    });
    console.log("\n\x1b[32m✔ Đã tạo bản deploy mới thành công!\x1b[0m");
  } catch (e2) {
    console.error("\x1b[31m[ERROR] Lỗi khi tạo bản deploy:\x1b[0m", e2.message);
    process.exit(1);
  }
}
