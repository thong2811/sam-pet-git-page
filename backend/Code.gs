// ============================================================
//  SAM Pet — Google Apps Script Web App (Xuất Hàng & Chiết Hàng)
//
//  doGet:
//    - ?type=repackage : trả về dữ liệu tab "repackage" { status: "ok", repackageRows: [...] }
//    - Mặc định        : trả về dữ liệu tab "PhieuXuat" { status: "ok", rows: [...] }
//
//  doPost:
//    - Xuất hàng : { action: "append" | "delete" | "update", ... }
//    - Chiết hàng: { action: "repackage" | "repackage_delete" | "repackage_update", ... }
//
//  LockService: mọi thao tác ghi đều dùng script lock để tránh
//  race condition khi nhiều người dùng cùng thao tác.
//
//  HƯỚNG DẪN DEPLOY:
//  1. Mở Google Sheet → Tiện ích mở rộng > Apps Script → dán file này vào.
//  2. Deploy > Manage deployments (hoặc New deployment) > Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  3. Copy URL và cập nhật SHEETS_URL trong index.html.
// ============================================================

var SHEET_NAME_PHIEUXUAT = "PhieuXuat";
var SHEET_NAME_REPACKAGE = "repackage";
var SHEET_NAME_STAFF = "NhanVien";
var LOCK_TIMEOUT_MS = 10000; // chờ lock tối đa 10 giây

var HEADER_PHIEUXUAT = [
  "id", "date", "productId", "productName",
  "quantity", "sellingPrice", "purchasePrice",
  "note", "staff", "createdAt", "updatedAt"
];

var HEADER_REPACKAGE = [
  "id", "sessionId", "date",
  "fromProductId", "fromProductName",
  "toProductId", "toProductName",
  "fromQuantity", "sessionFromQty", "toQuantity",
  "note", "staff", "createdAt", "updatedAt"
];

var HEADER_STAFF = [
  "id", "name", "pin", "role", "createdAt", "updatedAt", "status"
];

