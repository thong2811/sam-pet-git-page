# Coding & Naming Standards (Chuẩn Coding & Đặt Tên)

Tài liệu này định nghĩa các tiêu chuẩn mã nguồn bắt buộc trong dự án SamPet.

---

## 1. Quy Ước Đặt Tên Tệp & Thư Mục (File & Directory Naming)
- **BẮT BUỘC TIẾNG ANH 100%**: Tất cả tên tệp và tên thư mục trong toàn bộ dự án phải được viết hoàn toàn bằng tiếng Anh. Tuyệt đối không dùng tiếng Việt hay tiếng Việt không dấu (ví dụ: dùng `export/` thay vì `xuat-hang/`, `repackage/` thay vì `chiet-hang/`, `ticket-view.js` thay vì `phieu-view.js`).
- **Định dạng `kebab-case`**: Sử dụng chữ thường ngăn cách bằng dấu gạch ngang cho toàn bộ tệp `.js`, `.css`, `.html`, `.md` (ví dụ: `products-view.js`, `repackage-form.js`, `app-state.js`, `edit-row-modal.js`).
- Tuyệt đối không dùng `camelCase`, `PascalCase`, khoảng trắng hay ký tự đặc biệt cho tên file và thư mục trong dự án.

---

## 2. Quy Ước Đặt Tên Biến & Hàm (Variables & Functions)
- **Biến và hàm thông thường**: Dùng `camelCase` (ví dụ: `formatNgayXuat`, `loadSheetHistory`, `totalAmount`).
- **Hằng số cấu hình toàn cục**: Dùng `UPPER_SNAKE_CASE` (ví dụ: `LOCK_DATE_PIN`, `EXPORT_HEADER`, `CONFIG`).
- **Hàm xử lý sự kiện**: Bắt đầu bằng tiền tố `handle...` hoặc `on...` (ví dụ: `handleRowClick`, `onAddClick`, `handlePhieuEvents`).
- **Hàm trả về Boolean**: Bắt đầu bằng tiền tố `is...`, `has...`, `can...` (ví dụ: `isDateLocked`, `hasValidTargets`).

---

## 3. Quy Ước Đặt Tên Phần Tử DOM (HTML ID & Data Attributes)
- **ID phần tử HTML**: Dùng `kebab-case` có tiền tố/hậu tố phân loại rõ ràng:
  - Nút bấm: Bắt buộc có tiền tố `btn-...` (ví dụ: `btn-xuat-sheets`, `btn-history-delete`, `btn-lock-date-save`).
  - Modal: Bắt buộc có hậu tố `...-modal` (ví dụ: `edit-modal`, `lock-date-modal`, `export-modal`).
  - Ô tìm kiếm / bộ lọc: `...-search`, `...-filter-date`.
  - Vùng hiển thị / container: `...-container`, `...-cards`, `...-body`.
- **Thuộc tính dữ liệu sự kiện**: Dùng `data-action="..."` (ví dụ: `data-action="qty-inc"`, `data-action="delete"`, `data-action="edit"`).

---

## 4. Tiêu Chuẩn Chất Lượng Mã Nguồn (Code Quality)
- Dùng cú pháp ES6+ hiện đại (`const`, `let`, `arrow function`, `async/await`, `template literals`). Tuyệt đối không dùng `var`.
- Không lưu biến trạng thái toàn cục rải rác ngoài module `src/state/app-state.js`.
- **Bảo mật XSS**: Luôn bọc hàm `escapeHtml()` cho bất kỳ chuỗi dữ liệu động nào được chèn vào qua `innerHTML`.
- Luôn bọc các lời gọi API và logic bất đồng bộ trong khối `try...catch` và có thông báo `toast` phản hồi trực quan cho người dùng.
