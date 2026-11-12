---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "3. Render Core (`@dawviz/render-core`, D-36)"
path: "3. Render Core (`@dawviz/render-core`, D-36)"
chunk: 3-render-core-dawviz-render-core-d-36.md
source_lines: 28-39
source_sha1: b1d59a382a
ids: [ARC-01, D-06, D-33, D-36, NFR-PERF-05, REQ-GRAPHICS-05, REQ-GRAPHICS-06]
---
## 3. Render Core (`@dawviz/render-core`, D-36)

| Mô-đun | Vai trò | Yêu cầu |
|---|---|---|
| `types.ts` | Kiểu tối thiểu của AST mà Render Core dùng | REQ-AST |
| `notes.ts` | `buildIndex` (nốt theo track, sắp theo thời gian, `maxDur`), `notesInRange`, `activeNotes` bằng tìm nhị phân: O(log n + k) mỗi khung | NFR-PERF-05 |
| `brightness.ts` | `trackBrightness(track, tempoMap, t, cfg)`; nguồn `volume` (mặc định), `static`, `pan`, `mute`, `off`; đảo chiều; track không có dữ liệu → 1 | REQ-GRAPHICS-06, D-33 |
| `pianoroll.ts` | `layoutPianoRoll(index, tempoMap, t, options)` → danh sách hình chữ nhật pixel (không vẽ). Cùng đầu vào cho cùng đầu ra | REQ-GRAPHICS-05 |
| `draw.ts` | `drawPianoRoll(ctx, rects, size)`: lớp vẽ duy nhất lên Canvas 2D/OffscreenCanvas; `Ctx2D` là giao diện tối thiểu nên test được bằng đối tượng giả | ARC-01, D-06 |

Độ sáng của nốt lấy tại thời điểm **bắt đầu nốt** (không đổi trong suốt nốt) để tránh nhấp nháy và giữ chi phí O(1) mỗi nốt. Phép nội suy lane volume/pan/mute và đổi gain → 0..1 dùng `sampleLane`/`volumeToUnit` của `@dawviz/parser-core` (nguồn sự thật duy nhất).
