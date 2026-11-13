---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-05: Render Core dùng chung (ARC-01, D-20)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-05: Render Core dùng chung (ARC-01, D-20)"
chunk: req-graphics-05-render-core-dung-chung-arc-01-d.md
source_lines: 480-487
source_sha1: f0e666678e
ids: [ARC-01, D-20, REQ-GRAPHICS-05]
---
#### REQ-GRAPHICS-05: Render Core dùng chung (ARC-01, D-20)
* Mọi widget vẽ qua `renderFrame(document, derivedData, t, target, scale)`; hàm này không đọc đồng hồ hệ thống, `requestAnimationFrame`, hay trạng thái tăng dần.
* Preview và Export gọi cùng hàm; chỉ khác `target` (Canvas / OffscreenCanvas) và `scale`.
* **Hai ngưỡng sai khác** (sửa ở v1.1 theo số đo Spike 1, xem `docs/spikes/SPIKE-1-EXPORT.md`):
  * *Cùng đường vẽ* (cùng loại target, cùng máy, cùng `t`): sai khác ≤ 1/255 mỗi kênh màu. Dùng cho kiểm thử hồi quy bằng ảnh chụp và cho tính tất định (tua tới `t` so với phát liên tục tới `t`).
  * *Khác đường vẽ* (Canvas luồng chính ↔ `OffscreenCanvas` trong Worker): khác biệt khử răng cưa ở mép hình là bình thường (Spike 1 đo **max diff = 57/255**), nên **không** dùng max diff. Tiêu chí **[PROVISIONAL]**: ≥ 99,5% điểm ảnh lệch ≤ 2/255 mỗi kênh và PSNR ≥ 40 dB; đo lại phân bố sai khác ở M3 (T-09) rồi chốt.
* Font người dùng nạp phải được nạp xong (`FontFace.load`) trước khi vẽ khung đầu tiên khi xuất.
