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
| `HudData.starts` 🟢 (T-69): mỗi track một `Float64Array` thời điểm bắt đầu nốt đã sắp (`buildHud`, hoặc `hudOf` dựng một lần rồi đệm theo `derived`) | Khi nạp AST hoặc đổi track hiển thị | Event Counter (`Played` = tìm nhị phân `starts ≤ t`, `Total` = độ dài mảng) |
| `HudData.bars` (`BarGrid`) 🟢 (T-69): ranh giới ô nhịp theo tick từ `tempoMap` (`timeSigNumerator/Denominator`), kèm giây | Khi nạp AST | Time & Bar Counter (tìm nhị phân tick → Bar, Beat, Sub, phần beat, phần bar) |
| `ChordTimeline` 🟢 (T-69, T-06) | Ở bước derived (`buildSceneHud` → `chordTimeline(hud, tracks, mode)`), bằng `@tonaljs/chord-detect` (OI-05); đệm theo (chế độ, nhóm track) trong `HudData.chords`. Sustained: quét sự kiện bật/tắt; Strike: gom nốt bắt đầu ≤ `STRIKE_WINDOW_SEC` (30 ms) | Widget hợp âm. Hiện chạy trên luồng chính khi nạp; chuyển vào Worker nếu đo thấy chậm |
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
- `SceneDocument` theo đúng tên trường của preset mẫu (SRS REQ-STORAGE-02, `schemaVersion` 0.3.0 khi làm T-05, **0.4.0 từ T-07**): `canvas` + `widgets[]` (`id`, `type`, `zIndex`, `visible`, `layout {x,y,width,height,rotation,anchor}`, `trackMappingMode` `ALL`/`MANUAL`/`AUTO_ASSIGN_FIRST_MELODIC`, `assignedTrackIndices`, `properties`). `defaultScene()` = một Piano Roll phủ kín khung 1920×1080. Thuộc tính Piano Roll: `pitchRangeMode`, `pitchMin/Max`, `lookaheadSeconds` (1–8, mặc định 3), `playheadPositionRatio` (mặc định 0,3), `noteStyle` (StyleConfig của T-14), `keyboard`, `playheadColor`, `playheadWidth`. Cửa sổ nhìn = `lookahead / (1 − ratio)`. **Bàn phím bật (T-71):** vạch phát nằm đúng mép phải bàn phím (nốt phát khi chạm phím), `playheadPositionRatio` không có tác dụng nhưng vẫn được giữ (dùng lại khi tắt bàn phím); nốt đã phát trượt xuống dưới bàn phím. **Tỉ lệ thời gian cố định (T-71, theo phản hồi chủ dự án):** pt/giây = bề rộng widget / `visibleSeconds`, không phụ thuộc vị trí vạch phát hay bàn phím; dời vạch phát chỉ dời mốc "bây giờ", nốt giữ nguyên độ dài. Preset thiếu `visibleSeconds` lấy `lookahead / (1 − ratio)` (làm tròn 1e-6) nên preset cũ vẽ như trước; `lookaheadSeconds` từ đó chỉ dùng cho suy luận này. `playheadVisible` (mặc định true) ẩn nét vạch, nốt vẫn phát tại vị trí vạch. Hình học tính ở một chỗ: `pianoRollGeometry(props, width)` → `{kb, playX, pxPerSec, ratio, windowSeconds}` (renderer và tâm ảnh thu nhỏ dùng chung). Giao diện khoá ô "Vị trí vạch phát" khi bàn phím bật, kèm chú thích lý do nối bằng `aria-describedby`; đổi vị trí là lệnh `setPlayheadRatio` (hoàn tác được, kéo liên tiếp gộp một bước). **Thứ tự giữa các track (D-56):** `index.tracks` theo thứ tự danh sách track của ứng dụng; track đầu có ưu tiên cao nhất nên `layoutPianoRoll` duyệt từ track cuối lên track đầu, `layoutKeyboard` giữ màu track đứng trước khi trùng phím. **Thứ tự vẽ nốt (T-71):** `layoutPianoRoll` trả nốt đang phát sau cùng, nên nốt đang phát luôn nằm trên nốt chưa phát/đã phát chồng lên nó; thứ tự trong mỗi nhóm giữ nguyên.
- `sanitizeScene(raw)`: trường lạ bị bỏ; giá trị sai kiểu/ngoài khoảng về mặc định hoặc bị kẹp kèm `WARN_PRESET_VALUE` (có `details.path` kiểu `$.widgets[1].properties.lookaheadSeconds`); loại widget lạ bị bỏ (`WARN_PRESET_WIDGET_UNKNOWN`); thứ chưa hỗ trợ (hướng dọc, xoay widget, ảnh nền) `WARN_PRESET_UNSUPPORTED`; khác bản vá/phụ `WARN_PRESET_VERSION`; không đọc được (không phải đối tượng, thiếu `schemaVersion`/`canvas`, khác phiên bản chính) ném `ERR_PRESET_INVALID`. Widget chưa có renderer giữ nguyên `properties` để lưu lại không mất dữ liệu. Tên cũ `noteBorderRadius` được đọc thành `noteStyle.base.cornerRadius`.
- `renderFrame(scene, derived, ast, t, target, scale)`: xoá đích theo pixel → `setTransform(scale)` → tô nền theo pt → mỗi widget `save/translate/clip theo khung/drawPrimitives/restore`. `layoutFrame(...)` là phần thuần (sắp `zIndex`, cùng `zIndex` giữ thứ tự tài liệu, bỏ widget ẩn hoặc chưa có renderer) để test.
- **Lệch so với phác thảo:** `WidgetRenderer` chỉ có `layout`; việc vẽ dùng chung `drawPrimitives` cho mọi widget (primitive hiện có `rect`: toạ độ pt, `alpha` đã gộp độ sáng × độ đục, `radius`, `glowBlur`, `stroke`). Widget mới thêm kiểu primitive (text, path…) vào `drawPrimitives` thay vì tự vẽ, để Preview/Export không thể lệch nhau theo widget. `RenderCtx` = `Ctx2D` + `save/restore/setTransform/translate/rect/clip`.
- `layoutPianoRoll`/`layoutKeyboard` giữ nguyên làm hàm cấp thấp; `drawPianoRoll`/`drawKeyboard` cũ còn cho test cũ nhưng giao diện không dùng nữa.
- Giao diện: `SceneCanvas` (thay `PianoRollCanvas`) giữ tỉ lệ khung thiết kế, `scale = bề rộng điểm ảnh / designWidth`. Từ T-07, scene nằm trong store có hoàn tác (6.4): kiểu nốt và bàn phím chỉnh ở inspector là thuộc tính của Piano Roll trong scene đó, không còn ghép từ state riêng.
- Chưa làm: làm tròn toạ độ theo `scale` ở bước cuối (5.5), ảnh nền, xoay widget 2D (1.0 theo D-54, T-68: `layout.anchor`, ma trận xoay quanh điểm neo trong `renderFrame`, khung bao thẳng trục cho bắt dính; `sanitizeScene` hiện vẫn đưa `rotation` về 0 kèm `WARN_PRESET_UNSUPPORTED` cho tới khi làm), hướng dọc/góc tự do (T-59), mô hình lớp/phần tử storyboard (T-22, sẽ là `schemaVersion` mới có hàm di trú từ 0.3.0).

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

### 5.7 Primitive chữ và nạp phông 🟢 (T-69, SRS REQ-WIDGET-02)
**Primitive.** Thêm vào `Primitive` một kiểu `text`; `layout` của widget trả về, `drawPrimitives` vẽ, giống `rect` (không widget nào tự gọi `fillText`):

