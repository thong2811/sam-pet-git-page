---
name: ship-feature
description: >-
  Use this skill when the user asks to build, create, or ship a new feature, tab, modal, or management view from A to Z (e.g. "Làm cho tôi tính năng X", "Thêm trang quản lý Y", "Tạo modal Z").
---

# Ship Feature — Tự Động Hóa Xây Dựng Tính Năng Trọn Gói (A-Z)

Kỹ năng này điều phối Agent tự động hóa toàn bộ quy trình phát triển tính năng mới theo chuẩn kiến trúc SamPet (Vite + Vanilla JS + Tailwind + Google Sheets + PWA), hoàn thành trọn gói mọi khâu ngầm và tự kiểm tra build thành công trước khi báo lại cho người dùng.

---

## Quy Trình Tự Động Hóa 5 Bước (Autonomous Loop)

### Bước 1: Khởi Tạo View Module (`src/views/`)
- Tạo thư mục và file mới theo chuẩn **100% tiếng Anh & `kebab-case`** (ví dụ: `src/views/inventory/stock-check-view.js` hoặc `src/views/customer/customer-modal.js`).
- Cấu trúc module bắt buộc tuân theo khuôn mẫu tại [examples/view-template.js.example](./examples/view-template.js.example):
  - Xuất các hàm chuẩn: `init<Feature>View()`, `render<Feature>()`.
  - Dùng tiện ích `$` và `$$` từ `src/utils/dom.js`.
  - **Bảo mật XSS**: Bọc `escapeHtml()` cho toàn bộ dữ liệu động đưa vào `innerHTML`.
  - **Bảo vệ khóa ngày**: Luôn gọi `isDateLocked(date)` trước mọi hành động lưu/sửa/xóa/xuất.
  - Phản hồi trực quan bằng `toast(message, 'success' | 'error')` từ `src/utils/toast.js`.

### Bước 2: Quản Lý Trạng Thái (`src/state/app-state.js`)
- Nếu tính năng cần lưu trữ dữ liệu phiên, thêm trường tương ứng vào đối tượng tập trung `state`:
  ```javascript
  export const state = {
    ...
    myFeature: {
      items: [],
      filter: "",
      selectedId: null
    }
  };
  ```

### Bước 3: Đấu Nối API Backend (Nếu cần)
- Nếu tính năng cần gọi Google Sheets qua Google Apps Script, khai báo hàm mới trong `src/services/api.js`.
- Tuân thủ quy tắc:
  - Luôn thêm dấu nháy đơn `'` cho các trường ID/Mã sản phẩm để tránh Google Sheets làm mất số 0 đầu.
  - Áp dụng batching mảng dữ liệu (không gọi API trong vòng lặp `for`).

### Bước 4: Tích Hợp Router & HTML (`index.html` & `src/main.js`)
- Thêm khung giao diện / tab mới vào `index.html` (dùng class Tailwind đồng bộ với design system SamPet).
- Import và gọi hàm `init...()` trong `src/main.js`.
- Đấu nối sự kiện chuyển Tab / hiển thị Modal nếu là tính năng màn hình mới.

### Bước 5: Tự Động Kiểm Tra Build (Self-Verification)
- Agent bắt buộc tự chạy lệnh kiểm tra:
  ```powershell
  npm run build
  ```
- Nếu phát sinh bất kỳ lỗi cú pháp hoặc import sai đường dẫn, Agent phải tự sửa ngay lập tức cho đến khi build ra mã thoát 0 (`✓ built in ...s`).
- Báo cáo kết quả ngắn gọn, súc tích cho người dùng: *"Đã hoàn thành tính năng X, bạn có thể tải lại trang hoặc bấm tab X để trải nghiệm"*.
