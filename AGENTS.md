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
- **`src/views/`**: Chia nhỏ theo từng màn hình nghiệp vụ (tên thư mục & file 100% tiếng Anh):
  - `export/`: Bảng SP (`products-view.js`), giỏ hàng phiếu xuất (`ticket-view.js`), lịch sử Sheets (`history-view.js`), modal xuất (`export-modal.js`).
  - `repackage/`: Form lập phiếu 1 Nguồn -> N Đích (`repackage-form.js`), lịch sử chiết (`repackage-history.js`), modal chiết (`repackage-modal.js`).
  - `common/`: Các modal dùng chung (`lock-date-modal.js`, `edit-row-modal.js`).
- **`src/utils/`**: Các tiện ích dùng chung (`dom.js`, `formatters.js`, `toast.js`).

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

---

## 5. Chuẩn Coding & Quy Ước Đặt Tên (Naming & Coding Standards)
1. **Quy ước đặt tên tệp & thư mục (File & Directory Naming)**:
   - **BẮT BUỘC TIẾNG ANH 100%**: Tất cả tên tệp và tên thư mục trong toàn bộ dự án phải được viết hoàn toàn bằng tiếng Anh. Tuyệt đối không dùng tiếng Việt hay tiếng Việt không dấu (ví dụ: dùng `export/` thay vì `xuat-hang/`, `repackage/` thay vì `chiet-hang/`, `ticket-view.js` hoặc `cart-view.js` thay vì `phieu-view.js`).
   - **Định dạng `kebab-case`**: Sử dụng chữ thường ngăn cách bằng dấu gạch ngang cho toàn bộ tệp `.js`, `.css`, `.html`, `.md` (ví dụ: `products-view.js`, `repackage-form.js`, `app-state.js`, `edit-row-modal.js`).
   - Tuyệt đối không dùng `camelCase`, `PascalCase`, khoảng trắng hay ký tự đặc biệt cho tên file và thư mục trong dự án.
2. **Quy ước đặt tên biến & hàm (Variables & Functions)**:
   - Biến và hàm thông thường: Dùng `camelCase` (ví dụ: `formatNgayXuat`, `loadSheetHistory`, `totalAmount`).
   - Hằng số cấu hình toàn cục: Dùng `UPPER_SNAKE_CASE` (ví dụ: `LOCK_DATE_PIN`, `EXPORT_HEADER`, `CONFIG`).
   - Hàm xử lý sự kiện: Bắt đầu bằng tiền tố `handle...` hoặc `on...` (ví dụ: `handleRowClick`, `onAddClick`, `handlePhieuEvents`).
   - Hàm trả về giá trị Boolean: Bắt đầu bằng tiền tố `is...`, `has...`, `can...` (ví dụ: `isDateLocked`, `hasValidTargets`).
3. **Quy ước đặt tên phần tử DOM (HTML ID & Data Attributes)**:
   - ID phần tử HTML dùng `kebab-case` có tiền tố phân loại rõ ràng:
     - Nút bấm: Bắt buộc có tiền tố `btn-...` (ví dụ: `btn-xuat-sheets`, `btn-history-delete`, `btn-lock-date-save`).
     - Modal: Bắt buộc có hậu tố `...-modal` (ví dụ: `edit-modal`, `lock-date-modal`, `export-modal`).
     - Ô tìm kiếm / bộ lọc: `...-search`, `...-filter-date`.
     - Vùng hiển thị / container: `...-container`, `...-cards`, `...-body`.
   - Thuộc tính dữ liệu sự kiện: Dùng `data-action="..."` (ví dụ: `data-action="qty-inc"`, `data-action="delete"`, `data-action="edit"`).
4. **Tiêu chuẩn chất lượng mã nguồn (Code Quality)**:
   - Dùng cú pháp ES6+ hiện đại (`const`, `let`, `arrow function`, `async/await`, `template literals`). Tuyệt đối không dùng `var`.
   - Tránh lưu biến toàn cục rải rác ngoài module `src/state/app-state.js`.
   - **Bảo mật XSS**: Luôn bọc hàm `escapeHtml()` cho bất kỳ chuỗi động nào được chèn vào qua `innerHTML`.
   - Luôn bọc các lời gọi API và logic bất đồng bộ trong khối `try...catch` và có thông báo `toast` phản hồi trực quan cho người dùng.

---

## 6. Quy Tắc Thao Tác Git & An Toàn Mã Nguồn (Bắt Buộc)
- **BẮT BUỘC HỎI TRƯỚC KHI COMMIT HOẶC PUSH**:
  - Tuyệt đối **KHÔNG** được tự ý chạy lệnh `git commit` hoặc `git push` mà chưa có sự đồng ý hoặc yêu cầu rõ ràng từ người dùng.
  - Khi hoàn thành sửa đổi code, trợ lý phải tóm tắt danh sách các file đã thay đổi và xin phép/hỏi người dùng có muốn commit/push hay không.
- **Quy chuẩn thông điệp Commit (Conventional Commits)**:
  - Thông điệp commit phải viết rõ ràng, có ý nghĩa, sử dụng tiền tố chuẩn:
    - `feat:` Thêm tính năng mới hoặc view mới.
    - `fix:` Sửa lỗi giao diện, logic hoặc API.
    - `refactor:` Tái cấu trúc mã nguồn nhưng không đổi tính năng.
    - `chore:` Cập nhật cấu hình, dọn dẹp file thừa, dependencies.
    - `docs:` Cập nhật tài liệu, README hoặc rule.

---

## 7. Nguyên Tắc Vận Hành Dự Án Nội Bộ (Pragmatic Guidelines)
1. **Nguyên tắc Tối giản (KISS - Keep It Simple)**:
   - Ưu tiên giải quyết vấn đề bằng Vanilla JS và Tailwind CSS hiện có.
   - Hạn chế tối đa việc cài thêm thư viện NPM nặng nếu không thực sự cần thiết, giữ cho ứng dụng nhẹ, khởi động nhanh trên thiết bị di động của nhân viên.
2. **Tối ưu Quota Google Apps Script (Batching & Debounce)**:
   - Backend Google Sheets miễn phí có giới hạn số lần gọi và thời gian chạy tối đa (6 phút/lần).
   - Tuyệt đối không gọi API trong vòng lặp (phải gom mảng dữ liệu gửi batch 1 lần).
   - Mọi ô tìm kiếm, lọc dữ liệu động bắt buộc phải áp dụng `debounce` để tránh spam request làm nghẽn script.
3. **Kiểm soát Cache & Service Worker (PWA)**:
   - Ứng dụng hoạt động dạng PWA trên thiết bị của nhân viên.
   - Khi phát hành các tính năng hoặc bản sửa lỗi logic giao diện quan trọng, cần cập nhật tăng `APP_VERSION` trong `public/env.js` để tránh thiết bị người dùng bị kẹt cache JavaScript cũ trong Service Worker.


