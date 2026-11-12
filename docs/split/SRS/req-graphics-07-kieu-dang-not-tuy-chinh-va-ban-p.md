---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-07: Kiểu dáng nốt tuỳ chỉnh và bàn phím"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-07: Kiểu dáng nốt tuỳ chỉnh và bàn phím"
chunk: req-graphics-07-kieu-dang-not-tuy-chinh-va-ban-p.md
source_lines: 436-443
source_sha1: 6c3a823de0
ids: [P-01, REQ-GRAPHICS-05, REQ-GRAPHICS-06, REQ-GRAPHICS-07, REQ-STORAGE-02]
---
#### REQ-GRAPHICS-07: Kiểu dáng nốt tuỳ chỉnh và bàn phím
* Kiểu nốt (`NoteStyle`) có hai tầng: **mặc định toàn cục** và **ghi đè theo track** (chỉ lưu trường khác mặc định). Mọi trường là dữ liệu thuần, tuần tự hoá được, lưu trong Preset và Project Pack (REQ-STORAGE-02).
* Trường tuỳ chỉnh: **chế độ màu** (`track`, `custom`, `pitch`, `velocity`) và màu tuỳ chọn; **độ đục** (0 đến 1) và độ đục khi nốt chưa phát; **độ dày** nốt (0,1 đến 1,5 lần một hàng cao độ); **bo góc** (px, kẹp ở nửa chiều cao, rất lớn cho dạng viên thuốc); **phát sáng** (cường độ 0 đến 1, bán kính px, tuỳ chọn chỉ sáng khi đang phát); **viền** (độ dày, màu tự động hoặc chọn).
* Giá trị ngoài miền hợp lệ bị **kẹp** (không ném lỗi); màu sai định dạng quay về mặc định. Độ sáng theo automation (REQ-GRAPHICS-06) nhân thêm vào độ đục và cường độ phát sáng.
* Có **bộ kiểu dựng sẵn** (neon, thanh bo tròn, phẳng, chỉ viền) làm điểm xuất phát; người dùng chọn rồi chỉnh tiếp.
* **Bàn phím piano** (widget P-01) dùng chung trục cao độ với Piano Roll, phím đang phát lấy màu nốt. Bật/tắt được. Bản đầu gắn cạnh Piano Roll; tách thành widget độc lập khi có Scene (T-05).
* Mọi kiểu dáng vẽ qua Render Core nên Preview và Export giống nhau (REQ-GRAPHICS-05). Phát sáng dùng `shadowBlur`; chi phí khi xuất độ phân giải cao cần đo (T-09).
