---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-04: Ghép container qua Mediabunny (D-04)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-04: Ghép container qua Mediabunny (D-04)"
chunk: req-export-04-ghep-container-qua-mediabunny-d-04.md
source_lines: 747-751
source_sha1: 7ab053e2fc
ids: [D-04, REQ-EXPORT-04, SOI-10]
---
#### REQ-EXPORT-04: Ghép container qua Mediabunny (D-04)
* `MuxerAdapter` bọc Mediabunny, ghép MP4 **fast-start** (moov ở đầu file) khi có thể. **[ĐÃ ĐO, Spike 1]** `fastStart: false` cho bố cục `ftyp mdat moov`; `fastStart: 'in-memory'` cho `ftyp moov mdat` (đạt fast-start). Chế độ ghi thẳng xuống đĩa kết hợp fast-start vẫn **[VERIFY]** (SOI-10).
* Có File System Access API: ghi trực tiếp xuống đĩa qua `FileSystemWritableFileStream`. Không có: tích lũy chunk vào bộ nhớ và kích hoạt tải xuống khi xong.
* Tên file mặc định: `{tên_dự_án}_{rộng}x{cao}_{fps}fps.mp4` (kích thước thực sau khi làm chẵn, v0.3), ký tự không hợp lệ bị thay bằng `_`. Tên file **phải được chốt trước khi bắt đầu vòng render** và dùng ngay khi mở luồng ghi (File System Access `showSaveFilePicker` hoặc tên tải xuống), không đổi tên thụ động khi kết thúc (Spike 1).
