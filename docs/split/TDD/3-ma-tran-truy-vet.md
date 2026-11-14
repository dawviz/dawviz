---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "3. Ma trận truy vết"
path: "3. Ma trận truy vết"
chunk: 3-ma-tran-truy-vet.md
source_lines: 51-61
source_sha1: 8d240985ec
ids: [AT-18, NFR-PERF-05, REQ-GRAPHICS-05, REQ-GRAPHICS-06, REQ-GRAPHICS-18]
---
## 3. Ma trận truy vết

| Yêu cầu | Test |
|---|---|
| REQ-GRAPHICS-05 (tất định) | `layoutPianoRoll`, `drawPianoRoll` |
| REQ-GRAPHICS-06 (độ sáng) | `trackBrightness`, Reaper `BigProject4b` |
| NFR-PERF-05 (tua ngẫu nhiên) | `activeNotes` (đo thời gian chưa có, xem 4) |
| REQ-I18N-04 (dịch lỗi theo mã) | `problems` ×2, `i18n:check` |
| REQ-GRAPHICS-18 (kiểu chữ, T-72) | `typography.test.ts`, golden `paper-1x1`, `preset.test.ts` (di trú 0.3/0.4 → 0.5 vẽ giống bản dựng sẵn) |
| AT-18 (mốc M1) | Thủ công trên Chrome, danh sách ở mục 5 |
