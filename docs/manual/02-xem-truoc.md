# Thẻ Xem trước

[Mục lục](README.md) · [English](en/02-preview.md)

Thẻ Xem trước là nơi xem video sẽ ra sao và chỉnh nhanh những thứ thuộc về bài nhạc: phong cách video, âm thanh, track nào hiện.

## Đổi cỡ và thu gọn panel

Giống thẻ Chỉnh sửa: kéo đường ranh giữa cột **Phong cách video**, khung video và **Bảng chỉnh** để đổi cỡ (nhấp đúp về cỡ mặc định). Nút panel ở đầu mỗi cột thu gọn cột đó thành một dải mỏng có tên chạy dọc; bấm dải để mở lại. Phím tắt: Ctrl+B (Phong cách video), Ctrl+Alt+B (Bảng chỉnh). Bấm tiêu đề một mục để gấp mục đó. Cỡ và trạng thái được nhớ riêng cho thẻ này.

## Phát bài

Thanh phát nằm dưới khung xem trước.

| Nút | Việc |
|---|---|
| ⏮ | Về đầu bài (phím Home) |
| « / » | Lùi hoặc tới 5 giây |
| ▶ | Phát hoặc tạm dừng (phím Space) |
| Thanh tua | Kéo hoặc bấm để nhảy tới chỗ khác |
| ⟳ | Bật hoặc tắt phát lặp |

Bên trái thanh tua là vị trí hiện tại, bên phải là độ dài bài. Nhấp vào vị trí hiện tại để gõ một thời điểm (`1:30`, `90.5`, `1:02:03`) rồi nhấn Enter: vạch phát nhảy tới đó (cả ở thẻ Chỉnh sửa và Timeline). Esc để thôi; gõ sai hoặc quá độ dài bài thì ô viền đỏ và vạch phát đứng yên. Khi khung hẹp (ví dụ khung dọc 9:16) thanh phát chia hai hàng: hàng trên là các nút và nút lặp, hàng dưới là vị trí hiện tại, thanh tua và độ dài bài.

## Phong cách video

Cột bên trái liệt kê các phong cách video có sẵn, mỗi phong cách có ảnh nhỏ vẽ từ chính bài của bạn (mọi ảnh nhỏ cùng khung ngang, dù phong cách là dọc, vuông hay ngang). Bấm để đổi. Phong cách quyết định màu nền, kiểu nốt, chữ và vị trí các khối trên khung.

Khi bạn đã chỉnh gì đó, tên phong cách có thêm chữ "đã chỉnh". Mỗi phong cách giữ bản chỉnh dở của riêng nó: đổi sang phong cách khác rồi quay lại vẫn còn nguyên. Muốn về bản gốc thì rê chuột vào ô và bấm **×**; vẫn hoàn tác được bằng Ctrl+Z. Bản chỉnh dở của mọi ô được nhớ theo trình duyệt (tải lại trang vẫn còn). Nút nhân bản trên ô tạo preset mới từ bản đang thấy. Dấu cộng dưới danh sách thêm preset từ tệp `.json` (xem [Cài đặt](04-cai-dat.md)).

Phía trên khung có dòng ghi kích thước và tỉ lệ khung (ví dụ `1,080 × 1,080 · 1:1`) và tên phong cách đang dùng.

## Tỉ lệ khung

Bộ chọn **9:16 · 1:1 · 16:9** ở đầu khung đổi tỉ lệ video: 9:16 cho TikTok, Shorts, Reels; 1:1 là khung vuông; 16:9 là khung ngang. Các khối trên khung co giãn theo tỉ lệ mới, rồi bạn chỉnh lại vị trí ở thẻ Chỉnh sửa nếu cần. Mỗi phong cách video nhớ tỉ lệ riêng của nó. Bấm **Hoàn tác** để về tỉ lệ cũ.

## Bài

Mục **Bài** ở cột phải cho biết tên tệp, định dạng, độ dài, tempo, số track và số nốt.

### Tempo

Ở Nâng cao, bảng tempo nằm trong mục gập **Chỉnh tempo** của mục **Bài**: bấm vào để mở. Mục này tự mở khi tệp thiếu tempo hoặc bạn đã đặt tempo riêng.

