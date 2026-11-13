---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "5. Theme giao diện chỉ đổi màu (D-52)"
path: "5. Theme giao diện chỉ đổi màu (D-52)"
chunk: 5-theme-giao-dien-chi-doi-mau-d-52.md
source_lines: 303-370
source_sha1: eb55f9ce9a
ids: [D-52, D-53, NFR-SEC-05, REQ-GRAPHICS-02, REQ-UI-10, REQ-UI-13, REQ-UI-15]
---
## 5. Theme giao diện chỉ đổi màu (D-52)

### 5.1 Quyết định
Theme của **ứng dụng** (REQ-UI-10, theme cộng đồng ở 1.1) chỉ đổi **màu**, qua một bộ token cố định. Không đổi cỡ chữ, phông, khoảng cách, bo góc, bố cục hay từng component, và không nhận CSS tuỳ ý. Lý do:

- **An toàn:** CSS tuỳ ý ẩn hoặc giả được nút (che nút xuất thật, làm mờ cảnh báo), đi ngược NFR-SEC-05…07.
- **Tương phản:** mỗi theme được kiểm WCAG AA tự động trước khi áp.
- **Bền:** cập nhật giao diện không làm hỏng theme của người dùng; hướng dẫn và ảnh chụp tài liệu chỉ cần một bố cục.

**Phân biệt tên:** "Giao diện ứng dụng" (theme app, mục này) khác "Phong cách video" (preset `theme` của CUSTOMIZATION.md mục 6, ví dụ "Bản in"). Cột Presets ở thẻ Preview chỉ chứa phong cách video; theme app chọn ở Settings và nút sáng/tối trên thanh trên.

### 5.2 Bộ token (đề xuất, chốt khi làm)
Mỗi theme khai báo đủ token cho **cả sáng và tối**; thiếu token nào thì lấy của theme mặc định.

| Nhóm | Token |
| :--- | :--- |
| Nền và bề mặt | `bg`, `surface`, `surface-raised`, `line`, `line-strong` |
| Chữ | `text`, `text-muted`, `text-faint` |
| Nhấn | `accent`, `accent-text` (chữ trên nền nhấn), `focus`, `selection` |
| Trạng thái | `danger`, `warning`, `success` |
| Thanh phát và timeline | `scrub-played`, `scrub-rest`, `waveform`, `guide` (đường gióng, mặc định `#FF5500` theo REQ-GRAPHICS-02) |

Kiểm khi nạp theme: đúng schema (chỉ các token trên, giá trị là màu); `text`/`bg`, `text-muted`/`surface`, `accent-text`/`accent` đạt AA; `accent` khác đủ xa `danger` để nút xuất không bị đọc như cảnh báo. Không đạt thì từ chối kèm lý do, không áp một phần.

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
| Cột trái | "Video styles" (phong cách video, không gọi là theme); về sau có ảnh thu nhỏ (mục 6) |
| Sân khấu | Preview luôn trắng theo preset, kể cả theme tối. Khung "bản in thử" của E: dấu cắt ở góc, thông số kỹ thuật chạy dọc mép (kích thước, fps, thời điểm, tên phong cách), dải xám bên cạnh; mặc định bật, tắt được trong Settings |
| Thanh phát | Lùi / phát / tới (biểu tượng, không chữ), thanh tua có sóng âm mờ của file âm thanh nếu có, thời gian kiểu nhạc tô màu nhấn khi đang phát |
| Inspector | Mục đánh số `01 Song`, `02 Look`, `03 Tracks`…; "More options" ở đầu mục (REQ-UI-13); mọi thanh trượt có ô số căn phải (REQ-UI-15); dòng Nâng cao có nhãn nhỏ `ADV` |
| Dòng track | Tay nắm kéo đổi thứ tự, ô màu, mắt (ẩn/hiện), `S` (solo), số nốt căn phải. **Không** có khoá ở Preview; khoá chỉ ở danh sách lớp của Editor |
| Phân vùng | Kẻ mảnh 1 px (`line`), không thẻ có bóng; bo góc nhỏ đồng nhất cho ô nhập và nút |
| Chữ | Một grotesk trung tính tự host cho mọi chữ; chữ số đều (tabular); nhãn mục cỡ lớn hơn chữ thường một bậc, không dùng chữ khổng lồ |

### 5.4 Bảng màu dựng sẵn (giá trị khởi đầu)
Nền, bề mặt, kẻ và chữ **dùng chung** cho mọi bảng; mỗi bảng chỉ đổi nhóm nhấn. Giá trị là điểm khởi đầu: phải chạy kiểm tương phản AA (5.2) khi làm T-48 và chỉnh nếu trượt.

| Token | Sáng | Tối |
| :--- | :--- | :--- |
| `bg` | `#EDECE8` | `#151617` |
| `surface` | `#F6F5F2` | `#1E1F21` |
| `surface-raised` | `#FFFFFF` | `#26282B` |
| `line` | `#D6D4CE` | `#33363A` |
| `line-strong` | `#1C1C1A` | `#E6E6E3` |
| `text` | `#1C1C1A` | `#E6E6E3` |
| `text-muted` | `#5E5C57` | `#A3A3A0` |
| `text-faint` | `#8D8A84` | `#6E6F70` |

| Bảng màu | `accent` sáng (`accent-text` trắng) | `accent` tối (`accent-text` = `bg` tối) |
| :--- | :--- | :--- |
| Studio cam (mặc định) | `#C2410C` | `#FF6A2B` |
| Bản in đỏ | `#C8261E` | `#FF5A4F` |
| Đồng | `#8C6A35` | `#C9A467` |
| Riso hồng | `#C2307E` | `#FF5CB8` |

`danger` phải khác rõ `accent`: với bảng đỏ, `danger` dùng đỏ thẫm hơn kèm biểu tượng cảnh báo, để nút xuất không bị đọc như lỗi.