// ── doGet ────────────────────────────────────────────────────
function doGet(e) {
  try {
    var type = (e && e.parameter && e.parameter.type) ? e.parameter.type : "";
    var lockDate = getGlobalLockDate();

    // Trả về riêng ngày khóa
    if (type === "get_lock_date") {
      return jsonResponse({ status: "ok", lockDate: lockDate });
    }

    // 0. Trả về danh sách NHÂN VIÊN
    if (type === "staff") {
      var ssStaff = SpreadsheetApp.getActiveSpreadsheet();
      var sheetStaff = ssStaff.getSheetByName(SHEET_NAME_STAFF);
      if (!sheetStaff || sheetStaff.getLastRow() <= 1) {
        return jsonResponse({ status: "ok", staffList: [] });
      }

      var lastRowS = sheetStaff.getLastRow();
      var lastColS = sheetStaff.getLastColumn();
      var headerRowS = sheetStaff.getRange(1, 1, 1, lastColS).getValues()[0].map(function(h) { return String(h).trim(); });
      var dataS = sheetStaff.getRange(2, 1, lastRowS - 1, lastColS).getValues();

      var staffList = dataS.map(function(row) {
        var obj = {};
        headerRowS.forEach(function(key, i) {
          if (!key) return;
          var val = row[i];
          if (key === "pin" || key === "id") {
            val = String(val).replace(/^'+/, "").trim();
          } else if (key === "createdAt" || key === "updatedAt") {
            val = val !== "" && !isNaN(val) ? Number(val) : val;
          } else {
            val = val !== undefined ? String(val).trim() : "";
          }
          obj[key] = val;
        });
        return obj;
      }).filter(function(st) {
        return st.id && (st.status !== "inactive" && st.status !== "deleted");
      });

      return jsonResponse({ status: "ok", staffList: staffList });
    }

    // 1. Trả về dữ liệu tab CHIẾT HÀNG
    if (type === "repackage") {
      var ssRepack = SpreadsheetApp.getActiveSpreadsheet();
      var sheetRepack = ssRepack.getSheetByName(SHEET_NAME_REPACKAGE) || ssRepack.getSheetByName("repackage_history");

      if (!sheetRepack || sheetRepack.getLastRow() <= 1) {
        return jsonResponse({ status: "ok", lockDate: lockDate, repackageRows: [] });
      }

      var lastRowR = sheetRepack.getLastRow();
      var lastColR = sheetRepack.getLastColumn();
      var headerRow = sheetRepack.getRange(1, 1, 1, lastColR).getValues()[0].map(function(h) { return String(h).trim(); });
      var dataR    = sheetRepack.getRange(2, 1, lastRowR - 1, lastColR).getValues();

      var repackageRows = dataR.map(function(row) {
        var obj = {};
        headerRow.forEach(function(key, i) {
          if (!key) return;
          var val = row[i];
          if (key === "date") {
            val = normalizeDateString(val);
          } else if (key === "fromQuantity" || key === "sessionFromQty" || key === "toQuantity" || key === "createdAt" || key === "updatedAt") {
            val = val !== "" && !isNaN(val) ? Number(val) : (val === "" ? 0 : val);
          } else {
            val = val !== undefined ? String(val) : "";
          }
          obj[key] = val;
        });

        // Tương thích ngược nếu sheet cũ chưa có cột sessionFromQty
        if (obj.sessionFromQty === undefined || obj.sessionFromQty === "") {
          obj.sessionFromQty = Number(obj.fromQuantity) || 0;
        }

        return obj;
      });

      return jsonResponse({ status: "ok", lockDate: lockDate, repackageRows: repackageRows });
    }

    // 2. Trả về dữ liệu tab XUẤT HÀNG (Mặc định)
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME_PHIEUXUAT);

    if (!sheet || sheet.getLastRow() <= 1) {
      return jsonResponse({ status: "ok", lockDate: lockDate, rows: [] });
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headerRowX = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data    = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    var rows = data.map(function(row) {
      var obj = {};
      headerRowX.forEach(function(key, i) {
        if (!key) return;
        var val = row[i];
        if (key === "date") {
          val = normalizeDateString(val);
        } else {
          val = val !== undefined ? String(val) : "";
        }
        obj[key] = val;
      });
      return obj;
    });

    return jsonResponse({ status: "ok", lockDate: lockDate, rows: rows });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString(), rows: [], repackageRows: [] });
  }
}

// ── doPost ───────────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action  = payload.action || "append";

    // Router Khóa Ngày Sổ Sách (Lưu vào tab CaiDat và ScriptProperties)
    if (action === "set_lock_date") {
      var role = String(payload.role || "").trim();
      if (role && role !== "root") {
        return jsonResponse({
          status: "error",
          message: "Từ chối thao tác: Chỉ Quản trị viên (Root) mới có quyền Khóa/Mở khóa ngày sổ sách."
        });
      }

      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(LOCK_TIMEOUT_MS);
      } catch (e) {
        return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
      }
      try {
        var newLockDate = String(payload.lockDate || "").trim();
        var lockedBy = String(payload.staff || payload.lockedBy || "Root").trim();
        setGlobalLockDate(newLockDate, lockedBy);
        return jsonResponse({ status: "ok", message: "Đã cập nhật ngày khóa sổ thành công.", lockDate: newLockDate, lockedBy: lockedBy });
      } finally {
        lock.releaseLock();
      }
    }

    // Router Quản Lý & Đổi PIN Nhân Viên
    if (action === "staff_save")       return actionStaffSave(payload);
    if (action === "staff_change_pin") return actionStaffChangePin(payload);

    // Router Xuất Hàng
    if (action === "append") return actionAppend(payload);
    if (action === "delete") return actionDelete(payload);
    if (action === "update") return actionUpdate(payload);

    // Router Chiết Hàng
    if (action === "repackage")        return actionRepackage(payload);
    if (action === "repackage_delete") return actionRepackageDelete(payload);
    if (action === "repackage_update") return actionRepackageUpdate(payload);

    return jsonResponse({ status: "error", message: "action không hợp lệ: " + action });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ============================================================
