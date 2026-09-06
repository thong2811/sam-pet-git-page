# Git Safety & Workflow Rules (An Toàn Mã Nguồn & Git)

Tài liệu này định nghĩa các quy tắc an toàn bắt buộc khi tương tác với Git và GitHub trong dự án SamPet.

---

## 1. BẮT BUỘC HỎI TRƯỚC KHI COMMIT HOẶC PUSH
- **Tuyệt đối KHÔNG** được tự ý chạy lệnh `git commit` hoặc `git push` mà chưa có sự đồng ý hoặc yêu cầu rõ ràng từ người dùng.
- Khi hoàn thành sửa đổi code, trợ lý AI phải:
  1. Tóm tắt danh sách các file đã thay đổi.
  2. Nêu rõ mục đích của commit.
  3. Xin phép người dùng trước khi thực hiện commit/push.

---

## 2. Quy Chuẩn Thông Điệp Commit (Conventional Commits)
- Thông điệp commit phải viết bằng tiếng Anh, rõ ràng, có ý nghĩa, tuân thủ các tiền tố chuẩn:
  - `feat:` Thêm tính năng mới hoặc view mới.
  - `fix:` Sửa lỗi giao diện, logic hoặc API.
  - `refactor:` Tái cấu trúc mã nguồn nhưng không đổi tính năng (ví dụ: chuẩn hóa tên file, chia nhỏ module).
  - `chore:` Cập nhật cấu hình, dọn dẹp file thừa, dependencies, rules.
  - `docs:` Cập nhật tài liệu, README hoặc tài liệu kỹ thuật.
- Ví dụ:
  - `feat: add category filter to products table`
  - `fix: resolve date parsing issue for mobile safari`
  - `refactor: extract modal logic into separate component`
