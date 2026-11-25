# Thẻ Chỉnh sửa

[Mục lục](README.md) · [English](en/03-editor.md)

Thẻ Chỉnh sửa dùng để sắp xếp các khối trên khung video, đổi hình thức nốt và chữ. Mỗi khối (gọi là widget) làm một việc: piano roll, tên bài và nghệ sĩ, bộ đếm nốt, nốt đang phát, thời gian và ô nhịp, hợp âm, thanh tiến độ.

Màn hình có ba phần: khung video ở giữa, **Thuộc tính widget** bên phải (cao hết màn hình), và panel **Timeline và keyframe** ở dưới khung. Timeline chứa luôn danh sách lớp: mỗi lớp là một hàng, mỗi lúc lớp xuất hiện là một thanh, như timeline của Premiere Pro hay After Effects.

## Đổi cỡ và thu gọn panel

- **Đổi cỡ:** kéo đường ranh giữa hai panel (con trỏ đổi thành mũi tên hai đầu). Nhấp đúp vào đường ranh để về cỡ mặc định. Cũng có thể bấm Tab tới đường ranh rồi dùng phím mũi tên (Shift: bước lớn hơn).
- **Thu gọn:** bấm nút panel ở góc trên của Thuộc tính widget, hoặc nút ở đầu thanh **Timeline và keyframe**. Panel thu gọn còn một dải mỏng; bấm dải đó để mở lại. Phím tắt: Ctrl+Alt+B (Thuộc tính widget), Ctrl+J (Timeline).
- **Timeline cao hay thấp tuỳ ý:** kéo đường ranh phía trên Timeline lên hoặc xuống; kéo được tới khi khung video còn một dải nhỏ.
- **Gấp mục:** bấm tiêu đề một mục (ví dụ **Vị trí và kích thước**) để gấp lại khi không dùng tới, bấm lần nữa để mở. Cột bên phải ngắn đi rất nhiều. Ứng dụng nhớ mục nào đang gấp, cả ở thẻ Xem trước.
- Cỡ và trạng thái các panel được nhớ trong trình duyệt này. Màn hình hẹp hơn 1024 điểm thì các panel xếp dọc như cũ.

## Chọn widget

- Bấm vào widget trên khung, bấm tên nó ở cột lớp của Timeline, hoặc bấm thanh của nó trên Timeline.
- Giữ Shift (hoặc Ctrl/⌘) khi bấm để chọn thêm widget khác.
- Bấm giữ trên tên một lớp rồi kéo lên hoặc xuống để chọn cả dãy lớp đi qua. Giữ Shift khi bắt đầu kéo để cộng thêm vào những lớp đang chọn.
- Ctrl+A (⌘A trên Mac) chọn mọi lớp.
- Kéo chuột trên chỗ trống của khung để vẽ một khung chọn: mọi widget chạm khung đó đều được chọn. Giữ Shift để cộng thêm vào những widget đang chọn.
- **Bỏ chọn:** bấm **Bỏ chọn** ở đầu bảng bên phải (khi đang chọn), bấm Esc, bấm vào vùng nền xung quanh khung, hoặc bấm chỗ trống trên Timeline. Cách này dùng được cả khi một widget phủ kín khung, lúc bấm lên khung không bỏ chọn được.

## Thêm, nhân bản, xoá

- **Thêm:** bấm **Thêm** ở góc trên bên trái Timeline rồi chọn loại widget. Widget mới nằm giữa khung, trên cùng các lớp, và được chọn sẵn.
- **Nhân bản:** nút nhân bản ở mục **Sắp xếp**, hoặc Ctrl+D (⌘D trên Mac). Bản sao dời xuống một chút để bạn thấy nó.
- **Xoá:** nút thùng rác, hoặc phím Delete. Widget đang khoá không xoá được.

Cả ba việc đều hoàn tác được bằng Ctrl+Z.

## Tỉ lệ khung

Bộ chọn **9:16 · 1:1 · 16:9** nằm phía trên khung, cùng bộ chọn với thẻ Xem trước. Đổi tỉ lệ thì mọi khối co giãn theo; sau đó chỉnh lại vị trí ở đây. Là một bước Hoàn tác.

Ở Nâng cao, khi không chọn widget nào, mục **Cỡ khung** cho nhập **Rộng** và **Cao** tuỳ ý (256–4096 điểm). Dùng cho các cỡ khác như 4:5 hay 21:9; lúc đó không ô nào trong bộ chọn được đánh dấu.

## Di chuyển, đổi cỡ, xoay

- **Di chuyển:** kéo widget. Hoặc dùng phím mũi tên để dịch 1 điểm, Shift + mũi tên để dịch 10 điểm.
- **Đổi cỡ:** kéo các ô vuông ở góc và cạnh. Giữ Alt để đổi cỡ đều quanh tâm.
- **Xoay:** kéo ô tròn phía trên khung chọn. Góc tự nhảy theo bước 15°; giữ Shift để xoay tự do. Nhấp đúp ô tròn để về 0°.
- **Gõ số chính xác:** ở mục **Vị trí và kích thước**, ô X, Y là toạ độ góc trên bên trái, W và H là chiều rộng, chiều cao. Đơn vị là điểm trên khung thiết kế (khung 1080 điểm rộng thì 540 là chính giữa), không phụ thuộc cỡ màn hình hay độ phân giải video.

