---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "1. Khung preview: hướng \"Bản in\" 🟡 đã chốt hướng, chưa làm (D-51)"
path: "1. Khung preview: hướng \"Bản in\" 🟡 đã chốt hướng, chưa làm (D-51)"
chunk: 1-khung-preview-huong-ban-in-da-chot-huong-chua.md
source_lines: 19-55
source_sha1: eb55f9ce9a
ids: [D-51, REQ-GRAPHICS-00, REQ-GRAPHICS-04, REQ-GRAPHICS-07, REQ-GRAPHICS-10, REQ-GRAPHICS-16, REQ-WIDGET-01, REQ-WIDGET-02, REQ-WIDGET-03, REQ-WIDGET-04, REQ-WIDGET-05, REQ-WIDGET-06, REQ-WIDGET-08]
---
## 1. Khung preview: hướng "Bản in" 🟡 đã chốt hướng, chưa làm (D-51)

### 1.1 Tham chiếu
Ảnh tham chiếu: khung 1:1 (1080×1080) nền trắng của kênh Usagin, bài "The Last Dice". Chỉ lấy **ngôn ngữ trình bày** (bố cục, cách dùng màu, kiểu chữ); không dùng tên kênh, tên bài hay logo của họ trong preset mặc định. Tên preset: **"Bản in" / "Paper"**.

Tinh thần: giống một trang bản nhạc in, không phải màn hình game. Nền trắng, nốt là những thanh xám phẳng không phát sáng, **một màu nhấn duy nhất là vạch phát đỏ mảnh**, mọi thông tin phụ là chữ xám nhỏ đặt ở bốn góc. Khoảng trắng lớn là chủ ý.

### 1.2 Phân rã thành widget
Toạ độ ước lượng từ ảnh tham chiếu, đơn vị pt trên khung 1080×1080 (REQ-GRAPHICS-00). Đây là giá trị khởi đầu cho preset, sẽ chỉnh bằng mắt khi dựng.

| Thành phần trên ảnh | Widget | Yêu cầu | Giá trị khởi đầu | Còn thiếu so với SRS / mã hiện có |
| :--- | :--- | :--- | :--- | :--- |
| Nền trắng | Canvas | REQ-GRAPHICS-00 | `#FFFFFF` | Không |
| Nốt đã phát xám đậm, nốt sắp tới xám nhạt, không glow | Piano Roll | REQ-WIDGET-01, REQ-GRAPHICS-07 | x 80, y 150, w 690, h 770; nốt đã phát `#383838`, sắp tới `#C4C4C4`, cao ≈ 11 pt, bo 1 pt, glow 0; không bàn phím | **Màu theo trạng thái nốt** (đã phát / đang phát / sắp tới) là ba màu riêng. Hiện chỉ có `opacity` và `inactiveOpacity` (hai mức độ đục cùng một màu). Cần thêm vào `NoteStyle` hoặc dùng template nốt bốn pha (REQ-GRAPHICS-10). |
| Nốt sắp tới chỉ hiện một đoạn ngắn trước vạch | Piano Roll | REQ-WIDGET-01 | `playheadPositionRatio` ≈ 0,84; `lookaheadSeconds` 1 | Không; làm được bằng khung widget hẹp hơn khung hình. |
| Vạch phát đỏ mảnh | Piano Roll | REQ-GRAPHICS-16 | `#E06666`, 1,5 pt, không glow, vẽ trên nốt | Không |
| "The Last Dice" + "Usagin" | Track Info | REQ-WIDGET-02 | tiêu đề 72 pt, nghệ sĩ 28 pt, đen, căn trái tại (75, 40) | Widget chưa có renderer (⚪); Render Core chưa có primitive chữ (TECHNICAL-DESIGN 5.1). |
| "Num played notes: 1271/1917 (66.30%)" và dòng events | Event Counter | REQ-WIDGET-03 | xám `#777`, 22 pt, căn phải tại x 1008 | **Mẫu nhãn tự sửa** (`Num played notes: {played}/{total} ({pct})`, 2 chữ số thập phân). SRS mới có bật/tắt trường. |
| "Note: E3 (Vel: 82) Note: E4 … < Track 1" | Live Note Trigger | REQ-WIDGET-04 | xám `#888`, 15 pt, một dòng, căn phải | **Kiểu một dòng ngang** và hậu tố tên track. SRS mô tả danh sách dọc. |
| "time 001 35 083" / "beat 037 06 093" + hai vạch nhỏ | Time & Bar Counter | REQ-WIDGET-05 | 18 pt, nhãn chú thích 11 pt phía trên-phải, góc dưới trái | **Định dạng chia nhóm có số 0 đứng đầu** và **thanh nhỏ tiến độ trong beat/bar**. SRS mới có `mm:ss.sss` và `1.1.000`. |
| "E7/G#" + "Notes: G#2 E3 D4 E4 G#4 B4" | Chord Detection | REQ-WIDGET-06 | tên hợp âm 34 pt đen, danh sách nốt 17 pt, căn phải góc dưới | **Luôn hiện danh sách nốt kèm tên hợp âm**. SRS chỉ hiện danh sách nốt khi không nhận diện được. |
| Thanh xám dưới cùng + "1:35 / 2:34" nhỏ | Progress Bar | REQ-WIDGET-08 | y 1048, cao 12 pt, phần đã qua `#CCCCCC`, không vẽ nền rãnh; chữ 7 pt `#BBB` | Không (SRS đã có màu nền/tiến độ và thời gian). |
| Phông chữ | Mọi widget chữ | REQ-WIDGET-02, TECHNICAL-DESIGN 5.5 | Tiêu đề và hợp âm: grotesk hình học (Space Grotesk, OFL); chữ phụ: grotesk trung tính | Phông phải tự host và `FontFace.load()` xong trước khung đầu (5.5). |

### 1.3 Biến thể tỉ lệ khung
Preset "Bản in" cần cả 16:9 và 9:16 (REQ-GRAPHICS-04). Nguyên tắc giữ khi đổi tỉ lệ: thông tin phụ luôn bám bốn góc, vùng nốt chiếm khoảng 65% bề rộng ở 16:9 và giữ khoảng trắng phía sau vạch phát. Chưa có ảnh tham chiếu cho hai tỉ lệ này; có thể sinh thử bằng prompt ở mục 3.5.

### 1.4 Thứ tự làm đề xuất
1. Primitive chữ trong `drawPrimitives` (kèm nạp phông) vì 5/6 widget còn lại cần nó.
2. Màu nốt theo trạng thái (đã phát / đang phát / sắp tới).
3. Track Info, Event Counter, Chord Detection, Progress Bar, Time & Bar Counter, Live Note Trigger.
4. Preset "Bản in" 1:1, rồi 16:9 và 9:16.

Các mục "Còn thiếu" ở bảng 1.2 cần đưa vào SRS (REQ-WIDGET-03…06, REQ-GRAPHICS-07) khi bắt đầu làm; chưa sửa SRS trong phiên bản này.

---
