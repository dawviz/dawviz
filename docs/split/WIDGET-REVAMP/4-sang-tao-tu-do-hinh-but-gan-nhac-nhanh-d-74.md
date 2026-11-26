---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "4. Sáng tạo tự do: Hình, Bút, Gắn nhạc nhanh (D-74)"
path: "4. Sáng tạo tự do: Hình, Bút, Gắn nhạc nhanh (D-74)"
chunk: 4-sang-tao-tu-do-hinh-but-gan-nhac-nhanh-d-74.md
source_lines: 92-155
source_sha1: 5eb561ef37
ids: [D-74, D-75, WARN_MATTE_]
---
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