```ts
interface TextPrim {
  kind: 'text'; text: string;
  x: number; y: number;                       // pt logic; y là đường baseline
  font: string;                               // họ phông trong bảng FONTS của preset, ví dụ "Space Grotesk"
  size: number; weight: number;               // pt logic, 100–900
  align: 'left' | 'center' | 'right';
  color: string; alpha: number;
  maxWidth?: number;                          // layout đã cắt bằng bảng đo; bước vẽ truyền tiếp cho fillText để không bao giờ tràn
}
```
- Vẽ: `ctx.font = `${weight} ${size}px "${font}", sans-serif``, `textAlign = align`, `textBaseline = 'alphabetic'`, `fillStyle`, `globalAlpha`. Kích thước nhân `scale` bởi `setTransform` như mọi primitive, nên không tự nhân lại. `fontKerning = 'none'` và `textRendering = 'geometricPrecision'` (không có dòng sau thì Chromium làm tròn độ rộng ký tự, lệch bảng đo ~1%) đặt cùng chỗ cho Canvas và OffscreenCanvas. Chữ số của đồng hồ chưa dùng `tabular-nums`; nhãn đặt cạnh số dùng bề rộng chữ số rộng nhất nên không nhảy.
- **Đo chữ.** Phần `layout` là hàm thuần chạy ở Node nên không có `measureText`. Mọi quyết định phụ thuộc bề rộng (căn phải, `maxWidth`, kiểu một dòng ngang của Live Trigger) dùng **căn lề của canvas** (`textAlign`) và việc cắt chữ nằm ở bước vẽ; riêng chỗ cần biết bề rộng để xếp nhiều đoạn trên một dòng thì layout dùng bảng bề rộng ký tự của phông (`FONT_METRICS`, sinh bằng `scripts/gen-font-metrics.mjs` từ tệp phông đóng gói, `packages/render-core/src/fontMetrics.generated.ts`) chứ không gọi `measureText`. Nhờ đó cùng `(scene, t)` ra cùng chuỗi lệnh vẽ ở mọi môi trường.
- **Quyết định đo chữ (chủ dự án duyệt 2026-11-13).** Dùng bảng `FONT_METRICS` với năm điều kiện: (1) bảng **sinh tự động** bằng script đọc chính tệp phông đã đóng gói (thư viện đọc phông chỉ là phụ thuộc lúc phát triển), kèm mã băm tệp phông; test so mã băm, đổi phông mà quên sinh lại bảng thì đỏ. (2) **Bỏ kerning khi vẽ** (`ctx.fontKerning = 'none'`) để đo khớp vẽ, nên bảng không cần cặp kerning. (3) Bảng phủ Latin cơ bản và Latin mở rộng (gồm tiếng Việt); ký tự ngoài bảng ước lượng bằng một độ rộng dự phòng, và bước vẽ vẫn cắt chữ/thêm "…" theo khung widget để không bao giờ tràn. (4) `layout` nhận hàm đo truyền vào `measure(text, font, size)`, mặc định dựa trên `FONT_METRICS`; phông người dùng nạp (REQ-STORAGE-05) chỉ cần sinh bảng lúc nạp. (5) Test đối chiếu trên trình duyệt thật: `FONT_METRICS` so với `measureText` trên vài chuỗi (Latin, tiếng Việt, chữ số), lệch ≤ 1 pt; chỉ chạy khi có Chromium. Thêm test: preset cũ thiếu tuỳ chọn "luôn hiện danh sách nốt" vẽ y như trước.
- **Nguồn chữ.** Chuỗi trong primitive đến từ mẫu chữ của preset (`properties.template`…) và dữ liệu dự án, không từ `locales/` (The Two Worlds Rule). Hàm định dạng (`formatTemplate`, `groupDigits`) là hàm thuần trong `packages/render-core/src/text.ts`.

**Nạp phông.**
- Phông gói theo ứng dụng: `apps/web/public/fonts/SpaceGrotesk-*.woff2` (OFL, kèm `OFL-SpaceGrotesk.txt`; phông giao diện Inter đi qua `@fontsource-variable/inter` vào `dist/assets`, giấy phép kèm `OFL-Inter.txt` ở cùng thư mục `fonts/`; cả hai chép vào `dist/fonts/`), phục vụ cùng origin nên khớp CSP `font-src 'self'` (NFR-SEC-03); không `@font-face` từ CDN, không `data:` cho phông chính.
- Render Core không tự tải. Cung cấp `FontRegistry` (`packages/render-core/src/fonts.ts`): `ensureFonts(specs, loader): Promise<void>` nhận danh sách `{family, weight, url}` mà scene cần (`requiredFonts(scene)` thuần, sắp ổn định), gọi `new FontFace(family, `url(...)`, {weight})`, `await face.load()`, rồi thêm vào `document.fonts` (Preview) hoặc `self.fonts` (Worker). `loader` được truyền vào để cùng một mã dùng cho cả hai nơi và để test bằng loader giả.
- **Cổng khung đầu.** `renderFrame` nhận `derived.fontsReady?: boolean`. Khi `fontsReady = false`, `renderFrame` **bỏ qua mọi primitive `text`**; ứng dụng (`useFontsStatus`, `SceneCanvas blocked`) còn **không vẽ cả khung** và hiện trạng thái chờ/lỗi (`needsFonts(scene)` cho biết có cần chờ); **Export không bắt đầu** khi `ensureFonts` chưa xong hoặc bị lỗi (báo `ERR_FONT_LOAD`, không xuất bằng phông dự phòng). Preview vẽ lại khi `ensureFonts` kết thúc.
- **Export Worker (M3).** Worker nhận `requiredFonts(scene)` cùng thông điệp `start`, tự gọi `ensureFonts` với `self.fonts` (Spike 1: `FontFace` trong Worker hoạt động) và chỉ gửi `ready` về UI khi xong; khung 0 chỉ được vẽ sau `ready`. Phông người dùng nạp (REQ-STORAGE-05) dùng cùng đường, tệp truyền bằng `ArrayBuffer`.
- **Ảnh thu nhỏ phong cách.** Cùng `renderFrame` với `scale` nhỏ, `t` cố định theo preset (`thumbnail.t`), chờ `ensureFonts`; kết quả đệm theo khoá `(presetId, projectKey, width, height)`; vẽ lên `OffscreenCanvas` rồi `convertToBlob`, nên không phụ thuộc giao diện.

### 5.8 Dữ liệu cho widget Bar.Beat: AST đã có bản đồ nhịp 🟢 (đã dùng ở T-69)
Đã kiểm (2026-11-13): `makeTempoMap` (`packages/core/src/tempo.js`) sinh `tempoMap[i] = { tick, timeSeconds, bpm, timeSigNumerator, timeSigDenominator }`, mặc định 4/4; `mergeTempoAndSig` gộp điểm tempo và điểm nhịp độc lập; `buildAST` đưa `tempoMap` vào AST. Vậy Time & Bar Counter lấy **dấu nhịp từ `ast.tempoMap`**, không cần trường mới và không cần sửa parser. Chỗ thiếu duy nhất là **kiểu TypeScript**: `TempoPoint` ở `packages/render-core/src/types.ts` mới khai báo `{tick, timeSeconds, bpm}`; T-69 thêm `timeSigNumerator?` và `timeSigDenominator?` (tuỳ chọn, mặc định 4/4 khi vắng) để không phá mã cũ. Một beat dài `960 × 4 / denominator` tick; Bar bắt đầu tại điểm đổi nhịp (SRS REQ-WIDGET-05). Nguồn `.mid` không có sự kiện nhịp thì parser đã cho 4/4. Nguồn nào chưa đọc dấu nhịp (nếu có) cũng rơi về 4/4, không cần xử lý riêng ở widget.

## 6. Ứng dụng web và phát lại 🟡

