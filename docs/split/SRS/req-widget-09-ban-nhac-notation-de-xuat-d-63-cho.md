---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-09: Bản nhạc (Notation) **[ĐỀ XUẤT, D-63, chờ Spike 4]**"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-09: Bản nhạc (Notation) **[ĐỀ XUẤT, D-63, chờ Spike 4]**"
chunk: req-widget-09-ban-nhac-notation-de-xuat-d-63-cho.md
source_lines: 670-679
source_sha1: 6d45847731
ids: [D-63, REQ-EXPORT-00, REQ-GRAPHICS-05, REQ-GRAPHICS-14, REQ-GRAPHICS-16, REQ-GRAPHICS-17, REQ-STORAGE-05, REQ-WIDGET-06, REQ-WIDGET-09, WARN_NOTATION_DENSE, WARN_NOTATION_FALLBACK]
---
#### REQ-WIDGET-09: Bản nhạc (Notation) **[ĐỀ XUẤT, D-63, chờ Spike 4]**
* Hiện bản nhạc khuông đôi (khoá Sol, khoá Fa) dựng từ nốt của các track được gán, kèm khoá, giọng, dấu nhịp, `♩=` từ bản đồ tempo, số ô nhịp. Dựng bằng VexFlow ở bước engrave **ngoài** Render Core (D-63); Render Core chỉ nhận `NotationLayout` (dữ liệu thuần: đường vẽ theo phần tử, mỗi phần tử có `id` nốt hoặc nhóm tĩnh, và bảng đơn điệu thời gian thật → x).
* **Trạng thái từng nốt** theo `t` (tra bằng chỉ mục nhị phân): *sắp tới*, *đang ngân* (từ thời điểm bắt đầu thật đến hết nốt), *đã qua*. Mỗi trạng thái có màu, độ đục, độ sáng riêng; màu theo track hoặc theo phase (REQ-GRAPHICS-14). Khi vào nốt: **phóng to quanh tâm đầu nốt** với easing và thời gian vào/ra chỉnh được (ANIMATION-CATALOG), tuỳ chọn phát sáng (REQ-GRAPHICS-17). Đầu nốt, thân, cờ, dấu hoá của một nốt là một nhóm; nốt móc nối chùm thì đường nối đổi màu theo phần đang sáng, không phóng to.
* **Playhead tuỳ chọn:** tắt (chỉ nốt sáng), vạch theo ô nhịp, hoặc vạch mượt theo bảng thời gian → x (REQ-GRAPHICS-16).
* **Trang:** *N ô nhịp mỗi trang* (dùng lại `barStartSec`/`barPageAt`, hiện trang sau trước) hoặc *một hàng cuộn ngang*; chuyển trang bằng cắt, mờ dần, trượt hoặc nét bút quét.
* **Hiển thị thêm (tuỳ chọn):** tên nốt trong đầu nốt, ký hiệu hợp âm phía trên khuông (nối REQ-WIDGET-06), dấu động từ velocity, ẩn/hiện khoá, giọng, nhịp, số ô nhịp, `♩=`.
* **Phông nhạc:** phông có sẵn (gồm kiểu viết tay nếu giấy phép cho phép) hoặc phông SMuFL người dùng nạp qua tài nguyên phiên (REQ-STORAGE-05); glyph vẽ bằng đường viền, **không** nạp `FontFace` cho phông nhạc (xem FIREFOX-FONT-SLOWDOWN).
* **Tất định:** kết quả chỉ phụ thuộc `(scene, derived, ast, t, scale)` (REQ-GRAPHICS-05); Preview và Export dùng cùng `NotationLayout`. Engrave chạy một lần và có cache theo hash `(nốt, cài đặt lượng tử, phông)`; pre-flight xuất (REQ-EXPORT-00) engrave trước mọi trang và báo cảnh báo.
* **Suy giảm có báo:** trang quá dày thì giảm số giọng và độ phức tạp kèm `WARN_NOTATION_DENSE`; không dựng nổi thì rơi về Piano Roll kèm `WARN_NOTATION_FALLBACK`. Mã mới thêm vào Phụ lục A2 khi làm.
