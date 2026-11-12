# THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER

> Phiên bản tài liệu: 1.1 (2026-11-12: đồng bộ BRD/SRS v1.1; phạm vi bản phát hành ở BRD §4.4, tùy biến và biểu thức ở `CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`) · Trả lời câu hỏi "**hệ thống làm việc như thế nào từ đầu đến cuối**". `SDD.md` mô tả cấu trúc và quyết định; tài liệu này mô tả cơ chế, giao diện mã và luồng chạy chi tiết để lập trình viên bắt tay vào làm. Yêu cầu gốc: `docs/product/SRS.md`.
>
> **Quy ước trạng thái:** 🟢 đã cài đặt và có test · 🟡 có khung mã, chưa chạy thử · ⚪ thiết kế, chưa cài đặt. Chữ ký TypeScript ở mục ⚪ là **hợp đồng đề xuất**, được phép chỉnh khi cài đặt nhưng phải cập nhật tài liệu cùng lúc.

## 1. Bức tranh tổng thể

```
 Tệp dự án (.als .alp .rpp .dawproject .mid | nhị phân + schema)         Audio (tuỳ chọn)  Font/Ảnh nền
        │                                                                     │              │
        ▼  [Worker: parse]                                                    ▼              │
 detectFormat → probeProject → parseProject → buildAST ──► UnifiedProjectAST  AudioBuffer     │
        │ (lỗi/cảnh báo theo mã)                │                              │              │
        └───────────────────────────────────────┴──────────┬───────────────────┘              │
                                                           ▼                                  │
                              Dữ liệu dẫn xuất (derived): TimelineIndex, ChordTimeline,       │
                              đường lane đã lấy mẫu, đỉnh sóng audio                          │
                                                           ▼                                  ▼
 Scene Document (preset: canvas + widgets + cấu hình) ──► renderFrame(scene, derived, t, target, scale)
                                                           │                  │
                                    ┌──────────────────────┘                  └───────────────────┐
                                    ▼ Preview (luồng chính)                                       ▼ Export (Worker)
                         Canvas + đồng hồ phát (t)                          OffscreenCanvas, t_k = start + k/FPS
                                    │                                       VideoEncoder/AudioEncoder → Mediabunny → MP4/WebM
                                    ▼                                                             │
                         UI React (Edit Mode: chọn, kéo, bắt dính, undo)                           ▼
                                    │                                                  Tệp (File System Access / tải xuống)
                                    ▼
                         Lưu phiên IndexedDB (Dexie) · Preset .json · Project Pack .zip
```

Ba nguyên tắc chi phối mọi thiết kế bên dưới:
1. **Khung hình là hàm của `t`** (ARC-01): không trạng thái ẩn, không đồng hồ trong lúc vẽ.
2. **Một nguồn sự thật cho thời gian:** tick (PPQ 960) trong AST; giây là kết quả quy đổi qua `tempoMap`.
3. **Nặng thì ở Worker, vẽ thì ở Render Core, React chỉ giữ trạng thái và dây nối.**

## 2. Mô hình dữ liệu và thời gian 🟢

### 2.1 Unified AST
Hợp đồng đầy đủ ở SRS mục 3.2. Phần cốt lõi (đã có kiểu trong `packages/render-core/src/types.ts`):

```ts
UnifiedProjectAST {
  meta: { title, sourceFormat, sourcePPQ, internalPPQ: 960, tempoSource: 'file'|'midi-default'|'fallback'|'user',
          totalTicks, totalDurationSeconds }
  tempoMap: { tick, timeSeconds, bpm, num?, den? }[]          // sắp theo tick, điểm đầu ở tick 0
  tracks: { id, index, name, color, isMuted, isVisible, notes[], pitchRange,
            mix?: { volumeDb, pan }, automation?: { volume?, pan?, mute?, [laneId]: Lane } }[]   // lane tuỳ ý: SRS REQ-AST-02
}
ASTNote { id, pitch, startTick, endTick, startTimeSeconds, endTimeSeconds, velocity, channel? }
```
Bất biến do `buildAST` bảo đảm và được test: nốt có `endTick > startTick`, `pitch 0..127`, `velocity 1..127`, nốt sắp theo `startTick` rồi `pitch`, `tempo` trong 10..1000 BPM, số nốt ≤ giới hạn (mặc định 500.000).

