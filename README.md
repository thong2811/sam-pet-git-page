# SamPet — Ứng Dụng Lập & Quản Lý Phiếu Xuất Hàng

Ứng dụng web Progressive Web App (PWA) phục vụ công tác lập phiếu xuất hàng, quản lý và thống kê dữ liệu xuất kho hàng ngày cho cửa hàng thú cưng **SamPet**.

Ứng dụng hoạt động trực tiếp trên trình duyệt, tối ưu hóa cho cả thiết bị di động (Mobile) và máy tính (Desktop), hỗ trợ lưu trữ cục bộ, xuất file CSV offline và đồng bộ dữ liệu thời gian thực với **Google Sheets**.

---

## 📑 Mục Lục
1. [Tổng Quan & Tính Năng Nổi Bật](#-tổng-quan--tính-năng-nổi-bật)
2. [Công Nghệ & Kiến Trúc](#-công-nghệ--kiến-trúc)
3. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
4. [Mô Tả Chức Năng Chi Tiết](#-mô-tả-chức-năng-chi-tiết)
5. [Cấu Trúc Dữ Liệu & CSV Schema](#-cấu-trúc-dữ-liệu--csv-schema)
6. [Tích Hợp Google Apps Script API](#-tích-hợp-google-apps-script-api)
7. [Hướng Dẫn Triển Khai & Sử Dụng](#-hướng-dẫn-triển-khai--sử-dụng)

---

## 🌟 Tổng Quan & Tính Năng Nổi Bật

- **Tra cứu danh mục sản phẩm**:
  - Tải tự động danh mục sản phẩm từ file CSV cục bộ (`products.csv` / `product.csv`).
  - Hỗ trợ phân tích mã hoá UTF-8 (BOM), tự động nhận diện linh hoạt các cột tiêu đề tiếng Việt / tiếng Anh.
  - Tìm kiếm sản phẩm siêu tốc theo Mã sản phẩm hoặc Tên sản phẩm.
  - Hiển thị trực quan trạng thái sản phẩm đã được chọn vào phiếu.

- **Lập phiếu xuất hàng tinh gọn**:
  - Thêm nhanh sản phẩm vào phiếu bằng 1 chạm/click.
  - Tự động sinh ID dòng duy nhất (13 ký tự hex).
  - Tăng/giảm số lượng nhanh chóng, chỉnh sửa giá bán thực tế và ghi chú riêng cho từng mặt hàng.
  - Tự động tính toán cột **Tổng tiền** thời gian thực.
  - **Luồng chọn ngày thông minh**: Giao diện phiếu xuất không hiển thị ô ngày rườm rà. Khi nhấn **Xuất lên Google Sheets**, hộp thoại xác nhận sẽ hiện ra để chọn ngày xuất và **tự động lưu nhớ ngày đã chọn cho các lần xuất tiếp theo**.
  - Xuất phiếu xuất ra định dạng file CSV chuẩn UTF-8 BOM tương thích Excel.

- **Đồng bộ & Quản lý lịch sử xuất hàng qua Google Sheets**:
  - Gửi dữ liệu phiếu xuất lên Google Sheets qua Google Apps Script Web App.
  - Xem danh sách lịch sử các đợt xuất hàng theo thời gian thực.
  - Bộ lọc thông minh: tìm kiếm theo từ khoá (mã SP, tên SP, ghi chú) và lọc theo ngày xuất.
  - Chỉnh sửa thông tin xuất hàng (số lượng, giá bán, giá nhập, ghi chú, ngày xuất) trực tiếp qua Modal.
  - Chọn nhiều dòng (Checkbox / Chọn tất cả) để xóa hàng loạt khỏi Google Sheets.
  - Xuất dữ liệu đã lọc trên Google Sheets về máy dưới dạng file CSV.

- **Thống kê doanh thu theo ngày**:
  - Tự động tổng hợp số lượng dòng, tổng số lượng xuất và tổng doanh thu bán ra theo từng ngày.
  - Phím tắt "Xem" giúp lọc nhanh danh sách chi tiết của ngày được chọn.

- **Trải nghiệm ứng dụng di động (PWA - Mobile First)**:
  - Cài đặt lên màn hình chính (Add to Home Screen) trên cả iOS và Android như một ứng dụng độc lập (Standalone).
  - Offline caching các tài nguyên tĩnh thông qua Service Worker.
  - Tính năng **Pull-to-refresh** kéo xuống để làm mới dữ liệu khi chạy ở chế độ Standalone.
  - Giao diện responsive 2 tầng: hiển thị dạng Bảng chi tiết trên Desktop và dạng Thẻ (Cards) trên Mobile.
  - Chặn double-tap zoom trên các nút điều chỉnh số lượng giúp thao tác mượt mà.

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
├── index.html                  # File giao diện và toàn bộ mã nguồn xử lý ứng dụng
├── manifest.json               # Cấu hình PWA (theme, tên app, icon, start_url)
├── products.csv                # Dữ liệu danh mục sản phẩm (ưu tiên products.csv, fallback product.csv)
├── sw.js                       # Service Worker quản lý cache & offline
└── README.md                   # Tài liệu hướng dẫn sử dụng và phát triển
```

---

## 🔍 Mô Tả Chức Năng Chi Tiết

### 1. Quản lý trạng thái (`state`)
Toàn bộ trạng thái của ứng dụng được quản lý tập trung trong đối tượng `state`:
- `state.products`: Mảng chứa danh sách sản phẩm lấy từ CSV.
- `state.columns`: Danh sách tên cột của file CSV sản phẩm.
- `state.keys`: Mapping tự động các cột tương ứng với `maSP`, `tenSP`, `donVi`, `giaBan`, `giaNhap`.
- `state.phieu`: Danh sách sản phẩm đang có trong phiếu xuất hiện tại.
- `state.usedIds`: Bộ lưu trữ `Set` các ID dòng đã sinh để tránh trùng lặp.
- `sheetHistory`: Mảng chứa lịch sử xuất hàng đọc từ Google Sheets.
- `historySelected`: `Set` chứa ID các dòng lịch sử đang được tích chọn.

### 2. Bộ phân tích CSV (`parseCSV` & `detectKeys`)
- Xử lý ký tự UTF-8 BOM (`0xFEFF`), các trường có dấu ngoặc kép (`"..."`), dấu phẩy lồng nhau và các định dạng ngắt dòng (`\r\n`, `\n`).
- Tự động nhận diện các biến thể tên cột:
  - **Mã SP**: `masp`, `ma_sp`, `id`, `productid`, `ma`
  - **Tên SP**: `tensp`, `ten_sp`, `name`, `productname`, `ten`
  - **Đơn vị**: `donvi`, `don_vi`, `unit`, `dvt`
  - **Giá bán**: `sellingprice`, `giaban`, `gia_ban`
  - **Giá nhập**: `purchaseprice`, `gianhap`, `gia_nhap`

### 3. Xử lý Service Worker (`sw.js`)
- Tên cache: `sam-pet-v12`.
- **Install & Activate**: Tải và lưu trữ trước các tài nguyên tĩnh (`index.html`, `manifest.json`, icon, `products.csv`), tự động dọn dẹp các phiên bản cache cũ.
- **Fetch Strategy**:
  - Các request đến domain `script.google.com`: Luôn dùng Network để đảm bảo dữ liệu mới nhất.
  - Các tài nguyên tĩnh: Sử dụng chiến lược **Cache-First**, tự động cập nhật cache khi có phản hồi mới.

---

## 📊 Cấu Trúc Dữ Liệu & CSV Schema

### 1. Cấu trúc file danh mục sản phẩm (`product.csv` / `products.csv`)
File CSV danh mục mẫu:
```csv
id,name,unit,sellingPrice,purchasePrice,initStock,repackageStock,invoiceCheck,categoryId,createdAt,updatedAt
675057255766f,Áo nỉ size 2XL,cái,70000,21700,3,0,0,,,
675057255767c,Áo lông size L,cái,60000,19000,0,0,0,,,
```

### 2. Cấu trúc file CSV xuất phiếu (`export-stock.csv`)
Header chuẩn của file xuất:
```csv
id,date,productId,productName,quantity,sellingPrice,purchasePrice,note,createdAt,updatedAt
```
- `id`: Mã định danh 13 ký tự hex (vd: `69562ce817059`).
- `date`: Ngày xuất hàng định dạng `DD-MM-YYYY` (vd: `05-09-2026`).
- `productId`: Mã sản phẩm.
- `productName`: Tên sản phẩm.
- `quantity`: Số lượng xuất (nguyên dương).
- `sellingPrice`: Giá bán ra thực tế của từng đơn vị sản phẩm.
- `purchasePrice`: Giá vốn / giá nhập.
- `note`: Ghi chú kèm theo.
- `createdAt`: Unix timestamp lúc tạo dòng (giây).
- `updatedAt`: Unix timestamp lúc cập nhật dòng (giây).

---

## 🌐 Tích Hợp Google Apps Script API

URL Web App Endpoint được cấu hình trong `index.html`:
```javascript
var SHEETS_URL = "https://script.google.com/macros/s/AKfycbwdleboFPOhYW4y7JNAyVMgtLuPrjyEEFzf3oveJ9WiurbwsyVXXWwRaItEkpmfEm0/exec";
```

### 1. Lấy dữ liệu lịch sử xuất hàng (`GET`)
- **Request**: `GET https://script.google.com/macros/s/.../exec`
- **Response**:
```json
{
  "status": "success",
  "rows": [
    {
      "id": "69562ce817059",
      "date": "05-09-2026",
      "productId": "675057255766f",
      "productName": "Áo nỉ size 2XL",
      "quantity": 2,
      "sellingPrice": 70000,
      "purchasePrice": 21700,
      "note": "Khách quen",
      "createdAt": 1757058800,
      "updatedAt": 1757058800
    }
  ]
}
```

### 2. Thêm phiếu xuất mới (`POST`)
- **Request payload**:
```json
{
  "rows": [
    {
      "id": "69562ce817059",
      "date": "05-09-2026",
      "productId": "675057255766f",
      "productName": "Áo nỉ size 2XL",
      "quantity": 2,
      "sellingPrice": 70000,
      "purchasePrice": 21700,
      "note": "",
      "createdAt": 1757058800,
      "updatedAt": 1757058800
    }
  ]
}
```

### 3. Cập nhật thông tin dòng xuất hàng (`POST - update`)
- **Request payload**:
```json
{
  "action": "update",
  "row": {
    "id": "69562ce817059",
    "date": "05-09-2026",
    "quantity": 3,
    "sellingPrice": 75000,
    "purchasePrice": 21700,
    "note": "Cập nhật số lượng",
    "updatedAt": 1757059999
  }
}
```

### 4. Xóa các dòng xuất hàng (`POST - delete`)
- **Request payload**:
```json
{
  "action": "delete",
  "ids": ["69562ce817059", "69562ce817060"]
}
```

---

## 🚀 Hướng Dẫn Triển Khai & Sử Dụng

### 1. Chạy trên máy cục bộ (Local Development)
Do ứng dụng sử dụng `fetch()` để đọc file `products.csv`, bạn cần chạy ứng dụng qua một Web Server (không mở trực tiếp file `file:///`):
- **Cách 1: Sử dụng VS Code Live Server**: Nhấp chuột phải vào `index.html` và chọn **Open with Live Server**.
- **Cách 2: Sử dụng Python HTTP Server**:
  ```bash
  python -m http.server 8000
  ```
  Sau đó mở trình duyệt tại: `http://localhost:8000`
- **Cách 3: Sử dụng Node.js `serve` hoặc `http-server`**:
  ```bash
  npx serve .
  ```

### 2. Triển khai lên GitHub Pages
1. Đẩy toàn bộ mã nguồn lên nhánh chính (`main` hoặc `master`) trên GitHub.
2. Truy cập **Settings** của repository -> mục **Pages**.
3. Tại **Build and deployment**, chọn Source là **Deploy from a branch** -> chọn branch `main` (thư mục `/root`) và nhấn **Save**.
4. Truy cập đường dẫn GitHub Pages được cung cấp (ví dụ: `https://<username>.github.io/sam-pet-git-page/`).

### 3. Cài đặt làm ứng dụng PWA trên điện thoại
- **iOS (Safari)**: Mở trang web -> bấm nút **Chia sẻ (Share)** -> chọn **Thêm vào MH chính (Add to Home Screen)**.
- **Android (Chrome)**: Mở trang web -> bấm biểu tượng ba chấm ở góc trên bên phải -> chọn **Cài đặt ứng dụng (Install app)** hoặc **Thêm vào màn hình chính**.