Nếu tệp không có tempo (một số tệp MIDI) thì ứng dụng tạm dùng 120 BPM và nói rõ ở mục **Bài**; gõ tempo thật vào ô **BPM** rồi bấm **Áp dụng tempo**. Bài được đọc lại với tempo mới, các thiết lập khác của bạn giữ nguyên. **Dùng tempo của tệp** bỏ tempo bạn đặt.

Chế độ Nâng cao có bảng điểm tempo cho bài đổi tempo hoặc nhịp giữa chừng: mỗi dòng là một vị trí, BPM và dấu nhịp (ví dụ `3/4`, `6/8`). Vị trí gõ theo **Thời gian** (`1:30.5`), **Reaper** (`5.3.50`) hoặc **Bar.beat.sixteenth** (`5.3.2`). Tempo bạn đặt thay hoàn toàn tempo trong tệp.

### Nạp âm thanh

Bấm **Nạp âm thanh** để chọn bản mix của bài (WAV, MP3, OGG, FLAC hoặc M4A). Âm thanh phát cùng video khi bạn bấm phát. Không bắt buộc: không có âm thanh thì video vẫn chạy bình thường.

- **Đổi âm thanh** để chọn tệp khác, **Gỡ** để bỏ.
- Nếu tệp âm thanh dài hoặc ngắn hơn bài khá nhiều, ứng dụng sẽ báo. Lệch đều theo một tỉ lệ thường là do tempo đọc sai; lệch nhiều thì có thể bạn chọn nhầm tệp.
- **Offset** (chế độ Nâng cao): dùng khi âm thanh và nốt không khớp nhau. Gõ số mili giây hoặc bấm −/+. Mỗi lần bấm là 1 ms, giữ Shift là 10 ms, giữ Alt là 100 ms. Dòng chữ bên dưới cho biết âm thanh đang sớm hay trễ bao nhiêu. Nút ↺ cạnh Offset đưa về 0.

## Track

Mục **Track** liệt kê các track có nốt. Có hai cách trình bày, chọn bằng nút **Danh sách** / **Lưới**:

- **Danh sách:** mỗi track một dòng gọn ở cột phải.
- **Lưới:** mỗi track một thẻ, xếp dưới khung xem trước. Chọn số cột hoặc để Tự động. Nếu màn hình không đủ rộng, ứng dụng hiện ít cột hơn và báo cho bạn.
- Nút ↺ cạnh kiểu trình bày hoặc số cột đưa về mặc định (Danh sách, số cột tự động).

Trên mỗi track:

- **Ô màu:** đổi màu track trong video. Chọn **Dùng màu của dự án** để quay về màu gốc.
- **Mắt:** ẩn hoặc hiện track trong video.
- **S (solo):** chỉ hiện các track đang solo.
- Hàng trên cùng điều khiển mọi track: mắt để ẩn/hiện tất cả, S để bỏ mọi solo.
- **Ẩn hoặc solo nhanh:** bấm giữ vào một mắt (hoặc S) rồi kéo lên hoặc xuống qua các track khác; mọi track đi qua được đặt cùng trạng thái với lần bấm đầu. Cả lần kéo là một bước hoàn tác.
- **Đổi thứ tự** (cả Cơ bản lẫn Nâng cao): kéo tay nắm sáu chấm, hoặc chọn dòng rồi bấm Alt+Lên / Alt+Xuống. Track ở trên được vẽ đè lên track ở dưới khi nốt trùng nhau.

Ẩn, solo và thứ tự track chỉ đổi video, không đổi tệp dự án của bạn.

### Chi tiết track

Bấm tên track (hoặc **Chi tiết**) để xem tầm cao độ, mức fader, pan, các automation có trong dự án và track có đang tắt tiếng trong DAW không.

**Độ sáng nền** (Nâng cao): mặc định mọi nốt sáng như nhau. Bạn có thể cho nốt sáng tối theo âm lượng của track:

- **Âm lượng:** theo automation âm lượng trong dự án, đổi dần theo bài.
- **Mức fader:** theo vị trí fader, không đổi suốt bài.
- **Pan**, **Mute:** đang thử nghiệm.
- **Sàn** và **Trần** (dB): âm lượng từ mức Sàn trở xuống là tối nhất, từ mức Trần trở lên là sáng nhất.
- **Độ sáng thấp nhất / cao nhất:** giới hạn độ sáng của nốt.
- **Đảo chiều:** to thì tối, nhỏ thì sáng.
- Ô **Hiện tại** cho biết độ sáng của track ở vị trí đang phát.
