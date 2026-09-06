# Antigravity Agent Workspace Customizations

Thư mục này chứa cấu hình tùy biến toàn diện dành riêng cho trợ lý **Google Antigravity AI** trong dự án SamPet theo chuẩn **Enterprise Best Practice**.

---

## Cấu Trúc Toàn Diện

```text
.agents/
├── README.md                      # Hướng dẫn tổng quan & cách mở rộng customizations
├── AGENTS.md                      # Hướng dẫn cốt lõi (Core Guidelines) cho AI Agent
├── skills.json                    # Khai báo đăng ký các skills của workspace
├── hooks.json                     # Cấu hình Lifecycle Hooks (PreToolUse, PostToolUse...)
│
├── rules/                         # Các bộ quy tắc phân tầng (Rules) tự động nạp
│   ├── coding-standards.md        # Chuẩn đặt tên tiếng Anh, kebab-case, cú pháp ES6+, bảo mật XSS
│   ├── git-safety.md              # BẮT BUỘC hỏi trước khi commit/push, conventional commit
│   ├── warehouse-domain.md        # Quy tắc Khóa ngày, chiết 1 nguồn -> N đích, format mã SP "'"
│   └── internal-guidelines.md     # Triết lý tối giản KISS, tối ưu Quota GAS, cache PWA
│
└── skills/                        # Các quy trình tác vụ chuyên biệt (On-demand Progressive Skills)
    ├── deploy-backend/            # Quy trình deploy Google Apps Script bằng Clasp & deploy.js
    │   └── SKILL.md
    └── pwa-release/               # Quy trình cập nhật phiên bản PWA, Service Worker & cache
        └── SKILL.md
```

---

## Vai Trò & Cơ Chế Hoạt Động
1. **`AGENTS.md`**: Đóng vai trò là bảng điều phối trung tâm, định nghĩa kiến trúc cốt lõi và liên kết tới các rules chi tiết.
2. **`skills.json`**: Khai báo danh mục skills chính thức của dự án cho Antigravity discovery engine.
3. **`hooks.json`**: Quản lý các trigger vòng đời (Lifecycle Hooks) để kiểm tra an toàn hoặc tự động xác minh mã nguồn trước/sau khi công cụ thực thi.
4. **`rules/`**: Bộ quy tắc chuyên sâu, được AI tự động nạp vào bộ nhớ ngữ cảnh khi thao tác với các module tương ứng.
5. **`skills/`**: Hướng dẫn chi tiết từng bước cho các tác vụ phức tạp (chỉ nạp khi người dùng yêu cầu).
