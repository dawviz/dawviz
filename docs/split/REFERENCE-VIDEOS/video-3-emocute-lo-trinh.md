---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Video 3 (Emocute): lộ trình"
path: "Video 3 (Emocute): lộ trình"
chunk: video-3-emocute-lo-trinh.md
source_lines: 41-56
source_sha1: 796d7dc0be
ids: []
---
## Video 3 (Emocute): lộ trình

Bảng gồm sáu ô đánh số (FIFTHS, STEMS, METER, NOTES, DEGREE, DOTS) trên nền hồng nhạt, chữ mono, viền mảnh.

| Ô | Đã có | Còn thiếu |
|---|---|---|
| 00 FIFTHS (vòng quãng năm, đa giác nối các lớp cao độ đang vang, vòng tiến độ ô nhịp) | **Đã làm:** `PITCH_WHEEL` nâng cấp (nhãn bậc La Mã, nút tròn, nối nốt đang vang, vòng tiến độ ô nhịp/cả bài, số phách, vòng nốt bass, giữa hiện bậc hợp âm, dòng dưới hợp âm), `KEY_SCALE` | không |
| 01 STEMS (nhiều đường sóng, mỗi stem một dòng) | `AUDIO_SPECTRUM` kiểu Waveform cho một nguồn | **Chưa làm:** nhiều nguồn/stem cùng lúc; ta chỉ có một tệp âm thanh (T-108) |
| 02 METER (waveform + LUFS, scope, spectrum, vector) | Waveform, Oscilloscope, Spectrum; **một phần loudness:** chỗ giữ `{level}`, `{level_avg}`, `{peak_db}` là **dBFS tính từ RMS, không phải LUFS** (chưa lọc K-weighting), kèm `{lows}`/`{mids}`/`{highs}` | LUFS thật (K-weighting, integrated), **vectorscope** (cần dữ liệu trái/phải): chưa làm |
| 03 NOTES (piano roll nhỏ có vạch ô nhịp, nhãn hợp âm trên đầu) | `PIANO_ROLL` + lưới ô nhịp (`grid`: vạch ô nhịp, vạch phách mờ, số ô nhịp; 2026-11-25), tên nốt trên phím (`keyboard.labels`), `CHORD_DETECTION` | nhãn hợp âm gắn trên Piano Roll (chủ dự án đã bỏ ở T-121), viền khung |
| 04 DEGREE (dải ô bậc hợp âm: I, Imaj7, VIm7…, ô đang phát tô đậm, ô kế tiếp) | **Đã làm:** widget `DEGREE` (Bậc hợp âm: gom theo ô nhịp/nửa ô/phách/mỗi lần đổi, hàng phụ, dải chức năng T/SD/D, số ô nhịp), chỗ giữ `{degree}`, `{next_chord}`, `{next_degree}`, `{chord_count}`, `{key}` | không |
| 05 DOTS (lưới chấm theo thời gian × cao độ, độ chia lưới, tỉ lệ nốt thấp/cao) | **Đã làm:** widget `DOTS` (Lưới chấm: lưới 1/4 đến 1/32, số hàng tối đa), `{lows}`/`{mids}`/`{highs}` (cần âm thanh) | không |
| Khung ô có số thứ tự, nhãn nhỏ | **Đã làm:** widget `PANEL` (Khung ô: viền, tiêu đề đánh số, hàng số liệu tới 6 cột); primitive vẽ `poly` (đường gấp khúc/đa giác); preset `analysis-dashboard-16x9.json` ghép bố cục video 3 | không |

Thứ tự đề xuất: widget Khung ô → Degree → Dots → vòng quãng năm nâng cấp (**đã làm**, T-107) → (cần dữ liệu mới) loudness (một phần), stems, vectorscope (chưa).
