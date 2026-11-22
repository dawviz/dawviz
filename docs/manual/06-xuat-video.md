# Xuất video

[Mục lục](README.md) · [English](en/06-export-video.md)

Bấm **Xuất video** ở góc trên bên phải (cần mở dự án trước). Hộp thoại xuất hiện.

## Chọn cấu hình

- **Kích thước:** 720p, 1080p hoặc 4K, tính theo cạnh ngắn của khung. Khung vuông 1:1 ra 1080×1080, khung ngang 16:9 ra 1920×1080. Cạnh dài tối đa 4096 px; số lẻ được làm tròn thành số chẵn, và hộp thoại báo khi có làm tròn.
- **Số khung hình/giây:** 24, 30 hoặc 60.
- **Chất lượng:** Thấp, Vừa hoặc Cao. Cao cho tệp lớn hơn.

Dòng tóm tắt bên dưới cho biết kích thước thực, thời lượng, số khung và dung lượng ước tính. Video dài hơn bài nhạc 2 giây ở cuối. Nếu đã nạp âm thanh dài hơn dự án thì video dài theo âm thanh.

## Định dạng

**Chế độ Cơ bản:** ứng dụng tự chọn định dạng tốt nhất mà trình duyệt của bạn mã hoá được, theo thứ tự ưu tiên giống các phần mềm dựng phổ biến:

1. **MP4 (H.264 + AAC)**, mở được hầu như ở mọi nơi.
2. Máy không mã hoá được AAC thì vẫn là **MP4 H.264** nhưng âm thanh hạ dần sang MP3, rồi Opus, rồi FLAC. Hộp thoại cho biết đang dùng codec nào. Chỉ khi không codec âm thanh nào dùng được thì tệp mới không có tiếng.
3. Trình duyệt không mã hoá được H.264 thì **WebM** (VP9, AV1 hoặc VP8, kèm Opus). Ứng dụng báo rõ.

Nếu không cái nào được, ứng dụng nói rõ và gợi ý thử kích thước nhỏ hơn hoặc dùng Chrome hoặc Edge.

**Chế độ Nâng cao:** hiện ba ô chọn phụ thuộc nhau, từ trên xuống:

- **Định dạng tệp:** MP4, WebM, MOV hoặc MKV.
- **Codec video:** chỉ liệt kê codec hợp với định dạng đã chọn và máy này mã hoá được (H.264, H.265, VP9, AV1, VP8).
- **Codec âm thanh:** chỉ liệt kê codec hợp với định dạng đã chọn và máy này mã hoá được (AAC, MP3, Opus, FLAC, hoặc PCM không nén cho MOV và MKV), hoặc **Không có âm thanh**. Dự án chưa nạp âm thanh thì ô này bị khoá.

Đổi định dạng thì ứng dụng giữ codec cũ nếu còn hợp, không thì chọn codec đầu danh sách. Định dạng nào máy không mã hoá được video thì không hiện. PCM cho tiếng không nén nên tệp lớn hơn nhiều.

## Chuỗi PNG trong suốt

Muốn ghép phần hình của DAW Visualizer lên video khác (After Effects, Premiere, DaVinci Resolve), chọn **Chuỗi PNG trong suốt** ở đầu hộp thoại. Mỗi khung thành một ảnh PNG có nền trong suốt (màu nền và ảnh nền của khung không được vẽ), đặt tên `tên_000001.png`, `tên_000002.png`… theo đúng số khung hình/giây đã chọn.

- **Kèm âm thanh thành tệp .wav:** ghi âm thanh của đúng đoạn xuất thành một tệp `.wav` cùng chỗ, để ghép lại khớp hình.
- Trên Chrome và Edge, bấm **Bắt đầu xuất** rồi chọn một thư mục: ảnh được ghi thẳng vào đó, không chiếm bộ nhớ. Trình duyệt khác nhận một tệp `.zip`; tệp này được giữ trong bộ nhớ tới khi xong, nên hộp thoại cảnh báo khi ước tính vượt 1 GB.
- Dòng ước tính cho biết số ảnh và dung lượng (ước tính dư; thực tế thường nhỏ hơn vì phần trong suốt nén rất tốt).
- Hộp thoại cũng cho biết trình duyệt có mã hoá được video WebM trong suốt (VP9 có alpha) hay không. Bản này luôn xuất chuỗi PNG.

Nhập vào After Effects: **File › Import**, chọn ảnh đầu tiên, đánh dấu **PNG Sequence**, rồi đặt tốc độ khung bằng đúng số khung hình/giây đã xuất.

