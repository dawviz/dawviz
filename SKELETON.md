# SKELETON — cấu trúc mã nguồn

> **Sinh tự động** bởi `node scripts/sync-docs.mjs` — không sửa tay (mọi chỉnh sửa sẽ bị ghi đè). Quét `packages/*/src`, `apps/*/src` (chữ ký công khai) và `bin/`, `scripts/` (tóm tắt). Mô tả mỗi tệp lấy từ **dòng chú thích đầu tệp**; mô tả mỗi hàm lấy từ chú thích ngay phía trên. Thiếu thì thêm vào mã rồi chạy lại.

## 1. Cây thư mục

```text
dawviz/
├─ apps/
│  ├─ parser-lab/   # trang thử parser (HTML + Worker)
│  │  ├─ index.html
│  │  └─ parser-worker.js
│  └─ web/   # ứng dụng React (Vite, Tailwind, Framer Motion)
│     ├─ public/
│     │  └─ theme-boot.js
│     ├─ src/
│     │  ├─ components/
│     │  │  ├─ FileDrop.tsx
│     │  │  ├─ Icons.tsx
│     │  │  ├─ Inspector.tsx
│     │  │  ├─ LanguageSelect.tsx
│     │  │  ├─ MissingMidiPanel.tsx
│     │  │  ├─ Notices.tsx
│     │  │  ├─ NumberField.tsx
│     │  │  ├─ SceneCanvas.tsx
│     │  │  ├─ Select.tsx
│     │  │  ├─ SliderField.tsx
│     │  │  ├─ Stage.tsx
│     │  │  ├─ StatusIcon.tsx
│     │  │  ├─ StylePanel.tsx
│     │  │  ├─ ThemeSelect.tsx
│     │  │  ├─ TrackPanel.tsx
│     │  │  ├─ Transport.tsx
│     │  │  └─ VideoStyles.tsx
│     │  ├─ i18n/
│     │  │  └─ I18nProvider.tsx
│     │  ├─ lib/
│     │  │  ├─ a11y.ts
│     │  │  ├─ clock.test.ts
│     │  │  ├─ clock.ts
│     │  │  ├─ csp.test.ts
│     │  │  ├─ csp.ts
│     │  │  ├─ externalMidi.test.ts
│     │  │  ├─ externalMidi.ts
│     │  │  ├─ numberInput.test.ts
│     │  │  ├─ numberInput.ts
│     │  │  ├─ parseInWorker.ts
│     │  │  ├─ parserClient.test.ts
│     │  │  ├─ parserClient.ts
│     │  │  ├─ playback.test.ts
│     │  │  ├─ playback.ts
│     │  │  ├─ prefs.test.ts
│     │  │  ├─ prefs.ts
│     │  │  ├─ problems.test.ts
│     │  │  ├─ problems.ts
│     │  │  ├─ theme.test.ts
│     │  │  ├─ theme.ts
│     │  │  ├─ timeFormat.ts
│     │  │  ├─ transportKeys.ts
│     │  │  ├─ trustedTypes.ts
│     │  │  ├─ usePref.ts
│     │  │  └─ useStageWidth.ts
│     │  ├─ types/
│     │  │  └─ dawviz.d.ts
│     │  ├─ workers/
│     │  │  └─ parser.worker.ts
│     │  ├─ App.tsx
│     │  ├─ index.css
│     │  └─ main.tsx
│     ├─ test/
│     │  ├─ components.test.tsx
│     │  └─ setup.ts
│     ├─ DESIGN.md
│     ├─ index.html
│     ├─ package.json
│     ├─ postcss.config.js
│     ├─ tailwind.config.js
│     ├─ tsconfig.json
│     └─ vite.config.ts
├─ assets/
│  ├─ backgrounds/
│  ├─ fonts/
│  └─ README.md
├─ bin/
│  └─ dawparse.mjs
├─ docs/   # tài liệu; xem AI_CONTEXT.md
├─ locales/   # danh mục ngôn ngữ
│  ├─ en.json
│  ├─ index.json
│  ├─ README.md
│  └─ vi.json
├─ packages/
│  ├─ als/   # @dawviz/parser-als: .als/.alp
│  │  ├─ src/
│  │  │  ├─ alp.js
│  │  │  ├─ als.js
│  │  │  └─ index.js
│  │  └─ package.json
│  ├─ binary/   # @dawviz/parser-binary: nhị phân theo JSON schema
│  │  ├─ src/
│  │  │  ├─ binary.js
│  │  │  └─ index.js
│  │  └─ package.json
│  ├─ core/   # @dawviz/parser-core: lỗi, giới hạn, ZIP/XML, tempo, AST, automation
│  │  ├─ src/
│  │  │  ├─ ast.js
│  │  │  ├─ automation.js
│  │  │  ├─ bytes.js
│  │  │  ├─ compare.js
│  │  │  ├─ errors.js
│  │  │  ├─ index.js
│  │  │  ├─ limits.js
│  │  │  ├─ tempo.js
│  │  │  ├─ xml.js
│  │  │  └─ zip.js
│  │  └─ package.json
│  ├─ dawproject/   # @dawviz/parser-dawproject
│  │  ├─ src/
│  │  │  ├─ dawproject.js
│  │  │  └─ index.js
│  │  └─ package.json
│  ├─ i18n/   # @dawviz/i18n
│  │  ├─ src/
│  │  │  └─ index.js
│  │  └─ package.json
│  ├─ midi/   # @dawviz/parser-midi: .mid
│  │  ├─ src/
│  │  │  ├─ index.js
│  │  │  └─ midi.js
│  │  └─ package.json
│  ├─ parser/   # @dawviz/parser: cổng vào (detect/probe/parse)
│  │  ├─ src/
│  │  │  └─ index.js
│  │  └─ package.json
│  ├─ render-core/   # @dawviz/render-core: khung hình = hàm của t
│  │  ├─ src/
│  │  │  ├─ brightness.ts
│  │  │  ├─ draw.ts
│  │  │  ├─ glow.ts
│  │  │  ├─ index.ts
│  │  │  ├─ music.ts
│  │  │  ├─ notes.ts
│  │  │  ├─ parser-core.d.ts
│  │  │  ├─ pianoroll.ts
│  │  │  ├─ render.ts
│  │  │  ├─ scene.ts
│  │  │  ├─ style.ts
│  │  │  └─ types.ts
│  │  ├─ test/
│  │  │  ├─ glow.test.ts
│  │  │  ├─ presets.test.ts
│  │  │  ├─ render-core.test.ts
│  │  │  └─ scene.test.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  ├─ rpp/   # @dawviz/parser-rpp: Reaper .rpp
│  │  ├─ src/
│  │  │  ├─ index.js
│  │  │  └─ rpp.js
│  │  └─ package.json
│  └─ README.md
├─ presets/
│  ├─ note-style/
│  │  ├─ flat.json
│  │  ├─ neon.json
│  │  ├─ outline.json
│  │  ├─ rainbow-pitch.json
│  │  └─ soft-bars.json
│  ├─ schema/
│  │  └─ note-style.schema.json
│  └─ README.md
├─ schemas/
├─ scripts/
│  ├─ docs-site/
│  │  ├─ assets/
│  │  │  ├─ app.js
│  │  │  └─ style.css
│  │  ├─ build.mjs
│  │  ├─ config.json
│  │  ├─ markdown.mjs
│  │  ├─ markdown.test.mjs
│  │  └─ slug.mjs
│  ├─ bundle.mjs
│  ├─ check-i18n.mjs
│  ├─ rewrite-imports.mjs
│  ├─ split_doc.py
│  └─ sync-docs.mjs
├─ test/   # test của thư viện parser
│  ├─ fixtures/   # tệp mẫu
│  ├─ als.test.js
│  ├─ binary.test.js
│  ├─ dawproject.test.js
│  ├─ detect-bundle.test.js
│  ├─ helpers.mjs
│  ├─ i18n.test.js
│  ├─ midi-alp.test.js
│  └─ rpp.test.js
├─ AI_CONTEXT.md
├─ ARCHITECTURE.md
├─ CONTRIBUTING.md
├─ LICENSE
├─ package.json
├─ PRODUCT.md
├─ PROGRESS.md
├─ README.md
└─ SKELETON.md
```

