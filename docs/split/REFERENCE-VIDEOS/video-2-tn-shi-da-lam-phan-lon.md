---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Video 2 (tn-shi): đã làm phần lớn"
path: "Video 2 (tn-shi): đã làm phần lớn"
chunk: video-2-tn-shi-da-lam-phan-lon.md
source_lines: 29-40
source_sha1: 7580d5f888
ids: []
---
## Video 2 (tn-shi): đã làm phần lớn

`dark-score-16x9` ghép: Particles (mảnh vuông nhiều màu theo track), **Bản nhạc** phát sáng (glow, aura theo phách) với **màu quầng đổi theo keyframe** (tím → xanh → đỏ, tính năng mới), cột âm thanh đối xứng ở trái, sóng oscilloscope ở phải, tên bài `{title}()`, "Next phase in: `{phase_remaining}`" và dải `[ {pitch_classes} ]`.

| Phần của video | Tình trạng |
|---|---|
| Nền ảnh nhân vật | Có cơ chế (`Derived.background`), nhưng ảnh là tài nguyên phiên của người dùng, không nằm trong preset |
| Phase `Synthesis.xxx()` | Cần người dùng đặt phase ở dự án; preset mặc định dùng tên bài |
| Dải phím `[ C C# E G# A# ]` giữ nguyên vị trí từng nốt | Ta xếp theo danh sách đang vang, không giữ ô cố định cho 12 lớp cao độ |
| Phiến màu bay lớn, mờ (bokeh) | Particles chỉ có tròn/vuông, không mờ theo độ sâu (xem T-106) |
| Ký hiệu nhịp `4/4`, `3/4` ở góc | Có `BAR_BEAT`/`TEMPO_INFO`, chưa đặt vào preset |
