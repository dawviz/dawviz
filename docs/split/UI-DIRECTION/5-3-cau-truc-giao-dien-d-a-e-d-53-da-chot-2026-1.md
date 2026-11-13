---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "5.3 Cấu trúc giao diện: D + A + E (D-53, đã chốt 2026-11-13)"
path: "5. Theme giao diện chỉ đổi màu (D-52) > 5.3 Cấu trúc giao diện: D + A + E (D-53, đã chốt 2026-11-13)"
chunk: 5-3-cau-truc-giao-dien-d-a-e-d-53-da-chot-2026-1.md
source_lines: 329-349
source_sha1: 17129663d4
ids: [D-53, REQ-UI-13, REQ-UI-15]
---
### 5.3 Cấu trúc giao diện: D + A + E (D-53, đã chốt 2026-11-13)
Vì theme chỉ đổi màu, 6 phong cách không phải 6 giao diện khác nhau mà là **một cấu trúc** (phông, khoảng cách, cách phân vùng, hình dạng điều khiển) **cộng nhiều bảng màu**. Cấu trúc đã chốt:

- **Cấu trúc:** lấy D (phần cứng studio) làm nền vì mật độ và trật tự tốt nhất, với cách kẻ mảnh, số mục 01–04 và số căn phải của A. Phông: một grotesk trung tính (Inter hoặc tương đương, OFL) cho chữ và nhãn; số dùng chữ số đều. Không dùng phông mono cho nhãn (B) và không dùng chữ khổng lồ (F).
- **Sân khấu:** cách đóng khung "bản in thử" của E (dấu cắt mảnh, thông số dọc mép), làm nhẹ và bật/tắt được.
- **Bảng màu dựng sẵn (theme app):** Studio cam (D, mặc định), Bản in đỏ (A), Đồng (C), Riso hồng (B). Mỗi bảng có sáng và tối (mục 5.4).

**Chi tiết cấu trúc (theo khung chung 3.7):**

| Vùng | Quy tắc |
| :--- | :--- |
| Thanh trên, hàng 1 | Biểu tượng + "DAW Visualizer", tên file đang mở; bên phải: `Basic | Advanced`, "Open file", nút chính "Export video" (màu nhấn), nút sáng/tối, ngôn ngữ |
| Thanh trên, hàng 2 | Thẻ **Preview / Editor / Settings**, thẻ đang mở gạch chân màu nhấn |
| Cột trái | "Video styles" (phong cách video, không gọi là theme): **chỉ chứa preset scene** (Paper, Mặc định…), mỗi mục có ảnh thu nhỏ do Render Core vẽ, cắt quanh vạch phát và phóng ~2 lần. Bộ kiểu nốt dựng sẵn (Neon, Soft, Flat, Outline) là chọn ở mục `02 Look`, không ở cột này |
| Sân khấu | Preview luôn trắng theo preset, kể cả theme tối. Khung "bản in thử" của E: dấu cắt ở góc, thông số kỹ thuật chạy dọc mép (kích thước, tỉ lệ, tên phong cách; không có thời gian, vì thời gian đã ở thanh phát), dải xám bên cạnh; mặc định bật, tắt được trong Settings |
| Thanh phát | Lùi / phát / tới (biểu tượng, không chữ), thanh tua có sóng âm mờ của file âm thanh nếu có, thời gian kiểu nhạc tô màu nhấn khi đang phát |
| Inspector | Mục đánh số `01 Song`, `02 Look`, `03 Tracks`…; "More options" ở đầu mục (REQ-UI-13); mọi thanh trượt có ô số căn phải (REQ-UI-15); dòng Nâng cao có nhãn nhỏ `ADV` |
| Dòng track | Tay nắm kéo đổi thứ tự, ô màu, mắt (ẩn/hiện), `S` (solo), số nốt căn phải. **Không** có khoá ở Preview; khoá chỉ ở danh sách lớp của Editor |
| Phân vùng | Kẻ mảnh 1 px (`line`), không thẻ có bóng; bo góc nhỏ đồng nhất cho ô nhập và nút |
| Chữ | Một grotesk trung tính tự host cho mọi chữ; chữ số đều (tabular); nhãn mục cỡ lớn hơn chữ thường một bậc, không dùng chữ khổng lồ |
