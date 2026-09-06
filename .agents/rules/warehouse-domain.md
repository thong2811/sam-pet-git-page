# Warehouse & Accounting Domain Rules (Quy Tắc Kho & Kế Toán)

Tài liệu này định nghĩa các quy tắc nghiệp vụ cốt lõi không bao giờ được phép vi phạm khi thao tác với dữ liệu kho và kế toán của SamPet.

---

## 1. Bảo Vệ Khóa Ngày Sổ Sách (Lock Date Protection)
- **Kiểm tra bắt buộc**: Trước khi thực hiện bất kỳ hành động thêm phiếu xuất, chiết hàng, sửa hoặc xóa dòng dữ liệu lịch sử, hệ thống **luôn luôn** phải gọi hàm `isDateLocked(date)`:
  - Nếu ngày của phiếu/dòng dữ liệu `≤ lockDate`, hệ thống phải chặn lại và hiển thị thông báo cảnh báo người dùng.
- **Mã PIN bảo mật**: Thao tác thay đổi khóa ngày hoặc mở khóa ngày bắt buộc phải yêu cầu nhập đúng mã PIN `LOCK_DATE_PIN` cấu hình trong `public/env.js`.

---

## 2. Quy Tắc Chiết Hàng 1 Nguồn &rarr; N Đích (Repackage Flow)
Khi tạo hoặc cập nhật một phiên chiết hàng gồm N dòng hàng đích:
- **Dòng đầu tiên (`idx === 0`)**: Ghi nhận `fromQuantity = srcQty`.
- **Các dòng tiếp theo (`idx > 0`)**: Ghi nhận `fromQuantity = 0` (để tránh Google Sheets tính tổng cộng dồn làm sai lệch số lượng xuất kho nguồn).

---

## 3. Định Dạng Dữ Liệu Đồng Bộ Lên Google Sheets
- **Bảo toàn chuỗi cho Mã SP & ID**: Khi gửi các trường mã định danh (`id`, `productId`, `fromProductId`, `toProductId`) lên Google Sheets, **luôn thêm tiền tố dấu nháy đơn `'`** (ví dụ: `row.productId = "'" + cleanId`) để tránh việc Google Sheets tự động parse thành số và làm mất các chữ số `0` ở đầu.
- **Định dạng ngày hiển thị**: Thống nhất hiển thị ngày tháng theo định dạng `DD-MM-YYYY`.
