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
│     ├─ src/
│     │  ├─ components/
│     │  │  ├─ FileDrop.tsx
│     │  │  ├─ LanguageSelect.tsx
│     │  │  ├─ Notices.tsx
│     │  │  ├─ PianoRollCanvas.tsx
│     │  │  ├─ StylePanel.tsx
│     │  │  ├─ TrackPanel.tsx
│     │  │  └─ Transport.tsx
│     │  ├─ i18n/
│     │  │  └─ I18nProvider.tsx
│     │  ├─ lib/
│     │  │  ├─ clock.test.ts
│     │  │  ├─ clock.ts
│     │  │  ├─ parserClient.test.ts
│     │  │  ├─ parserClient.ts
│     │  │  ├─ prefs.test.ts
│     │  │  ├─ prefs.ts
│     │  │  ├─ problems.test.ts
│     │  │  └─ problems.ts
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
│  │  │  ├─ index.ts
│  │  │  ├─ notes.ts
│  │  │  ├─ parser-core.d.ts
│  │  │  ├─ pianoroll.ts
│  │  │  ├─ style.ts
│  │  │  └─ types.ts
│  │  ├─ test/
│  │  │  ├─ presets.test.ts
│  │  │  └─ render-core.test.ts
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

#### `packages/render-core/src/index.ts`

Cổng vào của @dawviz/render-core: kiểu AST, độ sáng, chỉ mục nốt, bố cục và vẽ Piano Roll.