## 2. Mã nguồn và chữ ký công khai

### packages/als — @dawviz/parser-als: .als/.alp

#### `packages/als/src/alp.js`

Ableton Live Pack (.alp).

```text
function pickMainAls(entries)   // Chọn file .als chính trong ZIP: ưu tiên ngoài cùng (ít thư mục nhất), rồi lớn nhất.
async function listAlp(buffer, options = {})   // Liệt kê các file .als trong gói để người dùng chọn (không dựng AST đầy đủ). Trả { container, files:[{index, n…
async function parseAlp(buffer, options = {})
```

#### `packages/als/src/als.js`

Ableton Live (.als): XML thuần HOẶC XML nén Gzip. Nhận dạng bằng magic bytes, không dựa vào phần mở rộng.

```text
async function parseAls(buffer, options = {})
const decodeAbletonTimeSig = (v) =>   // Enum nhịp của Live: 201 = 4/4. numerator = v%99 + 1; denominator = 2^floor(v/99) [VERIFY: suy từ 1 mẫu + công…
function parseAlsText(text, options = {})
async function alsInventory(buffer, options = {})   // Kiểm kê đường dẫn XML của file .als (đã bỏ Devices/AudioTrack...): dùng để đối chiếu [VERIFY] với file thật.
```

#### `packages/als/src/index.js`

Cổng vào của @dawviz/parser-als: parseAls, parseAlp, listAlp, alsInventory.

```text
re-export { parseAls, parseAlsText, decodeAbletonTimeSig, alsInventory } from './als.js'
re-export { parseAlp, listAlp, pickMainAls } from './alp.js'
```

### packages/binary — @dawviz/parser-binary: nhị phân theo JSON schema

#### `packages/binary/src/binary.js`

Parser nhị phân khai báo: một file JSON mô tả cấu trúc byte + cách ánh xạ sang UnifiedProjectAST.

```text
function validateSchema(schema)   // ======================= kiểm tra schema =======================
function readBinary(buffer, schema, options = {})
function matchSchema(fileName, u8, schemas = [])   // Chọn schema theo phần mở rộng + magic.
async function parseBinaryWithSchema(buffer, schema, options = {})   // ======================= ánh xạ sang AST =======================
```

#### `packages/binary/src/index.js`

Cổng vào của @dawviz/parser-binary: đọc tệp nhị phân theo JSON schema.

```text
re-export { parseBinaryWithSchema, readBinary, validateSchema, matchSchema } from './binary.js'
```

### packages/core — @dawviz/parser-core: lỗi, giới hạn, ZIP/XML, tempo, AST, automation

#### `packages/core/src/ast.js`

Dựng + xác thực UnifiedProjectAST (REQ-AST-01). Mọi parser đều đi qua buildAST.

```text
const pitchName = (p) =>
function createPairer()   // Ghép cặp Note-On/Off theo FIFO cho mỗi khóa (REQ-PARSER-04). Dùng cho MIDI và Reaper.
function buildAST(inp, opts = {})
function parsePositionText(text, { unit = 'time', numerator = 4, denominator = 4 } = {})   // Đọc vị trí người dùng gõ theo cách các DAW hiển thị, trả { timeSeconds } hoặc { beat } (dùng cho tempoOverrid…
function parseTimeSignature(text)   // Đọc dấu nhịp dạng "4/4", "3/4", "6/8", "12/8", "7/8", "5/4". Tử 1–64, mẫu số ∈ {1,2,4,8,16,32}. Trả { num, de…
function resolveTempoRows(rows, { unit = 'time', base = { num: 4, den: 4 } } = {})   // Đổi các dòng người dùng nhập thành điểm cho tempoOverride. rows: [{ pos, bpm, sig? }]; pos theo `unit` (xem p…
function normalizeTempoOverride(o)
```

#### `packages/core/src/automation.js`

Đường tự động hoá (automation) của track: âm lượng, pan, mute. Dùng cho hiệu ứng như "track sáng hơn khi âm lượng to hơn" (SRS REQ-GRAPHICS-06).

```text
const FADER_EXP
const gainToDb = (g) =>
const dbToGain = (db) =>
function shapeCurve(a, shape, tension = 0)   // Hệ số dạng đường cong (0..1) cho đoạn bắt đầu bằng điểm có `shape`/`tension`.
function sampleLane(lane, tick)   // Giá trị của lane tại `tick` (miền thô của lane: gain tuyến tính / pan / mute). Trước điểm đầu và sau điểm cuố…
function volumeToUnit(gain, { floorDb = -36, ceilDb = 0 } = {})   // Đổi âm lượng (gain tuyến tính) thành độ sáng 0..1 để ứng dụng dùng: dB ≤ floorDb → 0, ≥ ceilDb → 1, tuyến tín…
```

#### `packages/core/src/bytes.js`

Tiện ích byte: ép về Uint8Array, nhận dạng magic bytes, giải nén có trần (chống zip bomb), giải mã UTF-8.

```text
const toU8 = (b) =>
function sniff(u8)   // Nhận dạng theo magic bytes (REQ-UI-01).
async function inflateLimited(u8, format, limits, label = 'dữ liệu')   // Giải nén streaming, đếm byte thực tế (không tin header) — chống zip-bomb.
function decodeUtf8(u8)
```

#### `packages/core/src/compare.js`

So sánh hai AST (KPI-01 / AT-01): AST từ parser vs AST từ MIDI xuất ra bởi chính DAW.

```text
function compareAST(a, b, opts = {})   // Dung sai mặc định = 1 tick của độ phân giải THÔ hơn trong hai nguồn (quy về 960). Ví dụ MIDI tham chiếu 96 PP…
```

#### `packages/core/src/errors.js`

Mã lỗi theo SRS mục 8 (ERR_*). Mọi parser chỉ ném DawParseError.

```text
class DawParseError extends Error   // Mã lỗi theo SRS mục 8 (ERR_*). Mọi parser chỉ ném DawParseError.
  constructor(code, message, details)
const fail = (code, message, details) =>
const warn = (list, code, message, details) =>   // Cảnh báo không làm dừng parse. { code, message, details? }
```

#### `packages/core/src/index.js`

Cổng vào của @dawviz/parser-core: gom lỗi, giới hạn, byte, ZIP, XML, tempo, AST, so sánh, automation.

```text
re-export * from './errors.js'
re-export * from './limits.js'
re-export * from './bytes.js'
re-export * from './zip.js'
re-export * from './xml.js'
re-export * from './tempo.js'
re-export * from './ast.js'
re-export * from './compare.js'
re-export * from './automation.js'
```

#### `packages/core/src/limits.js`

