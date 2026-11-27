# Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)

> Thiết kế cho đợt tu sửa widget và ứng dụng web theo ghi chú của chủ dự án ngày 2026-11-26. Ghi lại các quyết định **D-71…D-78** (nhật ký ở [BRD §7](../product/BRD.md)) và các task **T-124…T-139** ([PROGRESS §4](../../PROGRESS.md)). Liên quan: [CUSTOMIZATION](CUSTOMIZATION.md) (binding, preset), [EXPRESSIONS](EXPRESSIONS.md) (biểu thức), [ANIMATION-CATALOG](ANIMATION-CATALOG.md) (§7 mặt nạ, §8 hình), [UI-DIRECTION](UI-DIRECTION.md), `apps/web/DESIGN.md`.

## 0. Mục tiêu một câu

**Widget đơn giản cho người mới, chỉnh sâu theo nhóm cho người quen, và một bộ công cụ nhỏ (Hình, Bút, Mặt nạ, Gắn nhạc nhanh) để người dùng nâng cao tự dựng thứ mà không widget nào làm sẵn**, thay vì cứ thêm ô vào cột bên phải của từng widget.

Ba tầng, mỗi tầng chỉ thêm, không bắt buộc:

| Tầng | Ai dùng | Thấy gì |
|---|---|---|
| 1. Widget dựng sẵn (Cơ bản) | Người mới | Vài ô chính của mỗi widget; nhóm phụ ẩn sau **Thêm tuỳ chọn** |
| 2. Nhóm thuộc tính (Nâng cao) | Người quen | Mọi thuộc tính, gom theo nhóm có tiêu đề, gấp được; nhóm có công tắc thì tắt là gọn (D-71) |
| 3. Sáng tạo tự do (Chỉnh sửa) | Người dùng nâng cao | Lớp Hình, Bút/Cọ, Mặt nạ, **Gắn nhạc nhanh** cho bất kỳ thuộc tính nào (D-74, D-75) |

Tầng 3 không cần widget mới cho từng ý tưởng: "thanh tiến độ" là một hình chữ nhật có **Cắt nét** gắn vào **Tiến độ bài**; "mắt nhân vật đổi màu theo phách" là một hình vẽ bằng Bút có **Màu tô** gắn vào **Phách**. Mọi thứ vẫn là dữ liệu preset (AD-08), tất định (AD-07), và chạy qua cùng máy keyframe/binding/biểu thức đã có (T-99, T-29).

## 1. Nhóm thuộc tính và quy tắc bật/tắt (D-71, T-124)

### 1.1 Vấn đề

Cột Thiết lập của nhiều widget là một danh sách phẳng 20–40 ô (Phổ tần, Hạt, Bản nhạc). Có ô "0 là tắt" (phát sáng), có ô tick riêng để bật (bàn phím, đỉnh của phổ), có lựa chọn "Tắt" trong danh sách (quầng của Bản nhạc); ô phụ của một tính năng đang tắt vẫn hiện.

### 1.2 Quy tắc (chủ dự án chọn phương án A, 2026-11-26)

1. **Một ý nghĩa, một điều khiển.** Tính năng mà giá trị 0 đã nghĩa là tắt (phát sáng, độ dày viền, độ dày nét) **không** có công tắc riêng.
2. **Ô phụ đi theo ô chính.** Ô chỉ có nghĩa khi tính năng bật (bán kính phát sáng, màu viền) **ẩn khi ô chính là 0**. Ngoại lệ: ô phụ đang có keyframe/binding thì vẫn hiện (không giấu hoạt hình của người dùng).
3. **Nhóm có công tắc.** Nhóm có từ 2 ô trở lên dùng chung một trạng thái bật/tắt tự nhiên (bàn phím, lưới, đỉnh phổ, hiệu ứng chữ, bóng, nền chữ, chớp theo phách, chấm phách) có **công tắc ở tiêu đề nhóm**. Tắt: ẩn các ô con, nhóm còn một dòng tiêu đề. Giá trị con được giữ.
4. **Lựa chọn có "Tắt".** Danh sách có giá trị tắt (Quầng: Tắt/Đều/Theo phách…, Vạch phát: Không/Vạch, Vòng tiến độ: Tắt/Ô nhịp/Bài) đứng ở tiêu đề nhóm thay cho công tắc; chọn "Tắt" thì ẩn ô con.
5. **Không làm cả hai.** Nhóm có công tắc thì các ô số bên trong không mang nghĩa "0 là tắt" nữa (ví dụ khoảng cách bóng = 0 chỉ là bóng nằm ngay dưới chữ).
6. **Công tắc là thuộc tính.** Công tắc ghi vào đúng thuộc tính bool sẵn có (`keyboard.enabled`, `peakCap`, `animator.enabled`…), nên vẫn đặt keyframe bậc được và preset cũ đọc như cũ. Không đổi lược đồ.

