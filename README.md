# 💰 Quản Lý Cá Nhân

Ứng dụng web đơn giản giúp quản lý **tài chính cá nhân** và **công việc hàng ngày**. Chạy hoàn toàn trong trình duyệt, không cần server, không cần đăng nhập — toàn bộ dữ liệu được lưu ngay trên máy bạn (`localStorage`).

## Tính năng

### Quản lý thu chi
- Ghi nhận **tiền vào** (lương, thưởng, thu nhập khác...) — cập nhật thủ công dựa theo thông báo từ ngân hàng.
- Ghi nhận **tiền ra** theo danh mục: Tiền nhà, Tiền ăn uống, Tiết kiệm, Đầu tư, Ăn ngoài, Chi phí linh tinh khác.
- Mỗi giao dịch có ô **ghi chú** riêng để mô tả cụ thể nguồn tiền vào / khoản tiêu (VD: "Lương công ty ABC tháng 7", "Ăn trưa với đồng nghiệp"...).
- Sửa / xóa giao dịch, lọc theo tháng, loại, danh mục.
- Tự thêm/xóa danh mục theo nhu cầu riêng (tab Cài đặt).

### Báo cáo tổng quan
- Tổng tiền vào / tiền ra / số dư theo tháng.
- Tỷ lệ tiết kiệm + đầu tư trên tổng thu nhập.
- Biểu đồ tròn: chi tiêu theo danh mục.
- Biểu đồ cột: thu / chi 6 tháng gần nhất.
- Danh sách giao dịch gần đây.

### Quản lý công việc hàng ngày
- Thêm công việc với hạn chót, độ ưu tiên, ghi chú.
- Đánh dấu hoàn thành, sửa, xóa.
- Lọc theo trạng thái (chưa xong / đã xong / tất cả), tự động cảnh báo công việc quá hạn.
- Thống kê nhanh trên Tổng quan: đang chờ, đến hạn hôm nay, quá hạn, hoàn thành hôm nay.

### Dữ liệu
- Lưu cục bộ trong trình duyệt — **riêng tư tuyệt đối, không gửi dữ liệu lên bất kỳ máy chủ nào.**
- Xuất / nhập dữ liệu dạng JSON để sao lưu hoặc chuyển sang máy/trình duyệt khác.

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

HTML, CSS, JavaScript thuần (vanilla) — không dùng framework hay thư viện ngoài, không cần bước build.

```
├── index.html
├── css/style.css
└── js/
    ├── storage.js   # lớp lưu trữ localStorage
    ├── charts.js    # vẽ biểu đồ SVG
    ├── finance.js   # logic thu chi
    ├── tasks.js     # logic công việc
    └── app.js        # điều phối chung, dashboard
```

## Publish lên GitHub Pages

1. Tạo repo mới trên GitHub, push code lên nhánh `main`.
2. Vào **Settings → Pages**, chọn nguồn là nhánh `main`, thư mục `/ (root)`.
3. Sau vài phút, app sẽ có sẵn tại `https://<username>.github.io/<repo>/`.

## Giấy phép

MIT License — xem [LICENSE](LICENSE).