### 2.2 Quy đổi thời gian
- `tickToSec(map, tick)` và `secToTick(map, sec)` tìm đoạn tempo bằng tìm nhị phân rồi nội suy tuyến tính trong đoạn (tempo hằng số trong mỗi đoạn; dốc tempo được xấp xỉ bằng bậc thang `rampToSteps`, kèm `WARN_TEMPO_RAMP`).
- Mỗi nốt lưu sẵn cả tick và giây (tính một lần ở `buildAST`) → Render Core không tính lại tempo cho nốt; chỉ lane automation cần `secToTick` (một lần mỗi lần lấy mẫu).
- **Ghi đè tempo** (`tempoOverride`): số BPM hoặc điểm `{bpm, num?, den?, tick|beat|timeSeconds}`. Giao diện nhập vị trí theo ba kiểu (giây `m:ss.mmm`, `bar.beat.%` của Reaper, `bar.beat.sixteenth`) và `resolveTempoRows` đổi thành điểm tempo; nhịp ghép như 12/8 đếm beat theo mẫu số (đã xác nhận với Reaper: `1.12.68` = 2,920 s ở 120 BPM).

### 2.3 Automation 🟢
`Lane { kind, points:[{tick, timeSeconds, value, shape, tension?}] }`. `sampleLane(lane, tick)`: giữ giá trị biên ngoài khoảng; trong khoảng tìm đoạn bằng tìm nhị phân, áp `shapeCurve` (0 tuyến tính, 1 bậc thang, 2 mượt, 3 nhanh đầu, 4 nhanh cuối, 5 bezier xấp xỉ), riêng **volume** nội suy trong không gian fader `p = gain^0,25` (khớp ≤ 0,3 dB với Reaper tại hai điểm đo; hệ số này còn [VERIFY], SOI-19). `volumeToUnit(gain, {floorDb, ceilDb})` cho độ sáng 0..1.

**Lane tổng quát (SRS REQ-AST-02, D-50):** `Lane.kind` mở rộng thành `volume | pan | mute | send | plugin | midi-cc | pitch-bend | other`, thêm `name?`, `range? {min, max, unit?}` (kiểu ở `packages/render-core/src/types.ts`); `automation` nhận khoá tuỳ ý. Chuẩn hoá 0..1 dùng chung ở `laneUnit(track, laneId, tempoMap, t)` (`packages/render-core/src/glow.ts`): `volume` → dB trong [−36, 0]; `pan` −1..1 → 0..1; `midi-cc` `/127`; `pitch-bend` −8192..8191 → 0..1; có `range` thì `(v − min)/(max − min)`; còn lại coi như đã 0..1 **[VERIFY]**. Parser hiện chỉ sinh `volume/pan/mute` của track Reaper; MIDI CC/pitch bend, Reaper `PARMENV`/`AUXVOLENV`, Ableton `AutomationEnvelopes`, DAWproject `Points target`: T-66.

## 3. Đường ống phân tích (parser) 🟢