### 1.3 Mô hình dữ liệu (chỉ ở `apps/web`)

`lib/widgetFields.ts` thêm vào `FieldDef`:

```ts
sec?: SectionId;          // nhóm chứa ô: 'look' | 'notes' | 'playhead' | 'keyboard' | 'grid' | 'glow' | 'colour' | 'peaks' | 'motion' | 'text' | 'timing' | 'frame' | …
```

và một bảng `WIDGET_SECTIONS[type]`: thứ tự nhóm, nhãn, và **điều khiển ở tiêu đề** (`toggle: path` cho quy tắc 3, `choice: path` cho quy tắc 4, vắng = nhóm thường). Quy tắc 2 viết bằng `when` như hiện nay (`when: (P) => P.glow > 0`), `WidgetSettings` tự giữ ô có hoạt hình.

`WidgetSettings` vẽ mỗi nhóm thành một tiêu đề con (chữ 12 px đậm, mũi tên gấp, công tắc hoặc danh sách ở bên phải), nhớ trạng thái gấp theo `<loại widget>.<nhóm>` bằng kho `sectionState` sẵn có. Nhóm không còn ô nào hiện (Cơ bản, hoặc bị `when` ẩn hết) thì ẩn luôn tiêu đề. **Tìm thiết lập** giữ nguyên: khớp tên nhóm thì hiện cả nhóm.

Timeline keyframe dùng **cùng** nhóm: `propGroup()` (đã làm 2026-11-26, đoán theo đường dẫn) đổi sang đọc `sec` của `FieldDef` khi có, đoán theo đường dẫn chỉ còn là dự phòng cho Piano Roll và đường dẫn không có trong bảng. Một chỗ khai báo, hai nơi hiện giống nhau (Thiết lập và Timeline), như After Effects.

### 1.4 Rà từng widget

Rà theo bốn câu hỏi, ghi kết quả vào `widgetFields.ts` và test `widgetFields.test.ts`:

1. Ô này thuộc nhóm nào? (mọi ô phải có `sec`, test bắt ô thiếu)
2. Có ô "0 là tắt" nào đang có thêm công tắc không? (bỏ công tắc)
3. Ô phụ nào đang hiện khi tính năng tắt? (thêm `when`)
4. Ô nào không áp dụng cho kiểu/hình dạng đang chọn? (D-72)

Ví dụ đã thấy khi rà sơ bộ:

| Widget | Thay đổi |
|---|---|
| Phổ tần | Nhóm: Kiểu (kiểu, hình dạng, số cột, thang), Hình học (theo hình dạng: Thẳng có góc/độ dài, Tròn có bán kính/góc bắt đầu), Cột (bề rộng, bo góc, độ dài tối thiểu: chỉ kiểu Cột/Chấm), **Đỉnh** (công tắc `peakCap` + tốc độ rơi + kiểu đỉnh, T-130), Màu, Phát sáng, Phản hồi (attack/release/dB/Hz) |
| Piano Roll | Nhóm: Nốt, Màu, Phát sáng (0 là tắt, ô phụ ẩn), Vạch phát (công tắc `playheadVisible`), Bàn phím (công tắc `keyboard.enabled`), Lưới (công tắc ghép ba ô tick hiện có), Dải cao độ |
| Bản nhạc | Nhóm: Bản nhạc (phông, số ô nhịp, giọng…; đổi thì dựng lại), Màu, Phóng to khi phát (`zoom` = 1 là tắt, ô phụ ẩn), Phát sáng (0 là tắt), Quầng (danh sách có Tắt ở tiêu đề), Vạch phát (danh sách Không/Vạch ở tiêu đề), Nét tay (`rough` = 0 là tắt, ẩn rung/seed) |
| Hạt | Nhóm: Phát ra, Chuyển động, Kích thước, Màu, Điểm xuất phát |
| Ô chữ | Nhóm: Chữ, Hiệu ứng chữ (công tắc `animator.enabled`) |
| Nhịp phách | Nhóm: Chấm phách (công tắc `dots`) |
| Tempo | Nhóm: Đường tempo (công tắc `showCurve`), Chớp (công tắc `flash`) |