//  LOGIC CHO TAB XUẤT HÀNG (PhieuXuat)
// ============================================================

function actionAppend(payload) {
  var rows = payload.rows;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return jsonResponse({ status: "error", message: "Không có dữ liệu rows." });
  }

  // Chặn ghi vào ngày đã bị khóa sổ
  for (var rIdx = 0; rIdx < rows.length; rIdx++) {
    var r = rows[rIdx];
    if (r && r.date && isDateLockedBackend(r.date)) {
      var formattedD = normalizeDateString(r.date);
      return jsonResponse({
        status: "error",
        message: "Không thể thêm dữ liệu: Ngày " + formattedD + " đã bị khóa sổ."
      });
    }
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_PHIEUXUAT, HEADER_PHIEUXUAT);
    ensureColumnExists(sheet, "staff");
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });

    var existingIds = {};
    if (lastRow > 1) {
      var idColIdx = headers.indexOf("id");
      if (idColIdx === -1) idColIdx = 0;
      var idValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
      idValues.forEach(function(r) {
        var cleanId = String(r[0]).replace(/^'+/, '').trim();
        existingIds[cleanId] = true;
      });
    }

    var defaultStaff = String(payload.staff || "").trim();
    var newRows = rows
      .filter(function(row) {
        var cleanId = String(row.id || '').replace(/^'+/, '').trim();
        return cleanId && !existingIds[cleanId];
      })
      .map(function(row) {
        return headers.map(function(key) {
          if (key === "staff") {
            return (row["staff"] !== undefined && row["staff"] !== "") ? row["staff"] : defaultStaff;
          }
          return row[key] !== undefined ? row[key] : "";
        });
      });

    if (newRows.length === 0) {
      return jsonResponse({ status: "ok", message: "Không có dòng mới (tất cả đã tồn tại).", rowsWritten: 0 });
    }

    var insertAt = sheet.getLastRow() + 1;
    sheet.getRange(insertAt, 1, newRows.length, headers.length).setValues(newRows);
    
    var dateColIdx = headers.indexOf("date");
    if (dateColIdx !== -1) {
      sheet.getRange(insertAt, dateColIdx + 1, newRows.length, 1).setNumberFormat("@");
    }

    return jsonResponse({ status: "ok", message: "Đã ghi " + newRows.length + " dòng.", rowsWritten: newRows.length });
  } finally {
    lock.releaseLock();
  }
}

