---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.9 Binary theo schema"
path: "3. Yêu cầu chức năng > 3.9 Binary theo schema"
chunk: 3-9-binary-theo-schema.md
source_lines: 102-109
source_sha1: 59d9967678
ids: [D-62, ERR_SCHEMA_INVALID, ERR_UNSUPPORTED_FORMAT, REQ-BIN-01, REQ-BIN-02, REQ-BIN-03, REQ-BIN-04, REQ-BIN-05, REQ-BIN-06, REQ-FMT-08]
---
### 3.9 Binary theo schema
- **REQ-BIN-01** Schema JSON `schemaVersion: 1` mô tả cấu trúc byte và mục `ast` ánh xạ (xem `schemas/README.md`).
- **REQ-BIN-02** Mọi đọc byte bị chặn trong vùng hợp lệ; `count`/`length` không hợp lệ hoặc quá lớn → lỗi, không cấp phát theo giá trị trong file.
- **REQ-BIN-03** Biểu thức do bộ phân tích riêng đánh giá; hàm trắng `min max floor ceil round abs len beatsToTicks clamp`; tên `__proto__`, `constructor`, `prototype` bị cấm; có ngân sách phép tính (5e7), nút, độ sâu.
- **REQ-BIN-04** Schema sai → `ERR_SCHEMA_INVALID`; file không khớp `magic` → `ERR_UNSUPPORTED_FORMAT`; schema được chọn theo `extensions` + `magic`; schema người dùng nạp được ưu tiên hơn schema dựng sẵn.
- **REQ-BIN-05** (D-62) Hỗ trợ định dạng dòng sự kiện có trạng thái ngầm: `$last` trong phần tử mảng (phần tử liền trước); `ast.index` dựng bảng tra một lần (`list` | `collect` | khoá → giá trị cuối) dùng như biến `tên[khoá]`; `inner` lồng trong `each` (flatMap, `inner` không phải mảng = rỗng); `ast.warnings[]` `{when, code: WARN_*, message}`; `ast.sourceFormat`, `ast.sourceVersion`; hàm trắng `splitNum(chuỗi, ngăn, i)` và `basename(đường_dẫn)`; `tracks.let` (biến riêng của track) và `tracks.automation[]` (`kind` volume|pan|mute, `each/inner`, `tick`, `value`) cho lane `{kind, points}` đã sắp theo tick (trùng tick: điểm sau thắng) kèm `timeSeconds` theo TempoMap. Không nới lỏng ràng buộc an toàn của REQ-BIN-02/03.
- **REQ-BIN-06** (D-62) Schema dựng sẵn `schemas/flp.schema.json` (sinh sang `packages/binary/src/builtin-schemas.js` bằng `node scripts/gen-builtin-schemas.mjs`; test kiểm hai bên khớp). Xem REQ-FMT-08.