### 6.1 Trạng thái
| Trạng thái | Nơi giữ | Ghi chú |
|---|---|---|
| Tệp đã nạp `{ast, warnings, format}` | `App` (`useState`) | Bất biến; thay cả khối khi nạp tệp mới |
| Đồng hồ `{t, playing, rate}` | `lib/playback.ts` (kho riêng, ngoài store hoàn tác và ngoài state của `App`) | Vòng `requestAnimationFrame` chỉ gọi `advance(s, dt, duration)`; chỉ canvas, thanh phát và số đo đăng ký theo dõi |
| Cấu hình độ sáng nền theo track | Store (`Doc.brightness`) → `Derived.brightness` | Mặc định `off` (đều nhau); truyền vào `renderFrame` qua `Derived`; hoàn tác được; chưa vào Preset (Preset chỉ chứa scene) |
| Kiểu nốt (gồm phát sáng động) và bàn phím | Store (trong `Doc.scene`), bản sao lưu `localStorage` (`dawviz.prefs.v1.style`, `.keyboard`) | Nạp vào tài liệu ban đầu khi mở ứng dụng; không ghi khi scene đến từ preset mở từ tệp |
| Kiểu trình bày danh sách track | `App`, lưu `localStorage` (`dawviz.prefs.v1.trackLayout` = `{mode: 'grid'\|'list', columns: number\|'auto'}`) | Tuỳ chọn giao diện, không vào Preset (REQ-UI-14) |
| Ngôn ngữ | `I18nProvider` | `localStorage` có try/catch |
| Scene, phong cách video, kiểu nốt, độ sáng, ẩn/solo/thứ tự, undo/redo 🟡 | Store riêng `lib/store.ts` (T-07) | Xem 6.4; đồng hồ phát vẫn ở `lib/playback.ts` |

### 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh)
SRS: REQ-WIDGET-07 (phần dữ liệu âm thanh), REQ-EXPORT-03, REQ-STORAGE-05, REQ-UI-03, REQ-PARSER-00 / NFR-SEC-04 (giới hạn tệp). Render Core **không đổi**: nó chỉ nhận `t`.

#### 6.2.1 Nạp tệp âm thanh (mix)
- **Định dạng:** `.wav .mp3 .ogg .flac .m4a` (REQ-WIDGET-07); khả năng giải mã do trình duyệt quyết định. Nhận qua nút "Nạp âm thanh" (inspector, mục 01 Bài) và kéo thả. Chỉ **một** tệp mix ở T-08 (stem theo track là REQ-AUDIO-01, 1.2).
- **Kiểm theo thứ tự, rẻ trước đắt sau, mỗi bước thất bại là một lỗi có mã và phiên vẫn chạy được không âm thanh:**
  1. Kích thước `File.size` ≤ **300 MB** [PROVISIONAL], kiểm **trước khi đọc** → `ERR_FILE_TOO_LARGE`. Tệp rỗng → `ERR_AUDIO_DECODE`.
  2. Dò thời lượng bằng metadata (`HTMLAudioElement`, `preload="metadata"`, blob URL, không giải mã) ≤ **20 phút** [PROVISIONAL] → `ERR_AUDIO_TOO_LONG`. Bước này chặn trước khi tốn RAM (ARC-03). **CSP không cần đổi:** `media-src 'self' blob:` đã có sẵn (`lib/csp.ts`); `csp.test.ts` thêm một ca khoá chỉ thị này (có `blob:`, không có nguồn ngoài) để không ai vô tình bỏ.
  3. **Metadata không đọc được** (MP3 VBR không có tiêu đề Xing/VBRI cho `duration = Infinity` hoặc `NaN`, hoặc lỗi/quá 5 s chờ): **giải mã rồi mới kiểm giới hạn** (`buffer.duration` > 20 phút → bỏ buffer, `ERR_AUDIO_TOO_LONG`). Vì khi đó chưa biết độ dài thật, để khỏi giải mã nhầm tệp rất dài, đặt trần kích thước riêng cho nhánh này: tệp nén > **48 MB** (= 20 phút ở 320 kbps, bitrate cao nhất của MP3) thì không giải mã mà báo `ERR_AUDIO_TOO_LONG` kèm lý do "không xác định được độ dài" [PROVISIONAL].
  4. Giải mã → lỗi bất kỳ → `ERR_AUDIO_DECODE` (kèm chi tiết kỹ thuật gập lại, không stack trace).
- **Giải mã ở đâu:** luồng chính bằng `OfflineAudioContext(2, 1, 48000).decodeAudioData(...)`. `decodeAudioData` không có trong Worker, còn WebCodecs `AudioDecoder` cần tự tách container nên không đáng cho T-08. Việc giải mã thực chạy ngoài luồng JS, nên không chặn giao diện; dùng `OfflineAudioContext` nên **không dính chính sách autoplay**. Kết quả đã **ở 48 kHz** (khớp REQ-EXPORT-03, T-09 không phải resample); mono giữ 1 kênh, upmix lúc xuất.
- **Bộ nhớ (đối chiếu mục 11, chỉnh 5):** 20 phút × 60 × 48 000 mẫu × 2 kênh × 4 byte = **460,8 MB** PCM. Sau khi giải mã xong **không giữ byte tệp nén**, chỉ giữ tham chiếu `File` (Blob trỏ tới đĩa, không tốn RAM) để Project Pack sau này đọc lại. Tệp mới thay tệp cũ: bỏ tham chiếu `AudioBuffer` cũ **trước** khi giải mã tệp mới.
  - *Trạng thái ổn định:* 460,8 MB = 22,5 % trần 2,0 GB của NFR-PERF-04. Cộng phần xuất 4K ước tính ≈ 0,7 GB (canvas ngoài màn hình 4K ≈ 33 MB, hàng đợi ≤ 8 `VideoFrame` ≈ 265 MB, bộ mã hoá, AST) thì ≈ 1,2 GB, **còn dư ≈ 0,8 GB**.
  - *Đỉnh tạm khi giải mã:* tệp nén (≤ 300 MB, thực tế WAV 20 phút ≈ 230 MB; MP3/FLAC nhỏ hơn) + PCM 460,8 MB, và một số trình duyệt giữ thêm một bản trung gian khi giải mã (ước ≤ 2× PCM) ⇒ đỉnh ≲ 1,2 GB; giải mã **không chạy cùng lúc với xuất** (nút nạp bị khoá khi đang xuất, T-09).
  - **Kết luận: không vượt ngân sách, giữ nguyên 20 phút**; mục 11 thêm một dòng ngân sách cho âm thanh. Số đo thật trên trình duyệt ghi lại sau khi kiểm tay; nếu đỉnh tạm đo được > 1,5 GB thì hạ trần thời lượng (đề xuất 12 phút ≈ 276 MB PCM) và báo chủ dự án.
- **Định danh (REQ-STORAGE-05):** SHA-256 của byte tệp (`crypto.subtle.digest`) làm `assetId`; dùng làm khoá bộ đệm sóng âm. Lưu IndexedDB và đóng gói Project Pack thuộc T-xx lưu trữ (M4), ngoài phạm vi T-08.

#### 6.2.2 Đồng hồ chủ
Một mô hình duy nhất cho cả hai chế độ: **neo + thời gian trôi qua**, `t = t0 + rate · max(0, s − s0)`, với `s` là giờ của *nguồn* tại khung đang vẽ và `s0` là giờ nguồn lúc neo (`t = t0`). Hai chế độ chỉ khác `s`:
| Chế độ | `s` tại khung vẽ | Độ trễ thiết bị |
|---|---|---|
| Không âm thanh (như nay) | `performance.now()/1000` | 0 |
| Có âm thanh | **giờ nghe được** trên trục `AudioContext` (bên dưới) | đã nằm trong `s` |