REQ-PARSER-00 [PROVISIONAL]. Có thể ghi đè qua options.limits.

```text
const DEFAULT_LIMITS   // REQ-PARSER-00 [PROVISIONAL]. Có thể ghi đè qua options.limits.
const resolveLimits = (o) =>
```

#### `packages/core/src/tempo.js`

TempoMap (D-08): tick là nguồn sự thật, giây là giá trị suy ra. PPQ nội bộ = 960.

```text
const PPQ   // TempoMap (D-08): tick là nguồn sự thật, giây là giá trị suy ra. PPQ nội bộ = 960.
function makeTempoMap(points)   // points: [{tick, bpm, num?, den?}] -> TempoPoint[] có timeSeconds. Điểm trùng tick: điểm sau thắng.
const tickToSec = (map, tick) =>
const secToTick = (map, sec) =>   // Trả số thực (không làm tròn); nơi gọi tự Math.round.
function mergeTempoAndSig(tempos, sigs, defaults = { bpm: 120, num: 4, den: 4 })   // Gộp điểm tempo và điểm nhịp (time signature) độc lập thành các điểm {tick,bpm,num,den}.
function rampToSteps(t0, b0, t1, b1, stepTicks = PPQ / 2, maxSteps = 256)   // Xấp xỉ dốc tempo tuyến tính (b0 -> b1 trong [t0,t1) tick) bằng các bậc. Nguồn khai báo dốc mới dùng (SRS REQ-…
```

#### `packages/core/src/xml.js`

XML scanner nhanh, không DOM, không mạng, không mở rộng entity tùy biến (an toàn trước XXE/billion-laughs).

```text
function parseXml(text, opts = {})
const kid = (n, name) =>   // ---- truy cập nhanh
const kids = (n, name) =>
const at = (n, path) =>
const val = (n, path, def, attr = 'Value') =>   // Giá trị thuộc tính (mặc định "Value") của nút tại path.
const num = (n, path, def) =>
function* descendants(n, name)
function pathInventory(root, { maxDepth = 12 } = {})   // Kiểm kê đường dẫn: mỗi đường dẫn duy nhất -> số lần xuất hiện + thuộc tính mẫu. Dùng để đối chiếu [VERIFY] vớ…
const formatInventory = (inv) =>
```

#### `packages/core/src/zip.js`

Đọc ZIP tối thiểu, không phụ thuộc. Chỉ giải nén entry được yêu cầu (gói .alp có thể chứa hàng trăm MB sample).

```text
function readZipDirectory(u8, limits)
async function extractEntry(u8, entry, limits)
const findEntry = (entries, name) =>
```

### packages/dawproject — @dawviz/parser-dawproject

#### `packages/dawproject/src/dawproject.js`

DAWproject (.dawproject = ZIP + project.xml + metadata.xml; do Bitwig, Studio One, Cubase... xuất). REQ-PARSER-03.

```text
async function parseDawproject(buffer, options = {})
function parseDawprojectXml(xmlText, options = {})
async function dawprojectInventory(buffer, options = {})   // Kiểm kê đường dẫn XML của project.xml trong .dawproject (đối chiếu [VERIFY] với file thật).
```

#### `packages/dawproject/src/index.js`

Cổng vào của @dawviz/parser-dawproject.

```text
re-export { parseDawproject, parseDawprojectXml, dawprojectInventory } from './dawproject.js'
```

### packages/i18n — @dawviz/i18n

#### `packages/i18n/src/index.js`

@dawviz/i18n — đa ngôn ngữ nhỏ, không phụ thuộc, chạy trong trình duyệt/Worker/Node. Xem docs/I18N.md.

```text
function localeChain(tag)   // 'vi-VN' → ['vi-VN','vi']; 'zh_Hant_TW' → ['zh-Hant-TW','zh-Hant','zh']
function matchLocale(wanted, available, fallback = 'en')   // Chọn locale tốt nhất trong `available` cho danh sách ưu tiên `wanted` (vd navigator.languages); không khớp → …
const dirOf = (locale) =>
function parseMessage(src)   // Tách chuỗi thành các mảnh: text | {arg} | {arg, plural, ...}. Ném Error nếu ngoặc không cân.
function describeMessage(src)   // Các tên tham số và nhánh số nhiều dùng trong một chuỗi (cho bộ kiểm tra danh mục).
function createI18n({ locale = 'en', fallback = 'en', catalogs = {}, onMissing } = {})
async function loadLocales(baseUrl, { fetchImpl = globalThis.fetch, only } = {})   // Tải danh mục từ thư mục locales/ qua fetch (trình duyệt) — manifest `index.json` liệt kê các mã ngôn ngữ.
```

### packages/midi — @dawviz/parser-midi: .mid

#### `packages/midi/src/index.js`

Cổng vào của @dawviz/parser-midi: parseMidi.

```text
re-export { parseMidi, readSmf } from './midi.js'
```

#### `packages/midi/src/midi.js`

Standard MIDI File (format 0/1/2). REQ-PARSER-04.

```text
function readSmf(u8, warnings = [])   // Đọc thô SMF -> { format, division, tempos, sigs, tracks:[{name, notes:[{pitch,channel,startTick,endTick,veloc…
async function parseMidi(buffer, options = {})
```

### packages/parser — @dawviz/parser: cổng vào (detect/probe/parse)

#### `packages/parser/src/index.js`

Cổng vào duy nhất cho ứng dụng: parseProject(fileName, buffer, options).

```text
re-export * from '@dawviz/parser-core'
re-export { parseMidi, parseAls, parseAlp, parseRpp, parseDawproject, parseBinaryWithSchema, matchSchema }
re-export { inspectRpp } from '@dawviz/parser-rpp'
re-export { listExternalMidi }
re-export { externalMidiKey } from '@dawviz/parser-rpp'
re-export { alsInventory, listAlp } from '@dawviz/parser-als'
re-export { dawprojectInventory } from '@dawviz/parser-dawproject'
re-export { validateSchema, readBinary } from '@dawviz/parser-binary'
const SUPPORTED
function detectFormat(name, buffer, options = {})   // Nhận dạng theo phần mở rộng + magic bytes (REQ-UI-01). Trả { format, schema? } hoặc ném ERR_UNSUPPORTED_FORMA…
function probeProject(name, buffer, options = {})   // Dò nhanh xem file cần thêm đầu vào nào để giao diện chỉ hiện ô nạp khi thật sự cần (REQ-UI-08): - needs.exter…
async function parseProject(name, buffer, options = {})
```

### packages/render-core — @dawviz/render-core: khung hình = hàm của t

#### `packages/render-core/src/brightness.ts`

Độ sáng track theo automation (SRS REQ-GRAPHICS-06, BRD D-33). Hàm thuần của (track, t, cấu hình): tất định giữa Preview và Export.

```text
type BrightnessSource
interface BrightnessConfig
const DEFAULT_BRIGHTNESS
const BRIGHTNESS_DB_RANGE   // Giới hạn ngưỡng dB cho ô nhập và cho sanitize (khớp REQ-GRAPHICS-06). Khoảng cách tối thiểu giữa sàn và trần:…
function sanitizeBrightness(cfg: BrightnessConfig, edited?: keyof BrightnessConfig): BrightnessConfig   // Đưa cấu hình độ sáng về hợp lệ: dB trong [-120, 24], sàn < trần ít nhất 1 dB, độ sáng trong [0, 1], min ≤ max…
function sourceUnit(track: ProjectTrack, tempoMap: TempoPoint[], t: number, cfg: BrightnessConfig): number | undefined   // Giá trị nguồn chuẩn hoá 0..1 tại giây `t`; undefined nếu track không có dữ liệu cho nguồn đó.
function trackBrightness(track: ProjectTrack, tempoMap: TempoPoint[], t: number, cfg: BrightnessConfig = DEFAULT_BRIGHTNESS): number   // Độ sáng B(t) trong [minBrightness, maxBrightness]; track không có dữ liệu nguồn → 1 (hình ảnh không đổi).
```

