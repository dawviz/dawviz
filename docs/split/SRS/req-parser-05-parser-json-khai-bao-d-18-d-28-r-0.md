---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-05: Parser JSON khai báo (D-18, D-28, R-05)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-05: Parser JSON khai báo (D-18, D-28, R-05)"
chunk: req-parser-05-parser-json-khai-bao-d-18-d-28-r-0.md
source_lines: 325-331
source_sha1: 45be2554f6
ids: [D-18, D-28, ERR_SCHEMA_INVALID, ERR_UNSUPPORTED_FORMAT, OI-08, REQ-AST-01, REQ-PARSER-05, SOI-12]
---
#### REQ-PARSER-05: Parser JSON khai báo (D-18, D-28, R-05)
* Chỉ nhận cấu hình JSON tĩnh, kiểm tra bằng bộ kiểm tra không sinh mã động; cấm `eval`/`new Function`.
* **Nguồn nhị phân (đã triển khai, D-28)**: schema `schemaVersion: 1` mô tả cấu trúc byte (số nguyên/float big/little endian, VLQ, LEB128, chuỗi, mảng, `struct`, `switch`, vùng `length`, `when`, `offset/peek`, `align`, `assert`) và mục `ast` ánh xạ sang AST (`each/as/filter`, `tempo`, `tracks`, `notes`, `ppq`, `timeUnit`). Biểu thức do bộ phân tích riêng đánh giá, hàm trắng `min max floor ceil round abs len beatsToTicks clamp`, cấm tên `__proto__`, `constructor`, `prototype`, có ngân sách phép tính (5×10⁷), số nút, độ sâu. Mọi đọc byte bị chặn trong vùng hợp lệ. Schema chọn theo `extensions` + `magic`. Đặc tả: `schemas/README.md`; ví dụ chạy được: `schemas/demo-dbin.schema.json`.
* **Nguồn XML/JSON khai báo (v0.2)**: `sourceType: "xml" | "json"`, đường dẫn dot-notation/XPath rút gọn, transformer danh sách trắng (`parseInteger`, `parseFloat`, `stringTrim`, `ticksToSeconds(ppq)`, `beatsToTicks(ppq, targetPPQ=960)`, `midiPitchToNoteName`, `velocityNormalize`): **chưa triển khai** trong thư viện (SOI-12); có thể dùng lại ngôn ngữ biểu thức và ngân sách của engine nhị phân.
* Kết quả phải qua cùng bước xác thực AST (REQ-AST-01). Lỗi schema: `ERR_SCHEMA_INVALID`; file không khớp magic: `ERR_UNSUPPORTED_FORMAT`.
* Định dạng nhị phân gốc của DAW (`.bwproject`, `.flp`) **chưa hỗ trợ** cho tới khi có file mẫu để viết schema (OI-08).
