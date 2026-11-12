# Danh mục hiệu ứng chuyển động và đường cong nội suy

> **[ĐÃ CHỐT ở tài liệu v1.1, 2026-11-12]** Phạm vi từng bản phát hành: BRD §4.4 (D-40); yêu cầu: SRS §3.8. Liệt kê các loại hiệu ứng (animation) và kiểu nội suy, đồ thị tốc độ mà các trình dựng hình và dựng video hiện đại thường có (After Effects, Premiere Pro, DaVinci Resolve/Fusion, Blender, Cinema 4D, Apple Motion, CapCut, Alight Motion, Cavalry, Rive/Lottie, CSS/Web Animations). Mục đích: làm "thực đơn" đầy đủ để chọn cái nào làm, vào lúc nào. Bổ sung cho [CUSTOMIZATION.md](CUSTOMIZATION.md) (mô hình dữ liệu, AD-08…AD-12) và [EXPRESSIONS.md](EXPRESSIONS.md) (biểu thức, AD-13). Task: T-32…T-36 trong [PROGRESS.md](../../PROGRESS.md).
>
> Bảng dưới mô tả **khái niệm chung** của ngành; tên gọi và chi tiết khác nhau giữa các phần mềm. Dự án không sao chép giao diện hay mã của phần mềm nào.

## 0. Cách đọc bảng

**Ưu tiên** (đã chốt, là phạm vi chính thức): `v1.0` = bản phát hành 1.0, `v1.1` = bản 1.1, `sau` = bản 1.2 trở đi.

**Kỹ thuật:**

* `C2D`: làm được bằng Canvas 2D hiện có.
* `GL`: cần shader WebGL2 (biến dạng điểm ảnh, xử lý toàn khung); chờ Spike T-27.
* `$`: tốn tài nguyên, cần giới hạn hoặc chất lượng giảm khi xem trước.

Mọi hiệu ứng phải giữ **tất định** (AD-07): là hàm của `t`; ngẫu nhiên dùng PRNG có seed; hiệu ứng "nhớ quá khứ" (vệt, tiếng vọng) được tính bằng cách lấy mẫu lại các thời điểm trước `t`, không giữ trạng thái giữa các khung.

## 1. Kiểu nội suy keyframe (theo thời gian)

Quyết định giá trị thay đổi **thế nào** giữa hai keyframe.

| Kiểu | Mô tả | Ưu tiên |
|---|---|---|
| Hold / Constant / Step | Giữ nguyên giá trị rồi nhảy ở keyframe sau | v1.0 |
| Linear | Tốc độ đều | v1.0 |
| Bezier (tay cầm tự do) | Mỗi keyframe có tay cầm vào/ra chỉnh độc lập | v1.0 |
| Continuous / Aligned Bezier | Tay cầm vào và ra luôn thẳng hàng, đường cong mượt qua keyframe | v1.0 |
| Auto Bezier | Tự tính tay cầm cho mượt | v1.0 |
| Auto Clamped | Như Auto nhưng không vượt quá giá trị của hai keyframe lân cận (không overshoot) | v1.0 |
| Vector | Tay cầm chỉ thẳng về keyframe kề bên (góc nhọn có kiểm soát) | v1.1 |
| TCB (Kochanek–Bartels) | Ba tham số Tension, Continuity, Bias thay cho tay cầm | v1.1 |
| Catmull-Rom / Smooth | Đường cong mượt đi qua mọi keyframe, không cần tay cầm | v1.0 |
| Monotone cubic | Mượt mà không bao giờ vượt quá (hợp cho độ mờ, âm lượng) | v1.0 |
| Roving keyframe | Keyframe giữa tự trượt thời gian để **tốc độ không đổi** qua nhiều điểm | v1.1 |
| Separate dimensions | Tách `x`, `y` (và `z`) thành các đường cong riêng | v1.0 |

## 2. Thư viện easing đặt sẵn

