---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "8. Package `parser` (bao ngoài)"
path: "8. Package `parser` (bao ngoài)"
chunk: 8-package-parser-bao-ngoai.md
source_lines: 96-98
source_sha1: ba174dece0
ids: []
---
## 8. Package `parser` (bao ngoài)
`detectFormat(name, buffer, options)`: ưu tiên schema khớp (`matchSchema`), rồi switch theo đuôi + `sniff`; thông báo lỗi có hướng dẫn (bwproject, .als dạng ZIP). Sau schema người dùng thì thử schema **dựng sẵn** (`BUILTIN_SCHEMAS`, hiện có `flp`) và trả `format` = id schema; `.flp` dạng ZIP trả thêm `zipEntry` để `parseProject` giải nén `.flp` bên trong. Cách định dạng dòng sự kiện FLP vừa schema: [SPIKE-3](../../spikes/SPIKE-3-FLP.md). `probeProject(name, buffer, options)` (không ném lỗi) trả `{format|null, needs:{externalMidi, schema}, code?, message?}`: giao diện dùng để chỉ hiện ô nạp `.mid` ngoài (khi `.rpp` tham chiếu) hoặc ô schema (định dạng nhị phân/đuôi lạ như `.bwproject`; đuôi đã biết, kể cả `.flp`, nhưng nội dung sai thì không). `parseProject` gán `title` mặc định = tên file bỏ đuôi, truyền `limits` đã resolve, gọi parser tương ứng, trả thêm `format`.
