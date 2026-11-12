---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "6. Tài nguyên (assets) của phiên và của cộng đồng (AD-12)"
path: "6. Tài nguyên (assets) của phiên và của cộng đồng (AD-12)"
chunk: 6-tai-nguyen-assets-cua-phien-va-cua-cong-dong-a.md
source_lines: 146-179
source_sha1: 252b907188
ids: [AD-12, ERR_ASSET_DECODE, ERR_ASSET_TOO_LARGE, REQ-EXPORT-00, REQ-GRAPHICS-07, REQ-STORAGE-01, REQ-STORAGE-03, REQ-STORAGE-04]
---
## 6. Tài nguyên (assets) của phiên và của cộng đồng (AD-12)

### 6.1 Tài nguyên người dùng thêm vào phiên

* **Loại nhận:** ảnh (PNG, JPEG, WebP, GIF lấy khung đầu), SVG (chỉ vẽ qua `<img>`/`ImageBitmap`, không chèn vào DOM, nên không chạy script), sprite sheet (ảnh kèm lưới), phông (WOFF2, TTF, OTF qua `FontFace`). Video và âm thanh để sau.
* **Lưu trữ:** IndexedDB (Dexie, REQ-STORAGE-01), định danh bằng **SHA-256 của nội dung**. Cùng tệp nạp hai lần chỉ lưu một bản. Storyboard tham chiếu `asset:sha256-…` chứ không dùng tên tệp.
* **Giới hạn:** ví dụ 20 MB mỗi tệp, 200 MB mỗi phiên, cạnh ảnh tối đa 8192 px. Tệp vượt giới hạn bị từ chối kèm mã lỗi (`ERR_ASSET_TOO_LARGE`, `ERR_ASSET_DECODE`).
* **Xuất video:** tài nguyên được giải mã trước thành `ImageBitmap` và phông được nạp vào Worker xuất. Pre-flight (REQ-EXPORT-00) báo thiếu tài nguyên trước khi bắt đầu xuất.
* **Đóng gói:** Project Pack (REQ-STORAGE-03) chứa luôn tài nguyên, nên mở trên máy khác vẫn đủ.

### 6.2 Đóng góp lên thư viện cộng đồng

Luồng trong ứng dụng: **"Chia sẻ thành preset" → điền tên, mô tả, tác giả, giấy phép (bắt buộc, SPDX) → tải xuống gói `.dawviz-preset.zip`** (JSON và tài nguyên kèm theo, có băm). Sau đó có hai đường:

1. Người biết Git: mở pull request vào repo `dawviz-community` (T-16).
2. Người không biết Git: mở issue theo mẫu và đính kèm gói. Người duy trì kiểm rồi chuyển thành pull request.

CI của repo cộng đồng kiểm: schema, kích thước, giấy phép được phép, không có tài nguyên trùng băm, ảnh giải mã được, và sinh `index.json` có băm. Ứng dụng tải `index.json`, xác minh băm trước khi dùng, và lưu đệm để chạy được khi ngoại tuyến.

### 6.3 Các loại preset

Thêm các `kind` mới bên cạnh `note-style` đang có:

| `kind` | Nội dung |
|---|---|
| `note-style` | Kiểu dáng nốt (đã có, REQ-GRAPHICS-07) |
| `note-transition` | Template bốn pha (mục 3.2) |
| `easing` | Đường cong tự vẽ (mục 4) |
| `particle` | Cấu hình bộ phát hạt (mục 5) |
| `theme` | Gói kết hợp: kiểu nốt, chuyển cảnh, hạt, màu nền, phông |
| `scene` | Storyboard hoàn chỉnh hoặc một phần (lớp, phần tử), có chỗ trống để gắn vào dự án bất kỳ |

Mỗi preset có `schemaVersion` và được di trú khi lược đồ đổi (REQ-STORAGE-04). Trường lạ bị bỏ qua, giá trị ngoài miền bị kẹp.