| Nhóm | Thành phần | Ưu tiên |
|---|---|---|
| Easy Ease | Ease In, Ease Out, Ease In-Out với **influence** chỉnh được (mặc định khoảng 33%) | v1.0 |
| Đa thức Penner | `Sine`, `Quad`, `Cubic`, `Quart`, `Quint`, `Expo`, `Circ` × In/Out/InOut | v1.0 |
| "Động" Penner | `Back` (lấy đà/vượt quá, chỉnh **overshoot**), `Elastic` (chỉnh **amplitude**, **period**), `Bounce` (chỉnh số lần nảy, độ nảy) | v1.0 |
| Biến thể đảo | Out-In (nhanh–chậm–nhanh) cho mọi nhóm | v1.1 |
| CSS | `ease`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier(x1,y1,x2,y2)` | v1.0 |
| CSS `steps()` | `steps(n, jump-start / jump-end / jump-none / jump-both)` | v1.0 |
| CSS `linear()` | Đường gấp khúc nhiều điểm dừng (xấp xỉ mọi đường cong, kể cả spring) | v1.1 |
| Smoothstep | `smoothstep`, `smootherstep` | v1.0 |
| Spring vật lý | Theo `stiffness`, `damping`, `mass`, `velocity` ban đầu; hoặc kiểu thân thiện **duration + bounce** | v1.0 |
| Inertia / Decay | Giảm dần theo hàm mũ (ném rồi trôi chậm lại) | v1.1 |
| Anticipate | Lùi nhẹ trước khi đi (khác `Back` ở chỗ chỉ lấy đà đầu) | v1.1 |
| Exponential / Logarithmic | Hợp cho tần số, zoom, âm lượng (cảm nhận theo tỉ lệ) | v1.1 |
| Đường cong tự vẽ | Nhiều điểm điều khiển, nội suy monotone | v1.0 |
| Đường cong từ biểu thức | `ease = expr(x)` (AD-13) | v1.1 |

## 3. Đồ thị (Graph Editor)

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| **Value graph** | Trục dọc là giá trị thuộc tính theo thời gian | v1.0 |
| **Speed graph** | Trục dọc là **tốc độ** (độ lớn đạo hàm); kéo đỉnh để dồn chuyển động; dễ chỉnh cảm giác nhanh/chậm | v1.0 |
| Velocity + influence bằng số | Nhập tốc độ vào/ra (đơn vị/giây) và influence (%) cho từng keyframe | v1.0 |
| Hiển thị gia tốc | Đường đạo hàm bậc hai (tham khảo, chỉ xem) | sau |
| Nhiều đường cong chồng nhau | Xem `x`, `y`, độ mờ, tỉ lệ cùng lúc; tô màu theo thuộc tính | v1.1 |
| Chuẩn hoá khung nhìn | Co mọi đường cong về 0–1 để so sánh | v1.1 |
| Bắt dính | Vào keyframe, nhịp nhạc, khung hình, giá trị tròn | v1.0 |
| Thao tác tay cầm | Flatten (làm phẳng), Align, Break (tách rời), đổi kiểu hàng loạt | v1.1 |
| Co giãn thời gian vùng chọn | Kéo dãn/thu một nhóm keyframe theo tỉ lệ | v1.1 |
| Sao chép/dán easing | Dán đường cong từ keyframe này sang keyframe khác | v1.0 |
| Thư viện easing | Lưu đường cong thành preset, kéo thả áp dụng | v1.0 |
| Đường cong "ma" | Hiện đường cong trước khi sửa để so sánh | v1.1 |
| Bake | Chuyển biểu thức, binding hoặc template thành keyframe thật để chỉnh tay | v1.1 |

## 4. Nội suy không gian và kiểu giá trị

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| Motion path | Vị trí đi theo đường cong Bezier vẽ trên khung hình | v1.0 |
| Tốc độ đều theo quãng đường | Tham số hoá theo độ dài cung, để easing áp lên quãng đường chứ không lên tham số đường cong | v1.0 |
| Auto-orient | Đối tượng tự xoay theo hướng di chuyển | v1.0 |
| Màu | Nội suy trong OKLab/OKLCH; tuỳ chọn sRGB; màu sắc (hue) đi đường ngắn hoặc dài | v1.0 |
| Góc | Đi đường ngắn nhất, hoặc theo số vòng chỉ định | v1.0 |
| Tỉ lệ (scale) | Nội suy nhân (logarit) để phóng to trông đều | v1.1 |
| Xoay 3D | Quaternion (slerp), tránh khoá trục | sau |
| Hình dạng | Morph cùng họ (AD-11) | v1.0 |

## 5. Ngoại suy, lặp và bộ biến đổi đường cong

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| Extrapolate constant | Trước keyframe đầu và sau keyframe cuối giữ nguyên | v1.0 |
| Extrapolate linear | Tiếp tục theo độ dốc cuối | v1.1 |
| Loop: cycle | Lặp lại đoạn | v1.0 |
| Loop: ping-pong | Chạy tới rồi chạy lùi | v1.0 |
| Loop: offset / continue | Lặp và cộng dồn chênh lệch (ví dụ xoay mãi) | v1.0 |
| Lặp theo nhịp nhạc | Chu kỳ tính bằng beat/bar | v1.0 |
| Modifier: noise | Cộng nhiễu tất định (biên độ, tần số, seed) | v1.0 |
| Modifier: stepped | Lượng tử hoá thời gian (giật kiểu stop-motion) | v1.0 |
| Modifier: limits / clamp | Kẹp giá trị trong khoảng | v1.0 |
| Modifier: envelope | Đường bao nhân với đường cong | v1.1 |
| Modifier: generator | Hàm sóng sin/vuông/tam giác/răng cưa cộng hoặc nhân vào | v1.0 |

## 6. Hiệu ứng biến đổi cơ bản (transform)

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Move / Slide | Trượt vào/ra từ bốn hướng hoặc theo đường | v1.0 | C2D |
| Scale / Pop / Zoom | Phóng to, thu nhỏ; pop-in có overshoot | v1.0 | C2D |
| Rotate / Spin | Xoay quanh điểm neo | v1.0 | C2D |
| Anchor point | Đổi tâm xoay/co giãn, có keyframe | v1.0 | C2D |
| Skew / Shear | Xô nghiêng | v1.0 | C2D |
| Flip | Lật ngang/dọc | v1.0 | C2D |
| Tilt 3D / xoay X/Y/Z | Lớp hoặc cả cảnh xoay theo X/Y/Z trong phối cảnh (SRS REQ-GRAPHICS-15, D-47) | v1.1 | GL |
| Parenting | Phần tử con đi theo phần tử cha | v1.0 | C2D |
| Orbit / Spiral | Quay quanh một điểm, xoắn ốc | v1.0 | C2D |
| Follow / Lag | Đi theo đối tượng khác có trễ (bám đuôi) | v1.1 | C2D |

## 7. Hiện/ẩn, che và lộ (reveal)

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Fade | Mờ dần hiện/ẩn | v1.0 | C2D |
| Blink / Flicker / Strobe | Nhấp nháy đều hoặc ngẫu nhiên tất định | v1.0 | C2D |
| Linear wipe | Lộ dần theo một hướng, có viền mềm | v1.0 | C2D |
| Radial / Clock wipe | Lộ theo cung tròn như kim đồng hồ | v1.0 | C2D |
| Iris / Circle reveal | Lộ từ tâm ra ngoài | v1.0 | C2D |
| Venetian blinds | Lộ theo dải song song | v1.1 | C2D |
| Mask animate | Mặt nạ hình học có keyframe, độ mềm viền | v1.0 | C2D |
| Track matte (alpha/luma) | Lớp này làm mặt nạ cho lớp khác | v1.1 | C2D $ |
| Trim path / Draw-on | Nét vẽ tự hiện dần (vẽ chữ ký, đường viền) | v1.0 | C2D |
| Dash offset | Nét đứt chạy dọc đường | v1.0 | C2D |

## 8. Hình dạng (shape) và biến dạng hình học

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Morph cùng họ | AD-11 | v1.0 | C2D |
| Morph SVG tự do | Bản 1.2 (D-44) | sau | C2D $ |
| Round corners | Bo góc có keyframe | v1.0 | C2D |
| Pucker & Bloat | Phình ra / hóp vào các cạnh | v1.1 | C2D |
| Twist | Xoắn hình quanh tâm | v1.1 | C2D |
| Zig-zag / Roughen | Cạnh răng cưa hoặc gồ ghề tất định | v1.1 | C2D |
| Wiggle path | Đỉnh dao động theo nhiễu | v1.1 | C2D |
| Offset path | Nở hoặc co viền | sau | C2D $ |
| Repeater | Nhân bản hình theo biến đổi tích luỹ (tia, vòng, xoắn) | v1.0 | C2D |
| Squash & Stretch | Bẹp/giãn giữ thể tích khi nảy hoặc chạm | v1.0 | C2D |

## 9. Chuyển động "có vật lý" (cảm giác tự nhiên)

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Bounce | Rơi và nảy (easing Bounce hoặc công thức đóng) | v1.0 | C2D |
| Spring / Jiggle | Dao động tắt dần quanh đích | v1.0 | C2D |
| Overshoot / Settle | Vượt quá rồi trở về | v1.0 | C2D |
| Anticipation | Lấy đà trước khi chuyển động | v1.0 | C2D |
| Follow-through / Overlap | Phần phụ (đuôi, viền) trễ hơn phần chính | v1.1 | C2D |
| Pendulum | Đung đưa con lắc | v1.1 | C2D |
| Inertia | Trôi tiếp và chậm dần sau khi dừng lực | v1.1 | C2D |

## 10. Hiệu ứng thủ tục (procedural)

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Wiggle | Rung ngẫu nhiên tất định theo tần số và biên độ | v1.0 | C2D |
| Oscillate | Dao động sin/tam giác/vuông | v1.0 | C2D |
| Pulse / Breathe | Phình xẹp nhịp nhàng (gắn được với nhịp nhạc) | v1.0 | C2D |
| Shake | Rung lắc (camera hoặc đối tượng), tắt dần | v1.0 | C2D |
| Turbulence / Flow | Trôi theo trường nhiễu | v1.1 | C2D |
| Random seeded | Giá trị ngẫu nhiên cố định theo seed cho từng bản sao | v1.0 | C2D |
| Stagger / Offset | Nhiều đối tượng chạy cùng hiệu ứng, lệch nhau theo thứ tự, khoảng cách, ngẫu nhiên | v1.0 | C2D |

## 11. Màu và ánh sáng

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Color shift / Tint | Đổi màu theo thời gian hoặc dữ liệu | v1.0 | C2D |
| Hue rotate | Xoay vòng màu | v1.0 | C2D (`filter`) |
| Gradient animate | Điểm dừng gradient, góc, vị trí có keyframe | v1.0 | C2D |
| Glow / Bloom pulse | Phát sáng đập theo nhịp | v1.0 | C2D $ |
| Brightness / Contrast / Saturation | Chỉnh toàn lớp | v1.0 | C2D (`filter`) |
| Flash | Loé sáng toàn màn ở thời điểm chỉ định | v1.0 | C2D |
| Light sweep / Shine | Vệt sáng lướt qua đối tượng | v1.1 | C2D |
| Light leak | Vệt sáng màu kiểu phim | sau | C2D |
| Color grading / LUT | Bảng màu toàn khung | sau | GL |
| Invert / Posterize / Duotone | Biến đổi màu kiểu đồ hoạ | v1.1 | GL |

## 12. Làm mờ, biến dạng điểm ảnh và phong cách hoá

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Gaussian blur | Mờ đều, có keyframe | v1.0 | C2D (`filter`) $ |
| Directional / Motion blur | Mờ theo hướng chuyển động | v1.1 | GL $ |
| Radial / Zoom blur | Mờ toả từ tâm | v1.1 | GL $ |
| Motion blur thật | Lấy mẫu nhiều thời điểm trong một khung (sub-frame), chỉ khi xuất | v1.1 | C2D $ |
| Pixelate / Mosaic | Vỡ điểm ảnh | v1.1 | GL |
| Glitch | Lệch kênh RGB, dịch khối, sọc quét; ngẫu nhiên có seed | v1.1 | GL |
| Chromatic aberration | Viền màu tách kênh | v1.1 | GL |
| Wave warp / Ripple | Sóng uốn ảnh | v1.1 | GL |
| Bulge / Pinch / Swirl | Phồng, chụm, xoáy cục bộ | sau | GL |
| Displacement map | Biến dạng theo ảnh xám | sau | GL |
| Kaleidoscope / Mirror | Vạn hoa, đối xứng | v1.1 | GL |
| Film grain / Noise | Hạt phim tất định | v1.1 | GL |
| Vignette | Tối góc | v1.0 | C2D |
| Scanlines / CRT | Hiệu ứng màn hình cũ | sau | GL |

## 13. Chữ (text)

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Typewriter | Hiện từng ký tự | v1.0 | C2D |
| Text animator theo phạm vi | Áp hiệu ứng (vị trí, xoay, mờ, màu) cho ký tự/từ/dòng trong một **range selector** chạy theo thời gian | v1.0 | C2D |
| Stagger theo ký tự/từ/dòng | Lệch thời gian theo thứ tự, ngẫu nhiên, từ giữa ra | v1.0 | C2D |
| Scramble / Decode | Ký tự đổi ngẫu nhiên rồi lộ chữ thật | v1.1 | C2D |
| Counter | Số đếm chạy (BPM, số nốt, thời gian) | v1.0 | C2D |
| Karaoke highlight | Tô màu theo từng chữ khớp thời gian lời | v1.1 | C2D |
| Text on path | Chữ chạy theo đường cong | v1.1 | C2D |
| Kinetic typography | Tổ hợp các mục trên thành template sẵn | v1.1 | C2D |

## 14. Chuyển cảnh (giữa hai cảnh hoặc hai đoạn)

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Cut | Cắt thẳng | v1.0 | C2D |
| Crossfade / Dissolve | Hoà dần | v1.0 | C2D |
| Dip to color | Qua màu đen/trắng | v1.0 | C2D |
| Push / Slide | Cảnh mới đẩy cảnh cũ | v1.0 | C2D |
| Wipe / Iris / Clock | Như mục 7, áp cho cả cảnh | v1.0 | C2D |
| Zoom / Spin | Phóng hoặc xoay chuyển cảnh | v1.0 | C2D |
| Shape / Luma transition | Lộ cảnh mới theo hình hoặc ảnh xám | v1.1 | C2D $ |
| Flip / Cube 3D | Lật thẻ, xoay khối | sau | GL |
| Glitch / Blur transition | Chuyển cảnh qua glitch hoặc mờ | v1.1 | GL |

Chuyển cảnh gắn được vào **mốc nhạc**: đầu bar, marker của dự án, đổi tempo.

## 15. Camera

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Pan / Zoom / Rotate | Camera 2D có keyframe | v1.0 | C2D |
| Camera 3D | Phối cảnh hoặc trực giao, orbit, preset nghiêng chéo / isometric / đường băng (REQ-GRAPHICS-15) | v1.1 | GL |
| Camera shake | Rung camera tất định, gắn với nốt mạnh hoặc beat | v1.0 | C2D |
| Follow | Camera bám vạch phát hoặc một đối tượng | v1.1 | C2D |
| Parallax | Các lớp di chuyển với tốc độ khác nhau theo độ sâu | v1.1 | C2D |
| Ken Burns | Zoom + pan chậm trên ảnh nền | v1.0 | C2D |
| Depth of field | Mờ theo độ sâu lớp | sau | GL $ |

## 16. Nhân bản và vệt

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Grid / Array / Radial clone | Nhân bản theo lưới, hàng, vòng | v1.0 | C2D |
| Echo / Ghost trail | Vẽ thêm các bản ở thời điểm `t − k·Δ` mờ dần (không giữ trạng thái) | v1.0 | C2D $ |
| Motion trail | Vệt liền theo quỹ đạo | v1.1 | C2D |
| Instancing có stagger | Mỗi bản sao lệch thời gian, màu, seed | v1.0 | C2D |

## 17. Hạt (bổ sung cho CUSTOMIZATION §5)

| Tính năng | Ưu tiên | Kỹ thuật |
|---|---|---|
| Hình nguồn phát: điểm, đường, vòng, hình chữ nhật, theo nốt, theo chữ | v1.0 | C2D |
| Lực: trọng lực, cản, gió, nhiễu | v1.0 | C2D |
| Hút/đẩy về điểm (attractor/repeller) dạng đóng | v1.1 | C2D |
| Sub-emitter (hạt chết sinh hạt mới, ví dụ pháo hoa) | v1.1 | C2D $ |
| Vệt cho hạt | v1.1 | C2D $ |
| Hạt là ảnh hoặc sprite sheet | v1.0 | C2D |
| Hoà trộn cộng sáng | v1.0 | C2D |

## 18. Riêng cho âm nhạc (điểm mạnh của DAW Visualizer)

| Hiệu ứng | Mô tả | Ưu tiên |
|---|---|---|
| Note hit flash / pop | Bật sáng hoặc nảy khi nốt chạm vạch phát | v1.0 |
| Velocity → kích thước, sáng, màu | Ánh xạ độ mạnh nốt | v1.0 |
| Pitch → màu hoặc vị trí | Ánh xạ cao độ | v1.0 |
| Beat pulse | Nền, khung, logo đập theo phách | v1.0 |
| Bar-start accent | Hiệu ứng ở đầu mỗi ô nhịp | v1.0 |
| Sidechain pump | Mọi thứ "nhún" theo kick (lấy từ nốt của track trống) | v1.0 |
| Chord color | Đổi bảng màu theo hợp âm nhận diện được (cần widget Chord, T-06) | v1.1 |
| Piano key press | Phím lún và sáng (đã có bàn phím) | v1.0 |
| Spectrum / Waveform | Cột phổ, sóng âm (cần audio, T-08; phổ tính trước để tất định) | v1.1 |
| Automation-driven | Bất kỳ automation nào (volume, pan, tham số plugin khi parser đọc được) điều khiển thuộc tính | v1.0 |
| Lyric sync | Chữ chạy theo lời (OI-11) | sau |

## 19. Thời gian (time controls)

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| Delay / Offset | Lùi thời điểm bắt đầu của lớp hoặc hiệu ứng | v1.0 |
| Time stretch | Co giãn thời lượng một hiệu ứng | v1.0 |
| Speed ramp | Đường cong tốc độ phát của một lớp (nhanh–chậm), như "speed curve" trong trình dựng video | v1.1 |
| Time remap | Ánh xạ thời gian tuỳ ý bằng đường cong | v1.1 |
| Reverse | Chạy ngược | v1.0 |
| Freeze / Hold frame | Đứng hình một lớp | v1.0 |
| Posterize time | Giảm số khung của một lớp (kiểu stop-motion) | v1.0 |

Các điều khiển này chỉ đổi **thời gian cục bộ của hiệu ứng hoặc lớp**. Thời gian bài nhạc và đồng bộ âm thanh không đổi.

## 20. Hoà trộn và tổng hợp lớp

| Tính năng | Ưu tiên | Kỹ thuật |
|---|---|---|
| Blend mode: normal, add, screen, multiply, overlay, lighten, darken, difference, color dodge/burn, hue, saturation, color, luminosity | v1.0 | C2D (`globalCompositeOperation`) |
| Opacity lớp và nhóm | v1.0 | C2D |
| Lớp điều chỉnh (adjustment layer): hiệu ứng áp cho mọi lớp bên dưới | v1.1 | C2D $ / GL |
| Thứ tự hiệu ứng trong lớp (kéo thả sắp xếp) | v1.0 | C2D |
| Nhóm và lồng cảnh (precompose) | v1.1 | C2D |

## 21. Phạm vi đã chốt

* **v1.0** khoảng **70 mục** đánh dấu `v1.0` ở trên. Hầu hết là `C2D`, tái sử dụng chung một bộ máy: keyframe + easing (§1–5), transform/reveal (§6–7), hiệu ứng thủ tục (§10), text animator (§13), chuyển cảnh cơ bản (§14), camera 2D (§15) và hiệu ứng âm nhạc (§18).
* **v1.1:** thêm các mục `GL` sau khi Spike WebGL2 (T-27) chốt, cùng TCB, roving keyframe, speed ramp, time remap.
* Mỗi hiệu ứng đặt sẵn là **một preset** (`kind: "effect"`) dựng từ cùng một mô hình (keyframe, modifier, biểu thức). Không viết mã riêng cho từng hiệu ứng khi tránh được. Nhờ vậy cộng đồng tự tạo hiệu ứng mới mà không cần sửa ứng dụng.