function actionDelete(payload) {
  var ids = payload.ids;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return jsonResponse({ status: "error", message: "Không có ids cần xóa." });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_PHIEUXUAT, HEADER_PHIEUXUAT);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: "ok", message: "Sheet đang trống.", rowsDeleted: 0 });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idColIdx = headers.indexOf("id");
    if (idColIdx === -1) idColIdx = 0;
    var dateColIdx = headers.indexOf("date");

    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var idSet = {};
    ids.forEach(function(id) {
      var clean = String(id).replace(/^'+/, '').trim();
      idSet[clean] = true;
    });

    // Chặn xóa nếu có dòng thuộc ngày đã bị khóa sổ
    if (dateColIdx !== -1) {
      for (var k = 0; k < allData.length; k++) {
        var rowId = String(allData[k][idColIdx]).replace(/^'+/, '').trim();
        if (idSet[rowId]) {
          var rowDate = allData[k][dateColIdx];
          if (isDateLockedBackend(rowDate)) {
            return jsonResponse({
              status: "error",
              message: "Không thể xóa: Dữ liệu thuộc ngày đã bị khóa sổ (" + normalizeDateString(rowDate) + ")."
            });
          }
        }
      }
    }

    var deleted = 0;
    for (var i = allData.length - 1; i >= 0; i--) {
      var cellId = String(allData[i][idColIdx]).replace(/^'+/, '').trim();
      if (idSet[cellId]) {
        sheet.deleteRow(i + 2);
        deleted++;
      }
    }

    return jsonResponse({ status: "ok", message: "Đã xóa " + deleted + " dòng.", rowsDeleted: deleted });
  } finally {
    lock.releaseLock();
  }
}

function actionUpdate(payload) {
  var row = payload.row;
  if (!row || !row.id) {
    return jsonResponse({ status: "error", message: "Thiếu id trong row." });
  }

  // 1. Chặn nếu ngày mới bị khóa sổ
  if (row.date && isDateLockedBackend(row.date)) {
    return jsonResponse({
      status: "error",
      message: "Không thể cập nhật: Ngày mới (" + normalizeDateString(row.date) + ") đã bị khóa sổ."
    });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet   = getOrCreateSheet(SHEET_NAME_PHIEUXUAT, HEADER_PHIEUXUAT);
    ensureColumnExists(sheet, "staff");
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: "error", message: "Không tìm thấy dòng id=" + row.id });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idColIdx = headers.indexOf("id");
    if (idColIdx === -1) idColIdx = 0;
    var dateColIdx = headers.indexOf("date");

    var idCol = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
    var targetRow = -1;
    var searchId = String(row.id).replace(/^'+/, '').trim();
    for (var i = 0; i < idCol.length; i++) {
      var cellId = String(idCol[i][0]).replace(/^'+/, '').trim();
      if (cellId === searchId) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return jsonResponse({ status: "error", message: "Không tìm thấy dòng id=" + row.id });
    }

    var currentValues = sheet.getRange(targetRow, 1, 1, lastCol).getValues()[0];

    // 2. Chặn nếu ngày hiện tại của dòng trên Sheet đã bị khóa sổ
    if (dateColIdx !== -1) {
      var currentDate = currentValues[dateColIdx];
      if (isDateLockedBackend(currentDate)) {
        return jsonResponse({
          status: "error",
          message: "Không thể chỉnh sửa: Dữ liệu này thuộc ngày đã bị khóa sổ (" + normalizeDateString(currentDate) + ")."
        });
      }
    }

    var rowObj = {};
    headers.forEach(function(h, idx) { rowObj[h] = currentValues[idx]; });

    var EDITABLE = ["date", "quantity", "sellingPrice", "purchasePrice", "note", "staff", "updatedAt"];
    EDITABLE.forEach(function(key) {
      if (row[key] !== undefined) rowObj[key] = row[key];
    });
    if (payload.staff && row["staff"] === undefined) {
      rowObj["staff"] = payload.staff;
    }

    var updatedValues = headers.map(function(key) { return rowObj[key]; });
    sheet.getRange(targetRow, 1, 1, lastCol).setValues([updatedValues]);

    var dateColIdx = headers.indexOf("date");
    if (dateColIdx !== -1) {
      sheet.getRange(targetRow, dateColIdx + 1, 1, 1).setNumberFormat("@");
    }

    return jsonResponse({ status: "ok", message: "Đã cập nhật dòng id=" + row.id });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
//  LOGIC CHO TAB CHIẾT HÀNG (repackage)
// ============================================================

function actionRepackage(payload) {
  var rows = payload.rows;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return jsonResponse({ status: "error", message: "Không có dữ liệu rows chiết hàng." });
  }

  // Chặn thêm chiết hàng vào ngày đã bị khóa sổ
  for (var rIdx = 0; rIdx < rows.length; rIdx++) {
    var r = rows[rIdx];
    if (r && r.date && isDateLockedBackend(r.date)) {
      var formattedD = normalizeDateString(r.date);
      return jsonResponse({
        status: "error",
        message: "Không thể thêm chiết hàng: Ngày " + formattedD + " đã bị khóa sổ."
      });
    }
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_REPACKAGE, HEADER_REPACKAGE);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });

    // Đảm bảo có cột sessionFromQty và staff
    ensureColumnExists(sheet, "sessionFromQty");
    ensureColumnExists(sheet, "staff");
    lastCol = sheet.getLastColumn();
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });

    var existingIds = {};
    if (lastRow > 1) {
      var idColIdx = headers.indexOf("id");
      if (idColIdx === -1) idColIdx = 0;
      var idValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
      idValues.forEach(function(r) {
        var cleanId = String(r[0]).replace(/^'+/, '').trim();
        existingIds[cleanId] = true;
      });
    }

    var defaultStaff = String(payload.staff || "").trim();
    var newRows = rows
      .filter(function(row) {
        var cleanId = String(row.id || '').replace(/^'+/, '').trim();
        return cleanId && !existingIds[cleanId];
      })
      .map(function(row) {
        return headers.map(function(key) {
          var val = row[key];
          if (key === "staff") {
            return (val !== undefined && val !== "") ? val : defaultStaff;
          }
          if (val === undefined) {
            if (key === "sessionFromQty") return row["fromQuantity"] !== undefined ? row["fromQuantity"] : 0;
            return "";
          }
          return val;
        });
      });

    if (newRows.length === 0) {
      return jsonResponse({ status: "ok", message: "Không có dòng mới.", rowsWritten: 0 });
    }

    var insertAt = sheet.getLastRow() + 1;
    sheet.getRange(insertAt, 1, newRows.length, headers.length).setValues(newRows);

    var dateColIdx = headers.indexOf("date");
    if (dateColIdx !== -1) {
      sheet.getRange(insertAt, dateColIdx + 1, newRows.length, 1).setNumberFormat("@");
    }

    return jsonResponse({ status: "ok", message: "Đã ghi " + newRows.length + " dòng chiết hàng.", rowsWritten: newRows.length });
  } finally {
    lock.releaseLock();
  }
}