Khi chọn nhiều widget, bạn di chuyển và xoay cả nhóm cùng lúc; ô **Xoay cả nhóm thêm** xoay nhóm quanh tâm của nó.

Nếu widget bị kéo ra hẳn ngoài khung, ứng dụng báo **Ngoài khung** vì nó sẽ không có trong video. Bấm **Đưa vào khung** để kéo nó về.

## Căn chỉnh

Mục **Căn chỉnh** có sáu nút: căn mép trái, giữa, phải và mép trên, giữa, dưới.

- Chọn một widget: căn theo khung video, ví dụ đưa widget vào chính giữa khung.
- Chọn nhiều widget: căn theo nhau, ví dụ cho mọi widget thẳng mép trái.
- Chọn từ ba widget trở lên: có thêm hai nút **chia đều** để khoảng trống giữa các widget bằng nhau, theo chiều ngang hoặc chiều dọc. Hai widget ngoài cùng đứng yên.

Widget xoay được căn theo khung bao quanh nó. Widget đang khoá đứng yên.

## Hạt (Particles)

Widget **Hạt** phát ra các hạt nhỏ mỗi khi có nốt. Hạt chỉ phụ thuộc vào thời điểm đang xem, nên tua tới đâu cũng thấy đúng như chạy từ đầu, và xuất video cho đúng cùng hình.

- **Số hạt mỗi nốt**, **Tuổi thọ**, **Tốc độ**, **Hướng bay** (0° là lên trên, tăng theo chiều kim đồng hồ), **Độ toả** (độ rộng quạt bay), **Trọng lực** (dương là rơi xuống, âm là bay lên), **Cỡ lúc đầu** và **Cỡ lúc cuối**.
- **Màu:** theo màu của track phát nốt, hoặc **Một màu**.
- Ở Nâng cao: nốt mạnh sinh nhiều hạt hơn, độ biến thiên tốc độ, hình tròn hay vuông, độ đục, mờ dần, phát sáng, **Vị trí xuất phát** (**Tại nốt, chỗ chạm vạch phát**: hạt bay ra từ đúng chỗ nốt chạm vạch phát của Piano Roll, như tia lửa; theo cao độ trải trên bề rộng widget; giữa; hoặc rải đều. Với "Tại nốt", khung widget Hạt được ẩn trên khung hình (chọn lớp từ cột lớp của Timeline), và hạt không bị cắt theo khung widget: chúng bay trong toàn khung video; không có Piano Roll thì không có hạt) và độ cao xuất phát, **Hạt giống ngẫu nhiên** (đổi để có kiểu rải khác), **Số hạt tối đa cùng lúc** (quá số này thì bỏ hạt cũ nhất).
- Chọn track cho widget ở mục **Track** của **Thiết lập** như các widget khác.

**Ví dụ: tia lửa bay lên từ nốt chạm vạch phát.** Thêm widget Hạt, rồi đặt:

| Thiết lập | Giá trị |
|---|---|
| Vị trí xuất phát | Tại nốt, chỗ chạm vạch phát |
| Số hạt mỗi nốt | 8 |
| Tuổi thọ | 1,8 |
| Tốc độ | 200 |
| Hướng bay | 0 (lên trên) |
| Độ toả | 70 |
| Trọng lực | −140 (âm để hạt tiếp tục bay lên) |
| Cỡ lúc đầu / Cỡ lúc cuối | 8 / 0 (nhỏ dần rồi tắt) |
| Màu | Một màu, chọn cam (ví dụ `#ff7a1a`) |
| Phát sáng (Nâng cao) | 0,9 |
| Độ biến thiên tốc độ (Nâng cao) | 0,6 |

Muốn tàn lửa chậm và nhiều hơn: tăng Số hạt và Tuổi thọ, giảm Tốc độ. Muốn tia lửa nhanh: tăng Tốc độ, giảm Tuổi thọ. Trên nền sáng như phong cách Paper, nhớ chọn màu đậm vì mặc định của "Một màu" là trắng. Các bộ hạt dựng sẵn (lửa, khói, sương, tuyết…) sẽ có ở bản sau để bạn khỏi phải tự đặt thông số.

## Bản nhạc

Widget **Bản nhạc** viết nốt của dự án thành bản nhạc khuông đôi; nốt đang phát sáng và phóng to. Cách dùng và mọi thiết lập: [Bản nhạc](09-ban-nhac.md).

## Ảnh nền

Mục **Ảnh nền** đã bỏ khỏi bảng Thuộc tính: muốn có ảnh phía sau, thêm widget **Ảnh** (nút **Thêm**) rồi kéo xuống dưới cùng trong cột lớp của Timeline. Phiên cũ đã có ảnh nền vẫn hiển thị như trước.

## Ảnh

Widget **Ảnh** (thêm từ **Thêm** ở góc trên bên trái Timeline) vẽ một ảnh của bạn lên khung, ví dụ logo hay hình nhân vật. Ở mục **Thiết lập**, bấm **Chọn tệp ảnh…** để thêm PNG, JPEG, WebP, GIF (lấy khung đầu) hoặc SVG; ảnh đã thêm hiện trong ô **Ảnh** để dùng lại cho widget khác. **Cách khớp**: **Vừa khung** (thấy trọn ảnh), **Phủ kín** (cắt phần thừa) hoặc **Kéo giãn**.