Mục **Chữ** (`TextPanel`) đã gần đúng quy tắc: Bóng và Nền có ô tick (quy tắc 3), Viền theo độ dày (quy tắc 1–2). Chỉ đổi ô tick thành công tắc ở tiêu đề nhóm cho thống nhất.

## 2. Ẩn hẳn thuộc tính không áp dụng (D-72, T-125)

Ô không có tác dụng với lựa chọn hiện tại (ví dụ ô của Phổ tần dạng Thẳng khi đang chọn Tròn) **ẩn hẳn**, không làm mờ. Lý do: cột phải đã dài; ô mờ vẫn chiếm chỗ và vẫn bị hỏi "sao chỉnh không đổi". Giá trị ẩn vẫn giữ trong preset (đổi lại hình dạng là có lại). Ngoại lệ như quy tắc 2: ô có hoạt hình vẫn hiện.

Cách kiểm: mỗi `when` mới kèm một test Render Core chứng minh thuộc tính đó **không** đổi chuỗi hình trong trường hợp bị ẩn (đổi giá trị, so `layoutFrame` trước/sau), để `when` không giấu nhầm ô có tác dụng.

## 3. Kiểu chữ dùng chung (D-73, T-126)

### 3.1 Hiện trạng

Kiểu chữ đã là của dự án (`scene.textStyles`, REQ-GRAPHICS-18) và mọi widget chữ trong dự án đều chọn được. Cái khó là giao diện: nút **Lưu thành kiểu mới / Cập nhật kiểu / Bỏ thay đổi** nằm cuối mục Chữ và chỉ hiện ở Nâng cao; hai nút sau bị mờ mà không nói vì sao; **Cập nhật kiểu** đổi mọi chỗ dùng kiểu đó mà không cho biết là bao nhiêu chỗ; không đổi tên, không xoá được; không mang kiểu sang dự án khác.

### 3.2 Thiết kế

- **Thanh Kiểu chữ ở đầu mục Chữ, cả Cơ bản và Nâng cao:** `[Kiểu: Tiêu đề ▾] [•] [⋯]`. Chấm • hiện khi chỗ chữ đang có thay đổi so với kiểu (giống "Paragraph style +" của InDesign/Photoshop); rê chuột: "Đã sửa N thuộc tính so với kiểu".
- **Menu ⋯:** Lưu thành kiểu mới…; Cập nhật kiểu "Tiêu đề" (đổi N chỗ dùng); Bỏ thay đổi; Đổi tên…; Xoá kiểu (chỗ đang dùng chuyển về kiểu gốc của chỗ đó, có hoàn tác); Lưu vào thư viện của tôi.
- **Thư viện của tôi** (giữa các dự án): lưu `localStorage` (tối đa 64 kiểu), hiện thành một nhóm riêng trong danh sách Kiểu. Chọn một kiểu từ thư viện thì **sao chép** nó vào `scene.textStyles`, nên preset vẫn tự đủ (gửi preset cho người khác không phụ thuộc máy mình). Phông người dùng nạp: kiểu nhớ tên họ phông; máy khác thiếu phông thì báo như hiện nay ("thiếu phông").
- Mọi thao tác là lệnh có hoàn tác (`commands.ts`).

Trả lời câu hỏi của chủ dự án: kiểu chữ dùng được **trong cùng dự án** (đã có, làm dễ thấy hơn) **và giữa các dự án** (thư viện của tôi).

