# TÀI LIỆU KỸ THUẬT: TÍNH NĂNG CHIẾT HÀNG (REPACKAGE) & ĐỒNG BỘ GOOGLE SHEETS

> **Mục đích tài liệu**: Cung cấp đặc tả chi tiết về mô hình dữ liệu, thuật toán gom nhóm 1-to-N, các API Endpoints và mã nguồn Google Apps Script để bạn dễ dàng sao chép, tích hợp hoặc đồng bộ tính năng Chiết Hàng vào bất kỳ codebase / source nào khác.

---

## 📑 MỤC LỤC
1. [Khái Niệm & Nghiệp Vụ Chiết Hàng (1-to-N)](#1-khái-niệm--nghiệp-vụ-chiết-hàng-1-to-n)
2. [Cấu Trúc Dữ Liệu Trên Google Sheets (Sheet Schema)](#2-cấu-trúc-dữ-liệu-trên-google-sheets-sheet-schema)
3. [Quy Tắc Vàng Khi Ghi Số Lượng Xuất Giảm (Kho Nguồn)](#3-quy-tắc-vàng-khi-ghi-số-lượng-xuất-giảm-kho-nguồn)
4. [Đặc Tả API Google Apps Script (Endpoints & Payloads)](#4-đặc-tả-api-google-apps-script-endpoints--payloads)
   - [4.1. Lấy lịch sử chiết hàng (GET)](#41-lấy-lịch-sử-chiết-hàng-get)
   - [4.2. Lưu phiếu chiết hàng mới (POST `repackage`)](#42-lưu-phiếu-chiết-hàng-mới-post-repackage)
   - [4.3. Cập nhật phiếu chiết hàng (POST `repackage_update`)](#43-cập-nhật-phiếu-chiết-hàng-post-repackage_update)
   - [4.4. Xóa phiếu chiết hàng (POST `repackage_delete`)](#44-xóa-phiếu-chiết-hàng-post-repackage_delete)
5. [Mã Nguồn Google Apps Script Mẫu (`Code.gs`)](#5-mã-nguồn-google-apps-script-mẫu-codegs)
6. [Thuật Toán Gom Nhóm Phiếu Trên Client (Session Grouping)](#6-thuật-toán-gom-nhóm-phiếu-trên-client-session-grouping)
7. [Các Lưu Ý Quan Trọng Khi Tích Hợp Vào Source Khác](#7-các-lưu-ý-quan-trọng-khi-tích-hợp-vào-source-khác)

---

## 1. Khái Niệm & Nghiệp Vụ Chiết Hàng (1-to-N)

Trong kinh doanh (đặc biệt là hàng bán lẻ, Pet Shop, phân bón, thực phẩm,...), cửa hàng nhập **quy cách lớn** (Bao 20kg, Can 5L, Thùng 100 gói,...) để tối ưu chi phí giá vốn. Sau đó, cửa hàng thực hiện **chiết tách** thành nhiều **quy cách nhỏ** (Gói 1kg, Gói 500g, Chai 500ml,...) để trưng bày bán lẻ.

### Luồng nghiệp vụ:
- **1 Sản phẩm Nguồn (Gói lớn)**: Xuất giảm kho `fromQuantity` (ví dụ: `-1 Bao 20kg`).
- **N Sản phẩm Đích (Gói nhỏ)**: Nhập tăng kho `toQuantity` (ví dụ: `+15 Gói 1kg` và `+10 Gói 500g`).

---

## 2. Cấu Trúc Dữ Liệu Trên Google Sheets (Sheet Schema)

Trên Google Spreadsheet, tạo một tab (Sheet) đặt tên là `repackage` (hoặc `repackage_history`). Cấu trúc gồm 12 cột chuẩn sau:

| STT | Tên Cột (Header) | Kiểu Dữ Liệu | Ví Dụ | Ý Nghĩa / Mô Tả |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `id` | String | `69562ce817059` | ID duy nhất của từng dòng quy cách con (Hex 13 ký tự). |
| **B** | `sessionId` | String | `repack_69562ce817050` | ID phiên chiết (chung cho tất cả các dòng con của 1 lần chiết). |
| **C** | `date` | String | `05-09-2026` | Ngày thực hiện chiết hàng (`DD-MM-YYYY`). |
| **D** | `fromProductId` | String | `'675057255766f` | Mã SP nguồn (khuyến nghị thêm dấu nháy đơn `'` ở đầu để Sheet không format thành số). |
| **E** | `fromProductName` | String | `Bao Hạt Classic 20kg` | Tên sản phẩm nguồn xuất giảm. |
| **F** | `toProductId` | String | `'675057255767c` | Mã sản phẩm đích nhập tăng. |
| **G** | `toProductName` | String | `Gói Hạt Classic 1kg` | Tên sản phẩm đích. |
| **H** | `fromQuantity` | Number | `1` *(dòng 1)* / `0` *(dòng 2+)* | Số lượng nguồn xuất giảm dùng để tính tổng tồn kho. |
| **I** | `sessionFromQty` | Number | `1` | Tổng số lượng nguồn của cả phiếu (dùng để hiển thị giao diện). |
| **J** | `toQuantity` | Number | `15` | Số lượng sản phẩm đích tạo thành. |
| **K** | `note` | String | `Chiết đợt sáng` | Ghi chú riêng của từng quy cách con. |
| **L** | `createdAt` | Number | `1757058800` | Unix timestamp thời điểm tạo (giây). |
| **M** | `updatedAt` | Number | `1757058800` | Unix timestamp thời điểm cập nhật mới nhất (giây). |

---

## 3. Quy Tắc Vàng Khi Ghi Số Lượng Xuất Giảm (Kho Nguồn)

> [!IMPORTANT]
> **Vấn đề chống nhân đôi số lượng tồn kho**:
> Giả sử 1 phiếu chiết 1 bao 20kg &rarr; tách thành 2 loại: 15 gói 1kg và 10 gói 0.5kg (sinh ra 2 dòng trên Google Sheet).
> Nếu cả 2 dòng đều ghi `fromQuantity = 1`, khi hàm báo cáo kho chạy `=SUM(fromQuantity)`, tổng số bao bị trừ sẽ là `1 + 1 = 2 bao` (SAI DỮ LIỆU).

### Giải pháp chuẩn đã triển khai:
1. **Dòng đầu tiên (`index === 0`)**: Ghi `fromQuantity = srcQty` (ví dụ: `1`).
2. **Các dòng tiếp theo (`index > 0`)**: Ghi `fromQuantity = 0`.
3. **Cả tất cả các dòng**: Đều ghi `sessionFromQty = srcQty` để khi render giao diện luôn hiển thị đầy đủ `-1 Bao` cho người xem.

```javascript
// Mã logic khi build rows:
const rows = targets.map((t, idx) => ({
  id: genUniqueId(),
  sessionId: sessionId,
  date: formattedDate,
  fromProductId: "'" + srcId,
  fromProductName: srcName,
  toProductId: "'" + t.productId,
  toProductName: t.productName,
  fromQuantity: idx === 0 ? srcQty : 0,  // <-- Dòng 1 nhận số lượng, dòng sau nhận 0
  sessionFromQty: srcQty,                // <-- Giữ nguyên để hiển thị UI
  toQuantity: Number(t.quantity),
  note: t.note || "",
  createdAt: unixNow(),
  updatedAt: unixNow()
}));
```

---

## 4. Đặc Tả API Google Apps Script (Endpoints & Payloads)

### Cấu hình Endpoint
```javascript
const SHEETS_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

> [!TIP]
> Khi gửi request `POST` từ trình duyệt tới Google Apps Script, luôn sử dụng `headers: { "Content-Type": "text/plain" }` và `mode: "no-cors"` (hoặc qua proxy) để tránh bị chặn bởi chính sách CORS Preflight của Google.

---

### 4.1. Lấy lịch sử chiết hàng (GET)

- **Request**:
  ```http
  GET https://script.google.com/macros/s/.../exec?type=repackage
  ```
- **Response JSON**:
  ```json
  {
    "status": "success",
    "repackageRows": [
      {
        "id": "69562ce817059",
        "sessionId": "repack_69562ce817050",
        "date": "05-09-2026",
        "fromProductId": "675057255766f",
        "fromProductName": "Bao Hạt Classic 20kg",
        "toProductId": "675057255767c",
        "toProductName": "Gói Hạt Classic 1kg",
        "fromQuantity": 1,
        "sessionFromQty": 1,
        "toQuantity": 15,
        "note": "Chiết đợt 1",
        "createdAt": 1757058800,
        "updatedAt": 1757058800
      },
      {
        "id": "69562ce817060",
        "sessionId": "repack_69562ce817050",
        "date": "05-09-2026",
        "fromProductId": "675057255766f",
        "fromProductName": "Bao Hạt Classic 20kg",
        "toProductId": "675057255768d",
        "toProductName": "Gói Hạt Classic 500g",
        "fromQuantity": 0,
        "sessionFromQty": 1,
        "toQuantity": 10,
        "note": "",
        "createdAt": 1757058800,
        "updatedAt": 1757058800
      }
    ]
  }
  ```

---

### 4.2. Lưu phiếu chiết hàng mới (POST `repackage`)

- **Method**: `POST`
- **Payload**:
  ```json
  {
    "action": "repackage",
    "type": "repackage",
    "rows": [
      {
        "id": "69562ce817059",
        "sessionId": "repack_69562ce817050",
        "date": "05-09-2026",
        "fromProductId": "'675057255766f",
        "fromProductName": "Bao Hạt Classic 20kg",
        "toProductId": "'675057255767c",
        "toProductName": "Gói Hạt Classic 1kg",
        "fromQuantity": 1,
        "sessionFromQty": 1,
        "toQuantity": 15,
        "note": "Chiết đợt 1",
        "createdAt": 1757058800,
        "updatedAt": 1757058800
      },
      {
        "id": "69562ce817060",
        "sessionId": "repack_69562ce817050",
        "date": "05-09-2026",
        "fromProductId": "'675057255766f",
        "fromProductName": "Bao Hạt Classic 20kg",
        "toProductId": "'675057255768d",
        "toProductName": "Gói Hạt Classic 500g",
        "fromQuantity": 0,
        "sessionFromQty": 1,
        "toQuantity": 10,
        "note": "",
        "createdAt": 1757058800,
        "updatedAt": 1757058800
      }
    ]
  }
  ```

---

### 4.3. Cập nhật phiếu chiết hàng (POST `repackage_update`)

Khi người dùng mở màn hình sửa và điều chỉnh ngày chiết, số lượng nguồn, số lượng các mặt hàng đích hoặc ghi chú:

- **Method**: `POST`
- **Payload**:
  ```json
  {
    "action": "repackage_update",
    "rows": [
      {
        "id": "69562ce817059",
        "date": "05-09-2026",
        "fromQuantity": 1,
        "sessionFromQty": 1,
        "toQuantity": 16,
        "note": "Đã sửa số lượng",
        "updatedAt": 1757065000
      },
      {
        "id": "69562ce817060",
        "date": "05-09-2026",
        "fromQuantity": 0,
        "sessionFromQty": 1,
        "toQuantity": 8,
        "note": "",
        "updatedAt": 1757065000
      }
    ]
  }
  ```

---

### 4.4. Xóa phiếu chiết hàng (POST `repackage_delete`)

- **Method**: `POST`
- **Payload**:
  ```json
  {
    "action": "repackage_delete",
    "ids": [
      "69562ce817059",
      "69562ce817060"
    ]
  }
  ```

---

## 5. Mã Nguồn Google Apps Script Mẫu (`Code.gs`)

Dưới đây là toàn bộ code Apps Script hoàn chỉnh để bạn copy trực tiếp vào Google Apps Script Editor (**Extensions &rarr; Apps Script**):

```javascript
/**
 * Google Apps Script backend for SamPet (Xuất hàng & Chiết hàng)
 */

function doGet(e) {
  var params = e ? e.parameter : {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Trả về lịch sử chiết hàng
  if (params.type === "repackage") {
    var sheetRepack = ss.getSheetByName("repackage") || ss.getSheetByName("repackage_history");
    if (!sheetRepack) {
      return responseJSON({ status: "success", repackageRows: [] });
    }
    var data = sheetRepack.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON({ status: "success", repackageRows: [] });
    }
    var headers = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      rows.push({
        id: String(r[0] || "").replace(/^'+/, ''),
        sessionId: String(r[1] || "").replace(/^'+/, ''),
        date: String(r[2] || ""),
        fromProductId: String(r[3] || "").replace(/^'+/, ''),
        fromProductName: String(r[4] || ""),
        toProductId: String(r[5] || "").replace(/^'+/, ''),
        toProductName: String(r[6] || ""),
        fromQuantity: Number(r[7] || 0),
        sessionFromQty: r[8] !== undefined && r[8] !== "" ? Number(r[8]) : Number(r[7] || 0),
        toQuantity: Number(r[9] || 0),
        note: String(r[10] || ""),
        createdAt: Number(r[11] || 0),
        updatedAt: Number(r[12] || 0)
      });
    }
    return responseJSON({ status: "success", repackageRows: rows });
  }

  // 2. Trả về lịch sử xuất hàng thông thường
  var sheetExport = ss.getSheetByName("xuat_hang") || ss.getSheetByName("Sheet1") || ss.getSheets()[0];
  var exportData = sheetExport.getDataRange().getValues();
  if (exportData.length <= 1) {
    return responseJSON({ status: "success", rows: [] });
  }
  var exportRows = [];
  for (var j = 1; j < exportData.length; j++) {
    var row = exportData[j];
    exportRows.push({
      id: String(row[0] || "").replace(/^'+/, ''),
      date: String(row[1] || ""),
      productId: String(row[2] || "").replace(/^'+/, ''),
      productName: String(row[3] || ""),
      quantity: Number(row[4] || 0),
      sellingPrice: Number(row[5] || 0),
      purchasePrice: Number(row[6] || 0),
      note: String(row[7] || ""),
      createdAt: Number(row[8] || 0),
      updatedAt: Number(row[9] || 0)
    });
  }
  return responseJSON({ status: "success", rows: exportRows });
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ================= CHIẾT HÀNG =================
    // 1. Ghi mới phiếu chiết
    if (action === "repackage") {
      var sheetRepack = getOrCreateSheet(ss, "repackage", [
        "id", "sessionId", "date", "fromProductId", "fromProductName",
        "toProductId", "toProductName", "fromQuantity", "sessionFromQty",
        "toQuantity", "note", "createdAt", "updatedAt"
      ]);
      var rowsToAdd = payload.rows || [];
      var appendData = rowsToAdd.map(function(r) {
        return [
          "'" + String(r.id || ""),
          "'" + String(r.sessionId || ""),
          String(r.date || ""),
          "'" + String(r.fromProductId || "").replace(/^'+/, ''),
          String(r.fromProductName || ""),
          "'" + String(r.toProductId || "").replace(/^'+/, ''),
          String(r.toProductName || ""),
          Number(r.fromQuantity || 0),
          Number(r.sessionFromQty !== undefined ? r.sessionFromQty : r.fromQuantity || 0),
          Number(r.toQuantity || 0),
          String(r.note || ""),
          Number(r.createdAt || 0),
          Number(r.updatedAt || 0)
        ];
      });
      if (appendData.length > 0) {
        sheetRepack.getRange(sheetRepack.getLastRow() + 1, 1, appendData.length, appendData[0].length).setValues(appendData);
      }
      return responseJSON({ status: "success", inserted: appendData.length });
    }

    // 2. Cập nhật dòng chiết
    if (action === "repackage_update") {
      var sheetRepackUpdate = ss.getSheetByName("repackage") || ss.getSheetByName("repackage_history");
      if (sheetRepackUpdate) {
        var dataRepack = sheetRepackUpdate.getDataRange().getValues();
        var updateRows = payload.rows || (payload.row ? [payload.row] : []);
        var updateMap = {};
        updateRows.forEach(function(ur) {
          updateMap[String(ur.id).replace(/^'+/, '')] = ur;
        });

        for (var k = 1; k < dataRepack.length; k++) {
          var rowId = String(dataRepack[k][0]).replace(/^'+/, '');
          if (updateMap[rowId]) {
            var item = updateMap[rowId];
            if (item.date) sheetRepackUpdate.getRange(k + 1, 3).setValue(String(item.date));
            if (item.fromQuantity !== undefined) sheetRepackUpdate.getRange(k + 1, 8).setValue(Number(item.fromQuantity));
            if (item.sessionFromQty !== undefined) sheetRepackUpdate.getRange(k + 1, 9).setValue(Number(item.sessionFromQty));
            if (item.toQuantity !== undefined) sheetRepackUpdate.getRange(k + 1, 10).setValue(Number(item.toQuantity));
            if (item.note !== undefined) sheetRepackUpdate.getRange(k + 1, 11).setValue(String(item.note));
            if (item.updatedAt !== undefined) sheetRepackUpdate.getRange(k + 1, 13).setValue(Number(item.updatedAt));
          }
        }
      }
      return responseJSON({ status: "success" });
    }

    // 3. Xóa dòng chiết
    if (action === "repackage_delete") {
      var sheetRepackDel = ss.getSheetByName("repackage") || ss.getSheetByName("repackage_history");
      if (sheetRepackDel) {
        var idsToDelete = (payload.ids || []).map(function(id) { return String(id).replace(/^'+/, ''); });
        var dataDel = sheetRepackDel.getDataRange().getValues();
        for (var d = dataDel.length - 1; d >= 1; d--) {
          var currentId = String(dataDel[d][0]).replace(/^'+/, '');
          if (idsToDelete.indexOf(currentId) !== -1) {
            sheetRepackDel.deleteRow(d + 1);
          }
        }
      }
      return responseJSON({ status: "success" });
    }

    // ================= XUẤT HÀNG =================
    if (action === "append") {
      var sheetExpAppend = getOrCreateSheet(ss, "xuat_hang", [
        "id", "date", "productId", "productName", "quantity", "sellingPrice", "purchasePrice", "note", "createdAt", "updatedAt"
      ]);
      var expRows = payload.rows || [];
      var expData = expRows.map(function(r) {
        return [
          "'" + String(r.id || ""),
          String(r.date || ""),
          "'" + String(r.productId || "").replace(/^'+/, ''),
          String(r.productName || ""),
          Number(r.quantity || 0),
          Number(r.sellingPrice || 0),
          Number(r.purchasePrice || 0),
          String(r.note || ""),
          Number(r.createdAt || 0),
          Number(r.updatedAt || 0)
        ];
      });
      if (expData.length > 0) {
        sheetExpAppend.getRange(sheetExpAppend.getLastRow() + 1, 1, expData.length, expData[0].length).setValues(expData);
      }
      return responseJSON({ status: "success", inserted: expData.length });
    }

    return responseJSON({ status: "error", message: "Hành động không hợp lệ: " + action });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 6. Thuật Toán Gom Nhóm Phiếu Trên Client (Session Grouping)

Khi dữ liệu từ Google Sheets trả về là danh sách phẳng gồm nhiều dòng con, client cần gom nhóm lại thành từng **Phiếu chiết** để hiển thị:

```javascript
function getRepackageSessions(flatRows) {
  const map = new Map();

  flatRows.forEach((r) => {
    // Session key ưu tiên lấy sessionId, fallback date + fromProductId + createdAt
    const key = r.sessionId || (r.createdAt ? `${r.date}_${r.fromProductId}_${r.createdAt}` : r.id);

    if (!map.has(key)) {
      map.set(key, {
        sessionId: key,
        date: r.date,
        fromProductId: r.fromProductId,
        fromProductName: r.fromProductName,
        fromQuantity: r.sessionFromQty !== undefined ? Number(r.sessionFromQty) : (Number(r.fromQuantity) || 0),
        createdAt: r.createdAt || 0,
        updatedAt: r.updatedAt || 0,
        items: []
      });
    }

    const session = map.get(key);
    session.items.push({
      id: r.id,
      toProductId: r.toProductId,
      toProductName: r.toProductName,
      toQuantity: Number(r.toQuantity) || 0,
      note: r.note || ""
    });
  });

  return Array.from(map.values());
}
```

---

## 7. Các Lưu Ý Quan Trọng Khi Tích Hợp Vào Source Khác

1. **Chuẩn hóa chuỗi ID**: Luôn loại bỏ dấu nháy đơn (`'`) ở đầu chuỗi khi nhận từ Google Sheets:
   ```javascript
   const cleanId = String(rawId).replace(/^'+/, '');
   ```
2. **Chuẩn hóa định dạng Ngày**: Chuyển đổi linh hoạt giữa format Google Sheets (`DD-MM-YYYY`) và format HTML Input Date (`YYYY-MM-DD`):
   ```javascript
   function toInputDate(vnDate) {
     const parts = vnDate.split("-");
     return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : vnDate;
   }
   ```
3. **Cơ chế Cache-first vs Network-first**:
   - Khi fetch dữ liệu danh mục tĩnh (`products.csv`), có thể dùng cache.
   - Khi fetch hoặc post tới `SHEETS_URL`, tuyệt đối **không cache** (thêm timestamp hoặc query param nếu cần).
