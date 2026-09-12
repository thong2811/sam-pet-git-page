import puppeteer from "puppeteer-core";
import path from "node:path";
import fs from "node:fs";

const ARTIFACT_DIR = "C:\\Users\\VT-HTCT\\.gemini\\antigravity-ide\\brain\\603c174f-3086-49aa-a8df-366ca087e39c";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("==================================================");
  console.log(" BẮT ĐẦU KIỂM THỬ GIAO DIỆN TỰ ĐỘNG (PUPPETEER)  ");
  console.log("==================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // 1. Mở trang web
    console.log("\n[1/5] Đang mở trang web http://localhost:3000/...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
    await sleep(1200);

    const shot1 = path.join(ARTIFACT_DIR, "step1_login_screen.png");
    await page.screenshot({ path: shot1 });
    console.log("📸 Đã chụp ảnh màn hình đăng nhập:", shot1);

    // 2. Chờ danh sách tài khoản xuất hiện và click chọn Quản trị viên (Root)
    console.log("\n[2/5] Đang chờ danh sách tài khoản xuất hiện và chọn Quản trị viên (Root)...");
    const rootBtn = await page.waitForSelector('[data-id="root"]', { timeout: 10000 });
    if (rootBtn) {
      await rootBtn.click();
      await sleep(600);
    }

    // Nhập mã PIN 032023 bằng cách click bàn phím số ảo trên UI
    const pinDigits = ["0", "3", "2", "0", "2", "3"];
    for (const d of pinDigits) {
      const keyBtn = await page.$(`button[data-key="${d}"]`);
      if (keyBtn) {
        await keyBtn.click();
        await sleep(150);
      }
    }

    // Chờ màn hình chính xuất hiện (auth screen ẩn đi)
    await page.waitForFunction(() => {
      const screen = document.getElementById("staff-auth-screen");
      return screen && screen.classList.contains("hidden");
    }, { timeout: 8000 });
    console.log("✅ Đăng nhập thành công vào ứng dụng chính!");

    // 3. Kiểm tra Tab Xuất Hàng (History Sync Indicator)
    console.log("\n[3/5] Đang kiểm tra Tab Xuất Hàng và chỉ báo đồng bộ dữ liệu...");
    await sleep(2500);

    const xuatStatusText = await page.evaluate(() => {
      const el = document.getElementById("history-summary");
      return el ? el.innerText.trim() : "";
    });
    console.log("👉 Trạng thái đồng bộ Tab Xuất Hàng:", xuatStatusText);

    const shot2 = path.join(ARTIFACT_DIR, "step2_tab_xuat_synced.png");
    await page.screenshot({ path: shot2 });
    console.log("📸 Đã chụp ảnh Tab Xuất Hàng:", shot2);

    // 4. Kiểm tra Tab Chiết Hàng (Lazy Loading)
    console.log("\n[4/5] Chuyển sang Tab Chiết Hàng để kiểm tra Lazy Loading...");
    await page.evaluate(() => {
      window.location.hash = "#chiet";
    });
    await sleep(2500);

    const chietStatusText = await page.evaluate(() => {
      const el = document.getElementById("repackage-history-summary");
      return el ? el.innerText.trim() : "";
    });
    console.log("👉 Trạng thái đồng bộ Tab Chiết Hàng:", chietStatusText);

    const shot3 = path.join(ARTIFACT_DIR, "step3_tab_chiet_lazy.png");
    await page.screenshot({ path: shot3 });
    console.log("📸 Đã chụp ảnh Tab Chiết Hàng:", shot3);

    // 5. Kiểm tra Tab Kiểm Kê Kho (Lazy Loading)
    console.log("\n[5/5] Chuyển sang Tab Kiểm Kê Kho để kiểm tra Lazy Loading...");
    await page.evaluate(() => {
      window.location.hash = "#kiemke";
    });
    await sleep(2500);

    const kiemkeStatusText = await page.evaluate(() => {
      const el = document.getElementById("stock-check-summary");
      return el ? el.innerText.trim() : "";
    });
    console.log("👉 Trạng thái đồng bộ Tab Kiểm Kê Kho:", kiemkeStatusText);

    const shot4 = path.join(ARTIFACT_DIR, "step4_tab_kiemke_lazy.png");
    await page.screenshot({ path: shot4 });
    console.log("📸 Đã chụp ảnh Tab Kiểm Kê Kho:", shot4);

    console.log("\n==================================================");
    console.log(" TỔNG KẾT KIỂM THỬ GIAO DIỆN THÀNH CÔNG!          ");
    console.log("==================================================");
    console.log("- Đăng nhập PIN: Hoạt động chuẩn xác.");
    console.log("- Tab Xuất Hàng:", xuatStatusText);
    console.log("- Tab Chiết Hàng:", chietStatusText);
    console.log("- Tab Kiểm Kê Kho:", kiemkeStatusText);
    console.log("- 4 Ảnh Screenshots đã được lưu vào artifact directory.");

  } catch (err) {
    console.error("❌ Lỗi trong quá trình test:", err.message);
  } finally {
    await browser.close();
  }
}

run();
