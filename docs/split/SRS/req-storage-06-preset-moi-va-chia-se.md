---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-STORAGE-06: Preset mới và chia sẻ"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-STORAGE-06: Preset mới và chia sẻ"
chunk: req-storage-06-preset-moi-va-chia-se.md
source_lines: 957-960
source_sha1: fee32c2554
ids: [D-14, D-43, REQ-STORAGE-04, REQ-STORAGE-06]
---
#### REQ-STORAGE-06: Preset mới và chia sẻ
* **Hiện trạng (T-24, 2026-11-22):** gói `.dawviz-preset.zip` cho `scene`, `note-style`, `easing`, `particle` (lược đồ `presets/schema/preset-pack.schema.json`), băm SHA-256 từng tài nguyên, giấy phép SPDX bắt buộc trong danh sách cho phép, nhập kèm nhãn "chưa kiểm duyệt". Chưa có: `note-transition`, `theme`, `effect`.
* **1.0:** các loại `note-style`, `note-transition`, `easing`, `particle`, `theme`, `effect`, `scene`; JSON Schema, `schemaVersion` và di trú (REQ-STORAGE-04); "Chia sẻ thành preset" xuất `.dawviz-preset.zip` (JSON + tài nguyên + băm + giấy phép SPDX bắt buộc); nhập kèm nhãn "Chưa kiểm duyệt". **1.1:** thư viện cộng đồng trong ứng dụng (D-14), xác minh băm, danh sách thu hồi, kiểm duyệt theo D-43.
