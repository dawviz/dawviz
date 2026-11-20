---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung"
chunk: req-graphics-04-preset-dung-san-va-doi-ti-le-khu.md
source_lines: 461-468
source_sha1: 6d45847731
ids: [D-51, KPI-04, REQ-GRAPHICS-04, REQ-UI-02]
---
#### REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung
* **Tỉ lệ khung thuộc về phong cách video (scene)**, không phải cài đặt chung: phong cách mặc định khi nạp dự án lần đầu là **Paper (D-51), khung vuông 1:1**; các phong cách khác có thể mang tỉ lệ riêng (hiện "Dark" là 16:9). Mỗi phong cách giữ bản chỉnh dở của riêng nó, kể cả tỉ lệ.
* **Bộ chọn tỉ lệ 9:16 / 1:1 / 16:9 ở đầu sân khấu** (thẻ Xem trước và Chỉnh sửa) đổi tỉ lệ của phong cách đang dùng mà không đổi phong cách. Kích thước thiết kế đổi theo `ASPECTS` (1080×1920, 1080×1080, 1920×1080 pt); mọi widget co giãn theo tỉ lệ tương đối (x và bề rộng theo bề rộng mới/cũ, y và chiều cao theo chiều cao mới/cũ; góc xoay và điểm neo giữ nguyên); bố cục tham chiếu của nút ↺ co giãn cùng nên ↺ về đúng bố cục dựng sẵn ở tỉ lệ mới. Là **một bước hoàn tác** (REQ-UI-02). Người dùng chính muốn đăng video dọc (Persona 1, KPI-04) chỉ cần một lần bấm 9:16.
* **Cỡ khung tuỳ ý (Nâng cao):** mục **Cỡ khung** ở thẻ Chỉnh sửa (khi không chọn widget) nhập rộng và cao 256–4096 pt mỗi cạnh; tỉ lệ ghi trên khung được rút gọn (ví dụ 1000×1250 → 4:5). Co giãn widget và hoàn tác như bộ chọn ở trên. Không có ô nào trong bộ chọn 9:16 / 1:1 / 16:9 được đánh dấu khi cỡ khác ba tỉ lệ đó.
* **Ảnh thu nhỏ của phong cách** (cột Video styles) luôn cùng khung 16:9, cắt quanh vạch phát, bất kể tỉ lệ của phong cách (kể cả preset mở từ tệp), để cột giữ nhịp đều.
* Preset tự gán track theo `trackMappingMode` (ví dụ `AUTO_ASSIGN_FIRST_MELODIC`: track đầu tiên có nốt và không phải Drums).
* Đổi tỉ lệ khung khi đã chỉnh layout: bản 1.0 chỉ có **"Co giãn bố cục hiện tại theo tỉ lệ tương đối"** (bộ chọn ở trên); các cách khác **"Áp preset của tỉ lệ mới"** và **"Neo theo cạnh"** là việc sau (v1.1: mỗi widget giữ khoảng cách tới cạnh hoặc tâm gần nhất và giữ kích thước theo cạnh ngắn, hợp với tỉ lệ tuỳ ý như 21:9 hay 4:5); thao tác phải hoàn tác được (REQ-UI-02).