## 4. Sáng tạo tự do: Hình, Bút, Gắn nhạc nhanh (D-74)

### 4.1 Lớp Hình (`SHAPE`, T-134)

Widget mới, lược đồ scene **0.9.0** (thêm loại, preset cũ không đổi):

```ts
interface ShapeProps {
  kind: 'RECT' | 'ELLIPSE' | 'POLYGON' | 'STAR' | 'LINE' | 'PATH';
  // RECT: bo góc; POLYGON/STAR: số cạnh, tỉ lệ trong (STAR)
  radius: number; sides: number; innerRatio: number;
  // PATH: các đường do Bút/Cọ vẽ, toạ độ chuẩn hoá 0..1 trong khung widget (co giãn theo khung)
  paths: { d: number[] /* [x,y, inX,inY, outX,outY]… Bézier bậc ba */; closed: boolean }[];
  fill: { color: string; gradient: Gradient | null };          // màu rỗng = không tô
  stroke: { width: number; color: string; cap: 'butt' | 'round' | 'square'; join: 'miter' | 'round' | 'bevel'; dash: number[] }; // width 0 = không nét
  trim: { start: number; end: number; offset: number };       // 0..1, "Cắt nét" kiểu After Effects
  glow: number; glowColor: string;
}
```

- **Cắt nét (trim)** là trung tâm: `end` từ 0 tới 1 vẽ dần đường viền (thanh tiến độ, vòng tiến độ, nét chữ ký tự hiện). Chữ nhật có trim theo chiều dài là thanh tiến độ; elip có trim là vòng tiến độ.
- Mọi số và màu animate/bind được ngay (đường dẫn đi qua `animatablePaths` như mọi widget).
- Render Core thêm primitive `shape` (đường Bézier, tô, nét, nét đứt, cắt nét) vẽ bằng Canvas 2D `Path2D`; độ dài đường tính bằng chia nhỏ Bézier theo số đoạn cố định (tất định, giống `arcPts`).
- Widget **Thanh tiến độ** hiện có giữ nguyên; trong menu Thêm, mục "Thanh tiến độ" có thêm biến thể "dựng bằng Hình" để người dùng thấy cách tự làm.

### 4.2 Bút và Cọ trên sân khấu (T-135)

Thanh công cụ nhỏ ở góc sân khấu của thẻ Chỉnh sửa: **Chọn (V) · Bút (P) · Cọ (B) · Hình chữ nhật (M) · Elip (L)**.

- **Bút:** nhấp đặt điểm, kéo để ra tay nắm cong; nhấp điểm đầu để khép; Enter/Esc kết thúc. Sửa điểm: nhấp đúp lớp Hình để vào chế độ sửa điểm.
- **Cọ:** kéo tay vẽ tự do; khi thả, nét được làm gọn (Ramer–Douglas–Peucker) rồi khớp thành Bézier, lưu như đường của Bút. Bề rộng nét cố định trong bản đầu; nét có độ dày thay đổi theo áp lực bút để bản sau.
- Đang vẽ mà chưa chọn lớp Hình thì tạo lớp mới; đang chọn lớp Hình thì thêm đường vào lớp đó. Nút **Lớp mới** trên thanh công cụ để tách phần (ví dụ mắt trái, mắt phải) thành lớp riêng, rồi gom bằng precomp (Ctrl+G) như hiện nay.
- Lựa chọn của thanh công cụ (màu tô, màu nét, độ dày) là mặc định cho đường tiếp theo, chỉnh ở cột phải như mọi thuộc tính.

### 4.3 Gắn nhạc nhanh (T-137)

Binding và biểu thức đã làm được mọi thứ nhưng phải biết chọn nguồn, khoảng, easing. **Gắn nhạc nhanh** là menu một cú nhấp trên **mọi** ô số/màu (nút ♪ cạnh nút keyframe ở Thiết lập và ở dòng Timeline), mỗi mục là một công thức điền sẵn binding/biểu thức, sau đó chỉnh như binding thường:

