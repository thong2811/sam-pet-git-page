# Hướng Dẫn & Quy Tắc Dự Án SamPet (Project Rules)

Tài liệu này định nghĩa kiến trúc cốt lõi và đóng vai trò mục lục điều phối toàn bộ hệ thống quy tắc của dự án SamPet. 
Các quy tắc chi tiết được module hóa tại thư mục [`.agents/rules/`](file:///.agents/rules/) theo chuẩn **Google Antigravity Best Practice**.

---

## 1. Kiến Trúc & Công Nghệ Cốt Lõi
- **Build Tool**: Dự án sử dụng **Vite**. Không dùng Webpack hay các bundler khác.
- **Ngôn ngữ**: Vanilla JavaScript (ES Modules hiện đại). Không cài framework nặng (React/Vue).
- **CSS**: Sử dụng **Tailwind CSS v3** nội bộ qua PostCSS và `src/style.css`. Tuyệt đối **không** nạp script CDN Tailwind.
- **File `index.html`**: Chỉ chứa khung HTML giao diện gốc. Tuyệt đối **không** viết thêm code JS logic inline hay `<style>` cục bộ lớn vào file này.

---

## 2. Tổ Chức Thư Mục & Mã Nguồn
- **`public/`**: Thư mục chứa toàn bộ tài nguyên tĩnh nguyên bản (`public/env.js`, `public/favicon.ico`, `public/manifest.json`, `public/products.csv`, `public/sw.js`, `public/icons/`). Không tạo file trùng lặp ở thư mục gốc.
- **`src/services/`**: Nơi duy nhất chứa các hàm gọi API Google Apps Script và nạp file CSV danh mục (`api.js`).
- **`src/state/`**: Quản lý state tập trung (`state.phieu`, `state.sheetHistory`, `state.repackage`,...).
- **`src/views/`**: Chia nhỏ theo từng màn hình nghiệp vụ (100% tiếng Anh & kebab-case):
  - `export/`: Bảng SP (`products-view.js`), giỏ hàng phiếu xuất (`ticket-view.js`), lịch sử Sheets (`history-view.js`), modal xuất (`export-modal.js`).
  - `repackage/`: Form lập phiếu 1 Nguồn -> N Đích (`repackage-form.js`), lịch sử chiết (`repackage-history.js`), modal chiết (`repackage-modal.js`).
  - `common/`: Các modal dùng chung (`lock-date-modal.js`, `edit-row-modal.js`).
- **`src/utils/`**: Các tiện ích dùng chung (`dom.js`, `formatters.js`, `toast.js`).
- **`backend/`**: Mã nguồn Google Apps Script backend (`Code.gs`, `appsscript.json`).

---

## 3. Quy Trình Backend & CI/CD
- **Google Apps Script**:
  - Mã nguồn backend nằm tại `backend/Code.gs`.
  - Đồng bộ backend lên Google bằng lệnh: `npm run deploy` (`scripts/deploy.js`).
  - Xem kỹ năng tự động hóa: [deploy-backend skill](file:///.agents/skills/deploy-backend/SKILL.md).
- **Deploy GitHub Pages**:
  - Khi push code lên nhánh `main`, GitHub Actions (`.github/workflows/deploy.yml`) sẽ tự động chạy `npm install` và `npm run build` để deploy thư mục `dist/`.

---

## 4. Hệ Thống Quy Tắc Module Hóa (.agents/rules/)

Để đảm bảo chất lượng mã nguồn và nghiệp vụ, Agent bắt buộc phải tuân thủ các quy tắc chi tiết sau:

| Quy Tắc Chuyên Biệt | Đường Dẫn | Nội Dung Trọng Tâm |
| :--- | :--- | :--- |
| **An Toàn Git** | [.agents/rules/git-safety.md](file:///.agents/rules/git-safety.md) | **BẮT BUỘC HỎI TRƯỚC KHI COMMIT/PUSH**. Chuẩn Conventional Commits. |
| **Chuẩn Coding & Naming** | [.agents/rules/coding-standards.md](file:///.agents/rules/coding-standards.md) | **100% tiếng Anh**, `kebab-case` cho file/folder, `camelCase` cho hàm/biến, escapeHtml chống XSS. |
| **Nghiệp Vụ Kho & Kế Toán** | [.agents/rules/warehouse-domain.md](file:///.agents/rules/warehouse-domain.md) | Khóa ngày sổ sách (`isDateLocked`), chiết hàng 1 nguồn &rarr; N đích, bảo toàn mã SP `'`. |
| **Nguyên Tắc Nội Bộ** | [.agents/rules/internal-guidelines.md](file:///.agents/rules/internal-guidelines.md) | Triết lý KISS, tối ưu Quota Google Sheets (batching & debounce), quản lý cache PWA. |

---

## 5. Kỹ Năng Tự Động Hóa Vibe Coding (.agents/skills/)

Các kỹ năng tác vụ nhiều bước được nạp theo nhu cầu (Progressive Disclosure):
- **[ship-feature](file:///.agents/skills/ship-feature/SKILL.md)**: Tự động hóa phát triển tính năng mới trọn gói từ A-Z (View + State + Route + Auto Build).
- **[fix-and-heal](file:///.agents/skills/fix-and-heal/SKILL.md)**: Tự động chẩn đoán lỗi console/build, sửa tận gốc & tái kiểm tra.
- **[ui-vibe-polish](file:///.agents/skills/ui-vibe-polish/SKILL.md)**: Gọt giũa UX/UI mobile touch target, theme SamPet, toast & animations.
- **[safe-checkpoint](file:///.agents/skills/safe-checkpoint/SKILL.md)**: Tạo phao cứu sinh (Git tag + backup data) cho phép rollback tức thì ("quay lại bản cũ").
- **[deploy-backend](file:///.agents/skills/deploy-backend/SKILL.md)**: Quy trình deploy Google Apps Script backend bằng Clasp và cập nhật `public/env.js`.
- **[pwa-release](file:///.agents/skills/pwa-release/SKILL.md)**: Quy trình cập nhật `APP_VERSION`, Service Worker cache và release PWA.