#### `packages/render-core/src/draw.ts`

Lớp vẽ duy nhất lên Canvas 2D / OffscreenCanvas. Preview và Export đều gọi hàm này (WYSIWYG, D-06).

```text
interface Ctx2D
function drawPianoRoll(ctx: Ctx2D, rects: NoteRect[], size: { width: number; height: number; background: string; playheadX: number }): void
function drawKeyboard(ctx: Ctx2D, keys: KeyRect[], o: { width: number; height: number; whiteColor: string; separator?: string }): void   // Vẽ bàn phím lên vùng bên trái (gọi SAU drawPianoRoll nên che phần nốt đã trôi qua).
```

#### `packages/render-core/src/glow.ts`

Phát sáng động khi thanh phát chạm nốt (SRS REQ-GRAPHICS-17). Hàm thuần của (kiểu, track, nốt, t): tất định.

```text
interface GlowCtx
function laneUnit(track: ProjectTrack, name: string, tempoMap: TempoPoint[], t: number): number | undefined   // Giá trị lane automation tại t, chuẩn hoá 0..1 theo loại lane. Không có lane → undefined.
function glowSourceValue(st: NoteStyle, c: GlowCtx): number | undefined   // Giá trị nguồn 0..1 cho nốt tại t; undefined = không có dữ liệu (khi đó coi như 1: sáng như chế độ đều nhau).
function glowAmount(st: NoteStyle, c: GlowCtx): number   // Hệ số nhân 0..1 cho `glow` của nốt tại t (đã gồm bao thời gian: đang phát / tắt dần sau nốt / luôn sáng).
function panUnit(u: number, st: Pick<NoteStyle, 'glowPanMode'>): number   // u = pan đã chuẩn hoá 0..1 (0 trái, 0,5 giữa, 1 phải). 'lr' giữ nguyên; 'spread' = độ lệch khỏi giữa |2u − 1|.
```

#### `packages/render-core/src/index.ts`

Cổng vào của @dawviz/render-core: kiểu AST, độ sáng, chỉ mục nốt, bố cục và vẽ Piano Roll.

```text
re-export * from './types.ts'
re-export * from './brightness.ts'
re-export * from './notes.ts'
re-export * from './pianoroll.ts'
re-export * from './draw.ts'
re-export * from './style.ts'
re-export * from './music.ts'
re-export * from './glow.ts'
re-export * from './scene.ts'
re-export * from './render.ts'
```

#### `packages/render-core/src/music.ts`

Tiện ích âm nhạc dùng chung cho giao diện và widget (không phụ thuộc DOM).

```text
function pitchName(pitch: number, middleCOctave = 4): string   // Tên nốt của số MIDI 0–127. Quy ước mặc định C4 = 60 (Yamaha dùng C3 = 60: truyền `middleCOctave = 3`). Cách g…
```

#### `packages/render-core/src/notes.ts`

Truy cập ngẫu nhiên theo thời gian (NFR-PERF-05): chỉ mục nốt theo track, tìm nốt đang vang tại t bằng tìm nhị phân.

```text
interface TrackIndex
interface TimelineIndex
function buildIndex(tracks: ProjectTrack[], duration: number): TimelineIndex
function notesInRange(ti: TrackIndex, t0: number, t1: number): ASTNote[]   // Các nốt trong [t0, t1] (giao với khoảng), theo thứ tự bắt đầu. Dùng cho cửa sổ nhìn của Piano Roll.
function activeNotes(ti: TrackIndex, t: number): ASTNote[]   // Nốt đang vang tại t: start <= t < end.
```

#### `packages/render-core/src/pianoroll.ts`

Bố cục Piano Roll thuần (không vẽ): trả danh sách hình chữ nhật theo pixel. Cùng đầu vào → cùng đầu ra ở Preview và Export.

```text
interface PianoRollOptions
interface NoteRect
function layoutPianoRoll(index: TimelineIndex, tempoMap: TempoPoint[], t: number, o: PianoRollOptions): NoteRect[]
interface KeyRect
function layoutKeyboard(index: TimelineIndex, t: number, o: { height: number; pitchMin: number; pitchMax: number; style?: Partial<KeyboardStyle>; noteStyle?: StyleConfig }): KeyRect[]
```

#### `packages/render-core/src/render.ts`

T-05: renderFrame + hợp đồng WidgetRenderer (Technical Design §5.1–5.2). Preview và Export gọi cùng hàm này,

```text
interface RenderCtx   // Ngữ cảnh vẽ đủ cho renderFrame (Canvas 2D và OffscreenCanvas đều có).
interface RenderTarget   // `width`/`height` theo điểm ảnh thật của đích vẽ.
interface Derived   // Dữ liệu dẫn xuất: tính một lần ngoài vòng vẽ (Technical Design §4).
type Primitive   // Hình học thuần, đơn vị pt trong toạ độ widget. Đủ cho Piano Roll; widget sau thêm kiểu mới (text, path…).
interface RectPrim
interface LayoutCtx
interface WidgetRenderer
function tracksFor(spec: WidgetSpec<unknown>, index: TimelineIndex): TrackIndex[]   // Chọn track cho widget theo trackMappingMode (SRS REQ-STORAGE-02).
function pianoRollPitchRange(p: PianoRollProps, tracks: TrackIndex[]): [number, number]   // Tầm cao độ của Piano Roll: FIT_CONTENT lấy min/max của track được gán (±1), rỗng thì C3–C6.
const pianoRollRenderer
const WIDGET_RENDERERS   // Bảng renderer theo loại. Widget chưa có renderer được bỏ qua khi vẽ (vẫn giữ trong Scene).
function layoutFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, renderers = WIDGET_RENDERERS)   // Bố cục toàn khung (thuần): danh sách widget đã sắp theo zIndex kèm primitive của từng widget. Dùng để test tấ…
function renderFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number, renderers = WIDGET_RENDERERS): void   // Vẽ một khung hình. `scale` = điểm ảnh đích / pt (Preview: bề rộng canvas × DPR / designWidth; Export: W_expor…
function drawPrimitives(g: Ctx2D, prims: Primitive[]): void   // Chỉ vẽ, không tính nghiệp vụ. Mọi trạng thái ctx bị đổi (alpha, shadow) được trả về mặc định sau mỗi hình.
```

#### `packages/render-core/src/scene.ts`

T-05: SceneDocument (= Preset, SRS REQ-STORAGE-02) + kiểm/sửa lược đồ. Dữ liệu thuần, không DOM.

