---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "2.4. Đánh giá kiến trúc hiện tại"
path: "2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC > 2.4. Đánh giá kiến trúc hiện tại"
chunk: 2-4-danh-gia-kien-truc-hien-tai.md
source_lines: 212-227
source_sha1: 0fd28ef586
ids: [ARC-01, ARC-02, ARC-03, ARC-04, ARC-05, ARC-06, ARC-07, D-06, D-20, D-21, D-22, NFR-PERF-04, NFR-SEC-03, REQ-EXPORT-03, REQ-EXPORT-07, REQ-GRAPHICS-05, REQ-WIDGET-07]
---
### 2.4. Đánh giá kiến trúc hiện tại

**Kết luận:** kiến trúc phân tầng (UI → Document → Render → Worker → Storage) **đúng hướng** và đủ cho phạm vi v1.0, nhưng bản nháp trước còn 7 điểm cần sửa. Các điểm 1–4 nên chốt trước khi viết code vì ảnh hưởng cấu trúc; 5–7 có thể xử lý trong lúc triển khai.

| Mã | Mức | Vấn đề ở bản nháp trước | Chỉnh sửa trong v0.2 |
| :--- | :--- | :--- | :--- |
| **ARC-01** | Cao | Chưa có tầng vẽ dùng chung. Preview và Export dễ vẽ khác nhau (font, FFT, làm tròn), phá nguyên tắc WYSIWYG (D-06) và đồng bộ hình-tiếng. | Thêm Render Core: một hàm thuần `renderFrame(...)` chạy trên `Canvas` (Preview) và `OffscreenCanvas` (Export), truy cập ngẫu nhiên theo thời gian `t` (REQ-GRAPHICS-05). |
| **ARC-02** | Cao | Vòng render xuất chạy ở đâu không rõ; nếu ở luồng chính, giao diện đứng hình và bị trình duyệt giảm tốc khi chuyển tab. | Export Worker riêng gồm khung vẽ, encoder, muxer; luồng chính chỉ nhận tiến độ và gửi lệnh hủy (REQ-EXPORT-07). |
| **ARC-03** | Cao | `AudioBuffer` giải mã toàn bộ file 300 MB có thể chiếm hàng GB PCM, mâu thuẫn NFR-PERF-04 (≤ 2 GB). | Giới hạn thời lượng giải mã, cache phân tích dạng mono, mã hóa audio theo từng khối (REQ-WIDGET-07, REQ-EXPORT-03). |
| **ARC-04** | Trung bình | `ChordTimeline` và phân tích audio không có chỗ chạy, dễ chặn UI với file lớn. | Chạy trong Parse & Analysis Worker, trả kết quả dạng cấu trúc đã xác thực. |
| **ARC-05** | Trung bình | Trạng thái lẫn lộn giữa "Session State" và dữ liệu dẫn xuất; Undo/Redo không rõ phạm vi. | Tách **Project Document Store** (nguồn sự thật, tuần tự hóa được, có phiên bản) khỏi **Derived Data** (AST, chord, audio cache; tái tạo được, không đưa vào Undo). |
| **ARC-06** | Trung bình | `FFT` dùng `AnalyserNode` ở Preview thì không tái lập được khi xuất. | FFT tự cài, tất định, tính từ PCM tại thời điểm `t` cho cả Preview và Export (REQ-WIDGET-07). |
| **ARC-07** | Thấp | CSP bản nháp chặn ảnh/font từ `blob:`/`data:` mà ứng dụng cần; font ngoài (Google Fonts) vi phạm "không mạng". | CSP đầy đủ ở NFR-SEC-03; font đóng gói cục bộ. |

Đề xuất bổ sung vào Nhật ký quyết định BRD: **D-20** (Render Core dùng chung), **D-21** (Export chạy trong Worker), **D-22** (FFT tất định, không dùng `AnalyserNode`).
