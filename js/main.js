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
      petals(40);
    }, 1300);
    var p = bgm.play();
    if (p && p.then) p.then(function () { musicBtn.classList.add("on"); }).catch(function () {});
  });

  /* Nhạc (chỉ hiện nút nếu có file audio/nhac-nen.mp3) */
  bgm.addEventListener("canplay", function () { musicBtn.hidden = false; });
  musicBtn.addEventListener("click", function () {
    if (bgm.paused) { bgm.play(); musicBtn.classList.add("on"); }
    else { bgm.pause(); musicBtn.classList.remove("on"); }
  });

  /* Cánh hoa rơi */
  function petals(n) {
    var box = $("#petals");
    for (var i = 0; i < n; i++) {
      var el = document.createElement("i");
      el.className = "petal";
      var s = 8 + Math.random() * 10;
      el.style.cssText = "left:" + Math.random() * 100 + "vw;width:" + s + "px;height:" + s +
        "px;animation-duration:" + (7 + Math.random() * 9) + "s;animation-delay:" + Math.random() * 8 +
        "s;--dx:" + (Math.random() * 160 - 80) + "px";
      box.appendChild(el);
    }
  }
  petals(18);

  /* Hiệu ứng cuộn */
  function observe() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* Lịch tháng 11/2026 (thứ Hai đứng đầu) */
  var cal = $("#calendar"), html = "";
  ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach(function (d) { html += "<b>" + d + "</b>"; });
  var first = (new Date(2026, 10, 1).getDay() + 6) % 7;
  for (var i = 0; i < first; i++) html += "<span></span>";
  for (var d = 1; d <= 30; d++) html += "<span" + (d === 28 || d === 29 ? ' class="hl"' : "") + ">" + d + "</span>";
  cal.innerHTML = html;

  /* Đếm ngược tới 16:00 28/11/2026 */
  var target = new Date(2026, 10, 28, 16, 0, 0).getTime();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  function tick() {
    var t = Math.max(0, target - Date.now());
    $("#cd-d").textContent = Math.floor(t / 864e5);
    $("#cd-h").textContent = pad(Math.floor(t % 864e5 / 36e5));
    $("#cd-m").textContent = pad(Math.floor(t % 36e5 / 6e4));
    $("#cd-s").textContent = pad(Math.floor(t % 6e4 / 1e3));
  }
  tick(); setInterval(tick, 1000);

  /* Lightbox */
  var lb = $("#lb");
  document.querySelectorAll(".gallery figure").forEach(function (f) {
    f.addEventListener("click", function () { $("#lbImg").src = f.dataset.full; lb.hidden = false; });
  });
  lb.addEventListener("click", function () { lb.hidden = true; });

  /* RSVP + sổ lưu bút (lưu trên trình duyệt; xem ghi chú README để nối Google Form) */
  var num = $("#fNum");
  for (var n = 1; n <= 10; n++) num.insertAdjacentHTML("beforeend", "<option>" + n + "</option>");
  var wishes = store.get("wishes") || [
    { n: "Gia đình bác Hùng", m: "Chúc hai cháu trăm năm hạnh phúc, sớm có tin vui!" },
    { n: "Bạn Minh Anh", m: "Chúc cặp đôi luôn yêu thương và đồng hành cùng nhau nhé 💛" }
  ];
  function renderWishes() {
    $("#wishes").innerHTML = wishes.slice().reverse().map(function (w) {
      return '<div class="wish"><b>' + esc(w.n) + "</b><p>" + esc(w.m) + "</p></div>";
    }).join("");
  }
  renderWishes();
  $("#rsvpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#fName").value.trim(), msg = $("#fMsg").value.trim(), go = $("#fGo").value;
    if (!name) return;
    var list = store.get("rsvp") || [];
    list.push({ name: name, side: $("#fSide").value, go: go, num: $("#fNum").value, msg: msg, t: Date.now() });
    store.set("rsvp", list);
    if (msg) { wishes.push({ n: name, m: msg }); store.set("wishes", wishes); renderWishes(); }
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