```
parseProject(name, buffer, options)
  1. giới hạn kích thước tệp (ERR_FILE_TOO_LARGE)
  2. detectFormat: đuôi tệp + magic bytes (gzip 1f8b, 'PK', 'MThd', '<?xml'…) → 'als'|'alp'|'rpp'|'dawproject'|'mid'|'binary'
     (.flp/.bwproject → ERR_UNSUPPORTED_FORMAT kèm hướng dẫn xuất MIDI/.dawproject)
  3. parser con → { tempoPoints, tracks[], sourcePPQ, warnings, … } (đầu vào "thô")
  4. buildAST: chuẩn hoá tick về 960, tính giây, ghép `mix`/`automation`, kiểm bất biến → { ast, warnings }
```
- `probeProject(name, buffer, options)` chạy **trước** khi phân tích để UI biết cần thêm gì: `needs.externalMidi[]` (Reaper tham chiếu `.mid` ngoài), `needs.schema` (nhị phân). UI chỉ hiện ô chọn tệp phụ khi cần (REQ-UI).
- Tệp phụ truyền qua `options.files` (`{tên: ArrayBuffer}`), khớp tên có dung sai (khoảng trắng ↔ `_`, hoa/thường).
- **Giới hạn an toàn** trong `parser-core`: giải nén streaming có trần (chống zip bomb), XML không mở rộng DOCTYPE/entity, độ sâu XML tối đa, số nốt tối đa. Vượt → `ERR_*` có mã, không treo.
- **Cảnh báo không mất dữ liệu thầm lặng:** mọi thứ bị bỏ qua đều có `WARN_*` kèm `details` (ví dụ `WARN_RPP_ENVELOPES_IGNORED{ignored, read}`, `WARN_RPP_SRC_UNIT`, `WARN_RPP_EXTERNAL_MIDI`).
- Chi tiết từng định dạng: `docs/parser/PARSER-SDD.md`.

### 3.1 Giao thức Worker phân tích 🟡
`apps/web/src/workers/parser.worker.ts` (một Worker module, tạo lười khi cần):

| Chiều | Thông điệp |
|---|---|
| UI → Worker | `{ id, name, buffer(transfer), showMuted?, tempo?, files? }` |
| Worker → UI (đạt) | `{ id, ok:true, ast, warnings, format, ms }` |
| Worker → UI (lỗi) | `{ id, ok:false, code, message, details? }` |

`parserClient.parseInWorker` ghép `id` ↔ Promise; kết quả cũ (tệp được chọn lại giữa chừng) không ghi đè kết quả mới nhờ `id` tăng dần ⚪ (cần thêm kiểm "chỉ nhận id mới nhất" trong `App.onPick`).

## 4. Dữ liệu dẫn xuất (derived) 🟢/⚪

| Dữ liệu | Tính khi nào | Dùng cho |
|---|---|---|
| `TimelineIndex` (nốt theo track sắp theo thời gian + `maxDur`) 🟢 | Khi nạp AST hoặc đổi track hiển thị | Piano Roll, Live Trigger, Keyboard |
| Lane đã lấy mẫu (bảng độ sáng theo bước 1/30 s) ⚪ | Khi đổi cấu hình độ sáng | Tối ưu nếu `sampleLane` mỗi khung quá chậm (hiện O(log n), có thể không cần) |
| `ChordTimeline` ⚪ | Khi nạp AST, tính trong Worker bằng `@tonaljs/chord-detect` (OI-05) | Widget hợp âm; lưu trong AST là `chordTimeline: []` |
| Đỉnh sóng audio (peaks) ⚪ | Khi nạp audio | Widget sóng âm |

Quy tắc: dữ liệu dẫn xuất là **hàm thuần** của AST + cấu hình, tính một lần ngoài vòng vẽ, có thể chuyển sang Export Worker bằng `postMessage` (transfer khi là `ArrayBuffer`).

## 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại

### 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07)
`packages/render-core/src/style.ts` giữ `NoteStyle`/`StyleConfig` (mặc định + ghi đè theo track), `resolveNoteStyle` (gộp và kẹp), `noteColor`, `STYLE_PRESETS`. `layoutPianoRoll` nhận `style` và `left` (chừa chỗ bàn phím) rồi trả `NoteRect` đã giải sẵn màu, độ đục, bán kính, phát sáng, viền; `drawPianoRoll` chỉ việc vẽ (đường dẫn bo góc bằng `arcTo`, phát sáng bằng `shadowBlur` rồi trả về 0). `layoutKeyboard`/`drawKeyboard` cùng trục cao độ, gọi sau Piano Roll. Giao diện (`StylePanel`, `TrackPanel`) chỉ sửa dữ liệu; tuỳ chọn lưu `localStorage` qua `lib/prefs.ts`.

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

