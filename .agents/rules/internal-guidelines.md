# Internal Project Guidelines (Nguyên Tắc Vận Hành Dự Án Nội Bộ)

Tài liệu này định nghĩa các nguyên tắc tối ưu cho mô hình ứng dụng nội bộ (Vite + Google Sheets + PWA).

---

## 1. Nguyên Tắc Tối Giản (KISS - Keep It Simple)
- Ưu tiên giải quyết vấn đề bằng Vanilla JS và Tailwind CSS sẵn có.
- Tránh cài đặt thêm các thư viện NPM nặng nếu không thực sự cần thiết, giữ cho ứng dụng nhẹ, tải nhanh trên các thiết bị di động / máy tính bảng tại cửa hàng.

---

## 2. Tối Ưu Quota Google Apps Script (Batching & Debounce)
- Backend Google Sheets miễn phí có giới hạn số lần gọi API và thời gian thực thi (tối đa 6 phút/lần).
- **Batching**: Tuyệt đối không gọi API trong vòng lặp `for` (phải gom toàn bộ mảng dữ liệu gửi batch 1 lần lên endpoint).
- **Debounce**: Mọi ô tìm kiếm, bộ lọc dữ liệu động bắt buộc phải áp dụng hàm `debounce` để tránh spam request liên tục lên backend.

---

## 3. Kiểm Soát Cache & Service Worker (PWA Release)
- Ứng dụng hoạt động dạng PWA trên thiết bị của nhân viên (`public/sw.js`).
- Khi phát hành các tính năng hoặc bản sửa lỗi logic giao diện quan trọng, bắt buộc phải cập nhật tăng `APP_VERSION` trong `public/env.js` để tránh thiết bị người dùng bị kẹt cache JavaScript cũ.