| Công thức | Kết quả (dữ liệu sinh ra) |
|---|---|
| Chạy theo tiến độ bài | `{bind: "progress", from: [0,1], to: [min, max]}` (cắt nét, chiều rộng) |
| Đập theo phách | biểu thức `value * (1 + k * ease(1 - beat.phase, "easeOutCubic"))` |
| Nháy khi có nốt | `{bind: "note.hit"}` từ giá trị hiện tại tới giá trị sáng |
| Theo âm lượng / Theo automation… | `{bind: "audio.level"}` / `track.automation.<id>` |
| Lắc lư theo giây | `oscillate(1 / chu kỳ, biên độ)` |
| Đổi màu theo phách / ô nhịp | biểu thức chọn màu trong bảng màu theo `beat.index`/`bar.index` (cần thêm hàm `pick(i, c0, c1, …)` vào `packages/expr`, tất định) |

Ví dụ của chủ dự án:
- *Thanh chữ nhật kéo theo độ dài bài:* Hình chữ nhật → ♪ ở **Cắt nét · Cuối** → "Chạy theo tiến độ bài".
- *Mắt nhân vật đổi màu theo beat:* vẽ mắt bằng Bút trên một lớp riêng → ♪ ở **Màu tô** → "Đổi màu theo phách".
- *Nhịp thở theo giây:* ♪ ở **Tỉ lệ** → "Lắc lư theo giây".

### 4.4 Mặt nạ lớp (D-75, T-136)

Kiểu "track matte" của After Effects, đơn giản nhất mà vẫn đủ: `WidgetSpec.matte?: { layer: string; mode: 'ALPHA' | 'ALPHA_INV' | 'LUMA' | 'LUMA_INV' }`. Lớp được chọn làm mặt nạ tự ẩn khỏi khung (vẫn animate được). Dùng: chữ chỉ hiện trong hình tròn, phổ tần chỉ hiện trong hình vẽ tay, ảnh lộ dần theo một hình có cắt nét.

- Render Core: `layoutFrame` gom chuỗi hình của lớp và mặt nạ thành một nhóm; bước vẽ dùng canvas phụ và `globalCompositeOperation = 'destination-in'` (ALPHA) hoặc chuyển độ sáng thành alpha (LUMA). Export Worker dùng `OffscreenCanvas` như hiện có.
- Giới hạn: tối đa 8 lớp có mặt nạ mỗi khung; mặt nạ không lồng mặt nạ; mặt nạ phải ở cùng cấp precomp. Vượt giới hạn: cảnh báo `WARN_MATTE_*`, vẽ như không có mặt nạ.
- Chọn mặt nạ ở cột phải (mục Biến đổi: ô **Mặt nạ** chọn lớp + kiểu) và kéo-thả "dây" từ lớp này sang lớp kia trên Timeline (bản sau).

### 4.5 Không làm trong DawViz (dùng phần mềm dựng hình)

Chủ dự án hỏi có nên để phần này cho một trình dựng như After Effects không. Đề xuất: **phần gắn với dữ liệu nhạc làm trong DawViz** (After Effects không đọc được nốt, hợp âm, automation của dự án DAW; đó là lý do DawViz tồn tại), còn **phần dựng hình nặng để phần mềm dựng hình làm**: chuỗi hiệu ứng làm mờ/biến dạng điểm ảnh, 3D, rotoscope, lớp video. DawViz đã xuất **chuỗi PNG trong suốt** (T-55) để ghép vào After Effects/Resolve. Ranh giới này giữ cột phải gọn và tránh viết lại một After Effects nhỏ.

## 5. Gộp widget chữ (D-76, T-138)

**Không xoá loại widget nào** (preset cũ phải mở được, AD-08). Thay đổi ở cách **thêm**:

1. Menu **Thêm** chia nhóm: **Chữ** · **Nốt nhạc** (Piano Roll, Bản nhạc, Nốt đang phát…) · **Phân tích** · **Âm thanh** (Phổ tần, Âm lượng…) · **Hình và ảnh** (Hình, Ảnh, Hạt).
2. Nhóm **Chữ** chỉ còn **một mục "Chữ"** mở ra danh sách mẫu: Tiêu đề và nghệ sĩ, Đếm nốt, Thời gian và phách, Tempo, Giọng, Đoạn, Hợp âm, Lời… Mỗi mẫu là một **Ô chữ** (`TEXT`) điền sẵn chữ có chỗ giữ (`{title}`, `{artist}`, `{played}/{total}`, `{bpm}`, `{key}`, `{section}`, `{chord}`…, xem [hướng dẫn 08](../manual/08-cho-giu.md)) và kiểu chữ phù hợp.
3. Widget chữ có phần vẽ riêng mà Ô chữ không làm được (Thời gian có thanh, Nốt đang phát có đuôi mờ, Hợp âm có dòng nốt, Lời có chữ chưa hát) vẫn là widget riêng nhưng nằm trong cùng nhóm **Chữ** của menu.
4. Widget chữ cũ có lệnh **Chuyển thành Ô chữ** khi chuyển được mà không mất gì (Tên bài và nghệ sĩ, Đếm sự kiện, Tempo, Giọng, Đoạn): cùng vị trí, thời gian, hoạt hình, kiểu chữ.

Người mới vẫn chỉ thấy một mục "Chữ" với các mẫu có tên dễ hiểu; người quen sửa thẳng chữ có chỗ giữ.

**Chỉnh ngày 2026-11-27 (D-78, thay điểm 3):** mục **Chữ** mở một **hộp thoại** (không phải menu con). Mỗi mẫu là một ô có tên; rê chuột lên thì hiện ảnh xem trước nhỏ, bấm một lần là thêm vào giữa khung. Widget chữ có phần vẽ riêng (Thời gian có thanh tiến độ, Nốt đang phát có đuôi mờ, Hợp âm có dòng nốt, Lời có chữ chưa hát, Ô nhịp và phách có chấm nhịp, Giọng có độ tin cậy) cũng nằm trong hộp thoại dưới dạng mẫu, nên menu không còn nhóm Chữ riêng. **Khung ô** không phải widget chữ (khung + tiêu đề + hàng số liệu), giữ ngoài hộp thoại. Hướng lâu dài, chưa làm: khi có Hình, Bút, Gắn nhạc nhanh, Mặt nạ (T-134…T-137), dựng lại từng mẫu có phần vẽ riêng bằng Ô chữ + Hình; loại cũ vẫn đọc được.

## 5b. Lưới nốt: gộp Mật độ nốt, Tổng quan bản phối, Lưới chấm (D-77, T-139)

Ba widget cùng vẽ một lưới hàng × thời gian, ô sáng khi có nốt, kèm vạch phát. Gộp thành một loại `NOTE_GRID` (tên hiện: **Lưới nốt**) với các lựa chọn độc lập:

| Thuộc tính | Giá trị | Ghi chú |
|---|---|---|
| `rows` **Hàng theo** | `TRACK` / `PITCH` | Track: mỗi track một hàng (kể cả trống), tối đa `maxRows`. Cao độ: dải cao độ (`pitchRangeMode`, `pitchMin`, `pitchMax`), bỏ nốt trống; dải rộng hơn `maxRows` thì nhiều cao độ chung một hàng. |
| `span` **Khoảng hiện** | `SONG` / `WINDOW` | Cả bài: `cols` cột chia đều thời lượng, ô sáng khi có nốt **bắt đầu** trong cột (như hai widget cũ). Quanh vạch phát: mỗi cột một ô lưới nhịp (`grid` ô mỗi nốt tròn), lưới cuộn nguyên cột, vạch phát đứng ở `playheadRatio`; ô sáng suốt độ dài nốt. |
| `light` **Ô sáng theo** | `NOTES` / `DENSITY` / `VELOCITY` | Có nốt: độ đục 1. Mật độ: `minAlpha` → 1 theo số nốt so với ô nhiều nhất của hàng. Cường độ: `minAlpha` → 1 theo cường độ lớn nhất trong ô. Ô chưa phát nhân thêm `upcomingAlpha`. |
| `shape` **Hình ô** | `FILL` / `SQUARE` / `ROUND` / `BAR` | Ô đầy: chữ nhật kín ô trừ `cellGap`. Chấm vuông/tròn: cỡ `dotSize` của ô, có `activeScale` và `velocitySize`. Thanh liền: các ô sáng liền nhau cùng màu và độ đục nối thành một thanh bo tròn, dày `dotSize` của hàng. |
| `playheadMark` **Vạch phát** | `LINE` / `COLUMN` | Vạch dọc dày `playheadWidth`, hoặc khung quanh cột đang phát. Màu rỗng = không vẽ. |
| `emptyColor` | màu hoặc rỗng | Ô trống vẽ khi `emptyAlpha` > 0; rỗng = màu của hàng. `emptyColorB` cho dải màu trên → dưới. |
| `showPolyphony` | bật/tắt | Dòng chữ `polyTemplate` (chỗ giữ `{poly}`) phía trên lưới, lưới lùi xuống. |
| `rowLabels` | bật/tắt | Cột nhãn bên trái: tên track, hoặc tên nốt C khi hàng theo cao độ. `beatLines` chỉ có ở Quanh vạch phát. |

