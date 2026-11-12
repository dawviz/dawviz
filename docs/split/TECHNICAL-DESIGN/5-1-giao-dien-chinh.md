---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.1 Giao diện chính 🟢"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.1 Giao diện chính 🟢"
chunk: 5-1-giao-dien-chinh.md
source_lines: 108-127
source_sha1: a953f6ccd4
ids: [ERR_PRESET_INVALID, REQ-STORAGE-02, WARN_PRESET_UNSUPPORTED, WARN_PRESET_VALUE, WARN_PRESET_VERSION, WARN_PRESET_WIDGET_UNKNOWN]
---
### 5.1 Giao diện chính 🟢
Làm ở T-05 (2026-11-12): `packages/render-core/src/scene.ts`, `render.ts`.

```ts
interface SceneDocument { schemaVersion: string; canvas: CanvasSpec; widgets: WidgetSpec[] }       // = Preset (SRS REQ-STORAGE-02)
interface Derived { index: TimelineIndex; chords?: ChordTimeline; audioPeaks?: Float32Array; brightness: Record<TrackId, BrightnessConfig> }
interface RenderTarget { ctx: Ctx2D; width: number; height: number }                                // Canvas hoặc OffscreenCanvas
function renderFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number): void
```
`renderFrame`: (1) tô nền (màu hoặc ảnh, cover); (2) sắp widget theo `zIndex`; (3) với mỗi widget gọi `WidgetRenderer[type].layout(...)` ra danh sách hình học thuần, rồi `draw(...)`. Không đọc `Date`, `performance`, `Math.random`, `requestAnimationFrame` (bắt buộc bởi test tĩnh: quét mã nguồn Render Core tìm các từ khoá này 🟢 `test/scene.test.ts`).

**Đã làm (T-05):**
- `SceneDocument` theo đúng tên trường của preset mẫu (SRS REQ-STORAGE-02, `schemaVersion` 0.3.0): `canvas` + `widgets[]` (`id`, `type`, `zIndex`, `visible`, `layout {x,y,width,height,rotation}`, `trackMappingMode` `ALL`/`MANUAL`/`AUTO_ASSIGN_FIRST_MELODIC`, `assignedTrackIndices`, `properties`). `defaultScene()` = một Piano Roll phủ kín khung 1920×1080. Thuộc tính Piano Roll: `pitchRangeMode`, `pitchMin/Max`, `lookaheadSeconds` (1–8, mặc định 3), `playheadPositionRatio` (mặc định 0,3), `noteStyle` (StyleConfig của T-14), `keyboard`, `playheadColor`, `playheadWidth`. Cửa sổ nhìn = `lookahead / (1 − ratio)`.
- `sanitizeScene(raw)`: trường lạ bị bỏ; giá trị sai kiểu/ngoài khoảng về mặc định hoặc bị kẹp kèm `WARN_PRESET_VALUE` (có `details.path` kiểu `$.widgets[1].properties.lookaheadSeconds`); loại widget lạ bị bỏ (`WARN_PRESET_WIDGET_UNKNOWN`); thứ chưa hỗ trợ (hướng dọc, xoay widget, ảnh nền) `WARN_PRESET_UNSUPPORTED`; khác bản vá/phụ `WARN_PRESET_VERSION`; không đọc được (không phải đối tượng, thiếu `schemaVersion`/`canvas`, khác phiên bản chính) ném `ERR_PRESET_INVALID`. Widget chưa có renderer giữ nguyên `properties` để lưu lại không mất dữ liệu. Tên cũ `noteBorderRadius` được đọc thành `noteStyle.base.cornerRadius`.
- `renderFrame(scene, derived, ast, t, target, scale)`: xoá đích theo pixel → `setTransform(scale)` → tô nền theo pt → mỗi widget `save/translate/clip theo khung/drawPrimitives/restore`. `layoutFrame(...)` là phần thuần (sắp `zIndex`, cùng `zIndex` giữ thứ tự tài liệu, bỏ widget ẩn hoặc chưa có renderer) để test.
- **Lệch so với phác thảo:** `WidgetRenderer` chỉ có `layout`; việc vẽ dùng chung `drawPrimitives` cho mọi widget (primitive hiện có `rect`: toạ độ pt, `alpha` đã gộp độ sáng × độ đục, `radius`, `glowBlur`, `stroke`). Widget mới thêm kiểu primitive (text, path…) vào `drawPrimitives` thay vì tự vẽ, để Preview/Export không thể lệch nhau theo widget. `RenderCtx` = `Ctx2D` + `save/restore/setTransform/translate/rect/clip`.
- `layoutPianoRoll`/`layoutKeyboard` giữ nguyên làm hàm cấp thấp; `drawPianoRoll`/`drawKeyboard` cũ còn cho test cũ nhưng giao diện không dùng nữa.
- Giao diện: `SceneCanvas` (thay `PianoRollCanvas`) giữ tỉ lệ khung thiết kế, `scale = bề rộng điểm ảnh / designWidth`. Kiểu nốt và bàn phím vẫn chỉnh ở bảng phải rồi ghép vào scene mặc định; scene vào store + hoàn tác + Preset ở T-07.
- Chưa làm: làm tròn toạ độ theo `scale` ở bước cuối (5.5), ảnh nền, xoay widget (1.1), hướng dọc/góc tự do (T-59), mô hình lớp/phần tử storyboard (T-22, sẽ là `schemaVersion` mới có hàm di trú từ 0.3.0).