- **Độ trễ thiết bị tách hẳn khỏi offset (chỉnh 1).** Độ trễ chỉ có ở *đồng hồ xem trước*, ở một chỗ duy nhất: `heardContextTime` trong `lib/masterClock.ts`. `audioOffsetMs` là lựa chọn của người dùng, lưu trong dự án. `mapToBuffer` và đường xuất (§7) **không nhận và không import** độ trễ: xuất là offline, không có thiết bị. Test bắt buộc: (a) `lib/audioMap.ts` không chứa chữ `latency` và không import `masterClock`; (b) kế hoạch cắt âm thanh để xuất (`exportSegments`) cho cùng kết quả từng bit với mọi cấu hình độ trễ dựng ra trong test.
- **Giờ nghe được `heardContextTime(sample, frameMs)`, mỗi khung (chỉnh 3):**
  1. *Có `getOutputTimestamp()`* và cho cặp hợp lệ (`performanceTime > 0`, hữu hạn, `contextTime ≥ 0`, ngữ cảnh đang `running`): `heard = ts.contextTime + (frameMs − ts.performanceTime)/1000`. Quy đổi `performance.now` ↔ trục `AudioContext` này nội suy mượt **từng khung** (không bị bậc thang ≈ 2,7 ms của `currentTime`). Theo đặc tả, `contextTime` của hàm này là mẫu *đang phát ra loa*, nên độ trễ đầu ra **đã nằm trong đó**, không trừ thêm (trừ lần nữa là đếm đôi).
  2. *Dự phòng* (không có hàm, cặp không hợp lệ, hoặc ngữ cảnh chưa chạy): `heard = currentTime − L`, `L = clamp(baseLatency + outputLatency, 0, 0,5)` (`undefined` coi là 0). `L` lấy mẫu **một lần mỗi lần neo**, không đọc mỗi khung vì ước lượng dao động làm `t` rung.
  3. Trong cả hai nhánh, trong một đoạn phát liên tục `t` không bao giờ giảm (kẹp đơn điệu) để nhiễu của cặp mốc thời gian không làm hình giật lùi; chỉ tua và vòng lặp mới làm `t` lùi.
- **Neo lại và lấy mẫu lại độ trễ (chỉnh 2).** `rearm` = đọc `t*` bằng cách tính hiện tại → dừng các đoạn (hạ gain 5 ms) → lấy mẫu lại `L` → mở đoạn mới tại `t*` → neo mới. **Hình không nhảy** (cùng `t*`), tiếng và hình khớp theo độ trễ *mới*. `rearm` chạy khi: `sinkchange` của `AudioContext`, `devicechange` của `navigator.mediaDevices`, `statechange` về `running` (sau `suspended`/`interrupted`) khi đang ở trạng thái phát, đổi offset, và đổi tệp âm thanh. Đang dừng thì chỉ lấy lại `L` cho lần phát sau.
- **Phát một đoạn:** mỗi đoạn là một `AudioBufferSourceNode` qua một `GainNode`, lên lịch `start(when, offsetTrongBuffer, độDài)` với `when = currentTime + 0,03 s` (đệm khởi động), neo `s0 = when` (cùng trục giờ nghe được, nên `t` đứng ở `t0` đến lúc âm thanh thực sự tới tai). Mọi thời điểm tính trên **trục `AudioContext`** nên chính xác theo mẫu, không phụ thuộc `setTimeout`. `AudioContext` đang `suspended` thì `currentTime` đứng yên và `t` đứng yên theo, tự khớp khi `resume()` xong.
- **Offset (§6.2.3):** vị trí trong buffer `b = t − offset`; `planSegment` cho biết trễ bao lâu mới có tiếng, bắt đầu từ đâu trong buffer, dài bao nhiêu.
- **Chuyển chế độ không nhảy:** việc duy nhất khi nạp/gỡ âm thanh là **neo lại tại `t` đang đọc từ nguồn cũ**: `t* = đọc(cũ)`, `t0 = t*`, `s0 = nguồn mới tại thời điểm đó`. Đang phát thì khởi động đoạn mới từ `t*` (`t` đứng yên ≈ 30 ms đệm rồi chạy tiếp, không nhảy); đang dừng thì chỉ đổi nguồn. Gỡ âm thanh khi đang phát: `t* = đọc(âm thanh)` rồi quay về `performance.now()` với `last = now`.
- **Tab ẩn:** ở chế độ có âm thanh không cộng dồn `dt`; mỗi khung đọc lại từ `AudioContext` nên quay lại tab là đúng ngay. Âm thanh vẫn chạy khi tab ẩn; bộ lên lịch lặp chạy bằng `setInterval` 250 ms và đặt trước 2 s (trình duyệt bóp timer nền nên vòng lặp quá ngắn trong tab ẩn có thể vấp; chấp nhận, ghi chú).
- **`AudioContext` bị hệ thống treo** (`suspended`/`interrupted` sau khi đã chạy, ví dụ rút tai nghe): `currentTime` đứng nên `t` tự đứng; chuyển `playing = false` giữ nguyên `t`, người dùng bấm Phát để tiếp.
- **Tốc độ:** `rate` là 1 khi có âm thanh. Công thức đã có `rate` để sau này nối `playbackRate` mà không đổi mô hình.
- **Cấu trúc mã:** `lib/masterClock.ts` (toán đồng hồ thuần, không biết Web Audio), `lib/audioMap.ts` (`mapToBuffer`, `planSegment`, `exportSegments`, **không** biết độ trễ), `lib/audioEngine.ts` (điều khiển `AudioContext` qua giao diện `AudioContextLike`, test bằng bản giả), `lib/playback.ts` chọn nguồn. API `Playback` giữ nguyên và thêm `setDuration`, `setLoop`, `audio`.

#### 6.2.3 Offset âm thanh so với dự án
- **Quy ước dấu:** `offsetMs > 0` = âm thanh **trễ** so với dự án (đầu tệp rơi vào `t = offset`; từ `0` đến `offset` im lặng). `offsetMs < 0` = âm thanh **sớm**: **phần âm thanh nằm trước mốc `t = 0` bị cắt bỏ** (không nghe, không xuất), `t = 0` ứng với giây `−offset` của tệp. Ví dụ `−80 ms` cắt 80 ms đầu tệp. Vị trí buffer `b = t − offset/1000`; `b < 0` nghĩa là chưa tới đầu tệp. Cùng một hàm `mapToBuffer(t, offsetMs)` dùng cho Preview và cho xuất (§7), để hai nơi không thể lệch nhau.
- **Phạm vi và nhập:** ±10 000 ms, bước 1 ms (REQ-WIDGET-07). Ô số (`NumberField`, đơn vị `ms`, hỗ trợ phép tính và `+=` theo REQ-UI-15) cộng nút **− / +** (bước 1 ms; giữ Shift = 10 ms; giữ Alt = 100 ms [PROVISIONAL]). Ngoài phạm vi thì kẹp và hiện thông báo, không từ chối im lặng.
- **Lưu và hoàn tác:** `Doc.audioOffsetMs: number` (mặc định 0) trong store; lệnh `setAudioOffset` với `mergeKey: 'audio.offset'` (gõ/bấm ± liên tiếp gộp thành một mục), nhãn `web.cmd.audioOffset`, có trong danh sách lịch sử. Offset là thuộc tính của **dự án, không của tệp**: đổi tệp hay gỡ tệp không đặt lại offset, nên các mục hoàn tác luôn hợp lệ.
- **Tệp âm thanh không nằm trong `Doc`/lịch sử** (quá lớn, không JSON-hoá được): nó sống ở `lib/audioAsset.ts` như tài nguyên của phiên. Nạp/gỡ tệp là thao tác phiên, **không hoàn tác được** (có thể nạp lại). Đổi offset khi đang phát: neo lại tại `t` hiện tại với offset mới (nghe thấy ngay).
- **Chữ giải thích theo giá trị (chỉnh 7, qua `locales/`):** dưới ô offset luôn có một dòng nói bằng lời: `> 0` → "Âm thanh trễ 120 ms"; `< 0` → "Âm thanh sớm 80 ms" kèm "Cắt 80 ms đầu tệp âm thanh (trước mốc 0)"; `= 0` → "Âm thanh khớp với dự án". Khoá `web.audio.offset.late/early/cut/zero`, tham số `{ms}` định dạng theo ngôn ngữ.
- **Hiển thị:** chế độ **Cơ bản** chỉ có nút "Nạp âm thanh" + tên tệp (+ thời lượng, nút gỡ); **offset** nằm sau "Thêm tuỳ chọn" (dòng ADV). Nút "Nạp âm thanh" và vùng thả tệp nằm trong mục 01 Bài.

