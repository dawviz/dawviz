# Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**

> Ghi chép khảo sát ngày 2026-11-28: mở https://vizz.fm/app/ bằng Playwright (Chromium headless, WebGL chạy trên GPU thật), nạp một tệp âm thanh tự tổng hợp (trống, bass, hợp âm, giai điệu), chụp **cả 13 visualizer và 135 biến thể**, đọc danh sách điều khiển của từng visualizer. Ảnh chụp chỉ để xem trên máy, **không đưa vào repo** (không có bản quyền), như cách làm ở [REFERENCE-VIDEOS](REFERENCE-VIDEOS.md). Tài liệu này chỉ ghi kỹ thuật và ý tưởng; tên mẫu của vizz.fm chỉ để dẫn chiếu, preset của ta đặt tên riêng. Liên quan: [CUSTOMIZATION §12](CUSTOMIZATION.md) (hướng 3D), [VISUAL-LAYERS](VISUAL-LAYERS.md) (PSD, Hình, phát sáng theo nhạc), [ANIMATION-CATALOG](ANIMATION-CATALOG.md).

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

## 2. Ba mức vẽ trong DawViz

| Mức | Cách vẽ | Giới hạn |
|---|---|---|
| **A. 2D** | Canvas 2D hiện tại: `rect`, `poly`, `path`, chữ, ảnh | Phát sáng (`shadowBlur`) đắt khi nhiều hình |
| **B. 2.5D giả lập** | Render Core tự chiếu điểm 3D → 2D (ma trận camera, chia phối cảnh), sắp theo chiều sâu, vẽ bằng Canvas 2D | Không có bộ đệm độ sâu, không ánh sáng/đổ bóng, không shader; vài nghìn đoạn/điểm mỗi khung |
| **C. WebGL** | Lớp ghép WebGL2 + backend 3D (đề xuất three.js, như vizz.fm) | Cần Spike, quyết định thêm phụ thuộc, ngưỡng so ảnh Preview↔Export |

"2.5D" trong D-47 là tấm phẳng nghiêng trong không gian; mức B ở đây rộng hơn một chút: điểm và đường 3D chiếu xuống, đủ cho đường hầm, vòng, lưới thưa. Mẫu nào cần mặt lưới dày, đổ bóng, bloom hay shader toàn khung thì phải mức C.

## 3. Từng visualizer

Cột **DAW** gợi ý cách gắn vào dữ liệu nốt, Piano Roll hoặc Bản nhạc; đó là preset mới mà công cụ chỉ nghe âm thanh không làm được.

