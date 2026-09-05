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
var LOCK_TIMEOUT_MS = 10000; // chờ lock tối đa 10 giây

var HEADER_PHIEUXUAT = [
  "id", "date", "productId", "productName",
  "quantity", "sellingPrice", "purchasePrice",
  "note", "createdAt", "updatedAt"
];

var HEADER_REPACKAGE = [
  "id", "sessionId", "date",
  "fromProductId", "fromProductName",
  "toProductId", "toProductName",
  "fromQuantity", "sessionFromQty", "toQuantity",
  "note", "createdAt", "updatedAt"
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
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(LOCK_TIMEOUT_MS);
      } catch (e) {
        return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
      }
      try {
        var newLockDate = String(payload.lockDate || "").trim();
        setGlobalLockDate(newLockDate);
        return jsonResponse({ status: "ok", message: "Đã cập nhật ngày khóa sổ thành công.", lockDate: newLockDate });
      } finally {
        lock.releaseLock();
      }
    }

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

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet = getOrCreateSheet(SHEET_NAME_PHIEUXUAT, HEADER_PHIEUXUAT);
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

    var newRows = rows
      .filter(function(row) {
        var cleanId = String(row.id || '').replace(/^'+/, '').trim();
        return cleanId && !existingIds[cleanId];
      })
      .map(function(row) {
        return headers.map(function(key) {
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

    var idCol = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
    var idSet = {};
    ids.forEach(function(id) {
      var clean = String(id).replace(/^'+/, '').trim();
      idSet[clean] = true;
    });

    var deleted = 0;
    for (var i = idCol.length - 1; i >= 0; i--) {
      var cellId = String(idCol[i][0]).replace(/^'+/, '').trim();
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

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Hệ thống bận, vui lòng thử lại." });
  }

  try {
    var sheet   = getOrCreateSheet(SHEET_NAME_PHIEUXUAT, HEADER_PHIEUXUAT);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: "error", message: "Không tìm thấy dòng id=" + row.id });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var idColIdx = headers.indexOf("id");
    if (idColIdx === -1) idColIdx = 0;

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
    var rowObj = {};
    headers.forEach(function(h, idx) { rowObj[h] = currentValues[idx]; });

    var EDITABLE = ["date", "quantity", "sellingPrice", "purchasePrice", "note", "updatedAt"];
    EDITABLE.forEach(function(key) {
      if (row[key] !== undefined) rowObj[key] = row[key];
    });

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

    // Đảm bảo có cột sessionFromQty
    if (headers.indexOf("sessionFromQty") === -1) {
      sheet.getRange(1, lastCol + 1).setValue("sessionFromQty");
      headers.push("sessionFromQty");
      lastCol = headers.length;
    }

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

    var newRows = rows
      .filter(function(row) {
        var cleanId = String(row.id || '').replace(/^'+/, '').trim();
        return cleanId && !existingIds[cleanId];
      })
      .map(function(row) {
        return headers.map(function(key) {
          var val = row[key];
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

    var idCol = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
    var idSet = {};
    ids.forEach(function(id) {
      var clean = String(id).replace(/^'+/, '').trim();
      idSet[clean] = true;
    });

    var deleted = 0;
    for (var i = idCol.length - 1; i >= 0; i--) {
      var cellId = String(idCol[i][0]).replace(/^'+/, '').trim();
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

    // Đảm bảo có cột sessionFromQty trong headers
    var sessionFromQtyColIdx = headers.indexOf("sessionFromQty");
    if (sessionFromQtyColIdx === -1) {
      sheet.getRange(1, lastCol + 1).setValue("sessionFromQty");
      headers.push("sessionFromQty");
      lastCol = headers.length;
    }

    var idColIdx = headers.indexOf("id");
    if (idColIdx === -1) idColIdx = 0;

    var idCol = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
    var idToRowIndex = {};
    for (var i = 0; i < idCol.length; i++) {
      var rawId = String(idCol[i][0]).replace(/^'+/, '').trim();
      idToRowIndex[rawId] = i + 2;
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
      if (row.updatedAt !== undefined)      rowObj["updatedAt"] = Number(row.updatedAt);

      var newRowValues = headers.map(function(h) {
        return rowObj[h] !== undefined ? rowObj[h] : "";
      });

      sheet.getRange(targetRow, 1, 1, lastCol).setValues([newRowValues]);

      var dateColIdx = headers.indexOf("date");
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
    headerRange.setBackground("#134441");
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

function toYMDBackend(dateStr) {
  if (!dateStr) return "";
  var s = String(dateStr).trim();
  var parts = s.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) return s; // YYYY-MM-DD
    return parts[2] + "-" + parts[1] + "-" + parts[0]; // DD-MM-YYYY -> YYYY-MM-DD
  }
  return s;
}

function isDateLockedBackend(dateStr) {
  var lockDate = getGlobalLockDate();
  if (!lockDate || !dateStr) return false;
  var dYmd = toYMDBackend(dateStr);
  var lockYmd = toYMDBackend(lockDate);
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

function setGlobalLockDate(isoDate) {
  var cleanDate = toYMDBackend(isoDate);
  try {
    if (cleanDate) {
      PropertiesService.getScriptProperties().setProperty("LOCK_DATE", cleanDate);
    } else {
      PropertiesService.getScriptProperties().deleteProperty("LOCK_DATE");
    }
  } catch (e) {}
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
