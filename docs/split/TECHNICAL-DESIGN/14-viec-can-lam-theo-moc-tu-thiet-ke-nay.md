---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "14. Việc cần làm theo mốc (từ thiết kế này)"
path: "14. Việc cần làm theo mốc (từ thiết kế này)"
chunk: 14-viec-can-lam-theo-moc-tu-thiet-ke-nay.md
source_lines: 420-427
source_sha1: e5d905cf74
ids: []
---
## 14. Việc cần làm theo mốc (từ thiết kế này)
| Mốc | Công việc kỹ thuật chính |
|---|---|
| M1 ✅ (đóng 2026-11-12) | build; chỉ nhận kết quả parse mới nhất; ngưỡng độ sáng; Track Info; CSP; báo thiếu `.mid` ngoài |
| M2 | ~~`SceneDocument` + `renderFrame` + `WidgetRenderer`~~ (T-05 ✅), phát sáng động (✅), danh sách track (✅ phần lõi); `WidgetRenderer` cho 8 widget; automation tổng quát ở parser (T-66); store + Command/undo; snapping; Preset; audio làm đồng hồ chủ; ChordTimeline |
| M3 | Export Worker (7.1), `MuxerAdapter`, pre-flight, tiến độ/hủy, tier dự phòng; test ảnh chụp Preview↔Export; test A/V |
| M4 | Dexie, Project Pack, nạp schema nhị phân trong UI, nhập tempo ghi đè trong UI |
| M5 | Đo hiệu năng, trợ năng, bản dịch cộng đồng, đóng OI |
