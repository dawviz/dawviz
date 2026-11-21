# Widget phân tích

Ngoài Piano Roll và các widget chữ, Editor có mười một widget cho biết điều gì đang xảy ra trong bài. Thêm bằng nút **Thêm** ở đầu danh sách Lớp; chỉnh ở mục **Thiết lập** của widget.

| Widget | Cho thấy |
|---|---|
| **Tempo và nhịp** | BPM và dấu nhịp hiện tại, đường cong tempo cả bài, nền nháy khi tempo hoặc nhịp đổi. |
| **Ô nhịp và phách** | Vị trí dạng `002.2.50` (ô nhịp.phách.phần trăm) hoặc `002.2.3` (móc kép), kèm chấm theo phách. |
| **Giọng** | Giọng đang chạy (ví dụ "C major") và độ tin cậy, đoán từ các nốt trong vài giây gần nhất. |
| **Cường độ (velocity)** | Cột mức theo từng track (bật lên lúc nốt vang rồi tắt dần), hoặc biểu đồ phân bố velocity. |
| **Mật độ nốt** | Mỗi track một hàng, ô đậm hơn nơi nhiều nốt, kèm số nốt đang vang. |
| **Vòng cao độ** | 12 ô cho 12 nốt, ô của nốt đang vang sáng lên; hợp âm hiện ở giữa. Có thể xếp theo nửa cung hoặc vòng quãng năm. |
| **Tổng quan bản phối** | Bản đồ thu nhỏ các track theo thời gian, phần đã qua đậm hơn, có vạch phát. |
| **Pad trống** | Lưới pad cho track trống: pad sáng khi nốt chạm, ghi tên trống GM (Kick, Snare, HH Closed…). |
| **Tên đoạn** | Tên đoạn hiện tại (Intro, Verse…) và đoạn kế tiếp. |
| **Lời bài hát** | Dòng lời đang hát, âm tiết đã hát đậm hơn; dòng kế tiếp hiện nhỏ bên dưới. |
| **Automation** | Đường âm lượng hoặc pan của track theo thời gian, kèm giá trị hiện tại. |

## Dữ liệu lấy từ đâu

- **Tên đoạn** lấy marker của dự án: Reaper (`MARKER` và vùng), Ableton (Locators), DAWproject (Markers), MIDI (Marker). Dự án không có marker thì widget dùng **Phase** bạn đặt ở Editor khi không chọn widget nào.
- **Lời bài hát** lấy từ MIDI (sự kiện Lyric, hoặc Text kiểu karaoke `.kar`). Dòng mới bắt đầu khi gặp `/` hoặc `\`, khi nghỉ quá lâu, hoặc khi dòng dài quá giới hạn. Dự án không có lời thì widget không hiện gì.
- **Automation** lấy từ envelope âm lượng và pan của Reaper, automation âm lượng và pan của track Ableton, và Points của DAWproject. FL Studio đọc được âm lượng và pan của kênh. Track không có automation thì widget không vẽ gì.
- **Pad trống** chỉ lấy track có nốt ở kênh MIDI 10 hoặc tên có "Drums"; đổi **Track dùng** thành "Mọi track đã chọn" để lấy cả track khác.
- Các widget đọc nốt (Giọng, Cường độ, Mật độ, Vòng cao độ, Tổng quan, Pad trống, Automation) có mục chọn track ở **Nâng cao**.

## Cách ghi tên nốt

Khi không chọn widget nào, mục **Cách ghi tên nốt** đổi tên nốt và hợp âm cho mọi widget cùng lúc:

- **Hệ ghi**: chữ cái (C D E), solfège (Do Re Mi) hoặc kiểu Đức (H thay B, Cis, Es).
- **Nốt đen**: ghi bằng dấu thăng (C♯) hoặc dấu giáng (D♭).
- **Ghi # và b thay cho ♯ và ♭**: bật nếu phông bạn dùng không có hai ký tự đó.
- **Đô giữa**: C4 (chuẩn) hoặc C3 (kiểu Yamaha).

Để trống ở "Mặc định" thì giữ cách ghi như trước.

## Mẹo

- Chữ trong các widget này là mẫu có chỗ giữ, như ở [Chèn số liệu vào chữ](08-cho-giu.md). Ví dụ Giọng dùng `{key}`, `{scale}`, `{confidence}`; Tên đoạn dùng `{section}`, `{next}`, `{next_in}`, `{section_no}`, `{section_elapsed}`; Mật độ nốt dùng `{poly}`.
- Chữ "major" và "minor" của widget Giọng là chữ bạn sửa được (mục Nâng cao), nên đổi thành "trưởng" và "thứ" tuỳ ý.
- Preview và video xuất ra giống hệt nhau: mọi widget này chỉ phụ thuộc thời điểm đang xem.