### 5.2 Hợp đồng widget 🟢
Xem mục "Lệch so với phác thảo" ở 5.1.

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
- Độ sáng nền: `trackBrightness` lấy tại thời điểm bắt đầu nốt (không nhấp nháy trong nốt); alpha = `clamp(brightness × opacity × (active ? 1 : inactiveOpacity), 0,05, 1)`. **Mặc định nguồn `off` → brightness = 1, mọi nốt như nhau** (D-50).
- Phát sáng: `NoteRect.glow = style.glow × glowAmount(...)` (mục 5.6); `glowBlur = glowRadius × glow × (0,4 + 0,6 × brightness)`.

### 5.5 Quy tắc tất định (kiểm bằng test)
Cùng `(scene, derived, ast, t, scale)` → cùng danh sách `Primitive` (so sánh sâu) ở Node, và ảnh khớp theo hai ngưỡng của SRS REQ-GRAPHICS-05 (sửa v1.1): ≤ 1/255 mỗi kênh khi **cùng đường vẽ**; giữa Canvas và OffscreenCanvas (khác đường vẽ, Spike 1 đo max diff 57/255 do khử răng cưa) dùng tỉ lệ điểm ảnh lệch ≤ 2/255 và PSNR, **[PROVISIONAL]**, so ảnh trước khi mã hoá (test ảnh chụp trong trình duyệt, M3 ⚪). Mẹo giảm sai khác: vẽ Primitive về toạ độ đã làm tròn theo `scale`, cùng `imageSmoothingQuality`, cùng phông đã nạp. Font người dùng phải `FontFace.load()` xong trước khung đầu khi xuất.

### 5.6 Phát sáng động khi chạm 🟢
SRS REQ-GRAPHICS-17, D-50; `packages/render-core/src/glow.ts`, test `test/glow.test.ts`.

- **Trường trong `NoteStyle`** (nên có hai tầng toàn cục/theo track như mọi trường kiểu nốt): `glowMode` (`uniform` mặc định | `dynamic`), `glowSource` (`velocity` | `pitch` | `pan` | `fade` | `automation`), `glowPanMode` (`lr` mặc định | `spread`), `glowLane`, `glowMin` (0,15), `glowMax` (1), `glowInvert`, `glowRelease` (0–4 s, mặc định 0). `sanitizeStyle` điền mặc định cho trường vắng, nên tuỳ chọn/preset cũ vẫn đọc được.
- **Công thức:** `glowAmount = env(t) × (uniform ? 1 : lerp(glowMin, glowMax, s'))`, với
  - `env = 1` khi nốt đang phát hoặc `glowActiveOnly = false`; sau khi nốt hết, `env = 1 − (t − end)/glowRelease` trong `glowRelease` giây; ngoài ra `0` (không tính gì thêm).
  - `s` theo nguồn: velocity `v/127`; pitch theo tầm cao độ đang hiển thị của widget (`pitchMin..pitchMax` truyền vào `layoutPianoRoll`); pan = lane pan **lúc nốt bắt đầu** (không có lane thì `mix.pan`), qua `panUnit`: `lr` giữ `u`, `spread` = `|2u − 1|` (giữa yếu nhất, lệch càng nhiều càng mạnh); fade `1 − (t − start)/(end − start)`; automation = `laneUnit(glowLane)` **tại t** (lane loại `pan` cũng qua `panUnit`).
  - `s' = glowInvert ? 1 − s : s`; nguồn không có dữ liệu → `s = 1` (sáng như đều nhau).
