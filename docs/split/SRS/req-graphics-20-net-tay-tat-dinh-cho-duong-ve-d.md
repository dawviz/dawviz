---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-20: Nét tay tất định cho đường vẽ (D-63; đã làm 2026-11-21 cho bản nhạc)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-GRAPHICS-20: Nét tay tất định cho đường vẽ (D-63; đã làm 2026-11-21 cho bản nhạc)"
chunk: req-graphics-20-net-tay-tat-dinh-cho-duong-ve-d.md
source_lines: 695-699
source_sha1: fee32c2554
ids: [D-63, REQ-GRAPHICS-20]
---
#### REQ-GRAPHICS-20: Nét tay tất định cho đường vẽ (D-63; đã làm 2026-11-21 cho bản nhạc)
* Áp lên `PathPrim`: đường được dời đỉnh và điểm điều khiển, đoạn thẳng dài (≥ 4 khoảng dòng kẻ) thành đường cong lượn nhẹ vuông góc; glyph lệch, xoay, co nhỏ; nét dày hơn 15% và đầu tròn. Hai kiểu: *rung tĩnh* (`boilFps = 0`) và *boil* (đổi theo bước `floor(t·boilFps)`, 0–24).
* Nhiễu là hàm băm số nguyên của `(id phần tử, chỉ số đỉnh, bước, seed)`; **cấm** `Math.random`/`Date`. Cùng `t` và `seed` ra cùng ảnh ở Preview và Export.
* Cường độ 0–6 (0 = tắt, mặc định). Mức 3 vẫn đọc rõ ở 1080p (Spike 4, S4).
