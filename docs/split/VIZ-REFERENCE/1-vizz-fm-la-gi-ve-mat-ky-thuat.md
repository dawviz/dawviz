---
doc: VIZ-REFERENCE.md
doc_title: "Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**"
section: "1. vizz.fm là gì về mặt kỹ thuật"
path: "1. vizz.fm là gì về mặt kỹ thuật"
chunk: 1-vizz-fm-la-gi-ve-mat-ky-thuat.md
source_lines: 5-18
source_sha1: 1ee00dca1b
ids: []
---
## 1. vizz.fm là gì về mặt kỹ thuật

* **3D thật**: dựng bằng three.js (trang đặt `window.__THREE__ = "185"`, tức bản r185), WebGL, camera phối cảnh, lưới tam giác, instancing, shader và hậu kỳ nhiều lượt. Không phải 2.5D.
* Một visualizer chiếm cả khung, vẽ **thời gian thực** từ âm thanh đang phát (mic, tệp, âm thanh hệ thống). Có quay video, nhưng khung hình phụ thuộc lúc phát chứ không phải hàm thuần của `t`.
* Phần chung cho mọi visualizer:
  * **Xử lý âm thanh**: cỡ FFT 32…32768, làm mượt, độ nhạy, sàn/trần dB, gain, cổng nhiễu, suy giảm đỉnh, giảm bass, nén phổ, thang tần Linear/Log/Mel, tự hiệu chỉnh.
  * **Camera**: xoay ngang/dọc, lăn, zoom theo chu kỳ, FOV theo chu kỳ, pan, làm dẹt.
  * **Nền**: màu, gradient thẳng/tròn, hào quang, trời sao, plasma, bụi trôi, bầu trời; độ đục visualizer, mờ mép, **chế độ hoà trộn** của visualizer với nền (Normal, Luma Key, Glow, Screen, Multiply, Overlay, Soft Light, Add, Lighten, Darken…).
  * **30 hiệu ứng hậu kỳ** xếp chồng được: Echo Trails, Gradient Map, Color Tone, Barrel Distortion, Swirl, Ripple, Pond Ripple, Raindrops, Water Distortion, Kaleidoscope, Grid Tile, Concentric Tile, Hex Mirror, Radial Blur, Directional Blur, Tilt Shift, Bokeh Blur, Reflection, Neon Edge, Bloom, RGB Shift, Pixelate, Dot Screen, Glitch, Film Grain, Sepia, Bleach Bypass, CRT, Dither, ASCII, LED Screen, Vignette, Texture Overlay, Frame.
  * **Hijack Slider**: gắn bất kỳ thanh trượt nào vào âm thanh (tương đương binding của ta, T-22).
  * Preset lưu/chia sẻ bằng đường dẫn, chuyển cảnh **morph** giữa preset.

**DawViz khác ở đâu:** ta xuất video tất định (khung = hàm của `t`, tua và xuất khớp nhau), có **dữ liệu nốt, track, automation của DAW** (không chỉ âm thanh trộn sẵn), nhiều lớp/precomp/keyframe trên timeline. Vì thế mẫu nào gắn được vào nốt, Piano Roll, Bản nhạc thì giá trị cao hơn bản chép thuần âm thanh.
