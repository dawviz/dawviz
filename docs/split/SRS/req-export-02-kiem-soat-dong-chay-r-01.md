---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-02: Kiểm soát dòng chảy (R-01)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-02: Kiểm soát dòng chảy (R-01)"
chunk: req-export-02-kiem-soat-dong-chay-r-01.md
source_lines: 670-672
source_sha1: 77837e7134
ids: [REQ-EXPORT-02]
---
#### REQ-EXPORT-02: Kiểm soát dòng chảy (R-01)
Theo dõi `videoEncoder.encodeQueueSize`. Nếu > 8 thì tạm dừng sinh khung (chờ sự kiện `dequeue`) cho đến khi ≤ 2. Áp dụng cho cả `AudioEncoder`.
