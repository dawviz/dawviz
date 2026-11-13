---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-STORAGE-05: Tài nguyên của phiên"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-STORAGE-05: Tài nguyên của phiên"
chunk: req-storage-05-tai-nguyen-cua-phien.md
source_lines: 848-850
source_sha1: c62aee35b6
ids: [ERR_ASSET_DECODE, ERR_ASSET_TOO_LARGE, REQ-STORAGE-05]
---
#### REQ-STORAGE-05: Tài nguyên của phiên
* **1.0:** ảnh (PNG/JPEG/WebP/GIF khung đầu), SVG (chỉ vẽ dạng ảnh), sprite sheet, phông (WOFF2/TTF/OTF); định danh SHA-256; lưu IndexedDB; giới hạn kích thước (`ERR_ASSET_TOO_LARGE`, `ERR_ASSET_DECODE`); đóng gói vào Project Pack; pre-flight báo thiếu tài nguyên trước khi xuất.
