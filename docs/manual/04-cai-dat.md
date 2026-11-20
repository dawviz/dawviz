# Thẻ Cài đặt

[Mục lục](README.md) · [English](en/04-settings.md)

## Giao diện ứng dụng

- **Sáng hoặc tối:** Sáng, Tối, hoặc Theo hệ thống (đổi theo cài đặt của máy). Nút mặt trăng/mặt trời ở góc trên cũng đổi nhanh được.
- **Màu nhấn:** màu của nút, thẻ đang chọn và các điểm nhấn khác.

Hai mục này chỉ đổi giao diện của ứng dụng. Màu trong video do phong cách video quyết định.

## Sân khấu

**Khung bản in thử quanh khung xem trước:** bật để có dấu cắt ở bốn góc và dòng ghi kích thước quanh khung xem trước, giống bản in thử. Những thứ này không bao giờ có trong video xuất ra.

## Phiên làm việc

Ứng dụng tự lưu công việc trong trình duyệt này, khoảng nửa giây sau thao tác cuối. Lần sau mở lại trang, bài, âm thanh, tempo, bố cục và phong cách video trở lại như lúc bạn dừng. Không có gì được gửi đi đâu cả.

- **Lưu gói dự án** tải về một tệp `.zip` chứa mọi thứ của phiên: tệp dự án, tệp `.mid` phụ, âm thanh, tempo bạn đặt, schema đã nạp và bố cục. Mở gói trên máy khác là có lại đúng phiên đó.
- **Mở gói dự án** nạp một gói như vậy. Gói bị hỏng, bị sửa hoặc do bản ứng dụng mới hơn tạo ra thì ứng dụng báo và không mở.
- **Xoá phiên đã lưu** xoá bản lưu trong trình duyệt (không đụng tới tệp của bạn).
- Khi bộ nhớ trình duyệt gần đầy, ứng dụng chỉ lưu bố cục và thiết lập; lần sau bạn phải nạp lại tệp dự án và âm thanh. Ứng dụng báo rõ tệp nào cần nạp lại.

## Preset (cột Phong cách video)

Preset là một tệp `.json` lưu cách bày video: phong cách, vị trí các widget, hình thức nốt, kiểu chữ. Preset không chứa dự án hay âm thanh của bạn, nên gửi cho người khác thoải mái.

Preset nằm ở cột **Phong cách video** của thẻ Xem trước, ngay dưới Bản in và Tối, không còn ở Cài đặt.

- **Ô dấu cộng** (khung nét đứt): chọn một tệp preset `.json`. Preset được thêm thành ô mới, áp lên bài đang mở và nhớ trong trình duyệt này. Hoàn tác được nếu không ưng.
- **Mỗi ô giữ bản chỉnh dở của riêng nó.** Chỉnh Bản in rồi chuyển sang Tối, khi quay lại Bản in thì các chỉnh sửa vẫn còn, ô hiện nhãn "đã chỉnh". Ghi đè màu theo track thì đi theo dự án, không tính là chỉnh của ô.
- Rê chuột vào một ô để thấy nút: **↓ tải xuống** tệp `.json` đúng như đang thấy (kể cả phần đã chỉnh), **×** (chỉ hiện khi ô đã chỉnh) đưa ô về **bản gốc**, và với preset của bạn có thêm **thùng rác** để xoá khỏi danh sách. Về gốc vẫn hoàn tác được bằng Ctrl+Z.
- Nút **nhân bản** (hai ô chồng nhau) tạo preset mới từ bản bạn đang thấy, kể cả phần đã chỉnh. Ô nguồn về nguyên gốc, phần chỉnh chuyển sang ô mới.
- Bản chỉnh dở của mọi ô được nhớ theo trình duyệt này, nên tải lại trang vẫn còn; xoá dữ liệu trình duyệt thì mất.
- Preset từ bản cũ hơn vẫn mở được; ứng dụng báo đã nâng phiên bản. Lưu lại để giữ bản đã nâng.
- Preset từ bản mới hơn thì cần cập nhật ứng dụng mới mở được.
- Preset dùng phông không có sẵn trong ứng dụng thì ứng dụng báo và vẽ chữ bằng phông mặc định. Tên phông vẫn giữ trong preset.
- Giá trị nào trong preset bị hỏng hoặc vượt giới hạn sẽ được thay bằng giá trị mặc định, và ứng dụng liệt kê những chỗ đó.
