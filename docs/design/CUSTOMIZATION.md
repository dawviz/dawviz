# Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng

> **[ĐÃ CHỐT ở tài liệu v1.1, 2026-11-12]** Phạm vi từng bản phát hành: BRD §4.4 (D-40); yêu cầu: SRS §3.8. Thiết kế cho mục tiêu "tùy biến cao nhất có thể": người dùng dàn dựng khung hình gần như tự do, **nhiều khả năng hơn và dễ dùng hơn** kiểu storyboard viết bằng lệnh (như osu!), thao tác hoàn toàn trên giao diện web. **Không** sao chép mô hình hay tương thích định dạng storyboard của osu! (OI-15 đã đóng: không nhập `.osb`). Tài liệu mở rộng AD-07/D-37 ([ANIMATION](ANIMATION.md)) và kế hoạch cộng đồng ([COMMUNITY-CONTENT](../COMMUNITY-CONTENT.md)). Quyết định mới: AD-08…AD-12, D-38; vấn đề mở OI-16 (OI-15 đã đóng). Task: T-17…T-25, T-27 trong [PROGRESS.md](../../PROGRESS.md). Các yêu cầu ở mục 9 đã vào SRS §3.8 (REQ-GRAPHICS-09…13, REQ-STORAGE-05/06).

## 1. Mục tiêu và ranh giới

**Mục tiêu.** Mọi thứ nhìn thấy trong khung hình đều chỉnh được: hình dạng và kiểu nốt, cách nốt xuất hiện, chạm vạch phát và biến mất, đường cong chuyển động, hạt, ảnh, chữ, lớp phủ, và dàn dựng theo thời gian bài nhạc. Người dùng lưu thành preset, chia sẻ và đóng góp cho cộng đồng mà không cần sửa mã.

**Ranh giới cố định (không đổi vì tùy biến):**

1. **Tất định** (ARC-01, D-06, AD-07): khung hình là hàm thuần của `(scene, ast, assets, t)`. Không có trạng thái tích luỹ giữa các khung, nên tua tới/lui và xuất video luôn khớp Preview.
2. **Chỉ dữ liệu, không mã** (AD-08): storyboard, preset và template là JSON được kiểm bằng schema. Không chạy script của người dùng trong v1. Chia sẻ preset vì vậy an toàn.
3. **Ngân sách hiệu năng có giới hạn cứng** (mục 7): ví dụ số hạt tối đa, kích thước ảnh. Vượt giới hạn thì kẹp lại và báo cảnh báo, không làm treo trình duyệt.

## 2. Nguyên tắc dễ dùng

Storyboard viết bằng lệnh (kiểu osu!: mỗi dòng một lệnh `F`, `M`, `S`… kèm mili-giây và số hiệu easing) rất mạnh nhưng khó: phải viết tay hoặc viết script sinh ra hàng nghìn dòng. DAW Visualizer nhắm **nhiều khả năng hơn nhưng ít công sức hơn**, theo bốn tầng; người dùng dừng ở tầng nào cũng có kết quả đẹp:

| Tầng | Người dùng làm gì | Ví dụ |
|---|---|---|
| 1. Chọn | Bấm một theme hoặc preset | "Neon rơi", "Mưa hạt", "Tối giản" |
| 2. Chỉnh | Thanh trượt và ô màu cho những gì đang thấy | độ dày nốt, hướng rơi, số hạt, đường cong easing chọn từ danh sách |
| 3. Dàn dựng | Timeline: kéo keyframe, gắn thuộc tính vào dữ liệu nhạc | logo hiện ở điệp khúc, nền nháy theo nhịp, màu đổi theo độ mạnh nốt |
| 4. Nâng cao | Đồ thị giá trị/tốc độ, easing tự vẽ, biểu thức ([EXPRESSIONS](EXPRESSIONS.md)) | đường cong riêng, `0.5 + note.velocity/127 * sin(beat.phase*TAU)` |

Các quy tắc giữ cho việc tùy biến dễ:

* **Sinh từ dữ liệu nhạc trước, keyframe tay sau.** Template theo nốt (mục 3.2) và bindings (mục 3.3) làm phần lớn công việc; người dùng không phải đặt keyframe cho từng nốt.
* **Thời gian theo nhạc** (`bar.beat`) là mặc định, có bắt dính vào nhịp; đổi tempo thì cảnh vẫn khớp.
* **Xem trước tức thì** khi kéo bất kỳ thanh trượt hay keyframe nào; tua tự do vì khung hình là hàm của `t`.
* **Mọi thứ đều lưu được thành preset** và áp lên dự án khác với một cú bấm.
* **Hoàn tác mọi thao tác** (T-07); không có thao tác phá huỷ không quay lại được.
* Tên hiệu ứng và easing hiển thị bằng chữ dễ hiểu kèm hình động minh hoạ nhỏ, không bắt người dùng nhớ tên kỹ thuật.

## 3. Mô hình dữ liệu storyboard (AD-08)

```text
SceneDocument (đã có kế hoạch ở T-05)
├─ settings      kích thước, fps, nền, phông mặc định
├─ assets[]      tham chiếu tài nguyên theo băm nội dung (mục 6)
├─ layers[]      thứ tự vẽ; mỗi lớp: visible, locked, blend, opacity
│   └─ elements[]
│       ├─ NoteLayer       Piano Roll / làn rơi; dùng NoteStyle + NoteTransition
│       ├─ Widget          8 widget HUD (SRS §3.4)
│       ├─ Sprite          ảnh tĩnh hoặc sprite sheet
│       ├─ Text            chữ (tên bài, lời, bộ đếm)
│       ├─ Shape           chữ nhật, tròn, đa giác, đường SVG đơn giản
│       └─ ParticleEmitter (mục 5)
└─ bindings      liên kết thuộc tính ↔ dữ liệu nhạc (mục 3.3)
```

### 3.1 Thuộc tính có keyframe

Mọi thuộc tính số hoặc màu của phần tử là một `Track<T>`:

```json
{ "x": { "keys": [
    { "at": { "beat": 0 },  "value": 0,   "ease": "linear" },
    { "at": { "beat": 4 },  "value": 640, "ease": { "cubicBezier": [0.25, 0.1, 0.25, 1] } },
    { "at": { "sec": 12.5 }, "value": 320, "ease": "easeOutElastic" } ] } }
```

* Mốc `at` nhận `sec`, `beat`, `bar.beat` hoặc `tick`. Mốc nhạc được quy đổi qua `TempoMap` lúc dựng chỉ mục, không đổi lúc vẽ.
* `ease` ở keyframe áp cho đoạn **đi tới** keyframe đó.
* Trước keyframe đầu và sau keyframe cuối, thuộc tính giữ nguyên giá trị.
* Màu nội suy trong không gian OKLab để chuyển màu không bị xỉn ở giữa.

### 3.2 Template theo nốt (NoteTransition)

Đây là phần giúp tùy biến dễ nhất: không phải đặt keyframe tay cho hàng nghìn nốt, mà khai báo **một template** áp cho mọi nốt (hoặc theo track). Mỗi nốt có bốn pha, mỗi pha có thời lượng, easing và hiệu ứng:

| Pha | Khi nào | Ví dụ hiệu ứng |
|---|---|---|
| `enter` | Trước nốt bắt đầu một khoảng `lead` | rơi xuống, trượt vào, phóng to, mờ dần hiện ra, morph từ hình khác |
| `hit` | Lúc nốt chạm vạch phát | bật sáng, nảy, rung, toả hạt, gợn sóng |
| `sustain` | Trong lúc nốt kêu | thở (co giãn theo nhịp), dịch màu, phát hạt liên tục |
| `exit` | Sau khi nốt tắt | tắt dần, vỡ thành hạt, thu nhỏ, bay lên |

Template dựng sẵn (preset `kind: "note-transition"`):

