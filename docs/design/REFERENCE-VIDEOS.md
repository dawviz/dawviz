# Video tham chiếu: ý tưởng, mức tái hiện và lộ trình

> Bốn video YouTube làm **nguồn ý tưởng** cho preset và widget. Ta không có bản quyền các video đó: video và khung hình chỉ nằm ở `references/` trên máy từng người (bị `.gitignore`, tạo lại bằng `bash scripts/references/fetch.sh`, xem `references/README.md`). Repo chỉ lấy **ngôn ngữ trình bày** (bố cục, cách dùng màu, kiểu chuyển động), không dùng tên bài, tên kênh, logo, hình nền hay âm nhạc của họ trong preset, mã hay tài liệu ngoài mục ghi công (`CREDITS.md`).

| # | Video | Kênh (ghi công) | Tệp tham chiếu | Preset | Mức tái hiện |
|---|---|---|---|---|---|
| 1 | Bản nhạc nền trắng, thanh nốt ngang | Usagin_P | `references/frames/01-usagin-last-dice/` | ``paper-light-1x1.json`` (và `paper-*` có sẵn) | Gần khớp |
| 2 | Khuông nhạc phát sáng trên nền ảnh tối, hạt, visualizer dọc | tn-shi | `references/frames/02-tn-shi-synthesis/` | ``dark-score-16x9.json`` | Khá khớp (thiếu ảnh nền và dữ liệu phase của người dùng) |
| 3 | Bảng điều khiển phân tích nhạc nền hồng nhạt | Emocute | `references/frames/03-emocute-kawaii-bass/` | `analysis-dashboard-16x9.json` | Khá khớp (còn thiếu stems và vectorscope; loudness một phần) |
| 4 | Khung dọc có parallax, nghiêng, đường vector | Silentroom | `references/frames/04-silentroom-limen/` (đoạn từ 1:01: `late/`) | chưa có | Thấp: cần camera/độ sâu |

## Cách đối chiếu bằng trình duyệt

```bash
cd apps/web && npx vite --port 5311 &              # hoặc thêm --serve vào lệnh dưới
node scripts/references/shot.mjs presets/scene/dark-score-16x9.json --times 0:20,0:40 --out references/shots
```

Script mở ứng dụng bằng Playwright, nạp dự án (mặc định `test/fixtures/Reaper/BigProject4.rpp`), nhập preset ở cột Phong cách rồi chụp canvas ở các mốc. Đặt ảnh chụp cạnh khung tham chiếu để chỉnh. Fixture không có âm thanh nên các visualizer âm thanh (cột, sóng) không hiện trong ảnh chụp; kiểm riêng bằng dự án có audio.

## Video 1 (Usagin_P): đã làm

Bố cục `paper-*` đã dựa trên kênh này (D-51, [UI-DIRECTION](UI-DIRECTION.md)). Lần này đối chiếu thêm và làm `paper-light`:

- Dòng đếm thứ hai là **Num played events: a/b (pct)** với a, b tính cả sự kiện bắt đầu và kết thúc nốt (b = 2 × số nốt): placeholder mới `{events}`, `{events_total}`, `{events_pct}`.
- Tiêu đề mảnh hơn (bản gốc dùng nét Light 300; **Space Grotesk 300 đã đóng gói** (T-109), chỉ nạp khi scene dùng chữ mảnh; mục Chữ có ô **Độ đậm** Mảnh/Thường/Đậm), chữ đếm xám nhạt hơn, vạch phát hồng mảnh (1 px), tên hợp âm không đậm.
- Còn lệch: dòng nhật ký nốt của video hiện cả năm nốt gần nhất, ta hiện một dòng rồi `+N`; nốt trong video chuyển ra rìa phải mờ dần như bị "nhoè" (ta dùng màu xám cho nốt sắp tới); chưa có nhãn phiên bản nhỏ ở góc dưới.

## Video 2 (tn-shi): đã làm phần lớn

`dark-score-16x9` ghép: Particles (mảnh vuông nhiều màu theo track), **Bản nhạc** phát sáng (glow, aura theo phách) với **màu quầng đổi theo keyframe** (tím → xanh → đỏ, tính năng mới), cột âm thanh đối xứng ở trái, sóng oscilloscope ở phải, tên bài `{title}()`, "Next phase in: `{phase_remaining}`" và dải `[ {pitch_classes} ]`.

| Phần của video | Tình trạng |
|---|---|
| Nền ảnh nhân vật | Có cơ chế (`Derived.background`), nhưng ảnh là tài nguyên phiên của người dùng, không nằm trong preset |
| Phase `Synthesis.xxx()` | Cần người dùng đặt phase ở dự án; preset mặc định dùng tên bài |
| Dải phím `[ C C# E G# A# ]` giữ nguyên vị trí từng nốt | Chủ dự án quyết định **bỏ** (PITCH_STRIP không làm): dải `[ {pitch_classes} ]` dùng Ô chữ như cũ |
| Phiến màu bay lớn, mờ (bokeh) | Particles chỉ có tròn/vuông, không mờ theo độ sâu (xem T-106) |
| Ký hiệu nhịp `4/4`, `3/4` ở góc | Có `BAR_BEAT`/`TEMPO_INFO`, chưa đặt vào preset |

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

