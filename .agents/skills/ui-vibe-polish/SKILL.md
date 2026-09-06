---
name: ui-vibe-polish
description: >-
  Use this skill when the user asks to polish the UI, improve mobile responsiveness, make buttons/components look better, add animations, or format displays (e.g. "Tối ưu lại giao diện", "Làm cho nút này đẹp hơn", "Chỉnh lại UI mobile", "Thêm hiệu ứng", "Format lại tiền/ngày").
---

# UI Vibe Polish — Gọt Giũa Giao Diện & Nâng Tầm Trải Nghiệm Mobile

Kỹ năng này giúp Agent tự động nâng cấp giao diện của SamPet lên chuẩn hiện đại, mượt mà và tối ưu tuyệt đối cho nhân viên thao tác trên điện thoại hoặc máy tính bảng tại cửa hàng.

---

## Tiêu Chuẩn Giao Diện SamPet (UI/UX Guidelines)

### 1. Chuẩn Cảm Ứng Di Động (Mobile Touch Target & Padding)
- Mọi nút bấm (`button`), ô chọn (`checkbox`, `radio`), thanh điều hướng tab phải đạt kích thước tối thiểu **44px x 44px** (tương đương `min-h-[44px]`, `py-2.5 px-4` trong Tailwind).
- Ngăn chặn hoàn toàn hiện tượng bấm nhầm giữa các dòng sản phẩm hoặc nút xóa.

### 2. Bảng Màu Thương Hiệu (Brand Palette)
- Màu chủ đạo: Dải màu Cam & Hổ phách (`amber-500`, `orange-500`, gradient `from-amber-500 to-orange-500`).
- Màu nền và thẻ: `bg-slate-50` cho nền chung, `bg-white` cho thẻ card với viền mờ `border border-slate-200/80` và bóng đổ nhẹ `shadow-sm hover:shadow-md`.
- Màu chữ: `text-slate-800` cho tiêu đề, `text-slate-500` cho phụ đề/nhãn.

### 3. Hiệu Ứng Tương Tác & Vi Chuyển Động (Micro-Animations)
- Nút bấm phải có phản hồi xúc giác khi chạm: thêm class `active:scale-95 transition-all duration-150`.
- Nút đang xử lý tải (Loading button):
  - Tự động khóa nút: `btn.disabled = true`.
  - Hiển thị spinner xoay: thêm SVG với class `animate-spin`.
- Modal xuất hiện mượt mà: Có lớp nền mờ `backdrop-blur-sm bg-black/40` và hiệu ứng xuất hiện nhẹ.

### 4. Chuẩn Hóa Định Dạng Hiển Thị (VN Formatters)
- **Tiền tệ**: Luôn dùng hàm `formatTien(amount)` để hiển thị chuẩn định dạng Việt Nam kèm hậu tố `đ` (ví dụ: `150.000 đ`).
- **Ngày tháng**: Luôn hiển thị theo thứ tự `DD-MM-YYYY` qua hàm `formatNgayXuat(date)`.

### 5. Thay Thế Hộp Thoại Thô Sơ
- **Tuyệt đối không dùng** hàm `window.alert()` làm đơ giao diện trình duyệt.
- Thay thế hoàn toàn bằng hàm `toast(message, 'success' | 'error' | 'info')` từ `src/utils/toast.js`.
- Các hành động nguy hiểm (như xóa phiếu, xóa lịch sử): Dùng Modal xác nhận chuyên dụng hoặc xác nhận rõ ràng.