```text
re-export * from './types.ts'
re-export * from './brightness.ts'
re-export * from './notes.ts'
re-export * from './pianoroll.ts'
re-export * from './draw.ts'
re-export * from './style.ts'
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

#### `packages/render-core/src/style.ts`

Kiểu dáng nốt và bàn phím (SRS REQ-GRAPHICS-07). Dữ liệu thuần, tuần tự hoá được (sau này lưu vào Preset/Pack).

```text
type ColorMode   // Kiểu dáng nốt và bàn phím (SRS REQ-GRAPHICS-07). Dữ liệu thuần, tuần tự hoá được (sau này lưu vào Preset/Pack…
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
interface AutomationLane
interface ProjectTrack
interface TempoPoint
interface UnifiedProjectAST
```

### packages/rpp — @dawviz/parser-rpp: Reaper .rpp

#### `packages/rpp/src/index.js`

Cổng vào của @dawviz/parser-rpp: parseRpp, inspectRpp, listExternalMidi.

```text
re-export { parseRpp, parseRppText, parseRppTree, inspectRpp, listExternalMidi, tokenize } from './rpp.js'
```

#### `packages/rpp/src/rpp.js`

Cockos Reaper (.rpp). REQ-PARSER-02. Đã kiểm bằng 3 dự án thật (MIDI nhúng, nhiều take/loop/pooled, và một dự án tham chiếu .mid ngoài) + 5 template.

```text
const tokenize = (line) =>
function parseRppTree(text, limits)   // Cây khối: { name, args, lines:[raw], kids:[{...,after}] } — `after` = số dòng thuộc tính đứng trước khối (giữ…
async function parseRpp(buffer, options = {})
async function parseRppText(text, options = {})
function listExternalMidi(input, options = {})   // Danh sách file .mid ngoài mà dự án tham chiếu (tên file, không trùng). Dùng để giao diện chỉ hiện ô nạp .mid …
function inspectRpp(input, options = {})   // Soi cấu trúc .rpp mà KHÔNG cần có nốt (khác parseRpp vốn ném ERR_NO_NOTES nếu dự án không có MIDI). Dùng để k…
```

### apps/web — ứng dụng React (Vite, Tailwind, Framer Motion)

#### `apps/web/src/App.tsx`

Thành phần gốc: giữ trạng thái tệp đã nạp, đồng hồ phát, cấu hình độ sáng; nối Worker parse với giao diện.

```text
function App()
```

#### `apps/web/src/components/FileDrop.tsx`

Khung thả/chọn tệp dự án (kèm .mid ngoài); hiệu ứng Framer Motion.

```text
interface Picked
function FileDrop({ onPick, busy }: { onPick(p: Picked): void; busy: boolean })
```

#### `apps/web/src/components/LanguageSelect.tsx`

Ô chọn ngôn ngữ giao diện.

```text
function LanguageSelect()
```

#### `apps/web/src/components/Notices.tsx`

Danh sách lỗi/cảnh báo đã dịch, kèm chi tiết kỹ thuật gập lại.

```text
function Notices({ problems }: { problems: Problem[] })
```

#### `apps/web/src/components/PianoRollCanvas.tsx`

Canvas Piano Roll: chỉ lo kích thước/DPR, gọi Render Core theo thời điểm t.

```text
function PianoRollCanvas({ ast, t, brightness, style, keyboard, height = 360 }: { ast: UnifiedProjectAST; t: number; brightness: Record<string, BrightnessConfig>; style: StyleConfig; keyboard: KeyboardStyle; height?: number })   // Vẽ khung hình tại thời điểm `t`. Toàn bộ bố cục/vẽ nằm ở Render Core; component chỉ lo canvas và DPR.
```

#### `apps/web/src/components/StylePanel.tsx`

Bảng tuỳ chỉnh kiểu dáng nốt (toàn cục) và bàn phím. Chỉ sửa dữ liệu StyleConfig; việc vẽ nằm ở Render Core.

```text
function StylePanel({ style, keyboard, onStyle, onKeyboard }: { style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void })
```

#### `apps/web/src/components/TrackPanel.tsx`

Danh sách track và cấu hình nguồn độ sáng theo track.

```text
function TrackPanel({ tracks, config, overrides, onChange, onStyle }: { tracks: ProjectTrack[]; config: Record<string, BrightnessConfig>; overrides: Record<string, Partial<NoteStyle>>; onChange(id: string, patch: Partial<BrightnessConfig>): void; onStyle(id: string, patch: Partial<NoteStyle> | null): void })
```

#### `apps/web/src/components/Transport.tsx`

Thanh phát/tạm dừng/tua và đồng hồ thời gian.

```text
function Transport({ t, duration, playing, onToggle, onSeek }: { t: number; duration: number; playing: boolean; onToggle(): void; onSeek(t: number): void })
```

#### `apps/web/src/i18n/I18nProvider.tsx`

Context đa ngôn ngữ: nạp locales/*.json, chọn và lưu ngôn ngữ, đặt lang/dir cho <html>.

```text
function I18nProvider({ children }: { children: ReactNode })
function useI18n()
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

#### `apps/web/src/lib/parserClient.ts`

Khách của Worker parse: parseInWorker() ghép id thông điệp với Promise; ParseFailure.

```text
class ParseFailure extends Error
  constructor(code: string, message: string, details?: Record<string, unknown>)
interface WorkerLike   // Tối thiểu của Worker mà client cần (để test thay bằng Worker giả).
function createParserClient(spawn: () => WorkerLike)
const parseInWorker
function createLatestGate()   // Chỉ nhận kết quả của yêu cầu mới nhất (T-02): mỗi lần bắt đầu lấy một vé; kết quả về muộn của vé cũ bị bỏ qua…
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
function describeProblem(i18n: Pick<I18n, 'has' | 't'>, kind: 'error' | 'warning', code: string, message?: string, details?: Record<string, unknown>): Problem
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
- `apps/web/src/lib/parserClient.test.ts`
- `apps/web/src/lib/prefs.test.ts`
- `apps/web/src/lib/problems.test.ts`
- `apps/web/test/components.test.tsx`
- `packages/render-core/test/presets.test.ts`
- `packages/render-core/test/render-core.test.ts`
- `test/als.test.js`
- `test/binary.test.js`
- `test/dawproject.test.js`
- `test/detect-bundle.test.js`
- `test/i18n.test.js`
- `test/midi-alp.test.js`
- `test/rpp.test.js`

<!-- 10 thư mục src, 169 ký hiệu công khai -->