| Tên | Mô tả |
|---|---|
| `scroll-left` | Piano Roll hiện tại (nốt trôi từ phải sang trái) — mặc định |
| `fall-down` | Nốt rơi từ trên xuống bàn phím (kiểu Synthesia) |
| `rise-up` | Nốt bay lên từ bàn phím |
| `drop-bounce` | Rơi rồi nảy khi chạm vạch (easing `easeOutBounce`) |
| `pop-in` | Phóng từ 0 lên kích thước thật (`easeOutBack`) |
| `fade-scale` | Mờ hiện và co giãn nhẹ |
| `morph` | Hình dạng biến đổi: viên tròn khi chờ, thanh dài khi kêu; hoặc nốt trước morph thành nốt sau trong cùng track |
| `shatter` | Khi tắt, vỡ thành hạt (cần bộ phát hạt) |
| `ripple` | Gợn tròn lan ra lúc chạm |

**Morph** (AD-11): chỉ morph giữa các hình **cùng họ** để đảm bảo tất định và rẻ: chữ nhật bo góc ↔ viên thuốc ↔ tròn (nội suy bán kính bo và kích thước), và đa giác ↔ đa giác sau khi lấy mẫu lại về cùng số đỉnh. Morph giữa đường SVG bất kỳ để sau (OI-16). Các hiệu ứng khác ngoài morph: [ANIMATION-CATALOG.md](ANIMATION-CATALOG.md).

Hướng cuộn và vị trí vạch phát là tham số của NoteLayer (`direction: left | right | up | down`, `playhead: 0..1`). Nhờ vậy `fall-down` chỉ là một cấu hình, không phải mã riêng.

### 3.3 Liên kết dữ liệu nhạc (bindings)

Thuộc tính có thể **lấy giá trị từ dữ liệu nhạc** thay cho keyframe, kèm ánh xạ miền và easing:

| Nguồn | Ví dụ dùng |
|---|---|
| `note.velocity`, `note.pitch`, `note.durationSec` | Kích thước, màu, cường độ phát sáng theo độ mạnh nốt |
| `track.automation.volume` / `pan` (đã có trong AST) | Độ sáng track (đã làm), vị trí ngang theo pan |
| `beat.phase`, `bar.phase` (0..1 trong mỗi nhịp) | Nhấp nháy, thở theo nhịp |
| `activeNotes.count`, `activeNotes.maxVelocity` | Độ rung màn hình, mật độ hạt |
| `audio.rms` (sau khi có audio, T-08) | Phản ứng theo âm lượng; phải tính trước thành bảng theo thời gian để giữ tất định |
| `track.audio.rms`, `track.audio.band(lo, hi)` (bản 1.2) | Phản ứng theo âm thanh của **riêng một track**; cần người dùng nạp stem của track đó (SRS REQ-AUDIO-01) |

Dạng khai báo: `{ "bind": "note.velocity", "from": [0, 127], "to": [0.4, 1.2], "ease": "easeInQuad" }`. Khi cần kết hợp nhiều nguồn, điều kiện hay hàm toán học, dùng **biểu thức** (`{ "expr": "…" }`) chạy bằng trình thông dịch an toàn: xem [EXPRESSIONS.md](EXPRESSIONS.md) (AD-13). Biểu thức vẫn là dữ liệu, nên AD-08 giữ nguyên.

## 4. Đường cong chuyển động (easing) (AD-09)

`packages/render-core/src/motion.ts` (T-15, mở rộng ở T-17). Mọi easing là hàm thuần `f: [0,1] → ℝ` với `f(0)=0` và `f(1)=1` (riêng `back`, `elastic` và `spring` được phép vượt quá biên).

| Nhóm | Hàm |
|---|---|
| Cơ bản | `linear`, `step` (`steps(n, start|end)`), `hold` |
| Penner (In / Out / InOut) | `Sine`, `Quad`, `Cubic`, `Quart`, `Quint`, `Expo`, `Circ`, `Back`, `Elastic`, `Bounce` → 30 hàm, cộng `easeOutElasticHalf` và `easeOutElasticQuarter` |
| CSS | `cubicBezier(x1, y1, x2, y2)`: giải `x(s)=t` bằng Newton, dự phòng chia đôi khi không hội tụ, cố định số vòng lặp để kết quả tất định |
| Vật lý | `spring({ stiffness, damping, mass })` dạng **công thức đóng** (dưới tắt, tắt tới hạn, quá tắt), chuẩn hoá để kết thúc ở 1 |
| Tự vẽ | `curve([[x, y], …])`: các điểm điều khiển, nội suy Catmull-Rom đơn điệu theo `x` |