- **Ranh giới:** chỉ đổi cường độ phát sáng (`glow`), không đổi độ đục; độ đục do độ sáng nền (REQ-GRAPHICS-06) và `opacity/inactiveOpacity`. Pha `hit` của template nốt (T-18) sẽ gọi cùng `glowSourceValue` để dùng chung bộ tiêu chí.
- **Thêm tiêu chí mới:** thêm giá trị vào `GLOW_SOURCES` + một nhánh trong `glowSourceValue` trả 0..1 + chuỗi `web.glow.source.<x>` và `web.glow.hint.<x>`; không đụng `glowAmount`, `layoutPianoRoll` hay giao diện khác.

## 6. Ứng dụng web và phát lại 🟡

### 6.1 Trạng thái
| Trạng thái | Nơi giữ | Ghi chú |
|---|---|---|
| Tệp đã nạp `{ast, warnings, format}` | `App` (`useState`) | Bất biến; thay cả khối khi nạp tệp mới |
| Đồng hồ `{t, playing, rate}` | `App` (`useState` + `lib/clock.ts`) | Vòng `requestAnimationFrame` chỉ gọi `advance(s, dt, duration)` |
| Cấu hình độ sáng nền theo track | `App` → `Derived.brightness` | Mặc định `off` (đều nhau); truyền vào `renderFrame` qua `Derived`; vào Preset ở T-07 |
| Kiểu nốt (gồm phát sáng động) và bàn phím | `App`, lưu `localStorage` (`dawviz.prefs.v1.style`, `.keyboard`) | Ghép vào Piano Roll của `defaultScene()` mỗi lần đổi; vào Scene/Preset ở T-07 |
| Kiểu trình bày danh sách track | `App`, lưu `localStorage` (`dawviz.prefs.v1.trackLayout` = `{mode: 'grid'\|'list', columns: number\|'auto'}`) | Tuỳ chọn giao diện, không vào Preset (REQ-UI-14) |
| Ngôn ngữ | `I18nProvider` | `localStorage` có try/catch |
| Scene, lựa chọn widget, undo/redo ⚪ | Store riêng (M2) | Xem 6.3 |

### 6.2 Phát lại và âm thanh ⚪
- **Không có audio:** `t` tiến theo `performance.now()` (chỉ trong lớp UI, không trong Render Core).
- **Có audio (M2/M3):** `AudioContext` là đồng hồ chủ: `t = audioCtx.currentTime − startedAt + offset`; UI đọc `t` mỗi khung. Tua = dừng source, tạo `AudioBufferSourceNode` mới từ vị trí mới. Offset audio người dùng chỉnh được (SRS). Trình duyệt chặn autoplay → chỉ tạo/resume `AudioContext` trong sự kiện bấm.
- Khi tab ẩn, `requestAnimationFrame` dừng; khi quay lại `t` được tính lại từ đồng hồ chủ, không cộng dồn.

### 6.3 Danh sách track 🟢
SRS REQ-UI-14 (sửa theo D-50); `apps/web/src/components/TrackPanel.tsx`.