function actionRepackageDelete(payload) {
  var ids = payload.ids;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return jsonResponse({ status: "error", message: "Không có ids chiết hàng cần xóa." });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_REPACKAGE, HEADER_REPACKAGE);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: "ok", message: "Sheet chiết hàng đang trống.", rowsDeleted: 0 });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idColIdx = headers.indexOf("id");
    if (idColIdx === -1) idColIdx = 0;
    var dateColIdx = headers.indexOf("date");

    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var idSet = {};
    ids.forEach(function(id) {
      var clean = String(id).replace(/^'+/, '').trim();
      idSet[clean] = true;
    });

    // Chặn xóa chiết hàng nếu có dòng thuộc ngày đã bị khóa sổ
    if (dateColIdx !== -1) {
      for (var k = 0; k < allData.length; k++) {
        var rowId = String(allData[k][idColIdx]).replace(/^'+/, '').trim();
        if (idSet[rowId]) {
          var rowDate = allData[k][dateColIdx];
          if (isDateLockedBackend(rowDate)) {
            return jsonResponse({
              status: "error",
              message: "Không thể xóa chiết hàng: Dữ liệu thuộc ngày đã bị khóa sổ (" + normalizeDateString(rowDate) + ")."
            });
          }
        }
      }
    }

    var deleted = 0;
    for (var i = allData.length - 1; i >= 0; i--) {
      var cellId = String(allData[i][idColIdx]).replace(/^'+/, '').trim();
      if (idSet[cellId]) {
        sheet.deleteRow(i + 2);
        deleted++;
      }
    }

    return jsonResponse({ status: "ok", message: "Đã xóa " + deleted + " dòng chiết hàng.", rowsDeleted: deleted });
  } finally {
    lock.releaseLock();
  }
}

function actionRepackageUpdate(payload) {
  var rowsToUpdate = [];
  if (payload.rows && Array.isArray(payload.rows)) {
    rowsToUpdate = payload.rows;
  } else if (payload.row && payload.row.id) {
    rowsToUpdate = [payload.row];
  }

  if (rowsToUpdate.length === 0) {
    return jsonResponse({ status: "error", message: "Thiếu dữ liệu rows / row trong action repackage_update." });
  }

  // 1. Chặn nếu ngày mới bị khóa sổ
  for (var uIdx = 0; uIdx < rowsToUpdate.length; uIdx++) {
    var uRow = rowsToUpdate[uIdx];
    if (uRow && uRow.date && isDateLockedBackend(uRow.date)) {
      return jsonResponse({
        status: "error",
        message: "Không thể cập nhật chiết hàng: Ngày mới (" + normalizeDateString(uRow.date) + ") đã bị khóa sổ."
      });
    }
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_REPACKAGE, HEADER_REPACKAGE);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: "error", message: "Sheet chiết hàng đang trống." });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });

    // Đảm bảo có cột sessionFromQty và staff trong headers
    ensureColumnExists(sheet, "sessionFromQty");
    ensureColumnExists(sheet, "staff");
    lastCol = sheet.getLastColumn();
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });

    var idColIdx = headers.indexOf("id");
    if (idColIdx === -1) idColIdx = 0;
    var dateColIdx = headers.indexOf("date");

    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var idToRowIndex = {};
    for (var i = 0; i < allData.length; i++) {
      var rawId = String(allData[i][idColIdx]).replace(/^'+/, '').trim();
      idToRowIndex[rawId] = i + 2;
    }

    // 2. Chặn nếu ngày hiện tại của các dòng chiết hàng trên Sheet đã bị khóa sổ
    if (dateColIdx !== -1) {
      for (var j = 0; j < rowsToUpdate.length; j++) {
        var rCheck = rowsToUpdate[j];
        if (!rCheck || !rCheck.id) continue;
        var rTargetId = String(rCheck.id).replace(/^'+/, '').trim();
        var rTargetRow = idToRowIndex[rTargetId];
        if (rTargetRow) {
          var currDate = allData[rTargetRow - 2][dateColIdx];
          if (isDateLockedBackend(currDate)) {
            return jsonResponse({
              status: "error",
              message: "Không thể cập nhật chiết hàng: Dữ liệu thuộc ngày đã bị khóa sổ (" + normalizeDateString(currDate) + ")."
            });
          }
        }
      }
    }

    var updatedCount = 0;

    rowsToUpdate.forEach(function(row) {
      if (!row || !row.id) return;
      var targetId = String(row.id).replace(/^'+/, '').trim();
      var targetRow = idToRowIndex[targetId];
      if (!targetRow) return;

      var currentValues = sheet.getRange(targetRow, 1, 1, lastCol).getValues()[0];
      var rowObj = {};
      headers.forEach(function(h, idx) { rowObj[h] = currentValues[idx]; });

      // Cập nhật các trường
      if (row.date !== undefined)           rowObj["date"] = row.date;
      if (row.fromQuantity !== undefined)   rowObj["fromQuantity"] = Number(row.fromQuantity);
      if (row.sessionFromQty !== undefined) rowObj["sessionFromQty"] = Number(row.sessionFromQty);
      if (row.toQuantity !== undefined)     rowObj["toQuantity"] = Number(row.toQuantity);
      if (row.note !== undefined)           rowObj["note"] = String(row.note);
      if (row.staff !== undefined)          rowObj["staff"] = String(row.staff);
      else if (payload.staff)               rowObj["staff"] = String(payload.staff);
      if (row.updatedAt !== undefined)      rowObj["updatedAt"] = Number(row.updatedAt);

      var newRowValues = headers.map(function(h) {
        return rowObj[h] !== undefined ? rowObj[h] : "";
      });

      sheet.getRange(targetRow, 1, 1, lastCol).setValues([newRowValues]);

      if (dateColIdx !== -1) {
        sheet.getRange(targetRow, dateColIdx + 1, 1, 1).setNumberFormat("@");
      }
      updatedCount++;
    });

    return jsonResponse({ status: "ok", message: "Đã cập nhật " + updatedCount + " dòng chiết hàng.", updatedCount: updatedCount });
  } finally {
    lock.releaseLock();
  }
}

// ── Helpers ──────────────────────────────────────────────────
function getOrCreateSheet(name, header) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
    var headerRange = sheet.getRange(1, 1, 1, header.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#013755");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeDateString(val) {
  if (val instanceof Date && !isNaN(val.getTime())) {
    var d = val.getDate();
    var m = val.getMonth() + 1;
    var y = val.getFullYear();
    return (d < 10 ? "0" + d : d) + "-" + (m < 10 ? "0" + m : m) + "-" + y;
  }
  var s = String(val || "").trim();
  if (s && !/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      var dd = parsed.getDate();
      var mm = parsed.getMonth() + 1;
      var yy = parsed.getFullYear();
      return (dd < 10 ? "0" + dd : dd) + "-" + (mm < 10 ? "0" + mm : mm) + "-" + yy;
    }
  }
  return s;
}