**Giao diện đồ thị:** khung vẽ đường cong có các nút kéo (giống trình soạn cubic-bezier của trình duyệt), một chấm chạy thử, danh sách dựng sẵn và ô nhập số. Đường cong lưu thành preset `kind: "easing"`.

**Test:** biên `f(0)`/`f(1)`, tính đơn điệu khi được cam kết, `cubicBezier(0,0,1,1)` ≡ `linear`, và cùng đầu vào luôn cho cùng giá trị khi chạy nhiều lần.

## 5. Hạt (particles) không trạng thái (AD-10)

Mô phỏng hạt thông thường tích luỹ theo từng khung, nên tua sẽ sai và xuất video không khớp Preview. Ở đây **mỗi hạt được tính trực tiếp từ thời điểm sinh của nó**:

```text
hạt i của lần phát e:  seed = hash(emitterId, e, i)          // PRNG mulberry32, không dùng Math.random
  tuổi a = t − tSinh;  nếu a < 0 hoặc a > life(seed) thì không vẽ
  vị trí  = p0 + v0·(1 − e^(−k·a))/k + ½·g·a²                // trọng lực + lực cản dạng đóng
  nhiễu   = noise2D(seed, a)·turbulence                       // nhiễu giá trị tất định, không phải mô phỏng
  opacity, size, color, rotation = Track theo tuổi chuẩn hoá a/life, kèm easing
```

* **Nguồn phát:** khi nốt bắt đầu (`hit`), liên tục trong lúc nốt kêu (`sustain`), khi nốt tắt (`exit`/`shatter`), tại vạch phát, theo nhịp (`beat`), hoặc môi trường (bụi, sao, tuyết).
* **Hình hạt:** chấm, vòng, sao, tia, hoặc ảnh lấy từ tài nguyên của phiên.
* **Tham số:** số hạt, tốc độ, góc toả, trọng lực, lực cản, nhiễu, tuổi thọ, kích thước, màu (cố định, theo nốt, theo track, hoặc gradient), chế độ hoà trộn (`additive` cho phát sáng).
* **Không hỗ trợ:** va chạm, hạt tương tác với nhau, chất lỏng. Những thứ này cần mô phỏng từng bước, trái với tính tất định.
* **Chi phí:** mỗi khung chỉ duyệt các lần phát còn sống trong cửa sổ `[t − lifeMax, t]`, nhờ chỉ mục theo thời gian giống `buildIndex` của nốt.

## 6. Tài nguyên (assets) của phiên và của cộng đồng (AD-12)

### 6.1 Tài nguyên người dùng thêm vào phiên

* **Loại nhận:** ảnh (PNG, JPEG, WebP, GIF lấy khung đầu), SVG (chỉ vẽ qua `<img>`/`ImageBitmap`, không chèn vào DOM, nên không chạy script), sprite sheet (ảnh kèm lưới), phông (WOFF2, TTF, OTF qua `FontFace`). Video và âm thanh để sau.
* **Lưu trữ:** IndexedDB (Dexie, REQ-STORAGE-01), định danh bằng **SHA-256 của nội dung**. Cùng tệp nạp hai lần chỉ lưu một bản. Storyboard tham chiếu `asset:sha256-…` chứ không dùng tên tệp.
* **Giới hạn:** ví dụ 20 MB mỗi tệp, 200 MB mỗi phiên, cạnh ảnh tối đa 8192 px. Tệp vượt giới hạn bị từ chối kèm mã lỗi (`ERR_ASSET_TOO_LARGE`, `ERR_ASSET_DECODE`).
* **Xuất video:** tài nguyên được giải mã trước thành `ImageBitmap` và phông được nạp vào Worker xuất. Pre-flight (REQ-EXPORT-00) báo thiếu tài nguyên trước khi bắt đầu xuất.
* **Đóng gói:** Project Pack (REQ-STORAGE-03) chứa luôn tài nguyên, nên mở trên máy khác vẫn đủ.

### 6.2 Đóng góp lên thư viện cộng đồng