```text
const SCENE_SCHEMA_VERSION
const WIDGET_TYPES
type WidgetType
interface WidgetLayout
type TrackMappingMode
interface WidgetSpec
interface PianoRollProps
interface CanvasSpec
interface SceneDocument
const DEFAULT_PIANO_ROLL
const ASPECTS
function defaultScene(aspect: keyof typeof ASPECTS = '16:9'): SceneDocument   // Scene mặc định: một Piano Roll phủ kín khung. Bố cục mặc định theo nền tảng (9:16 cho người mới, KPI-04) chốt…
function pianoRollWidget(layout: WidgetLayout, props: Partial<PianoRollProps> = {}, id = 'piano-roll-main'): WidgetSpec<PianoRollProps>
interface SceneWarning
class SceneError extends Error
  constructor(message: string, path: string)
function sanitizeScene(raw: unknown):    // Đọc một preset/scene từ JSON thô. Trả scene hợp lệ + cảnh báo.
```

#### `packages/render-core/src/style.ts`

Kiểu dáng nốt và bàn phím (SRS REQ-GRAPHICS-07). Dữ liệu thuần, tuần tự hoá được (sau này lưu vào Preset/Pack).

```text
type ColorMode   // Kiểu dáng nốt và bàn phím (SRS REQ-GRAPHICS-07). Dữ liệu thuần, tuần tự hoá được (sau này lưu vào Preset/Pack…
type GlowMode
type GlowSource
type GlowPanMode   // Cách đọc pan: 'lr' = trái yếu → phải mạnh; 'spread' = càng lệch khỏi giữa càng mạnh (giữa = yếu nhất).
const GLOW_SOURCES
interface NoteStyle
interface StyleConfig
interface KeyboardStyle
const DEFAULT_NOTE_STYLE
const DEFAULT_KEYBOARD_STYLE
const defaultStyleConfig = () =>
const STYLE_PRESETS   // Bộ kiểu dựng sẵn (người dùng chọn rồi chỉnh tiếp).
function sanitizeStyle(s: NoteStyle): NoteStyle   // Chuẩn hoá về miền hợp lệ (giá trị lạ từ UI/preset không làm sập vẽ).
const resolveNoteStyle = (cfg: StyleConfig | undefined, trackId: string) =>
function parseHex(c: string): [number, number, number]   // ---- màu
const toHex = (r: number, g: number, b: number) =>
function shade(c: string, k: number): string   // Trộn `c` về phía trắng (k>0) hoặc đen (k<0), |k| ≤ 1.
function noteColor(style: NoteStyle, trackColor: string, pitch: number, velocity: number): string   // Màu nốt theo chế độ màu. 'pitch': mỗi lớp cao độ (C..B) một sắc; 'velocity': nốt mạnh sáng hơn.
```

#### `packages/render-core/src/types.ts`

Kiểu tối thiểu của UnifiedProjectAST mà Render Core cần (khớp docs/product/SRS.md, mục ProjectTrack/ASTNote).

```text
interface ASTNote   // Kiểu tối thiểu của UnifiedProjectAST mà Render Core cần (khớp docs/product/SRS.md, mục ProjectTrack/ASTNote).
interface LanePoint
interface AutomationLane   // REQ-AST-02: lane tuỳ ý (send, tham số plugin, MIDI CC…). Parser hiện chỉ sinh volume/pan/mute (T-66).
interface ProjectTrack
interface TempoPoint
interface UnifiedProjectAST
```

### packages/rpp — @dawviz/parser-rpp: Reaper .rpp

#### `packages/rpp/src/index.js`

Cổng vào của @dawviz/parser-rpp: parseRpp, inspectRpp, listExternalMidi, externalMidiKey.

```text
re-export { parseRpp, parseRppText, parseRppTree, inspectRpp, listExternalMidi, externalMidiKey, tokenize } from './rpp.js'
```

#### `packages/rpp/src/rpp.js`

Cockos Reaper (.rpp). REQ-PARSER-02. Đã kiểm bằng 3 dự án thật (MIDI nhúng, nhiều take/loop/pooled, và một dự án tham chiếu .mid ngoài) + 5 template.

```text
const tokenize = (line) =>
function parseRppTree(text, limits)   // Cây khối: { name, args, lines:[raw], kids:[{...,after}] } — `after` = số dòng thuộc tính đứng trước khối (giữ…
function externalMidiKey(n)   // Khoá so tên file .mid ngoài: bỏ thư mục, không phân biệt hoa/thường, khoảng trắng ≡ gạch dưới (tên hay bị đổi…
async function parseRpp(buffer, options = {})
async function parseRppText(text, options = {})
function listExternalMidi(input, options = {})   // Danh sách file .mid ngoài mà dự án tham chiếu (tên file, không trùng). Dùng để giao diện chỉ hiện ô nạp .mid …
function inspectRpp(input, options = {})   // Soi cấu trúc .rpp mà KHÔNG cần có nốt (khác parseRpp vốn ném ERR_NO_NOTES nếu dự án không có MIDI). Dùng để k…
```

### apps/web — ứng dụng React (Vite, Tailwind, Framer Motion)

#### `apps/web/src/App.tsx`

Thành phần gốc (T-70, UI-DIRECTION 5.3 cấu trúc D + A + E): thanh trên hai hàng, ba thẻ Preview / Editor / Settings.

```text
function App()
```

#### `apps/web/src/components/FileDrop.tsx`

Khung thả/chọn tệp dự án (kèm .mid ngoài); hiệu ứng Framer Motion.

```text
interface Picked
function FileDrop({ onPick, busy, compact = false, slim = false }: { onPick(p: Picked): void; busy: boolean; compact?: boolean; slim?: boolean })   // `compact`: nút nhỏ ở thanh trên. `slim`: ô thả thu gọn một dòng, dùng khi bảng thiếu .mid đang hiện (hành độn…
```

#### `apps/web/src/components/Icons.tsx`

Biểu tượng vẽ tay bằng SVG, một nét 1,5 trên lưới 16 (không dùng ký tự Unicode hay phông biểu tượng).

```text
const ChevronRight = (p: P) =>
const Info = (p: P) =>
const Eye = (p: P) =>
const EyeOff = (p: P) =>
const Grip = (p: P) =>
const ToStart = (p: P) =>
const Back = (p: P) =>
const Forward = (p: P) =>
const Play = ({ className = 'h-4 w-4' }: P) =>
const Pause = ({ className = 'h-4 w-4' }: P) =>
const Sun = (p: P) =>
const Moon = (p: P) =>
const Upload = (p: P) =>
const Mark = ({ className = 'h-4 w-4' }: P) =>
```

#### `apps/web/src/components/Inspector.tsx`

Inspector (UI-DIRECTION 5.3): mục đánh số 01, 02, 03…, phân cách bằng kẻ 1 px, không thẻ có bóng.

```text
function InspectorSection({ n, id, title, more, children }: { n: number; id: string; title: string; children: ReactNode; /** Có khi đang ở Cơ bản và mục có phần nâng cao. `edited`: phần nâng cao đang khác mặc định. */ more?: { open: boolean; edited: boolean; onToggle(): void }; })
function AdvTag()   // Nhãn nhỏ cho dòng chỉ có ở Nâng cao.
function Facts({ rows }: { rows: [string, ReactNode][] })   // Dòng nhãn – giá trị chỉ đọc (mục Bài).
```

#### `apps/web/src/components/LanguageSelect.tsx`

Ô chọn ngôn ngữ giao diện.

```text
function LanguageSelect()
```

#### `apps/web/src/components/MissingMidiPanel.tsx`

REQ-UI-08: dự án Reaper tham chiếu file .mid ngoài mà người dùng chưa nạp → nói rõ thiếu tệp nào, hậu quả, và cho nạp thêm

```text
function MissingMidiPanel({ info, level, busy, onAdd }: { info: ExternalMidiInfo; level: 'error' | 'warning'; busy: boolean; onAdd(files: File[]): void })
```

