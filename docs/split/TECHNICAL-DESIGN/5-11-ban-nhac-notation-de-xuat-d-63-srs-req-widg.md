---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.11 Bản nhạc (Notation) ⚪ (đề xuất D-63, SRS REQ-WIDGET-09 / REQ-NOTATION-01 / REQ-GRAPHICS-20; chờ Spike 4)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.11 Bản nhạc (Notation) ⚪ (đề xuất D-63, SRS REQ-WIDGET-09 / REQ-NOTATION-01 / REQ-GRAPHICS-20; chờ Spike 4)"
chunk: 5-11-ban-nhac-notation-de-xuat-d-63-srs-req-widg.md
source_lines: 227-235
source_sha1: 57493fb549
ids: [D-63, REQ-EXPORT-00, REQ-GRAPHICS-20, REQ-NOTATION-01, REQ-WIDGET-09]
---
### 5.11 Bản nhạc (Notation) ⚪ (đề xuất D-63, SRS REQ-WIDGET-09 / REQ-NOTATION-01 / REQ-GRAPHICS-20; chờ Spike 4)
- **Ba tầng, hai ranh giới.** (1) *Quantizer* thuần: `AST → ScoreModel` (ô nhịp → giọng → sự kiện; mỗi nốt giữ `noteId` và `startTick` thật). (2) *Engraver* dùng VexFlow với `RenderContext` tự viết ghi lại lệnh vẽ theo `id` phần tử → `NotationLayout` (JSON: trang → đường vẽ có `id`, hộp bao, bảng đơn điệu thời gian thật → x). (3) *Render Core* vẽ `NotationLayout` theo `t`. Tầng (1) và (2) **nằm ngoài `packages/render-core`** (apps/web hoặc `@dawviz/notation`, chốt ở S1) để giữ quy tắc 5 và 8.
- **Primitive mới:** `path` (lệnh `M/L/C/Z`, nét/tô, nhóm theo `id`) và `group` (biến đổi quanh một điểm: phóng to, màu, độ đục). `Path2D` dựng từ lệnh được nhớ theo `id` để không phân tích lại mỗi khung.
- **Vẽ mỗi khung:** lớp tĩnh của trang (khuông, dòng kẻ, nốt ở trạng thái "sắp tới/đã qua") cache thành bitmap theo `(trang, màu theo phase, độ rung)`, LRU vài trang; lớp động chỉ gồm nốt đang ngân/đang vào/ra (tra bằng chỉ mục nhị phân như `notes.ts`) vẽ đè, kèm sprite glow dựng sẵn (không `shadowBlur` mỗi khung, mục tiêu đo ở S3).
- **Vạch phát:** `x(t)` nội suy tuyến tính đơn điệu trên bảng thời gian → x; nốt sáng theo `startTick` thật nên lượng tử sai không làm lệch tiếng.
- **Nét tay:** nhiễu băm `(id, đỉnh, floor(t·boilFps), seed)` áp lên đường vẽ trước khi vẽ lớp động và khi dựng bitmap lớp tĩnh; kiểu *boil* buộc dựng lại bitmap mỗi bước `boilFps` (chi phí này cũng đo ở S3/S4).
- **Xuất video:** pre-flight (REQ-EXPORT-00) engrave mọi trang và báo cảnh báo; Export Worker nhận `NotationLayout` qua `postMessage`, **không** nạp VexFlow và không nạp `FontFace` cho phông nhạc (tránh lỗi Firefox chậm dần, [FIREFOX-FONT-SLOWDOWN](../../design/FIREFOX-FONT-SLOWDOWN.md)). Cache engrave theo hash `(nốt, cài đặt lượng tử, phông)`.
- **Kiểm thử:** quantizer: `node --test`, bất biến "tổng giá trị nốt mỗi giọng mỗi ô = độ dài ô"; engraver: snapshot `NotationLayout` (JSON, tất định); Render Core: hash khung hình Preview so với Export.