**Chuyển preset cũ (lược đồ 0.9.0).** Khi đọc, loại cũ đổi thành `NOTE_GRID`, giữ nguyên mọi thuộc tính cũ (cùng tên) và đặt thêm:

| Loại cũ | Đặt thêm |
|---|---|
| `DENSITY` | `rows TRACK`, `span SONG`, `light DENSITY`, `shape FILL`, `maxRows 24`, `upcomingAlpha 1`, `emptyColor ''`, `emptyAlpha = minAlpha × 0,5`, `playheadMark LINE`, `playheadWidth 1,5` |
| `ARRANGEMENT` | `rows TRACK`, `span SONG`, `light NOTES`, `shape FILL`, `maxRows 32`, `cellGap 0,5`, `emptyAlpha 0`, `playheadMark LINE`, `showPolyphony false` |
| `DOTS` | `rows PITCH`, `span WINDOW`, `light NOTES`, `rowGap 0`, `playheadMark COLUMN`, `showPolyphony false` |

Thuộc tính cũ vắng thì lấy mặc định của loại cũ (không phải của Lưới nốt), nên hình vẽ như trước. Khác biệt duy nhất đã biết: vạch phát của Mật độ nốt cũ có độ đục 0,9 và dừng ở mép phải trừ 1 px, nay theo Lưới nốt (0,95, trừ bề dày vạch) — chênh nhau không thấy được. Keyframe cũ vẫn chạy vì đường dẫn thuộc tính không đổi; riêng hoạt hình `minAlpha` của Mật độ nốt cũ không còn kéo theo ô trống (ô trống nay theo `emptyAlpha`). Preset lưu từ bản mới là 0.9.0, bản cũ của ứng dụng báo "preset mới hơn" thay vì bỏ mất lớp.

## 6. Cụm việc nhỏ của đợt này (T-127…T-133)

