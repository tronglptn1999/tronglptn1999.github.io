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

  /* Cánh hoa rơi */
  function petals(n) {
    var box = $("#petals");
    for (var i = 0; i < n; i++) {
      var el = document.createElement("i");
      el.className = "petal";
      var s = 8 + Math.random() * 10;
      el.style.cssText = "left:" + Math.random() * 100 + "vw;width:" + s + "px;height:" + s +
        "px;animation-duration:" + (8 + Math.random() * 9) + "s;animation-delay:-" + Math.random() * 12 +
        "s;--dx:" + (Math.random() * 160 - 80) + "px";
      box.appendChild(el);
    }
  }
  petals(22);

  /* Mở phong bì */
  var cover = $("#cover"), bgm = $("#bgm"), musicBtn = $("#musicBtn");
  $("#btnOpen").addEventListener("click", function () {
    cover.classList.add("open");
    setTimeout(function () {
      cover.classList.add("gone");
      $("#invite").hidden = false;
      document.body.classList.remove("locked");
      window.scrollTo(0, 0);
      observe();
      petals(30);
      confetti(60);
    }, 1300);
    var p = bgm.play();
    if (p && p.then) p.then(function () { musicBtn.classList.add("on"); }).catch(function () {});
  });
  bgm.addEventListener("canplay", function () { musicBtn.hidden = false; });
  musicBtn.addEventListener("click", function () {
    if (bgm.paused) { bgm.play(); musicBtn.classList.add("on"); }
    else { bgm.pause(); musicBtn.classList.remove("on"); }
  });

  /* Album */
  var N = 16, gal = $("#gallery"), html = "";
  for (var i = 1; i <= N; i++) {
    var f = "img/photos/p" + (i < 10 ? "0" : "") + i + ".jpg";
    html += '<figure data-i="' + (i - 1) + '"><img loading="lazy" src="' + f + '" alt="Ảnh cưới ' + i + '"></figure>';
  }
  gal.innerHTML = html;
  var photos = [].map.call(gal.querySelectorAll("img"), function (im) { return im.getAttribute("src"); });

  /* Hiệu ứng khi cuộn */
  function observe() {
    var els = document.querySelectorAll(".rv,.gallery figure");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var t = e.target, k = t.tagName === "FIGURE" ? (+t.dataset.i % 2) * 120 : 0;
          setTimeout(function () { t.classList.add("in"); }, k);
          io.unobserve(t);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* Lấp lánh ở ảnh bìa */
  var heroEl = $(".arch");
  for (var s = 0; s < 26; s++) {
    var sp = document.createElement("i");
    sp.className = "spark";
    sp.style.cssText = "left:" + Math.random() * 100 + "%;top:" + Math.random() * 78 + "%;--t:" +
      (2 + Math.random() * 3) + "s;--dl:" + Math.random() * 4 + "s;width:" + (4 + Math.random() * 6) + "px;height:" + (4 + Math.random() * 6) + "px";
    heroEl.appendChild(sp);
  }

  /* Chia chữ trích dẫn thành từng từ để hiện lần lượt */
  var qs = $(".quote-text .script");
  qs.innerHTML = qs.textContent.split(" ").map(function (w, i) { return '<span class="w" style="--k:' + i + '">' + w + "</span>"; }).join(" ");

  /* Thanh tiến độ + hero mờ dần khi cuộn */
  var bar = $("#progress");
  window.addEventListener("scroll", function () {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
  }, { passive: true });

  /* Confetti */
  function confetti(n) {
    var cols = ["#b3122e", "#f3d98b", "#fff", "#e0243f", "#d9b25a", "#f8d7de"];
    for (var i = 0; i < n; i++) {
      var c = document.createElement("i");
      c.className = "cf";
      c.style.cssText = "left:" + Math.random() * 100 + "vw;background:" + cols[i % cols.length] +
        ";animation-duration:" + (2.5 + Math.random() * 2.5) + "s;animation-delay:" + Math.random() * .8 +
        "s;--dx:" + (Math.random() * 200 - 100) + "px;--rt:" + (Math.random() * 900 - 450) + "deg";
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 6500); })(c);
    }
  }

  /* Hộp quà mừng: bấm để mở */
  var gb = $("#giftbox");
  function openGift() {
    if (gb.classList.contains("open")) return;
    gb.classList.add("open");
    confetti(70);
    setTimeout(function () { var g = $("#gifts"); g.hidden = false; g.querySelectorAll(".rv").forEach(function (e) { e.classList.add("in"); }); }, 650);
  }
  gb.addEventListener("click", openGift);
  gb.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGift(); } });

  /* Thêm vào lịch (.ics) */
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

  /* Nghiêng nhẹ thẻ sự kiện theo con trỏ (máy tính) */
  document.querySelectorAll(".event").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = "perspective(700px) rotateY(" + x * 6 + "deg) rotateX(" + -y * 6 + "deg) translateY(-3px)";
    });
    c.addEventListener("mouseleave", function () { c.style.transform = ""; });
  });

  /* Chạm vào cặp đôi hoạt hình: nhảy + tim bay */
  var toon = $("#toon");
  toon.addEventListener("click", function (e) {
    toon.classList.remove("jump"); void toon.getBoundingClientRect(); toon.classList.add("jump");
    for (var k = 0; k < 6; k++) {
      var h = document.createElement("i");
      h.className = "heartfx"; h.textContent = "♥";
      h.style.cssText = "left:" + (e.clientX - 10 + (Math.random() * 60 - 30)) + "px;top:" + (e.clientY - 10) + "px;--hx:" + (Math.random() * 100 - 50) + "px;animation-delay:" + k * 0.08 + "s";
      document.body.appendChild(h);
      (function (n) { setTimeout(function () { n.remove(); }, 1500); })(h);
    }
  });

  /* Trái tim bay lên khi chạm */
  document.addEventListener("click", function (e) {
    if (e.target.closest("button,a,input,select,textarea,#lb")) return;
    var h = document.createElement("i");
    h.className = "heartfx"; h.textContent = "♥";
    h.style.cssText = "left:" + (e.clientX - 10) + "px;top:" + (e.clientY - 10) + "px;--hx:" + (Math.random() * 60 - 30) + "px";
    document.body.appendChild(h);
    setTimeout(function () { h.remove(); }, 1300);
  });

  /* Parallax nhẹ cho khung trích dẫn */
  var qImg = $(".quote-img"), qBox = $(".quote"), ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var r = qBox.getBoundingClientRect(), h = window.innerHeight;
      if (r.bottom > 0 && r.top < h) qImg.style.transform = "translateY(" + ((r.top + r.height / 2 - h / 2) * -0.12) + "px)";
      ticking = false;
    });
  }, { passive: true });

  /* Lịch tháng 11/2026 */
  var cal = $("#calendar"), h = "";
  ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach(function (d) { h += "<b>" + d + "</b>"; });
  var first = (new Date(2026, 10, 1).getDay() + 6) % 7;
  for (var a = 0; a < first; a++) h += "<span></span>";
  for (var d = 1; d <= 30; d++) h += "<span" + (d === 28 || d === 29 ? ' class="hl"' : "") + ">" + d + "</span>";
  cal.innerHTML = h;

  /* Đếm ngược tới 16:00 28/11/2026 */
  var target = new Date(2026, 10, 28, 16, 0, 0).getTime();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  function tick() {
    var t = Math.max(0, target - Date.now());
    setNum("#cd-d", Math.floor(t / 864e5));
    setNum("#cd-h", pad(Math.floor(t % 864e5 / 36e5)));
    setNum("#cd-m", pad(Math.floor(t % 36e5 / 6e4)));
    setNum("#cd-s", pad(Math.floor(t % 6e4 / 1e3)));
  }
  function setNum(sel, v) {
    var el = $(sel); v = String(v);
    if (el.textContent === v) return;
    el.textContent = v; el.classList.remove("flip"); void el.offsetWidth; el.classList.add("flip");
  }
  tick(); setInterval(tick, 1000);

  /* Lightbox có chuyển ảnh + vuốt */
  var lb = $("#lb"), cur = 0, sx = 0;
  function show(i) { cur = (i + photos.length) % photos.length; $("#lbImg").src = photos[cur]; lb.hidden = false; }
  gal.addEventListener("click", function (e) {
    var fg = e.target.closest("figure"); if (fg) show(+fg.dataset.i);
  });
  $("#lbX").onclick = function () { lb.hidden = true; };
  $("#lbP").onclick = function (e) { e.stopPropagation(); show(cur - 1); };
  $("#lbN").onclick = function (e) { e.stopPropagation(); show(cur + 1); };
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.hidden = true; });
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") lb.hidden = true;
    if (e.key === "ArrowRight") show(cur + 1);
    if (e.key === "ArrowLeft") show(cur - 1);
  });

  /* RSVP + lưu bút (lưu trên trình duyệt) */
  var num = $("#fNum");
  for (var n = 1; n <= 10; n++) num.insertAdjacentHTML("beforeend", "<option value='" + n + "'>" + n + " người</option>");
  var wishes = store.get("wishes") || [
    { n: "Gia đình bác Hùng", m: "Chúc hai cháu trăm năm hạnh phúc, sớm có tin vui!" },
    { n: "Bạn Minh Anh", m: "Chúc cặp đôi luôn yêu thương và đồng hành cùng nhau nhé 💛" }
  ];
  function renderWishes() {
    $("#wishes").innerHTML = wishes.slice().reverse().map(function (w) {
      return '<div class="wish"><b>' + esc(w.n) + "</b><br>" + esc(w.m) + "</div>";
    }).join("");
  }
  renderWishes();
  /* Dán link Web App của Google Apps Script vào đây để lưu chung (xem google-apps-script/Code.gs) */
  var SHEET_URL = "https://script.google.com/macros/s/AKfycbwMESugtYokov2LOsYFSEr_aV3G4B99Ynw_vguUX78uIUpYBUN5AHSv-U3wS4OkYbIa/exec";
  if (SHEET_URL) {
    fetch(SHEET_URL).then(function (r) { return r.json(); }).then(function (list) {
      if (Array.isArray(list)) { wishes = list; renderWishes(); }
    }).catch(function () {});
  }
  $("#rsvpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#fName").value.trim(), msg = $("#fMsg").value.trim(), go = $("#fGo").value;
    if (!name) return;
    var rec = { name: name, side: $("#fSide").value, go: go, num: $("#fNum").value, msg: msg };
    if (SHEET_URL) {
      fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(rec) }).catch(function () {});
    } else {
      var list = store.get("rsvp") || [];
      rec.t = Date.now(); list.push(rec); store.set("rsvp", list);
    }
    if (msg) { wishes.push({ n: name, m: msg }); if (!SHEET_URL) store.set("wishes", wishes); renderWishes(); }
    var th = $("#thanks");
    th.innerHTML = go === "Có"
      ? "Cảm ơn <b>" + esc(name) + "</b>! Rất hân hạnh được đón tiếp " + esc($("#fNum").value) + " khách 💛"
      : "Cảm ơn <b>" + esc(name) + "</b> đã phản hồi. Hẹn gặp bạn dịp khác nhé!";
    th.hidden = false;
    e.target.reset();
  });

  /* Chia sẻ */
  $("#btnShare").addEventListener("click", function () {
    var data = { title: document.title, url: location.href };
    if (navigator.share) navigator.share(data).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { alert("Đã sao chép link thiệp!"); });
  });
})();