#### 6.2.4 Phát / dừng / tua / lặp / về đầu
- **Phát:** lần đầu trong sự kiện bấm: tạo `AudioContext({ sampleRate: 48000, latencyHint: 'interactive' })` (không hỗ trợ 48k thì để mặc định, trình duyệt tự resample) rồi `resume()`. **Không tạo/resume ngoài sự kiện người dùng.** Nếu `resume()` chưa xong, đồng hồ không chạy, nên hình không chạy trước tiếng.
- **Dừng:** `stop()` các nguồn, hạ gain 5 ms trước để không bị tiếng "tách"; `t` đứng đúng tại vị trí nghe được.
- **Tua (kéo thanh, ←/→, nhảy đầu/cuối):** đang dừng chỉ đổi `t`; đang phát thì hạ gain đoạn cũ 3 ms, tạo đoạn mới tại vị trí mới và neo lại. Mỗi lần neo tăng `generation`; sự kiện `ended` của đoạn cũ bị bỏ qua nếu `generation` đã đổi. Giới hạn một lần tạo nguồn mỗi khung hình khi kéo liên tục.
- **Lặp (Loop Range / cả bài, REQ-UI-03):** không dùng `loop` của nút nguồn (không xử lý được phần im lặng do offset). Trình lên lịch **đặt trước đoạn kế** trên trục `AudioContext` khoảng 100–150 ms trước điểm kết thúc đoạn hiện tại (nên chính xác theo mẫu). Toán thuần `positionWithLoop(t0, trôi, [a,b])`: `t0 + trôi < b` thì tiến thẳng, ngược lại `a + ((t0 + trôi − b) mod (b − a))`.
- **Về đầu:** `seek(0)`. **Hết bài:** dừng tại `duration`, bấm Phát lại thì về 0 (như `togglePlay` hiện nay).
- **Độ dài phát** = `max(độ dài dự án, offset + độ dài âm thanh)` để âm thanh dài hơn không bị cắt, đúng công thức `Duration` ở §7 (chưa cộng 2 s đệm cuối, phần đó chỉ của xuất).

#### 6.2.5 Sóng âm cho thanh tua (việc để dành từ T-70)
- **Tính trong Worker** `workers/audioPeaks.worker.ts`. Luồng chính gửi PCM **theo khối** 2²⁰ mẫu đã trộn mono `(L+R)/2` (chuyển quyền sở hữu bản sao; không gửi cả 460 MB một lần); Worker chỉ cộng dồn đỉnh, **không giữ PCM**.
- **Tất định:** mức cơ sở cố định **512 mẫu mỗi ô**, ô theo vị trí tuyệt đối trong tệp, mỗi ô lưu `(min, max)` Float32. Nên kết quả **không phụ thuộc cách chia khối** và không phụ thuộc kích thước thanh tua. Mọi mức hiển thị lấy bằng hàm thuần `reducePeaks(base, cột)` (min/max theo nhóm ô, không nội suy, không số ngẫu nhiên). Test: cùng PCM chia khối khác nhau cho `Float32Array` giống từng bit.
- **Bộ đệm:** `Map<assetId, PeaksBase>` trong bộ nhớ, ≤ 1 tệp (≈ 0,9 MB cho 20 phút). Đổi kích thước thanh tua chỉ chạy lại `reducePeaks` (rẻ), không đụng Worker. Bộ đệm bền qua phiên là việc của M4.
- **Vẽ:** lớp canvas dưới vạch phát của `Transport`; có offset thì dịch sóng đi `offset` (hình thấy được lệch nhịp trực tiếp). Trong lúc chưa tính xong hiện đường phẳng, không chặn phát.
- Cùng bộ đệm đỉnh này sẽ là đầu vào cho Waveform tổng quan của REQ-WIDGET-07 sau này; FFT/RMS theo khung là việc của widget, không thuộc T-08.

#### 6.2.6 Cảnh báo lệch độ dài
- Hàm thuần `audioLengthCheck(audioSec, projectSec, offsetSec)` so `audioEnd = offset + audioSec` với `projectSec` (độ dài dự án = kết thúc nốt cuối + đuôi theo parser). Mix thường **dài hơn** vài giây vì đuôi vang, nên ngưỡng không đối xứng [PROVISIONAL]:
  - **Ngắn hơn** dự án quá `max(1 s; 2 %)`, hoặc **dài hơn** quá `max(10 s; 10 %)` → cảnh báo `WARN_AUDIO_LENGTH` (mã mới, sẽ thêm vào Phụ lục A SRS và `locales/`).
  - Thông báo hiện **tỉ lệ** `audio / dự án` và gợi ý: tỉ lệ gần hằng số (ví dụ 0,94) thường do **tempo sai** (kiểm ghi đè tempo ở REQ-PARSER-07); chênh lớn bất kỳ thì **có thể chọn nhầm tệp**; chênh nhỏ cố định thì thử offset.
- Không chặn gì; vào mục cảnh báo hiện có (`Notices`), tự biến mất khi đổi offset/tệp làm hết lệch. Dài hơn trần 20 phút là lỗi riêng (§6.2.1).

#### 6.2.7 Dữ liệu giữ lại cho T-09 (xuất video, §7)
`lib/audioAsset.ts` giữ cho cả phiên, và T-09 chỉ đọc:
| Giữ | Dùng để |
|---|---|
| `AudioBuffer` 48 kHz (1–2 kênh, Float32) | phát; xuất đọc theo **khối 1 s** bằng `getChannelData(c).slice(...)` rồi chuyển sang Export Worker (mỗi khối một bản sao, không chuyển nguyên buffer vì Preview còn dùng) |
| `assetId` (SHA-256), `name`, `File` | pre-flight, tên mặc định của tệp xuất, Project Pack (M4) |
| `durationSec`, `sampleRate`, số kênh | `Duration` (§7.1), kiểm đồng bộ |
| `Doc.audioOffsetMs` | `mapToBuffer` / `exportSegments` dùng chung: đoạn thiếu thì chêm im lặng, đoạn thừa (kể cả phần trước mốc 0 khi offset âm) thì cắt (REQ-EXPORT-03) |
| Đỉnh cơ sở 512 mẫu | không dùng ở xuất |
Cắt theo Export Range, chêm im lặng, mã hoá AAC, bù priming (AT-03) và độ trễ khởi tạo là việc của T-09; T-08 chỉ bảo đảm **`mapToBuffer` đã được kiểm test và dùng chung**. Xuất là offline nên **không bao giờ** áp độ trễ thiết bị (chỉnh 1); điều này được khoá bằng test (§6.2.2).