- **Hai kiểu:** `TrackGrid` (mặc định; App đặt ở hàng riêng `lg:col-span-2` dưới khung xem trước) và `TrackList` (dòng gọn trong cột phải, mở rộng tại chỗ bằng `AnimatePresence` + chiều cao `auto`). Phần dùng chung: `TrackHeader` (màu, tên, số nốt, độ sáng hiện tại khi nguồn ≠ `off`), `TrackControls` (độ sáng nền, đảo chiều, bỏ màu tuỳ chỉnh), `TrackInfo` (tầm cao độ, fader, lane automation có dữ liệu, ngưỡng). `TrackLayoutBar` chọn kiểu và số cột (dùng `NumberField`, tối đa = số track).
- **Số cột:** `effectiveColumns(chosen, widthPx, count)` (hàm thuần, có test): `fit = floor((W + gap)/(MIN_CARD_PX + gap))`, `MIN_CARD_PX = 224`; `auto` → `min(fit, count)`; số người dùng chọn → `min(chosen, fit)` và `limited = chosen > fit` để hiện thông báo. Bề rộng lấy bằng `ResizeObserver`; lưới vẽ bằng `grid-template-columns: repeat(cols, minmax(0, 1fr))`.
- **Animation:** mỗi thẻ là `motion.li` có `layout` và `layoutId = track-<id>` dùng chung giữa hai kiểu, bọc cả App trong `LayoutGroup`, nên đổi cột hoặc đổi kiểu thì thẻ di chuyển từ chỗ cũ sang chỗ mới (lò xo `stiffness 420, damping 38`). `MotionConfig reducedMotion="user"` tắt chuyển động khi hệ điều hành bật giảm chuyển động.
- **Dính khi cuộn:** khung xem trước và cột phải chỉ `lg:sticky` ở kiểu Danh sách; ở kiểu Lưới, nếu dính sẽ đè lên thẻ track ở hàng dưới (lỗi đã gặp khi kiểm 2026-11-12).
- **Bàn phím:** `arrowNav` tìm phần tử `[data-track-focus]` gần nhất theo hướng mũi tên bằng toạ độ thật, nên đúng với cả lưới tự động; Enter/Space mở dòng ở kiểu Danh sách.
- **Chống tràn:** mọi lưới con dùng `minmax(0, …)`; `SliderField` co nhãn (`minmax(0,7rem)`) và giữ thanh trượt ≥ 3rem; tên track `truncate`. Kiểm tự động bằng Playwright: đếm phần tử con vượt mép phải thẻ ở 1440/1100/800 px.

### 6.4 Chế độ chỉnh sửa ⚪ (M2)
- Mô hình lệnh (command pattern): mọi thay đổi Scene là `Command{ do, undo, mergeKey? }`; ngăn xếp undo ≥ 50 bước (REQ-UI-02); kéo thả gộp theo `mergeKey` thành một lệnh.
- Kéo/đổi cỡ widget: toạ độ logic; `snap(x, y, w, h, others, grid)` thuần (lưới 8/16 pt, ngưỡng guide ≤ 5 pt, phím `Alt/Shift`) – test bằng Node.
- Lớp tương tác (khung chọn, điểm neo, đường gióng) là DOM/SVG phủ lên canvas, **không** vẽ vào canvas của Render Core, nên tự động biến mất ở Preview/Export.
- Preview Mode: ẩn lớp tương tác và gọi cùng `renderFrame` (WYSIWYG).

## 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở)

### 7.1 Trình tự
```
UI ──start{scene, ast, derived, audio?, config}──► Export Worker
Worker: preflight (REQ-EXPORT-00) → chọn tier codec (REQ-EXPORT-06) → mở muxer + đích ghi
  for k in 0..N-1:
     t_k = start + k/FPS ; renderFrame(scene, derived, ast, t_k, offscreen, scale)
     frame = new VideoFrame(offscreen, { timestamp: round(k·1e6/FPS), duration: round(1e6/FPS) })
     videoEncoder.encode(frame, { keyFrame: k % (2·FPS) === 0 }); frame.close()
     if videoEncoder.encodeQueueSize > 8: await dequeue cho tới ≤ 2          // REQ-EXPORT-02
     mỗi ~100 ms: postMessage({ progress: k/N, fps, etr })
  audio (nếu có): giải mã → resample 48 kHz stereo → cắt theo Export Range → khối 1 s → audioEncoder (cùng cơ chế dòng chảy)
  flush encoder → muxer.finalize() → đóng đích ghi → postMessage({ done })
Hủy: UI gửi cancel → reset()/close() encoder, abort() đích ghi (không để lại tệp dở), giải phóng bộ nhớ
```
`N = ceil(Duration × FPS)`; `Duration = max(ProjectDuration, AudioDuration) + 2,0 s` khi xuất cả bài.

