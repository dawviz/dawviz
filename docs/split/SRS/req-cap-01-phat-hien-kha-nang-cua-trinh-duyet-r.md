---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-CAP-01: Phát hiện khả năng của trình duyệt (R-06, D-05)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-CAP-01: Phát hiện khả năng của trình duyệt (R-06, D-05)"
chunk: req-cap-01-phat-hien-kha-nang-cua-trinh-duyet-r.md
source_lines: 705-707
source_sha1: e94e9bc79b
ids: [D-05, REQ-CAP-01, REQ-EXPORT-06]
---
#### REQ-CAP-01: Phát hiện khả năng của trình duyệt (R-06, D-05)
Khi khởi động và trước mỗi lần xuất, kiểm tra: `VideoEncoder`, `AudioEncoder`, `OffscreenCanvas`, `isConfigSupported` cho H.264/AAC/VP9/Opus, File System Access API, `navigator.storage`. Kết quả được dùng để bật/tắt tính năng và chọn bậc dự phòng ở REQ-EXPORT-06. Thiếu WebCodecs thì hiển thị thông báo rõ nguyên nhân và vẫn cho dùng Edit/Preview.