#### `apps/web/src/components/Notices.tsx`

Lỗi và cảnh báo khi đọc tệp, đã dịch. Lỗi (chặn việc dùng tệp) hiện đầy đủ từng cái.

```text
function Notices({ problems, basic = false }: { problems: Problem[]; basic?: boolean })   // `basic`: ở chế độ Cơ bản, cảnh báo không đổi hình gộp vào một dòng thu gọn KHÔNG màu vàng (xám trung tính); c…
```

#### `apps/web/src/components/NumberField.tsx`

Ô nhập số dùng chung (REQ-UI-15): gõ giá trị, phép tính, đơn vị, `+=`; ↑/↓ (Shift ×10, Alt ×0,1); Enter/rời ô để áp, Esc huỷ.

```text
function NumberField({ id, label, value, onChange, spec, className = '' }: { id?: string; label: string; value: number; onChange(v: number): void; spec: NumberSpec; className?: string })
```

#### `apps/web/src/components/SceneCanvas.tsx`

Canvas xem trước: chỉ lo kích thước điểm ảnh/DPR và gọi renderFrame (T-05). Mọi bố cục và vẽ nằm ở Render Core,

```text
function SceneCanvas({ scene, derived, ast, t }: { scene: SceneDocument; derived: Derived; ast: UnifiedProjectAST; t: number })
```

#### `apps/web/src/components/Select.tsx`

Ô chọn dùng chung: <select> gốc của trình duyệt (bàn phím, trình đọc màn hình giữ nguyên) bọc trong khung vẽ mũi tên

```text
function Select({ wrapClassName = '', className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { wrapClassName?: string })
```

#### `apps/web/src/components/SliderField.tsx`

Thanh trượt + ô nhập số (REQ-UI-15) dùng chung cho mọi bảng. Lưới dùng minmax(0,1fr) để không tràn khung hẹp (T-61).

```text
function SliderField({ id, label, value, min, max, step, hardMin, hardMax, adv, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; hardMin?: number; hardMax?: number; adv?: boolean; onChange(v: number): void })   // `min`/`max` là phạm vi thanh trượt (phạm vi mềm); `hardMin`/`hardMax` cho phép gõ vượt phạm vi đó (mặc định b…
```

#### `apps/web/src/components/Stage.tsx`

Sân khấu (UI-DIRECTION 5.3, hướng E): khung video do Render Core vẽ, đặt như một bản in thử. Dấu cắt ở bốn góc,

```text
const Crop = ({ className }: { className: string }) =>
function Stage({ scene, derived, ast, playback, styleName, proof, width, children }: Props)
```

#### `apps/web/src/components/StatusIcon.tsx`

Biểu tượng trạng thái cho lỗi và cảnh báo. Bắt buộc đi kèm màu danger/warning (DESIGN.md "Danger-Is-Not-Accent"):

```text
function StatusIcon({ kind, className = 'h-4 w-4' }: { kind: 'error' | 'warning'; className?: string })   // Biểu tượng trạng thái cho lỗi và cảnh báo. Bắt buộc đi kèm màu danger/warning (DESIGN.md "Danger-Is-Not-Accen…
```

#### `apps/web/src/components/StylePanel.tsx`

Mục "Hình thức" của inspector: kiểu dáng nốt (toàn cục) và bàn phím. Chỉ sửa dữ liệu StyleConfig; việc vẽ nằm ở Render Core.

```text
const ADVANCED_STYLE_KEYS   // Trường chỉ có ở Nâng cao (REQ-UI-13). Dùng để biết phần nâng cao đang khác mặc định hay không.
function StylePanel({ style, keyboard, onStyle, onKeyboard, lanes = [], advanced = true }: { style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void; lanes?: string[]; advanced?: boolean })   // `lanes`: tên lane automation có trong dự án đang mở (cho nguồn phát sáng "automation"). `advanced`: hiện cả d…
```

#### `apps/web/src/components/ThemeSelect.tsx`

"Giao diện ứng dụng" (REQ-UI-10, D-52): Sáng / Tối / Theo hệ thống và bảng màu nhấn. Chỉ đổi màu giao diện app,

```text
function useTheme(): [ThemePref, (p: ThemePref) => void]
function ThemeToggle({ pref, onChange }: { pref: ThemePref; onChange(p: ThemePref): void })   // Nút sáng/tối ở thanh trên: đổi sang chế độ ngược với chế độ đang thấy (kể cả khi đang "Theo hệ thống").
function AppearanceSettings({ pref, onChange }: { pref: ThemePref; onChange(p: ThemePref): void })   // Thẻ Settings: sáng/tối/theo hệ thống và bảng màu nhấn.
```

#### `apps/web/src/components/TrackPanel.tsx`

Danh sách track (REQ-UI-12, REQ-UI-14, UI-DIRECTION 5.3): hai cách trình bày.

```text
const MIN_CARD_PX   // Bề rộng tối thiểu của một thẻ (px) để nội dung không tràn. Không phải giới hạn số cột: số cột do người dùng c…
interface TrackLayout
const DEFAULT_TRACK_LAYOUT
function effectiveColumns(chosen: number | 'auto', widthPx: number, count: number, minCard = MIN_CARD_PX, gap = 8):    // Số cột thực vẽ: số người dùng chọn, nhưng không vượt số thẻ vừa bề rộng (hàm thuần, test được).
interface TrackView   // Ẩn/hiện và solo (REQ-UI-12). Có track solo thì chỉ các track solo được vẽ.
const EMPTY_VIEW
function isShown(id: string, v: TrackView): boolean
function TrackPanel(props: Props)
function TrackLayoutBar({ value, onChange, count }: { value: TrackLayout; onChange(v: TrackLayout): void; count: number })   // Thanh chọn kiểu trình bày: Lưới/Danh sách + số cột (ô nhập số, không giới hạn cứng ngoài số track).
```

#### `apps/web/src/components/Transport.tsx`

Thanh phát (UI-DIRECTION 5.3): lùi / phát / tới bằng biểu tượng, thanh tua, thời gian m:ss.mmm tô màu nhấn khi đang phát.

```text
function Transport({ playback, duration }: { playback: Playback; duration: number })
```

#### `apps/web/src/components/VideoStyles.tsx`

Cột "Video styles" / "Phong cách video" (UI-DIRECTION 5.3): chọn phong cách của KHUNG VIDEO, không phải theme app (D-52).

```text
const VIDEO_STYLES
function videoStyleBase(id: string): NoteStyle
function isEdited(id: string, base: NoteStyle): boolean   // Kiểu nốt hiện tại còn đúng như phong cách đã chọn không (để hiện "đã chỉnh").
function VideoStyles({ value, edited, onPick, onUndo }: { value: string; edited: boolean; onPick(id: string): void; onUndo?(): void })
```

#### `apps/web/src/i18n/I18nProvider.tsx`

