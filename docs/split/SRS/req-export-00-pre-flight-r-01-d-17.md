---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-00: Pre-flight (R-01, D-17)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-00: Pre-flight (R-01, D-17)"
chunk: req-export-00-pre-flight-r-01-d-17.md
source_lines: 709-731
source_sha1: f91921e0ca
ids: [D-17, D-26, KPI-05, REQ-EXPORT-00, REQ-GRAPHICS-04, SOI-05]
---
#### REQ-EXPORT-00: Pre-flight (R-01, D-17)
* **Kích thước chẵn**: chiều rộng và cao phải là số chẵn dương; số lẻ tự làm tròn lên số chẵn gần nhất và thông báo. Cạnh dài ≤ 4096 px.
* **Lớp độ phân giải** (theo cạnh ngắn): 720p = 720, 1080p = 1080, 4K = 2160; cạnh dài = `round(cạnh_ngắn × tỉ_lệ)` rồi làm chẵn; nếu cạnh dài > 4096 thì thu nhỏ đồng tỉ lệ.

| Tỉ lệ | 720p | 1080p | 4K |
| :--- | :--- | :--- | :--- |
| 16:9 | 1280×720 | 1920×1080 | 3840×2160 |
| 9:16 | 720×1280 | 1080×1920 | 2160×3840 |
| 1:1 | 720×720 | 1080×1080 | 2160×2160 |

* **Kích thước tuỳ ý (D-26, Spike 1)**: ngoài các mốc 720p/1080p/4K, người dùng nhập **rộng × cao** tuỳ ý hoặc một **tỉ lệ khung tuỳ chỉnh** (ví dụ 21:9) cộng cạnh ngắn. Áp dụng cùng quy tắc: số chẵn dương, cạnh dài ≤ 4096 (thu nhỏ đồng tỉ lệ nếu vượt), kèm thông báo khi làm tròn.
* **Giao diện chọn kích thước (bổ sung v1.1):**
  * Ô **Rộng** và **Cao** (px), nút **khoá tỉ lệ** (sửa một ô thì ô kia tự tính), ô **tỉ lệ** nhận dạng `W:H` hoặc số thập phân (`21:9`, `4:5`, `2.39:1`, `1.91`).
  * Danh sách dựng sẵn: 16:9, 9:16, 1:1, 4:5 (bài dọc mạng xã hội), 4:3, 3:2, 21:9, 2.39:1 (điện ảnh), 1.91:1 (ảnh xem trước liên kết), cùng mục "Tuỳ chỉnh"; người dùng lưu kích thước hay dùng thành preset.
  * Giới hạn: cạnh ngắn ≥ 128, cạnh dài ≤ 4096 (đủ DCI 4K 4096×2160); số lẻ làm tròn xuống số chẵn. Hiện ngay kích thước thực sau làm tròn, tỉ lệ thực, dung lượng ước tính và cảnh báo nếu `isConfigSupported` từ chối.
  * Khung Preview đổi theo tỉ lệ ngay khi nhập; bố cục xử lý theo REQ-GRAPHICS-04. Kích thước trên 4096 (8K) cân nhắc ở bản 1.2, vì phụ thuộc codec (VP9/AV1/HEVC) và bộ nhớ.
* **FPS**: 24, 30, 60 (mặc định 30; preset ngang 16:9 mặc định 60 **[PROVISIONAL]**).
* **Thương lượng codec**: gọi `VideoEncoder.isConfigSupported` với cấu hình thực tế; chọn profile/level H.264 theo độ phân giải và FPS, dò từ cao xuống thấp (ví dụ level 4.2 cho 1080p60, 5.1/5.2 cho 4K) **[VERIFY]** (SOI-05). Không hỗ trợ thì cảnh báo vàng và đề xuất hạ cấu hình.
* **Ước lượng tài nguyên**: tính kích thước file ≈ `bitrate × thời lượng`. Trình duyệt không có File System Access và ước lượng > 1 GB thì cảnh báo nguy cơ thiếu RAM (R-01) và gợi ý hạ độ phân giải hoặc dùng Export Range.
* **Bitrate mặc định** **[PROVISIONAL]**: 720p 6 Mbps; 1080p 12 Mbps; 4K 35 Mbps (chất lượng Thấp/Vừa/Cao nhân 0.5/1/1.5).
* **Export Range**: xuất cả bài hoặc đoạn Start→End (KPI-05). Khi xuất cả bài: `Duration = max(ProjectDuration, AudioDuration) + 2.0 s`.
* Hiển thị tóm tắt: kích thước, FPS, thời lượng, số khung hình, kích thước file ước tính, codec sẽ dùng, mọi cảnh báo.
