---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Video 4 (Silentroom, từ 1:01 đến hết): lộ trình"
path: "Video 4 (Silentroom, từ 1:01 đến hết): lộ trình"
chunk: video-4-silentroom-tu-1-01-den-het-lo-trinh.md
source_lines: 57-68
source_sha1: 796d7dc0be
ids: []
---
## Video 4 (Silentroom, từ 1:01 đến hết): lộ trình

Nền đen; các khung dọc (đường vector uốn cong, piano roll mảnh) **lệch parallax** khi camera trôi, hơi **nghiêng phối cảnh**, kèm **phản chiếu** mờ phía dưới và hạt bokeh mờ nhiều lớp.

| Hiệu ứng | Đã có | Còn thiếu |
|---|---|---|
| Parallax theo lớp | xoay 2D (`layout.rotation`, `anchor`), `scale`, keyframe mọi thuộc tính số | **camera ảo + độ sâu mỗi widget** (`depth`); vị trí lệch theo góc nhìn |
| Nghiêng phối cảnh | — | biến đổi phối cảnh cho cả khung widget (Canvas 2D chỉ có affine: cần chia lưới tam giác hoặc vẽ widget ra bề mặt phụ rồi chiếu) |
| Đường vector (Lissajous/vectorscope) | `path` primitive, Oscilloscope | **stereo L/R** (bộ phân tích hiện chỉ mono) và widget Vectorscope với độ dài vệt mờ dần |
| Piano roll dạng đường mảnh, phản chiếu | `PIANO_ROLL` (độ dày, `heightScale`) | thuộc tính **phản chiếu** (lật dọc, mờ dần) cho widget |
| Bokeh, mờ theo độ sâu, bloom | `shadowBlur` làm glow, Particles | mờ theo độ sâu (`ctx.filter` không đồng đều giữa trình duyệt; cần thử ở Export Worker), bloom toàn khung |
