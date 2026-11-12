---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "10. Quyết định thiết kế và đánh đổi"
path: "10. Quyết định thiết kế và đánh đổi"
chunk: 10-quyet-dinh-thiet-ke-va-danh-doi.md
source_lines: 108-123
source_sha1: dbb03a72c8
ids: [ERR_NO_SUPPORTED_ENV, PD-01, PD-02, PD-03, PD-04, PD-05, PD-06, PD-07, PD-08, PD-09, PD-10, PD-11, PD-12, PD-18]
---
## 10. Quyết định thiết kế và đánh đổi
| ID | Quyết định | Lý do / hệ quả |
|---|---|---|
| PD-01 | Tự viết bộ quét XML thay vì DOMParser | Chạy trong Worker/Node, bỏ cả cây con, kiểm soát DoS; đổi lại không hỗ trợ XML phức tạp (namespace, CDATA tối thiểu) |
| PD-02 | `DecompressionStream` thay vì thư viện inflate | Zero-dependency; yêu cầu Chrome 103+/Node 18+ (`ERR_NO_SUPPORTED_ENV`) |
| PD-03 | Không ZIP64 | Chưa có nhu cầu; báo lỗi rõ |
| PD-04 | Chỉ đọc Arrangement của Ableton | Visualizer theo timeline; Session có số lượng cảnh báo |
| PD-05 | Tempo dốc xấp xỉ bằng bậc thang | Giữ `tempoMap` đơn giản; sai số nhỏ, có cảnh báo |
| PD-06 | Binary khai báo bằng JSON, không cho mã | An toàn (R-05/PD-18); đổi lại biểu đạt hạn chế, khó với định dạng cần tra bảng phức tạp hoặc nén |
| PD-07 | Cờ `tempoSource` thay vì mặc định 120 | Người dùng thấy và sửa được (`tempoOverride`) |
| PD-08 | Tolerance KPI theo PPQ thô hơn | So MIDI 96 PPQ với 960 PPQ mà không báo lỗi giả |
| PD-09 | Bundler tự viết | Không có mạng để cài esbuild; đủ cho cấu trúc hiện tại. Có thể thay bằng esbuild khi có mạng |
| PD-10 | `.alp` tách luồng gzip bằng thử-và-kiểm ISIZE thay vì tự cài inflate | Zero-dependency; `DecompressionStream` không báo điểm kết thúc luồng; chi phí giải nén lại ứng viên sai là nhỏ vì thường chỉ có vài luồng |
| PD-11 | i18n theo **mã lỗi**, không dịch `message` của thư viện | Thư viện giữ thông điệp kỹ thuật một ngôn ngữ cho nhà phát triển; giao diện dịch theo `code` nên thêm ngôn ngữ không đụng parser |
| PD-12 | Danh mục JSON phẳng + cú pháp `{tham_số}`/plural tự viết thay vì thư viện ngoài | Zero-dependency như phần còn lại; chỉ cần nội suy và số nhiều; cộng tác viên chỉ sửa JSON |
