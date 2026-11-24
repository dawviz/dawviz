# Thẻ Cài đặt

[Mục lục](README.md) · [English](en/04-settings.md)

## Giao diện ứng dụng

- **Sáng hoặc tối:** Sáng, Tối, hoặc Theo hệ thống (đổi theo cài đặt của máy). Nút mặt trăng/mặt trời ở góc trên cũng đổi nhanh được.
- **Màu nhấn:** màu của nút, thẻ đang chọn và các điểm nhấn khác.

Hai mục này chỉ đổi giao diện của ứng dụng. Màu trong video do phong cách video quyết định.

## Sân khấu

**Khung bản in thử (dấu cắt quanh các khung):** bật để có dấu cắt ở bốn góc quanh khung xem trước, khung ở thẻ Chỉnh sửa, tờ Cài đặt và ô thả tệp, kèm dòng ghi kích thước trên khung xem trước, giống bản in thử. Tắt thì mất ở mọi nơi. Những thứ này không bao giờ có trong video xuất ra.

## Độ trễ thiết bị

Tiếng đi qua loa hoặc tai nghe luôn chậm hơn một chút, và trình duyệt chỉ đoán được độ chậm đó. Nếu hình trong Xem trước lệch tiếng (hay gặp với tai nghe không dây), hãy đo độ lệch của thiết bị bạn đang dùng.

- Chọn **Đo**, đeo thiết bị bạn đang nghe, rồi **gõ vào nút lớn (hoặc bấm Space) ở phách 3 của mỗi ô**. Bài đo chạy ở 110 BPM, bốn ô, mỗi ô là kick, kick, một tiếng snare ở phách 3, rồi lặng. Gõ thêm theo kick cũng được, ứng dụng chỉ lấy lần gõ gần phách 3 nhất.
- Kết quả là trung vị của bốn lần đo, cần ít nhất ba lần hợp lệ. Nếu các lần gõ chênh nhau quá 30 ms, ứng dụng báo kết quả có thể lệch và nên đo lại.
- **Lưu thành thiết bị mới** đặt tên cho kết quả (ví dụ "Tai nghe Sony"). Nếu đã chọn một thiết bị, **Cập nhật** ghi kết quả vào thiết bị đó. Có thể sửa tên và độ lệch (ms) bằng tay bất cứ lúc nào.
- Ở ô **Thiết bị**, chọn thiết bị đang dùng. **Tự động** là không bù thêm gì. Ứng dụng không tự nhận biết thiết bị, nên đổi tai nghe thì đổi lựa chọn này.
- **Lưu tệp thiết bị** và **Mở tệp thiết bị** chuyển một thiết bị giữa các máy. Lưu được tối đa 16 thiết bị.

Nút ↺ cạnh ô **Độ lệch (ms)** đưa độ lệch của thiết bị đó về 0.

Độ lệch này chỉ dời hình so với tiếng khi xem trước trên máy này. Nó không đổi âm thanh, không nằm trong **Offset âm thanh** của dự án, và không có trong preset, gói dự án hay video xuất.

Kết quả là ước lượng: nó gồm cả độ chậm của bàn phím hoặc chuột và thói quen gõ sớm hay muộn của bạn. Nếu thấy hình vẫn lệch, chỉnh tay thêm vài mili giây.

## Phiên làm việc

Ứng dụng tự lưu công việc trong trình duyệt này, khoảng nửa giây sau thao tác cuối. Lần sau mở lại trang, bài, âm thanh, ảnh nền, tempo, bố cục và phong cách video trở lại như lúc bạn dừng. Không có gì được gửi đi đâu cả.

- **Lưu gói dự án** tải về một tệp `.zip` chứa mọi thứ của phiên: tệp dự án, tệp `.mid` phụ, âm thanh, ảnh nền, ảnh và phông bạn thêm, tempo bạn đặt, schema đã nạp và bố cục. Mở gói trên máy khác là có lại đúng phiên đó.
- **Mở gói dự án** nạp một gói như vậy. Gói bị hỏng, bị sửa hoặc do bản ứng dụng mới hơn tạo ra thì ứng dụng báo và không mở.
- **Xoá phiên đã lưu** xoá bản lưu trong trình duyệt (không đụng tới tệp của bạn). Nút hỏi lại một lần trước khi xoá vì không hoàn tác được.
- **Tệp của phiên** liệt kê ảnh và phông bạn đã thêm (tên, loại, dung lượng); nút × bỏ một tệp khỏi phiên. Widget đang dùng ảnh đã bỏ sẽ trống, và hộp thoại Xuất video báo trước khi xuất.
- Khi bộ nhớ trình duyệt gần đầy, ứng dụng chỉ lưu bố cục và thiết lập; lần sau bạn phải nạp lại tệp dự án và âm thanh. Ứng dụng báo rõ tệp nào cần nạp lại.

## Preset (cột Phong cách video)