Luồng trong ứng dụng: **"Chia sẻ thành preset" → điền tên, mô tả, tác giả, giấy phép (bắt buộc, SPDX) → tải xuống gói `.dawviz-preset.zip`** (JSON và tài nguyên kèm theo, có băm). Sau đó có hai đường:

1. Người biết Git: mở pull request vào repo `dawviz-community` (T-16).
2. Người không biết Git: mở issue theo mẫu và đính kèm gói. Người duy trì kiểm rồi chuyển thành pull request.

CI của repo cộng đồng kiểm: schema, kích thước, giấy phép được phép, không có tài nguyên trùng băm, ảnh giải mã được, và sinh `index.json` có băm. Ứng dụng tải `index.json`, xác minh băm trước khi dùng, và lưu đệm để chạy được khi ngoại tuyến.

### 6.3 Các loại preset

Thêm các `kind` mới bên cạnh `note-style` đang có:

| `kind` | Nội dung |
|---|---|
| `note-style` | Kiểu dáng nốt (đã có, REQ-GRAPHICS-07) |
| `note-transition` | Template bốn pha (mục 3.2) |
| `easing` | Đường cong tự vẽ (mục 4) |
| `particle` | Cấu hình bộ phát hạt (mục 5) |
| `theme` | Gói kết hợp: kiểu nốt, chuyển cảnh, hạt, màu nền, phông |
| `scene` | Storyboard hoàn chỉnh hoặc một phần (lớp, phần tử), có chỗ trống để gắn vào dự án bất kỳ |

Mỗi preset có `schemaVersion` và được di trú khi lược đồ đổi (REQ-STORAGE-04). Trường lạ bị bỏ qua, giá trị ngoài miền bị kẹp.

## 7. Hiệu năng và giới hạn

| Hạng mục | Giới hạn đề xuất v1 (đo lại ở T-27) |
|---|---|
| Hạt sống cùng lúc | 5.000 khi xem trước, 20.000 khi xuất (xuất không cần thời gian thực) |
| Phần tử trong một cảnh | 500 |
| Keyframe trong một thuộc tính | 10.000 |
| `shadowBlur` (phát sáng) | Tốn nhất trên Canvas 2D; khi vượt ngân sách thì dùng ảnh phát sáng dựng sẵn thay cho blur |

Canvas 2D đủ cho v1. Nếu đo thấy không đạt 60 fps xem trước, bước tiếp theo là vẽ hạt và nốt bằng WebGL2 trong cùng Render Core. Thay đổi này cần một Spike riêng và test so sánh ảnh Preview↔Export.

## 8. Quyết định đề xuất

| ID | Quyết định | Lý do |
|---|---|---|
| **AD-08** | Storyboard, template và preset là **dữ liệu JSON có schema**; v1 không chạy script của người dùng. | An toàn khi chia sẻ; kiểm được bằng CI; tất định |
| **AD-09** | Bộ easing gồm Penner (30), `cubicBezier`, `steps`, `spring` dạng công thức đóng và đường cong tự vẽ, đặt trong `motion.ts` của Render Core. | Phủ mọi đường cong thông dụng (kể cả của CSS); Preview và Export dùng chung |
| **AD-10** | Hạt **không trạng thái**: tính theo tuổi bằng PRNG có seed và chuyển động dạng đóng; không mô phỏng từng bước, không va chạm. | Giữ tua ngẫu nhiên và WYSIWYG (D-06) |
| **AD-11** | Morph chỉ giữa các hình cùng họ (chữ nhật bo góc ↔ tròn, đa giác cùng số đỉnh sau khi lấy mẫu lại). | Rẻ, tất định; morph SVG tự do để sau (OI-16) |
| **AD-12** | Tài nguyên định danh bằng SHA-256 nội dung, lưu IndexedDB, đóng gói vào Project Pack; SVG chỉ vẽ dạng ảnh. | Không trùng, xác minh được, chặn script trong SVG |

Ở cấp sản phẩm, những quyết định này được tóm thành **D-38** trong BRD.

## 9. Yêu cầu tương ứng (đã đưa vào SRS §3.8)