## Kiểm tra máy

Nút **Kiểm tra máy này** ở cuối phần cấu hình thử mã hoá thật vài khung hình và một giây âm thanh, rồi cho bạn bản kết quả để chép. Dùng khi xuất không được hoặc khi bạn muốn giúp thử nghiệm: xem [Thử nghiệm xuất video](07-thu-nghiem.md).

## Xuất và hủy

1. Bấm **Bắt đầu xuất**. Trên Chrome và Edge, ứng dụng hỏi nơi lưu tệp trước; video được ghi thẳng xuống ổ đĩa. Firefox và các trình duyệt khác không có tính năng này: video được giữ trong bộ nhớ, và chỉ khi xuất xong mới hiện nút **Lưu tệp** để chọn nơi lưu. Đây là cách hoạt động bình thường, không phải lỗi.
2. Hộp thoại hiện ảnh thu nhỏ của khung đang xuất (cập nhật khoảng hai lần mỗi giây) kèm thẻ ghi phong cách, kích thước, số khung hình/giây và định dạng. Dưới ảnh là thanh tiến độ với phần trăm, số khung và thời gian còn lại ước tính.
3. **Hủy xuất** dừng ngay và không để lại tệp dở. Dự án của bạn không đổi.

Bấm **Chi tiết kỹ thuật** dưới thanh tiến độ để xem tốc độ (ví dụ 2× nghĩa là nhanh gấp đôi thời gian thực), thời gian vẽ và mã hoá mỗi khung, số mặt phông và codec đang dùng. Dòng thời gian vẽ chuyển vàng và có lời nhắn khi việc vẽ đang chậm dần so với lúc đầu. Nút **Sao chép báo cáo xuất** chép một đoạn văn bản ngắn (không có tên tệp hay nội dung dự án) để bạn dán vào báo cáo lỗi.

Firefox thường xuất chậm hơn Chrome. Một nguyên nhân đã biết là Firefox vẽ chữ chậm dần khi bài dài; ứng dụng đã giảm bớt việc này nên bài dài khoảng 2,5 phút mất cỡ nửa phút trên máy thử, nhưng vẫn chậm hơn Chrome. Việc lưu sau khi xuất xong không phải nguyên nhân.

Trong lúc xuất, hãy để tab này mở. Máy được giữ không tắt màn hình khi trình duyệt cho phép.

Nếu xuất chậm hơn nhiều so với thời gian thực dù máy còn rảnh, hãy báo kèm kết quả của nút **Kiểm tra máy này** và phong cách video đang dùng.

Tệp lớn hơn 1 GB trên trình duyệt không ghi thẳng xuống đĩa được thì ứng dụng cảnh báo, vì có thể thiếu bộ nhớ. Khi đó hãy giảm kích thước hoặc dùng Chrome/Edge.

## Âm thanh trên Linux

Trên Ubuntu, cả Chrome lẫn Firefox hiện báo không mã hoá được AAC. Đây là giới hạn của trình duyệt, chưa có cách khắc phục trong ứng dụng, và chúng tôi chưa thấy thư viện nào cài thêm trên máy giúp được. Ở chế độ Cơ bản, ứng dụng tự hạ xuống một codec khác trong MP4 (thường là Opus), nên tệp vẫn có tiếng. Opus phát được trong Chrome, Firefox, VLC, mpv và các phần mềm dựng mới; phần mềm cũ có thể không mở được tiếng Opus trong MP4. Khi đó dùng chế độ Nâng cao, chọn **MOV** hoặc **MKV** với **PCM** (không nén, tệp lớn nhưng đọc được ở hầu hết nơi).

## Khi có Bản nhạc

Khi khung có widget Bản nhạc mà bản nhạc vẫn đang được viết, hộp thoại báo "Bản nhạc vẫn đang được viết" và chỉ cho bấm **Bắt đầu xuất** khi viết xong, để video không thiếu bản nhạc.

## Chỉ một lần xuất mỗi lúc

Ứng dụng chỉ cho một tab xuất tại một thời điểm. Tab thứ hai báo "Một tab khác đang xuất video" và khoá nút **Bắt đầu xuất** cho tới khi tab kia xong. Lý do: hai lần xuất cùng lúc tranh nhau bộ mã hoá nên cả hai chậm đi nhiều, và nếu cùng lưu vào một tên tệp thì lần xong sau ghi đè lần kia mà không báo.