Preset là một tệp `.json` lưu cách bày video: phong cách, vị trí các widget, hình thức nốt, kiểu chữ. Preset không chứa dự án hay âm thanh của bạn, nên gửi cho người khác thoải mái.

Preset nằm ở cột **Phong cách video** của thẻ Xem trước, ngay dưới Bản in và Tối, không còn ở Cài đặt.

- **Ô dấu cộng** (khung nét đứt): chọn một tệp preset `.json` (hoặc gói `.dawviz-preset.zip`, xem bên dưới). Preset được thêm thành ô mới, áp lên bài đang mở và nhớ trong trình duyệt này. Hoàn tác được nếu không ưng.
- **Dán preset** (dưới ô dấu cộng): dán thẳng nội dung JSON của một preset (ví dụ chatbot AI viết, xem [Dùng với AI agent](11-ai-agent.md)) rồi bấm **Thêm preset**. Kết quả như khi chọn tệp; Ctrl+Enter để thêm nhanh, Esc để đóng.
- **Mỗi ô giữ bản chỉnh dở của riêng nó.** Chỉnh Bản in rồi chuyển sang Tối, khi quay lại Bản in thì các chỉnh sửa vẫn còn, ô hiện nhãn "đã chỉnh". Ghi đè màu theo track thì đi theo dự án, không tính là chỉnh của ô.
- Rê chuột vào một ô để thấy nút: **↓ tải xuống** tệp `.json` đúng như đang thấy (kể cả phần đã chỉnh), **×** (chỉ hiện khi ô đã chỉnh) đưa ô về **bản gốc**, và với preset của bạn có thêm **thùng rác** để xoá khỏi danh sách. Về gốc vẫn hoàn tác được bằng Ctrl+Z.
- Nút **nhân bản** (hai ô chồng nhau) tạo preset mới từ bản bạn đang thấy, kể cả phần đã chỉnh. Ô nguồn về nguyên gốc, phần chỉnh chuyển sang ô mới.
- **Chia sẻ thành preset…** (dưới ô dấu cộng): điền **Tên**, **Tác giả**, **Giấy phép (SPDX)** và **Mô tả**, rồi **Tải gói**. Bạn nhận một tệp `.dawviz-preset.zip` gồm khung hiện tại cùng ảnh (widget Ảnh) và phông bạn nạp mà khung dùng. Giấy phép là bắt buộc và chỉ nhận các loại cho phép chia sẻ lại (CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, MIT, Apache-2.0, OFL-1.1, BSD, ISC). Chỉ chia sẻ ảnh và phông bạn có quyền chia sẻ.
- **Xuất bộ preset…** (dưới nút trên): chọn các preset đã lưu của bạn, điền **Tên**, **Tác giả**, **Giấy phép** và **Mô tả**, rồi **Tải gói**. Gói gom nhiều preset và ảnh, phông chúng dùng, **không** kèm mốc thời gian của dự án và **không** kèm tệp nhạc hay tệp DAW. Chọn đúng một preset thì ra gói một preset như nút trên. Muốn chia sẻ cả cách dùng preset theo thời gian thì chia sẻ cả dự án (Project Pack).
- **Mở bộ preset:** dùng dấu cộng như với gói một preset. Mọi preset trong bộ được thêm vào cột, chưa áp lên bài và mang nhãn chưa kiểm duyệt. Nếu đã có preset **trùng tên nhưng khác nội dung**, ứng dụng hỏi từng cái: **Ghi đè** hoặc **Đổi tên** (giữ cả hai, tên mới thêm “(2)”). Mặc định là Đổi tên; không có gì bị ghi đè nếu bạn chưa chọn.
- Ô dấu cộng mở được cả gói `.dawviz-preset.zip`. Ảnh và phông trong gói được thêm vào phiên. Gói chứa kiểu nốt, đường cong easing hay cấu hình hạt thì được áp tương ứng (kiểu nốt lên Piano roll, đường cong vào Thư viện easing, hạt thành một widget Hạt mới). Preset mở từ gói luôn ghi "chưa kiểm duyệt"; gói bị sửa (sai băm) hoặc có giấy phép không được nhận thì không mở.
- Bản chỉnh dở của mọi ô được nhớ theo trình duyệt này, nên tải lại trang vẫn còn; xoá dữ liệu trình duyệt thì mất.
- Preset từ bản cũ hơn vẫn mở được; ứng dụng báo đã nâng phiên bản. Lưu lại để giữ bản đã nâng.
- Preset từ bản mới hơn thì cần cập nhật ứng dụng mới mở được.
- Preset dùng phông không có sẵn trong ứng dụng thì ứng dụng báo và vẽ chữ bằng phông mặc định. Tên phông vẫn giữ trong preset.
- Giá trị nào trong preset bị hỏng hoặc vượt giới hạn sẽ được thay bằng giá trị mặc định, và ứng dụng liệt kê những chỗ đó.
