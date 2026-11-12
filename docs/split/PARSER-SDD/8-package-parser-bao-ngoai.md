---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "8. Package `parser` (bao ngoài)"
path: "8. Package `parser` (bao ngoài)"
chunk: 8-package-parser-bao-ngoai.md
source_lines: 96-98
source_sha1: dbb03a72c8
ids: []
---
## 8. Package `parser` (bao ngoài)
`detectFormat(name, buffer, options)`: ưu tiên schema khớp (`matchSchema`), rồi switch theo đuôi + `sniff`; thông báo lỗi có hướng dẫn (flp, bwproject, .als dạng ZIP). `probeProject(name, buffer, options)` (không ném lỗi) trả `{format|null, needs:{externalMidi, schema}, code?, message?}`: giao diện dùng để chỉ hiện ô nạp `.mid` ngoài (khi `.rpp` tham chiếu) hoặc ô schema (định dạng nhị phân/đuôi lạ như `.bwproject`, `.flp`; đuôi đã biết nhưng nội dung sai thì không). `parseProject` gán `title` mặc định = tên file bỏ đuôi, truyền `limits` đã resolve, gọi parser tương ứng, trả thêm `format`.
