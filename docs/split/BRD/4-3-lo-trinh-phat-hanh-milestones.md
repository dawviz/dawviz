---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "4.3. Lộ trình phát hành (Milestones)"
path: "4. PHẠM VI DỰ ÁN (PROJECT SCOPE) > 4.3. Lộ trình phát hành (Milestones)"
chunk: 4-3-lo-trinh-phat-hanh-milestones.md
source_lines: 130-139
source_sha1: e0f99b8321
ids: [AT-05, AT-06]
---
### 4.3. Lộ trình phát hành (Milestones)

| Mốc | Nội dung | Điều kiện hoàn thành |
| :--- | :--- | :--- |
| **M1** | Nạp file → Unified AST → Piano Roll (Canvas) + Track Info + thanh phát/tua, đa ngôn ngữ en/vi, độ sáng track theo volume. Chưa xuất video, chưa lưu phiên. | Mở được file mẫu của cả 5 định dạng; Preview tất định theo `t`; test Render Core và logic đạt; kiểm thủ công trên Chrome. |
| **M2** | Đủ 8 widget HUD, hệ tọa độ và bắt dính, chỉnh sửa bố cục, Preset. | AT của REQ-WIDGET, REQ-GRAPHICS đạt. |
| **M3** | Đường ống xuất MP4/WebM (Spike 1 đưa vào Render Core), Preview Mode WYSIWYG. | AT-05, AT-06 đạt. |
| **M4** | Lưu phiên (IndexedDB), Project Pack, nạp schema nhị phân, nhập ghi đè tempo trong giao diện. | REQ-STORAGE đạt. |
| **M5** | Cứng hoá: hiệu năng, trợ năng, bản dịch cộng đồng, đóng các OI còn lại hoặc ghi rõ hạn chế đã biết. | Toàn bộ AT; KPI đo được. |
