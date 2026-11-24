// Dán toàn bộ file này vào Google Sheet: Tiện ích mở rộng > Apps Script
// Sau khi dán: Triển khai > Quản lý bản triển khai > Sửa (biểu tượng bút) > Phiên bản: "Phiên bản mới" > Triển khai
// Sheet có các tab: "RSVP", "LuuBut" (lời chúc), "TraLoi" (trả lời), "ThaTim" (thả tim), "BiChan" (bản ghi bị chặn spam)

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

// Thả tim / bỏ tim: mỗi thiết bị chỉ tính 1 tim cho mỗi lời chúc
function like_(d) {
  var id = Number(d.id), dev = String(d.dev || "").slice(0, 40), on = d.on !== false;
  if (!id || !dev) return ContentService.createTextOutput("bad like");
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cache = CacheService.getScriptCache(), k = "l_" + dev, c = Number(cache.get(k) || 0);
    if (c >= 120) return ContentService.createTextOutput("slow"); // tối đa 120 lần bấm tim / giờ / thiết bị
    cache.put(k, String(c + 1), 3600);
    var sh = sheet_("ThaTim", ["Mã lời chúc", "Thiết bị", "Thời gian"]), n = sh.getLastRow() - 1;
    var rows = n > 0 ? sh.getRange(2, 1, n, 2).getValues() : [], at = -1;
    for (var i = 0; i < rows.length; i++) if (Number(rows[i][0]) === id && String(rows[i][1]) === dev) { at = i; break; }
    if (on && at < 0) sh.appendRow([id, dev, new Date()]);
    if (!on && at >= 0) sh.deleteRow(at + 2);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return ContentService.createTextOutput("bad"); }
  if (d.type === "like") return like_(d);
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
    // Trả lời một lời chúc: lưu vào tab "TraLoi", cột "Mã lời chúc" = thời điểm (ms) của lời chúc gốc
    if (d.type === "reply") {
      var wid = Number(d.id);
      if (!wid || !msg) return ContentService.createTextOutput("bad reply");
      sheet_("TraLoi", ["Thời gian", "Mã lời chúc", "Tên", "Trả lời"]).appendRow([now, wid, name, msg]);
      return ContentService.createTextOutput("ok");
    }
    sheet_("RSVP", ["Thời gian", "Tên", "Bên", "Tham dự", "Số người", "Lời chúc"])
      .appendRow([now, name, d.side, d.go, Math.min(10, Math.max(1, Number(d.num) || 1)), msg]);
    var side = d.side === "trai" ? "Nhà trai" : d.side === "gai" ? "Nhà gái" : "";
    if (msg) sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc", "Bên"]).appendRow([now, name, msg, side]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var sh = sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc"]);
  var n = sh.getLastRow() - 1;
  var rows = n > 0 ? sh.getRange(2, 1, n, 4).getValues() : [];
  var ms = function (v) { return v instanceof Date ? v.getTime() : Number(new Date(v)) || 0; };
  // gom trả lời theo mã lời chúc
  var rs = sheet_("TraLoi", ["Thời gian", "Mã lời chúc", "Tên", "Trả lời"]), rn = rs.getLastRow() - 1, byId = {};
  (rn > 0 ? rs.getRange(2, 1, rn, 4).getValues() : []).forEach(function (r) {
    var k = String(Number(r[1]));
    (byId[k] = byId[k] || []).push({ n: r[2], m: r[3], t: ms(r[0]) });
  });
  // đếm tim theo mã lời chúc
  var hs = sheet_("ThaTim", ["Mã lời chúc", "Thiết bị", "Thời gian"]), hn = hs.getLastRow() - 1, hearts = {};
  (hn > 0 ? hs.getRange(2, 1, hn, 1).getValues() : []).forEach(function (r) {
    var k = String(Number(r[0])); hearts[k] = (hearts[k] || 0) + 1;
  });
  var out = rows.slice(-100).map(function (r) {
    var t = ms(r[0]);
    var s = r[3] === "Nhà trai" ? "trai" : r[3] === "Nhà gái" ? "gai" : "";
    return { n: r[1], m: r[2], s: s, t: t, r: byId[String(t)] || [], h: hearts[String(t)] || 0 };
  });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= Thông báo Gmail gom theo giờ =================
