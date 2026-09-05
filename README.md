# SamPet — Ứng Dụng Quản Lý Xuất & Chiết Hàng

Ứng dụng web Progressive Web App (PWA) phục vụ công tác lập phiếu xuất hàng, quản lý và thực hiện **Chiết hàng (Repackage)**, theo dõi lịch sử và thống kê kho hàng ngày cho cửa hàng thú cưng **SamPet**.

Ứng dụng hoạt động trực tiếp trên trình duyệt, tối ưu hóa cho cả thiết bị di động (Mobile) và máy tính (Desktop), hỗ trợ lưu trữ cục bộ, xuất file CSV offline và đồng bộ dữ liệu thời gian thực với **Google Sheets**.

---

## 📑 Mục Lục
1. [Tổng Quan & Tính Năng Nổi Bật](#-tổng-quan--tính-năng-nổi-bật)
2. [Chức Năng Xuất Hàng (Product Export)](#-chức-năng-xuất-hàng)
3. [Chức Năng Chiết Hàng (Product Repackage)](#-chức-năng-chiết-hàng-product-repackage)
4. [Công Nghệ & Kiến Trúc](#-công-nghệ--kiến-trúc)
5. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
6. [Cấu Trúc Dữ Liệu & CSV Schema](#-cấu-trúc-dữ-liệu--csv-schema)
7. [Tích Hợp Google Apps Script API](#-tích-hợp-google-apps-script-api)
8. [Hướng Dẫn Triển Khai & Sử Dụng](#-hướng-dẫn-triển-khai--sử-dụng)

---

## 🌟 Tổng Quan & Tính Năng Nổi Bật

- **Hệ thống điều hướng 2 chế độ mượt mà (Tabs Switcher)**:
  - 📦 **Xuất Hàng**: Lập phiếu xuất bán lẻ, theo dõi doanh thu và lịch sử xuất hàng.
  - 🔄 **Chiết Hàng**: Tách bao/can quy cách lớn thành các gói/chai nhỏ hơn để bán lẻ, đồng bộ tồn kho nguồn & đích.
- **Tra cứu danh mục sản phẩm siêu tốc**:
  - Tải tự động danh mục sản phẩm từ file CSV cục bộ (`products.csv` / `product.csv`).
  - Hỗ trợ phân tích mã hoá UTF-8 (BOM), tự động nhận diện linh hoạt các cột tiêu đề tiếng Việt / tiếng Anh.
  - Tìm kiếm theo Mã SP hoặc Tên SP.
- **Trải nghiệm PWA di động (Mobile First)**:
  - Cài đặt lên màn hình chính (Add to Home Screen) trên cả iOS và Android như ứng dụng độc lập.
  - Tích hợp Service Worker cache offline và tính năng **Pull-to-refresh** kéo xuống để làm mới.
  - Giao diện 2 tầng: Bảng chi tiết trên Desktop và Thẻ (Cards) trên Mobile.

---

## 📦 Chức Năng Xuất Hàng

1. **Lập phiếu xuất**:
   - Thêm nhanh sản phẩm vào phiếu bằng 1 chạm (`+`).
   - Tự động sinh ID dòng 13 ký tự hex duy nhất.
   - Điều chỉnh nhanh số lượng, giá bán và ghi chú.
   - Tự động tính cột thành tiền và tổng tiền toàn phiếu.
2. **Xuất file & Đồng bộ**:
   - Xuất file CSV phiếu xuất định dạng chuẩn UTF-8 BOM (`PhieuXuat_...csv`).
   - Đồng bộ lên Google Sheets với Modal chọn ngày thông minh (tự động lưu nhớ ngày đã chọn).
3. **Quản lý lịch sử & Thống kê**:
   - Tìm kiếm, lọc theo ngày xuất.
   - Sửa thông tin dòng trực tiếp qua Modal.
   - Chọn nhiều dòng để xóa hàng loạt khỏi Google Sheets.
   - Thống kê doanh thu, số dòng, tổng số lượng xuất theo từng ngày.

---

## 🔄 Chức Năng Chiết Hàng (Product Repackage)

Trong kinh doanh Pet Shop, cửa hàng thường xuyên nhập các sản phẩm đóng gói quy cách lớn (ví dụ: *Bao thức ăn hạt 20kg*, *Can sữa tắm 5 lít*) nhằm tối ưu giá vốn. Sau đó, cửa hàng thực hiện **chiết / tách** thành các đơn vị quy cách nhỏ hơn (*Gói 1kg, 500g*, *Chai 500ml*) để bán lẻ.

### Điểm nổi bật của chức năng Chiết Hàng:
1. **Hỗ trợ phân bổ 1 Nguồn &rarr; Nhiều Đích (1-to-N)**:
   - Một lần chiết có thể phân bổ 1 sản phẩm nguồn thành 1 hoặc nhiều sản phẩm đích với số lượng và tỷ lệ khác nhau.
2. **Khối Sản phẩm Nguồn (Gói lớn)**:
   - Chọn sản phẩm nguồn từ dropdown / danh mục.
   - Xem thông tin Đơn vị tính và Tồn kho tham chiếu hiện có.
   - Nhập **Số lượng xuất chiết** (`fromQuantity`, mặc định `1`).
3. **Khối Sản phẩm Đích (Gói nhỏ)**:
   - Thêm không giới hạn các sản phẩm đích nhận tồn.
   - Chọn sản phẩm đích, nhập **Số lượng nhận** (`toQuantity`) và **Ghi chú** riêng từng mặt hàng.
   - Tự động hiển thị tóm tắt trực quan: `-1 Bao 20kg ➔ +15 Gói 1kg, +10 Gói 500g`.
4. **Đồng bộ & Lưu trữ**:
   - Xuất file CSV phiếu chiết (`PhieuChiet_...csv`).
   - Modal xác nhận xuất lên Google Sheets, lưu nhớ ngày thực hiện chiết hàng.
   - Lưu trữ lịch sử tại `localStorage` và đồng bộ cùng Google Apps Script API.
5. **Quản lý & Thống kê chiết hàng**:
   - Bộ lọc tìm kiếm theo tên nguồn, tên đích, mã SP, ghi chú và bộ lọc theo ngày.
   - Modal chỉnh sửa dòng lịch sử chiết (sửa ngày, SL nguồn, SL đích, ghi chú).
   - Xóa đơn lẻ hoặc chọn nhiều dòng để xóa hàng loạt.
   - Thống kê chiết hàng theo ngày: Tổng số dòng chiết, Tổng số lượng nguồn giảm, Tổng số lượng thành phẩm tạo ra.

---

## 🛠 Công Nghệ & Kiến Trúc

| Thành phần | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Giao diện & Logic** | HTML5, Vanilla JavaScript (ES6+) | Toàn bộ logic SPA chạy trên client, không cần backend Node.js phức tạp |
| **Styling** | Tailwind CSS (CDN) + Custom CSS | Giao diện tông màu ngọc bích / đất sét (Pine / Clay), hiệu ứng đổ bóng `shadow-card`, bo góc mượt mà |
| **Offline & PWA** | Service Worker (`sw.js`), Web App Manifest | Caching cache-first cho file tĩnh và network-first/bypass cho API Sheets |
| **Lưu trữ từ xa** | Google Apps Script + Google Sheets | Cơ sở dữ liệu đám mây không tốn chi phí server |
| **Dữ liệu danh mục** | CSV Parser thuần (Pure JS) | Đọc và xử lý file CSV tuân theo chuẩn RFC-4180 |

---

## 📁 Cấu Trúc Thư Mục

```text
sam-pet-git-page/
├── icons/
│   ├── apple-touch-icon.png    # Icon cho iOS Safari
│   ├── icon-192.png            # Icon PWA 192x192
│   ├── icon-512.png            # Icon PWA 512x512
│   └── icon.svg                # Icon vector
├── index.html                  # Giao diện & toàn bộ mã nguồn xử lý ứng dụng (Xuất & Chiết hàng)
├── manifest.json               # Cấu hình PWA (theme, tên app, icon, start_url)
├── products.csv                # Dữ liệu danh mục sản phẩm (id, name, unit, sellingPrice, initStock, ...)
├── sw.js                       # Service Worker quản lý cache & offline
├── DOCS_REPACKAGE_SYNC.md      # Tài liệu đặc tả kỹ thuật API & Đồng bộ Google Sheets cho Chiết Hàng
└── README.md                   # Tài liệu hướng dẫn sử dụng và phát triển
```

---

## 📊 Cấu Trúc Dữ Liệu & CSV Schema

> 📖 **Xem tài liệu kỹ thuật đồng bộ đầy đủ tại**: [DOCS_REPACKAGE_SYNC.md](file:///d:/Developer/Project/sam-pet-git-page/DOCS_REPACKAGE_SYNC.md)

### 1. Cấu trúc file danh mục sản phẩm (`products.csv`)
```csv
id,name,unit,sellingPrice,purchasePrice,initStock,repackageStock,invoiceCheck,categoryId,createdAt,updatedAt
675057255766f,Áo nỉ size 2XL,cái,70000,21700,3,0,0,,,
```

### 2. Cấu trúc file CSV Xuất Hàng (`export-stock.csv` / `PhieuXuat_...csv`)
```csv
id,date,productId,productName,quantity,sellingPrice,purchasePrice,note,createdAt,updatedAt
```

### 3. Cấu trúc bảng Chiết Hàng trên Google Sheets (`repackage`)
```csv
id,sessionId,date,fromProductId,fromProductName,toProductId,toProductName,fromQuantity,sessionFromQty,toQuantity,note,createdAt,updatedAt
```
- `id`: Mã định danh dòng chiết con (13 ký tự hex).
- `sessionId`: Mã phiên chiết (chung cho tất cả dòng con của 1 lần chiết).
- `date`: Ngày thực hiện chiết (`DD-MM-YYYY`).
- `fromProductId`: Mã SP nguồn xuất chiết.
- `fromProductName`: Tên SP nguồn.
- `toProductId`: Mã SP đích nhận.
- `toProductName`: Tên SP đích.
- `fromQuantity`: Số lượng nguồn trừ kho (`srcQty` cho dòng 1, `0` cho các dòng tiếp theo để tránh nhân đôi tồn kho).
- `sessionFromQty`: Tổng số lượng nguồn của cả phiếu (để hiển thị UI).
- `toQuantity`: Số lượng đích nhận.
- `note`: Ghi chú kèm theo.
- `createdAt`: Unix timestamp lúc tạo (giây).
- `updatedAt`: Unix timestamp lúc sửa (giây).

---

## 🌐 Cấu Hình Biến Môi Trường (`env.js`)

Các cấu hình như URL Google Apps Script, mã PIN khóa sổ sách, phiên bản ứng dụng được tách riêng trong tệp [env.js](file:///d:/Developer/Project/sam-pet-git-page/env.js) (hoặc tham khảo mẫu [env.example.js](file:///d:/Developer/Project/sam-pet-git-page/env.example.js)):

```javascript
window.ENV = {
  // Link Web App Google Apps Script kết nối Google Sheet
  SHEETS_URL: "https://script.google.com/macros/s/.../exec",

  // Mã PIN bảo mật cho chức năng Khóa/Mở khóa ngày sổ sách
  LOCK_DATE_PIN: "110899",

  // Tên các tab trong Google Sheet
  SHEET_NAME_PHIEUXUAT: "PhieuXuat",
  SHEET_NAME_REPACKAGE: "repackage",

  // Phiên bản ứng dụng
  APP_VERSION: "1.0.0"
};
```

Xem chi tiết payloads mẫu, phương thức GET / POST và trọn bộ mã nguồn `Code.gs` tại [DOCS_REPACKAGE_SYNC.md](file:///d:/Developer/Project/sam-pet-git-page/DOCS_REPACKAGE_SYNC.md).

---

## 🚀 Hướng Dẫn Triển Khai & Sử Dụng

### 1. Chạy trên máy cục bộ (Local Development)
Chạy ứng dụng qua Web Server:
```bash
# Python 3
python -m http.server 8000

# Hoặc Node.js
npx serve .
```
Truy cập `http://localhost:8000`.

### 2. Triển khai lên GitHub Pages
1. Đẩy toàn bộ mã nguồn lên nhánh `main` trên GitHub repository `sam-pet-git-page`.
2. Vào **Settings** -> **Pages** -> chọn branch `main` -> **Save**.
3. Ứng dụng sẽ tự động triển khai và có thể cài đặt PWA trực tiếp trên điện thoại.
