---
name: safe-checkpoint
description: >-
  Use this skill when the user wants to create a safety checkpoint before risky edits, or asks to rollback to a previous state (e.g. "Tạo checkpoint", "Lưu bản này lại trước khi thử", "Quay lại bản cũ", "Rollback giúp tôi").
---

# Safe Checkpoint — Phao Cứu Sinh & Khôi Phục Tức Thì

Kỹ năng này cung cấp cơ chế "phao cứu sinh" an toàn tuyệt đối cho người dùng khi vibe coding. Bạn có thể tự do thử nghiệm những ý tưởng mạo hiểm nhất mà không sợ mất code hay hỏng dữ liệu, vì có thể quay ngược thời gian bất cứ lúc nào.

---

## 1. Quy Trình Tạo Checkpoint Mới

Khi người dùng nói *"Tạo checkpoint"*, *"Lưu bản này trước khi làm tiếp"*, hoặc trước khi Agent thực hiện một đợt tái cấu trúc quy mô lớn:

### Bước 1: Lưu Trạng Thái Git Cục Bộ
1. Tạo một Git Tag đánh dấu mốc thời gian:
   ```powershell
   $tag = "checkpoint-" + (Get-Date -Format "yyyyMMdd-HHmmss")
   git tag $tag
   ```
2. Nếu đang có thay đổi dở dang chưa commit, tạo thêm Git Stash đánh dấu:
   ```powershell
   git stash save "vibe-checkpoint-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
   ```

### Bước 2: Sao Lưu Dữ Liệu Tĩnh Nhạy Cảm
Tạo bản sao lưu cho các file dữ liệu cấu hình quan trọng vào thư mục `.agents/checkpoints/`:
- `public/products.csv`
- `public/env.js`

### Bước 3: Thông Báo Cho Người Dùng
Báo cáo lại:
> *"Đã tạo thành công phao cứu sinh `checkpoint-YYYYMMDD-HHmmss`. Bây giờ bạn có thể thoải mái thử nghiệm ý tưởng mới! Nếu không ưng ý, bạn chỉ cần nói 'Quay lại bản cũ' là xong."*

---

## 2. Quy Trình Phục Hồi (Rollback Tức Thì)

Khi người dùng nói *"Quay lại bản cũ"*, *"Rollback"*, hoặc *"Bỏ hết những gì vừa làm"*:

### Bước 1: Khôi Phục Mã Nguồn
1. Hủy bỏ các file đang chỉnh sửa dở dang:
   ```powershell
   git restore .
   git clean -fd src/
   ```
2. Tìm và quay về Tag checkpoint gần nhất:
   ```powershell
   git checkout <checkpoint-tag>
   ```

### Bước 2: Khôi Phục Dữ Liệu
Khôi phục đè lại `public/products.csv` và `public/env.js` từ bản backup trong `.agents/checkpoints/` (nếu có).

### Bước 3: Kiểm Tra Lại Bản Build
Chạy kiểm tra lại để đảm bảo trạng thái sau khôi phục hoạt động hoàn hảo:
```powershell
npm run build
```

### Bước 4: Báo Cáo
> *"Đã khôi phục hoàn toàn 100% về checkpoint gần nhất! Toàn bộ mã nguồn và dữ liệu đã an toàn trở về trạng thái ổn định."*
