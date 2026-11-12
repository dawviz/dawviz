---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5. Render Core (chi tiết) 🟢 phần Piano Roll, ⚪ phần còn lại"
path: "5. Render Core (chi tiết) 🟢 phần Piano Roll, ⚪ phần còn lại"
chunk: 5-render-core-chi-tiet-phan-piano-roll-phan-con.md
source_lines: 101-136
source_sha1: 10dd2f7ff3
ids: [REQ-GRAPHICS-05, REQ-GRAPHICS-07, REQ-STORAGE-02]
---
## 5. Render Core (chi tiết) 🟢 phần Piano Roll, ⚪ phần còn lại

### 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07)
`packages/render-core/src/style.ts` giữ `NoteStyle`/`StyleConfig` (mặc định + ghi đè theo track), `resolveNoteStyle` (gộp và kẹp), `noteColor`, `STYLE_PRESETS`. `layoutPianoRoll` nhận `style` và `left` (chừa chỗ bàn phím) rồi trả `NoteRect` đã giải sẵn màu, độ đục, bán kính, phát sáng, viền; `drawPianoRoll` chỉ việc vẽ (đường dẫn bo góc bằng `arcTo`, phát sáng bằng `shadowBlur` rồi trả về 0). `layoutKeyboard`/`drawKeyboard` cùng trục cao độ, gọi sau Piano Roll. Giao diện (`StylePanel`, `TrackPanel`) chỉ sửa dữ liệu; tuỳ chọn lưu `localStorage` qua `lib/prefs.ts`.

### 5.1 Giao diện chính ⚪ (mở rộng từ `layoutPianoRoll` + `drawPianoRoll` hiện có)
```ts
interface SceneDocument { schemaVersion: string; canvas: CanvasSpec; widgets: WidgetSpec[] }       // = Preset (SRS REQ-STORAGE-02)
interface Derived { index: TimelineIndex; chords?: ChordTimeline; audioPeaks?: Float32Array; brightness: Record<TrackId, BrightnessConfig> }
interface RenderTarget { ctx: Ctx2D; width: number; height: number }                                // Canvas hoặc OffscreenCanvas
function renderFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number): void
```
`renderFrame`: (1) tô nền (màu hoặc ảnh, cover); (2) sắp widget theo `zIndex`; (3) với mỗi widget gọi `WidgetRenderer[type].layout(...)` ra danh sách hình học thuần, rồi `draw(...)`. Không đọc `Date`, `performance`, `Math.random`, `requestAnimationFrame` (bắt buộc bởi test tĩnh: quét mã nguồn Render Core tìm các từ khoá này ⚪).

### 5.2 Hợp đồng widget ⚪
```ts
interface WidgetRenderer<P> {
  type: WidgetType;
  layout(ctx: LayoutCtx, spec: WidgetSpec<P>, t: number): Primitive[]   // thuần, đơn vị pt logic, test bằng Node
  draw(g: Ctx2D, prims: Primitive[], scale: number): void               // chỉ vẽ, không tính nghiệp vụ
}
```
Thêm widget mới = thêm một `WidgetRenderer` + schema thuộc tính + khung cấu hình ở UI; không đụng `renderFrame`.

### 5.3 Hệ toạ độ và tỉ lệ 🟡
Toạ độ widget tính bằng **pt logic** theo `designWidth × designHeight` của preset (1920×1080 cho 16:9…). Khi vẽ/xuất, `scale = W_target / designWidth`; mọi kích thước (nét, chữ, bo góc, x/y/w/h) nhân `scale`; chỉ làm tròn ở bước pixel cuối. `PianoRollCanvas` hiện dùng pixel của phần tử canvas và DPR (thay bằng `scale` khi có Scene).

### 5.4 Piano Roll 🟢
- Cửa sổ nhìn `windowSeconds`, playhead tại `playheadRatio`; `t0 = t − window × ratio`.
- `notesInRange(track, t0, t1)`: tìm nhị phân nốt đầu có `start ≥ t0 − maxDur`, duyệt tới khi `start > t1`; O(log n + k).
- Toạ độ x = `(start − t0) × pxPerSec`, y theo hàng cao độ `(pitchMax − pitch) × rowH`; độ rộng tối thiểu 1 px.
- Độ sáng: `trackBrightness` lấy tại thời điểm bắt đầu nốt (không nhấp nháy trong nốt); alpha = `clamp(brightness × (active ? 1 : 0,85), 0,05, 1)`.

### 5.5 Quy tắc tất định (kiểm bằng test)
Cùng `(scene, derived, ast, t, scale)` → cùng danh sách `Primitive` (so sánh sâu) ở Node, và ảnh khớp theo hai ngưỡng của SRS REQ-GRAPHICS-05 (sửa v1.1): ≤ 1/255 mỗi kênh khi **cùng đường vẽ**; giữa Canvas và OffscreenCanvas (khác đường vẽ, Spike 1 đo max diff 57/255 do khử răng cưa) dùng tỉ lệ điểm ảnh lệch ≤ 2/255 và PSNR, **[PROVISIONAL]**, so ảnh trước khi mã hoá (test ảnh chụp trong trình duyệt, M3 ⚪). Mẹo giảm sai khác: vẽ Primitive về toạ độ đã làm tròn theo `scale`, cùng `imageSmoothingQuality`, cùng phông đã nạp. Font người dùng phải `FontFace.load()` xong trước khung đầu khi xuất.
