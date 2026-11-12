---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "5. Package `rpp` (REQ-RPP-*)"
path: "5. Package `rpp` (REQ-RPP-*)"
chunk: 5-package-rpp-req-rpp.md
source_lines: 78-85
source_sha1: dbb03a72c8
ids: [ERR_NO_NOTES]
---
## 5. Package `rpp` (REQ-RPP-*)
`parseRppTree` tokenizes theo dòng (`tokenize` xử lý nháy kép/đơn/backtick), nút `<NAME args … >` gồm `lines` (thuộc tính), `kids` (nút con) và `after` (số dòng đứng trước con — giữ thứ tự để chia take). `parseRppText`:
1. Tempo gốc từ `TEMPO`, envelope `TEMPOENV*` (bỏ nếu `ACT 1` sai/`ACT 0`); `buildTempo` chuyển điểm `PT` (giây) sang tick: shape 1 = giữ, khác = dốc tuyến tính chia bước; nhịp đóng gói trong `PT[4]` (`num = v & 0xffff`, `den = v >>> 16`).
2. Với mỗi `TRACK`/`ITEM`: `splitTakes` → chọn take; nguồn `MIDI` → `readEmbeddedSource` (cộng dồn delta) / pool GUID / `loadExternal`.
3. Quy đổi vị trí item từ giây qua `secToTick`; nhân bản loop theo độ dài nguồn; `SOFFS` coi là quarter-note (VERIFY); cắt nốt ngoài item.
4. Bọc `buildAST` để lỗi `ERR_NO_NOTES` có `details.missingFiles` khi do thiếu `.mid` ngoài.
`inspectRpp` chỉ đọc cấu trúc, không dựng AST. `listExternalMidi` duyệt cây tìm nút `SOURCE MIDI` có dòng `FILE` và trả tên file (bỏ thư mục, không trùng). `loadExternal` đối chiếu tên trong `options.files` theo thứ tự: khớp đúng → khớp không phân biệt hoa/thường và coi khoảng trắng ≡ gạch dưới (tải lên thường đổi tên kiểu này). Đã kiểm với BigProject3.rpp + Oboe_MIDI_001.mid.