Mỗi tệp tối đa 20 MB, ảnh tối đa 8192 px ở cạnh dài, cả phiên tối đa 200 MB. Ứng dụng nhận ra loại tệp từ nội dung chứ không từ đuôi. SVG có script, trình xử lý sự kiện hoặc liên kết ra ngoài bị từ chối. Cùng một tệp thêm hai lần chỉ được giữ một bản.

**Sprite sheet** (Nâng cao): ảnh gồm nhiều khung xếp theo lưới. Đặt **Số cột sprite**, **Số hàng sprite**, **Số khung dùng** và **Khung mỗi giây**; widget chạy lần lượt các khung (đọc theo hàng) từ lúc widget bắt đầu hiện, **Lặp lại** hoặc dừng ở khung cuối. Tắt **Làm mượt khi phóng** cho ảnh pixel art.

## Phổ tần (Spectrum)

Widget **Phổ tần** vẽ các cột nhảy theo âm thanh. Cần nạp âm thanh ở thẻ Xem trước (sau khi nạp, ứng dụng mất vài giây để phân tích; trong lúc đó và khi chưa có âm thanh, các cột nằm ở độ cao thấp nhất để bạn vẫn thấy chỗ đặt). Phổ đi theo **Offset âm thanh** của dự án.

**Kiểu** chọn cách vẽ: **Cột** (mặc định), **Vùng** (tô phần dưới đường phổ), **Đường**, **Chấm**, **Dao động ký** (dạng sóng tức thời trong **Khoảng thời gian** vài chục mili giây), **Sóng âm cả bài** (toàn bài, phần đã phát đổi sang **Màu phần đã phát / giữ đỉnh**, có vạch phát) và **Đồng hồ đỉnh/RMS** (hai thanh mức âm, vạch giữ đỉnh khoảng 1,5 giây). Với Cột và Chấm, bật **Chấm đỉnh rơi chậm** để mỗi cột có một chấm ở mức cao nhất vừa qua rồi rơi dần (**Tốc độ rơi** ở Nâng cao). Ở Nâng cao, **Thang tần số** chọn Log, Tuyến tính hoặc Mel.

Có hai hình dạng, chọn ở **Hình dạng** trong mục **Thiết lập**:

- **Thẳng:** các cột xếp dọc theo một đường, tần số thấp ở đầu đường. **Góc** xoay đường theo mọi góc từ -360° đến 360° (0° là nằm ngang, tăng theo chiều kim đồng hồ; 90° là đứng, tần số thấp ở trên). **Chiều dài đường** và **Độ cao cột** là kích thước của hình; cả hình luôn nằm giữa khung widget.
- **Tròn:** các cột toả ra quanh tâm khung. **Bán kính vòng** là bán kính vòng trong, **Độ cao cột** là độ dài tối đa của cột. **Góc bắt đầu** (Nâng cao) xoay vị trí cột đầu tiên, tính từ đỉnh theo chiều kim đồng hồ.

Chung cho cả hai: **Số cột** (8 đến 256), **Màu**. Ở Nâng cao còn có:

- **Đối xứng:** hình thẳng thì cột mọc về hai phía của đường; hình tròn thì hai nửa vòng đối xứng trái phải.
- **Đảo chiều tần số**, **Chuyển màu theo tần số** (từ **Màu** sang **Màu tần số cao**), bề rộng cột, độ bo tròn, **Độ cao khi lặng**.
- **Tần số thấp nhất/cao nhất** (thang log): chỉ lấy một dải tần.
- **Bám lên** và **Rơi xuống** (mili giây): cột lên nhanh và rơi chậm cho mượt. Đặt 0 thì cột nhảy tức thì.
- **Mức sàn** và **Mức trần** (dB): âm nhỏ hơn sàn thì cột thấp nhất, lớn hơn trần thì cột cao nhất. Nhạc yên tĩnh thì nâng sàn lên hoặc hạ trần xuống để cột nhảy rõ hơn.
- **Độ đục** và **Phát sáng**.

Muốn một hình khác góc, kéo tay nắm xoay cả widget cũng được; **Góc** ở đây xoay đường mà không xoay khung.

## Nốt chủ

Khi không chọn widget nào, mục **Nốt chủ** cho bạn chọn nốt chủ của bài (C đến B). Có nốt chủ thì số liệu `{bass}` hiện **bậc** của nốt bass (1, ♭2, 2, … 7); chưa đặt thì hiện tên nốt.

## Chuyển động