| ID dự kiến | Nội dung tóm tắt | Nghiệm thu (gợi ý) |
|---|---|---|
| REQ-GRAPHICS-09 | Thư viện easing và trình soạn đồ thị | Cùng `t` cho cùng giá trị; biên đúng; lưu và nạp preset `easing` |
| REQ-GRAPHICS-10 | Template chuyển cảnh nốt bốn pha, có ít nhất 9 template dựng sẵn | Tua tới/lui bằng nhau; ảnh Preview và Export trùng nhau |
| REQ-GRAPHICS-11 | Hạt không trạng thái | Đặt `t` trực tiếp cho cùng ảnh với chạy liên tục tới `t` |
| REQ-GRAPHICS-12 | Storyboard: lớp, phần tử, keyframe theo giây hoặc nhịp, bindings | Đổi tempo thì keyframe theo nhịp vẫn khớp nhịp |
| REQ-STORAGE-05 | Tài nguyên của phiên (băm, giới hạn, đóng gói) | Nạp trùng không nhân đôi dung lượng; Pack mở trên máy khác đủ tài nguyên |
| REQ-STORAGE-06 | Chia sẻ và nhập preset cộng đồng, có xác minh băm | Preset sai băm hoặc sai schema bị từ chối kèm mã lỗi |

## 10. Khả thi

**Khả thi.** Kiến trúc hiện tại (khung hình là hàm thuần của `t`, Render Core tách khỏi giao diện, preset là JSON có schema) là nền đúng cho toàn bộ hướng này. Không cần đổi kiến trúc, chỉ mở rộng Render Core và thêm giao diện soạn.

| Phần | Độ khó | Ước lượng (ngày làm việc, agent và người phản hồi nhanh) | Rủi ro chính |
|---|---|---|---|
| Easing và trình soạn đồ thị (T-17) | Thấp | 2–3 | Không đáng kể |
| Template chuyển cảnh nốt và hướng cuộn (T-18) | Trung bình | 4–6 | Cần mắt người duyệt hình |
| Morph cùng họ hình (T-19) | Trung bình | 2–3 | Đa giác lấy mẫu lại |
| Hạt không trạng thái (T-20) | Trung bình | 4–6 | Hiệu năng `shadowBlur` và số hạt |
| Tài nguyên của phiên (T-21) | Trung bình | 3–5 | Phông trong Worker xuất; hạn mức IndexedDB |
| Storyboard: timeline, keyframe, bindings (T-22, T-23) | **Cao** | 10–15 | Trải nghiệm soạn thảo, undo/redo, hiệu năng timeline |
| Preset mới và chia sẻ (T-24) | Thấp–Trung bình | 3–4 | Di trú lược đồ |
| Thư viện cộng đồng (T-16, T-25) | Trung bình | 4–6 | Quy trình duyệt và giấy phép (con người, không phải mã) |
| Đo hiệu năng và quyết định WebGL (T-27) | Trung bình | 2–4 | Phụ thuộc phần cứng |
| **Tổng** | | **khoảng 34–52 ngày ≈ 7–10 tuần**, cộng thêm vào lịch v1.0 (khoảng 7 tuần) | |

**Đã chốt (D-40, BRD §4.4):** bản 1.0 gồm easing, template nốt, morph cùng họ, hạt, tài nguyên phiên, mô hình storyboard và preset mới; bản 1.1 gồm trình soạn storyboard đầy đủ và thư viện cộng đồng; morph SVG tự do ở 1.2. Ước lượng ở bảng trên đã được gộp vào lịch tổng ở PROGRESS §5. Mô hình dữ liệu ở mục 3 được thiết kế ngay từ T-05 để không phải đổi lược đồ về sau.

## 11. Vấn đề mở

* **OI-15 (đã đóng 2026-11-12):** Không nhập storyboard osu! (`.osb`) và không làm giống mô hình của osu!; hướng đi là tùy biến nhiều hơn và dễ dùng hơn (mục 2).
* **OI-16 (đã đóng):** biểu thức có từ 1.0 ([EXPRESSIONS.md](EXPRESSIONS.md)); morph SVG tự do ở 1.2 (D-44).
* Danh mục đầy đủ các hiệu ứng và kiểu nội suy để chọn phạm vi: [ANIMATION-CATALOG.md](ANIMATION-CATALOG.md).
