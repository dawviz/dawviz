---
doc: VIZ-REFERENCE.md
doc_title: "Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**"
section: "3. Từng visualizer"
path: "3. Từng visualizer"
chunk: 3-tung-visualizer.md
source_lines: 29-48
source_sha1: 1ee00dca1b
ids: [D-77, P-02, P-13]
---
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