Chọn widget rồi mở mục **Chuyển động** để cho nó hiệu ứng vào, hiệu ứng ra và một chuyển động lặp theo nhịp. Dùng được cho mọi loại widget. Chi tiết ở [Widget phân tích](10-phan-tich.md#chuyển-động-cho-mọi-widget).

## Timeline và keyframe

Panel **Timeline và keyframe** dưới khung có hai tầng. Thanh tiêu đề cho biết bạn đang ở đâu, ví dụ **Timeline chính › Mở đầu › Keyframe · Hợp âm**; bấm một mục trong đó để quay lên.

### Tầng 1: timeline lớp

Bên trái là cột lớp, bên phải là thước thời gian và các thanh. Mỗi thanh là một khoảng thời gian lớp đó hiện trong video. Lớp hiện suốt bài có một thanh dài hết bài.

- **Dời thanh:** kéo giữa thanh. Mọi lớp đang chọn cùng dời. Keyframe của lớp đi theo thanh, nên chuyển động vẫn bắt đầu đúng lúc lớp xuất hiện.
- **Cắt mép:** kéo mép đầu hoặc mép cuối thanh. Keyframe đứng yên. Kéo mép cuối tới hết bài thì lớp hiện tới hết bài. Đang chọn nhiều lớp thì mép cùng phía của mọi lớp đang chọn dời theo cùng một khoảng.
- **Hiện dần / ẩn dần:** kéo ô vuông nhỏ ở góc trên đầu hoặc cuối thanh (hiện khi rê chuột hoặc khi lớp đang chọn).
- **Tên thanh dính mép:** khi cuộn hoặc phóng to Timeline mà đầu thanh đã ra khỏi màn hình, tên lớp vẫn hiện ở mép trái vùng nhìn cho tới hết thanh.
- **Bắt dính:** khi kéo, thanh bám vào vạch phát, mép các thanh khác, phase, chỗ đổi hợp âm (khi làn Nhạc đang mở) và phách của bài. Khi cắt mép, thanh còn bám vào **độ dài** của thanh khác: nhãn "= Tiến độ (0:12)" nghĩa là lúc đó hai lớp dài bằng nhau. Giữ Alt để tắt.
- **Làn Nhạc:** bấm **Nhạc** dưới làn Phase để hiện làn hợp âm và một làn nốt cho mỗi track, giúp căn thanh theo nhạc. Làn này chỉ để xem nhạc; thứ duy nhất đổi được ở đây là ổ khoá của từng track.
- **Tách lớp tại vạch phát:** đặt vạch phát lên thanh, chọn lớp rồi bấm Ctrl+K (hoặc nút kéo cắt ở góc trên bên trái). Lớp thành hai lớp nối nhau: lớp gốc giữ phần trước, bản sao (nằm ngay trên) giữ phần sau. Mỗi lớp có keyframe riêng và chỉnh độc lập.
- **Đưa thanh tới vạch phát:** `[` đưa đầu thanh tới vạch phát, `]` đưa cuối thanh tới vạch phát (cả thanh dời theo). Alt+`[` và Alt+`]` cắt đầu hoặc cuối thanh tại vạch phát.
- **Dời từng chút:** Alt+← / Alt+→ dời 1/30 giây, thêm Shift để dời 1 giây.
- **Thu phóng:** Ctrl+cuộn (hoặc các nút kính lúp) thu phóng theo chiều ngang; Alt+cuộn (hoặc hai nút có vạch ngang) cho hàng cao hơn hoặc thấp hơn. Cuộn thường để đi lên xuống hoặc sang ngang.
- **Kéo thước** để tua. Vạch phát bám vào mép thanh và phase; giữ Alt để tắt.
- **Xem keyframe của một lớp:** nhấp đúp vào thanh, bấm nút ◆ ở dòng của lớp, chọn lớp rồi nhấn Enter, hoặc bấm **Keyframe** ở đầu bảng bên phải. Bấm Esc để quay về timeline lớp.

Hàng **Tất cả lớp** ở cuối cột lớp ẩn/hiện hoặc khoá/mở khoá mọi lớp cùng lúc.

### Tầng 2: keyframe

Tầng này cho thấy các thuộc tính của lớp đang chọn theo thời gian: bên trái là danh sách thuộc tính, bên phải là thước thời gian và các keyframe hình thoi. Nhóm **Biến đổi** có Vị trí, Tỉ lệ, Xoay, Độ đục. Bấm đồng hồ ở một thuộc tính để bắt đầu animate; khi đã bật, kéo widget trên khung sẽ đặt keyframe tại vạch phát. Kéo keyframe để đổi thời điểm, chọn keyframe để chỉnh đường cong ở mục **Keyframe** bên phải. Nút **Danh sách / Đồ thị** ở góc phải thanh tiêu đề panel đổi sang **Đồ thị** để xem và chỉnh đường cong giá trị, tốc độ của dòng đang chọn. Chi tiết ở [Widget phân tích](10-phan-tich.md#hoạt-hình-thuộc-tính).

Keyframe đặt theo giây đi theo thanh khi bạn dời thanh. Keyframe đặt theo nhịp (ô nhịp, phách) gắn với nhạc nên đứng yên.

### Precomp

Precomp gom nhiều lớp thành một lớp, như precomp của After Effects. Dùng khi muốn cả một nhóm lớp xuất hiện, dời, mờ hay chuyển động cùng nhau, ví dụ cả phần mở đầu.

- **Tạo:** chọn các lớp rồi bấm Ctrl+G (hoặc nút hai khung chồng ở góc trên bên trái Timeline). Các lớp vào một precomp mới, ở đúng chỗ cũ trên khung và trên timeline. Thanh của precomp trùm từ thanh sớm nhất tới thanh muộn nhất của nhóm.
- **Mở:** nhấp đúp vào thanh precomp, bấm nút › ở dòng của nó, hoặc bấm **Mở precomp** ở bảng bên phải. Khung video chỉ hiện nội dung của precomp; phần thời gian precomp không hiện bị làm mờ trên Timeline. Bấm Esc (khi không chọn gì) hoặc bấm **Timeline chính** ở thanh tiêu đề để quay ra.
- **Bên trong precomp** bạn làm mọi việc như ở timeline chính: thêm, kéo, keyframe, tách lớp, thậm chí gom tiếp thành precomp con. Precomp lồng nhau được tối đa 4 cấp.
- **Lớp precomp** có vị trí, xoay, tỉ lệ, độ đục, chuyển động, khoảng hiển thị và keyframe như mọi lớp; mọi thứ bên trong làm theo. Lớp precomp luôn đúng cỡ khung: muốn phóng to hay thu nhỏ thì dùng **Tỉ lệ** ở tầng keyframe.
- **Dời thanh precomp** dời cả nội dung bên trong. Cắt mép thanh precomp chỉ cắt lúc nó hiện.
- **Đổi tên:** nhấp đúp tên lớp precomp như mọi lớp.
- **Nhân bản** một lớp precomp (Ctrl+D) tạo một bản **độc lập**: ứng dụng sao chép cả precomp (và các precomp bên trong), đặt tên mới ("Precomp 1" → "Precomp 2"). Sửa bản này không đổi bản kia. Một dự án có tối đa 32 precomp; vượt thì ứng dụng báo và không nhân bản.
- **Tốc độ:** ô **Tốc độ** (%) ở bảng bên phải khi chọn lớp precomp. 200% chạy nội dung nhanh gấp đôi, 50% chậm một nửa. Chỉ keyframe và lúc hiện của các lớp bên trong bị co giãn; nốt, nhịp và hợp âm vẫn theo bài.
- **Gỡ precomp:** chọn lớp precomp rồi bấm **Gỡ precomp** ở bảng bên phải (hoặc Ctrl+Shift+G). Các lớp bên trong về lại timeline đang mở, đúng chỗ trên khung và đúng lúc hiện. Keyframe, chuyển động, tỉ lệ và hiện dần/ẩn dần của chính lớp precomp không chuyển sang được; khi lớp precomp có những thứ này, ứng dụng hỏi xác nhận trước (bấm **Vẫn gỡ** để làm, **Huỷ** hoặc Esc để thôi; vẫn hoàn tác được bằng Ctrl+Z) và không báo thêm sau đó. Không có thì gỡ ngay, không hỏi.
- Tổng số lớp khi mở hết các precomp tối đa là 512. Vượt quá thì ứng dụng báo và không làm.
- Ở thẻ Xem trước, khi vạch phát nằm trong một precomp, bấm một ô **Phong cách video** sẽ áp phong cách đó vào precomp ấy, không thay cả video. Nếu Piano Roll nằm trong precomp, phần chỉnh màu theo track ở thẻ Xem trước chỉnh Piano Roll của precomp đang hiện ở vạch phát. Xem [Xem trước](02-xem-truoc.md).

## Cách ghi tên nốt

Cũng khi không chọn widget nào, mục **Cách ghi tên nốt** đổi tên nốt và hợp âm ở mọi widget cùng lúc (chữ cái, Do Re Mi, kiểu Đức; dấu thăng hay giáng; C4 hay C3). Chi tiết ở [Widget phân tích](10-phan-tich.md#cách-ghi-tên-nốt).

## Khoảng hiển thị

Mặc định widget hiện suốt bài. Lúc widget xuất hiện là các thanh của nó trên Timeline, nên chỉnh ngay ở đó (bảng bên phải không còn mục riêng cho việc này):

- **Đổi lúc hiện:** kéo giữa thanh để dời, kéo mép đầu hoặc mép cuối để cắt. Kéo mép cuối tới hết bài thì widget hiện tới hết bài.
- **Hiện ở nhiều đoạn:** tách thanh bằng Ctrl+K tại vạch phát rồi cắt bớt từng phần, hoặc nhân bản lớp (Ctrl+D) rồi dời bản sao.
- **Hiện dần / ẩn dần:** kéo ô vuông nhỏ ở góc trên đầu thanh sang phải (hiện dần) hoặc ở góc trên cuối thanh sang trái (ẩn dần). Thanh có đường chéo cho biết độ dài lúc mờ. Thời gian mờ áp cho mọi thanh của lớp, tối đa 30 giây và không dài hơn thanh ngắn nhất.

Khoảng hiển thị chỉ ảnh hưởng video và Xem trước; trong Editor bạn vẫn chọn và kéo widget như bình thường.

## Phase

Phase là các đoạn của bài (verse, chorus…). Phase nằm ở làn **Phase** trên cùng của Timeline lớp. Phase kéo dài tới phase kế; phase cuối kéo dài tới hết bài.

- **Thêm:** bấm + ở đầu làn **Phase** để thêm phase tại vạch phát, hoặc nhấp đúp chỗ trống trên làn. Gõ tên rồi nhấn Enter.
- **Dời:** kéo mốc phase (bám vào vạch phát, phách và mép thanh; giữ Alt để tắt), hoặc bấm vào mốc rồi Alt+← / Alt+→ (thêm Shift để dời 1 giây).
- **Đổi tên:** nhấp đúp vào mốc.
- **Xoá:** bấm vào mốc rồi nhấn Delete.
- **Từ marker:** nếu dự án có marker, nút tải xuống ở đầu làn **Phase** tạo phase từ marker (mỗi marker một phase cùng tên). Nếu đã có phase, nút này thay hết chúng.
- **Khoá track:** ở làn **Nhạc**, mỗi track có ổ khoá. Track khoá không đổi được ẩn/hiện, solo, màu, thứ tự và độ sáng (kể cả ở bảng Track) cho tới khi mở khoá. Khoá chỉ có trong phiên làm việc, không lưu vào preset.
- Khi kéo thanh lớp, thanh bám vào phase, nên dễ cho một lớp hiện đúng đoạn chorus.

Các số liệu `{phase}`, `{next_phase}`, `{phase_remaining}`… dùng được trong mọi ô chữ (xem [Chỗ giữ](08-cho-giu.md)).

## Điểm neo (Nâng cao)

Điểm neo là điểm widget xoay quanh. Mặc định là tâm.

- Kéo vòng tròn nhỏ ở giữa widget để dời điểm neo. Dời điểm neo không làm widget dịch đi.
- Hoặc chọn một trong chín điểm ở ô **Điểm neo**, hoặc gõ **Neo X**, **Neo Y** theo phần trăm.
- Nút ↺ đưa điểm neo về tâm.

Ở chế độ Cơ bản, widget luôn xoay quanh tâm.

## Bắt dính

Khi kéo, widget tự bám vào mép khung, vào tâm khung và vào các widget khác. Đường gióng màu hiện ra khi đang bám. Mục **Bắt dính** ở cột phải có:

- **Đường gióng và khoảng cách đều:** bám theo widget khác và giữ khoảng cách đều giữa chúng.
- **Bắt theo lưới:** bám theo ô lưới 8 hoặc 16 điểm.

Muốn tạm tắt bắt dính: giữ Alt khi kéo để di chuyển, giữ Ctrl (⌘ trên Mac) khi đổi cỡ.

## Lớp

Cột lớp ở bên trái Timeline cho biết widget nào nằm trên widget nào: dòng trên cùng được vẽ trên cùng.

- **Đổi thứ tự:** kéo tay nắm sáu chấm (chỉ kéo tay nắm mới đổi thứ tự, kéo chỗ khác trên dòng thì không), hoặc chọn dòng rồi bấm Alt+Lên / Alt+Xuống. Ở mục **Sắp xếp** bên phải còn có bốn nút: đưa lên trên cùng, lên một bậc, xuống một bậc, xuống dưới cùng (phím tắt Ctrl+] và Ctrl+[, thêm Shift để đưa hẳn lên trên cùng hoặc xuống dưới cùng).
- **Widget cha:** ô **Widget cha** ở mục **Sắp xếp** gắn widget này vào một widget khác. Khi cha dời, xoay, đổi tỉ lệ hay mờ đi (bằng keyframe hoặc chuyển động), widget con làm theo đúng phần thay đổi đó; con vẫn đứng nguyên chỗ của nó khi cha đứng yên. Không chọn được widget đang là con của chính nó. Xoá cha thì con thôi có cha. Lưu ý: khi cha đang lệch khỏi chỗ ban đầu, khung chọn của con trên khung chưa đi theo cha.
- **Đổi tên:** bấm đúp vào tên lớp (hoặc chọn lớp rồi nhấn F2), gõ tên mới, nhấn Enter. Esc để bỏ. Để trống rồi Enter thì lớp quay về tên theo loại (ví dụ Hợp âm 2). Tên tối đa 60 ký tự và không được trùng với lớp khác (hoa/thường coi như nhau). Nếu trùng, tên cũ được giữ nguyên và ứng dụng báo lý do. Tên lớp chỉ để bạn dễ tìm, không hiện trong video; được lưu trong preset. Bản nhân bản không mang tên của bản gốc.
- **◆:** mở keyframe của lớp. Hình thoi tô kín khi lớp đã có keyframe. Lớp precomp có nút › để mở precomp.
- **Mắt:** ẩn hoặc hiện widget trong video (giống ô **Hiện trong video**).
- **Ổ khoá:** khoá widget để không lỡ tay đổi nó. Lớp đã khoá không kéo, xoay, đổi cỡ, nhân bản, xoá hay chỉnh thuộc tính được, và các ô tương ứng ở bảng bên phải bị mờ (gồm cả **Hiện trong video** và mục **Bắt dính** khi mọi lớp đang chọn đều đã khoá). Lớp khoá vẫn chọn được để xem số liệu hoặc mở khoá bằng ô **Khoá trên khung**.
- **Ẩn hoặc khoá nhanh:** bấm giữ một mắt (hoặc ổ khoá) rồi kéo lên/xuống qua các lớp khác; mọi lớp đi qua được đặt cùng trạng thái với lần bấm đầu. Cả lần kéo ẩn/hiện là một bước hoàn tác.

## Thiết lập

Widget chữ có mục **Thiết lập** cho những gì riêng của nó:

- **Tên bài và nghệ sĩ:** gõ tên bài, tên nghệ sĩ. Để trống thì lấy từ dự án.
- **Bộ đếm nốt:** bật hoặc tắt từng dòng (số nốt đã phát, tổng số nốt, tiến độ, tempo). Nâng cao: sửa chữ của từng dòng, số chữ số thập phân, khoảng cách dòng.
- **Nốt đang phát:** mỗi nốt một dòng hoặc tất cả trên một dòng, số dòng tối đa, hiện tên track. Nâng cao: sửa chữ, thời gian mờ dần sau khi nhả nốt.
- **Thời gian và ô nhịp:** bật hoặc tắt từng hàng, kiểu hiện số (nhóm số hay đồng hồ, ô nhịp.phách.tick), vạch tiến độ dưới số. Nâng cao: nhãn, số chữ số của từng nhóm (phút, giây, mili giây; ô nhịp, phách, tick), khoảng cách hàng, độ dài, độ dày và màu vạch.
- **Hợp âm:** đọc hợp âm theo nốt đang giữ hay khi dập, luôn hiện danh sách nốt, khi không nhận ra hợp âm thì hiện chữ "không hợp âm" hay hiện các nốt.
- **Thanh tiến độ:** ngang hoặc dọc, độ dày, màu, hiện thời gian. Nâng cao: nền thanh, bo góc, chữ thời gian.
- **Ô chữ:** gõ nội dung nhiều dòng, xen số liệu như `{bpm}` hay `{title}`; chọn track mà số liệu đọc. Xem [Chèn số liệu vào chữ](08-cho-giu.md).
  - **Hiệu ứng chữ:** bật ô này để chữ xuất hiện (hoặc biến mất) dần theo **Ký tự**, **Từ** hay **Dòng**. **Hiệu ứng**: **Gõ chữ** (từng ký tự bật ra), **Hiện dần**, **Trồi lên**, **Bật ra**, hoặc **Tuỳ chỉnh** (tự đặt độ đục, lệch x/y, tỉ lệ và màu ban đầu). **Thứ tự**: đầu tới cuối, cuối về đầu, từ giữa ra hoặc ngẫu nhiên (lần nào phát cũng giống nhau). **Bắt đầu** tính bằng giây từ lúc widget bắt đầu hiện (đầu khoảng hiển thị, hoặc đầu bài); **Thời lượng** là thời gian mỗi phần đi hết hiệu ứng; **Lệch giữa các phần** là khoảng cách giữa hai phần liên tiếp. **Số đếm lên** cho mọi số trong chữ chạy từ 0 tới giá trị thật (vd. `{bpm}`).

Mọi thiết lập trong mục này đều có nút ↺ khi khác giá trị gốc (kể cả ô tick, nhóm nút, màu, ô chữ và mục **Track**), và Alt+nhấp (Option+nhấp trên Mac) vào nhãn để khôi phục nhanh.

Khi sửa chữ của một dòng, những chỗ trong ngoặc nhọn như `{played}` hay `{bpm}` sẽ được thay bằng số thật, dùng được ở mọi chữ. Bấm `{bpm}` hoặc `{title}` dưới ô để chèn ngay, hoặc gõ `{` để xem gợi ý tên, hoặc rê chuột lên ô chữ. Danh sách đầy đủ và cách chọn kiểu hiện số ở trang [Chèn số liệu vào chữ](08-cho-giu.md). Gõ xong bấm Enter, hoặc bấm ra ngoài ô; bấm Esc để bỏ.

## Chữ

Chọn một widget có chữ (tên bài, bộ đếm nốt, nốt đang phát, thời gian, hợp âm, thanh tiến độ, ô chữ) để thấy mục **Chữ**.

Mỗi chữ dùng một **kiểu chữ** có sẵn (Tiêu đề, Phụ đề, Số đếm, Đồng hồ…). Bạn đổi gì thì chỉ thứ đó khác kiểu, phần còn lại vẫn theo kiểu. Cạnh mỗi thứ đã đổi có nút ↺ để quay về giá trị của kiểu.

- **Dòng chữ:** widget có nhiều chữ thì chọn chữ cần sửa ở đây, ví dụ Tên bài hay Nghệ sĩ. Một số mục là một phần của dòng, ví dụ **Con số trong dòng** của bộ đếm nốt hay **Nốt bass sau dấu /** của hợp âm: đổi ở đó thì chỉ phần ấy khác, phần còn lại của dòng giữ nguyên. Chữ đang có chỉnh sửa được đánh dấu • trong danh sách.
- **Kiểu chữ**, **Phông**, **Cỡ**, **Màu**, **Độ đậm** (Mảnh, Thường, Đậm), **Nghiêng**. Cuối danh sách **Phông** có **Nạp tệp phông…** để dùng phông của bạn (WOFF2, WOFF, TTF, OTF, tối đa 20 MB); phông này đi theo phiên, gói dự án và video xuất. Hãy chỉ dùng phông bạn có quyền dùng.
- **Căn lề:** trái, giữa hoặc phải trong khung widget.

Ở chế độ Nâng cao (hoặc bấm **Thêm tuỳ chọn**):

- **Dáng chữ:** viết hoa hết, viết thường hết, hoa đầu mỗi từ, chữ hoa nhỏ; giãn chữ; bề ngang và chiều cao của chữ; nâng chữ lên hoặc hạ xuống; chỉ số trên/dưới; gạch chân, gạch ngang; độ đục; **Chữ số đều bề rộng** (các con số chiếm cùng một chỗ nên không xô chữ bên cạnh khi số đổi; số đếm và đồng hồ bật sẵn).
- **Tô màu:** bật **Chuyển màu** để tô chữ bằng hai màu, chuyển thẳng theo một góc hoặc toả tròn.
- **Viền chữ:** độ dày, màu, viền nằm giữa nét hay bên ngoài, viền trên hay dưới phần tô.
- **Bóng:** màu, độ đục, khoảng cách, hướng, độ nhoè. Khoảng cách 0 cho chữ một quầng sáng đều quanh nét.
- **Nền:** hộp màu sau chữ, có đệm và bo góc, giúp chữ dễ đọc trên nền nhiều chi tiết.
- **Khi chữ quá dài:** cắt và thêm "…", thu nhỏ cho vừa (không nhỏ hơn **Cỡ nhỏ nhất**), hoặc để tràn. Bật **Xuống dòng** để chữ dài chia thành nhiều dòng, với số dòng tối đa và khoảng cách dòng.
- **Kiểu chữ:**
  - **Lưu thành kiểu mới…** lưu cách trình bày hiện tại thành một kiểu có tên, dùng lại được cho chữ khác.
  - **Cập nhật kiểu** đưa các chỉnh sửa của chữ này vào kiểu nó đang dùng. Mọi chữ khác dùng kiểu đó đổi theo.
  - **Bỏ mọi chỉnh** đưa chữ về đúng kiểu.

Kiểu chữ được lưu trong preset.

## Hình thức nốt

Chọn widget Piano roll (hoặc bấm **Chỉnh hình thức nốt** khi chưa chọn gì) để đổi cách vẽ nốt:

- **Bộ dựng sẵn:** Neon, Thanh bo tròn, Phẳng, Chỉ viền. Chọn một bộ rồi chỉnh tiếp nếu muốn.
- **Màu:** theo màu track, một màu tuỳ chọn, theo cao độ, hoặc theo cường độ đánh.
- **Độ đục**, **Độ dày nốt**, **Bo góc**, **Độ dày viền** (Nâng cao), **Độ đục khi chờ** (Nâng cao: độ đục của nốt chưa tới hoặc đã qua).
- **Dải cao độ:** **Vừa nội dung** lấy theo nốt thấp nhất và cao nhất của các track (nên một track ít nốt sẽ được phóng to); **Tuỳ chọn** (mặc định, A0–C8, đủ 88 phím) cho gõ nốt thấp nhất và cao nhất theo tên nốt như `C2`, `C#3`, `Db4`. Nốt nằm ngoài khoảng bị cắt. Tệp preset lưu dải này bằng số MIDI (`pitchMin`, `pitchMax`).
- **Hiện bàn phím piano:** vẽ bàn phím ở mép trái; phím sáng lên khi nốt chạm tới. Khi bật bàn phím, vạch phát nằm đúng mép bàn phím nên hai ô **Hiện vạch phát** và **Vị trí vạch phát** đều ẩn. Tắt bàn phím để chỉnh lại vạch phát.
- **Cách nốt chạy:** **Cuộn** (mặc định) nốt trôi qua vạch phát đứng yên; **Trang** nốt đứng yên theo từng trang, vạch phát chạy từ trái sang phải, hết trang thì về đầu và hiện trang nốt mới (nốt kéo dài qua ranh giới trang bị cắt ở mép trang; nốt đã phát đậm, nốt sắp tới nhạt theo **Độ đục khi chờ**). Ô **Thời gian hiển thị** là tỉ lệ thời gian ở chế độ Cuộn và độ dài một trang ở chế độ Trang. Ở chế độ Trang ô **Vị trí vạch phát** không còn tác dụng nên bị ẩn.
- **Độ dài trang (chế độ Trang):** **Giây** hoặc **Ô nhịp**. Chọn **Ô nhịp** thì mỗi trang gồm đúng số ô nhịp bạn đặt (**Số ô nhịp mỗi trang**), trang bắt đầu đúng đầu ô nhịp và đổi trang đúng lúc sang ô mới, kể cả khi bài đổi tempo hoặc nhịp (trang dài ngắn khác nhau).
- **Hiện nốt trước (chế độ Trang):** 0 là hiện cả trang. Đặt một số giây (ví dụ 2) thì nốt chỉ hiện khi còn cách vạch phát chừng ấy thời gian; nốt đã phát ở lại tới hết trang. Giống kiểu trang nhạc "hiện dần" trong nhiều video.
- **Hiện vạch phát:** ẩn vạch thì nốt vẫn phát ở đúng chỗ đó, chỉ không vẽ vạch. Khi vạch đang ẩn, ô **Vị trí vạch phát** cũng ẩn theo; bật lại vạch để chỉnh vị trí.

### Phát sáng

- **Phát sáng** và **Cỡ quầng sáng:** độ sáng và độ lan của quầng quanh nốt.
- **Chỉ sáng khi đang phát:** nốt chỉ có quầng lúc đang vang.
- **Kiểu phát sáng:** **Đều nhau** (mọi nốt sáng như nhau) hoặc **Động khi chạm** (mỗi nốt sáng khác nhau tuỳ theo mục **Theo**):
  - **Velocity:** nốt đánh mạnh sáng hơn.
  - **Cao độ:** nốt cao sáng hơn.
  - **Pan:** theo vị trí trái phải của track. **Trái → phải**: trái hẳn là yếu nhất, phải hẳn là mạnh nhất. **Lệch khỏi giữa**: ở giữa yếu nhất, càng lệch sang hai bên càng mạnh.
  - **Tắt dần:** sáng nhất lúc chạm rồi tắt dần tới hết nốt.
  - **Automation:** theo một automation trong dự án (chọn ở ô **Lane**). Track không có automation đó thì sáng đều.
- Nâng cao: **Sáng yếu nhất**, **Sáng mạnh nhất**, **Đảo chiều**, **Tắt dần sau nốt** (số giây quầng còn lại sau khi nốt hết).

Rê chuột lên ô **Theo** để xem lại cách tính của lựa chọn đang dùng.
