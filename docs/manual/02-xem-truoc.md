# Thẻ Xem trước

[Mục lục](README.md) · [English](en/02-preview.md)

Thẻ Xem trước là nơi xem video sẽ ra sao và chỉnh nhanh những thứ thuộc về bài nhạc: phong cách video, âm thanh, track nào hiện.

## Phát bài

Thanh phát nằm dưới khung xem trước.

| Nút | Việc |
|---|---|
| ⏮ | Về đầu bài (phím Home) |
| « / » | Lùi hoặc tới 5 giây |
| ▶ | Phát hoặc tạm dừng (phím Space) |
| Thanh tua | Kéo hoặc bấm để nhảy tới chỗ khác |
| ⟳ | Bật hoặc tắt phát lặp |

Bên trái thanh tua là vị trí hiện tại, bên phải là độ dài bài.

## Phong cách video

Cột bên trái liệt kê các phong cách video có sẵn, mỗi phong cách có ảnh nhỏ vẽ từ chính bài của bạn. Bấm để đổi. Phong cách quyết định màu nền, kiểu nốt, chữ và vị trí các khối trên khung.

Khi bạn đã chỉnh gì đó, tên phong cách có thêm chữ "đã chỉnh". Đổi sang phong cách khác sẽ thay toàn bộ, nhưng bạn có thể hoàn tác ngay bằng Ctrl+Z.

Phía trên khung có dòng ghi kích thước và tỉ lệ khung (ví dụ `1,080 × 1,080 · 1:1`) và tên phong cách đang dùng.

## Bài

Mục **Bài** ở cột phải cho biết tên tệp, định dạng, độ dài, tempo, số track và số nốt.

### Nạp âm thanh

Bấm **Nạp âm thanh** để chọn bản mix của bài (WAV, MP3, OGG, FLAC hoặc M4A). Âm thanh phát cùng video khi bạn bấm phát. Không bắt buộc: không có âm thanh thì video vẫn chạy bình thường.

- **Đổi âm thanh** để chọn tệp khác, **Gỡ** để bỏ.
- Nếu tệp âm thanh dài hoặc ngắn hơn bài khá nhiều, ứng dụng sẽ báo. Lệch đều theo một tỉ lệ thường là do tempo đọc sai; lệch nhiều thì có thể bạn chọn nhầm tệp.
- **Offset** (chế độ Nâng cao): dùng khi âm thanh và nốt không khớp nhau. Gõ số mili giây hoặc bấm −/+. Mỗi lần bấm là 1 ms, giữ Shift là 10 ms, giữ Alt là 100 ms. Dòng chữ bên dưới cho biết âm thanh đang sớm hay trễ bao nhiêu.

## Track

Mục **Track** liệt kê các track có nốt. Có hai cách trình bày, chọn bằng nút **Danh sách** / **Lưới**:

- **Danh sách:** mỗi track một dòng gọn ở cột phải.
- **Lưới:** mỗi track một thẻ, xếp dưới khung xem trước. Chọn số cột hoặc để Tự động. Nếu màn hình không đủ rộng, ứng dụng hiện ít cột hơn và báo cho bạn.

Trên mỗi track:

- **Ô màu:** đổi màu track trong video. Chọn **Dùng màu của dự án** để quay về màu gốc.
- **Mắt:** ẩn hoặc hiện track trong video.
- **S (solo):** chỉ hiện các track đang solo.
- Hàng trên cùng điều khiển mọi track: mắt để ẩn/hiện tất cả, S để bỏ mọi solo.
- **Đổi thứ tự** (Nâng cao): kéo tay nắm sáu chấm, hoặc chọn dòng rồi bấm Alt+Lên / Alt+Xuống. Track ở trên được vẽ đè lên track ở dưới khi nốt trùng nhau.

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
