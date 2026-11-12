---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "1. Mục đích và phạm vi"
path: "1. Mục đích và phạm vi"
chunk: 1-muc-dich-va-pham-vi.md
source_lines: 6-11
source_sha1: dd04828ada
ids: []
---
## 1. Mục đích và phạm vi

Đọc file dự án DAW trong trình duyệt/Worker/Node và xuất **một** cấu trúc `UnifiedProjectAST` chứa nốt MIDI, tempo, nhịp, track để vẽ visualizer. Không phát âm thanh, không đọc audio, không ghi ngược file dự án.

Ngoài phạm vi: audio clip, plugin/automation ngoài tempo và nhịp, ghi file. Chưa hỗ trợ: Session View của Ableton, `.flp`, `.bwproject` (nhị phân, chờ file mẫu).
