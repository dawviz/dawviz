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

## Chuyển động cho mọi widget

Không riêng widget phân tích: **mọi widget** (Piano Roll, chữ, phổ, hạt, bản nhạc…) có mục **Chuyển động** khi bạn chọn nó ở Editor.

- **Hiệu ứng vào**: chạy ở đầu mỗi khoảng hiển thị của widget (xem **Khoảng hiển thị**); widget không giới hạn khoảng thì chạy ở đầu bài. Chọn một kiểu (mờ dần, trượt từ trái/phải/trên/dưới, bật to dần, phóng từ lớn, rơi xuống, xoay vào) và độ dài tính bằng giây.
- **Hiệu ứng ra**: chạy ngay trước cuối khoảng hiển thị, cùng các kiểu như trên.
- **Lặp theo nhịp**: thở, bồng bềnh, đung đưa, nảy theo nhịp, nhấp nháy, lắc. Chỉnh **Mạnh nhẹ** và **Lặp mỗi** (tính bằng phách hoặc giây). Tính bằng phách thì đổi tempo vẫn khớp nhịp.

Các chuyển động có thể dùng chung: ví dụ hiệu ứng vào "Trượt từ trái" và lặp "Nảy theo nhịp" cho cùng một widget. Chuyển động xoay và co giãn quanh **điểm neo** của widget. Preview và video xuất ra giống hệt nhau.

## Hoạt hình của từng nốt

Piano Roll còn có mục **Hoạt hình của nốt** trong **Thiết lập**: mỗi nốt đi qua bốn pha (đang tới, chạm, đang kêu, vừa tắt) với kiểu bạn chọn: bật to dần, mờ và co giãn, rơi và nảy, bay lên, biến hình (chấm thành thanh), nổ tung khi tắt, nảy khi chạm. Chọn **Không** thì nốt chỉ trôi như cũ. Muốn nốt rơi từ trên xuống hoặc bay lên, xoay cả widget Piano Roll.

## Hoạt hình thuộc tính

Muốn một thuộc tính **đổi theo thời gian hoặc theo nhạc** thay vì đứng yên, dùng panel **Timeline và keyframe** ở đáy thẻ Chỉnh sửa (mở bằng nút ở đầu thanh, hoặc Ctrl+J). Thuộc tính nào là số hoặc màu cũng animate được: vị trí, cỡ, góc xoay, độ đục cả widget (nhóm **Biến đổi**), và mọi ô số hay ô màu trong **Thiết lập** của widget (nhóm **Thuộc tính widget**, ví dụ màu cột, độ dày vạch, độ phát sáng).

### Đặt keyframe

1. Chọn widget trên khung hoặc ở Lớp. Timeline hiện các thuộc tính của nó.
2. Đưa vạch phát tới thời điểm muốn đặt: phát nhạc, hoặc nhấp/kéo trên thước thời gian của Timeline.
3. Bấm **đồng hồ** ở đầu dòng thuộc tính. Một keyframe được đặt tại vạch phát với giá trị hiện tại.
4. Đưa vạch phát tới thời điểm khác rồi gõ giá trị mới vào ô giá trị của dòng đó (hoặc kéo trên ô). Keyframe mới được thêm tại vạch phát. Nút hình thoi giữa hai nút tam giác cũng thêm keyframe tại vạch phát (bấm lại để xoá); hai nút tam giác đưa vạch phát tới keyframe trước hoặc sau.

Bấm đồng hồ lần nữa để bỏ hoạt hình của thuộc tính đó (xoá mọi keyframe của nó). Nút phễu ở góc trên chỉ hiện những thuộc tính đang animate (phím U).

### Sửa keyframe trên Timeline

- **Chọn:** bấm vào hình thoi. Giữ Shift (hoặc Ctrl/⌘) để chọn thêm. Kéo trên chỗ trống của Timeline để chọn bằng khung. Ctrl+A chọn mọi keyframe của widget.
- **Dời:** kéo hình thoi sang trái hoặc phải; mọi keyframe đang chọn đi cùng. Keyframe tự bắt vào vạch phát, keyframe khác và các phách của bài; giữ Alt khi kéo để đặt tự do. Alt+mũi tên trái/phải dời từng khung (thêm Shift: từng giây).
- **Thêm:** nhấp đúp vào dòng của thuộc tính tại thời điểm muốn đặt.
- **Xoá:** chọn rồi nhấn Delete.
- **Xem gần hơn:** giữ Ctrl rồi cuộn chuột trên Timeline, hoặc dùng nút phóng to, thu nhỏ, **Vừa cả bài** ở góc trên.

Hình dạng keyframe cho biết cách giá trị đi tiếp tới keyframe sau: hình thoi là đều, hình vuông là giữ rồi nhảy, hình tròn là cong mượt. Keyframe đang chọn có màu nổi bật. Chấm nhỏ dưới keyframe nghĩa là keyframe gắn theo nhạc (phách, ô nhịp); kéo nó thì nó thành mốc theo giây.

### Chỉnh đường cong

Khi chọn keyframe, mục **Keyframe** hiện đầu tiên ở cột bên phải:

- **Thời điểm** và **Giá trị** (khi chọn một keyframe).
- **Đường cong đi tới keyframe**: đồ thị ngang là thời gian, dọc là giá trị. Kéo hai tay nắm tròn để chỉnh cách giá trị đi tới keyframe này (chậm rồi nhanh, vọt quá rồi về…). Bốn ô **x1, y1, x2, y2** bên dưới cho gõ số chính xác. Keyframe đầu tiên chưa có đoạn nào đi tới nên không chỉnh được đường cong.
- **Đường cong**: chọn nhanh một đường cong có sẵn (đều, bật vọt, nảy, lò xo…).
- **Giữa các keyframe**: đều, giữ rồi nhảy, hoặc cong mượt.
- **Sau keyframe cuối**: giữ nguyên, lặp lại, tới lui, hoặc lặp và cộng dồn.

Chọn nhiều keyframe rồi đổi một ô thì mọi keyframe đang chọn đổi theo; ô nào các keyframe đang khác nhau sẽ ghi **Nhiều giá trị**. Màu chuyển mượt, không bị xỉn ở giữa.

### Chạy theo nhạc

Bấm tên một thuộc tính trên Timeline (không bấm keyframe), rồi ở mục **Keyframe** bên phải chọn **Theo nhạc**. Giá trị chạy theo một nguồn dữ liệu của bài: phách, ô nhịp, tiến độ bài, số nốt đang vang, nốt mạnh nhất đang vang, nốt vừa chạm (vọt lên rồi tắt dần), automation âm lượng hoặc pan của track, độ to của âm thanh. Bạn đặt khoảng nguồn chạy từ đâu tới đâu và giá trị tương ứng, ví dụ độ phát sáng từ 0 tới 1 khi nốt vừa chạm. Trên Timeline, thuộc tính đó hiện một thanh **Theo nhạc** thay cho keyframe. **Bỏ hoạt hình** đưa thuộc tính về giá trị đứng yên.

Giá trị luôn được giữ trong miền hợp lệ của thuộc tính: kéo quá giới hạn thì dừng ở giới hạn chứ không làm hỏng hình. Hai thuộc tính khác nhau chạy độc lập, và Preview giống hệt video xuất ra. Piano Roll và Bản nhạc chỉ nhận vị trí, cỡ, góc và độ đục (đổi thuộc tính bản nhạc phải viết lại bản nhạc).
