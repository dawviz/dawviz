---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.4b. Đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11) **[ĐỀ XUẤT, chưa cam kết v1.0]**"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4b. Đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11) **[ĐỀ XUẤT, chưa cam kết v1.0]**"
chunk: 3-4b-de-xuat-widget-va-du-lieu-hien-thi-bo-sung.md
source_lines: 610-633
source_sha1: 0b10d2a1a5
ids: [D-32, D-40, OI-11, P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13, REQ-AST-01, REQ-GRAPHICS-05, REQ-GRAPHICS-06, SOI-18]
---
### 3.4b. Đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11) **[ĐỀ XUẤT, chưa cam kết v1.0]**

> **Cập nhật v1.1 (D-40):** toàn bộ P-01…P-13 thuộc **phạm vi bản 1.0**. Tiêu đề mục giữ nguyên để không làm hỏng liên kết. P-10 (marker), P-11 (lời) cần thêm `meta.markers[]`, `meta.lyrics[]` vào AST; P-13 cần đọc automation Ableton/DAWproject (SOI-18).

Dựa trên dữ liệu AST đã có (nốt, tick, kênh, tempo, dấu nhịp, `tempoSource`). Cột *Dữ liệu* cho biết có sẵn hay cần parser đọc thêm.

| # | Đề xuất | Hiển thị | Dữ liệu | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- |
| P-01 | **Piano Keyboard** | Bàn phím 88/61/49 phím, phím sáng theo nốt đang phát (màu theo track, hiện tên nốt tuỳ chọn) | Có sẵn (`pitch`, thời gian) | Cao: dễ hiểu, hợp Persona 2 |
| P-02 | **Tempo & Time Signature** | BPM và dấu nhịp hiện tại, đường cong tempo, hiệu ứng khi tempo/nhịp đổi | Có sẵn (`tempoMap`) | Cao: tận dụng ghi đè tempo và dấu nhịp |
| P-03 | **Bar & Beat Counter** | `Bar.Beat.%` hoặc `Bar.Beat.Sixteenth`, nhấp nháy theo beat, đếm theo dấu nhịp | Có sẵn | Cao (mở rộng Time & Bar Counter) |
| P-04 | **Key / Scale Detection** | Giọng và điệu thức đang chạy (ví dụ C minor), độ tin cậy; thuật toán dạng Krumhansl-Schmuckler theo cửa sổ trượt | Có sẵn (tính ở Analysis Worker, cùng phía với hợp âm) | Cao |
| P-05 | **Velocity / Dynamics** | Thanh mức vận tốc theo track hoặc tổng, biểu đồ phân bố vận tốc | Có sẵn | Trung bình |
| P-06 | **Note Density / Polyphony** | Bản đồ nhiệt mật độ nốt theo ô nhịp và track; số nốt đang vang | Có sẵn | Trung bình |
| P-07 | **Pitch-Class Wheel / Circle of Fifths** | Vòng 12 cao độ sáng theo nốt đang chơi, kèm hợp âm (liên kết Chord Detection) | Có sẵn | Trung bình |
| P-08 | **Arrangement Overview** | Bản đồ thu nhỏ các track theo thời gian, vạch phát | Có sẵn (nốt gom theo ô nhịp) | Trung bình |
| P-09 | **Drum Pad Grid** | Lưới pad cho track trống (GM, kênh 10), pad sáng theo nốt | Có sẵn (`channel`; nhãn GM) | Trung bình |
| P-10 | **Section / Marker Label** | Hiện tên đoạn (Intro, Verse, Drop...) từ marker/vùng | **Cần parser đọc thêm**: Reaper `MARKER`, Ableton Locators, marker MIDI | Thấp–trung bình |
| P-11 | **Lyrics / Text Cue** | Chữ chạy theo MIDI meta Lyric/Text | **Cần parser đọc thêm**: meta sự kiện 0x01/0x05 | Thấp |
| P-13 | **Automation Lane** | Đường âm lượng/pan/mute theo thời gian; nguồn của độ sáng track (REQ-GRAPHICS-06) | Reaper đã đọc (track-level, `track.automation`); **còn thiếu**: Ableton automation, envelope trong item, kiểm chiều pan/mute | Thấp–trung bình |
| P-12 | **Cách ghi tên nốt/hợp âm** | Thiết lập dùng chung cho mọi widget: `C D E`, `Do Re Mi`, `H` thay `B`, `ハニホ`, tên bậc | Cấu hình (liên quan REQ-I18N-08) | Cao: rẻ, tránh làm lại |

Nguyên tắc: mỗi widget mới chỉ phụ thuộc `t` và dữ liệu AST/phân tích tính trước (REQ-GRAPHICS-05), nên tất định cho Preview và Export. Nếu chốt P-10/P-11 thì thêm trường `meta.markers[]` / `meta.lyrics[]` vào AST (REQ-AST-01) và việc đọc vào từng parser.
