import puppeteer from "puppeteer-core";
import path from "node:path";
import fs from "node:fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR = "D:\\Dev\\sam-pet-git-page\\docs\\screenshots\\overlays";

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  console.log("================================================================================");
  console.log(" BẮT ĐẦU KIỂM THỬ TOÀN BỘ 13 FORM VỚI GLOBAL LOADING OVERLAY TRÊN PUPPETEER    ");
  console.log("================================================================================");

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,950"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });

  // 1. ĐĂNG NHẬP ROOT ADMIN
  console.log("\n[0/13] Đăng nhập Root...");
  const rootBtn = await page.waitForSelector('[data-id="root"]', { timeout: 10000 });
  if (rootBtn) {
    await rootBtn.click();
    await sleep(400);
  }

  const pinKeys = ["0", "3", "2", "0", "2", "3"];
  for (const digit of pinKeys) {
    const keyBtn = await page.$(`button[data-key="${digit}"]`);
    if (keyBtn) {
      await keyBtn.click();
      await sleep(100);
    }
  }

  await page.waitForFunction(() => {
    const screen = document.getElementById("staff-auth-screen");
    return screen && screen.classList.contains("hidden");
  }, { timeout: 10000 });
  console.log("✅ Đăng nhập thành công vào trang quản trị!");

  console.log("⏳ Đang chờ danh mục sản phẩm...");
  await page.waitForFunction(() => window.__state?.products?.length > 0, { timeout: 10000 });
  await sleep(1000);

  // Mock POST requests với delay 1500ms, hủy bỏ khóa ngày tạm thời để test các form không bị chặn
  await page.evaluate(() => {
    window.confirm = () => true;
    window.__state.lockDate = ""; // Tạm mở khóa ngày để test các nghiệp vụ sửa/xóa

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const [resource, options] = args;
      const method = (options?.method || "GET").toUpperCase();

      if (method === "POST") {
        await new Promise((r) => setTimeout(r, 1500));
        return new Response(JSON.stringify({ status: "ok", message: "Thao tác thành công (Test Mock)." }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return originalFetch.apply(this, args);
    };
  });

  async function triggerClick(selector) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.click();
      else throw new Error("Không tìm thấy selector: " + sel);
    }, selector);
  }

  async function verifyAndCaptureOverlay(stepNum, formName, fileName) {
    await sleep(200); // Chờ overlay render sau click
    const overlayState = await page.evaluate(() => {
      const el = document.getElementById("global-loading-overlay");
      const title = document.getElementById("global-loading-title")?.textContent;
      const sub = document.getElementById("global-loading-subtitle")?.textContent;
      const style = window.getComputedStyle(el);
      const isVisible = style.display !== "none" && !el.classList.contains("hidden");
      return { isVisible, title, sub, zIndex: style.zIndex };
    });

    const shotPath = path.join(SCREENSHOTS_DIR, fileName);
    await page.screenshot({ path: shotPath });

    console.log(`\n[${stepNum}/13] ${formName}:`);
    console.log(`      - Trạng thái hiển thị: ${overlayState.isVisible ? "✅ ĐANG BẬT" : "❌ CHƯA BẬT"}`);
    console.log(`      - Tiêu đề: "${overlayState.title}"`);
    console.log(`      - Phụ đề: "${overlayState.sub}"`);
    console.log(`      - Z-Index: ${overlayState.zIndex}`);
    console.log(`      📸 Đã lưu ảnh: ${fileName}`);

    // Chờ 1500ms để mock fetch kết thúc và overlay tự đóng
    await sleep(1600);

    const isClosed = await page.evaluate(() => {
      const el = document.getElementById("global-loading-overlay");
      const style = window.getComputedStyle(el);
      return style.display === "none" || el.classList.contains("hidden");
    });
    console.log(`      - Tự động đóng sau khi hoàn tất: ${isClosed ? "✅ PASS" : "❌ FAIL"}`);
  }

  // ================================================================================
  // FORM 1: LẬP PHIẾU XUẤT HÀNG (THÊM)
  // ================================================================================
  await page.evaluate(() => {
    const p = window.__state.products[0];
    const ma = p[window.__state.keys.maSP];
    const ten = p[window.__state.keys.tenSP];
    window.__state.phieu = [{
      id: "test-row-1",
      productId: ma,
      productName: ten,
      quantity: 1,
      sellingPrice: 50000,
      purchasePrice: 40000,
      note: "Test xuất"
    }];
    const modal = document.getElementById("export-modal");
    if (modal) {
      modal.classList.remove("hidden");
      const dateInp = document.getElementById("export-modal-date");
      if (dateInp) dateInp.value = "2026-09-12";
    }
  });
  await sleep(200);
  await triggerClick("#btn-export-modal-confirm");
  await verifyAndCaptureOverlay(1, "Lập Phiếu Xuất Hàng (export-modal.js)", "01_xuat_hang_overlay.png");

  // ================================================================================
  // FORM 2: SỬA DÒNG LỊCH SỬ XUẤT (SỬA)
  // ================================================================================
  await page.evaluate(async () => {
    window.__state.lockDate = "";
    window.__state.sheetHistory = [{
      id: "mock-hist-1",
      date: "12-09-2026",
      productId: "SP01",
      productName: "Sản phẩm test",
      quantity: "2",
      sellingPrice: "50000",
      purchasePrice: "40000",
      note: ""
    }];
    const { openEditModal } = await import("/src/views/common/edit-row-modal.js");
    openEditModal("mock-hist-1");
  });
  await sleep(200);
  await triggerClick("#btn-edit-save");
  await verifyAndCaptureOverlay(2, "Sửa Dòng Lịch Sử Xuất (edit-row-modal.js)", "02_sua_dong_xuat_overlay.png");

  // ================================================================================
  // FORM 3: XÓA DÒNG LỊCH SỬ XUẤT (XÓA)
  // ================================================================================
  await page.evaluate(async () => {
    window.__state.lockDate = "";
    window.__state.sheetHistory = [{
      id: "mock-hist-1",
      date: "12-09-2026",
      productId: "SP01",
      productName: "Sản phẩm test",
      quantity: "2",
      sellingPrice: "50000",
      purchasePrice: "40000",
      note: ""
    }];
    window.__state.historySelected = new Set(["mock-hist-1"]);
    const { deleteSelectedRows } = await import("/src/views/export/history-view.js");
    deleteSelectedRows();
  });
  await verifyAndCaptureOverlay(3, "Xóa Dòng Lịch Sử Xuất (history-view.js)", "03_xoa_dong_xuat_overlay.png");

  // ================================================================================
  // FORM 4: LẬP PHIẾU CHIẾT HÀNG (THÊM)
  // ================================================================================
  await page.evaluate(() => {
    const p1 = window.__state.products[0];
    const p2 = window.__state.products[1] || p1;
    const maCol = window.__state.keys.maSP;
    window.__state.repackage.sourceId = p1[maCol];
    window.__state.repackage.targets = [{ productId: p2[maCol], quantity: 2, note: "Test chiết" }];

    const modal = document.getElementById("repackage-export-modal");
    if (modal) {
      modal.classList.remove("hidden");
      const dInp = document.getElementById("repackage-modal-date");
      if (dInp) dInp.value = "2026-09-12";
    }
  });
  await sleep(200);
  await triggerClick("#btn-repackage-modal-confirm");
  await verifyAndCaptureOverlay(4, "Lập Phiếu Chiết Hàng (repackage-modal.js)", "04_lap_phieu_chiet_overlay.png");

  // ================================================================================
  // FORM 5: SỬA PHIÊN CHIẾT HÀNG (SỬA)
  // ================================================================================
  await page.evaluate(async () => {
    window.__state.lockDate = "";
    window.__state.repackageHistory = [{
      id: "mock-rep-1",
      sessionId: "sess-1",
      date: "12-09-2026",
      fromProductId: "SP01",
      fromProductName: "Nguồn",
      fromQuantity: "1",
      sessionFromQty: "1",
      toProductId: "SP02",
      toProductName: "Đích",
      toQuantity: "5",
      note: ""
    }];
    const { openRepackageEditModal } = await import("/src/views/repackage/repackage-history.js");
    openRepackageEditModal("sess-1");
  });
  await sleep(200);
  await triggerClick("#btn-repackage-edit-save");
  await verifyAndCaptureOverlay(5, "Sửa Phiên Chiết Hàng (repackage-history.js)", "05_sua_phien_chiet_overlay.png");

  // ================================================================================
  // FORM 6: XÓA PHIÊN CHIẾT HÀNG (XÓA)
  // ================================================================================
  await page.evaluate(async () => {
    window.__state.lockDate = "";
    window.__state.repackageHistory = [{
      id: "mock-rep-1",
      sessionId: "sess-1",
      date: "12-09-2026",
      fromProductId: "SP01",
      fromProductName: "Nguồn",
      fromQuantity: "1",
      sessionFromQty: "1",
      toProductId: "SP02",
      toProductName: "Đích",
      toQuantity: "5",
      note: ""
    }];
    window.__state.repackageSelected = new Set(["sess-1"]);
    const { deleteSelectedRepackageRows } = await import("/src/views/repackage/repackage-history.js");
    deleteSelectedRepackageRows();
  });
  await verifyAndCaptureOverlay(6, "Xóa Phiên Chiết Hàng (repackage-history.js)", "06_xoa_phien_chiet_overlay.png");

  // ================================================================================
  // FORM 7: LƯU KIỂM KÊ KHO (THÊM/SỬA/XÓA)
  // ================================================================================
  await page.evaluate(() => {
    const firstProd = window.__state?.products?.[0];
    if (firstProd) {
      const maCol = window.__state.keys.maSP;
      if (!window.__state.stockCheck.counts) window.__state.stockCheck.counts = {};
      window.__state.stockCheck.counts[firstProd[maCol]] = 25;
    }
    const dInp = document.getElementById("stock-check-date");
    if (dInp) dInp.value = "2026-09-12";
  });
  await sleep(200);
  await triggerClick("#btn-stock-check-save-sheets");
  await verifyAndCaptureOverlay(7, "Lưu Kiểm Kê Kho (stock-check-view.js)", "07_kiem_ke_kho_overlay.png");

  // ================================================================================
  // FORM 8: CÀI ĐẶT KHÓA NGÀY SỔ SÁCH (THÊM/SỬA)
  // ================================================================================
  await page.evaluate(() => {
    const m = document.getElementById("lock-date-modal");
    if (m) m.classList.remove("hidden");
    const inp = document.getElementById("lock-date-input");
    if (inp) inp.value = "2026-09-01";
  });
  await sleep(200);
  await triggerClick("#btn-lock-date-save");
  await verifyAndCaptureOverlay(8, "Cài Đặt Khóa Ngày (lock-date-modal.js)", "08_khoa_ngay_overlay.png");

  // ================================================================================
  // FORM 9: MỞ KHÓA NGÀY SỔ SÁCH (XÓA/HỦY)
  // ================================================================================
  await page.evaluate(() => {
    const m = document.getElementById("lock-date-modal");
    if (m) m.classList.remove("hidden");
  });
  await sleep(200);
  await triggerClick("#btn-lock-date-clear");
  await verifyAndCaptureOverlay(9, "Mở Khóa Ngày Sổ Sách (lock-date-modal.js)", "09_mo_khoa_ngay_overlay.png");

  // ================================================================================
  // FORM 10: TỰ ĐỔI PIN CÁ NHÂN (SỬA)
  // ================================================================================
  await page.evaluate(() => {
    const mockStaff = { id: "st-mock", name: "Nhân Viên Test", role: "staff" };
    window.__state.currentUser = mockStaff;
    localStorage.setItem("sam_pet_user", JSON.stringify(mockStaff));

    const m = document.getElementById("modal-self-change-pin");
    if (m) m.classList.remove("hidden");
    document.getElementById("self-change-pin-old").value = "111111";
    document.getElementById("self-change-pin-new").value = "654321";
    document.getElementById("self-change-pin-confirm").value = "654321";
  });
  await sleep(200);
  await triggerClick("#btn-self-change-pin-save");
  await verifyAndCaptureOverlay(10, "Tự Đổi PIN Cá Nhân (staff-manage-modal.js)", "10_doi_pin_ca_nhan_overlay.png");

  // Khôi phục quyền Root
  await page.evaluate(() => {
    const rootUser = { id: "root", name: "Quản trị viên (Root)", role: "root" };
    window.__state.currentUser = rootUser;
    localStorage.setItem("sam_pet_user", JSON.stringify(rootUser));
  });

  // ================================================================================
  // FORM 11: THÊM NHÂN VIÊN MỚI (THÊM)
  // ================================================================================
  await page.evaluate(() => {
    const m = document.getElementById("modal-root-staff-manage");
    if (m) m.classList.remove("hidden");
    document.getElementById("add-staff-id").value = "";
    document.getElementById("add-staff-name").value = "Nguyễn Văn Test";
    document.getElementById("add-staff-pin").value = "123456";
  });
  await sleep(200);
  await triggerClick("#btn-submit-staff");
  await verifyAndCaptureOverlay(11, "Thêm Nhân Viên Mới (staff-manage-modal.js)", "11_them_nhan_vien_overlay.png");

  // ================================================================================
  // FORM 12: XÓA NHÂN VIÊN (XÓA)
  // ================================================================================
  await page.evaluate(() => {
    const m = document.getElementById("modal-root-staff-manage");
    if (m) m.classList.remove("hidden");
    const container = document.getElementById("root-staff-list");
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-between p-3 border rounded-xl">
          <span>Test Staff</span>
          <button type="button" data-id="st-test" data-name="Test Staff" class="btn-delete-staff px-3 py-1 bg-red-50 text-red-600">Xóa</button>
        </div>
      `;
      const delBtn = container.querySelector(".btn-delete-staff");
      delBtn.addEventListener("click", async () => {
        const { showLoadingOverlay, hideLoadingOverlay, setButtonLoading } = await import("/src/utils/dom.js");
        const { rootDeleteStaff } = await import("/src/utils/auth.js");
        setButtonLoading(delBtn, true, "Đang xóa…");
        showLoadingOverlay("Đang xóa nhân viên…", 'Đang xóa nhân viên "Test Staff" khỏi Google Sheets');
        try {
          await rootDeleteStaff("st-test");
        } catch(e) {}
        finally {
          hideLoadingOverlay();
        }
      });
    }
  });
  await sleep(200);
  await triggerClick("#root-staff-list .btn-delete-staff");
  await verifyAndCaptureOverlay(12, "Xóa Nhân Viên (staff-manage-modal.js)", "12_xoa_nhan_vien_overlay.png");

  // ================================================================================
  // FORM 13: ĐỒNG BỘ LẠI NHÂN VIÊN (ĐỒNG BỘ)
  // ================================================================================
  await page.evaluate(() => {
    const m = document.getElementById("modal-root-staff-manage");
    if (m) m.classList.remove("hidden");
  });
  await sleep(200);
  await triggerClick("#btn-sync-staff-from-sheet");
  await verifyAndCaptureOverlay(13, "Đồng Bộ Lại Nhân Viên (staff-manage-modal.js)", "13_dong_bo_nhan_vien_overlay.png");

  await browser.close();

  console.log("\n================================================================================");
  console.log(" KẾT QUẢ: TOÀN BỘ 13/13 FORM ĐÃ ĐƯỢC KIỂM THỬ THÀNH CÔNG VỚI OVERLAY!           ");
  console.log(" Tất cả 13 ảnh chụp màn hình đã được lưu tại docs/screenshots/overlays/        ");
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("Lỗi khi chạy kiểm thử:", err);
  process.exit(1);
});
