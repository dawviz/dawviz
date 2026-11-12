---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung"
chunk: req-graphics-04-preset-dung-san-va-doi-ti-le-khu.md
source_lines: 422-426
source_sha1: 77837e7134
ids: [KPI-04, REQ-GRAPHICS-04, REQ-UI-02]
---
#### REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung
* Có ít nhất 3 preset dựng sẵn: dọc 9:16, ngang 16:9, vuông 1:1; preset mặc định khi nạp dự án lần đầu là **dọc 9:16** (Persona 1, KPI-04) **[PROVISIONAL]**.
* Preset tự gán track theo `trackMappingMode` (ví dụ `AUTO_ASSIGN_FIRST_MELODIC`: track đầu tiên có nốt và không phải Drums).
* Đổi tỉ lệ khung khi đã chỉnh layout: hộp thoại cho chọn "Áp preset của tỉ lệ mới", "Co giãn bố cục hiện tại theo tỉ lệ tương đối" hoặc **"Neo theo cạnh"** (v1.1: mỗi widget giữ khoảng cách tới cạnh hoặc tâm gần nhất và giữ kích thước theo cạnh ngắn, hợp với tỉ lệ tuỳ ý như 21:9 hay 4:5); thao tác phải hoàn tác được (REQ-UI-02).
