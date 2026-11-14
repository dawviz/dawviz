# Xuất video

[Mục lục](README.md) · [English](en/06-export-video.md)

Bấm **Xuất video** ở góc trên bên phải (cần mở dự án trước). Hộp thoại xuất hiện.

## Chọn cấu hình

- **Kích thước:** 720p, 1080p hoặc 4K, tính theo cạnh ngắn của khung. Khung vuông 1:1 ra 1080×1080, khung ngang 16:9 ra 1920×1080. Cạnh dài tối đa 4096 px; số lẻ được làm tròn thành số chẵn, và hộp thoại báo khi có làm tròn.
- **Số khung hình/giây:** 24, 30 hoặc 60.
- **Chất lượng:** Thấp, Vừa hoặc Cao. Cao cho tệp lớn hơn.

Dòng tóm tắt bên dưới cho biết kích thước thực, thời lượng, số khung và dung lượng ước tính. Video dài hơn bài nhạc 2 giây ở cuối. Nếu đã nạp âm thanh dài hơn dự án thì video dài theo âm thanh.

## Định dạng

Ứng dụng tự chọn định dạng tốt nhất mà trình duyệt của bạn mã hoá được:

1. **MP4 (H.264 + AAC)**, mở được hầu như ở mọi nơi.
2. **MP4 không tiếng**, khi máy không mã hoá được AAC. Ứng dụng báo rõ.
3. **WebM (VP9 hoặc VP8 + Opus)**, khi trình duyệt không mã hoá được H.264. Ứng dụng báo rõ.

Nếu cả ba đều không được, ứng dụng nói rõ và gợi ý thử kích thước nhỏ hơn hoặc dùng Chrome hoặc Edge.

## Kiểm tra máy

Nút **Kiểm tra máy này** ở cuối phần cấu hình thử mã hoá thật vài khung hình và một giây âm thanh, rồi cho bạn bản kết quả để chép. Dùng khi xuất không được hoặc khi bạn muốn giúp thử nghiệm: xem [Thử nghiệm xuất video](07-thu-nghiem.md).

## Xuất và hủy

1. Bấm **Bắt đầu xuất**. Trên Chrome và Edge, ứng dụng hỏi nơi lưu tệp trước; video được ghi thẳng xuống ổ đĩa. Trình duyệt khác giữ tệp trong bộ nhớ rồi cho bạn **Lưu tệp** khi xong.
2. Thanh tiến độ cho biết khung đang làm, tốc độ (ví dụ 2× nghĩa là nhanh gấp đôi thời gian thực) và thời gian còn lại ước tính.
3. **Hủy xuất** dừng ngay và không để lại tệp dở. Dự án của bạn không đổi.

Trong lúc xuất, hãy để tab này mở. Máy được giữ không tắt màn hình khi trình duyệt cho phép.

Tệp lớn hơn 1 GB trên trình duyệt không ghi thẳng xuống đĩa được thì ứng dụng cảnh báo, vì có thể thiếu bộ nhớ. Khi đó hãy giảm kích thước hoặc dùng Chrome/Edge.