### 7.2 Quyết định kỹ thuật
- **Đích ghi:** File System Access (`showSaveFilePicker`, tên tệp chốt **trước** vòng render) nếu có; không thì tích luỹ chunk trong bộ nhớ rồi tải xuống. Cảnh báo RAM khi ước tính > 1 GB không có File System Access (R-01).
- **MP4 fast-start:** `MuxerAdapter` bọc Mediabunny với `fastStart: 'in-memory'` (đã đo cho `ftyp moov mdat`); ghi thẳng đĩa kèm fast-start còn [VERIFY] (SOI-10).
- **Bậc dự phòng codec:** H.264+AAC/MP4 → H.264 video-only/MP4 → VP9(VP8)+Opus/WebM → `ERR_NO_SUPPORTED_ENCODER`. Silent AAC mặc định TẮT (D-01).
- **Đồng bộ A/V:** mẫu audio đầu timestamp 0 trùng khung video đầu; bù priming AAC; kiểm bằng AT-03. Cam kết ±2 ms chỉ cho desktop (R-11).
- **Wake Lock** trong khi xuất; Worker lỗi → `ERR_EXPORT_FAILED`, giữ phiên, cho thử lại.
- **Bộ nhớ:** mỗi `VideoFrame` phải `close()` ngay; `ImageBitmap`/`AudioData` cũng vậy; kiểm bằng test dài (xuất 90 s 1080p60 không tăng bộ nhớ tuyến tính).

## 8. Lưu trữ ⚪ (M4)
- **IndexedDB (Dexie):** bảng `workspace_state` (JSON Scene + cấu hình + tham chiếu Blob), bảng `blobs` (tệp dự án gốc, audio, ảnh nền, font). Ghi debounce 500 ms, trong giao dịch; lỗi ghi không được làm mất bản hợp lệ cuối. Khi `QuotaExceededError` hoặc còn < 50 MB: chỉ lưu JSON, báo cần nạp lại Blob.
- **Mở lại phiên:** phục hồi Blob → chạy lại `parseProject` (AST không lưu, luôn dựng lại từ nguồn để theo kịp bản parser mới) → áp Scene.
- **Preset `.json`:** `schemaVersion`; kiểm kiểu/khoảng giá trị, trường lạ bỏ, giá trị sai về mặc định kèm cảnh báo; không đọc được → `ERR_PRESET_INVALID`; `rotation ≠ 0` đưa về 0.
- **Project Pack `.zip`** (fflate): `preset.json` + tệp dự án + audio + font + ảnh nền + `manifest.json` (phiên bản, băm). Nhập pack cũng đi qua giới hạn giải nén của `parser-core`.

## 9. Đa ngôn ngữ 🟢
Danh mục phẳng `locales/<mã>.json` (`{tham_số}`, `{n, plural, one {#…} other {#…}}` qua `Intl.PluralRules`), chuỗi dự phòng `vi-VN → vi → en → khoá`. Lỗi và cảnh báo dịch **theo mã** (`errors.ERR_*`, `warn.WARN_*`), thông điệp gốc của thư viện hiện trong "Chi tiết kỹ thuật". Kiểm bằng `npm run i18n:check` (thiếu khoá, tham số lệch, khoá thừa). Canvas dùng cùng `i18n` để dịch nhãn trong widget (font phải có glyph của ngôn ngữ). Cộng đồng thêm ngôn ngữ: `docs/I18N.md`.

## 10. Lỗi, ghi nhật ký, quan sát
- Mọi lỗi dự đoán được là `DawParseError{code, message, details}` hoặc lỗi xuất có mã `ERR_*`; giao diện không bao giờ hiện stack trace, chỉ chuỗi dịch + chi tiết kỹ thuật gập lại.
- Lỗi không dự đoán: `window.onerror`/`unhandledrejection` → khung báo lỗi chung, giữ phiên, nút "sao chép chi tiết" (không gửi đi đâu, D-13 không telemetry).
- Cảnh báo giữ lại trong `warnings` của kết quả; Export tóm tắt cảnh báo trong bước pre-flight.

