---
doc: SPIKE-2-PARSER.md
doc_title: "Spike 2: Parser và Unified AST"
section: "1. Tổng quan"
path: "1. Tổng quan"
chunk: 1-tong-quan.md
source_lines: 5-12
source_sha1: 715868848b
ids: []
---
## 1. Tổng quan

* **Mục tiêu:** đọc tệp dự án DAW (`.als`, `.rpp`, `.dawproject`, `.mid`) và chuẩn hoá về `UnifiedProjectAST`, chạy hoàn toàn phía client trong Web Worker để không chặn giao diện.
* **Đã làm (tại thời điểm báo cáo):**
  * `parser-core.js` và `parser-worker.js` với lớp bảo vệ cơ bản: giới hạn kích thước tệp, chống zip-bomb, kiểm độ sâu XML.
  * Đọc ổn định **Standard MIDI File**: giải mã sự kiện, quy đổi thời gian qua TempoMap, ghép cặp Note-On/Off theo FIFO.
  * Trang thử `index.html` có Worker và hàm so sánh AST (`compareAST`) với tệp MIDI tham chiếu.
