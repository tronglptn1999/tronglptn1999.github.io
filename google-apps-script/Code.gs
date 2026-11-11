// Dán toàn bộ file này vào Google Sheet: Tiện ích mở rộng > Apps Script
// Sheet sẽ tự có 2 tab: "RSVP" (xác nhận tham dự) và "LuuBut" (lời chúc)

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var now = new Date();
  var name = String(d.name || "").slice(0, 60);
  var msg = String(d.msg || "").slice(0, 300);
  if (!name) return ContentService.createTextOutput("no name");
  sheet_("RSVP", ["Thời gian", "Tên", "Bên", "Tham dự", "Số người", "Lời chúc"])
    .appendRow([now, name, d.side, d.go, d.num, msg]);
  if (msg) sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc"]).appendRow([now, name, msg]);
  return ContentService.createTextOutput("ok");
}

function doGet() {
  var sh = sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc"]);
  var n = sh.getLastRow() - 1;
  var rows = n > 0 ? sh.getRange(2, 1, n, 3).getValues() : [];
  var out = rows.slice(-100).map(function (r) { return { n: r[1], m: r[2] }; });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
