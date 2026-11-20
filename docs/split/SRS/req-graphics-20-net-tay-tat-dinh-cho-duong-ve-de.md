---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-20: Nét tay tất định cho đường vẽ **[ĐỀ XUẤT, D-63]**"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-GRAPHICS-20: Nét tay tất định cho đường vẽ **[ĐỀ XUẤT, D-63]**"
chunk: req-graphics-20-net-tay-tat-dinh-cho-duong-ve-de.md
source_lines: 688-692
source_sha1: 6d45847731
ids: [D-63, REQ-GRAPHICS-20]
---
#### REQ-GRAPHICS-20: Nét tay tất định cho đường vẽ **[ĐỀ XUẤT, D-63]**
* Áp lên mọi primitive đường vẽ (bản nhạc trước, sau có thể dùng cho widget khác): độ lệch đỉnh và điểm điều khiển, độ dày nét, kiểu đầu nét. Hai kiểu: *rung tĩnh* (mỗi phần tử một độ lệch cố định) và *boil* (đổi theo bước `boilFps`, mặc định 8–12).
* Nhiễu là hàm băm của `(id phần tử, chỉ số đỉnh, floor(t·boilFps), seed)`; **cấm** `Math.random`/`Date` (AI_CONTEXT §3, quy tắc 5). Cùng `t` và `seed` ra cùng ảnh ở Preview và Export.
* Cường độ chỉnh được (0 = tắt, mặc định tắt); độ đọc được của chữ nhạc kiểm ở 1080p và 720p (Spike 4, S4).
