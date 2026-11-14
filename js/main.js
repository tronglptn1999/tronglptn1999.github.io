(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Giấy màu ---------- */
  function confetti(n) {
    if (calm) return;
    var cols = ["#ecd29a", "#c8a055", "#fffaf1", "#a01c2c", "#f7e6b4", "#d42a42"];
    for (var i = 0; i < n; i++) {
      var c = document.createElement("i");
      c.className = "cf";
      c.style.cssText = "left:" + Math.random() * 100 + "vw;background:" + cols[i % cols.length] +
        ";animation-duration:" + (2.6 + Math.random() * 2.6) + "s;animation-delay:" + Math.random() * .8 +
        "s;--dx:" + (Math.random() * 200 - 100) + "px;--rt:" + (Math.random() * 900 - 450) + "deg";
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 6500); })(c);
    }
  }

  /* ---------- Cổng hỷ ---------- */
  var gate = $("#gate"), bgm = $("#bgm"), musicBtn = $("#musicBtn");
  var face = '<div class="face">' + $("#faceTpl").innerHTML + "</div>";
  gate.querySelectorAll(".leaf").forEach(function (l) { l.innerHTML = face; });
  /* nhạc vào êm: âm lượng tăng dần (iPhone không cho chỉnh âm lượng nên sẽ phát thẳng) */
  var fadeT = null;
  function playSoft(ms) {
    clearInterval(fadeT);
    try { bgm.volume = 0; } catch (e) {}
    var p = bgm.play(), t0 = Date.now();
    fadeT = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms);
      try { bgm.volume = k * k; } catch (e) {}
      if (k >= 1) clearInterval(fadeT);
    }, 80);
    if (p && p.then) p.then(function () { musicBtn.classList.add("on"); }).catch(function () { clearInterval(fadeT); });
    else musicBtn.classList.add("on");
  }
  /* chỉ mở cửa khi ảnh bìa đã tải xong (chờ tối đa 6 giây) */
  var heroImg = $("#heroBg img"), heroReady = heroImg.complete && heroImg.naturalWidth > 0, wantOpen = false;
  function heroDone() { heroReady = true; if (wantOpen) openGate(); }
  heroImg.addEventListener("load", heroDone);
  heroImg.addEventListener("error", heroDone);
  function openGate() {
    if (gate.classList.contains("open")) return;
    gate.classList.remove("wait");
    gate.classList.add("open");
    document.body.classList.add("opened");
    window.scrollTo(0, 0);
    setTimeout(function () { confetti(46); }, 700);
    setTimeout(function () {
      gate.remove();
      document.body.classList.remove("locked");
      observe();
    }, 2200);
  }
  $("#btnOpen").addEventListener("click", function () {
    if (wantOpen) return;
    wantOpen = true;
    playSoft(3500);
    if (heroReady) { openGate(); return; }
    gate.classList.add("wait");
    gate.querySelectorAll(".g-hint").forEach(function (el) { el.textContent = "Đang mở thiệp…"; });
    setTimeout(openGate, 6000);
  });
  bgm.addEventListener("canplay", function () { musicBtn.hidden = false; });
  musicBtn.addEventListener("click", function () {
    if (bgm.paused) playSoft(1200);
    else { clearInterval(fadeT); bgm.pause(); musicBtn.classList.remove("on"); }
  });

  /* ---------- Bụi vàng ---------- */
  (function () {
    if (calm) return;
    var cv = $("#dust"), ctx = cv.getContext("2d"), W, H, ps = [], dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener("resize", size);
    for (var i = 0; i < 42; i++) ps.push({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: .5 + Math.random() * 1.7,
      vy: -(.08 + Math.random() * .26), vx: (Math.random() - .5) * .16, p: Math.random() * 6.28, s: .008 + Math.random() * .02
    });
    function loop() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.x += p.vx; p.y += p.vy; p.p += p.s;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
        var a = .18 + .6 * Math.abs(Math.sin(p.p));
        ctx.fillStyle = "rgba(240,212,150," + (a * .16) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, 6.28); ctx.fill();
        ctx.fillStyle = "rgba(250,230,180," + a + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------- Hiện dần khi cuộn ---------- */
  function observe() {
    var els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Cuộn: thanh tiến độ, ảnh bìa trôi, nút lời chúc ---------- */
  var bar = $("#progress"), heroBg = $("#heroBg"), fab = $(".fab"), rsvp = $("#rsvp"), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (y < vh * 1.2 && !calm) heroBg.style.transform = "translate3d(0," + (y * .28) + "px,0)";
    var r = rsvp.getBoundingClientRect();
    fab.classList.toggle("show", y > vh * .8 && (r.top > vh || r.bottom < 0));
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Album: dải ảnh tự trôi, vuốt được ---------- */
  var N = 16, photos = [];
  for (var i = 1; i <= N; i++) photos.push("img/photos/p" + (i < 10 ? "0" : "") + i + ".jpg");
  document.querySelectorAll(".reel").forEach(function (reel) {
    var list = reel.dataset.list.split(","), html = "";
    list.forEach(function (n) {
      html += '<a class="ph" data-i="' + (n - 1) + '"><img loading="lazy" src="' + photos[n - 1] + '" alt="Ảnh cưới ' + n + '"></a>';
    });
    reel.innerHTML = html + html;
    var dir = +reel.dataset.dir, pos = 0, hold = 0, vis = false, last = 0, started = false;
    function half() { return reel.scrollWidth / 2; }
    function step(t) {
      var dt = Math.min(50, t - (last || t)); last = t;
      if (vis && !calm && t > hold) {
        var h = half();
        if (!started) { pos = dir < 0 ? h : 0; started = true; }
        pos += dir * dt * .028;
        if (pos >= h) pos -= h; else if (pos <= 0) pos += h;
        reel.scrollLeft = pos;
      } else if (started) pos = reel.scrollLeft;
      requestAnimationFrame(step);
    }
    function pause() { hold = performance.now() + 3500; }
    ["touchstart", "touchmove", "pointerdown", "wheel"].forEach(function (ev) { reel.addEventListener(ev, pause, { passive: true }); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(reel);
    else vis = true;
    requestAnimationFrame(step);
  });

  /* ---------- Xem ảnh lớn ---------- */
  var lb = $("#lb"), lcur = 0, sx = 0;
  function show(i) { lcur = (i + N) % N; $("#lbImg").src = photos[lcur]; $("#lbC").textContent = (lcur + 1) + " / " + N; lb.hidden = false; }
  $("#album").addEventListener("click", function (e) {
    var a = e.target.closest(".ph"); if (a) show(+a.dataset.i);
  });
  $("#lbX").onclick = function () { lb.hidden = true; };
  $("#lbP").onclick = function (e) { e.stopPropagation(); show(lcur - 1); };
  $("#lbN").onclick = function (e) { e.stopPropagation(); show(lcur + 1); };
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.hidden = true; });
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(lcur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") lb.hidden = true;
    if (e.key === "ArrowRight") show(lcur + 1);
    if (e.key === "ArrowLeft") show(lcur - 1);
  });

  /* ---------- Lịch tháng 11/2026 ---------- */
  var cal = $("#calendar"), h = "";
  ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach(function (d) { h += "<b>" + d + "</b>"; });
  var first = (new Date(2026, 10, 1).getDay() + 6) % 7;
  for (var a = 0; a < first; a++) h += "<span></span>";
  var now = new Date(), today = (now.getFullYear() === 2026 && now.getMonth() === 10) ? now.getDate() : 0;
  for (var d = 1; d <= 30; d++) {
    var cls = d === 28 ? "hl" : d === 29 ? "hl heart" : d === today ? "today" : "";
    h += "<span" + (cls ? ' class="' + cls + '"' : "") + (d === today ? ' aria-label="Hôm nay, ngày ' + d + '"' : "") + ">" + d + "</span>";
  }
  cal.innerHTML = h;
  if (today && today < 28) $("#calNote").hidden = false;

  /* ---------- Đếm ngược tới 16:00 28/11/2026 ---------- */
  var target = new Date(2026, 10, 28, 16, 0, 0).getTime();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  function setNum(sel, v) {
    var el = $(sel); v = String(v);
    if (el.textContent === v) return;
    el.textContent = v; el.classList.remove("flip"); void el.offsetWidth; el.classList.add("flip");
  }
  function tick() {
    var t = Math.max(0, target - Date.now());
    setNum("#cd-d", Math.floor(t / 864e5));
    setNum("#cd-h", pad(Math.floor(t % 864e5 / 36e5)));
    setNum("#cd-m", pad(Math.floor(t % 36e5 / 6e4)));
    setNum("#cd-s", pad(Math.floor(t % 6e4 / 1e3)));
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Thêm vào lịch (.ics) ---------- */
  $("#btnIcs").addEventListener("click", function () {
    var ev = [
      ["20261128T160000", "20261128T190000", "Bữa cơm thân mật - Nhà gái (Quang Trọng & Thu Trang)", "Tư gia nhà gái, Xóm Kha Sơn, Xã Kha Sơn, Thái Nguyên"],
      ["20261128T173000", "20261128T203000", "Bữa cơm thân mật - Nhà trai (Quang Trọng & Thu Trang)", "Tư gia nhà trai, Xóm Lương Tạ, Xã Kha Sơn, Thái Nguyên"],
      ["20261129T090000", "20261129T110000", "Lễ Vu Quy - Thu Trang", "Tư gia nhà gái, Xóm Kha Sơn, Xã Kha Sơn, Thái Nguyên"],
      ["20261129T110000", "20261129T133000", "Lễ Thành Hôn - Quang Trọng", "Tư gia nhà trai, Xóm Lương Tạ, Xã Kha Sơn, Thái Nguyên"]
    ];
    var s = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Thiep cuoi//VI\r\n";
    ev.forEach(function (e, i) {
      s += "BEGIN:VEVENT\r\nUID:tt-" + i + "@thiep-cuoi\r\nDTSTAMP:20261111T000000Z\r\nDTSTART:" + e[0] + "\r\nDTEND:" + e[1] +
        "\r\nSUMMARY:" + e[2].replace(/,/g, "\\,") + "\r\nLOCATION:" + e[3].replace(/,/g, "\\,") + "\r\nEND:VEVENT\r\n";
    });
    s += "END:VCALENDAR";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([s], { type: "text/calendar;charset=utf-8" }));
    a.download = "dam-cuoi-quang-trong-thu-trang.ics";
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Hộp mừng cưới ---------- */
  $("#giftBtn").addEventListener("click", function () {
    this.hidden = true; this.style.display = "none";
    $("#giftCard").hidden = false;
    confetti(60);
  });
  document.querySelectorAll(".copy-acc").forEach(function (b) {
    b.addEventListener("click", function () {
      var no = b.dataset.acc;
      function ok() { b.textContent = "Đã sao chép ✓"; setTimeout(function () { b.textContent = "Sao chép số tài khoản"; }, 2500); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(no).then(ok).catch(function () { b.textContent = no; });
      else b.textContent = no;
    });
  });

  /* ---------- Cặp đôi hoạt hình ---------- */
  var toon = $("#toon");
  toon.addEventListener("click", function (e) {
    toon.classList.remove("jump"); void toon.getBoundingClientRect(); toon.classList.add("jump");
    for (var k = 0; k < 6; k++) {
      var hh = document.createElement("i");
      hh.className = "heartfx"; hh.textContent = "♥";
      hh.style.cssText = "left:" + (e.clientX - 10 + (Math.random() * 60 - 30)) + "px;top:" + (e.clientY - 10) + "px;--hx:" + (Math.random() * 100 - 50) + "px;animation-delay:" + k * 0.08 + "s";
      document.body.appendChild(hh);
      (function (n) { setTimeout(function () { n.remove(); }, 1500); })(hh);
    }
  });

  /* ---------- RSVP + lưu bút (Google Sheet) ---------- */
  var num = $("#fNum");
  for (var n = 1; n <= 10; n++) num.insertAdjacentHTML("beforeend", "<option value='" + n + "'>" + n + " người</option>");
  var wishes = store.get("wishes") || [];
  function renderWishes() {
    $("#wishes").innerHTML = wishes.length ? wishes.slice().reverse().map(function (w) {
      return '<div class="wish"><b>' + esc(w.n) + "</b><p>" + esc(w.m) + "</p></div>";
    }).join("") : '<p class="wish-empty">Hãy là người đầu tiên gửi lời chúc nhé</p>';
  }
  renderWishes();
  var SHEET_URL = "https://script.google.com/macros/s/AKfycbwMESugtYokov2LOsYFSEr_aV3G4B99Ynw_vguUX78uIUpYBUN5AHSv-U3wS4OkYbIa/exec";
  if (SHEET_URL) {
    fetch(SHEET_URL).then(function (r) { return r.json(); }).then(function (list) {
      if (Array.isArray(list)) { wishes = list; renderWishes(); }
    }).catch(function () {});
  }
  /* chống spam */
  var loadedAt = Date.now();
  var deviceId = (store.get("dev") || (function () { var d = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set("dev", d); return d; })());
  var BAD = /(https?:|www\.|\.com\b|\.net\b|\.vn\b|\.xyz\b|\.ru\b|t\.me|zalo\.me|bit\.ly)/i;
  function warn(text) {
    var th = $("#thanks"); th.className = "thanks warn"; th.textContent = text; th.hidden = false;
  }
  function spamCheck(name, msg) {
    var now = Date.now(), log = (store.get("sendlog") || []).filter(function (t) { return now - t < 864e5; });
    if (now - loadedAt < 4000) return "Bạn gửi hơi nhanh, vui lòng thử lại sau vài giây nhé.";
    if (log.length && now - log[log.length - 1] < 60000) return "Bạn vừa gửi xong, vui lòng đợi " + Math.ceil((60000 - (now - log[log.length - 1])) / 1000) + " giây rồi gửi tiếp nhé.";
    if (log.length >= 3) return "Bạn đã gửi đủ 3 lần trong hôm nay. Cảm ơn bạn rất nhiều 💛";
    if (name.length < 2 || BAD.test(name) || /(.)\1{7,}/.test(name)) return "Tên chưa hợp lệ, bạn kiểm tra lại giúp mình nhé.";
    if (msg && (BAD.test(msg) || /(.)\1{9,}/.test(msg))) return "Lời chúc không được chứa đường link hoặc ký tự lặp quá nhiều.";
    if (msg && msg === store.get("lastmsg")) return "Lời chúc này bạn đã gửi rồi, hãy viết thêm một lời mới nhé.";
    return "";
  }
  $("#rsvpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#fName").value.trim(), msg = $("#fMsg").value.trim(), go2 = $("#fGo").value;
    if (!name) return;
    if ($("#fWeb").value) { e.target.reset(); return; } /* bẫy bot: ô ẩn bị điền */
    var bad = spamCheck(name, msg);
    if (bad) { warn(bad); return; }
    var sent = (store.get("sendlog") || []).filter(function (t) { return Date.now() - t < 864e5; });
    sent.push(Date.now()); store.set("sendlog", sent); if (msg) store.set("lastmsg", msg);
    var sb = e.target.querySelector("button[type=submit]"); sb.disabled = true; setTimeout(function () { sb.disabled = false; }, 8000);
    $("#thanks").className = "thanks";
    var rec = { name: name, side: $("#fSide").value, go: go2, num: $("#fNum").value, msg: msg, dev: deviceId, took: Date.now() - loadedAt };
    if (SHEET_URL) {
      fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(rec) }).catch(function () {});
    } else {
      var list = store.get("rsvp") || [];
      rec.t = Date.now(); list.push(rec); store.set("rsvp", list);
    }
    if (msg) { wishes.push({ n: name, m: msg }); if (!SHEET_URL) store.set("wishes", wishes); renderWishes(); }
    var th = $("#thanks");
    th.innerHTML = go2 === "Có"
      ? "Cảm ơn <b>" + esc(name) + "</b>! Rất hân hạnh được đón tiếp " + esc($("#fNum").value) + " khách 💛"
      : "Cảm ơn <b>" + esc(name) + "</b> đã phản hồi. Hẹn gặp bạn dịp khác nhé!";
    th.hidden = false;
    e.target.reset();
    confetti(40);
  });

  /* ---------- Chia sẻ ---------- */
  var SHARE_URL = "https://tronglptn1999.github.io/";
  var SHARE_TEXT = "Trân trọng mời bạn đến dự lễ cưới của Quang Trọng & Thu Trang — 28 & 29/11/2026 tại Kha Sơn, Thái Nguyên 💕";
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  var msgT = null;
  function shareMsg(t) {
    var m = $("#shareMsg"); m.textContent = t; m.classList.add("on");
    clearTimeout(msgT); msgT = setTimeout(function () { m.classList.remove("on"); }, 4000);
  }
  function copyLink(done) {
    var txt = SHARE_TEXT + "\n" + SHARE_URL;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(fallback);
    else fallback();
    function fallback() {
      var t = document.createElement("textarea"); t.value = txt; t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) { shareMsg(SHARE_URL); }
      t.remove();
    }
  }
  $("#shFb").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(SHARE_URL);
  $("#shFb").addEventListener("click", function (e) {
    if (isMobile) return;
    e.preventDefault();
    window.open(this.href, "fbshare", "width=640,height=560");
  });
  /* Zalo không có link chia sẻ công khai: trên điện thoại mở bảng chia sẻ của máy (chọn Zalo), trên máy tính sao chép link */
  $("#shZalo").addEventListener("click", function () {
    if (navigator.share && isMobile) {
      navigator.share({ title: document.title, text: SHARE_TEXT, url: SHARE_URL }).catch(function () {});
    } else {
      copyLink(function () { shareMsg("Đã sao chép lời mời và link thiệp — mở Zalo, dán vào cuộc trò chuyện để gửi nhé"); });
    }
  });
  /* Messenger: điện thoại mở thẳng app Messenger; máy tính sao chép link rồi mở messenger.com */
  $("#shMs").href = isMobile ? "fb-messenger://share/?link=" + encodeURIComponent(SHARE_URL) : "https://www.messenger.com/";
  $("#shMs").addEventListener("click", function (e) {
    if (isMobile) return;
    e.preventDefault();
    copyLink(function () { shareMsg("Đã sao chép lời mời và link thiệp — dán vào tin nhắn Messenger để gửi nhé"); });
    window.open("https://www.messenger.com/", "_blank", "noopener");
  });
  /* TikTok không nhận chia sẻ link từ trang web: điện thoại mở bảng chia sẻ (chọn TikTok), máy tính sao chép link */
  $("#shTt").addEventListener("click", function () {
    if (navigator.share && isMobile) {
      navigator.share({ title: document.title, text: SHARE_TEXT, url: SHARE_URL }).catch(function () {});
    } else {
      copyLink(function () { shareMsg("Đã sao chép lời mời và link thiệp — mở TikTok, dán vào tin nhắn hoặc phần mô tả nhé"); });
    }
  });
  $("#shCopy").addEventListener("click", function () {
    copyLink(function () { shareMsg("Đã sao chép lời mời và link thiệp ✓"); });
  });
})();
