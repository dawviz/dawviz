---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.8 Dữ liệu cho widget Bar.Beat: AST đã có bản đồ nhịp 🟢 (đã dùng ở T-69)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.8 Dữ liệu cho widget Bar.Beat: AST đã có bản đồ nhịp 🟢 (đã dùng ở T-69)"
chunk: 5-8-du-lieu-cho-widget-bar-beat-ast-da-co-ban-do.md
source_lines: 193-195
source_sha1: ba7b039c7b
ids: [REQ-WIDGET-05]
---
### 5.8 Dữ liệu cho widget Bar.Beat: AST đã có bản đồ nhịp 🟢 (đã dùng ở T-69)
Đã kiểm (2026-11-13): `makeTempoMap` (`packages/core/src/tempo.js`) sinh `tempoMap[i] = { tick, timeSeconds, bpm, timeSigNumerator, timeSigDenominator }`, mặc định 4/4; `mergeTempoAndSig` gộp điểm tempo và điểm nhịp độc lập; `buildAST` đưa `tempoMap` vào AST. Vậy Time & Bar Counter lấy **dấu nhịp từ `ast.tempoMap`**, không cần trường mới và không cần sửa parser. Chỗ thiếu duy nhất là **kiểu TypeScript**: `TempoPoint` ở `packages/render-core/src/types.ts` mới khai báo `{tick, timeSeconds, bpm}`; T-69 thêm `timeSigNumerator?` và `timeSigDenominator?` (tuỳ chọn, mặc định 4/4 khi vắng) để không phá mã cũ. Một beat dài `960 × 4 / denominator` tick; Bar bắt đầu tại điểm đổi nhịp (SRS REQ-WIDGET-05). Nguồn `.mid` không có sự kiện nhịp thì parser đã cho 4/4. Nguồn nào chưa đọc dấu nhịp (nếu có) cũng rơi về 4/4, không cần xử lý riêng ở widget.
