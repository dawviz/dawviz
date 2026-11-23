---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Video 3 (Emocute): lộ trình"
path: "Video 3 (Emocute): lộ trình"
chunk: video-3-emocute-lo-trinh.md
source_lines: 41-56
source_sha1: 70b5971deb
ids: []
---
## Video 3 (Emocute): lộ trình

Bảng gồm sáu ô đánh số (FIFTHS, STEMS, METER, NOTES, DEGREE, DOTS) trên nền hồng nhạt, chữ mono, viền mảnh.

| Ô | Đã có | Còn thiếu |
|---|---|---|
| 00 FIFTHS (vòng quãng năm, đa giác nối các lớp cao độ đang vang, vòng tiến độ ô nhịp) | `PITCH_WHEEL` (vòng quãng năm), `KEY_SCALE` | đa giác nối nốt, vòng tiến độ quanh vòng, nhãn bậc La Mã ở giữa |
| 01 STEMS (nhiều đường sóng, mỗi stem một dòng) | `AUDIO_SPECTRUM` kiểu Waveform cho một nguồn | nhiều nguồn/stem cùng lúc; ta chỉ có một tệp âm thanh |
| 02 METER (waveform + LUFS, scope, spectrum, vector) | Waveform, Oscilloscope, Spectrum | đo loudness (momentary, integrated, peak), **vectorscope** (cần dữ liệu trái/phải) |
| 03 NOTES (piano roll nhỏ có vạch ô nhịp, nhãn hợp âm trên đầu) | `PIANO_ROLL`, `CHORD_DETECTION` | nhãn hợp âm/ô nhịp gắn trên Piano Roll, viền và lưới ô nhịp mờ |
| 04 DEGREE (dải ô bậc hợp âm: I, Imaj7, VIm7…, ô đang phát tô đậm, ô kế tiếp) | dò hợp âm, giọng (`KEY_SCALE`) | quy hợp âm về bậc theo giọng, dải ô cuộn |
| 05 DOTS (lưới chấm theo thời gian × cao độ, độ chia lưới, tỉ lệ nốt thấp/cao) | primitive `rect` | widget lưới chấm; thống kê "lows/highs" |
| Khung ô có số thứ tự, nhãn nhỏ | `TEXT`, `rect` | **widget Khung ô** (viền, tiêu đề đánh số, ngăn cách) để ghép nhanh |

Thứ tự đề xuất: widget Khung ô → Degree → Dots → vòng quãng năm nâng cấp → (cần dữ liệu mới) loudness, stems, vectorscope.