function toYMDBackend(dateVal) {
  if (!dateVal) return "";
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    var y = dateVal.getFullYear();
    var m = dateVal.getMonth() + 1;
    var d = dateVal.getDate();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
  }
  var s = String(dateVal).trim();
  var parts = s.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      var pY = parts[0];
      var pM = parts[1].length === 1 ? "0" + parts[1] : parts[1];
      var pD = parts[2].length === 1 ? "0" + parts[2] : parts[2];
      return pY + "-" + pM + "-" + pD; // YYYY-MM-DD
    }
    var pD = parts[0].length === 1 ? "0" + parts[0] : parts[0];
    var pM = parts[1].length === 1 ? "0" + parts[1] : parts[1];
    var pY = parts[2];
    return pY + "-" + pM + "-" + pD; // DD-MM-YYYY -> YYYY-MM-DD
  }
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    var py = parsed.getFullYear();
    var pm = parsed.getMonth() + 1;
    var pd = parsed.getDate();
    return py + "-" + (pm < 10 ? "0" + pm : pm) + "-" + (pd < 10 ? "0" + pd : pd);
  }
  return s;
}

function isDateLockedBackend(dateVal) {
  var lockDate = getGlobalLockDate();
  if (!lockDate || !dateVal) return false;
  var dYmd = toYMDBackend(dateVal);
  var lockYmd = toYMDBackend(lockDate);
  if (!dYmd || !lockYmd) return false;
  return dYmd <= lockYmd;
}

