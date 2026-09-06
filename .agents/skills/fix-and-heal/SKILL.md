---
name: fix-and-heal
description: >-
  Use this skill when the user reports a bug, error, broken UI, failed action, or build failure (e.g. "Trang bị lỗi rồi", "Bấm nút không phản hồi", "Giao diện bị vỡ", "Build bị lỗi", "Fix lỗi này giúp tôi").
---

# Fix & Heal — Tự Động Chẩn Đoán & Chữa Lành Lỗi Hệ Thống

Kỹ năng này điều phối Agent tự động truy vết nguyên nhân gốc rễ (Root Cause Analysis), sửa mã nguồn và tự kiểm tra xác nhận đã giải quyết dứt điểm lỗi trước khi phản hồi người dùng.

---

## Quy Trình Chẩn Đoán & Tự Sửa Lỗi 4 Bước

### Bước 1: Thu Thập Triệu Chứng & Truy Vết Gốc Rễ
Khi người dùng báo lỗi, Agent chủ động phân loại vào 1 trong các nhóm lỗi phổ biến của SamPet:
1. **Lỗi Biên Dịch / Import (Vite Build Error)**:
   - Sai đường dẫn import (`./views/...` vs `../...`), thiếu đuôi `.js`, tên file chưa đổi sang tiếng Anh.
2. **Lỗi Tương Tác DOM (Button không ăn / Click không chạy)**:
   - ID phần tử trong JS không khớp với `index.html` (ví dụ: `$('btn-export')` nhưng trong HTML là `id="btn-xuat-sheets"`).
   - Sự kiện bị nạp trước khi DOM tải xong hoặc bị gán đè.
3. **Lỗi Nghiệp Vụ Kho & Google Sheets**:
   - Dữ liệu bị chặn do thuộc ngày khóa sổ sách (`isDateLocked(date)` trả về `true`).
   - Mất số 0 đầu ở mã sản phẩm (quên thêm dấu nháy đơn `'` trước khi gửi lên Sheets).
   - Lệch số lượng chiết hàng (quên gán `fromQuantity = 0` cho các dòng đích từ dòng thứ 2 trở đi).
4. **Lỗi Vỡ Giao Diện HTML/CSS**:
   - Chèn chuỗi có ký tự đặc biệt (`"`, `<`, `>`) vào `innerHTML` mà không qua `escapeHtml()`, làm vỡ cấu trúc thẻ HTML.

### Bước 2: Sửa Mã Nguồn Tận Gốc (Root Cause Fix)
- Mở chính xác file gây lỗi và tiến hành sửa chữa.
- Tuyệt đối không vá tạm bợ (workaround) hay bọc `try...catch` rỗng làm giấu lỗi.
- Đảm bảo giữ nguyên các logic nghiệp vụ kho cốt lõi.

### Bước 3: Tự Động Kiểm Tra & Tái Xác Nhận (Verification)
- Chạy lệnh build kiểm tra:
  ```powershell
  npm run build
  ```
- Nếu còn bất kỳ lỗi nào xuất hiện, tiếp tục vòng lặp sửa cho đến khi `vite build` báo thành công 100%.

### Bước 4: Báo Cáo Súc Tích Cho Người Dùng
- Tránh giải thích dài dòng lý thuyết. Báo cáo trực diện theo mẫu:
  > *"Đã sửa xong lỗi [Mô tả ngắn gọn] tại [Tên file]. Nguyên nhân do [Lý do]. Bạn chỉ cần tải lại trang (F5) là sử dụng bình thường!"*
