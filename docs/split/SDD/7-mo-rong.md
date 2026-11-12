---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "7. Mở rộng"
path: "7. Mở rộng"
chunk: 7-mo-rong.md
source_lines: 73-78
source_sha1: b1d59a382a
ids: []
---
## 7. Mở rộng

- **Widget mới (M2):** thêm hàm `layoutX(index, tempoMap, t, options)` vào Render Core + hàm vẽ trong `draw.ts`; giao diện chỉ thêm khung cấu hình.
- **Ngôn ngữ mới:** làm theo `docs/I18N.md` (thêm `locales/xx.json` + `index.json`; import ở `I18nProvider`).
- **Xuất video (M3):** gọi `layout*` + `draw*` với `OffscreenCanvas` trong Worker theo `t_k = k / fps`; Spike 1 là nguồn cho phần mã hoá/ghép.
