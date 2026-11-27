# Widget phân tích

Ngoài Piano Roll và các widget chữ, Editor có mười bốn widget cho biết điều gì đang xảy ra trong bài. Thêm bằng nút **Thêm** ở góc trên bên trái Timeline; chỉnh ở mục **Thiết lập** của widget.

| Widget | Cho thấy |
|---|---|
| **Tempo và nhịp** | BPM và dấu nhịp hiện tại, đường cong tempo cả bài, nền nháy khi tempo hoặc nhịp đổi. |
| **Ô nhịp và phách** | Vị trí dạng `002.2.50` (ô nhịp.phách.phần trăm) hoặc `002.2.3` (móc kép), kèm chấm theo phách. |
| **Giọng** | Giọng đang chạy (ví dụ "C major") và độ tin cậy, đoán từ các nốt trong vài giây gần nhất. |
| **Cường độ (velocity)** | Cột mức theo từng track (bật lên lúc nốt vang rồi tắt dần), hoặc biểu đồ phân bố velocity. |
| **Mật độ nốt** | Mỗi track một hàng, ô đậm hơn nơi nhiều nốt, kèm số nốt đang vang. |
| **Vòng cao độ** | 12 ô cho 12 nốt, ô của nốt đang vang sáng lên; hợp âm hiện ở giữa. Có thể xếp theo nửa cung hoặc vòng quãng năm. Xem [Vòng cao độ: tuỳ chọn thêm](#vòng-cao-độ-tuỳ-chọn-thêm). |
| **Tổng quan bản phối** | Bản đồ thu nhỏ các track theo thời gian, phần đã qua đậm hơn, có vạch phát. |
| **Pad trống** | Lưới pad cho track trống: pad sáng khi nốt chạm, ghi tên trống GM (Kick, Snare, HH Closed…). |
| **Tên đoạn** | Tên đoạn hiện tại (Intro, Verse…) và đoạn kế tiếp. |
| **Lời bài hát** | Dòng lời đang hát, âm tiết đã hát đậm hơn; dòng kế tiếp hiện nhỏ bên dưới. |
| **Automation** | Đường automation của một lane (âm lượng, pan, hoặc MIDI CC và pitch bend) theo thời gian, kèm giá trị hiện tại. |
| **Khung ô** | Khung có số thứ tự, tiêu đề và hàng số liệu nhỏ ở đáy, để ghép các widget khác thành một bảng. |
| **Bậc hợp âm** | Dải khối hợp âm theo bậc (I, V, vi…), khối đang chơi tô đậm. |
| **Lưới chấm** | Lưới chấm theo thời gian và cao độ; chấm nào có nốt thì sáng. |

## Khung ô, Bậc hợp âm, Lưới chấm

Ba widget này dùng để dựng bảng phân tích. Mẫu có sẵn: preset `analysis-dashboard-16x9`.

**Khung ô.** Chỉnh ở **Thiết lập**: **Số thứ tự**, **Tiêu đề**, **Màu số thứ tự**; bật ô tick ở tiêu đề nhóm **Khung** rồi chỉnh **Màu khung**, **Độ dày khung**, **Màu nền**, **Độ đục nền**. Hàng ở đáy có tới sáu cột (**Cột 1** đến **Cột 6**), mỗi cột có **Nhãn** và **Giá trị**; **Giá trị** dùng được [chỗ giữ](08-cho-giu.md), ví dụ `{bpm}`. Cột để trống cả hai ô thì không hiện.

**Bậc hợp âm.** Giọng lấy từ nốt chủ bạn đặt ở Editor; chưa đặt thì widget tự nhận giọng trong **Cửa sổ nhìn lại (giây)**. Chỉnh:

- **Số ô nhịp hiện** và **Vị trí vạch phát**.
- **Mỗi khối một hợp âm theo**: **Ô nhịp**, **Nửa ô nhịp**, **Phách** hoặc **Mỗi lần đổi**. Chọn theo ô nhịp thì khối gọn, nhạc nhiều nốt không bị vụn.
- **Cách viết bậc**: `VIm7` hoặc `vi7`.
- **Chữ trong khối**: **Đầu**, **Giữa** hoặc **Cuối** khối. Bật **Giữ chữ trong khung** thì khi khối trôi ra mép trái, chữ dừng ở mép trái và đi theo khối tới hết khối, như tên clip trong DAW. Chọn **Cuối** thì ô này ẩn, vì chữ đã luôn bám mép phải của khối.
- **Tên hợp âm nhỏ dưới bậc**: mỗi khối ở hàng chính có hai tầng, bậc to ở trên, tên hợp âm nhỏ ngay dưới (khi đã biết giọng và khối đủ cao).
- **Hàng thứ hai** và **Dải chức năng** là hai nhóm có ô tick ở tiêu đề; cùng với **Số ô nhịp**, chúng bật hoặc tắt từng phần. Dải chức năng tô màu theo **Màu chủ (T)**, **Màu hạ át (SD)**, **Màu át (D)**.
- **Màu hợp âm đang chơi**, **Màu chữ hợp âm đang chơi**, **Màu khối**, **Màu hàng thứ hai**, **Độ đục hợp âm đã qua**, **Khoảng cách giữa các khối**.

**Lưới chấm.** Mỗi cột là một bước của **Lưới** (1/4, 1/8, 1/16, 1/32), mỗi hàng là một cao độ. Chỉnh **Số cột**, **Dải cao độ** (**Vừa các nốt** hoặc **Tự đặt** với **Nốt thấp nhất (MIDI)** và **Nốt cao nhất (MIDI)**), **Số hàng tối đa** (dải rộng hơn thì nhiều nốt chung một hàng), **Hình chấm**, **Cỡ chấm**, **Màu nốt**, **Màu chấm trống**, **Màu chấm trống ở đáy**, **Độ đục chấm trống** và **Cỡ nốt tại vạch phát**. Thêm: **Cỡ chấm theo cường độ** (nốt mạnh chấm to hơn, nhỏ nhất tới **Cỡ chấm ở cường độ nhỏ nhất**), nhóm **Vạch phách** (vạch mảnh mỗi phách, đậm hơn mỗi bốn phách) và nhóm **Nhãn** (**Tên nốt C ở cột trái**, nằm ở cột riêng ngoài lưới chấm).

## Vòng cao độ: tuỳ chọn thêm

Trong **Thiết lập** của Vòng cao độ:

- **Nhãn**: **Tên nốt** hoặc **Bậc (I, V…)** theo giọng. **Cách viết bậc** đổi `VIm7` thành `vi7`.
- **Hình**: **Thanh** (như cũ) hoặc **Nút tròn**.
- **Nối các nốt đang vang**: vẽ hình nối các nốt đang vang; chỉnh **Màu hình nối** và **Độ đục phần tô**.
- **Vòng tiến độ**: **Tắt**, **Ô nhịp** hoặc **Cả bài**; chỉnh **Màu tiến độ** và **Độ dày tiến độ**.
- **Số phách quanh vòng**: hiện số phách, phách đang chơi tô màu tiến độ.
- **Màu vòng nốt bass**: khoanh nốt thấp nhất đang vang; để trống thì không khoanh.
- **Ở giữa hiện**: **Tên hợp âm** hoặc **Bậc hợp âm**.
- **Dòng dưới hợp âm**: chữ nhỏ dưới hợp âm, dùng được chỗ giữ, ví dụ `BAR {bar}`.
- **Phát sáng**: mục **Độ mạnh** làm các nút đang sáng toả sáng (0 là tắt); **Màu phát sáng** để trống thì dùng màu sáng. Hình nối và vòng tiến độ không phát sáng.

## Dữ liệu lấy từ đâu

- **Tên đoạn** lấy marker của dự án: Reaper (`MARKER` và vùng), Ableton (Locators), DAWproject (Markers), MIDI (Marker). Dự án không có marker thì widget dùng **Phase** bạn đặt ở Editor khi không chọn widget nào.
- **Lời bài hát** lấy từ MIDI (sự kiện Lyric, hoặc Text kiểu karaoke `.kar`). Dòng mới bắt đầu khi gặp `/` hoặc `\`, khi nghỉ quá lâu, hoặc khi dòng dài quá giới hạn. Dự án không có lời thì widget không hiện gì.
- **Automation** lấy từ envelope âm lượng và pan của Reaper, automation âm lượng và pan của track Ableton, và Points của DAWproject. FL Studio đọc được âm lượng và pan của kênh. File MIDI: mỗi Control Change (Mod Wheel, Expression, Sustain, Cutoff…) và Pitch Bend thành một lane riêng, tên như "Mod Wheel (CC1)" hay "Pitch Bend". Trong **Cài đặt** của widget, ô **Lane** liệt kê các lane có trong dự án theo tên; lane không có trong dự án vẫn giữ lại và ghi "không có trong dự án". Track không có lane đó thì widget không vẽ gì. Cùng các lane này dùng được ở mục **Theo nhạc** (nguồn "Lane: …") để điều khiển thuộc tính của mọi widget.
- **Pad trống** chỉ lấy track có nốt ở kênh MIDI 10 hoặc tên có "Drums"; đổi **Track dùng** thành "Mọi track đã chọn" để lấy cả track khác.
- **Hợp âm:** khi để **Track dùng** ở "Track đầu tiên có nốt giai điệu" (mặc định của widget Hợp âm), widget ưu tiên track có tên Piano, Keys/Keyboard hoặc Guitar; không có thì lấy track giai điệu đầu tiên. Muốn dùng track khác, chọn thủ công ở **Nâng cao**.
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
- Mức âm (`{level}`…) cần tệp âm thanh; không có âm thanh thì hiện "—".
- Chữ "major" và "minor" của widget Giọng là chữ bạn sửa được (mục Nâng cao), nên đổi thành "trưởng" và "thứ" tuỳ ý.
- Preview và video xuất ra giống hệt nhau: mọi widget này chỉ phụ thuộc thời điểm đang xem.

## Chuyển động cho mọi widget

Không riêng widget phân tích: **mọi widget** (Piano Roll, chữ, phổ, hạt, bản nhạc…) có mục **Chuyển động** khi bạn chọn nó ở Editor.

- **Hiệu ứng vào**: chạy ở đầu mỗi khoảng hiển thị của widget (là các thanh của widget trên Timeline, xem [Khoảng hiển thị](03-chinh-sua.md#khoảng-hiển-thị)); widget không giới hạn khoảng thì chạy ở đầu bài. Chọn một kiểu (mờ dần, trượt từ trái/phải/trên/dưới, bật to dần, phóng từ lớn, rơi xuống, xoay vào) và độ dài tính bằng giây.
- **Hiệu ứng ra**: chạy ngay trước cuối khoảng hiển thị, cùng các kiểu như trên.
- **Lặp theo nhịp**: thở, bồng bềnh, đung đưa, nảy theo nhịp, nhấp nháy, lắc. Chỉnh **Mạnh nhẹ** và **Lặp mỗi** (tính bằng phách hoặc giây). Tính bằng phách thì đổi tempo vẫn khớp nhịp.

Các chuyển động có thể dùng chung: ví dụ hiệu ứng vào "Trượt từ trái" và lặp "Nảy theo nhịp" cho cùng một widget. Chuyển động xoay và co giãn quanh **điểm neo** của widget. Preview và video xuất ra giống hệt nhau.

## Hoạt hình của từng nốt

Piano Roll còn có mục **Hoạt hình của nốt** trong **Thiết lập**: mỗi nốt đi qua bốn pha (đang tới, chạm, đang kêu, vừa tắt) với kiểu bạn chọn: bật to dần, mờ và co giãn, rơi và nảy, bay lên, biến hình (chấm thành thanh), nổ tung khi tắt, nảy khi chạm, gợn sóng khi chạm (một vòng tròn toả ra từ đầu nốt). Chọn **Không** thì nốt chỉ trôi như cũ. Muốn nốt rơi từ trên xuống, đặt **Góc chảy nốt** của Piano Roll (xem [Chỉnh sửa](03-chinh-sua.md#hình-thức-nốt)).

## Hoạt hình thuộc tính

Muốn một thuộc tính **đổi theo thời gian hoặc theo nhạc** thay vì đứng yên, dùng tầng keyframe của panel **Timeline và keyframe** ở đáy thẻ Chỉnh sửa: nhấp đúp thanh của widget trên Timeline, hoặc bấm **Keyframe** ở đầu bảng bên phải. Thuộc tính nào là số hoặc màu cũng animate được. Nhóm **Biến đổi** có **Vị trí** (X và Y chung một dòng, một keyframe cho cả hai), **Tỉ lệ** (phần trăm, 100 là nguyên cỡ; phóng to/thu nhỏ cả widget quanh điểm neo), **Xoay** và **Độ đục**. Các thuộc tính còn lại (mọi ô số hay ô màu trong **Thiết lập** của widget) được gom thành nhóm gấp được: widget có nhóm trong **Thiết lập** (ví dụ Bản nhạc: **Bản nhạc**, **Màu**, **Phóng to khi phát**, **Phát sáng**, **Quầng**…) dùng đúng các nhóm đó; widget khác gom theo loại: **Vạch phát**, **Bàn phím**, **Lưới**, **Nốt**, **Phát sáng**, **Màu**, **Khung**, **Thời gian**, **Hiệu ứng chữ**, **Chữ**, **Chung**. Preset cũ có animate Rộng/Cao thì hai dòng đó cũng hiện.

### Đặt keyframe

1. Chọn widget trên khung hoặc trên Timeline, rồi mở keyframe của nó (nhấp đúp thanh, hoặc bấm **Keyframe** bên phải). Timeline hiện các thuộc tính của nó.
2. Đưa vạch phát tới thời điểm muốn đặt: phát nhạc, hoặc nhấp/kéo trên thước thời gian của Timeline.
3. Bấm **đồng hồ** ở đầu dòng thuộc tính. Một keyframe được đặt tại vạch phát với giá trị hiện tại.
4. Đưa vạch phát tới thời điểm khác rồi gõ giá trị mới vào ô giá trị của dòng đó (hoặc kéo trên ô). Keyframe mới được thêm tại vạch phát. Nút hình thoi giữa hai nút tam giác cũng thêm keyframe tại vạch phát (bấm lại để xoá). Muốn đặt keyframe cho nhiều dòng cùng lúc, nhấn vào nút hình thoi của một dòng rồi kéo xuống (hoặc lên) qua các dòng khác; dòng đi qua được tô sáng, thả chuột là xong (một bước hoàn tác). Bắt đầu ở dòng đã có keyframe tại vạch phát thì kéo sẽ xoá; hai nút tam giác đưa vạch phát tới keyframe trước hoặc sau.

**Kéo trên khung:** khi Vị trí, Xoay (hoặc Rộng/Cao) đã bật đồng hồ, kéo, xoay hay đổi cỡ widget trên khung (hoặc gõ vào ô X, Y, W, H, Góc ở cột bên phải) sẽ đặt keyframe tại vạch phát thay vì dời widget cố định. Cách nhanh để làm chuyển động: đưa vạch phát tới một chỗ, kéo widget; đưa tới chỗ khác, kéo tiếp. Khung chọn trên khung luôn đi theo chỗ widget đang ở tại vạch phát, kể cả khi **Tỉ lệ** đang đổi (kéo khung lúc đó vẫn đổi đúng cỡ gốc).

**Bật/tắt và lựa chọn:** ô đánh dấu (vd. Hiện thời gian), ô chọn và chữ cũng có đồng hồ. Giá trị của chúng không chạy dần mà **đổi đúng tại keyframe** (giữ tới keyframe kế). Chúng không chạy theo nhạc và không có đường cong.

**Piano roll:** ngoài vị trí, xoay, tỉ lệ, độ đục, Piano roll animate được số giây trên khung, vị trí, độ dày, độ dài, phát sáng, màu và việc hiện vạch phát, góc chảy nốt, bàn phím (màu phím nhấn, độ đậm tô thang âm), lưới ô nhịp (độ đục, màu), và kiểu nốt chung (độ đục, bo góc, độ cao, phát sáng, màu).

**Sao chép và dán:** chọn keyframe rồi Ctrl+C; đưa vạch phát tới chỗ khác (hoặc chọn widget khác) rồi Ctrl+V. Keyframe sớm nhất rơi vào vạch phát, các keyframe khác giữ khoảng cách. Thuộc tính mà widget đích không có thì bị bỏ qua.

Bấm đồng hồ lần nữa để bỏ hoạt hình của thuộc tính đó (xoá mọi keyframe của nó). Nút phễu ở góc trên chỉ hiện những thuộc tính đang animate (phím U).

### Sửa keyframe trên Timeline

- **Chọn:** bấm vào hình thoi. Giữ Shift (hoặc Ctrl/⌘) để chọn thêm. Kéo trên chỗ trống của Timeline để chọn bằng khung. Ctrl+A chọn mọi keyframe của widget.
- **Dời:** kéo hình thoi sang trái hoặc phải; mọi keyframe đang chọn đi cùng. Keyframe tự bắt vào vạch phát, keyframe khác và các phách của bài; khi đang bắt dính có một vạch dẫn màu xanh. Giữ Alt khi kéo để đặt tự do. Alt+mũi tên trái/phải dời từng khung (thêm Shift: từng giây).
- **Thêm:** nhấp đúp vào dòng của thuộc tính tại thời điểm muốn đặt.
- **Xoá:** chọn (nhấp, Ctrl+nhấp hoặc kéo hộp trên chỗ trống) rồi nhấn Delete, hoặc dùng nút **Xoá keyframe** ở cột Thiết lập; số trong ngoặc là số hình thoi đang chọn.
- **Tua tới keyframe:** kéo trên thước thời gian, vạch phát tự bắt vào keyframe (chấm nhỏ trên thước); giữ Alt để tua tự do.
- **Xem gần hơn:** giữ Ctrl rồi cuộn chuột trên Timeline, hoặc dùng nút phóng to, thu nhỏ, **Vừa cả bài** ở góc trên.

Hình dạng keyframe cho biết cách giá trị đi tiếp tới keyframe sau: hình thoi là đều, hình vuông là giữ rồi nhảy, hình tròn là cong mượt. Keyframe đang chọn có màu nổi bật. Chấm nhỏ dưới keyframe nghĩa là keyframe gắn theo nhạc (phách, ô nhịp); kéo nó thì nó thành mốc theo giây.

### Chỉnh đường cong

Khi chọn keyframe, mục **Keyframe** hiện đầu tiên ở cột bên phải:

- **Thời điểm** và **Giá trị** (khi chọn một keyframe).
- **Đường cong đi tới keyframe**: đồ thị ngang là thời gian, dọc là giá trị. Kéo hai tay nắm tròn để chỉnh cách giá trị đi tới keyframe này (chậm rồi nhanh, vọt quá rồi về…). Bốn ô **x1, y1, x2, y2** bên dưới cho gõ số chính xác. Keyframe đầu tiên chưa có đoạn nào đi tới nên không chỉnh được đường cong.
- **Đường cong**: chọn nhanh một đường cong có sẵn (đều, bật vọt, nảy, lò xo…).
- **Giữa các keyframe**: đều, giữ rồi nhảy, hoặc cong mượt.
- **Sau keyframe cuối**: giữ nguyên, lặp lại, tới lui, hoặc lặp và cộng dồn.

Nút ↺ cạnh **Đường cong**, **Giữa các keyframe**, **Sau keyframe cuối** đưa ô đó về mặc định (đều, đều tới keyframe kế, giữ nguyên). **Bỏ chọn** (hoặc Esc trên Timeline) đóng mục **Keyframe**. Chọn hình thoi của Vị trí thì mục này có hai ô **Giá trị X** và **Giá trị Y**.

Chọn nhiều keyframe rồi đổi một ô thì mọi keyframe đang chọn đổi theo; ô nào các keyframe đang khác nhau sẽ ghi **Nhiều giá trị**. Màu chuyển mượt, không bị xỉn ở giữa.

### Đồ thị (Graph Editor)

Nút **Danh sách / Đồ thị** ở góc phải thanh tiêu đề Timeline đổi cách xem. **Đồ thị** vẽ đường cong của dòng đang chọn (Vị trí có hai đường: x nét liền, y nét đứt):

- **Giá trị**: trục dọc là giá trị theo thời gian. Kéo ô vuông để dời keyframe theo thời gian và đổi giá trị cùng lúc; giữ Shift khi kéo để chỉ đi một chiều. Keyframe tự bắt vào vạch phát, phách, keyframe khác, từng khung hình và số tròn; giữ Alt để đặt tự do. Chọn keyframe thì hiện tay cầm tròn của hai đoạn hai bên; kéo tay cầm để chỉnh đường cong của đoạn đó.
- **Tốc độ**: trục dọc là giá trị đổi nhanh tới đâu (mỗi giây). Kéo tay cầm sang ngang để đổi độ ảnh hưởng, lên xuống để đổi vận tốc.
- **Vào / Ra**: khi chọn một keyframe, hai cặp ô bên phải cho gõ **vận tốc** (đơn vị mỗi giây) và **độ ảnh hưởng** (%) của đoạn đi vào và đoạn đi ra. Đoạn đều có ảnh hưởng 0%: đặt ảnh hưởng trước thì tay cầm mới tách khỏi keyframe để kéo được.
- **Sao chép easing / Dán easing**: chép đường cong đi tới keyframe đang chọn, rồi dán vào các keyframe khác.
- **Thư viện easing**: chọn một đường cong có hình thu nhỏ để áp cho keyframe đang chọn. **Lưu đường cong này** thêm đường cong của keyframe đang chọn vào mục **Đã lưu** (nhớ trên máy này).

Cuộn chuột để đi ngang theo thời gian, Ctrl+cuộn để phóng to quanh con trỏ, nút **Vừa các đường cong** để xem lại toàn bộ. Delete, Ctrl+A, Esc dùng như ở Danh sách; mũi tên trái/phải trên keyframe dời một khung (thêm Shift: một giây), lên/xuống đổi giá trị. Thuộc tính màu không có đồ thị; dùng Danh sách. Đồ thị nhiều thuộc tính cùng lúc sẽ có ở bản 1.1.

### Chạy theo nhạc

Bấm tên một thuộc tính trên Timeline (không bấm keyframe), rồi ở mục **Keyframe** bên phải chọn **Theo nhạc**. Giá trị chạy theo một nguồn dữ liệu của bài: phách, ô nhịp, tiến độ bài, số nốt đang vang, nốt mạnh nhất đang vang, nốt vừa chạm (vọt lên rồi tắt dần), automation âm lượng hoặc pan của track, độ to của âm thanh. Bạn đặt khoảng nguồn chạy từ đâu tới đâu và giá trị tương ứng, ví dụ độ phát sáng từ 0 tới 1 khi nốt vừa chạm. Trên Timeline, thuộc tính đó hiện một thanh **Theo nhạc** thay cho keyframe. **Bỏ hoạt hình** đưa thuộc tính về giá trị đứng yên.

Giá trị luôn được giữ trong miền hợp lệ của thuộc tính: kéo quá giới hạn thì dừng ở giới hạn chứ không làm hỏng hình. Hai thuộc tính khác nhau chạy độc lập, và Preview giống hệt video xuất ra. Bản nhạc chỉ nhận vị trí, cỡ, góc, tỉ lệ và độ đục (đổi thuộc tính bản nhạc phải viết lại bản nhạc).

### Biểu thức

Ở mục **Keyframe**, chọn **Biểu thức** rồi gõ một công thức tính giá trị theo thời gian và theo nhạc, giống expression của After Effects. Ví dụ:

- Độ đục thở theo phách: `0.5 + 0.5 * sin(beat.phase * TAU)`
- Vị trí x trôi dần và rung khi có nốt mạnh: `value + t * 20 + wiggle(6, note.velocity / 20)`
- Màu theo cao độ: `mix(#4aa8f5, #ff6b9d, smoothstep(48, 72, note.pitch))`
- Hiện/ẩn mỗi ô nhịp lẻ: `bar.index % 2 == 1`

Dữ liệu đọc được: `t` (giây), `beat.phase`, `bar.phase`, `beat.index`, `bar.index`, `bar.bpm`, `time.progress`, `notes.count`, `note.velocity`, `note.pitch`, `note.hit`, `note.active`, `track.volume`, `track.pan`, `audio.level`, `value` (giá trị đang đặt của thuộc tính), `width`, `height`. Hàm: toán (`sin`, `clamp`, `mix`, `smoothstep`, `map`, `linear`…), `ease(x, "easeOutCubic")`, `random()`, `noise(x)`, `wiggle(tần_số, biên_độ)`, `oscillate(tần_số, biên_độ, "sine")`, màu (`rgb`, `hsl`, `oklch`, `lighten`, `darken`), vec2. Biến riêng: `let a = …;` ở đầu.

Gõ sai thì ô viền đỏ và ghi lỗi gì, ở ký tự nào; biểu thức chỉ được lưu khi đúng (Enter hoặc rời ô). Ngẫu nhiên luôn giống nhau mỗi lần phát, nên Preview giống hệt video xuất ra. Nếu biểu thức cho ra số không dùng được (ví dụ chia cho 0), thuộc tính dùng giá trị đang đặt. Lựa chọn và chữ không dùng được biểu thức.