Context đa ngôn ngữ: nạp locales/*.json, chọn và lưu ngôn ngữ, đặt lang/dir cho <html>.

```text
function I18nProvider({ children }: { children: ReactNode })
function useI18n()
```

#### `apps/web/src/lib/a11y.ts`

Mẫu radiogroup của WAI-ARIA: cả nhóm là một điểm Tab (chỉ ô đang chọn có tabIndex 0), phím mũi tên / Home / End

```text
function radioKeys(e: KeyboardEvent<HTMLElement>): void
const radioTab = (checked: boolean, first = false, anyChecked = true) =>   // tabIndex cho một ô radio: ô đang chọn nhận Tab; nếu chưa ô nào chọn thì ô đầu tiên nhận.
function isKeyboardFocused(el: Element): boolean   // Phần tử đang focus theo kiểu bàn phím? Dùng đúng bộ chọn `:focus-visible` của trình duyệt (chuột → không khớp…
function spaceBelongsToTransport(t: EventTarget | null, focusedByKeyboard: (el: Element) => boolean = isKeyboardFocused): boolean   // Space có thuộc về thanh phát không (phím tắt kiểu DAW)? • Ô gõ chữ/số, select, contentEditable: không, giữ ng…
function isTypingTarget(t: EventTarget | null): boolean   // Phím tắt khác (Home…): không nuốt khi đang gõ hoặc ở một điều khiển tự xử lý phím đó.
```

#### `apps/web/src/lib/clock.ts`

Đồng hồ phát: hàm thuần, kiểm thử được không cần DOM. Thời gian chỉ là số `t` (giây); khung hình là hàm của t (ARC-01).

```text
interface ClockState   // Đồng hồ phát: hàm thuần, kiểm thử được không cần DOM. Thời gian chỉ là số `t` (giây); khung hình là hàm của t…
const initialClock
function advance(s: ClockState, dtSeconds: number, duration: number, loop = false): ClockState
const seek = (s: ClockState, t: number, duration: number) =>
const togglePlay = (s: ClockState, duration: number) =>
```

#### `apps/web/src/lib/csp.ts`

Chính sách CSP của ứng dụng (NFR-SEC-03 + NFR-SEC-06). Chèn vào index.html lúc build bằng plugin trong vite.config.ts.

```text
const CSP_DIRECTIVES
const CSP
```

#### `apps/web/src/lib/externalMidi.ts`

REQ-UI-08: tóm tắt tình trạng file .mid ngoài mà dự án Reaper tham chiếu. Hàm thuần; cách so tên lấy từ parser

```text
interface ExternalMidiInfo
function summarizeExternalMidi(referenced: string[], provided: string[], missing: string[], key: (n: string) => string): ExternalMidiInfo
function mergeExtras<T extends { name: string }>(old: T[], added: T[]): T[]   // Gộp tệp phụ mới vào tệp phụ cũ; trùng tên thì tệp mới thay tệp cũ.
function missingMidiLevel(info: ExternalMidiInfo | undefined, failed: boolean): 'error' | 'warning' | null   // Có cần hiện bảng "thiếu file .mid" không, và mức độ (lỗi: không có nốt nào; cảnh báo: chỉ vài track trống).
```

#### `apps/web/src/lib/numberInput.ts`

Đọc và bước giá trị cho ô nhập số dùng chung (REQ-UI-15). Hàm thuần, không phụ thuộc DOM; không dùng eval/Function.

```text
interface NumberSpec
type ParseResult
function parseNumberInput(text: string, current: number, spec: NumberSpec = {}): ParseResult   // Đọc chuỗi người dùng nhập; `current` dùng cho dạng tương đối `+=`/`-=`/`*=`/`/=`.
function nudge(value: number, dir: 1 | -1, spec: NumberSpec = {}, mods: { shift?: boolean; alt?: boolean } = {}): number   // Bước bằng phím: dir = +1/-1; Shift ×10, Alt ×0,1. Kết quả làm tròn theo bước để tránh 0.30000000000000004.
function formatNumber(value: number, step = 1): string   // Hiển thị giá trị trong ô: số chữ số thập phân theo bước.
```

#### `apps/web/src/lib/parseInWorker.ts`

Client parse thật: tạo Worker từ URL do Vite sinh, qua chính sách Trusted Types (NFR-SEC-06).

```text
const parseInWorker
```

#### `apps/web/src/lib/parserClient.ts`

Khách của Worker parse: parseInWorker() ghép id thông điệp với Promise; ParseFailure.

```text
class ParseFailure extends Error
  constructor(code: string, message: string, details?: Record<string, unknown>)
interface WorkerLike   // Tối thiểu của Worker mà client cần (để test thay bằng Worker giả).
function createParserClient(spawn: () => WorkerLike)
function createLatestGate()   // Chỉ nhận kết quả của yêu cầu mới nhất (T-02): mỗi lần bắt đầu lấy một vé; kết quả về muộn của vé cũ bị bỏ qua…
```

#### `apps/web/src/lib/playback.ts`

Kho đồng hồ phát nằm ngoài state của React (T-70): vòng requestAnimationFrame chỉ cập nhật kho này, và chỉ các phần

```text
interface Playback
function createPlayback(frame: Frame = browserFrame): Playback
function usePlayback<T>(p: Playback, select: (s: ClockState) => T): T   // Theo dõi một phần của đồng hồ; chọn giá trị nguyên thuỷ (số, boolean) để chỉ vẽ lại khi nó đổi.
```

#### `apps/web/src/lib/prefs.ts`

Lưu tuỳ chọn người dùng vào localStorage (tiện lợi cho từng trình duyệt; mọi truy cập đều có try/catch, thiếu thì dùng mặc định).

```text
function loadPref<T extends object>(name: string, fallback: T): T
function savePref(name: string, value: unknown): void
```

#### `apps/web/src/lib/problems.ts`

Lỗi/cảnh báo của thư viện → chuỗi đã dịch theo mã (REQ-I18N-04). Thông điệp gốc của thư viện chỉ là "chi tiết kỹ thuật".

```text
interface Problem
const COSMETIC_WARNINGS   // Cảnh báo KHÔNG làm đổi hình người dùng thấy: chỉ là xấp xỉ đường cong automation, automation chưa đọc (độ sán…
function describeProblem(i18n: Pick<I18n, 'has' | 't'>, kind: 'error' | 'warning', code: string, message?: string, details?: Record<string, unknown>): Problem
```

#### `apps/web/src/lib/theme.ts`

Theme giao diện ứng dụng (REQ-UI-10, D-52): chỉ đổi màu qua bộ token cố định (UI-DIRECTION mục 5.2, 5.4).

```text
const THEME_TOKENS   // Bộ token màu của một theme (UI-DIRECTION 5.2). Không có token nào khác được nhận.
type ThemeToken
type ThemeColors
type ThemeMode
const THEME_MODES
const PALETTES
type Palette
interface ThemePref
const DEFAULT_THEME   // Tối là mặc định hiện nay (REQ-UI-10); Studio cam là bảng màu mặc định (D-53).
const THEME_STORAGE_KEY   // Khoá localStorage; public/theme-boot.js đọc đúng khoá này để áp theme trước lần vẽ đầu.
function sanitizeThemePref(v: unknown): ThemePref
function resolveMode(mode: ThemeMode, systemDark: boolean): 'light' | 'dark'
function applyTheme(root: HTMLElement, pref: ThemePref, systemDark: boolean): void   // Áp lên phần tử gốc bằng thuộc tính (không chèn style nội tuyến, hợp CSP `style-src 'self'`).
function contrast(a: string, b: string): number
interface ContrastFailure
const VIDEO_GROUNDS   // Nền khung video mà đường gióng phải nổi lên: preset "Bản in" (D-51) và nền khung mặc định của Render Core.
interface StateRule   // Trạng thái tô nhạt dùng trong giao diện (`bg-<tint>/<alpha>` của Tailwind, phủ lên một nền). Mỗi luật kiểm `f…
const STATE_RULES
function mix(tint: string, ground: string, alpha: number): string
function checkTheme(colors: Record<string, string>): ContrastFailure[]   // Trả về mọi cặp trượt; mảng rỗng là theme đạt. Theme thiếu token hoặc có token lạ thì ném lỗi (không áp một ph…
```

#### `apps/web/src/lib/timeFormat.ts`

Định dạng thời gian kiểu đồng hồ DAW cho thanh phát và sân khấu (hàm thuần).

```text
function formatClock(sec: number): string   // `m:ss.mmm`, ví dụ 95.0834 → "1:35.083". Số âm hoặc không hữu hạn → "0:00.000".
function bpmAt(tempoMap: readonly TempoPoint[], t: number): number | null   // BPM đang có hiệu lực tại thời điểm t (mốc tempo cuối cùng có timeSeconds ≤ t); không có mốc → null.
```

#### `apps/web/src/lib/transportKeys.ts`

Phím tắt thanh phát kiểu DAW cho thẻ Preview: Space phát/dừng, Home về đầu.

```text
function bindTransportKeys(win: Pick<Window, 'addEventListener' | 'removeEventListener'>, playback: Playback, focusedByKeyboard?: (el: Element) => boolean): () => void
```

#### `apps/web/src/lib/trustedTypes.ts`

Trusted Types (NFR-SEC-06): trang chạy với `require-trusted-types-for 'script'`, nên mọi URL script (Worker) phải đi qua

```text
const WORKER_POLICY   // Trusted Types (NFR-SEC-06): trang chạy với `require-trusted-types-for 'script'`, nên mọi URL script (Worker) …
function isSameOriginScript(u: string, base: string): boolean   // Hàm thuần: URL `u` (tương đối hoặc tuyệt đối) có cùng origin với `base` và dùng http(s)/blob không.
function trustedWorkerURL(u: string): unknown   // Trả TrustedScriptURL khi trình duyệt có Trusted Types, nếu không trả chuỗi đã kiểm. Ném lỗi nếu URL khác orig…
```

#### `apps/web/src/lib/usePref.ts`

Tuỳ chọn giao diện lưu theo trình duyệt (không vào preset video). Đọc một lần, ghi lại mỗi khi đổi.

```text
function usePref<T extends object>(name: string, fallback: T, sanitize: (raw: Partial<T>) => T = (r) => ({ ...fallback, ...r })): [T, (v: T | ((p: T) => T)) => void]
type UiMode
interface UiPrefs   // Tuỳ chọn bố cục T-70: chế độ (REQ-UI-13, mặc định Cơ bản cho người dùng chính), mục đang mở "Thêm tuỳ chọn", …
const DEFAULT_UI
function sanitizeUi(r: Partial<UiPrefs>): UiPrefs
```

#### `apps/web/src/lib/useStageWidth.ts`

Chiều rộng khung xem trước (px), tính theo chỗ còn lại thực sự trong vùng cuộn giữa: khung + dòng thông số + thanh phát

```text
const STAGE_CHROME   // Chiều cao cố định (px) của phần quanh canvas trong khối sân khấu: dòng thông số, dòng thời gian, khoảng cách,…
const STAGE_WEDGE   // Bề rộng thêm bên phải khi có dải xám: khe 16 px + dải 10 px.
function fitStageWidth(o: { availW: number; availH: number; aspect: number; chrome: number; extra: number }): number   // Hàm thuần: rộng nhất sao cho khối sân khấu vừa cả chiều ngang lẫn chiều dọc.
function useStageWidth(scroller: RefObject<HTMLElement>, stage: RefObject<HTMLElement>, o: { aspect: number; chrome: number; extra: number; active: boolean; fallback?: number }): number   // `stage` là phần tử bọc khối sân khấu; chỗ còn lại theo chiều dọc = phần vùng cuộn dưới mép trên của nó (tự tí…
```

#### `apps/web/src/main.tsx`

Điểm vào của ứng dụng web: dựng React root với I18nProvider.

#### `apps/web/src/workers/parser.worker.ts`

Worker: toàn bộ việc parse chạy ở đây để không chặn giao diện (NFR-PERF). Không có logic parser trong app.

```text
interface ParseRequest
type ParseResponse
```

## 3. Công cụ dòng lệnh và script

- `bin/dawparse.mjs` — CLI kiểm chứng: node bin/dawparse.mjs <file> [--json] [--inventory] [--tempo 128] [--show-muted] [--schema s.json]... [--files dir] [--ref ref.mid]
- `scripts/bundle.mjs` — Bundler ESM tối giản, không phụ thuộc: gộp @dawviz/parser và mọi package con thành MỘT file ES module
- `scripts/check-i18n.mjs` — Kiểm tra danh mục ngôn ngữ trong locales/ (dùng cho cộng tác viên và CI). Xem docs/I18N.md.
- `scripts/docs-site/assets/app.js` — Giao diện trang tài liệu: đổi sáng/tối, mở menu trên di động, tìm kiếm phía máy khách (chỉ mục nằm trong search-index.js).
- `scripts/docs-site/build.mjs` — Dựng trang web tài liệu tĩnh từ các tệp .md của repo (không phụ thuộc thư viện; chạy offline).
- `scripts/docs-site/markdown.mjs` — Bộ chuyển Markdown → HTML tối giản, không phụ thuộc thư viện. Hỗ trợ đúng phần tài liệu của dự án dùng:
- `scripts/docs-site/markdown.test.mjs` — Test của bộ chuyển Markdown → HTML (tiêu đề/id, inline, bảng, danh sách lồng nhau, khối code, trích dẫn, văn bản tìm kiếm).
- `scripts/docs-site/slug.mjs` — Quy tắc tạo anchor (id) cho heading, giống GitHub: chữ thường, bỏ ký tự đặc biệt/emoji, khoảng trắng → '-'. Dùng chung cho sync-docs và docs site.
- `scripts/rewrite-imports.mjs` — Công cụ một lần: viết lại import tương đối giữa các package khi tách monorepo.
- `scripts/split_doc.py` — Tách tài liệu Markdown (SRS/SDD/TDD...) thành các mảnh nhỏ để đưa cho AI tham chiếu.
- `scripts/sync-docs.mjs` — Đồng bộ "hệ thống ngữ cảnh AI" của repo và kiểm tra liên kết. Không phụ thuộc thư viện ngoài (Node >= 18; split dùng python3).

## 4. Tệp test

- `apps/web/src/lib/clock.test.ts`
- `apps/web/src/lib/csp.test.ts`
- `apps/web/src/lib/externalMidi.test.ts`
- `apps/web/src/lib/numberInput.test.ts`
- `apps/web/src/lib/parserClient.test.ts`
- `apps/web/src/lib/playback.test.ts`
- `apps/web/src/lib/prefs.test.ts`
- `apps/web/src/lib/problems.test.ts`
- `apps/web/src/lib/theme.test.ts`
- `apps/web/test/components.test.tsx`
- `packages/render-core/test/glow.test.ts`
- `packages/render-core/test/presets.test.ts`
- `packages/render-core/test/render-core.test.ts`
- `packages/render-core/test/scene.test.ts`
- `test/als.test.js`
- `test/binary.test.js`
- `test/dawproject.test.js`
- `test/detect-bundle.test.js`
- `test/i18n.test.js`
- `test/midi-alp.test.js`
- `test/rpp.test.js`

<!-- 10 thư mục src, 313 ký hiệu công khai -->
