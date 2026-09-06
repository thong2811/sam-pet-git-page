# Hướng Dẫn & Quy Tắc Dự Án SamPet (Project Rules)

Tài liệu này định nghĩa các tiêu chuẩn kỹ thuật, kiến trúc và quy tắc nghiệp vụ bắt buộc khi phát triển hoặc bảo trì dự án SamPet.

---

## 1. Kiến Trúc & Công Nghệ
- **Build Tool**: Dự án sử dụng **Vite**. Không dùng Webpack hay các bundler khác.
- **Ngôn ngữ**: Vanilla JavaScript (ES Modules hiện đại). Không tùy tiện cài thêm các framework nặng (React/Vue) trừ khi có yêu cầu cụ thể.
- **CSS**: Sử dụng **Tailwind CSS v3** nội bộ qua PostCSS và `src/style.css`. Tuyệt đối **không** nạp script CDN Tailwind.
- **File `index.html`**: Chỉ chứa khung HTML giao diện gốc. Tuyệt đối **không** viết thêm code JS logic inline hay `<style>` cục bộ lớn vào file này.

---

## 2. Tổ Chức Thư Mục & Mã Nguồn
- **`public/`**: Thư mục chứa toàn bộ tài nguyên tĩnh nguyên bản (`public/env.js`, `public/favicon.ico`, `public/manifest.json`, `public/products.csv`, `public/sw.js`, `public/icons/`). Không tạo các file trùng lặp này ở thư mục gốc.
- **`src/services/`**: Nơi duy nhất chứa các hàm gọi API Google Apps Script và nạp file CSV danh mục.
- **`src/state/`**: Quản lý state tập trung (`state.phieu`, `state.sheetHistory`, `state.repackage`,...).
- **`src/views/`**: Chia nhỏ theo từng màn hình nghiệp vụ:
  - `xuat-hang/`: Bảng SP, giỏ hàng phiếu xuất, lịch sử Sheets, modal xác nhận xuất.
  - `chiet-hang/`: Form lập phiếu 1 Nguồn -> N Đích, lịch sử chiết, modal chiết.
  - `common/`: Các modal dùng chung (Khóa ngày, Sửa dòng).
- **`src/utils/`**: Các tiện ích dùng chung (format tiền, ngày tháng, escapeHtml, toast, dom).

---

## 3. Quy Tắc Nghiệp Vụ Kho & Kế Toán (Bắt Buộc)
1. **Bảo vệ Khóa Ngày Sổ Sách (Lock Date)**:
   - Trước khi thực hiện bất kỳ hành động thêm phiếu xuất, chiết hàng, sửa hoặc xóa dữ liệu, luôn phải kiểm tra hàm `isDateLocked(date)`.
   - Nếu ngày của phiếu/dòng thuộc khoảng `≤ lockDate`, hệ thống phải chặn lại và cảnh báo người dùng.
   - Thao tác khóa hoặc mở khóa sổ sách bắt buộc phải nhập đúng mã PIN `LOCK_DATE_PIN` trong cấu hình.
2. **Quy tắc Chiết Hàng 1 Nguồn &rarr; N Đích**:
   - Khi tạo hoặc cập nhật một phiên chiết hàng gồm N dòng hàng đích:
     - Dòng đầu tiên (`idx === 0`): Ghi nhận `fromQuantity = srcQty`.
     - Các dòng tiếp theo (`idx > 0`): Ghi nhận `fromQuantity = 0` (để tránh Google Sheets cộng dồn làm sai lệch tổng xuất kho nguồn).
3. **Định dạng Mã SP & ID**:
   - Khi gửi các trường mã (`id`, `productId`, `fromProductId`, `toProductId`) lên Google Sheets, luôn thêm tiền tố dấu nháy đơn `'` (ví dụ: `row.productId = "'" + cleanId`) để bảo toàn định dạng chuỗi, tránh mất số 0 đầu.
   - Định dạng ngày tháng hiển thị thống nhất là `DD-MM-YYYY`.

---

## 4. Quy Trình Backend & CI/CD
- **Google Apps Script**:
  - Mã nguồn backend nằm tại `backend/Code.gs`.
  - Đồng bộ backend lên Google bằng lệnh: `npm run deploy` (`scripts/deploy.js`).
  - Khi thay đổi `action` API ở backend, phải cập nhật tương ứng trong `src/services/api.js`.
- **Deploy GitHub Pages**:
  - Khi push code lên nhánh `main`, GitHub Actions (`.github/workflows/deploy.yml`) sẽ tự động chạy `npm install` và `npm run build` để deploy thư mục `dist/`.
