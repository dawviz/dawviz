# Chèn số liệu vào chữ

Chữ trong video có thể tự đổi theo bài nhạc. Bạn gõ tên của số liệu trong ngoặc nhọn, ví dụ `{bpm}`, và video thay nó bằng giá trị thật tại từng giây. Cách này dùng được ở mọi chữ: ô chữ bạn tự thêm, tên bài, nhãn của đồng hồ, chữ của bộ đếm nốt…

## Thêm một ô chữ

1. Mở thẻ **Chỉnh sửa**, bấm **Thêm** ở đầu danh sách Lớp, chọn **Ô chữ**.
2. Ô chữ mới nằm giữa khung. Gõ nội dung vào ô **Nội dung** ở mục **Thiết lập**. Nhấn Enter để xuống dòng; bấm ra ngoài ô để áp.
3. Kiểu chữ, màu, viền, bóng… chỉnh ở mục **Chữ** như mọi chữ khác. Mục **Giá trị trong chữ** cho phép chỉ phần số liệu có kiểu khác phần còn lại.

Ví dụ gõ `{title} - {bpm} BPM` ra `Demo Song - 120 BPM`.

Gõ `{` thì ứng dụng gợi ý tên các số liệu; bấm một tên để điền.

## Ở các widget có sẵn

Chữ của widget có sẵn vẫn như cũ. Ở chế độ **Nâng cao**, ô chữ của từng dòng (tên bài, nghệ sĩ, nhãn đồng hồ, chữ "không hợp âm", mẫu của bộ đếm nốt, nốt đang phát, hợp âm, thanh tiến độ) đều sửa được và dùng được mọi số liệu dưới đây.

## Các số liệu

| Gõ | Ra |
|---|---|
| `{title}`, `{artist}` | tên bài, nghệ sĩ (lấy từ dự án) |
| `{time}` | thời điểm đang phát, dạng `1:35` |
| `{elapsed}` | giống `{time}` |
| `{remaining}` | thời gian còn lại |
| `{total_time}` | độ dài cả bài |
| `{bpm}` | tempo tại thời điểm đó (tối đa hai chữ số thập phân, bỏ số 0 thừa) |
| `{sig}` | nhịp, ví dụ `4/4` |
| `{bar}`, `{beat}` | ô nhịp và phách hiện tại |
| `{chord}` | tên hợp âm đang đọc được; trống nếu không có |
| `{notes}` | mọi nốt đang vang, từ thấp lên cao, ví dụ `C4 E4 G4` |
| `{played}`, `{total}` | số nốt đã phát, tổng số nốt |
| `{pct}` | phần trăm nốt đã phát, số nguyên |

`{tempo}` là tên cũ của `{bpm}`: vẫn dùng được và cho đúng cùng kết quả, nhưng ứng dụng không gợi ý nữa.

Số liệu tính theo các track đang hiện (xem [thẻ Xem trước](02-xem-truoc.md) để ẩn hoặc solo track). Muốn một widget chỉ đọc vài track, chọn ở mục **Track** trong **Thiết lập** của nó: **Chọn track** rồi tick các track cần. Ô chữ có mục này ở chế độ Cơ bản; bộ đếm nốt, nốt đang phát và hợp âm có ở Nâng cao.

Một số widget có thêm tên riêng và chúng được ưu tiên hơn tên chung: nốt đang phát có `{name}`, `{velocity}`, `{track}`, `{pitch}`; thanh tiến độ có `{elapsed}`, `{total}`, `{remaining}`, `{pct}` theo thời gian của bài (ở đó `{total}` là độ dài bài, không phải số nốt).

## Chọn cách hiện số

Thêm dấu hai chấm và một mẫu: `{tên:mẫu}`.

- **Số.** Số chữ số 0 sau dấu chấm là số chữ số thập phân. Số chữ số 0 trước dấu chấm là số chữ số tối thiểu, thiếu thì thêm 0 phía trước.
  - `{bpm:0}` ra `120`, `{bpm:0.00}` ra `120.50`, `{bar:000}` ra `007`.
  - Dùng cho `{bpm}`, `{tempo}`, `{bar}`, `{beat}`, `{played}`, `{total}`, `{pct}`.
- **Thời gian.** `m` là phút, `ss` là giây, `S` là phần nghìn giây (1 đến 3 chữ).
  - `{time:m:ss}` ra `2:05`, `{time:mm:ss}` ra `02:05`, `{time:m:ss.SSS}` ra `2:05.789`, `{time:h:mm:ss}` ra `1:02:05`.
  - Dùng cho `{time}`, `{elapsed}`, `{remaining}`, `{total_time}`.
- **Danh sách nốt.** Phần sau dấu hai chấm là chữ nối giữa các nốt: `{notes:, }` ra `C4, E4, G4`; `{notes:-}` ra `C4-E4-G4`.

Không gõ mẫu thì dùng cách hiện mặc định như bảng trên.

Phần trăm không kèm dấu `%`; muốn có thì tự gõ: `{pct}%`. (Riêng ở bộ đếm nốt và thanh tiến độ, `{pct}` vốn đã có `%`; bộ đếm nốt còn theo ô **Số chữ số thập phân**. Gõ `{pct:0.0}` ở đó thì ra số trần.)

## Khi gõ sai

- Tên không có (gõ nhầm `{bmp}`) hoặc mẫu sai (`{bpm:m:ss}`): chữ đó giữ nguyên trong video và ứng dụng báo cảnh báo khi mở preset.
- Muốn hiện đúng dấu `{`, gõ hai dấu: `{{` ra `{`. Ví dụ `{{bpm}` ra `{bpm}`.
