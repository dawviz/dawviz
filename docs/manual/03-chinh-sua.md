# Thẻ Chỉnh sửa

[Mục lục](README.md) · [English](en/03-editor.md)

Thẻ Chỉnh sửa dùng để sắp xếp các khối trên khung video, đổi hình thức nốt và chữ. Mỗi khối (gọi là widget) làm một việc: piano roll, tên bài và nghệ sĩ, bộ đếm nốt, nốt đang phát, thời gian và ô nhịp, hợp âm, thanh tiến độ.

Màn hình chia ba phần: danh sách **Lớp** bên trái, khung video ở giữa, **Thuộc tính** của widget đang chọn bên phải.

## Chọn widget

- Bấm vào widget trên khung, hoặc bấm tên nó trong danh sách Lớp.
- Giữ Shift khi bấm để chọn thêm widget khác.
- Bấm Esc để bỏ chọn.

## Di chuyển, đổi cỡ, xoay

- **Di chuyển:** kéo widget. Hoặc dùng phím mũi tên để dịch 1 điểm, Shift + mũi tên để dịch 10 điểm.
- **Đổi cỡ:** kéo các ô vuông ở góc và cạnh. Giữ Alt để đổi cỡ đều quanh tâm.
- **Xoay:** kéo ô tròn phía trên khung chọn. Góc tự nhảy theo bước 15°; giữ Shift để xoay tự do. Nhấp đúp ô tròn để về 0°.
- **Gõ số chính xác:** ở mục **Vị trí và kích thước**, ô X, Y là toạ độ góc trên bên trái, W và H là chiều rộng, chiều cao. Đơn vị là điểm trên khung thiết kế (khung 1080 điểm rộng thì 540 là chính giữa), không phụ thuộc cỡ màn hình hay độ phân giải video.

Khi chọn nhiều widget, bạn di chuyển và xoay cả nhóm cùng lúc; ô **Xoay cả nhóm thêm** xoay nhóm quanh tâm của nó.

Nếu widget bị kéo ra hẳn ngoài khung, ứng dụng báo **Ngoài khung** vì nó sẽ không có trong video. Bấm **Đưa vào khung** để kéo nó về.

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

- **Đổi thứ tự:** kéo tay nắm sáu chấm, hoặc chọn dòng rồi bấm Alt+Lên / Alt+Xuống. Ở mục **Sắp xếp** bên phải còn có bốn nút: đưa lên trên cùng, lên một bậc, xuống một bậc, xuống dưới cùng (phím tắt Ctrl+] và Ctrl+[, thêm Shift để đưa hẳn lên trên cùng hoặc xuống dưới cùng).
- **Mắt:** ẩn hoặc hiện widget trong video (giống ô **Hiện trong video**).
- **Ổ khoá:** khoá widget để không lỡ tay kéo nó. Widget đã khoá vẫn chọn được trong danh sách Lớp để xem số liệu hoặc mở khoá.
- Hàng trên cùng ẩn/hiện hoặc khoá/mở khoá mọi lớp cùng lúc.

## Chữ

Chọn một widget có chữ (tên bài, bộ đếm nốt, nốt đang phát, thời gian, hợp âm, thanh tiến độ) để thấy mục **Chữ**.

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
- **Hiện bàn phím piano:** vẽ bàn phím ở mép trái; phím sáng lên khi nốt chạm tới. Khi bật bàn phím, vạch phát nằm đúng mép bàn phím nên ô **Vị trí vạch phát** bị khoá. Tắt bàn phím để dời vạch phát.
- **Hiện vạch phát:** ẩn vạch thì nốt vẫn phát ở đúng chỗ đó, chỉ không vẽ vạch.

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