// Chạy hàm caiDatThongBao() MỘT LẦN trong trình chỉnh sửa (nút ▷ Chạy) để bật lịch gửi mỗi giờ.
// Mỗi giờ, nếu có lời chúc / trả lời mới thì gửi 1 email tổng hợp về Gmail của chủ script. Không có gì mới thì không gửi.
function caiDatThongBao() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "guiThongBaoTheoGio") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("guiThongBaoTheoGio").timeBased().everyHours(1).create();
  PropertiesService.getScriptProperties().setProperty("lastDigest", String(Date.now()));
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: "💌 Đã bật thông báo lời chúc theo giờ",
    htmlBody: "Từ giờ, mỗi giờ nếu thiệp cưới có lời chúc hoặc trả lời mới, bạn sẽ nhận 1 email tổng hợp tại đây."
  });
}

function guiThongBaoTheoGio() {
  var props = PropertiesService.getScriptProperties();
  var since = Number(props.getProperty("lastDigest") || 0), now = Date.now();
  var ms = function (v) { return v instanceof Date ? v.getTime() : Number(new Date(v)) || 0; };
  var h = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var fmt = function (t) { return Utilities.formatDate(new Date(t), "Asia/Ho_Chi_Minh", "HH:mm dd/MM"); };

  var ws = sheet_("LuuBut", ["Thời gian", "Tên", "Lời chúc"]), wn = ws.getLastRow() - 1;
  var wishes = (wn > 0 ? ws.getRange(2, 1, wn, 4).getValues() : []);
  var nameById = {};
  wishes.forEach(function (r) { nameById[String(ms(r[0]))] = r[1]; });
  var newW = wishes.filter(function (r) { var t = ms(r[0]); return t > since && t <= now; });

  var rs = sheet_("TraLoi", ["Thời gian", "Mã lời chúc", "Tên", "Trả lời"]), rn = rs.getLastRow() - 1;
  var newR = (rn > 0 ? rs.getRange(2, 1, rn, 4).getValues() : []).filter(function (r) { var t = ms(r[0]); return t > since && t <= now; });

  props.setProperty("lastDigest", String(now));
  if (!newW.length && !newR.length) return;

  var row = "padding:10px 12px;border-left:3px solid #c8a055;background:#fbf6ec;margin:8px 0;border-radius:4px";
  var html = '<div style="font-family:Arial,sans-serif;color:#4a0c16;max-width:560px">';
  if (newW.length) {
    html += "<h3 style=\"margin:16px 0 4px\">💌 " + newW.length + " lời chúc mới</h3>";
    newW.forEach(function (r) {
      html += '<div style="' + row + '"><b>' + h(r[1]) + "</b>" + (r[3] ? " · " + h(r[3]) : "") + ' <span style="color:#999;font-size:12px">' + fmt(ms(r[0])) + "</span><br>" + h(r[2]) + "</div>";
    });
  }
  if (newR.length) {
    html += "<h3 style=\"margin:16px 0 4px\">↩ " + newR.length + " trả lời mới</h3>";
    newR.forEach(function (r) {
      var to = nameById[String(Number(r[1]))];
      html += '<div style="' + row + '"><b>' + h(r[2]) + "</b>" + (to ? " trả lời <b>" + h(to) + "</b>" : "") +
        ' <span style="color:#999;font-size:12px">' + fmt(ms(r[0])) + "</span><br>" + h(r[3]) + "</div>";
    });
  }
  html += '<p style="margin-top:18px"><a href="https://tronglptn1999.github.io/#rsvp" style="color:#a01c2c">Mở sổ lưu bút trên thiệp →</a></p></div>';

  var parts = [];
  if (newW.length) parts.push(newW.length + " lời chúc mới");
  if (newR.length) parts.push(newR.length + " trả lời mới");
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: "💌 Thiệp cưới: " + parts.join(" · "), htmlBody: html });
}
