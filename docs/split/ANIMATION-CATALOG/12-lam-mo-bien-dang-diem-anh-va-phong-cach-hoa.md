---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "12. Làm mờ, biến dạng điểm ảnh và phong cách hoá"
path: "12. Làm mờ, biến dạng điểm ảnh và phong cách hoá"
chunk: 12-lam-mo-bien-dang-diem-anh-va-phong-cach-hoa.md
source_lines: 188-206
source_sha1: 94903865f6
ids: []
---
## 12. Làm mờ, biến dạng điểm ảnh và phong cách hoá

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Gaussian blur | Mờ đều, có keyframe | v1.0 | C2D (`filter`) $ |
| Directional / Motion blur | Mờ theo hướng chuyển động | v1.1 | GL $ |
| Radial / Zoom blur | Mờ toả từ tâm | v1.1 | GL $ |
| Motion blur thật | Lấy mẫu nhiều thời điểm trong một khung (sub-frame), chỉ khi xuất | v1.1 | C2D $ |
| Pixelate / Mosaic | Vỡ điểm ảnh | v1.1 | GL |
| Glitch | Lệch kênh RGB, dịch khối, sọc quét; ngẫu nhiên có seed | v1.1 | GL |
| Chromatic aberration | Viền màu tách kênh | v1.1 | GL |
| Wave warp / Ripple | Sóng uốn ảnh | v1.1 | GL |
| Bulge / Pinch / Swirl | Phồng, chụm, xoáy cục bộ | sau | GL |
| Displacement map | Biến dạng theo ảnh xám | sau | GL |
| Kaleidoscope / Mirror | Vạn hoa, đối xứng | v1.1 | GL |
| Film grain / Noise | Hạt phim tất định | v1.1 | GL |
| Vignette | Tối góc | v1.0 | C2D |
| Scanlines / CRT | Hiệu ứng màn hình cũ | sau | GL |
