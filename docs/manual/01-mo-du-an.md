# Mở dự án

[Mục lục](README.md) · [English](en/01-open-a-project.md)

## Mở tệp

Kéo tệp dự án thả vào giữa màn hình, hoặc bấm vào đó để chọn tệp. Khi đã có dự án đang mở, bấm **Mở tệp** ở góc trên để mở tệp khác. Nếu tệp mới không mở được, dự án cũ vẫn giữ nguyên.

Ứng dụng đọc được:

| Phần mềm | Tệp |
|---|---|
| Ableton Live | `.als`, gói `.alp` |
| Reaper | `.rpp` |
| Bitwig Studio, Studio One và các phần mềm khác lưu được DAWproject | `.dawproject` |
| Bất kỳ phần mềm nào xuất được MIDI | `.mid` |

Chưa có tệp nhạc trong tay? Ở màn đầu tiên bấm **Thử với dự án mẫu** để mở một dự án có sẵn.

**FL Studio:** chưa mở thẳng được tệp `.flp`. Trong FL Studio chọn File → Export → MIDI file, rồi mở tệp `.mid` vừa xuất.

**Bitwig:** tệp `.bwproject` chưa mở thẳng được. Hãy lưu thành `.dawproject` (File → Export → DAWproject).

**Ableton Live:** chỉ đọc các clip ở màn Arrangement. Clip chỉ nằm ở màn Session sẽ không hiện.

**Gói `.alp`** có thể chứa nhiều bài. Ứng dụng tự chọn bài lớn nhất và báo cho bạn biết.

## Dự án Reaper dùng tệp `.mid` bên ngoài

Một số dự án Reaper không chứa nốt trong chính tệp `.rpp` mà trỏ tới các tệp `.mid` nằm cạnh. Khi đó ứng dụng hiện một khung báo thiếu tệp và liệt kê tên các tệp cần thêm.

- Bấm **Thêm tệp .mid…** hoặc thả các tệp đó vào khung. Không cần chọn lại tệp `.rpp`.
- Tệp thường nằm cạnh tệp dự án hoặc trong thư mục Media của dự án.
- Tên tệp được so không phân biệt hoa thường; dấu cách và dấu gạch dưới được coi như nhau.
- Có thể chọn cả tệp `.rpp` và các tệp `.mid` cùng lúc ngay từ đầu.

## Cảnh báo

Nếu có gì trong tệp cần bạn để ý, một dải màu vàng hiện phía trên khung xem trước, ví dụ "2 cảnh báo". Bấm vào dải để xem đủ danh sách. Mỗi cảnh báo có phần **Chi tiết kỹ thuật** nếu bạn cần gửi báo lỗi.

Cảnh báo không chặn bạn làm việc. Một số cảnh báo hay gặp:

- **Không tìm thấy tempo:** ứng dụng dùng 120 BPM. Nếu bài không ở 120 BPM, nốt sẽ lệch so với âm thanh.
- **Một số nốt không có điểm kết thúc:** những nốt đó được cho kéo đến cuối bài.
- **Một số automation chưa đọc được:** phần hình vẫn đúng, chỉ độ sáng theo automation có thể thiếu.
- Cảnh báo có ghi **[cần kiểm chứng]** là chỗ ứng dụng đã đoán cách đọc. Nếu thấy nốt lệch ở đúng chỗ đó, hãy báo lại cho chúng tôi kèm tệp nếu được.

## Không thấy nốt nào

Nếu tệp mở được nhưng báo không có nốt:

- Dự án Reaper: kiểm tra xem có thiếu tệp `.mid` bên ngoài không (xem mục trên).
- Ableton Live: kiểm tra clip có nằm ở màn Arrangement không.
- Tệp `.mid` xuất từ phần mềm khác: mở lại tệp trong phần mềm đó xem có nốt không.
