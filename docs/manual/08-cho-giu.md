# Chèn số liệu vào chữ

Chữ trong video có thể tự đổi theo bài nhạc. Bạn gõ tên của số liệu trong ngoặc nhọn, ví dụ `{bpm}`, và video thay nó bằng giá trị thật tại từng giây. Cách này dùng được ở mọi chữ: ô chữ bạn tự thêm, tên bài, nhãn của đồng hồ, chữ của bộ đếm nốt…

## Thêm một ô chữ

1. Mở thẻ **Chỉnh sửa**, bấm **Thêm** ở góc trên bên trái Timeline, chọn **Ô chữ**.
2. Ô chữ mới nằm giữa khung. Gõ nội dung vào ô **Nội dung** ở mục **Thiết lập**. Nhấn Enter để xuống dòng; bấm ra ngoài ô để áp.
3. Kiểu chữ, màu, viền, bóng… chỉnh ở mục **Chữ** như mọi chữ khác. Mục **Giá trị trong chữ** cho phép chỉ phần số liệu có kiểu khác phần còn lại.

Ví dụ gõ `{title} - {bpm} BPM` ra `Demo Song - 120 BPM`.

Dưới ô chữ có nút `{bpm}` và `{title}`: bấm một lần là chèn tên đó vào chỗ con trỏ. Hoặc gõ `{` thì ứng dụng gợi ý tên các số liệu; bấm một tên để điền.

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
| `{phase}`, `{next_phase}` | tên phase đang diễn ra và phase kế tiếp (trống nếu chưa có) |
| `{phase_remaining}` | thời gian còn tới khi phase kế bắt đầu (phase cuối: tới hết bài) |
| `{phase_elapsed}` | thời gian đã qua trong phase hiện tại |
| `{phase_no}` | số thứ tự phase (1 là phase đầu, 0 là chưa tới phase đầu) |
| `{chord}` | tên hợp âm đang đọc được; trống nếu không có |
| `{notes}` | mọi nốt đang vang, từ thấp lên cao, ví dụ `C4 E4 G4` |
| `{rhythm}` | khoảng cách giữa các lần có nốt vang lên gần nhất, tính bằng **móc kép** (một phần mười sáu ô nhịp 4/4), ví dụ `3 3 2`. Nốt lệch lưới hiện số lẻ (`2.5`) |
| `{bass}` | nốt thấp nhất của từng lần vang gần nhất: bậc so với **nốt chủ** (`1 1 4 ♭2`) khi đã đặt nốt chủ ở Editor, không thì tên nốt (`C2 C2 F2`) |
| `{lengths}` | độ dài của các nốt gần nhất theo **phân số nốt đen**, ví dụ `1/2 1/8 3/2` |
| `{pitch_classes}` | tên các nốt đang vang, không kèm quãng tám, thấp đến cao: `C E G` |
| `{played}`, `{total}` | số nốt đã phát, tổng số nốt |
| `{events_pct}` | phần trăm sự kiện đã xảy ra (kèm `%` ở bộ đếm nốt, giống `{pct}`) |
| `{events}`, `{events_total}` | số sự kiện đã xảy ra, tổng số sự kiện; mỗi nốt có hai sự kiện (bắt đầu và kết thúc) nên tổng gấp đôi số nốt |
| `{pct}` | phần trăm nốt đã phát, số nguyên |
| `{key}` | tên nốt chủ của giọng (không kèm trưởng/thứ); trống nếu chưa biết |
| `{degree}` | bậc của hợp âm đang vang theo giọng, ví dụ `VIm7`; chưa biết giọng thì hiện tên hợp âm |
| `{next_chord}`, `{next_degree}` | hợp âm kế tiếp (tên khác hợp âm đang vang) và bậc của nó |
| `{chord_count}` | số lần hợp âm đã đổi tính tới thời điểm này |
| `{lows}`, `{mids}`, `{highs}` | phần trăm năng lượng âm thanh ở dải trầm (dưới 250 Hz), giữa và cao (trên 4 kHz) |
| `{level}` | mức âm hiện tại tính bằng dB, trong khoảng 400 ms gần nhất |
| `{level_avg}`, `{peak_db}` | mức âm trung bình và mức đỉnh, tính bằng dB |

`{tempo}` là tên cũ của `{bpm}`: vẫn dùng được và cho đúng cùng kết quả, nhưng ứng dụng không gợi ý nữa.

