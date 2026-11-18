---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-07: Thực thi trong Worker (ARC-02, D-21)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-07: Thực thi trong Worker (ARC-02, D-21)"
chunk: req-export-07-thuc-thi-trong-worker-arc-02-d-21.md
source_lines: 843-852
source_sha1: 4a4e62e7ba
ids: [ARC-02, D-21, D-61, ERR_EXPORT_FAILED, REQ-EXPORT-07]
---
#### REQ-EXPORT-07: Thực thi trong Worker (ARC-02, D-21)
* Vòng render, encoder và muxer chạy trong Export Worker; luồng chính chỉ gửi cấu hình, nhận tiến độ và lệnh hủy.
* Dữ liệu cần thiết (AST, ChordTimeline, cache audio, font, ảnh nền) được chuyển sang Worker bằng `postMessage` có chuyển quyền sở hữu (transferable) khi có thể.
* Worker lỗi bất ngờ thì báo `ERR_EXPORT_FAILED`, giữ nguyên phiên làm việc và cho thử lại.
* Nên dùng Screen Wake Lock trong lúc xuất để máy không ngủ (nếu trình duyệt hỗ trợ).
* **Một lần xuất mỗi lúc (D-61):** các tab của ứng dụng dùng chung một khoá Web Locks (`dawviz-export`). Tab đang xuất giữ khoá tới khi xong, lỗi, huỷ hoặc đóng; tab khác thấy báo "đang xuất ở tab khác" và nút Bắt đầu bị khoá (kiểm lại mỗi 2 giây). Lý do: hai lần xuất tranh bộ mã hoá nên mỗi lần chậm đi nhiều, và cùng chọn một tên tệp thì lần xong sau ghi đè lần kia mà không báo. Trình duyệt không có Web Locks thì không chặn.

---