## 11. Hiệu năng và bộ nhớ (ngân sách)
| Mục | Ngân sách | Cách đạt |
|---|---|---|
| Tua ngẫu nhiên | khung mới ≤ 100 ms (NFR-PERF-05) | Chỉ mục nhị phân, không dựng lại gì ngoài khung |
| Parse tệp điển hình | không chặn UI | Worker; trần 500.000 nốt |
| Preview | ≥ 30 fps ở 1080p trên máy desktop điển hình **[PROVISIONAL]** | Chỉ vẽ nốt trong cửa sổ; không cấp phát trong vòng vẽ (tái dùng mảng) ⚪ |
| Xuất | ≥ 1× thời gian thực ở 1080p30 **[PROVISIONAL]** | `encodeQueueSize` kiểm soát dòng chảy; render trong Worker |
Cần đo thật ở M2–M3; số liệu thực ghi vào TDD mục khoảng trống.

## 12. Bảo mật và quyền riêng tư
Không backend, không telemetry; tệp người dùng không rời máy. Không `eval`/`new Function` (ô nhập số dùng bộ đọc viết tay, `lib/numberInput.ts`). **CSP + Trusted Types 🟢** (T-30, 2026-11-12): chính sách ở `apps/web/src/lib/csp.ts`, chèn thẻ `meta` khi build; Worker tạo qua chính sách `dawviz-worker` chỉ nhận URL cùng origin (`lib/trustedTypes.ts`); `npm run dev` không có CSP (HMR cần script nội tuyến). Đọc XML/ZIP có trần (xem mục 3). Preset và pack nhập vào được kiểm schema và giới hạn kích thước. Font/ảnh nạp qua `FontFace`/`createImageBitmap`, không chèn HTML từ dữ liệu người dùng (chuỗi tên track luôn render dạng văn bản; trong canvas là `fillText`). Giấy phép font/thư viện: OI-07.

## 13. Xây dựng, kiểm thử, phát hành
- **Công cụ:** npm workspaces; Vite (dev, build, Worker module); `tsc --noEmit` cho kiểu; Node ≥ 22.18 chạy `.ts` trực tiếp cho test logic.
- **Cổng chất lượng (CI đề xuất ⚪):** `npm test` → `npm run i18n:check` → `npm run typecheck` → `npm run build` → `npm run test:components`; sau đó (M3) test ảnh chụp bằng Playwright trên Chromium.
- **Trình duyệt hỗ trợ:** Chrome/Edge desktop (WebCodecs, File System Access); Firefox/Safari: dùng được Edit/Preview, xuất theo bậc dự phòng (REQ-CAP-01). Không hỗ trợ di động (D-12).
- **Phát hành:** tĩnh (build Vite) lên máy chủ tĩnh bất kỳ; không cần backend. Đặt `Cross-Origin-Opener-Policy`/`Embedder-Policy` chỉ khi sau này dùng `SharedArrayBuffer` (hiện không).
- **Phiên bản dữ liệu:** `schemaVersion` cho Preset/Pack; thay đổi AST phải tăng phiên bản parser và cập nhật Render Core + tài liệu trong cùng thay đổi (D-35).

## 14. Việc cần làm theo mốc (từ thiết kế này)
| Mốc | Công việc kỹ thuật chính |
|---|---|
| M1 ✅ (đóng 2026-11-12) | build; chỉ nhận kết quả parse mới nhất; ngưỡng độ sáng; Track Info; CSP; báo thiếu `.mid` ngoài |
| M2 | ~~`SceneDocument` + `renderFrame` + `WidgetRenderer`~~ (T-05 ✅), phát sáng động (✅), danh sách track (✅ phần lõi); `WidgetRenderer` cho 8 widget; automation tổng quát ở parser (T-66); store + Command/undo; snapping; Preset; audio làm đồng hồ chủ; ChordTimeline |
| M3 | Export Worker (7.1), `MuxerAdapter`, pre-flight, tiến độ/hủy, tier dự phòng; test ảnh chụp Preview↔Export; test A/V |
| M4 | Dexie, Project Pack, nạp schema nhị phân trong UI, nhập tempo ghi đè trong UI |
| M5 | Đo hiệu năng, trợ năng, bản dịch cộng đồng, đóng OI |