Số liệu tính theo các track đang hiện (xem [thẻ Xem trước](02-xem-truoc.md) để ẩn hoặc solo track). Muốn một widget chỉ đọc vài track, chọn ở mục **Track** trong **Thiết lập** của nó: **Chọn track** rồi bấm vào các track cần. Bấm giữ rồi kéo qua nhiều dòng để chọn hoặc bỏ nhanh (cả lần kéo là một bước hoàn tác); **Chọn tất cả** và **Bỏ chọn tất cả** ở đầu danh sách. Nút ↺ cạnh chữ **Track** (hoặc Alt+nhấp vào chữ đó) đưa về **Mọi track đang hiện**. Ô chữ có mục này ở chế độ Cơ bản; bộ đếm nốt, nốt đang phát và hợp âm có ở Nâng cao.

Tên nốt và hợp âm trong các chỗ giữ (`{notes}`, `{chord}`, `{bass}`, `{pitch_classes}`, `{name}`) theo **Cách ghi tên nốt** của cả dự án. Các [widget phân tích](10-phan-tich.md) có tên riêng: Giọng (`{key}`, `{scale}`, `{confidence}`), Tên đoạn (`{section}`, `{next}`, `{next_in}`, `{section_no}`, `{section_elapsed}`), Mật độ nốt (`{poly}`).

Một số widget có thêm tên riêng và chúng được ưu tiên hơn tên chung: nốt đang phát có `{name}`, `{velocity}`, `{track}`, `{pitch}`; thanh tiến độ có `{elapsed}`, `{total}`, `{remaining}`, `{pct}` theo thời gian của bài (ở đó `{total}` là độ dài bài, không phải số nốt).

Giọng của `{key}`, `{degree}`, `{next_degree}`: lấy nốt chủ đã đặt ở Editor; chưa đặt thì tự nhận trong 16 giây gần nhất.

Các số `{lows}`, `{mids}`, `{highs}`, `{level}`, `{level_avg}`, `{peak_db}` cần tệp âm thanh; không có âm thanh thì hiện "—". Mức âm là dBFS tính từ độ to trung bình (RMS), **không phải LUFS** (chưa lọc theo tai người).

## Chọn cách hiện số

Thêm dấu hai chấm và một mẫu: `{tên:mẫu}`.

- **Số.** Số chữ số 0 sau dấu chấm là số chữ số thập phân. Số chữ số 0 trước dấu chấm là số chữ số tối thiểu, thiếu thì thêm 0 phía trước.
  - `{bpm:0}` ra `120`, `{bpm:0.00}` ra `120.50`, `{bar:000}` ra `007`.
  - Dùng cho `{bpm}`, `{tempo}`, `{bar}`, `{beat}`, `{played}`, `{total}`, `{pct}`, `{phase_no}`.
- **Thời gian.** `m` là phút, `ss` là giây, `S` là phần nghìn giây (1 đến 3 chữ).
  - `{time:m:ss}` ra `2:05`, `{time:mm:ss}` ra `02:05`, `{time:m:ss.SSS}` ra `2:05.789`, `{time:h:mm:ss}` ra `1:02:05`.
  - Dùng cho `{time}`, `{elapsed}`, `{remaining}`, `{total_time}`, `{phase_elapsed}`, `{phase_remaining}`.
- **Danh sách nốt.** Phần sau dấu hai chấm là chữ nối giữa các nốt: `{notes:, }` ra `C4, E4, G4`; `{notes:-}` ra `C4-E4-G4`. Dùng cho `{notes}`, `{rhythm}`, `{bass}`, `{lengths}`, `{pitch_classes}`; ví dụ `{bass: → }` ra `1 → 1 → 4 → ♭2`. Các số liệu này tính theo 8 lần nốt vang lên gần nhất của các track đang hiện (hoặc track đã chọn cho widget).

Không gõ mẫu thì dùng cách hiện mặc định như bảng trên.

Phần trăm không kèm dấu `%`; muốn có thì tự gõ: `{pct}%`. (Riêng ở bộ đếm nốt và thanh tiến độ, `{pct}` vốn đã có `%`; bộ đếm nốt còn theo ô **Số chữ số thập phân**. Gõ `{pct:0.0}` ở đó thì ra số trần.)

## Khi gõ sai

- Tên không có (gõ nhầm `{bmp}`) hoặc mẫu sai (`{bpm:m:ss}`): chữ đó giữ nguyên trong video và ứng dụng báo cảnh báo khi mở preset.
- Muốn hiện đúng dấu `{`, gõ hai dấu: `{{` ra `{`. Ví dụ `{{bpm}` ra `{bpm}`.
