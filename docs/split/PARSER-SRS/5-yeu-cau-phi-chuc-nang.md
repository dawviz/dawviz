---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "5. Yêu cầu phi chức năng"
path: "5. Yêu cầu phi chức năng"
chunk: 5-yeu-cau-phi-chuc-nang.md
source_lines: 126-130
source_sha1: dd04828ada
ids: [REQ-NFR-01, REQ-NFR-02, REQ-NFR-03]
---
## 5. Yêu cầu phi chức năng
- **REQ-NFR-01** Không phụ thuộc gói ngoài (zero dependency).
- **REQ-NFR-02** `Demo.als` (≈ 9600 nốt) phân tích dưới 1 giây trong Worker (đo ≈ 0,6 s).
- **REQ-NFR-03** Đầu vào không tin cậy: không đệ quy không giới hạn, không vòng lặp vô hạn (mọi vòng lặp loop/mảng có chốt chặn).