#### 6.2.8 Kiểm thử (thuần, không cần trình duyệt)
`AudioContextLike` giả có `currentTime` tự đặt, `baseLatency`, `outputLatency`, ghi lại các lệnh `start/stop`. Test: phát; dừng; tua khi dừng/đang phát; lặp (qua biên, `t0` trước/sau `a`); offset âm/dương (`b < 0`, `b` vượt buffer); bù độ trễ (nhánh dự phòng: đứng yên đúng bằng độ trễ rồi chạy; `outputLatency` thiếu; kẹp 0,5 s) và nhánh `getOutputTimestamp` (nội suy theo khung, không trừ độ trễ lần hai, cặp không hợp lệ thì rơi về dự phòng); `rearm` khi `sinkchange`/`devicechange`/`statechange` (hình không nhảy, độ trễ lấy lại); **xuất không phụ thuộc độ trễ**; chuyển chế độ khi dừng/đang phát (không nhảy: `|t_sau − t_trước| = 0`); tab ẩn (nhảy `currentTime` mà không có khung); `suspended`; offset hoàn tác/gộp/làm lại trong store; `ERR_FILE_TOO_LARGE`/`ERR_AUDIO_TOO_LONG`/`ERR_AUDIO_DECODE` có mã; sóng âm bit-giống nhau khi đổi cách chia khối; `audioLengthCheck`. Kiểm tay trên trình duyệt thật: phát bài có tiếng, tua nhiều lần, hình–tiếng vẫn khớp.

#### 6.2.9 Quyết định đã duyệt
1. Dấu offset: dương = âm thanh *trễ*; âm = âm thanh *sớm*, cắt phần trước mốc 0.
2. Offset thuộc dự án, không thuộc tệp; nạp/gỡ tệp không hoàn tác được; nạp dự án mới thì gỡ âm thanh và đặt offset về 0.
3. Ngưỡng cảnh báo lệch độ dài (1 s/2 % ngắn; 10 s/10 % dài) và các số [PROVISIONAL] khác.
4. Độ dài phát = `max(dự án, offset + âm thanh)`.
5. Giải mã trên luồng chính bằng `OfflineAudioContext`.
6. Chỉnh sau duyệt: độ trễ tách khỏi offset và xuất (1), `rearm` (2), `getOutputTimestamp` (3), MP3 VBR giải mã rồi mới kiểm (4), đối chiếu ngân sách bộ nhớ (5), offset âm cắt trước mốc 0 (6), chữ giải thích offset (7), CSP giữ nguyên (8).

### 6.3 Danh sách track 🟢
SRS REQ-UI-14 (sửa theo D-50); `apps/web/src/components/TrackPanel.tsx`.

- **Hai kiểu:** `TrackGrid` (mặc định; App đặt ở hàng riêng `lg:col-span-2` dưới khung xem trước) và `TrackList` (dòng gọn trong cột phải, mở rộng tại chỗ bằng `AnimatePresence` + chiều cao `auto`). Phần dùng chung: `TrackHeader` (màu, tên, số nốt, độ sáng hiện tại khi nguồn ≠ `off`), `TrackControls` (độ sáng nền, đảo chiều, bỏ màu tuỳ chỉnh), `TrackInfo` (tầm cao độ, fader, lane automation có dữ liệu, ngưỡng). `TrackLayoutBar` chọn kiểu và số cột (dùng `NumberField`, tối đa = số track).
- **Số cột:** `effectiveColumns(chosen, widthPx, count)` (hàm thuần, có test): `fit = floor((W + gap)/(MIN_CARD_PX + gap))`, `MIN_CARD_PX = 224`; `auto` → `min(fit, count)`; số người dùng chọn → `min(chosen, fit)` và `limited = chosen > fit` để hiện thông báo. Bề rộng lấy bằng `ResizeObserver`; lưới vẽ bằng `grid-template-columns: repeat(cols, minmax(0, 1fr))`.
- **Animation:** mỗi thẻ là `motion.li` có `layout` và `layoutId = track-<id>` dùng chung giữa hai kiểu, bọc cả App trong `LayoutGroup`, nên đổi cột hoặc đổi kiểu thì thẻ di chuyển từ chỗ cũ sang chỗ mới (lò xo `stiffness 420, damping 38`). `MotionConfig reducedMotion="user"` tắt chuyển động khi hệ điều hành bật giảm chuyển động.
- **Dính khi cuộn:** khung xem trước và cột phải chỉ `lg:sticky` ở kiểu Danh sách; ở kiểu Lưới, nếu dính sẽ đè lên thẻ track ở hàng dưới (lỗi đã gặp khi kiểm 2026-11-12).
- **Bàn phím:** `arrowNav` tìm phần tử `[data-track-focus]` gần nhất theo hướng mũi tên bằng toạ độ thật, nên đúng với cả lưới tự động; Enter/Space mở dòng ở kiểu Danh sách.
- **Chống tràn:** mọi lưới con dùng `minmax(0, …)`; `SliderField` co nhãn (`minmax(0,7rem)`) và giữ thanh trượt ≥ 3rem; tên track `truncate`. Kiểm tự động bằng Playwright: đếm phần tử con vượt mép phải thẻ ở 1440/1100/800 px.

### 6.4 Store, lệnh, hoàn tác và chế độ chỉnh sửa 🟢 (T-07; giao diện kéo thả widget ⚪ T-68)

**Đã làm ở T-07 (2026-11-13), theo bản đề xuất được duyệt kèm các chỉnh của chủ dự án.** **Phạm vi trạng thái.** Vào store (hoàn tác được): kiểu nốt, ghi đè theo track, bàn phím, phong cách video, độ sáng nền theo track, ẩn/hiện/solo, thứ tự track, bố cục widget (vị trí, cỡ, xoay, neo, hiện/ẩn, zIndex), lưới/Smart Guides của canvas. **Ngoài store:** đồng hồ phát (`lib/playback.ts`, giữ nguyên), AST và cảnh báo của tệp đã nạp, tab đang mở, chế độ Cơ bản/Nâng cao, theme, kiểu trình bày danh sách track, "Thêm tuỳ chọn" (đều là tuỳ chọn giao diện, `usePref`, REQ-UI-14, ARC-05).

**Cấu trúc store** (`apps/web/src/lib/store.ts`, TypeScript thuần, không React; `useDoc(selector)` bọc `useSyncExternalStore`):
```ts
interface Doc { videoStyle: string; scene: SceneDocument; brightness: Record<TrackId, BrightnessConfig>; order: TrackId[]; hidden: TrackId[]; solo: TrackId[] }
interface Command<D> { type: string; label: string /* khoá i18n */; mergeKey?: string; redo(d: D): D; undo(d: D): D; before: unknown; after: unknown /* để gộp và để biết mục gộp có thành no-op không */ }
interface Store<D> { get(): D; state(): { doc: D; history: { canUndo; canRedo; undoLabel?; redoLabel?; undoCount; redoCount } }; dispatch(c: Command<D> | null): void; undo(): void; redo(): void; beginGesture(): void; endGesture(): void; reset(doc: D): void; subscribe(fn): () => void }
```
- `Doc` bất biến, dùng chung cấu trúc giữa các bản nên mỗi bước lịch sử chỉ tốn vài đối tượng nhỏ. Kiểu nốt và bàn phím **nằm trong `scene`** (thuộc tính Piano Roll), không còn hai state riêng; `scene` là thứ Preset lưu. `videoStyle` là id phong cách đang chọn (mục "Video styles" đọc từ đây; tuỳ chọn `ui.videoStyle` chỉ còn là bản sao để lần mở sau chọn sẵn).
- Hàm dựng lệnh (`lib/commands.ts`) nhận `doc` hiện tại để lấy giá trị "trước" của đúng phần nó đổi (cả `base` kiểu nốt, cả layout của widget…), trả `null` khi không đổi gì; `redo`/`undo` là hàm thuần nên test được từng lệnh. Vì ngăn xếp là LIFO nên chụp cả phần đổi là đủ để `undo` trả đúng trạng thái trước lệnh.
- Nạp dự án mới thành công: `store.reset({ …scene và phong cách giữ nguyên, brightness/order/hidden/solo của dự án mới })` và **xoá lịch sử** cả hai chiều (id track đổi, lệnh cũ không còn nghĩa); nạp lỗi giữ dự án và lịch sử cũ. Lúc mở ứng dụng, thiết lập đã lưu (`localStorage`) nạp vào tài liệu ban đầu (`initialDoc`), lịch sử bắt đầu trống. Mở preset là lệnh `loadPreset` (hoàn tác được, không xoá lịch sử; `videoStyle` thành `'custom'`).
- Lưu `localStorage` (`style`, `keyboard`) giữ như hiện nay, sinh từ `scene`; lưu phiên đầy đủ để M4. Lịch sử không lưu.

