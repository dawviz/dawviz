# Hướng dẫn sử dụng DAW Visualizer

DAW Visualizer biến tệp dự án nhạc của bạn thành video: nốt nhạc chạy trên piano roll, kèm tên bài, hợp âm, bộ đếm nốt và đồng hồ. Mọi thứ chạy trong trình duyệt, tệp của bạn không gửi đi đâu cả.

Hướng dẫn này viết dần theo ứng dụng. Phần nào chưa có trong ứng dụng thì chưa có ở đây.

[English version](en/README.md)

## Mục lục

1. [Mở dự án](01-mo-du-an.md): tệp nào mở được, khi thiếu tệp `.mid`, đọc cảnh báo.
2. [Thẻ Xem trước](02-xem-truoc.md): phát bài, chọn phong cách video, nạp âm thanh, ẩn hoặc solo track.
3. [Thẻ Chỉnh sửa](03-chinh-sua.md): sắp xếp các khối trên khung video, đổi hình thức nốt.
4. [Thẻ Cài đặt](04-cai-dat.md): giao diện sáng/tối, màu nhấn, mở và lưu preset.
5. [Phím tắt](05-phim-tat.md).
6. [Xuất video](06-xuat-video.md): chọn kích thước và định dạng, theo dõi tiến độ, hủy.
7. [Thử nghiệm xuất video](07-thu-nghiem.md): giúp thử xuất video trên máy của bạn và gửi kết quả.
8. [Chèn số liệu vào chữ](08-cho-giu.md): ô chữ, `{bpm}`, `{title}`, `{notes}` và cách chọn kiểu hiện số.

## Vài điều nên biết trước

- **Cơ bản và Nâng cao.** Nút chuyển ở góc trên bên phải. Cơ bản chỉ hiện những thứ hay dùng. Nâng cao hiện đủ mọi tuỳ chọn. Đổi qua lại lúc nào cũng được, thiết lập của bạn không mất.
- **Hoàn tác.** Hầu hết mọi thay đổi đều hoàn tác được bằng Ctrl+Z (⌘Z trên Mac). Nút đồng hồ cạnh Hoàn tác/Làm lại mở danh sách các bước đã làm; bấm vào một bước để quay về đúng lúc đó.
- **Nút ↺.** Cạnh một thiết lập đã đổi sẽ có nút ↺, ở mọi mục (Vị trí, Thiết lập, Chữ, hình thức nốt…). Bấm để đưa thiết lập đó về giá trị gốc của phong cách video hoặc preset vừa áp; widget mới thêm thì về giá trị mặc định của loại đó. Cách nhanh hơn: giữ Alt (Option trên Mac) rồi bấm vào **chữ nhãn** của thiết lập (không bấm vào ô nhập). Mỗi lần khôi phục là một bước hoàn tác riêng.
- **Rê chuột lên nút** để xem tên và phím tắt của nút.

## Ô nhập số

Các ô số trong ứng dụng dùng chung một cách nhập:

- Bấm vào ô rồi gõ số, bấm Enter.
- Gõ phép tính cũng được: `120+40`, `1920/2`.
- Gõ `+=10` để cộng thêm 10 vào giá trị đang có, `-=10` để bớt đi, `*=2` để nhân đôi, `/=2` để chia đôi.
- Giữ chuột trên ô rồi kéo lên hoặc xuống để đổi giá trị. Giữ Shift khi kéo để đổi nhanh gấp 10, giữ Alt để đổi chậm lại 10 lần.
- Gõ sai thì ô giữ nguyên giá trị cũ và báo lý do ngay bên dưới.

## Giới hạn đã biết (bản demo)

- **Xuất video** thử nhiều nhất trên Chrome. Firefox xuất chậm hơn (khoảng gấp đôi) và chỉ hỏi nơi lưu sau khi xuất xong.
- **Âm thanh AAC** chưa kiểm trên Windows và macOS. Trên Linux, Chrome và Firefox không mã hoá được AAC nên ứng dụng tự dùng codec khác (xem [Xuất video](06-xuat-video.md)).
- **Chưa lưu phiên làm việc:** đóng hoặc tải lại trang thì mất các chỉnh sửa. Hãy xuất video trước khi đóng.
- **Không hỗ trợ điện thoại và máy tính bảng**; hãy dùng máy tính.
- Chỉ một tab xuất video tại một thời điểm.

## Ghi công

Tác giả, nguồn của phong cách Bản in và phông chữ: [CREDITS.md](../../CREDITS.md).
