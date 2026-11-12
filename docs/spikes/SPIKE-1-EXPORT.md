# Spike 1: Đường ống xuất video (Export Pipeline)

> Báo cáo gốc của chủ dự án, đưa vào repo ngày 2026-11-12 (đã bỏ các chú thích trích dẫn nội bộ). Mã spike chưa nằm trong monorepo; sẽ được đưa vào ở M3 (T-09). Mục cuối đối chiếu từng phát hiện với tài liệu v1.1 để biết phát hiện đó đã được ghi ở đâu.

## 1. Môi trường và kết quả chung

* **Máy tính (LOQ, Windows):** chạy qua HTTP server cục bộ trên Chromium/Edge. Xuất 600 khung hình 1080p mất khoảng 3,8–4,2 giây, tức **2,4× đến 2,65× thời gian thực**.
* **Điện thoại (Redmi Note 12 4G, Snapdragon 685):** trình duyệt di động Chromium.
* **Độ khớp WYSIWYG (AT-05):** sai khác lớn nhất trên mỗi kênh màu giữa khung Preview và khung Export (`max diff`) là **57/255**. Nguyên nhân dự đoán là khác biệt rasterize và khử răng cưa giữa Canvas trên luồng chính và `OffscreenCanvas` trong Worker. Phân bố sai khác (bao nhiêu điểm ảnh lệch) chưa được đo.
* **Phông trong Worker:** nạp `FontFace` bên trong Worker hoạt động khi có tệp phông đầu vào ("Font nạp trong Worker: OK").

## 2. Vấn đề phát sinh và đề xuất

### 2.1 Lỗi encoder khi bật Silent AAC trên một số máy
* **Triệu chứng:** với cấu hình `mp4a.40.2`, 64.000 bps, 2 kênh, 48.000 Hz, máy tính LOQ gặp lỗi encoder từ Mediabunny; điện thoại chạy bình thường.
* **Đề xuất:** tắt mặc định Silent AAC. Phần mềm dựng và trình phát phổ biến (Premiere Pro, VLC…) xử lý tốt MP4 không có âm thanh, nên ưu tiên chế độ không audio khi người dùng không nạp nhạc.

### 2.2 Tên tệp khi ghi thẳng xuống đĩa (StreamTarget)
* **Triệu chứng:** khi ghi qua File System Access API, tên tệp không phản ánh tuỳ chọn `fastStart` ngay từ đầu, chỉ đổi sau khi xuất xong.
* **Đề xuất:** chốt tên tệp chuẩn (rộng × cao, fps, chế độ fast-start) **trước** vòng lặp render.

### 2.3 Bó cứng độ phân giải và tỉ lệ khung
* **Triệu chứng:** chỉ có các mốc 720p, 1080p, 2160p và vài tỉ lệ cố định.
* **Đề xuất:** cho nhập tuỳ ý rộng và cao (vẫn làm tròn số chẵn cho H.264), và cho nhập tỉ lệ khung tuỳ chỉnh.

## 3. Đồng bộ A/V (KPI-02, AT-03)

* **Máy tính LOQ:** `first audio ts − first video ts = 0,00 ms`, đạt ngưỡng ±2 ms.
* **Điện thoại Snapdragon 685:** **−42,67 ms**, không đạt. Nguyên nhân dự đoán: phần cứng tầm trung chậm khi chạy đồng thời `VideoEncoder` và `AudioEncoder` trong Worker, nên độ trễ chờ mẫu âm thanh đầu (audio priming) lớn hơn nhiều so với PC.
* **Hướng xử lý:** ghi nhận giới hạn trên di động; tập trung tối ưu cho desktop theo phạm vi ban đầu (A-03, D-12).

## 4. Container và fast-start (SOI-10)

* `fastStart: false` → bố cục `ftyp mdat moov` (không fast-start; `moov` ở cuối tệp).
* `fastStart: 'in-memory'` → bố cục `ftyp moov mdat` (**fast-start đạt**; phát được ngay khi đang tải).
* Ghi thẳng xuống đĩa kết hợp fast-start: chưa kết luận.

## 5. Đối chiếu với tài liệu v1.1

| Phát hiện | Đã ghi ở | Trạng thái |
|---|---|---|
| Tốc độ 2,4–2,65× thời gian thực (LOQ) | BRD KPI-07; SRS NFR-PERF-03 | ✅ Đã ghi; RM-1 thật vẫn cần đo (OI-02) |
| Max diff 57/255 Preview↔Export | SRS REQ-GRAPHICS-05, AT-05 | ✅ **Sửa ở v1.1:** trước đây AT-05 đòi ≤ 1/255, mâu thuẫn với số đo. Nay tách hai ngưỡng (cùng đường vẽ / khác đường vẽ), xem REQ-GRAPHICS-05 |
| `FontFace` trong Worker hoạt động | BRD D-20; SRS SOI-03 | ✅ **Cập nhật v1.1:** SOI-03 đạt trên Windows; còn macOS |
| Silent AAC lỗi encoder → mặc định TẮT | BRD D-01, A-01, R-04; SRS REQ-EXPORT-03 | ✅ Đã ghi |
| Tên tệp chốt trước khi render | BRD D-26; SRS REQ-EXPORT-04 | ✅ Đã ghi |
| Kích thước và tỉ lệ tuỳ ý | BRD D-26, BR-06; SRS REQ-EXPORT-00 | ✅ Đã ghi; **bổ sung v1.1:** khoá tỉ lệ, danh sách tỉ lệ dựng sẵn, neo theo cạnh khi đổi tỉ lệ (REQ-GRAPHICS-04) |
| A/V 0,00 ms desktop, −42,67 ms di động | BRD R-11, KPI-02, D-44; SRS NFR-ACC-01 | ✅ Đã ghi; di động chỉ để xem ở 1.2 |
| Fast-start `in-memory` đạt | SRS REQ-EXPORT-04, SOI-10 | ✅ Đã ghi; ghi đĩa + fast-start còn mở |
| Mã spike chưa vào monorepo | PROGRESS mục 1 | ⬜ Đưa vào ở M3 (T-09) |