## Video 4 (Silentroom, từ 1:01 đến hết): lộ trình

Nền đen; các khung dọc (đường vector uốn cong, piano roll mảnh) **lệch parallax** khi camera trôi, hơi **nghiêng phối cảnh**, kèm **phản chiếu** mờ phía dưới và hạt bokeh mờ nhiều lớp.

| Hiệu ứng | Đã có | Còn thiếu |
|---|---|---|
| Parallax theo lớp | xoay 2D (`layout.rotation`, `anchor`), `scale`, keyframe mọi thuộc tính số | **camera ảo + độ sâu mỗi widget** (`depth`); vị trí lệch theo góc nhìn |
| Nghiêng phối cảnh | — | biến đổi phối cảnh cho cả khung widget (Canvas 2D chỉ có affine: cần chia lưới tam giác hoặc vẽ widget ra bề mặt phụ rồi chiếu) |
| Đường vector (Lissajous/vectorscope) | `path` primitive, Oscilloscope | **stereo L/R** (bộ phân tích hiện chỉ mono) và widget Vectorscope với độ dài vệt mờ dần |
| Piano roll dạng đường mảnh, phản chiếu | `PIANO_ROLL` (độ dày, `heightScale`) | thuộc tính **phản chiếu** (lật dọc, mờ dần) cho widget |
| Bokeh, mờ theo độ sâu, bloom | `shadowBlur` làm glow, Particles | mờ theo độ sâu (`ctx.filter` không đồng đều giữa trình duyệt; cần thử ở Export Worker), bloom toàn khung |

## Quyết định: chuỗi cảnh và chia sẻ preset (D-66)

> **Cập nhật 2026-11-24 (D-69):** chuỗi cảnh nay làm bằng precomp trong scene (lớp `COMP` + sổ `scene.comps`, lồng tối đa 4 cấp) trên timeline lớp của Editor, không còn manifest riêng; ý "thời gian cục bộ trong cảnh, dữ liệu nhạc theo toàn bài" và phần chia sẻ bên dưới giữ nguyên.

Video 2 và 4 đổi giao diện theo đoạn nhạc. Thay vì một preset khổng lồ tự chia thời gian, ta dùng **nhiều preset trọn vẹn + manifest thời gian của dự án**:

- **Manifest** là dạng lưu của chuỗi cảnh: danh sách `{preset, từ, đến, chuyển cảnh}` và một lớp chung luôn bật. Nó đi cùng dự án, không nằm trong preset. Preset không chứa mốc thời gian nào, nên dùng lại cho bài dài ngắn khác nhau.
- **Thời gian cục bộ**: trong một cảnh, `t_cảnh = t − từ`; keyframe và `time.progress` tính theo cảnh. Render Core vẫn tất định (chỉ thêm offset).
- **Không làm** mốc theo phần trăm bài, phase chia đều hay một preset dùng chung tự co giãn.
- **Chia sẻ**: A. bộ preset (`collection`, chọn từng preset hoặc một preset lẻ; không mốc thời gian, không tệp DAW) và C. dự án đầy đủ (DAW + manifest + preset đã dùng). Không có kiểu "bộ preset kèm kịch bản".
- **Trùng tên khi nhập**: hỏi người dùng ghi đè hoặc đổi tên (không tự quyết); chuỗi cảnh tham chiếu bằng id nội bộ.
- **Lưu ý khi làm**: id widget phải có không gian tên theo cảnh; mọi cảnh cùng tỉ lệ khung; chỉ vẽ cảnh đang hiện hoặc đang chuyển, Bản nhạc dựng sẵn cho từng cảnh; mỗi cảnh có nền riêng; preset chia sẻ không được chứa tên bài, tên track hay đường dẫn tệp.

## Task đề xuất (đã vào `PROGRESS`)

| ID | Việc | Phụ thuộc |
|---|---|---|
| T-104 | Camera ảo và độ sâu: `depth` mỗi widget, parallax theo quỹ đạo camera (keyframe được), sau đó nghiêng phối cảnh. Đo chi phí ở Export Worker trước | spike nhỏ về chiếu phối cảnh trên Canvas 2D |
| T-105 | Stereo trong bộ phân tích âm thanh (L/R, mid/side) và widget Vectorscope | `audioFeatures.ts` |
| T-106 | Hậu kỳ: phản chiếu, mờ theo độ sâu, bloom; hạt mờ (bokeh) | T-104 (độ sâu) |
| T-107 | Widget Khung ô, Degree, Dots (video 3): **xong** | `KEY_SCALE`, `CHORD_DETECTION` |
| T-108 | Loudness (momentary/integrated/peak) và nhiều nguồn âm thanh (stems) | `audioFeatures.ts`, `audioEngine.ts` |
| T-109 | Đóng gói thêm Space Grotesk 300 (tiêu đề mảnh của video 1): **xong**. Dải phím `[ C C# … ]` giữ ô cố định: **bỏ** theo quyết định chủ dự án | — |

Gộp với việc "thống nhất khả năng keyframe cho mọi widget" đã bàn: mỗi hiệu ứng mới ở trên phải keyframe được ngay từ đầu.
