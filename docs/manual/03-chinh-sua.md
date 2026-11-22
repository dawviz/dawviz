# Thẻ Chỉnh sửa

[Mục lục](README.md) · [English](en/03-editor.md)

Thẻ Chỉnh sửa dùng để sắp xếp các khối trên khung video, đổi hình thức nốt và chữ. Mỗi khối (gọi là widget) làm một việc: piano roll, tên bài và nghệ sĩ, bộ đếm nốt, nốt đang phát, thời gian và ô nhịp, hợp âm, thanh tiến độ.

Màn hình có bốn phần: danh sách **Lớp** bên trái, khung video ở giữa, **Thuộc tính widget** bên phải, và panel **Timeline và keyframe** ở dưới cùng.

## Đổi cỡ và thu gọn panel

- **Đổi cỡ:** kéo đường ranh giữa hai panel (con trỏ đổi thành mũi tên hai đầu). Nhấp đúp vào đường ranh để về cỡ mặc định. Cũng có thể bấm Tab tới đường ranh rồi dùng phím mũi tên (Shift: bước lớn hơn).
- **Thu gọn:** bấm nút panel ở góc trên của Lớp hoặc Thuộc tính widget, hoặc nút ở đầu thanh **Timeline và keyframe**. Panel thu gọn còn một dải mỏng; bấm dải đó để mở lại. Phím tắt: Ctrl+B (Lớp), Ctrl+Alt+B (Thuộc tính widget), Ctrl+J (Timeline).
- **Gấp mục:** bấm tiêu đề một mục (ví dụ **Vị trí và kích thước**) để gấp lại khi không dùng tới, bấm lần nữa để mở. Cột bên phải ngắn đi rất nhiều. Ứng dụng nhớ mục nào đang gấp, cả ở thẻ Xem trước.
- Cỡ và trạng thái các panel được nhớ trong trình duyệt này. Màn hình hẹp hơn 1024 điểm thì các panel xếp dọc như cũ.

## Chọn widget

- Bấm vào widget trên khung, hoặc bấm tên nó trong danh sách Lớp.
- Giữ Shift (hoặc Ctrl/⌘) khi bấm để chọn thêm widget khác.
- Bấm giữ trên tên một lớp rồi kéo lên hoặc xuống để chọn cả dãy lớp đi qua. Giữ Shift khi bắt đầu kéo để cộng thêm vào những lớp đang chọn.
- **Chọn tất cả** ở đầu danh sách Lớp, hoặc Ctrl+A (⌘A trên Mac), chọn mọi lớp.
- Kéo chuột trên chỗ trống của khung để vẽ một khung chọn: mọi widget chạm khung đó đều được chọn. Giữ Shift để cộng thêm vào những widget đang chọn.
- **Bỏ chọn:** bấm **Bỏ chọn** ở đầu bảng bên phải (khi đang chọn), hoặc bấm Esc, hoặc bấm vào vùng nền xung quanh khung. Khi đã chọn hết, nút **Chọn tất cả** ở danh sách Lớp đổi thành **Bỏ chọn**. Cách này dùng được cả khi một widget phủ kín khung, lúc bấm lên khung không bỏ chọn được.

## Thêm, nhân bản, xoá

- **Thêm:** bấm **Thêm** ở đầu danh sách Lớp rồi chọn loại widget. Widget mới nằm giữa khung, trên cùng các lớp, và được chọn sẵn.
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
- Ở Nâng cao: nốt mạnh sinh nhiều hạt hơn, độ biến thiên tốc độ, hình tròn hay vuông, độ đục, mờ dần, phát sáng, **Vị trí xuất phát** (**Tại nốt, chỗ chạm vạch phát**: hạt bay ra từ đúng chỗ nốt chạm vạch phát của Piano Roll, như tia lửa; theo cao độ trải trên bề rộng widget; giữa; hoặc rải đều. Với "Tại nốt", khung widget Hạt được ẩn trên khung hình (chọn lớp từ danh sách Lớp), và hạt không bị cắt theo khung widget: chúng bay trong toàn khung video; không có Piano Roll thì không có hạt) và độ cao xuất phát, **Hạt giống ngẫu nhiên** (đổi để có kiểu rải khác), **Số hạt tối đa cùng lúc** (quá số này thì bỏ hạt cũ nhất).
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

