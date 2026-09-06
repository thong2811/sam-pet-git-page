# Antigravity Agent Workspace Customizations

Thư mục này chứa cấu hình tùy biến dành riêng cho trợ lý **Google Antigravity AI** trong dự án SamPet theo chuẩn **Antigravity Best Practice**.

---

## Cấu Trúc Hệ Thống

```text
.agents/
├── README.md                      # Giới thiệu tổng quan hệ thống .agents
├── rules/                         # Các quy tắc chuyên biệt theo từng mảng
│   ├── coding-standards.md        # Chuẩn đặt tên tiếng Anh, kebab-case, cú pháp ES6+, bảo mật XSS
│   ├── git-safety.md              # BẮT BUỘC hỏi trước khi commit/push, conventional commit
│   ├── warehouse-domain.md        # Quy tắc Khóa ngày, chiết 1 nguồn -> N đích, format mã SP
│   └── internal-guidelines.md     # Triết lý tối giản KISS, tối ưu Quota GAS, cache PWA
└── skills/                        # Kịch bản tác vụ nhiều bước (On-demand - Progressive Disclosure)
    ├── deploy-backend/
    │   └── SKILL.md               # Quy trình deploy Google Apps Script bằng Clasp & deploy.js
    └── pwa-release/
        └── SKILL.md               # Quy trình cập nhật phiên bản PWA, Service Worker & cache
```

---

## Vai Trò & Cơ Chế Hoạt Động
- **`rules/`**: Được Antigravity tự động quét và áp dụng trong quá trình làm việc với mã nguồn tương ứng.
- **`skills/`**: Được AI nạp vào bộ nhớ ngữ cảnh chỉ khi người dùng yêu cầu thực hiện tác vụ liên quan (tiết kiệm token tối đa).
- **`AGENTS.md` (ở thư mục gốc)**: Đóng vai trò là bảng điều khiển trung tâm (Master Dashboard) liên kết toàn bộ hệ thống.
