---
doc: VISUAL-LAYERS.md
doc_title: "Lớp đồ hoạ: nạp PSD, hình học, phát sáng theo nhạc **[ĐỀ XUẤT, chưa chốt]**"
section: "2. Widget Hình (SHAPE)"
path: "2. Widget Hình (SHAPE)"
chunk: 2-widget-hinh-shape.md
source_lines: 48-55
source_sha1: d59766186f
ids: []
---
## 2. Widget Hình (SHAPE)

Hình vẽ bằng primitive sẵn có (`rect`, `poly`, `path`), không cần tài nguyên:

* Loại: chữ nhật (bo góc), elip, đa giác đều, sao, đường thẳng/gấp khúc, cung, vòng; về sau đường tự do (SVG path).
* Tô (màu, gradient), viền (độ dày, nét đứt, đầu tròn), phát sáng, độ đục; lặp mảng (lưới, vòng tròn) để tạo hoa văn.
* Mọi thuộc tính số/màu animate được và gắn binding như các widget khác.