Khi không chọn widget nào, mục **Ảnh nền** cho bạn chọn một ảnh PNG, JPEG, WebP hoặc GIF (tối đa 20 MB; ảnh quá lớn về kích thước được thu nhỏ còn 4096 điểm ở cạnh dài, GIF lấy khung đầu). Ảnh nằm dưới mọi widget.

- **Cách đặt:** **Phủ kín** (cắt phần thừa ở giữa), **Vừa khung** (nguyên ảnh, chừa màu nền) hoặc **Kéo giãn** (có thể méo ảnh).
- **Độ đục** và **Làm tối** (phủ một lớp đen lên ảnh để chữ và nốt dễ đọc).
- Ảnh được lưu cùng phiên và gói dự án. **Preset không chứa ảnh**, chỉ nhớ cách đặt, nên gửi preset cho người khác thì họ tự chọn ảnh của họ.

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

Panel **Timeline và keyframe** ở dưới cùng cho thấy các thuộc tính của widget đang chọn theo thời gian: bên trái là danh sách thuộc tính, bên phải là thước thời gian và các keyframe hình thoi. Nhóm **Biến đổi** có Vị trí, Tỉ lệ, Xoay, Độ đục. Bấm đồng hồ ở một thuộc tính để bắt đầu animate; khi đã bật, kéo widget trên khung sẽ đặt keyframe tại vạch phát. Kéo keyframe để đổi thời điểm, chọn keyframe để chỉnh đường cong ở mục **Keyframe** bên phải. Nút **Danh sách / Đồ thị** ở góc phải thanh tiêu đề panel đổi sang **Đồ thị** để xem và chỉnh đường cong giá trị, tốc độ của dòng đang chọn. Chi tiết ở [Widget phân tích](10-phan-tich.md#hoạt-hình-thuộc-tính).

## Cách ghi tên nốt

Cũng khi không chọn widget nào, mục **Cách ghi tên nốt** đổi tên nốt và hợp âm ở mọi widget cùng lúc (chữ cái, Do Re Mi, kiểu Đức; dấu thăng hay giáng; C4 hay C3). Chi tiết ở [Widget phân tích](10-phan-tich.md#cách-ghi-tên-nốt).

## Khoảng hiển thị

Mặc định widget hiện suốt bài. Chọn widget rồi bật **Chỉ hiện trong các khoảng** ở mục **Khoảng hiển thị** để giới hạn lúc nó xuất hiện, ví dụ chỉ hiện tên bài ở 10 giây đầu.

- Mỗi dòng là một khoảng: **Hiện từ** và **Hiện tới**. Gõ giây (`90`, `90.5`) hoặc phút:giây (`1:30`, `1:30.5`). Để trống ô **Hiện tới** nghĩa là hiện tới hết bài.
- **Thêm khoảng** thêm một dòng; nút × xoá dòng. Không còn khoảng nào thì widget không bao giờ hiện.
- **Hiện dần** và **Ẩn dần** (giây) làm widget mờ vào lúc bắt đầu khoảng và mờ ra lúc kết thúc. Khoảng ngắn hơn tổng hai thời gian này thì cả hai co lại theo tỉ lệ. Nút ↺ cạnh mỗi ô đưa về 0 (không mờ dần).
- Tắt lại ô tick để về hiện suốt bài.

Khoảng hiển thị chỉ ảnh hưởng video và Xem trước; trong Editor bạn vẫn chọn và kéo widget như bình thường.

## Phase

Phase là các đoạn của bài (verse, chorus…). Khi không chọn widget nào, mục **Phase** ở cột phải cho thêm phase: mỗi dòng có tên và thời điểm bắt đầu. Phase kéo dài tới phase kế; phase cuối kéo dài tới hết bài. Các số liệu `{phase}`, `{next_phase}`, `{phase_remaining}`… dùng được trong mọi ô chữ (xem [Chỗ giữ](08-cho-giu.md)).

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

Danh sách **Lớp** cho biết widget nào nằm trên widget nào: dòng trên cùng được vẽ trên cùng.

- **Đổi thứ tự:** kéo tay nắm sáu chấm (chỉ kéo tay nắm mới đổi thứ tự, kéo chỗ khác trên dòng thì không), hoặc chọn dòng rồi bấm Alt+Lên / Alt+Xuống. Ở mục **Sắp xếp** bên phải còn có bốn nút: đưa lên trên cùng, lên một bậc, xuống một bậc, xuống dưới cùng (phím tắt Ctrl+] và Ctrl+[, thêm Shift để đưa hẳn lên trên cùng hoặc xuống dưới cùng).
- **Widget cha:** ô **Widget cha** ở mục **Sắp xếp** gắn widget này vào một widget khác. Khi cha dời, xoay, đổi tỉ lệ hay mờ đi (bằng keyframe hoặc chuyển động), widget con làm theo đúng phần thay đổi đó; con vẫn đứng nguyên chỗ của nó khi cha đứng yên. Không chọn được widget đang là con của chính nó. Xoá cha thì con thôi có cha. Lưu ý: khi cha đang lệch khỏi chỗ ban đầu, khung chọn của con trên khung chưa đi theo cha.
- **Đổi tên:** bấm đúp vào tên lớp (hoặc chọn lớp rồi nhấn F2), gõ tên mới, nhấn Enter. Esc để bỏ. Để trống rồi Enter thì lớp quay về tên theo loại (ví dụ Hợp âm 2). Tên tối đa 60 ký tự và không được trùng với lớp khác (hoa/thường coi như nhau). Nếu trùng, tên cũ được giữ nguyên và ứng dụng báo lý do. Tên lớp chỉ để bạn dễ tìm, không hiện trong video; được lưu trong preset. Bản nhân bản không mang tên của bản gốc.
- **Mắt:** ẩn hoặc hiện widget trong video (giống ô **Hiện trong video**).
- **Ổ khoá:** khoá widget để không lỡ tay kéo nó. Widget đã khoá vẫn chọn được trong danh sách Lớp để xem số liệu hoặc mở khoá.
- Hàng trên cùng ẩn/hiện hoặc khoá/mở khoá mọi lớp cùng lúc.
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

Mọi thiết lập trong mục này đều có nút ↺ khi khác giá trị gốc (kể cả ô tick, nhóm nút, màu, ô chữ và mục **Track**), và Alt+nhấp (Option+nhấp trên Mac) vào nhãn để khôi phục nhanh.

Khi sửa chữ của một dòng, những chỗ trong ngoặc nhọn như `{played}` hay `{bpm}` sẽ được thay bằng số thật, dùng được ở mọi chữ. Bấm `{bpm}` hoặc `{title}` dưới ô để chèn ngay, hoặc gõ `{` để xem gợi ý tên, hoặc rê chuột lên ô chữ. Danh sách đầy đủ và cách chọn kiểu hiện số ở trang [Chèn số liệu vào chữ](08-cho-giu.md). Gõ xong bấm Enter, hoặc bấm ra ngoài ô; bấm Esc để bỏ.

## Chữ

Chọn một widget có chữ (tên bài, bộ đếm nốt, nốt đang phát, thời gian, hợp âm, thanh tiến độ, ô chữ) để thấy mục **Chữ**.

Mỗi chữ dùng một **kiểu chữ** có sẵn (Tiêu đề, Phụ đề, Số đếm, Đồng hồ…). Bạn đổi gì thì chỉ thứ đó khác kiểu, phần còn lại vẫn theo kiểu. Cạnh mỗi thứ đã đổi có nút ↺ để quay về giá trị của kiểu.

- **Dòng chữ:** widget có nhiều chữ thì chọn chữ cần sửa ở đây, ví dụ Tên bài hay Nghệ sĩ. Một số mục là một phần của dòng, ví dụ **Con số trong dòng** của bộ đếm nốt hay **Nốt bass sau dấu /** của hợp âm: đổi ở đó thì chỉ phần ấy khác, phần còn lại của dòng giữ nguyên. Chữ đang có chỉnh sửa được đánh dấu • trong danh sách.
- **Kiểu chữ**, **Phông**, **Cỡ**, **Màu**, **Đậm**, **Nghiêng**.
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