**Danh sách lệnh.**
| Nhóm | Lệnh | `mergeKey` |
|---|---|---|
| Kiểu nốt | `patchNoteStyle(field)`; `applyNotePreset(id)` (thay cả `base`, lưu `base` cũ nên hoàn tác trả lại đủ các chỉnh tay); `patchKeyboard(field)` | `note:<trường>`, `kbd:<trường>` |
| Ghi đè theo track | `patchTrackStyle(trackId, patch)`; `clearTrackStyle(trackId)` | `track:<id>:<trường>` |
| Phong cách video | `setVideoStyle(id)`: thay scene bằng scene của phong cách (kèm `base` và `keyboard.enabled`), **giữ ghi đè theo track** như hành vi hiện tại; chỉnh tay/bố cục widget trước đó nằm trong lịch sử. `handEdited(doc)` (kiểu nốt, bàn phím hoặc bố cục khác bản gốc của phong cách, hoặc scene từ preset) bật thông báo nhỏ "Đã đổi phong cách. Ctrl+Z để hoàn tác" ở cột Video styles (`role=status`, không chặn, tự mất khi tài liệu đổi tiếp) | không |
| Độ sáng | `patchBrightness(trackId, patch)` | `bright:<id>:<trường>` |
| Track | `toggleHidden(id)`, `toggleSolo(id, additive)`, `showAll`, `hideAll`, `moveTrack(id, to)` | không |
| Widget | `patchLayout(widgetId, patch)` (x, y, width, height, rotation, anchor), `setWidgetProp(widgetId, path, value)`, `setWidgetVisible`, `reorderZ` (đưa lên/xuống), `patchSnapping` | `layout:<id>`, `prop:<id>:<path>` |
| Preset | `loadPreset(scene)` | không |

**Gộp thao tác kéo.** `beginGesture()` ở `pointerdown` và `endGesture()` ở `pointerup` / `pointercancel` / `blur` / gỡ thành phần (`SliderField` qua `useGesturePointer`, nghe `pointerup` ở `window` để thả ngoài ô vẫn đóng; `GestureContext` mặc định no-op; sau này tay nắm ở Editor dùng chung). Trong một cử chỉ, mọi lệnh cùng `mergeKey` gộp thành một mục: giữ `undo` và `before` của lệnh đầu, thay `redo` bằng lệnh mới nhất. Kéo ra rồi về đúng giá trị cũ thì mục gộp là no-op và bị bỏ khi `endGesture`. Lệnh không có `mergeKey` (đổi phong cách, bộ kiểu nốt, ẩn/hiện…) không bao giờ gộp. Ngoài cử chỉ: phím mũi tên trên thanh trượt gộp các lệnh cùng `mergeKey` cách nhau ≤ 600 ms (đồng hồ truyền vào store để test). **Ô nhập số** gửi đúng một lệnh khi chốt (Enter hoặc rời ô) và `NumberField` bọc lệnh đó trong một cử chỉ riêng để không gộp với thanh trượt vừa chỉnh; nhấn ↑/↓ trong ô vẫn gộp theo cửa sổ 600 ms. Lệnh mới sau khi hoàn tác xoá nhánh làm lại; hoàn tác giữa một cử chỉ đang mở thì đóng cử chỉ trước.

**Giới hạn lịch sử.** 100 mục (`HISTORY_LIMIT`; SRS REQ-UI-02 sửa từ 50 lên 100), bỏ mục cũ nhất khi đầy; một cử chỉ kéo tính một mục. Không giới hạn theo byte vì mục chỉ giữ giá trị trước/sau của phần đổi (dùng chung cấu trúc với tài liệu).

**Phím tắt và nút.** `lib/undoKeys.ts`: `Ctrl/Cmd+Z` hoàn tác, `Ctrl/Cmd+Shift+Z` và `Ctrl+Y` làm lại; bỏ qua khi đang gõ chữ/số trong ô nhập (trình duyệt tự hoàn tác chữ). Dùng lại `lib/a11y.ts`, nhưng `isTypingTarget` hiện cũng loại cả nút và thanh trượt (dành cho Space/Home); với hoàn tác phải chạy được ngay sau khi bấm một nút radio phong cách hoặc chọn "Neon" ở danh sách chọn, nên tách `isTextEntry()` (chỉ ô nhập chữ/số, textarea, contentEditable; **không** gồm nút, thanh trượt, `select`) và `isTypingTarget` gọi lại nó. Nút Hoàn tác / Làm lại ở **hàng 2 của thanh trên** (cạnh các thẻ, căn phải) để không chen hàng 1; `aria-label` và `title` ghi phím tắt (Cmd trên macOS); dưới `lg` chỉ còn biểu tượng. Nút "Hoàn tác" tạm ở cột Video styles (`styleUndo`) bị bỏ.

**Danh sách lịch sử** 🟢 (T-07 bước 2b; `components/HistoryMenu.tsx`, `lib/historyLabels.ts`). `store.state().history` có thêm `timeline` (các bước đã làm cũ → mới, rồi các bước làm lại gần → xa) và `position` (số bước đã làm); `store.jumpTo(position)` lùi/tiến liên tiếp rồi phát **một** lần cập nhật (0 = mốc đầu "Mở dự án"). Lệnh mang `params` (id track, id widget, id bộ dựng sẵn…) cùng `before`/`after`; **nhãn dựng lúc hiển thị** bằng `describeCommand(cmd, {i18n, trackName})`, không lưu chuỗi đã dịch, nên đổi ngôn ngữ thì nhãn đổi theo ("Opacity 0.70 → 0.85" / "Độ đục 0,70 → 0,85"; số nguyên không thêm ",00"; nhiều trường đổi thì "Kiểu nốt: 2 thay đổi"). Mở bằng nút riêng bên phải cụm Hoàn tác/Làm lại (`HistoryIcon`, chỉ biểu tượng, `aria-label` = tooltip = `web.history.open`, `aria-haspopup="menu"`, `aria-expanded`, luôn bấm được; lịch sử rỗng thì danh sách chỉ có mốc "Mở dự án"); danh sách căn mép phải của nút. Danh sách là `role="menu"` gồm các `menuitem` (nút gốc nên Enter/Space = bấm): ↑/↓/Home/End đi vòng, Esc đóng và trả focus, Tab đóng, bấm ra ngoài đóng; bước hiện tại `aria-current="step"` kèm vạch nhỏ `accent` và nền `selection`; bước làm lại dùng `text-faint` kèm chữ ẩn "có thể làm lại" cho trình đọc màn hình. Sau mỗi hoàn tác/làm lại/nhảy bước, `App` đặt một vùng `role="status"` ("Đã hoàn tác: …", "Đã làm lại: …", "Đã tới bước: …"). Lịch sử thẳng một nhánh (lệnh mới sau khi lùi xoá nhánh làm lại). Bảng "Lịch sử" cố định ở chế độ Nâng cao và ở thẻ Editor: T-68.

