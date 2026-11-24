---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-STORAGE-05: Tài nguyên của phiên"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-STORAGE-05: Tài nguyên của phiên"
chunk: req-storage-05-tai-nguyen-cua-phien.md
source_lines: 946-950
source_sha1: 7d9de60b91
ids: [ERR_ASSET_DECODE, ERR_ASSET_SESSION_FULL, ERR_ASSET_TOO_LARGE, ERR_ASSET_UNSAFE, ERR_ASSET_UNSUPPORTED, REQ-STORAGE-05, WARN_PRESET_UNSUPPORTED]
---
#### REQ-STORAGE-05: Tài nguyên của phiên
* **1.0:** ảnh (PNG/JPEG/WebP/GIF khung đầu), SVG (chỉ vẽ dạng ảnh), sprite sheet, phông (WOFF2/TTF/OTF); định danh SHA-256; lưu IndexedDB; giới hạn kích thước (`ERR_ASSET_TOO_LARGE`, `ERR_ASSET_DECODE`); đóng gói vào Project Pack; pre-flight báo thiếu tài nguyên trước khi xuất.
* **Hiện trạng (T-21, 2026-11-22):** đủ phần 1.0: ảnh, SVG (kiểm nội dung, `ERR_ASSET_UNSAFE`), sprite sheet (widget Ảnh), phông người dùng; SHA-256; 20 MB/tệp, 200 MB/phiên (`ERR_ASSET_SESSION_FULL`), cạnh ≤ 8192 px; IndexedDB + Project Pack; Worker xuất; pre-flight báo ảnh thiếu. Loại không nhận: `ERR_ASSET_UNSUPPORTED`.
* **Hiện trạng (T-85, 2026-11-20): ảnh nền.** Chỉ ảnh bitmap làm nền khung; nạp tối đa 20 MB (`ERR_ASSET_TOO_LARGE`), đuôi png/jpg/webp/gif kiểm trước khi giải mã, giải mã lỗi thì `ERR_ASSET_DECODE`, cạnh dài > 4096 thì thu nhỏ khi giải mã. Lưu cùng phiên (IndexedDB, Blob `background`) và Project Pack (`assets/background.<đuôi>`), không nằm trong preset: preset chỉ có `canvas.backgroundImage { fit, opacity, dim }`, preset mang `backgroundImageData` bị bỏ kèm `WARN_PRESET_UNSUPPORTED`. Export nhận bản `ImageBitmap` riêng. Chưa có: SVG, sprite sheet, phông người dùng, băm SHA-256 làm định danh, pre-flight báo thiếu ảnh, nhiều ảnh/lớp ảnh.
