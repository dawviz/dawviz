---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-03: Xoay widget tự do (D-54, thay D-15)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-03: Xoay widget tự do (D-54, thay D-15)"
chunk: req-graphics-03-xoay-widget-tu-do-d-54-thay-d-15.md
source_lines: 436-444
source_sha1: f4f69f9f7d
ids: [D-15, D-47, D-54, D-57, REQ-GRAPHICS-02, REQ-GRAPHICS-03, REQ-GRAPHICS-05, REQ-GRAPHICS-09, REQ-GRAPHICS-15, REQ-UI-15]
---
#### REQ-GRAPHICS-03: Xoay widget tự do (D-54, thay D-15)
**Sửa tài liệu v1.2 (2026-11-13): xoay 2D chỉnh được từ bản phát hành 1.0.**
* **Dữ liệu:** `layout.rotation` (độ, chuẩn hoá về (−180, 180]) và `layout.anchor` (điểm neo `{x, y}` theo tỉ lệ khung widget 0..1, mặc định tâm `{0.5, 0.5}`). Preset cũ không có `anchor` thì dùng tâm. Thêm `anchor` là đổi `schemaVersion` phụ (0.3.x → 0.4.0), đọc được preset 0.3.x.
* **Chỉnh:** tay nắm xoay phía trên khung chọn; kéo bắt dính mỗi 15°, giữ `Shift` để tự do; ô nhập số (REQ-UI-15); nhấp đúp tay nắm đưa về 0°; kéo điểm neo; **đưa neo về tâm bằng nút ↺** cạnh ô chọn 9 điểm (cả hai trục) và cạnh ô Neo X / Neo Y (từng trục, chỉ hiện khi trục đó lệch 50%); widget không dịch chỗ (D-57). **Không có nhấp đúp điểm neo** (chủ dự án bỏ 2026-11-14): tay nắm neo nằm giữa widget, nhấp đúp dễ trúng nhầm khi định chọn/kéo widget, và nút ↺ đã đủ; (giữ `Alt` khi kéo tay nắm xoay để xoay quanh góc đối diện). Chọn nhiều widget thì xoay cả nhóm quanh tâm nhóm. **Theo critique giao diện (T-68, 2026-11-13):** điểm neo (kéo trên khung, ô chọn 9 điểm, ô X/Y %) chỉ có ở chế độ **Nâng cao**; ở Cơ bản widget xoay quanh neo đang lưu (mặc định tâm) và chấm neo chỉ để nhìn, vì tay nắm neo ở tâm cướp cú nắm "di chuyển" của người dùng mới. Giữ `Shift` = tự do (ngược thói quen Figma) vẫn giữ như trên. Xoay quanh góc đối diện bằng `Alt` chưa làm.
* **Bắt dính với widget đã xoay:** dùng **khung bao thẳng trục** của hình đã xoay và tâm của nó cho lưới và Smart Guides (REQ-GRAPHICS-02); widget cùng góc thì gióng thêm theo cạnh của chính chúng.
* **Vẽ:** Render Core dời tới điểm neo, xoay, vẽ, cắt theo khung đã xoay; tất định như mọi widget (REQ-GRAPHICS-05). Nội dung bên trong widget không bị co để vừa khung thẳng trục.
* **Hoạt hoạ:** `rotation` gắn được keyframe, binding, biểu thức như mọi thuộc tính số (REQ-GRAPHICS-09, 12, 13).
* **Từ 1.1 (D-47):** `rotation` chính là `rotateZ` trong biến đổi 3D của REQ-GRAPHICS-15; preset 1.0 mở ở 1.1 không đổi hình.
