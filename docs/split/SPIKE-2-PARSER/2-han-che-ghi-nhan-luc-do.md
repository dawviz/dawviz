---
doc: SPIKE-2-PARSER.md
doc_title: "Spike 2: Parser và Unified AST"
section: "2. Hạn chế ghi nhận lúc đó"
path: "2. Hạn chế ghi nhận lúc đó"
chunk: 2-han-che-ghi-nhan-luc-do.md
source_lines: 13-18
source_sha1: 715868848b
ids: [OI-01]
---
## 2. Hạn chế ghi nhận lúc đó

* **Độ hoàn thiện theo định dạng:** mới kiểm đầy đủ `.mid`; `.als`, `.rpp`, `.dawproject` mới dựng khung logic theo cấu trúc XML/văn bản dự kiến, chưa kiểm bằng nhiều tệp mẫu (OI-01).
* **Dump cây cấu trúc:** nút in cây cấu trúc trên giao diện chưa chạy trơn tru, chưa phản ánh đủ các tầng của dự án phức tạp.
* **Fallback tempo 120 BPM:** tự động về 120 BPM khi thiếu tempo là hạn chế; sản phẩm chính cần cho người dùng thêm mốc tempo hoặc offset tuỳ ý.