function getGlobalLockDate() {
  try {
    var p = PropertiesService.getScriptProperties().getProperty("LOCK_DATE");
    return p ? toYMDBackend(String(p).trim()) : "";
  } catch (e) {
    return "";
  }
}

function setGlobalLockDate(isoDate, lockedBy) {
  var cleanDate = toYMDBackend(isoDate);
  try {
    var props = PropertiesService.getScriptProperties();
    if (cleanDate) {
      props.setProperty("LOCK_DATE", cleanDate);
      if (lockedBy) {
        props.setProperty("LOCKED_BY", String(lockedBy).trim());
      }
    } else {
      props.deleteProperty("LOCK_DATE");
      props.deleteProperty("LOCKED_BY");
    }
  } catch (e) {}
}

function ensureColumnExists(sheet, colName) {
  if (!sheet || sheet.getLastColumn() < 1) return;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  if (headers.indexOf(colName) === -1) {
    var newColIdx = lastCol + 1;
    sheet.getRange(1, newColIdx).setValue(colName);
    var cell = sheet.getRange(1, newColIdx);
    cell.setFontWeight("bold");
    cell.setBackground("#013755");
    cell.setFontColor("#ffffff");
  }
}

// ── Xử lý lưu danh sách nhân viên (Dành riêng cho Root) ───────
function actionStaffSave(payload) {
  var staffList = payload.staffList;
  if (!staffList || !Array.isArray(staffList)) {
    return jsonResponse({ status: "error", message: "Dữ liệu staffList không hợp lệ." });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_STAFF, HEADER_STAFF);
    var now = new Date().getTime();

    var rowsToWrite = staffList.map(function(st) {
      return [
        "'" + String(st.id || "").replace(/^'+/, "").trim(),
        String(st.name || "").trim(),
        "'" + String(st.pin || "").replace(/^'+/, "").trim(),
        String(st.role || "staff").trim(),
        st.createdAt || now,
        now,
        st.status || "active"
      ];
    });

    sheet.clearContents();
    sheet.getRange(1, 1, 1, HEADER_STAFF.length).setValues([HEADER_STAFF]);
    var headerRange = sheet.getRange(1, 1, 1, HEADER_STAFF.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#013755");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);

    if (rowsToWrite.length > 0) {
      sheet.getRange(2, 1, rowsToWrite.length, HEADER_STAFF.length).setValues(rowsToWrite);
      sheet.getRange(2, 1, rowsToWrite.length, 1).setNumberFormat("@");
      sheet.getRange(2, 3, rowsToWrite.length, 1).setNumberFormat("@");
    }

    return jsonResponse({ status: "ok", message: "Đã cập nhật danh sách nhân viên thành công.", count: rowsToWrite.length });
  } finally {
    lock.releaseLock();
  }
}

// ── Xử lý nhân viên tự đổi PIN của chính mình ─────────────────
function actionStaffChangePin(payload) {
  var staffId = String(payload.staffId || "").replace(/^'+/, "").trim();
  var oldPin = String(payload.oldPin || "").replace(/^'+/, "").trim();
  var newPin = String(payload.newPin || "").replace(/^'+/, "").trim();

  if (!staffId || !oldPin || !newPin) {
    return jsonResponse({ status: "error", message: "Vui lòng cung cấp đầy đủ thông tin: Mã nhân viên, PIN cũ và PIN mới." });
  }

  if (oldPin === newPin) {
    return jsonResponse({ status: "error", message: "Mã PIN mới phải khác mã PIN cũ." });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_STAFF, HEADER_STAFF);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: "error", message: "Không tìm thấy dữ liệu nhân viên trong hệ thống." });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idColIdx = headers.indexOf("id");
    var pinColIdx = headers.indexOf("pin");
    var updateColIdx = headers.indexOf("updatedAt");

    if (idColIdx === -1 || pinColIdx === -1) {
      return jsonResponse({ status: "error", message: "Bảng nhân viên thiếu cột id hoặc pin." });
    }

    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var targetRowIdx = -1;

    // 1. Kiểm tra xác thực staffId và oldPin
    for (var i = 0; i < allData.length; i++) {
      var cellId = String(allData[i][idColIdx]).replace(/^'+/, "").trim();
      if (cellId === staffId) {
        var cellPin = String(allData[i][pinColIdx]).replace(/^'+/, "").trim();
        if (cellPin !== oldPin) {
          return jsonResponse({ status: "error", message: "Mã PIN hiện tại không chính xác!" });
        }
        targetRowIdx = i + 2;
        break;
      }
    }

    if (targetRowIdx === -1) {
      return jsonResponse({ status: "error", message: "Không tìm thấy nhân viên trong hệ thống." });
    }

    sheet.getRange(targetRowIdx, pinColIdx + 1).setValue("'" + newPin);
    sheet.getRange(targetRowIdx, pinColIdx + 1).setNumberFormat("@");
    if (updateColIdx !== -1) {
      sheet.getRange(targetRowIdx, updateColIdx + 1).setValue(new Date().getTime());
    }

    return jsonResponse({ status: "ok", message: "Đổi mã PIN thành công!" });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
