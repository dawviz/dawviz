---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)"
chunk: req-graphics-01-phan-lop-do-hoa-d-07.md
source_lines: 415-420
source_sha1: 46410b6da3
ids: [D-07, D-57, REQ-GRAPHICS-01]
---
#### REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)
1. **Nền cố định**: màu nền hoặc ảnh nền (phủ kín, chế độ cover).
2. **Widget tự do (1..N)**: mỗi widget có `zIndex` nguyên riêng; có Bring to Front / Send to Back. **Đổi thứ tự lớp (D-57):** kéo thả dòng trong danh sách Lớp của Editor (vạch chèn ở mép trên/dưới dòng đang rê); lên/xuống một bậc bằng nút hoặc `Ctrl`/`⌘` + `]` / `[`, thêm `Shift` để lên trên cùng / xuống dưới cùng; `Alt` + ↑/↓ trên dòng Lớp đang focus. Mỗi dòng Lớp có tay nắm 6 chấm như dòng track (cả dòng kéo được). **Lớp đã khoá đứng yên cả trong danh sách** (như After Effects; Figma thì vẫn cho đổi thứ tự lớp khoá, dự án chọn theo AE): không có tay nắm, không kéo được, nút lên/xuống và phím tắt không có tác dụng; lớp khác vẫn đổi chỗ quanh nó; hàng đầu danh sách Lớp có **mắt tổng** (còn lớp ẩn thì hiện hết trước, đã hiện hết thì ẩn hết; hoàn tác được) và **khoá tổng** (còn lớp chưa khoá thì khoá hết, không thì mở hết; khoá là trạng thái phiên), chỉ biểu tượng, chú thích khi rê. Danh sách Lớp liệt kê lớp trên cùng trước; mỗi lần đổi là một bước hoàn tác và đánh lại `zIndex` liền mạch 0…n−1.
3. **Playhead**: thuộc Piano Roll, vẽ đè lên thanh nốt nhưng nằm dưới widget có `zIndex` cao hơn Piano Roll. Giữa các thanh nốt: nốt đang phát luôn vẽ trên nốt chưa phát và đã phát (T-71).
4. **Lớp tương tác cố định**: khung chọn, điểm neo, đường gióng. Chỉ có ở Edit Mode; ẩn hoàn toàn ở Preview Mode và khi xuất.