| Task | Thiết kế |
|---|---|
| **T-127** Track trên Timeline và hoạt hình đổi thứ tự | Làn **Nhạc** của Timeline (thẻ Chỉnh sửa) làm được như danh sách Track của Xem trước: kéo tay nắm 6 chấm đổi thứ tự, ô màu đổi màu track (bộ chọn màu dùng chung), mắt/S để ẩn/solo, khoá như hiện có. Đổi thứ tự lớp hoặc track: các hàng trượt tới chỗ mới (FLIP, 150 ms, tắt khi người dùng chọn giảm chuyển động) thay vì nhảy. |
| **T-128** Khung phát không tràn | Hộp điều khiển dưới sân khấu (ảnh chụp ở 9:16/1:1): số thời gian dùng cột có bề rộng theo nội dung (`tabular-nums`, `min-width: max-content`), thanh tua co lại trước; dưới 360 px thì thời gian tổng xuống dòng dưới thanh tua. |
| **T-129** Piano Roll | Ô Nốt thấp nhất/cao nhất kéo lên xuống như ô số (đơn vị nửa cung, vẫn hiện tên nốt), cho phép toàn dải 0–127. Màu nốt: Một màu / Theo track / Theo cao độ / Theo cường độ, hai chế độ sau dùng **dải màu hai đầu** chỉnh được. Màu từng track chỉnh ngay trên làn Nhạc của Timeline (T-127), cùng dữ liệu với màu track ở Xem trước (một chỗ lưu, hai chỗ sửa). |
| **T-130** Đỉnh phổ tần | Nhóm **Đỉnh** (công tắc): kiểu đỉnh Vạch/Chấm, thời gian giữ trước khi rơi, rơi có gia tốc (giống ảnh tham chiếu: chấm lơ lửng trên cột). Tất định: đỉnh tính lại từ lịch sử biên độ trong cửa sổ trước `t` (không giữ trạng thái giữa các khung). |
| **T-131** Bậc hợp âm | Chữ trong khối: **Đầu / Giữa / Cuối**. Khi khối dài hơn phần đang thấy, chữ dính mép trái vùng thấy và đi theo tới cuối khối rồi mới bị đẩy ra (như tên clip trong DAW). |
| **T-132** Bản nhạc | (1) Phóng to khi phát: `zoom` = 1 là tắt (quy tắc 1), ô phụ ẩn. (2) **Viết tay từng nốt** theo video tham chiếu `7RgccbtYL_o` (một khuông chạy ngang, nốt "được viết" khi tới lượt): chế độ hiện `WRITE`, mỗi glyph lộ dần theo hướng viết trong `writeMs` bằng vùng cắt hình chữ nhật (glyph là hình tô, không có thứ tự nét), kết hợp nét tay `rough` đã có. (3) **Xoá**: `erase` = Không / Sau N ô nhịp / Ngẫu nhiên, số nốt xoá chỉnh được, ngẫu nhiên tất định theo `seed` (băm id nốt + seed, không dùng `Math.random`), kiểu xoá mờ dần hoặc lau (biến mất từ phải sang trái). Khuông chạy liên tục (thay vì trang) là bước sau, cần đo lại dựng VexFlow trong Worker cho một hệ rất dài. |
| **T-133** Làm đẹp Notes/Degree/Dots | Theo video tham chiếu 3: lưới mảnh hơn, nhãn hàng ngoài khung, khối bậc hợp âm hai tầng (bậc lớn, chi tiết nhỏ) và dải chức năng T/S/D, chấm có kích thước theo cường độ. Làm sau T-124 để dùng nhóm thuộc tính mới. |

## 7. Thứ tự làm và cách chia PR

Mỗi dòng là một PR nhỏ vào `main` (DCO, CI xanh), xoá nhánh sau khi gộp:

1. Tài liệu này + nhật ký quyết định (PR tài liệu).
2. T-128, T-131, T-129 (phần dải cao độ), T-130: sửa nhỏ, độc lập.
3. T-124 khung nhóm thuộc tính + quy tắc A, rồi T-125 rà từng widget (có thể 2–3 PR theo nhóm widget).
4. T-127 Timeline track + hoạt hình đổi thứ tự.
5. T-126 kiểu chữ.
6. T-132 Bản nhạc (zoom, viết tay, xoá).
7. T-134 Hình + cắt nét, T-137 Gắn nhạc nhanh, T-135 Bút/Cọ, T-136 Mặt nạ, T-138 menu Thêm theo nhóm: mỗi cái một PR, theo thứ tự này (Hình trước vì Bút và Mặt nạ cần nó).
8. (thêm 2026-11-27) T-139 Lưới nốt (D-77): một PR mã kèm bước chuyển preset cũ. T-138 hộp thoại Chữ (D-78) làm được trước T-134…T-137 nếu muốn menu gọn sớm.

## 8. Vấn đề mở

- Cọ có độ dày theo áp lực bút (Pointer Events `pressure`): cần lưu bề rộng theo từng điểm; để sau T-135.
- Mặt nạ xuyên precomp và lồng mặt nạ: chưa làm, chờ nhu cầu thật.
- Bản nhạc khuông chạy liên tục: cần đo trước (xem T-132).
- Có nên ẩn hẳn các loại widget chữ đã chuyển được khỏi menu Thêm (chỉ còn qua mẫu của Ô chữ)? Quyết sau khi người dùng thử menu nhóm mới.
