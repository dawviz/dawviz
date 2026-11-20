---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "3. Kiến trúc đề xuất"
path: "3. Kiến trúc đề xuất"
chunk: 3-kien-truc-de-xuat.md
source_lines: 26-51
source_sha1: 226588bac5
ids: [REQ-NOTATION-01, REQ-WIDGET-09, WARN_NOTATION_]
---
## 3. Kiến trúc đề xuất

```
AST (nốt, tempoMap, dấu nhịp)
   │  (1) Quantizer thuần, ngoài render-core          [REQ-NOTATION-01]
   ▼
ScoreModel: ô nhịp → giọng (voice) → sự kiện (nốt/hợp âm/lặng/tam liên), mỗi nốt giữ noteId + startTick THẬT
   │  (2) Engraver dùng VexFlow, RenderContext ghi lại lệnh vẽ   [S1]
   ▼
NotationLayout (JSON thuần, serialize được):
   pages[] → { staffLines, glyphs[{id, path, bbox}], beams, ties… }, mỗi phần tử có elementId = noteId hoặc nhóm tĩnh
   timeToX: bảng đơn điệu (thời gian thật → x) để nội suy giữa các nốt đã lượng tử hoá
   │  (3) Render Core vẽ dữ liệu này mỗi khung (hàm của t)       [REQ-WIDGET-09]
   ▼
Preview Canvas / Export Worker
```

Nguyên tắc:

1. **Lượng tử hoá chỉ để vẽ, không đổi thời điểm sáng.** Nốt sáng theo `startTick` thật; vị trí x của vạch phát nội suy qua `timeToX`. Nên lượng tử sai vẫn không làm lệch âm thanh.
2. **Engrave một lần, vẽ nhiều lần.** VexFlow chỉ chạy ở bước (2). Mỗi khung chỉ vẽ `NotationLayout`.
3. **Trang tĩnh cache thành bitmap, nốt đang sáng vẽ đè** (lớp động). Mất cache khi đổi màu/phase theo trang thì dựng lại; số trang giữ trong bộ nhớ có trần (LRU).
4. **Rung nét tất định:** nhiễu băm từ `(elementId, chỉ số đỉnh, floor(t·boilFps))`, không `Math.random`/`Date`.
5. **Phụ thuộc nằm ngoài `packages/render-core`**: `apps/web` hoặc package mới `@dawviz/notation`. Quyết định ở S1.
6. **Suy giảm có báo:** quá dày thì giảm giọng/độ phức tạp, báo `WARN_NOTATION_*`; cực đoan thì rơi về Piano Roll. Không bỏ thầm lặng (quy tắc 6).
