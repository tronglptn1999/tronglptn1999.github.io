// Dán toàn bộ file này vào Google Sheet: Tiện ích mở rộng > Apps Script
// Sau khi dán: Triển khai > Quản lý bản triển khai > Sửa (biểu tượng bút) > Phiên bản: "Phiên bản mới" > Triển khai
// Sheet có 3 tab: "RSVP" (xác nhận), "LuuBut" (lời chúc hiển thị), "BiChan" (bản ghi bị chặn spam)

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}

var BAD = /(https?:|www\.|\.com\b|\.net\b|\.vn\b|\.xyz\b|\.ru\b|t\.me|zalo\.me|bit\.ly)/i;

function block_(why, d) {
  sheet_("BiChan", ["Thời gian", "Lý do", "Tên", "Lời chúc", "Thiết bị"])
    .appendRow([new Date(), why, String(d.name || "").slice(0, 60), String(d.msg || "").slice(0, 300), String(d.dev || "")]);
  return ContentService.createTextOutput("blocked");
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return ContentService.createTextOutput("bad"); }
  var name = String(d.name || "").trim().slice(0, 60);
  var msg = String(d.msg || "").trim().slice(0, 300);
  var dev = String(d.dev || "").slice(0, 40);
  if (name.length < 2) return ContentService.createTextOutput("no name");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cache = CacheService.getScriptCache();
    // 1) nhập quá nhanh (bot điền form tức thì)
    if (Number(d.took) < 3000) return block_("Gửi quá nhanh", d);
    // 2) có link / quảng cáo
    if (BAD.test(name) || BAD.test(msg)) return block_("Có đường link", d);
    // 3) trùng nội dung trong 6 giờ
    var key = "m_" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, name.toLowerCase() + "|" + msg.toLowerCase()));
    if (cache.get(key)) return block_("Trùng nội dung", d);
    // 4) mỗi thiết bị tối đa 5 lần / 6 giờ
    var dk = "d_" + dev, dc = Number(cache.get(dk) || 0);
    if (dev && dc >= 5) return block_("Thiết bị gửi quá nhiều", d);
    // 5) toàn hệ thống tối đa 30 lần / phút
    var gk = "g_" + Math.floor(Date.now() / 60000), gc = Number(cache.get(gk) || 0);
    if (gc >= 30) return block_("Quá tải toàn hệ thống", d);

    cache.put(key, "1", 21600);
    if (dev) cache.put(dk, String(dc + 1), 21600);
    cache.put(gk, String(gc + 1), 120);

    var now = new Date();
    sheet_("RSVP", ["Thời gian", "Tên", "Bên", "Tham dự", "Số người", "Lời chúc"])
      .appendRow([now, name, d.side, d.go, Math.min(10, Math.max(1, Number(d.num) || 1)), msg]);
    if (msg) sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc"]).appendRow([now, name, msg]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var sh = sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc"]);
  var n = sh.getLastRow() - 1;
  var rows = n > 0 ? sh.getRange(2, 1, n, 3).getValues() : [];
  var out = rows.slice(-100).map(function (r) { return { n: r[1], m: r[2] }; });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