| Visualizer (số biến thể) | Thấy gì khi chụp | Điều khiển chính | Mức | DAW / preset mới |
|---|---|---|---|---|
| **Mesh Grid** (16) | Mặt lưới địa hình nhô theo phổ; dạng dây, chấm, mặt tô; uốn cầu, tròn, nhiều tầng chồng; xoắn phổ; thác thời gian | grid width/depth, wave height/speed, noise, mesh bend, sphere wrap, circle shape, waterfall, spectrum spiral, surface fill, dots | C (thưa: B) | **Địa hình Piano Roll**: hàng = cao độ, cột = thời gian, nốt nhô thành khối; camera bay dọc bài |
| **Equalizer Rings** (9) | Vòng đồng tâm bằng chuỗi chấm/cầu, nhấp nhô theo phổ, nhìn nghiêng; xoắn | rings, height, spheres per ring, wave scale, spiral twist, ring spacing | B | **Vòng quãng tám**: mỗi vòng một quãng tám, góc = lớp cao độ (như Vòng cao độ), nốt đang vang nhô lên |
| **Wavy Form** (13) | Hàng chục đường sóng chồng theo chiều sâu, vòng, ống, dải sáng | line count/spacing, depth movement, glow, frequency impact | B (glow mạnh: C) | **Đường theo track**: mỗi track một đường, độ cao = mật độ/velocity nốt |
| **Textured Sphere** (11) | Khối cầu biến dạng gai/nhiễu, "lục địa", đổ bóng, phản chiếu | sphere detail, displacement, noise, continents | C | Cầu nhô theo nốt: vị trí trên cầu = cao độ × thời gian |
| **Dot Grid** (7) | Ma trận chấm to nhỏ theo phổ; đối xứng, toả tròn, xoắn, nhô 3D | grid size, radial/symmetric/mirror, trail, spiral, height displacement | A (nhô 3D: B) | Mở rộng **Lưới nốt** (D-77): chế độ ma trận chấm đối xứng/toả tròn |
| **Particle Dance** (6) | Đám hạt hút về điểm nóng, đường nối giữa hạt, bokeh | count, attraction, damping, breeze, connections, hotspots, density glow | A/B (bokeh: C) | Hạt sinh theo nốt (đã có) + **nối các nốt cùng hợp âm**, hút về tâm hợp âm |
| **Audio Tunnel** (8) | Đường hầm vòng/đa giác lao tới, xoắn, nan hoa, vệt | sides, radius, ring spacing, speed, twist, spin, sway, spokes, streaks, FOV | B | **Đường hầm nhịp**: mỗi vòng một phách/ô, số cạnh = số phách của nhịp, nốt là chấm trên vòng theo cao độ, tốc độ theo tempo |
| **Frequency Hallway** (6) | Cột phổ đối xứng nhân bản theo trục Y/Z thành hành lang | bar count/width/height, peak color, Y/Z copies, wireframe | A (nhân Z: B) | **Hành lang phím**: cột theo phím đàn thay vì dải FFT |
| **Polar Curves** (4) | Đường cong tham số sáng (hoa hồng, Lissajous, harmonograph, nút xuyến…), nét đứt chạy | equation (24 loại), C1…C6, 3D mode, dash, glow, breathe | A (3D: B) | **Đường cong hợp âm**: tỉ lệ tần của quãng giữa hai nốt → harmonograph/Lissajous; số cánh = số nốt hợp âm |
| **Light Fall** (6) | Vệt sáng chảy về điểm tụ, uốn cong | trail count, spread, speed, path meander, dot density | B (glow mạnh: C) | **Piano Roll phối cảnh**: mỗi nốt một vệt sáng chảy về bàn phím (kiểu Synthesia 3D); gần với góc chảy T-59 + nghiêng mặt phẳng |
| **Classic Spectrum** (12) | Cột LED, đối xứng, vòng tròn, giữ đỉnh, rơi kiểu vật lý, lịch sử thành khối 3D | bar count/gap, mirror, layout bars/circle, segment rows, peak hold, fall style, history depth | A (lịch sử 3D: B) | Mở rộng **Phổ tần**; **VU theo track/phím** từ velocity nốt |
| **Nostalgia** (12) | Shader toàn khung: đường hầm, kính vạn hoa, hoa, tia, có phản hồi khung trước | tunnel, flower, star, feedback, persistence, glass, blur | C | Nền chuyển động cho preset; tham số theo đoạn (phase) và hợp âm |
| **Studio Tools** (9) | Bảng phân tích: phổ thời gian (spectrogram), thác 3D, phổ, dao động ký, vectorscope, LUFS, giọng + tempo, nốt | time window, min/max Hz, color map, 3D waterfall, axis labels Hz/Notes | A (thác 3D: B) | **Phổ thời gian khớp phím Piano Roll** (trục tần theo nốt); bổ sung cho bảng phân tích P-02…P-13 (vectorscope, LUFS đã thiếu ở REFERENCE-VIDEOS #3) |

## 4. Hiệu ứng chung của vizz.fm đối chiếu với ta

| Nhóm | Ta có gì | Làm bằng |
|---|---|---|
| Camera xoay/zoom/pan theo chu kỳ | Chưa (D-47: camera 2.5D ở 1.1) | B rồi C |
| Hoà trộn với nền (Add, Screen, Multiply…) | Chưa | A: `globalCompositeOperation` (xem VISUAL-LAYERS §1.3) |
| Nền trời sao, bụi trôi, gradient | Ảnh nền, màu nền | A (sao/bụi tất định theo hạt giống) |
| Nền plasma, mọi shader toàn khung | Không | C |
| Vignette, khung, kết cấu phủ, nhiễu hạt, pixelate | Không | A |
| Bloom, RGB shift, glitch, blur, méo ống kính, kính vạn hoa, CRT, ASCII, LED | Không | C (T-36) |
| Echo Trails, Persistence (phản hồi khung trước) | Không | Đặc biệt, xem §5 |
| Gắn thanh trượt vào âm thanh | Có: 9 nguồn binding + lane automation | Thêm dải tần bass/mid/high (VISUAL-LAYERS §3) |
| Morph giữa preset | Phase, chuyển cảnh nốt | Chuyển cảnh giữa phase dùng lại được |

## 5. Ràng buộc tất định

Khung của ta là hàm thuần của `t` (AD-07). Ba thứ của vizz.fm không thoả trực tiếp:

1. **Phản hồi khung trước** (Echo Trails, Persistence, Nostalgia feedback): khi tua phải dựng lại. Cách làm: vẽ thêm K khung trước `t` (K nhỏ, ví dụ 8–16) rồi trộn, hoặc thay bằng vệt giải tích (lịch sử của từng điểm tính được từ `t`). Chỉ hợp lý ở mức C.
2. **Mô phỏng hạt có lực hút** (Particle Dance): trạng thái phụ thuộc quá khứ. Cách làm như hạt hiện có: công thức kín theo tuổi hạt, hoặc mô phỏng bước cố định có điểm lưu mỗi N giây (tua tới điểm lưu gần nhất rồi chạy tiếp).
3. **Làm mượt âm thanh theo thời gian thực** (peak decay, smoothing): ta đã làm theo `t` (`smoothedBands` tấn công/nhả), giữ được.

## 6. Đề xuất lộ trình

| Bước | Gồm | Mức | Ghi chú |
|---|---|---|---|
| 1 | Phổ tần: cột LED, giữ đỉnh, kiểu rơi, đối xứng; Lưới nốt: ma trận chấm đối xứng/toả tròn; Hành lang phím; Polar Curves (widget Đường cong) | A | Làm được trong 1.0/1.1, không phụ thuộc WebGL |
| 2 | Spectrogram khớp phím, dao động ký, vectorscope, LUFS | A | Cần giữ mẫu L/R và tính K-weighting khi phân tích âm thanh |
| 3 | Camera + phép chiếu trong Render Core; Đường hầm nhịp, Vòng quãng tám, Đường theo track, Piano Roll phối cảnh (vệt sáng) | B | Cùng mô hình camera với D-47 (1.1); đo giới hạn số đoạn ở T-27 |
| 4 | Lớp ghép WebGL2: bloom, hoà trộn GPU, hiệu ứng hậu kỳ, phản hồi khung | C | Spike WebGL (T-36), quyết định mới |
| 5 | Backend 3D (three.js): Địa hình Piano Roll dày, Cầu nhô theo nốt, nền shader | C | CUSTOMIZATION §12 |

Primitive 3D (`points3d`, `lines3d`, `meshgrid` kèm camera) nên định nghĩa ngay từ bước 3 để bước 5 chỉ đổi bộ vẽ, preset không phải viết lại.
