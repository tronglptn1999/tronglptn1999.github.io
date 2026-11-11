# Thiệp mời cưới online — Quang Trọng &amp; Thu Trang

Thiệp mời cưới **đầy đủ tĩnh** (chỉ cần HTML/CSS/JS chạy trên trình duyệt), mở là xem được, không cần máy chủ.

## Chạy thử ngay trên máy
Mở file `index.html` bằng trình duyệt (double-click) — hết.

## Cấu trúc
```
index.html          → trang thiệp chính
css/style.css       → phong cách đen–vàng
js/main.js          → mở bìa, đếm ngược, nhạc, RSVP, QR, xem ảnh to
img/thiep-nha-trai.jpg, thiep-nha-gai.jpg → 2 tấm thiệp gốc
audio/              → đặt file nhạc nền tại đây (tên: nhac-nen.mp3)
```

## Nhạc nền
Đặt một file `.mp3` (tên tự do, ví dụ `nhac-nen.mp3`) vào thư mục `audio/`.
Nếu muốn đổi tên, sửa `src` của thẻ `<audio id="bgm">` trong `index.html`.
Trang sẽ tự ẩn nút ♪ nếu không thấy file.

## Đăng miễn phí lên GitHub Pages (github.io)
```
1)  Tạo tài khoản (nếu chưa có) tại github.com → New repository (public), ví dụ "thiep-cuoi-qvtt"
2)  Vào thư mục này rồi:
    git init
    git add .
    git commit -m "Thiep moi cuoi Quang Trong & Thu Trang"
    git remote add origin https://github.com/TENBAI/thiep-cuoi-qvtt.git
    git branch -M main
    git push -u origin main
```
- Vào **Settings → Pages → Source: main / (root)** → Save.
- Sau ~1–2 phút truy cập `https://TENBAI.github.io/thiep-cuoi-qvtt/`
- (Mẹo: đặt tên repo đúng `TENBAI.github.io` để mở bằng tên ngắn `https://TENBAI.github.io/`)

## Muốn đổi nội dung gì đó
- **Ngày giờ / địa chỉ / tên:** tìm trong `index.html` (toàn bộ chữ nằm sẵn ở đây, có chú thích phần theo tiếng Việt).
- **Màu sắc:** sửa các mã màu ở đầu `css/style.css` (`--gold`, `--bg`…).
- **Ảnh đại diện:** thay file trong `img/` giữ nguyên tên `thiep-nha-trai.jpg` / `thiep-nha-gai.jpg`.

Chúc hai bạn một mùa đông ấm và một hôn lễ trọn vẹn! 💛
