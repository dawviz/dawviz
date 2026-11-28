---
doc: VISUAL-LAYERS.md
doc_title: "Lớp đồ hoạ: nạp PSD, hình học, phát sáng theo nhạc **[ĐỀ XUẤT, chưa chốt]**"
section: "1. Nạp PSD bằng ag-psd"
path: "1. Nạp PSD bằng ag-psd"
chunk: 1-nap-psd-bang-ag-psd.md
source_lines: 5-47
source_sha1: d59766186f
ids: [ERR_PSD_TOO_MANY_LAYERS, ERR_PSD_UNSUPPORTED, REQ-PARSER-00, WARN_PSD_BLEND, WARN_PSD_FLATTENED]
---
## 1. Nạp PSD bằng ag-psd

### 1.1. Thư viện

* **ag-psd** 34.2.3 (giấy phép MIT; phụ thuộc `pako`, `base64-js`; bản gộp khoảng 1 MB chưa nén). Đọc và ghi PSD, chạy được trong trình duyệt và Worker (cần `OffscreenCanvas` hoặc hàm `createImageData` tự cấp).
* Quy tắc 8 của AI_CONTEXT: `packages/*` không thêm phụ thuộc. Đặt bộ nạp ở `apps/web` (tải lười, chạy trong Worker như parser), và **ghi một quyết định mới** trong BRD trước khi thêm vào `package.json`.

### 1.2. Spike 2026-11-28 (Node, tệp PSD tự sinh)

Dựng một PSD 400×300 có lớp nền, nhóm, lớp chế độ hoà trộn `screen` với độ đục 0,8 và mặt nạ, lớp ẩn, lớp chữ; đọc lại bằng `readPsd(buf, { useImageData: true })` mất khoảng 20 ms. Đọc được:

| Thông tin | Có | Ghi chú |
|---|---|---|
| Cây lớp, nhóm (`children`), tên lớp (Unicode) | ✅ | Nhóm có chế độ `pass through` |
| Hộp lớp `left/top/right/bottom`, điểm ảnh của lớp | ✅ | Điểm ảnh **không** gồm hiệu ứng lớp |
| Chế độ hoà trộn, độ đục, ẩn/hiện | ✅ | |
| Mặt nạ điểm ảnh | ✅ | Mặt nạ vector đọc được dạng đường |
| Lớp chữ: nội dung, phông, cỡ, màu, ma trận | ✅ | Kèm ảnh đã dựng sẵn từ Photoshop |
| Ảnh ghép cả tệp (composite) | ✅ | Gồm cả hiệu ứng; dùng làm ảnh xem trước và "nạp như một ảnh" |
| Hiệu ứng lớp (bóng đổ, phát sáng, viền…) | Chỉ tham số | ag-psd **không vẽ**; phải tự dựng lại hoặc bỏ |
| Lớp điều chỉnh (Levels, Curves…), bộ lọc smart object | Chỉ tham số | Không vẽ |

### 1.3. Ánh xạ vào cảnh

* Tệp PSD → **một precomp** cỡ khung, tên theo tệp. Nhóm → precomp con. Sâu quá `MAX_COMP_DEPTH` (4) thì làm phẳng nhóm sâu nhất và cảnh báo `WARN_PSD_FLATTENED`; quá `MAX_FLAT_WIDGETS` (512) lớp thì từ chối có mã `ERR_PSD_TOO_MANY_LAYERS`.
* Lớp điểm ảnh → widget **Ảnh** (IMAGE) trỏ tới tài nguyên phiên `sha256:` (lưu PNG, đi vào Project Pack như ảnh thường). Toạ độ quy đổi theo tỉ lệ khung: PSD khác tỉ lệ với khung thì đặt vừa và căn giữa như ảnh nền.
* Độ đục → `opacity`; ẩn → `visible: false`; tên lớp → tên lớp trên Timeline.
* **Chế độ hoà trộn**: Render Core hiện **chưa có** (không dùng `globalCompositeOperation`). Cần thêm trường `blend` cho WidgetSpec. Canvas 2D có sẵn: multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity; `linear dodge (add)` → `lighter`. Chế độ không có (linear burn, vivid light, pin light, dissolve, darker/lighter color…) → chế độ gần nhất kèm cảnh báo `WARN_PSD_BLEND`. Trường này cũng mở khoá nhóm "hoà trộn" của T-34, không riêng PSD.
* **Mặt nạ, clipping mask**: cần bước vẽ mới: vẽ widget vào canvas phụ rồi `destination-in` với ảnh mặt nạ. Tốn thêm một canvas phụ mỗi widget có mặt nạ; giới hạn số lớp có mặt nạ trong cảnh (đo ở T-27).
* **Lớp chữ**: mặc định giữ ảnh đã dựng (đúng như Photoshop). Tuỳ chọn "Chuyển thành Ô chữ": dùng nội dung + cỡ + màu, phông khớp tên với phông của phiên; thiếu phông thì báo (T-21 pre-flight).
* **Hiệu ứng lớp**: dựng lại gần đúng những gì Render Core có: bóng đổ, phát sáng ngoài (`shadowBlur`). Còn lại (vát, kết cấu, gradient overlay…) bỏ và liệt kê trong cảnh báo; người dùng muốn giữ đúng thì nạp ảnh ghép.
* Hai cách nạp ở hộp thoại: **Tách lớp** (như trên) hoặc **Một ảnh** (ảnh ghép, nhanh, đúng màu nhất).

### 1.4. An toàn và giới hạn

* Đọc trong Worker có trần bộ nhớ như REQ-PARSER-00; tệp là dữ liệu không tin cậy. Nhận diện bằng chữ ký `8BPS`.
* Cỡ tệp: theo hạn mức phiên (`ASSET_LIMITS`: 200 MB/phiên); cạnh mỗi lớp ≤ 8192 px. PSB (tệp lớn) chưa kiểm, tạm không nhận (`ERR_PSD_UNSUPPORTED`).
* Mã lỗi/cảnh báo mới dịch theo mã (vi/en) như parser.

### 1.5. Theo nhạc ngay khi nạp

Mỗi lớp là widget nên keyframe, binding, chuyển động widget (T-34 phần đã có) dùng được ngay. Đề xuất quy ước tên lớp để tự gắn binding khi nạp, ví dụ `đèn @beat` (độ đục theo phách), `loa @bass` (tỉ lệ theo dải trầm), `chữ @hit` (nháy khi có nốt). Người dùng sửa lại được sau khi nạp; không có hậu tố thì không gắn gì.