**Bắt dính** 🟢 (`packages/render-core/src/snap.ts`, hàm thuần dùng chung với bước vẽ xoay của T-68; không DOM, không `Date`; test `snap.test.ts`: lưới, cạnh, tâm, canvas, widget 0°/15°/37°/90°):
```ts
rotatedBounds(layout: {x,y,width,height,rotation,anchor}): Rect          // khung bao thẳng trục của hình đã xoay quanh neo
snap(i: { moving: LayoutWithAnchor; to: {x,y}; others: LayoutWithAnchor[]; canvas: {width,height};
          grid: {enabled,size}; guides: boolean; threshold?: 5; alt?: boolean; shift?: boolean; from?: {x,y} }): { x: number; y: number; guides: Guide[] }
interface Guide { axis: 'x'|'y'; pos: number; from: number; to: number; kind: 'left'|'center'|'right'|'top'|'middle'|'bottom'|'canvas' }
```
Thứ tự: (1) tính khung bao đã xoay của `moving` ở vị trí đề xuất; (2) Smart Guides: so trái/giữa/phải và trên/giữa/dưới của khung bao với mép/tâm canvas và khung bao các widget khác, ngưỡng 5 pt, chọn khoảng cách nhỏ nhất theo mỗi trục; (3) trục nào chưa dính guide thì làm tròn về lưới, **lưới áp cho cạnh trái/trên của khung bao** (widget xoay thì lưới bắt khung bao, không phải `layout.x/y`); (4) dịch `layout` đúng bằng độ lệch đã bắt (`x,y` trả về là của `layout`, không phải của khung bao); `alt` tắt bắt dính, `shift` khoá trục theo `from`. Guide trả về là dữ liệu hình học; màu token `guide` (D-55) do lớp phủ Editor (T-68) chọn. **Hoãn sang T-68 (đã ghi ở PROGRESS):** Equal Spacing (REQ-GRAPHICS-02, ba đối tượng thẳng hàng), gióng theo cạnh của chính widget cùng góc xoay (REQ-GRAPHICS-03), bắt dính khi đổi cỡ/xoay. `snap()` trả thêm `bounds` (khung bao ở vị trí đã bắt dính) và mỗi `Guide` có `with` (`'canvas'` hoặc chỉ số trong `others`).

**Kéo/đổi cỡ widget, lớp tương tác, Preview Mode:** như thiết kế ban đầu của M2 (lớp DOM/SVG phủ canvas, không vẽ vào canvas của Render Core, ẩn ở Preview/Export), làm ở T-68.

**Preset `.json`** (`apps/web/src/lib/presetFile.ts` + `packages/render-core/src/scene.ts`):
- *Lược đồ* 🟢: `SceneDocument` như 5.1, thêm `layout.anchor {x,y}` (0..1, mặc định tâm). Lược đồ máy đọc `presets/schema/scene.schema.json` (cùng kiểu với `note-style.schema.json`) dùng cho tài liệu và cho test "mọi tệp trong `presets/scene/` qua lược đồ"; việc kiểm lúc chạy vẫn là `sanitizeScene` (kiểm kiểu, kẹp khoảng, bỏ trường lạ).
- *An toàn đọc tệp (NFR-SEC-04):* `lib/presetFile.ts` kiểm `file.size` ≤ 1 MiB **trước khi** gọi `file.text()` (`ERR_PRESET_TOO_LARGE`), chỉ `JSON.parse` (không `eval`), bỏ BOM, rồi chuyển cho `sanitizeScene`. `sanitizeScene` tự chạy `cleanJson` trước mọi thứ khác (nên áp cho cả preset import lúc build): sâu ≤ 12, tổng nút ≤ 20 000, ≤ 64 widget, chuỗi ≤ 4096 ký tự, mảng ≤ 1024 phần tử (hằng `PRESET_LIMITS`); vượt thì `ERR_PRESET_INVALID` kèm `details.path`. Khoá `__proto__`, `constructor`, `prototype` bị **bỏ** ở mọi độ sâu và báo `WARN_PRESET_UNSAFE_KEY`; cây được dựng lại bằng `{}` + gán khoá đã lọc nên không đối tượng nào bị đổi nguyên mẫu (test kiểm `Object.prototype` không bị bẩn). URL/đường dẫn ngoài trong preset không được theo (NFR-SEC-06).
- *Di trú* (`migrateScene(raw)` trong `scene.ts`, chạy trên bản sao, gốc giữ nguyên đến khi thành công): chuỗi bước theo phiên bản chính.phụ. `0.3.x → 0.4.0`: mỗi `widget.layout` thiếu `anchor` được thêm `{x: 0.5, y: 0.5}`, `schemaVersion = '0.4.0'`, báo `WARN_PRESET_MIGRATED {from, to}` (preset dựng sẵn trong `presets/scene/` được cập nhật lên 0.4.0 nên không báo). `SCENE_SCHEMA_VERSION = '0.4.0'`. Phiên bản mới hơn ứng dụng hiểu (> 0.4.x, hoặc phiên bản chính lớn hơn 0) → `ERR_SCHEMA_NEWER` (REQ-STORAGE-04, `details.found`); phiên bản quá cũ (< 0.3) hoặc sai dạng → `ERR_PRESET_INVALID`; trước đây khác phiên bản phụ chỉ là `WARN_PRESET_VERSION`, từ nay chỉ dùng cho khác bản vá trong 0.4. Preset dựng sẵn `presets/scene/*.json` đã ở 0.4.0 (có `anchor`); bản 0.3.0 gốc của `paper-1x1` giữ làm fixture `packages/render-core/test/fixtures/paper-1x1.v0.3.0.json` cho test di trú.
- *Xoay:* `rotation` được chuẩn hoá về (−180, 180] (`normalizeAngle`) và `anchor` được kẹp 0..1; cho tới T-68 `sanitizeScene` đặt `rotation` về **0** kèm `WARN_PRESET_UNSUPPORTED` để Preview không hiện hình sai (trước T-07 mã chỉ cảnh báo mà vẫn giữ giá trị; nay khớp với TECHNICAL-DESIGN §8 và SRS).
- *Mở/lưu* 🟢: nút **Mở preset…** (`<input type="file" accept=".json">`) và **Lưu preset…** (`Blob` + liên kết tải, tên tệp qua bộ làm sạch) ở thẻ Settings, mục "Preset"; Editor (T-68) sẽ thêm lối tắt. Mở = `loadPreset` (một bước hoàn tác); cảnh báo `WARN_PRESET_*` đi vào danh sách `problems` ở phía trên sân khấu như cảnh báo parser, có dịch (`warn.WARN_PRESET_*`, `errors.ERR_PRESET_*` trong `locales/`). Lưu ghi `scene` hiện tại (kèm kiểu nốt/bàn phím), không ghi AST hay tệp dự án.

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
- **Preset `.json`** 🟢 (T-07, chi tiết ở 6.4): `schemaVersion` 0.4.0; kiểm kiểu/khoảng giá trị, trường lạ bỏ, giá trị sai về mặc định kèm cảnh báo; không đọc được → `ERR_PRESET_INVALID`; cũ hơn → di trú (`WARN_PRESET_MIGRATED`); mới hơn → `ERR_SCHEMA_NEWER`; khoá nguy hiểm bị bỏ; `rotation ≠ 0` đưa về 0 tới T-68. Lưu vào IndexedDB cùng workspace vẫn là M4.
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
| Âm thanh (T-08) | PCM 48 kHz stereo ≤ 20 phút = 460,8 MB ≤ 25 % trần 2,0 GB của NFR-PERF-04; đỉnh tạm khi giải mã ≲ 1,2 GB, không chạy cùng lúc với xuất **[PROVISIONAL]** | Dò thời lượng trước khi giải mã, bỏ buffer cũ trước khi nạp mới, không giữ byte tệp nén, sóng âm tính theo khối (§6.2) |
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
