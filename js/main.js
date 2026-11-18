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
      autoBtn.hidden = false;
      touched = false; /* bỏ qua cú chạm mở thiệp */
      setTimeout(function () { if (!touched) setAuto(true); }, 1000);
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
    var cv = $("#dust"), ctx = cv.getContext("2d"), W, H, ps = [], dpr = 1, frame = 0;
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener("resize", size);
    for (var i = 0; i < 26; i++) ps.push({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: .5 + Math.random() * 1.7,
      vy: -(.08 + Math.random() * .26), vx: (Math.random() - .5) * .16, p: Math.random() * 6.28, s: .008 + Math.random() * .02
    });
    function loop() {
      requestAnimationFrame(loop);
      /* nhẹ máy: vẽ 30 khung/giây, ngừng hẳn khi trang đang tự cuộn */
      if (window.__autoScrolling || document.hidden || (frame++ & 1)) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.x += p.vx * 2; p.y += p.vy * 2; p.p += p.s * 2;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
        var a = .18 + .6 * Math.abs(Math.sin(p.p));
        ctx.fillStyle = "rgba(240,212,150," + (a * .16) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, 6.28); ctx.fill();
        ctx.fillStyle = "rgba(250,230,180," + a + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
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
    var top = rsvp.offsetTop, inR = y + vh > top && y < top + rsvp.offsetHeight;
    fab.classList.toggle("show", y > vh * .8 && !inR);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Album: dải ảnh tự trôi, vuốt được ---------- */
  var N = 18, photos = [];
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

  /* ---------- Thêm vào lịch: iPhone/iPad → Lịch Apple (.ics), Android & máy tính → Google Calendar ---------- */
  var CAL = [
    ["Thứ Bảy 28/11 · 16:00", "Bữa cơm thân mật - Nhà gái", "20261128T090000Z/20261128T120000Z", "Tư gia nhà gái, Xóm Kha Sơn, Xã Kha Sơn, Thái Nguyên", "https://maps.app.goo.gl/1mWAAwxjjZ4f8iiD8"],
    ["Thứ Bảy 28/11 · 17:30", "Bữa cơm thân mật - Nhà trai", "20261128T103000Z/20261128T133000Z", "Tư gia nhà trai, Xóm Lương Tạ, Xã Kha Sơn, Thái Nguyên", "https://maps.app.goo.gl/Lw4qW4eQi998K4JE6"],
    ["Chủ Nhật 29/11 · 09:00", "Lễ Vu Quy", "20261129T020000Z/20261129T040000Z", "Tư gia nhà gái, Xóm Kha Sơn, Xã Kha Sơn, Thái Nguyên", "https://maps.app.goo.gl/1mWAAwxjjZ4f8iiD8"],
    ["Chủ Nhật 29/11 · 11:00", "Lễ Thành Hôn", "20261129T040000Z/20261129T063000Z", "Tư gia nhà trai, Xóm Lương Tạ, Xã Kha Sơn, Thái Nguyên", "https://maps.app.goo.gl/Lw4qW4eQi998K4JE6"]
  ];
  var UA = navigator.userAgent;
  var IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var ANDROID = /Android/i.test(UA);
  var ICS_URL = new URL("cal/dam-cuoi.ics", location.href).href;
  var btnIcs = $("#btnIcs");
  btnIcs.textContent = IOS ? "+ Thêm vào Lịch iPhone" : ANDROID ? "+ Thêm vào Google Lịch" : "+ Thêm vào lịch";
  function gcal(e) {
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(e[1] + " (Quang Trọng & Thu Trang)") +
      "&dates=" + e[2] + "&ctz=Asia/Ho_Chi_Minh" +
      "&location=" + encodeURIComponent(e[3]) +
      "&details=" + encodeURIComponent("Chỉ đường: " + e[4] + "\nThiệp mời: https://tronglptn1999.github.io/");
  }
  function calSheet() {
    var sh = document.createElement("div");
    sh.className = "calsheet"; sh.id = "calSheet";
    sh.innerHTML = '<div class="cal-box" role="dialog" aria-label="Thêm vào lịch">' +
      '<button class="cal-x" type="button" aria-label="Đóng">×</button>' +
      "<h3>Thêm vào lịch</h3><p>" + (ANDROID ? "Chạm từng sự kiện để lưu vào Google Lịch" : "Chọn sự kiện để lưu vào Google Calendar") + "</p>" +
      CAL.map(function (e) {
        return '<a class="cal-item" target="_blank" rel="noopener" href="' + gcal(e) + '"><small>' + e[0] + "</small><b>" + e[1] + "</b><span>+</span></a>";
      }).join("") +
      '<a class="cal-ics" href="' + ICS_URL + '" download="dam-cuoi-quang-trong-thu-trang.ics">' +
      (ANDROID ? "Dùng lịch khác? Tải file lịch (.ics)" : "Dùng Outlook / Apple Lịch? Tải cả 4 sự kiện (.ics)") + "</a></div>";
    sh.addEventListener("click", function (e) {
      if (e.target === sh || e.target.closest(".cal-x")) sh.hidden = true;
    });
    document.body.appendChild(sh);
    return sh;
  }
  btnIcs.addEventListener("click", function () {
    if (IOS) { location.href = ICS_URL; return; } /* Safari mở thẳng hộp "Thêm tất cả" của Lịch */
    ($("#calSheet") || calSheet()).hidden = false;
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
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { toon.classList.toggle("vis", es[0].isIntersecting); }).observe(toon);
  else toon.classList.add("vis");
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
  var wishes = store.get("wishes") || [];
  /* thời gian gửi: "14:05 · 17/11/2026" (giờ Việt Nam) */
  function fmtTime(t) {
    if (!t) return "";
    var d = new Date(typeof t === "number" ? t : String(t));
    if (isNaN(d)) return "";
    d = new Date(d.getTime() + (d.getTimezoneOffset() + 420) * 6e4);
    var p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    return p2(d.getHours()) + ":" + p2(d.getMinutes()) + " · " + p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear();
  }
  /* lưu bút + trả lời: hiện 2 trả lời đầu, còn lại ẩn sau "… Xem thêm" */
  var openR = {};
  /* thời gian tương đối: "vừa xong", "5 phút trước", "hôm qua"… (rê/nhấn giữ để xem giờ chính xác) */
  function relTime(t) {
    var d = Number(new Date(typeof t === "number" ? t : String(t || "")));
    if (!d) return "";
    var s = (Date.now() - d) / 1000;
    if (s < 60) return "vừa xong";
    if (s < 3600) return Math.floor(s / 60) + " phút trước";
    if (s < 86400) return Math.floor(s / 3600) + " giờ trước";
    if (s < 172800) return "hôm qua";
    if (s < 604800) return Math.floor(s / 86400) + " ngày trước";
    return fmtTime(t).split(" · ")[1];
  }
  function timeTag(t) { var r = relTime(t); return r ? '<time title="' + fmtTime(t) + '">' + r + "</time>" : ""; }
  /* ảnh đại diện chữ cái: lấy chữ đầu của tên gọi (từ cuối), màu theo tên */
  var AV = ["#a01c2c", "#b0843a", "#6d1220", "#8a5a2b", "#c0606a", "#7a3b52", "#9c6b1f"];
  function avatar(name, small) {
    var n = String(name || "?").trim(), parts = n.split(/\s+/), ch = (parts[parts.length - 1] || n).charAt(0).toUpperCase() || "?", h = 0;
    for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return '<span class="av' + (small ? " sm" : "") + '" style="background:' + AV[h % AV.length] + '" aria-hidden="true">' + esc(ch) + "</span>";
  }
  function replyHtml(r) {
    return '<div class="rep">' + avatar(r.n, true) + '<div class="rb"><div class="wh"><b>' + esc(r.n) + "</b>" + timeTag(r.t) + "</div><p>" + esc(r.m) + "</p></div></div>";
  }
  function moreText(n, open) { return open ? "Thu gọn" : "… Xem thêm " + n + " trả lời"; }
  var PAGE = 5, shown = PAGE, flashId = 0;
  function renderWishes() {
    var box = $("#wishes");
    if (!wishes.length) { box.innerHTML = '<p class="wish-empty">Hãy là người đầu tiên gửi lời chúc nhé</p>'; return; }
    var list = wishes.slice().reverse(), nRep = 0;
    list.forEach(function (w) { nRep += (w.r || []).length; });
    var vis = list.slice(0, shown), rest = list.length - vis.length;
    box.innerHTML = '<div class="wb-head"><span>💌 <b>' + list.length + "</b> lời chúc" + (nRep ? " · <b>" + nRep + "</b> trả lời" : "") + "</span><span class=\"wb-sort\">Mới nhất</span></div>" +
      vis.map(function (w) {
        var rs = w.r || [], id = (!w.local && Number(w.t)) || 0, more = rs.length - 2, open = !!openR[id];
        var reps = rs.length ? '<div class="reps' + (open ? " open" : "") + '">' + rs.map(replyHtml).join("") +
          (more > 0 ? '<button class="rep-more" type="button">' + moreText(more, open) + "</button>" : "") + "</div>" : "";
        return '<div class="wish' + (w.local || (flashId && Number(w.t) === flashId) ? " fresh" : "") + '" data-id="' + id + '">' + avatar(w.n) +
          '<div class="wb"><div class="wh"><b>' + esc(w.n) + "</b>" + timeTag(w.t) + "</div>" +
          '<p class="wt">' + esc(w.m) + "</p>" + reps + (id ? '<button class="rep-btn" type="button">Trả lời</button>' : "") + "</div></div>";
      }).join("") +
      (rest > 0 ? '<button class="wb-more" type="button">Xem thêm ' + Math.min(PAGE, rest) + " lời chúc <small>(còn " + rest + ")</small></button>"
        : list.length > PAGE ? '<button class="wb-more less" type="button">Thu gọn danh sách</button>' : "");
    /* lời chúc dài quá 4 dòng: rút gọn, có nút xem thêm */
    box.querySelectorAll(".wt").forEach(function (p) {
      if (p.scrollHeight > p.clientHeight + 2) p.insertAdjacentHTML("afterend", '<button class="wt-more" type="button">Xem thêm</button>');
    });
  }
  $("#wishes").addEventListener("click", function (e) {
    var b = e.target.closest(".wb-more, .wt-more"); if (!b) return;
    e.stopPropagation();
    if (b.classList.contains("wt-more")) {
      var open = b.previousElementSibling.classList.toggle("full");
      b.textContent = open ? "Thu gọn" : "Xem thêm";
      return;
    }
    if (b.classList.contains("less")) { shown = PAGE; renderWishes(); $("#wishes").scrollIntoView({ block: "start" }); return; }
    shown += PAGE; renderWishes();
  }, true);
  function findWish(id) { for (var i = 0; i < wishes.length; i++) if (Number(wishes[i].t) === id) return wishes[i]; return null; }
  $("#wishes").addEventListener("click", function (e) {
    var wEl = e.target.closest(".wish"); if (!wEl) return;
    var id = Number(wEl.dataset.id);
    if (e.target.closest(".rep-more")) {
      var box = wEl.querySelector(".reps"), open = box.classList.toggle("open"), w = findWish(id);
      openR[id] = open;
      e.target.closest(".rep-more").textContent = moreText((w && w.r ? w.r.length : 2) - 2, open);
      if (!open) box.scrollIntoView({ block: "nearest" });
      return;
    }
    if (e.target.closest(".rep-cancel")) { wEl.querySelector(".rep-form").remove(); return; }
    if (e.target.closest(".rep-btn")) {
      var f = wEl.querySelector(".rep-form");
      if (!f) {
        (wEl.querySelector(".wb") || wEl).insertAdjacentHTML("beforeend", '<form class="rep-form" autocomplete="off">' +
          '<input class="rf-name" required maxlength="60" placeholder="Tên của bạn" value="' + esc(store.get("myname") || "") + '">' +
          '<textarea class="rf-msg" required rows="2" maxlength="300" placeholder="Viết trả lời…"></textarea>' +
          '<p class="rep-warn" hidden></p>' +
          '<div class="rf-act"><button class="rep-cancel" type="button">Huỷ</button><button class="btn sm" type="submit">Gửi trả lời</button></div></form>');
        f = wEl.querySelector(".rep-form");
      }
      (f.querySelector(".rf-name").value ? f.querySelector(".rf-msg") : f.querySelector(".rf-name")).focus();
    }
  });
  $("#wishes").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, wEl = f.closest(".wish"), id = Number(wEl.dataset.id), w = findWish(id);
    var name = f.querySelector(".rf-name").value.trim(), msg = f.querySelector(".rf-msg").value.trim(), warnEl = f.querySelector(".rep-warn");
    if (!w || !name || !msg) return;
    var now = Date.now(), log = (store.get("replylog") || []).filter(function (t) { return now - t < 864e5; }), bad = "";
    if (now - loadedAt < 4000) bad = "Bạn gửi hơi nhanh, thử lại sau vài giây nhé.";
    else if (log.length && now - log[log.length - 1] < 15000) bad = "Bạn vừa trả lời xong, đợi vài giây rồi gửi tiếp nhé.";
    else if (log.length >= 10) bad = "Bạn đã trả lời nhiều lần trong hôm nay. Cảm ơn bạn 💛";
    else if (name.length < 2 || BAD.test(name) || /(.)\1{7,}/.test(name)) bad = "Tên chưa hợp lệ, bạn kiểm tra lại giúp mình nhé.";
    else if (BAD.test(msg) || /(.)\1{9,}/.test(msg)) bad = "Trả lời không được chứa đường link hoặc ký tự lặp quá nhiều.";
    if (bad) { warnEl.textContent = bad; warnEl.hidden = false; return; }
    log.push(now); store.set("replylog", log); store.set("myname", name);
    if (SHEET_URL) fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ type: "reply", id: id, name: name, msg: msg, dev: deviceId, took: now - loadedAt }) }).catch(function () {});
    (w.r = w.r || []).push({ n: name, m: msg, t: now });
    if (w.r.length > 2) openR[id] = true;
    renderWishes();
  });
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
    var name = $("#fName").value.trim(), msg = $("#fMsg").value.trim();
    if (!name || !msg) return;
    if ($("#fWeb").value) { e.target.reset(); return; } /* bẫy bot: ô ẩn bị điền */
    var bad = spamCheck(name, msg);
    if (bad) { warn(bad); return; }
    var sent = (store.get("sendlog") || []).filter(function (t) { return Date.now() - t < 864e5; });
    sent.push(Date.now()); store.set("sendlog", sent); if (msg) store.set("lastmsg", msg);
    var sb = e.target.querySelector("button[type=submit]"); sb.disabled = true; setTimeout(function () { sb.disabled = false; }, 8000);
    $("#thanks").className = "thanks";
    var rec = { name: name, side: "", go: "", num: "", msg: msg, dev: deviceId, took: Date.now() - loadedAt };
    if (SHEET_URL) {
      fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(rec) }).catch(function () {});
    } else {
      var list = store.get("rsvp") || [];
      rec.t = Date.now(); list.push(rec); store.set("rsvp", list);
    }
    store.set("myname", name);
    wishes.push({ n: name, m: msg, t: Date.now(), local: true });
    shown = Math.max(shown, PAGE); if (!SHEET_URL) store.set("wishes", wishes); renderWishes();
    var th = $("#thanks");
    th.innerHTML = "Cảm ơn <b>" + esc(name) + "</b> đã gửi lời chúc 💛";
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
  /* ---------- Tự động cuộn trang: chạm/cuộn tay là dừng, bấm nút để chạy tiếp ---------- */
  var autoBtn = $("#autoBtn"), auto = false, touched = false, aLast = 0, aAcc = 0, aFrame = 16.7, aY = 0, SPEED = 50, root = document.documentElement;
  function atEnd() { return innerHeight + scrollY >= root.scrollHeight - 2; }
  /* Nhịp đều: đo chu kỳ khung hình (60/90/120Hz) rồi nhích đúng số điểm ảnh nguyên mỗi khung,
     tránh kiểu 0-1-0-1 lộn xộn gây giật. */
  function autoStep(t) {
    if (!auto) return;
    if (aLast) { var d = t - aLast; if (d > 4 && d < 40) aFrame += (d - aFrame) * .05; }
    aLast = t;
    if (Math.abs(scrollY - aY) > 2) aY = scrollY;
    /* k = số khung hình cho mỗi 1px: 60Hz → 1, 120Hz → 2 (đều ~60px/giây, không lệch nhịp) */
    var k = Math.max(1, Math.round(1000 / (SPEED * aFrame)));
    if (++aAcc >= k) { aAcc = 0; aY += 1; window.scrollTo(0, aY); }
    if (atEnd()) { setAuto(false); return; }
    requestAnimationFrame(autoStep);
  }
  function setAuto(on) {
    auto = on; window.__autoScrolling = on;
    autoBtn.classList.toggle("on", on);
    autoBtn.setAttribute("aria-label", on ? "Dừng tự cuộn" : "Tự động cuộn trang");
    root.style.scrollBehavior = on ? "auto" : "";
    if (on) { aLast = 0; aAcc = 0; aY = scrollY; requestAnimationFrame(autoStep); }
  }
  autoBtn.addEventListener("click", function () {
    touched = true;
    if (!auto && atEnd()) { root.style.scrollBehavior = "auto"; window.scrollTo(0, 0); }
    setAuto(!auto);
  });
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (e.target && e.target.nodeType === 1 && autoBtn.contains(e.target)) return;
      touched = true;
      if (auto) setAuto(false);
    }, { passive: true });
  });
})();
