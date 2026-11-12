---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "3. Đường ống phân tích (parser) 🟢"
path: "3. Đường ống phân tích (parser) 🟢"
chunk: 3-duong-ong-phan-tich-parser.md
source_lines: 63-89
source_sha1: 10dd2f7ff3
ids: [ERR_FILE_TOO_LARGE, ERR_UNSUPPORTED_FORMAT, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_EXTERNAL_MIDI, WARN_RPP_SRC_UNIT]
---
## 3. Đường ống phân tích (parser) 🟢

```
parseProject(name, buffer, options)
  1. giới hạn kích thước tệp (ERR_FILE_TOO_LARGE)
  2. detectFormat: đuôi tệp + magic bytes (gzip 1f8b, 'PK', 'MThd', '<?xml'…) → 'als'|'alp'|'rpp'|'dawproject'|'mid'|'binary'
     (.flp/.bwproject → ERR_UNSUPPORTED_FORMAT kèm hướng dẫn xuất MIDI/.dawproject)
  3. parser con → { tempoPoints, tracks[], sourcePPQ, warnings, … } (đầu vào "thô")
  4. buildAST: chuẩn hoá tick về 960, tính giây, ghép `mix`/`automation`, kiểm bất biến → { ast, warnings }
```
- `probeProject(name, buffer, options)` chạy **trước** khi phân tích để UI biết cần thêm gì: `needs.externalMidi[]` (Reaper tham chiếu `.mid` ngoài), `needs.schema` (nhị phân). UI chỉ hiện ô chọn tệp phụ khi cần (REQ-UI).
- Tệp phụ truyền qua `options.files` (`{tên: ArrayBuffer}`), khớp tên có dung sai (khoảng trắng ↔ `_`, hoa/thường).
- **Giới hạn an toàn** trong `parser-core`: giải nén streaming có trần (chống zip bomb), XML không mở rộng DOCTYPE/entity, độ sâu XML tối đa, số nốt tối đa. Vượt → `ERR_*` có mã, không treo.
- **Cảnh báo không mất dữ liệu thầm lặng:** mọi thứ bị bỏ qua đều có `WARN_*` kèm `details` (ví dụ `WARN_RPP_ENVELOPES_IGNORED{ignored, read}`, `WARN_RPP_SRC_UNIT`, `WARN_RPP_EXTERNAL_MIDI`).
- Chi tiết từng định dạng: `docs/parser/PARSER-SDD.md`.

### 3.1 Giao thức Worker phân tích 🟡
`apps/web/src/workers/parser.worker.ts` (một Worker module, tạo lười khi cần):

| Chiều | Thông điệp |
|---|---|
| UI → Worker | `{ id, name, buffer(transfer), showMuted?, tempo?, files? }` |
| Worker → UI (đạt) | `{ id, ok:true, ast, warnings, format, ms }` |
| Worker → UI (lỗi) | `{ id, ok:false, code, message, details? }` |

`parserClient.parseInWorker` ghép `id` ↔ Promise; kết quả cũ (tệp được chọn lại giữa chừng) không ghi đè kết quả mới nhờ `id` tăng dần ⚪ (cần thêm kiểm "chỉ nhận id mới nhất" trong `App.onPick`).
