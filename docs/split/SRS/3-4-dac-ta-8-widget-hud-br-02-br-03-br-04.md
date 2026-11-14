---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)"
chunk: 3-4-dac-ta-8-widget-hud-br-02-br-03-br-04.md
source_lines: 548-551
source_sha1: 45be2554f6
ids: [BR-02, BR-03, BR-04]
---
### 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)

Mỗi widget có thuộc tính hình học `(x, y, width, height, zIndex, rotation)` và hỗ trợ snapping như nhau. **Trạng thái rỗng**: widget không có dữ liệu (không có track gán, chưa nạp audio) vẫn phải hiển thị khung giữ chỗ ở Edit Mode, và không vẽ gì ở Preview/Export, trừ khi người dùng chọn hiển thị giá trị mặc định.
