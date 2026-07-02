# 💰 My Finance

Ứng dụng web đơn giản giúp quản lý **tài chính cá nhân** và **công việc hàng ngày**. Chạy hoàn toàn trong trình duyệt, không cần server, không cần đăng nhập — toàn bộ dữ liệu được lưu ngay trên máy bạn (`localStorage`).

## Tính năng

### Quản lý thu chi
- Ghi nhận **tiền vào** (lương, thưởng, thu nhập khác...) — cập nhật thủ công dựa theo thông báo từ ngân hàng.
- Ghi nhận **tiền ra** theo danh mục: Tiền nhà, Tiền ăn uống, Tiết kiệm, Đầu tư, Ăn ngoài, Chi phí linh tinh khác.
- Mỗi giao dịch có ô **ghi chú** riêng để mô tả cụ thể nguồn tiền vào / khoản tiêu (VD: "Lương công ty ABC tháng 7", "Ăn trưa với đồng nghiệp"...).
- Sửa / xóa giao dịch, lọc theo tháng, loại, danh mục.
- Tự thêm/xóa danh mục theo nhu cầu riêng (tab Cài đặt).
- **Thêm nhanh từ thông báo ngân hàng — 2 cách:**
  - **Gửi ảnh chụp màn hình:** bấm "📷 Gửi ảnh chụp màn hình", chọn ảnh vừa chụp — app tự đọc chữ trong ảnh ngay trên trình duyệt (dùng [Tesseract.js](https://github.com/naptha/tesseract.js), lần đầu dùng cần mạng để tải bộ nhận diện chữ ~vài MB, sau đó trình duyệt tự nhớ). Không gửi ảnh lên máy chủ nào — xử lý hoàn toàn cục bộ.
  - **Dán text:** dán nguyên văn tin nhắn/thông báo vào ô — app tự tách số tiền và tiền vào/ra.
  - Cả hai cách đều chỉ tự điền sẵn form, bạn luôn chọn danh mục và xác nhận trước khi lưu. Xem thêm mục [Tự động hoá trên iPhone](#tự-động-hoá-trên-iphone-shortcuts) để mở app kèm sẵn nội dung chỉ bằng một chạm khi có tin nhắn ngân hàng đến.
- **Hạn mức chi tiêu:** đặt số tiền tối đa dự kiến cho từng danh mục tiền ra trong tab Cài đặt — Tổng quan sẽ hiện thanh tiến độ và cảnh báo khi chi gần/vượt hạn mức.

### Báo cáo tổng quan
- Xem theo **Tháng** hoặc **Năm** (toggle ở đầu trang Tổng quan).
- Tổng tiền vào / tiền ra / số dư, so sánh % với kỳ trước (tháng trước hoặc năm trước).
- Tỷ lệ tiết kiệm + đầu tư trên tổng thu nhập.
- Biểu đồ tròn: chi tiêu theo danh mục.
- Biểu đồ cột: thu/chi 6 tháng gần nhất (chế độ Tháng) hoặc cả 12 tháng trong năm (chế độ Năm).
- Ngân sách tháng này: thanh tiến độ theo từng danh mục có đặt hạn mức.
- Danh sách giao dịch gần đây.

### Quản lý công việc hàng ngày
- Thêm công việc với ngày, độ ưu tiên, ghi chú.
- Đánh dấu hoàn thành, sửa, xóa.
- Lọc theo trạng thái (chưa xong / đã xong / tất cả), tự động cảnh báo công việc quá hạn.
- **Lịch dạng lưới** theo tháng (giống Google Calendar) — chấm màu theo độ ưu tiên, bấm vào ngày để lọc công việc theo ngày đó.
- Thống kê nhanh trên Tổng quan: đang chờ, đến hạn hôm nay, quá hạn, hoàn thành hôm nay.

### Dữ liệu
- Lưu cục bộ trong trình duyệt — **riêng tư tuyệt đối, không gửi dữ liệu lên bất kỳ máy chủ nào** (kể cả khi dùng tính năng đọc ảnh).
- Xuất / nhập dữ liệu dạng JSON để sao lưu hoặc chuyển sang máy/trình duyệt khác.
- App tự nhắc sao lưu định kỳ (7 ngày/lần) nếu phát hiện lâu chưa xuất dữ liệu, tránh mất dữ liệu khi đổi máy hoặc xoá bộ nhớ trình duyệt.

## Cách chạy

Không cần cài đặt gì cả — đây là ứng dụng HTML/CSS/JS thuần.

**Cách 1 — mở trực tiếp:** mở file `index.html` bằng trình duyệt.

**Cách 2 — chạy qua server tĩnh** (khuyến nghị, tránh vài giới hạn của trình duyệt khi mở file trực tiếp):

```bash
# Python
python -m http.server 5500

# hoặc Node
npx serve .
```

Sau đó mở `http://localhost:5500`.

## Công nghệ

HTML, CSS, JavaScript thuần (vanilla) — không cần bước build, không cài đặt gì để chạy. Riêng tính năng đọc chữ trong ảnh tải [Tesseract.js](https://github.com/naptha/tesseract.js) từ CDN khi dùng lần đầu (cần mạng lúc đó), mọi thứ khác hoạt động hoàn toàn ngoại tuyến sau khi tải trang.

```
├── index.html
├── manifest.json
├── css/style.css
└── js/
    ├── storage.js    # lớp lưu trữ localStorage
    ├── charts.js     # vẽ biểu đồ SVG
    ├── finance.js    # logic thu chi, đọc thông báo ngân hàng (text/ảnh)
    ├── tasks.js       # logic công việc, lịch dạng lưới
    └── app.js         # điều phối chung, dashboard, ngân sách, backup
```

## Tự động hoá trên iPhone (Shortcuts)

> **Giới hạn quan trọng:** iOS không cho phép **bất kỳ app nào** — kể cả app ngân hàng chính chủ — âm thầm đọc nội dung thông báo/tin nhắn của app khác. Đây là giới hạn bảo mật của Apple, áp dụng cho mọi nhà phát triển, không phải giới hạn riêng của app này. Cách gần nhất với "tự động" mà iOS cho phép là dùng **Shortcuts**: chụp màn hình thông báo (hoặc nhận SMS) → tự mở app này kèm sẵn nội dung đã đọc được, bạn chỉ cần chạm chọn danh mục rồi lưu.

Cả hai cách bên dưới đều dùng chung cơ chế: app đọc tham số `?text=...` trên URL để tự điền số tiền/loại giao dịch — không cần sửa gì thêm trong app.

### Cách A — Chụp màn hình rồi gửi (khuyến nghị, nhanh nhất)

Dùng bộ nhận diện chữ trong ảnh có sẵn của Apple (chính xác hơn, không cần tải gì thêm). Thiết lập một lần:

1. Mở app **Phím tắt (Shortcuts)** → tab **Của tôi (My Shortcuts)** → **+** để tạo Shortcut mới. Đặt tên, ví dụ **"Đọc thông báo ngân hàng"**.
2. Thêm hành động **Trích xuất văn bản từ hình ảnh (Extract Text from Image)** — đầu vào để mặc định là **Shortcut Input** (ảnh được chia sẻ vào).
3. Thêm hành động **Mã hoá URL (URL Encode)**, áp dụng lên văn bản vừa trích xuất ở bước 2.
4. Thêm hành động **URL**: gõ `https://<username>.github.io/<repo>/index.html?text=` rồi chèn kết quả bước 3 vào ngay sau đó (không có khoảng trắng).
5. Thêm hành động **Mở URL (Open URLs)**, chọn URL ở bước 4.
6. Bấm biểu tượng **ⓘ** ở đầu màn hình soạn Shortcut → bật **Hiển thị trong Share Sheet (Show in Share Sheet)** → mục **Loại đầu vào chấp nhận (Accepted Types)** chọn **Hình ảnh (Images)**.
7. Lưu lại.

**Cách dùng hằng ngày:** chụp màn hình thông báo ngân hàng như bình thường → chạm vào ảnh thu nhỏ ở góc màn hình → **Chia sẻ** → chọn **"Đọc thông báo ngân hàng"** → Safari tự mở app, đã điền sẵn số tiền + loại giao dịch → bạn chỉ cần chọn danh mục và bấm **Thêm giao dịch**.

### Cách B — Tự động khi có SMS đến (không cần chạm vào ảnh, nhưng kém linh hoạt hơn nếu ngân hàng báo qua thông báo app thay vì SMS)

1. Mở app **Phím tắt (Shortcuts)** → tab **Tự động hoá (Automation)** → **+** → **Tạo tự động hoá cá nhân (Create Personal Automation)**.
2. Chọn trình kích hoạt **Tin nhắn (Message)** → mục **Người gửi (Sender)**, chọn cuộc trò chuyện SMS của ngân hàng (tên hiển thị dạng "Vietcombank", "MBBank"...). Bấm **Tiếp theo**.
3. Lặp lại bước 3-5 của Cách A, nhưng đầu vào của **Mã hoá URL** là biến tin nhắn đến (Shortcut Input) thay vì văn bản trích xuất từ ảnh.
4. Ở màn hình xác nhận cuối cùng, tắt **Hỏi trước khi chạy (Ask Before Running)** để tự động hoá chạy ngay không cần chạm xác nhận.
5. Lưu lại. Từ giờ mỗi khi có SMS từ ngân hàng đó, Safari sẽ tự mở app, tự điền sẵn thông tin.

Muốn dùng như app thật (toàn màn hình, có icon riêng): mở app trong Safari → nút **Chia sẻ** → **Thêm vào MH chính (Add to Home Screen)**.

## Publish lên GitHub Pages

1. Tạo repo mới trên GitHub, push code lên nhánh `main`.
2. Vào **Settings → Pages**, chọn nguồn là nhánh `main`, thư mục `/ (root)`.
3. Sau vài phút, app sẽ có sẵn tại `https://<username>.github.io/<repo>/`.

## Giấy phép

MIT License — xem [LICENSE](LICENSE).
