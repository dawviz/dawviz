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
│     │  ├─ fonts/
│     │  │  ├─ OFL-Inter.txt
│     │  │  ├─ OFL-SpaceGrotesk.txt
│     │  │  ├─ space-grotesk-latin-400-normal.woff2
│     │  │  ├─ space-grotesk-latin-700-normal.woff2
│     │  │  ├─ space-grotesk-latin-ext-400-normal.woff2
│     │  │  ├─ space-grotesk-latin-ext-700-normal.woff2
│     │  │  ├─ space-grotesk-vietnamese-400-normal.woff2
│     │  │  └─ space-grotesk-vietnamese-700-normal.woff2
│     │  └─ theme-boot.js
│     ├─ src/
│     │  ├─ components/
│     │  │  ├─ AudioPanel.tsx
│     │  │  ├─ Editor.tsx
│     │  │  ├─ EditorOverlay.tsx
│     │  │  ├─ FileDrop.tsx
│     │  │  ├─ HistoryMenu.tsx
│     │  │  ├─ Icons.tsx
│     │  │  ├─ Inspector.tsx
│     │  │  ├─ LanguageSelect.tsx
│     │  │  ├─ MissingMidiPanel.tsx
│     │  │  ├─ Notices.tsx
│     │  │  ├─ NumberField.tsx
│     │  │  ├─ PresetSettings.tsx
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
│     │  │  ├─ audioAsset.test.ts
│     │  │  ├─ audioAsset.ts
│     │  │  ├─ audioEngine.test.ts
│     │  │  ├─ audioEngine.ts
│     │  │  ├─ audioLength.test.ts
│     │  │  ├─ audioLength.ts
│     │  │  ├─ audioLimits.ts
│     │  │  ├─ audioMap.test.ts
│     │  │  ├─ audioMap.ts
│     │  │  ├─ audioPeaks.test.ts
│     │  │  ├─ audioPeaks.ts
│     │  │  ├─ audioWorkers.ts
│     │  │  ├─ clock.test.ts
│     │  │  ├─ clock.ts
│     │  │  ├─ commands.ts
│     │  │  ├─ csp.test.ts
│     │  │  ├─ csp.ts
│     │  │  ├─ editorGeometry.test.ts
│     │  │  ├─ editorGeometry.ts
│     │  │  ├─ externalMidi.test.ts
│     │  │  ├─ externalMidi.ts
│     │  │  ├─ fonts.ts
│     │  │  ├─ historyLabels.test.ts
│     │  │  ├─ historyLabels.ts
│     │  │  ├─ masterClock.test.ts
│     │  │  ├─ masterClock.ts
│     │  │  ├─ numberInput.test.ts
│     │  │  ├─ numberInput.ts
│     │  │  ├─ parseInWorker.ts
│     │  │  ├─ parserClient.test.ts
│     │  │  ├─ parserClient.ts
│     │  │  ├─ peaksClient.ts
│     │  │  ├─ playback.test.ts
│     │  │  ├─ playback.ts
│     │  │  ├─ prefs.test.ts
│     │  │  ├─ prefs.ts
│     │  │  ├─ presetFile.test.ts
│     │  │  ├─ presetFile.ts
│     │  │  ├─ problems.test.ts
│     │  │  ├─ problems.ts
│     │  │  ├─ store.test.ts
│     │  │  ├─ store.ts
│     │  │  ├─ storeReact.ts
│     │  │  ├─ theme.test.ts
│     │  │  ├─ theme.ts
│     │  │  ├─ thumbnails.ts
│     │  │  ├─ timeFormat.ts
│     │  │  ├─ transportKeys.ts
│     │  │  ├─ trustedTypes.ts
│     │  │  ├─ undoKeys.test.ts
│     │  │  ├─ undoKeys.ts
│     │  │  ├─ usePref.ts
│     │  │  ├─ useStageWidth.ts
│     │  │  └─ videoScenes.ts
│     │  ├─ types/
│     │  │  └─ dawviz.d.ts
│     │  ├─ workers/
│     │  │  ├─ audioPeaks.worker.ts
│     │  │  └─ parser.worker.ts
│     │  ├─ App.tsx
│     │  ├─ index.css
│     │  └─ main.tsx
│     ├─ test/
│     │  ├─ app.test.tsx
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
│  │  │  ├─ fontMetrics.generated.ts
│  │  │  ├─ fonts.ts
│  │  │  ├─ glow.ts
│  │  │  ├─ hud.ts
│  │  │  ├─ index.ts
│  │  │  ├─ music.ts
│  │  │  ├─ notes.ts
│  │  │  ├─ parser-core.d.ts
│  │  │  ├─ pianoroll.ts
│  │  │  ├─ prims.ts
│  │  │  ├─ render.ts
│  │  │  ├─ scene.ts
│  │  │  ├─ snap.ts
│  │  │  ├─ style.ts
│  │  │  ├─ text.ts
│  │  │  ├─ thumbnail.ts
│  │  │  └─ types.ts
│  │  ├─ test/
│  │  │  ├─ fixtures/   # tệp mẫu
│  │  │  ├─ golden/
│  │  │  │  └─ paper-1x1.json
│  │  │  ├─ fonts.test.ts
│  │  │  ├─ glow.test.ts
│  │  │  ├─ helpers.ts
│  │  │  ├─ hud.test.ts
│  │  │  ├─ legacy.test.ts
│  │  │  ├─ paper.test.ts
│  │  │  ├─ preset.test.ts
│  │  │  ├─ presets.test.ts
│  │  │  ├─ render-core.test.ts
│  │  │  ├─ rotate.test.ts
│  │  │  ├─ scene.test.ts
│  │  │  └─ snap.test.ts
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
│  ├─ scene/
│  │  ├─ paper-16x9.json
│  │  └─ paper-1x1.json
│  ├─ schema/
│  │  ├─ note-style.schema.json
│  │  └─ scene.schema.json
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
│  ├─ gen-font-metrics.mjs
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

#### `packages/render-core/src/fontMetrics.generated.ts`

TỆP SINH TỰ ĐỘNG bởi scripts/gen-font-metrics.mjs — không sửa tay. Sinh lại khi đổi tệp phông (test so mã băm).

```text
const FONT_METRICS_DATA   // TỆP SINH TỰ ĐỘNG bởi scripts/gen-font-metrics.mjs — không sửa tay. Sinh lại khi đổi tệp phông (test so mã băm…
```

#### `packages/render-core/src/fonts.ts`

Danh sách phông Render Core cần và cách nạp trước khung đầu (TECHNICAL-DESIGN 5.7). Render Core không tự tải:

```text
interface FontFaceSpec
const DEFAULT_FONT
const BUNDLED_FONTS   // Phông đóng gói cùng ứng dụng (OFL, tự host; CSP font-src 'self'). `file` tính từ thư mục phông của ứng dụng.
function fontFamiliesOf(scene: SceneDocument): string[]   // Họ phông mà scene dùng (widget chữ ẩn cũng tính để không giật khi bật). Thứ tự ổn định.
function requiredFonts(scene: SceneDocument): FontFaceSpec[]   // Mặt phông cần nạp cho scene (chỉ họ đóng gói; họ khác là phông hệ thống/người dùng nạp riêng).
const needsFonts = (scene: SceneDocument) =>   // Scene có vẽ chữ không (để biết có cần chờ phông).
class FontLoadError extends Error
type FontLoader   // Nạp một mặt phông; ném khi thất bại. Preview/Worker tự cài (FontFace + fonts.add).
async function ensureFonts(specs: readonly FontFaceSpec[], loader: FontLoader): Promise<void>   // Nạp tất cả; xong mới trả về. Một mặt lỗi thì ném FontLoadError (Export không bắt đầu, không xuất bằng phông d…
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

#### `packages/render-core/src/hud.ts`

Sáu widget chữ của T-69 (SRS REQ-WIDGET-02…06, 08): Track Info, Event Counter, Live Note Trigger, Time & Bar Counter,

```text
type Align   // ───────────────────────────── thuộc tính ─────────────────────────────
interface TextStyle
interface LineCfg
interface TrackInfoProps
interface EventCounterProps
interface LiveTriggerProps
interface ClockCfg
interface TimeBarProps
type ChordMode
interface ChordProps
interface ProgressBarProps
const DEFAULT_TRACK_INFO
const DEFAULT_EVENT_COUNTER
const DEFAULT_LIVE_TRIGGER
const DEFAULT_TIME_BAR
const DEFAULT_CHORD
const DEFAULT_PROGRESS_BAR
const TEMPLATE_KEYS   // Chỗ giữ được phép dùng trong mẫu chữ theo widget (preset dùng chỗ giữ lạ → cảnh báo, chữ giữ nguyên).
interface BarGrid
interface HudData
interface ChordSeg
interface BarPos
function buildBarGrid(tempoMap: TempoPoint[], ppq = 960): BarGrid
function barPosAt(g: BarGrid, t: number): BarPos   // Vị trí nhạc tại t (giây). Bar, Beat đếm từ 1; Sub là tick lẻ trong beat. Một beat dài ppq×4/den tick.
interface ChordGroup   // Nhóm track + chế độ của một widget Chord Detection.
function buildHud(ast: UnifiedProjectAST, index: TimelineIndex, chordGroups: ChordGroup[] = []): HudData   // `chordGroups`: các nhóm track mà widget Chord Detection sẽ đọc; dò hợp âm (
function hudOf(derived: Derived, ast: UnifiedProjectAST): HudData   // HudData của derived. `layoutFrame` bảo đảm `derived.hud` có sẵn (dựng ở bước derived); thiếu thì chỉ còn số đ…
const isDrumTrack = (name: string) =>
const STRIKE_WINDOW_SEC   // Khung gom nốt của chế độ Strike: các nốt bắt đầu cách nốt đầu nhóm ≤ 30 ms là một lần dập (SRS REQ-WIDGET-06).
function chordTimeline(hud: HudData, tracks: TrackIndex[], mode: ChordMode = 'sustained'): ChordSeg[]   // Danh sách đoạn hợp âm (SRS REQ-WIDGET-06) của một nhóm track theo chế độ; đệm theo (derived, chế độ, nhóm tra…
const trackInfoRenderer   // ───────────────────────────── widget ─────────────────────────────
const eventCounterRenderer
const liveTriggerRenderer
const timeBarRenderer
const chordRenderer
const progressBarRenderer
const HUD_RENDERERS
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
re-export * from './snap.ts'
re-export * from './render.ts'
re-export * from './prims.ts'
re-export * from './text.ts'
re-export * from './fonts.ts'
re-export * from './hud.ts'
re-export * from './thumbnail.ts'
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

#### `packages/render-core/src/prims.ts`

Kiểu primitive và hợp đồng widget (tách khỏi render.ts để widget và renderFrame không import vòng).

```text
interface Derived   // Dữ liệu dẫn xuất: tính một lần ngoài vòng vẽ (Technical Design §4).
interface RectPrim
interface TextPrim   // Chữ một dòng. `y` là đường baseline; `x` là điểm neo theo `align`.
type Primitive   // Hình học thuần, đơn vị pt trong toạ độ widget.
interface LayoutCtx
interface WidgetRenderer
```

#### `packages/render-core/src/render.ts`

T-05: renderFrame + hợp đồng WidgetRenderer (Technical Design §5.1–5.2). Preview và Export gọi cùng hàm này,

```text
interface RenderCtx   // Ngữ cảnh vẽ đủ cho renderFrame (Canvas 2D và OffscreenCanvas đều có).
interface RenderTarget   // `width`/`height` theo điểm ảnh thật của đích vẽ.
function tracksFor(spec: WidgetSpec<unknown>, index: TimelineIndex): TrackIndex[]   // Chọn track cho widget theo trackMappingMode (SRS REQ-STORAGE-02).
function pianoRollPitchRange(p: PianoRollProps, tracks: TrackIndex[]): [number, number]   // Tầm cao độ của Piano Roll: FIT_CONTENT lấy min/max của track được gán (±1), rỗng thì C3–C6.
function pianoRollGeometry(p: Pick<PianoRollProps, 'keyboard' | 'playheadPositionRatio' | 'visibleSeconds'>, width: number)   // Hình học trục thời gian của Piano Roll (T-71). Tỉ lệ thời gian cố định: pt/giây = width / visibleSeconds, KHÔ…
const pianoRollRenderer
const WIDGET_RENDERERS   // Bảng renderer theo loại. Widget chưa có renderer được bỏ qua khi vẽ (vẫn giữ trong Scene).
const buildSceneHud = (scene: SceneDocument, ast: UnifiedProjectAST, index: TimelineIndex) =>   // HudData cho một scene: số đếm, lưới ô nhịp và hợp âm của mọi widget Chord Detection. Gọi ở bước derived (một …
function layoutFrame(scene: SceneDocument, derived0: Derived, ast: UnifiedProjectAST, t: number, renderers = WIDGET_RENDERERS)
function renderFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number, renderers = WIDGET_RENDERERS): void   // Vẽ một khung hình. `scale` = điểm ảnh đích / pt (Preview: bề rộng canvas × DPR / designWidth; Export: W_expor…
function drawPrimitives(g: Ctx2D, prims: Primitive[]): void   // Chỉ vẽ, không tính nghiệp vụ. Mọi trạng thái ctx bị đổi (alpha, shadow) được trả về mặc định sau mỗi hình.
```

#### `packages/render-core/src/scene.ts`

T-05: SceneDocument (= Preset, SRS REQ-STORAGE-02) + kiểm/sửa lược đồ. Dữ liệu thuần, không DOM.

```text
const SCENE_SCHEMA_VERSION
const WIDGET_TYPES
type WidgetType
interface WidgetLayout   // `rotation`: độ, (−180, 180]. `anchor`: điểm neo xoay theo tỉ lệ khung widget (0..1), mặc định tâm (REQ-GRAPHI…
const DEFAULT_ANCHOR
type TrackMappingMode
interface WidgetSpec
interface PianoRollProps
interface CanvasSpec
interface SceneDocument
const DEFAULT_PIANO_ROLL
const ASPECTS
function defaultScene(aspect: keyof typeof ASPECTS = '16:9'): SceneDocument   // Scene mặc định: một Piano Roll phủ kín khung. Bố cục mặc định theo nền tảng (9:16 cho người mới, KPI-04) chốt…
function pianoRollWidget(layout: Omit<WidgetLayout, 'anchor'> & { anchor?: WidgetLayout['anchor'] }, props: Partial<PianoRollProps> = {}, id = 'piano-roll-main'): WidgetSpec<PianoRollProps>
type SceneWarningCode
interface SceneWarning
type SceneErrorCode
class SceneError extends Error
  constructor(message: string, path: string, code: SceneErrorCode = 'ERR_PRESET_INVALID', extra: Record<string, unknown> = {})
const PRESET_LIMITS   // Giới hạn khi đọc preset (NFR-SEC-04). Vượt thì `ERR_PRESET_INVALID` (kích thước tệp: `ERR_PRESET_TOO_LARGE`).
const UNSAFE_KEYS   // Khoá có thể làm bẩn nguyên mẫu đối tượng: bị bỏ ở mọi độ sâu.
function migrateScene(raw: unknown):    // Di trú theo từng bậc phiên bản, trên một bản sao (đối tượng vào không bị sửa). Trả bản đã lên `SCENE_SCHEMA_V…
function sanitizeScene(input: unknown):    // Đọc một preset/scene từ JSON thô. Trả scene hợp lệ + cảnh báo.
interface Sanitizer   // Bộ kiểm giá trị dùng chung (đóng gói từ sanitizeScene để mỗi widget kiểm theo đường dẫn riêng).
```

#### `packages/render-core/src/snap.ts`

Bắt dính khi kéo widget (SRS REQ-GRAPHICS-02, REQ-GRAPHICS-03). Hàm thuần: không DOM, không đồng hồ, tất định.

```text
interface Rect
type SnapLayout   // Khung của một widget: `anchor` vắng thì lấy tâm. `rotation` độ, chiều kim đồng hồ (cùng chiều `ctx.rotate`, t…
function normalizeAngle(deg: number): number   // Đưa góc về (−180, 180].
function rotatedBounds(l: SnapLayout): Rect   // Khung bao thẳng trục của widget sau khi xoay quanh điểm neo. Góc 0 trả đúng `x, y, width, height`.
function snapAngle(deg: number, opts: { shift?: boolean; step?: number } = {}): number   // Góc khi kéo tay nắm xoay: bắt dính bội số `step` (mặc định 15°); giữ Shift thì tự do. Kết quả chuẩn hoá về (−…
function rotateGroup<L extends SnapLayout>(group: readonly L[], delta: number): L[]   // Xoay cả nhóm widget thêm `delta` độ quanh tâm khung bao chung (REQ-GRAPHICS-03): điểm neo của từng widget qua…
function toWidgetLocal(l: SnapLayout, px: number, py: number):    // Đổi điểm trên canvas về toạ độ trong widget (gốc ở góc trên trái khung chưa xoay). Dùng cho nhấp chọn widget …
function pointInWidget(l: SnapLayout, px: number, py: number): boolean   // Điểm (toạ độ canvas) có nằm trong hình đã xoay của widget không (tính cả cạnh).
interface Guide
interface SnapInput
interface Spacing   // Khoảng cách đều (Equal Spacing): ba khung bao thẳng hàng theo `axis`, hai khoảng hở `gaps` (từng cặp [đầu, cu…
interface SnapResult
function snap(i: SnapInput): SnapResult   // Thứ tự (mỗi trục độc lập): Smart Guides trước (cạnh/tâm của khung bao so với mép/tâm canvas và khung bao các …
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
type NoteState
const noteState = (start: number, end: number, t: number) =>   // Trạng thái nốt tại t. Biên: start = t là đang phát; end = t là đã phát.
function stateColor(style: NoteStyle, state: NoteState, fallback: string): string   // Màu theo trạng thái nếu đã đặt; không thì màu theo chế độ màu (hành vi cũ).
```

#### `packages/render-core/src/text.ts`

Chữ trong Render Core (TECHNICAL-DESIGN 5.7): đo bằng bảng FONT_METRICS (thuần, chạy ở Node), mẫu chữ, chia nhóm số.

```text
type Measure   // Hàm đo truyền vào layout (điều kiện 4): độ rộng của `text` tính bằng pt. Phông người dùng nạp thay hàm này bằ…
function fallbackEm(cp: number): number   // Độ rộng dự phòng (em) cho ký tự ngoài bảng: chữ CJK/emoji rộng 1 em, còn lại 0,6 em. Chỉ là ước lượng; bước v…
const measureText = (text, _font, size, weight) =>   // Đo bằng FONT_METRICS (Space Grotesk, chưa kerning). Họ phông khác dùng cùng bảng như ước lượng.
function fitText(text: string, maxWidth: number, font: string, size: number, weight: number, measure: Measure = measureText): string   // Cắt chữ cho vừa `maxWidth`, thêm "…" nếu cắt. Thuần theo `measure`.
function formatTemplate(template: string, values: Readonly<Record<string, string | number>>): string   // Thay `{tên}` bằng giá trị; chỗ giữ lạ được giữ nguyên chữ.
function unknownPlaceholders(template: string, known: readonly string[]): string[]   // Các tên chỗ giữ trong mẫu mà `known` không có (để cảnh báo khi đọc preset).
const pad = (n: number, width: number) =>   // Số nguyên không âm, đệm 0 đến `width` chữ số (số lớn hơn thì giữ đủ chữ số).
function groupDigits(parts: readonly number[], widths: readonly number[]): string   // Chia nhóm có số 0 đứng đầu: groupDigits([1, 35, 83], [3, 2, 3]) = "001 35 083".
const fixed = (v: number, d: number) =>   // Số thập phân với `d` chữ số, dấu chấm (chữ trong video không theo ngôn ngữ ứng dụng).
function clockMs(sec: number): string   // m:ss (phút không đệm 0).
```

#### `packages/render-core/src/thumbnail.ts`

Ảnh thu nhỏ cho cột "Video styles" (T-69): vẽ một khung nhỏ của dự án đang mở tại một mốc cố định, dùng chung renderFrame.

```text
const THUMBNAIL_FRACTION   // Mốc vẽ ảnh thu nhỏ: 40% thời lượng, làm tròn mili giây (giữa bài thường đã có nhiều nốt).
const thumbnailTime = (duration: number) =>
function renderThumbnail(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, target: Omit<RenderTarget, 'width' | 'height'>, widthPx: number):    // Vẽ ảnh thu nhỏ bề rộng `widthPx` điểm ảnh; cao theo tỉ lệ khung của scene.
const thumbnailKey = (styleId: string, projectKey: string, width: number) =>   // Khoá bộ đệm: đổi phong cách, dự án hoặc kích thước thì vẽ lại. `projectKey` do nơi gọi tính (tên tệp, thời lư…
function createThumbnailCache<T>(max = 48)   // Bộ đệm có trần (bỏ mục cũ nhất). Không chứa trạng thái vẽ, chỉ chứa kết quả đã có.
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

#### `apps/web/src/components/AudioPanel.tsx`

Âm thanh trong mục 01 Bài (T-08, TECHNICAL-DESIGN §6.2.3, D-53). Cơ bản: chỉ nạp tệp + tên tệp; offset ở "Thêm tuỳ chọn".

```text
interface AudioInfo
function offsetSummary(i18n: { t(k: string, p?: Record<string, unknown>): string; number(n: number, o?: Intl.NumberFormatOptions): string }, ms: number):    // Dòng giải thích offset bằng lời (locales web.audio.offset.*).
function AudioPanel({ audio, busy, offsetMs, showOffset, onLoad, onRemove, onOffset }: { audio: AudioInfo | null; busy: boolean; offsetMs: number; showOffset: boolean; onLoad(file: File): void; onRemove(): void; onOffset(ms: number): void; })
```

#### `apps/web/src/components/Editor.tsx`

Thẻ Editor (T-68, UI-DIRECTION 5.3 mục 3, SRS 5.3 Edit Mode): bố cục widget trên khung video.

```text
interface EditorActions
function useWidgetNames(widgets: readonly WidgetSpec[]): (id: string) => string   // Tên hiển thị của widget: tên loại theo ngôn ngữ, đánh số khi có nhiều widget cùng loại.
function Editor({ scene, derived, ast, playback, fonts, advanced, actions, transport, active }: Props)
```

#### `apps/web/src/components/EditorOverlay.tsx`

Lớp tương tác của Editor (T-68, SRS 5.3 Edit Mode, REQ-GRAPHICS-02/03): khung chọn, 8 tay nắm co giãn, tay nắm xoay,

```text
function EditorOverlay({ scene, cssWidth, selected, locked, onSelect, onLayouts, name, advanced }: Props)
```

#### `apps/web/src/components/FileDrop.tsx`

Khung thả/chọn tệp dự án (kèm .mid ngoài); hiệu ứng Framer Motion.

```text
interface Picked
function FileDrop({ onPick, busy, compact = false, slim = false }: { onPick(p: Picked): void; busy: boolean; compact?: boolean; slim?: boolean })   // `compact`: nút nhỏ ở thanh trên. `slim`: ô thả thu gọn một dòng, dùng khi bảng thiếu .mid đang hiện (hành độn…
```

#### `apps/web/src/components/HistoryMenu.tsx`

Cụm Hoàn tác / Làm lại và nút riêng "Lịch sử chỉnh sửa" (đồng hồ quay ngược, bên phải cả cụm) mở danh sách lịch sử thả xuống (T-07 bước 2b, SRS REQ-UI-02).

```text
function HistoryMenu({ history, items, undoName, undoTitle, redoName, redoTitle, onUndo, onRedo, onJump }: { history: History<any>; items: HistoryItem[]; undoName: string; undoTitle: string; redoName: string; redoTitle: string; onUndo(): void; onRedo(): void; onJump(position: number): void; })
```

#### `apps/web/src/components/Icons.tsx`

Biểu tượng vẽ tay bằng SVG, một nét 1,5 trên lưới 16 (không dùng ký tự Unicode hay phông biểu tượng).

```text
const ChevronRight = (p: P) =>
const HistoryIcon = (p: P) =>   // Đồng hồ có mũi tên quay ngược: lịch sử chỉnh sửa.
const Info = (p: P) =>
const Eye = (p: P) =>
const EyeOff = (p: P) =>
const Grip = (p: P) =>
const ToStart = (p: P) =>
const Back = (p: P) =>
const Forward = (p: P) =>
const Play = ({ className = 'h-4 w-4' }: P) =>
const Pause = ({ className = 'h-4 w-4' }: P) =>
const Repeat = (p: P) =>
const Minus = (p: P) =>
const Plus = (p: P) =>
const Undo = (p: P) =>
const Redo = (p: P) =>
const Sun = (p: P) =>
const Moon = (p: P) =>
const Upload = (p: P) =>
const Mark = ({ className = 'h-4 w-4' }: P) =>
const Lock = (p: P) =>
const Unlock = (p: P) =>
const RotateReset = (p: P) =>   // Mũi tên vòng: đặt lại góc xoay.
const ToFront = (p: P) =>
const ToBack = (p: P) =>
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
function NumberField({ id, label, value, onChange, spec, className = '', disabled, describedBy }: { id?: string; label: string; value: number; onChange(v: number): void; spec: NumberSpec; className?: string; disabled?: boolean; describedBy?: string })   // `disabled`: ô bị khoá (vd. vạch phát khi bật bàn phím, T-71); `describedBy`: id đoạn chú thích giải thích lý …
```

#### `apps/web/src/components/PresetSettings.tsx`

Mục "Preset" ở thẻ Settings (T-07, REQ-STORAGE-02): mở và lưu preset .json. Cảnh báo WARN_PRESET_* và lỗi hiện ngay tại đây.

```text
function PresetSettings({ onOpen, onSave, problems, opened }: { onOpen(file: File): void; onSave(): void; problems: Problem[]; opened: string | null })
```

#### `apps/web/src/components/SceneCanvas.tsx`

Canvas xem trước: chỉ lo kích thước điểm ảnh/DPR và gọi renderFrame (T-05). Mọi bố cục và vẽ nằm ở Render Core,

```text
function SceneCanvas({ scene, derived, ast, t, blocked = false }: { scene: SceneDocument; derived: Derived; ast: UnifiedProjectAST; t: number; blocked?: boolean })   // `blocked`: phông chưa nạp xong nên không vẽ khung (không vẽ khung có chữ bằng phông dự phòng).
```

#### `apps/web/src/components/Select.tsx`

Ô chọn dùng chung: <select> gốc của trình duyệt (bàn phím, trình đọc màn hình giữ nguyên) bọc trong khung vẽ mũi tên

```text
function Select({ wrapClassName = '', className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { wrapClassName?: string })
```

#### `apps/web/src/components/SliderField.tsx`

Thanh trượt + ô nhập số (REQ-UI-15) dùng chung cho mọi bảng. Lưới dùng minmax(0,1fr) để không tràn khung hẹp (T-61).

```text
function SliderField({ id, label, value, min, max, step, hardMin, hardMax, adv, disabled, describedBy, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; hardMin?: number; hardMax?: number; adv?: boolean; disabled?: boolean; describedBy?: string; onChange(v: number): void })   // `min`/`max` là phạm vi thanh trượt (phạm vi mềm); `hardMin`/`hardMax` cho phép gõ vượt phạm vi đó (mặc định b…
```

#### `apps/web/src/components/Stage.tsx`

Sân khấu (UI-DIRECTION 5.3, hướng E): khung video do Render Core vẽ, đặt như một bản in thử. Dấu cắt ở bốn góc,

```text
function LiveCanvas({ scene, derived, ast, playback, fonts = 'ready' }: Pick<Props, 'scene' | 'derived' | 'ast' | 'playback' | 'fonts'>)   // Canvas tự theo dõi `t`: chỉ phần này vẽ lại mỗi khung hình.
const Crop = ({ className }: { className: string }) =>
function Stage({ scene, derived, ast, playback, styleName, proof, width, fonts, children }: Props)
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
function StylePanel({ style, keyboard, onStyle, onKeyboard, lanes = [], advanced = true, notePresets, onNotePreset, playhead }: { playhead?: { ratio: number; visible: boolean; onChange(ratio: number): void; onVisible(visible: boolean): void }; notePresets?: readonly string[]; onNotePreset?(id: string): void; style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void; lanes?: string[]; advanced?: boolean })   // `lanes`: tên lane automation có trong dự án đang mở (cho nguồn phát sáng "automation"). `playhead`: vị trí vạ…
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
interface WaveData
function Transport({ playback, duration, wave, offsetMs = 0 }: { playback: Playback; duration: number; wave?: WaveData | null; offsetMs?: number })
```

#### `apps/web/src/components/VideoStyles.tsx`

Cột "Video styles" / "Phong cách video" (UI-DIRECTION 5.3): chọn phong cách của KHUNG VIDEO, không phải theme app (D-52).

```text
re-export { VIDEO_STYLES, videoStyleBase }
function isEdited(id: string, base: NoteStyle): boolean   // Kiểu nốt hiện tại còn đúng như phong cách đã chọn không (để hiện "đã chỉnh").
function VideoStyles({ value, edited, onPick, notice, thumb }: { value: string; edited: boolean; onPick(id: string): void; notice?: string; thumb?(id: string): string | undefined })   // `notice`: thông báo nhỏ không chặn sau khi đổi phong cách làm mất chỉnh tay (hoàn tác bằng Ctrl+Z hoặc nút ở …
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
function isTextEntry(t: EventTarget | null): boolean   // Đang gõ chữ/số (ô nhập, contentEditable)? Ctrl+Z toàn cục phải để nguyên cho trình duyệt hoàn tác chữ. Hẹp hơ…
function isTypingTarget(t: EventTarget | null): boolean   // Phím tắt khác (Home…): không nuốt khi đang gõ hoặc ở một điều khiển tự xử lý phím đó.
```

#### `apps/web/src/lib/audioAsset.ts`

Nạp tệp âm thanh mix (T-08, §6.2.1). Thứ tự kiểm: kích thước → thời lượng từ metadata → giải mã → thời lượng thật.

```text
type AudioErrorCode
class AudioLoadError extends Error
  constructor(code: AudioErrorCode, message: string, details: Record<string, unknown> = {})
interface PcmBuffer   // Phần của AudioBuffer mà ứng dụng cần.
interface AudioAsset
interface LoadDeps
async function loadAudioAsset(file: File, deps: LoadDeps): Promise<AudioAsset>
const browserDeps
```

#### `apps/web/src/lib/audioEngine.ts`

Điều khiển AudioContext cho đồng hồ chủ (T-08, §6.2.2). Toán thời gian nằm ở masterClock.ts/audioMap.ts; ở đây chỉ lên lịch nút nguồn

```text
interface ParamLike
interface GainLike
interface SourceLike
interface AudioContextLike
interface EngineDeps
interface BufferLike
const START_LEAD
const LOOKAHEAD
const PUMP_MS
const FADE
interface AudioEngine
function createAudioEngine(deps: EngineDeps): AudioEngine
const browserEngineDeps   // Phụ thuộc thật: AudioContext 48 kHz (không hỗ trợ thì mặc định, trình duyệt tự đổi tần số), timer của cửa sổ,…
```

#### `apps/web/src/lib/audioLength.ts`

Cảnh báo lệch độ dài giữa tệp âm thanh và dự án (T-08, §6.2.6). Hàm thuần; ngưỡng là [PROVISIONAL] và không đối xứng:

```text
const SHORT_ABS   // Cảnh báo lệch độ dài giữa tệp âm thanh và dự án (T-08, §6.2.6). Hàm thuần; ngưỡng là [PROVISIONAL] và không đ…
interface LengthCheck
function audioLengthCheck(audioSec: number, projectSec: number, offsetSec = 0): LengthCheck
```

#### `apps/web/src/lib/audioLimits.ts`

Giới hạn nạp tệp âm thanh (T-08, §6.2.1; REQ-PARSER-00 / NFR-SEC-04, REQ-WIDGET-07). Các số là [PROVISIONAL].

```text
const AUDIO_SAMPLE_RATE   // Giới hạn nạp tệp âm thanh (T-08, §6.2.1; REQ-PARSER-00 / NFR-SEC-04, REQ-WIDGET-07). Các số là [PROVISIONAL].
const MAX_AUDIO_BYTES
const MAX_AUDIO_SECONDS
const MAX_UNKNOWN_DURATION_BYTES   // Nhánh không đọc được metadata (MP3 VBR…): 48 MB = 20 phút ở 320 kbps; lớn hơn thì không giải mã mù.
const AUDIO_EXTENSIONS
const AUDIO_ACCEPT
const hasAudioExtension = (name: string) =>
```

#### `apps/web/src/lib/audioMap.ts`

Ánh xạ thời gian dự án ↔ vị trí trong tệp âm thanh (T-08, Technical Design §6.2.3). Hàm thuần.

```text
const OFFSET_LIMIT_MS   // Giới hạn offset (REQ-WIDGET-07): ±10 s, bước 1 ms.
const clampOffsetMs = (ms: number) =>
const mapToBuffer = (t: number, offsetMs: number) =>   // Vị trí trong buffer (giây) ứng với thời gian dự án `t`. `offsetMs > 0`: âm thanh trễ (đầu tệp rơi vào t = off…
interface Segment
function planSegment(t0: number, tEnd: number, offsetMs: number, bufferDuration: number): Segment | null   // Đoạn phát từ thời gian dự án `t0` tới `tEnd`. Trả null nếu trong khoảng đó không có âm thanh (trước đầu hoặc …
type ExportSegment
function exportSegments(rangeStart: number, rangeEnd: number, offsetMs: number, bufferDuration: number): ExportSegment[]   // Kế hoạch cắt âm thanh cho một khoảng xuất [rangeStart, rangeEnd] (REQ-EXPORT-03): im lặng ở phần thiếu, âm th…
```

#### `apps/web/src/lib/audioPeaks.ts`

Sóng âm cho thanh tua (T-08, §6.2.5). Hàm thuần, tất định: ô cơ sở cố định 512 mẫu theo vị trí tuyệt đối trong tệp,

```text
const PEAK_BUCKET
function downmixMono(channels: readonly Float32Array[], start: number, end: number): Float32Array   // Trộn mono (L+R)/2 ở độ chính xác Float32, thứ tự cố định. Một kênh thì trả nguyên.
interface PeaksAccumulator
function createPeaksAccumulator(): PeaksAccumulator   // Cộng dồn (min, max) theo ô 512 mẫu. Không giữ PCM. `finish` trả [min0, max0, min1, max1, …] (ô cuối có thể ng…
function reducePeaks(base: Float32Array, columns: number):    // Rút gọn mức cơ sở về `columns` cột: min/max theo nhóm ô, không nội suy. Trả cả đỉnh tuyệt đối để chuẩn hoá kh…
function peaksPath(p: { data: Float32Array; peak: number }, height: number): string   // Đường SVG (các vạch dọc) cho viewBox rộng `cols`, cao `height`, tâm ở giữa. Chuẩn hoá theo đỉnh; im lặng hoàn…
function placePeaks(base: Float32Array, audioDur: number, offsetSec: number, duration: number, cols: number):    // Sóng âm đặt lên trục thời gian của dự án: tệp dài `audioDur` giây, bắt đầu ở `offsetSec` (âm thì phần trước m…
```

#### `apps/web/src/lib/audioWorkers.ts`

Tạo Worker sóng âm qua chính sách Trusted Types (NFR-SEC-06), như parseInWorker.ts.

```text
const peaksInWorker = (id: string, buf: PcmBuffer) =>
```

#### `apps/web/src/lib/clock.ts`

Đồng hồ phát: hàm thuần, kiểm thử được không cần DOM. Thời gian chỉ là số `t` (giây); khung hình là hàm của t (ARC-01).

```text
interface ClockState   // Đồng hồ phát: hàm thuần, kiểm thử được không cần DOM. Thời gian chỉ là số `t` (giây); khung hình là hàm của t…
const initialClock
function advance(s: ClockState, dtSeconds: number, duration: number, loop: boolean | { start: number; end: number } = false): ClockState   // `loop`: true = lặp cả bài; { start, end } = lặp một đoạn (T-08, qua `validLoop`).
const seek = (s: ClockState, t: number, duration: number) =>
const togglePlay = (s: ClockState, duration: number) =>
```

#### `apps/web/src/lib/commands.ts`

Tài liệu có hoàn tác và các lệnh (T-07, Technical Design §6.4). Hàm dựng lệnh nhận `doc` hiện tại để lấy giá trị "trước";

```text
type TrackId
interface Doc
type Cmd
const CUSTOM_STYLE
const pianoIndex = (s: SceneDocument) =>   // Piano Roll đầu tiên của scene (hiện scene chỉ có một).
const pianoOf = (s: SceneDocument) =>
const patchNoteStyle = (d: Doc, next: NoteStyle) =>   // Đổi kiểu nốt toàn cục. Gộp theo trường đổi (kéo một thanh trượt = một bước).
const applyNotePreset = (d: Doc, base: NoteStyle, presetId?: string) =>   // Chọn bộ kiểu nốt dựng sẵn: thay cả `base`; hoàn tác trả lại đủ các chỉnh tay trước đó. Không gộp.
const patchKeyboard = (d: Doc, next: KeyboardStyle) =>
const setPlayheadRatio = (d: Doc, ratio: number) =>   // Vị trí vạch phát của Piano Roll (0,05–0,95 bề rộng, REQ-GRAPHICS-16). Kéo/gõ liên tiếp gộp thành một bước. Kh…
const setPlayheadVisible = (d: Doc, visible: boolean) =>   // Hiện/ẩn vạch phát (REQ-GRAPHICS-16). Ẩn chỉ bỏ nét vẽ; nốt vẫn phát tại vị trí vạch.
const patchTrackStyle = (d: Doc, id: TrackId, patch: Partial<NoteStyle> | null) =>   // Ghi đè kiểu nốt của một track (`patch` = null: bỏ ghi đè).
const setVideoStyle = (d: Doc, id: string) =>   // Thay cả scene bằng scene của phong cách `id`, giữ ghi đè theo track (hành vi cũ). Kiểu nốt tay chỉnh và bố cụ…
const loadPreset = (d: Doc, scene: SceneDocument) =>   // Mở preset: thay scene (và đánh dấu phong cách 'custom'). Một bước hoàn tác.
const patchBrightness = (d: Doc, id: TrackId, next: BrightnessConfig) =>   // ── độ sáng nền theo track ──
const toggleHidden = (d: Doc, id: TrackId) =>
const toggleSolo = (d: Doc, id: TrackId) =>
const setAllHidden = (d: Doc, hidden: boolean) =>
const moveTrack = (d: Doc, id: TrackId, to: number) =>
const setAudioOffset = (d: Doc, ms: number) =>   // Đặt offset âm thanh (ms). Gõ/bấm ± liên tiếp gộp thành một bước. Kẹp ±10 s, làm tròn 1 ms.
const patchLayout = (d: Doc, widgetId: string, patch: Partial<WidgetLayout>) =>   // Đổi layout widget (x, y, width, height, rotation, anchor). Gộp theo widget: kéo/đổi cỡ/xoay trong một cử chỉ …
const patchLayouts = (d: Doc, patches: Record<string, Partial<WidgetLayout>>) =>   // Đổi layout của một hoặc nhiều widget trong MỘT lệnh (Editor: kéo, đổi cỡ, xoay, xoay nhóm). Gộp theo tập widg…
const patchWidgetProps = (d: Doc, widgetId: string, patch: Record<string, unknown>) =>   // Đổi một số thuộc tính (`properties`) của widget.
const setWidgetVisible = (d: Doc, widgetId: string, visible: boolean) =>
const reorderZ = (d: Doc, widgetId: string, where: 'front' | 'back') =>   // Đưa widget lên trên cùng / xuống dưới cùng bằng cách đổi zIndex của nó.
const patchSnapping = (d: Doc, patch: Partial<SceneDocument['canvas']['snapping']>) =>
function handEdited(d: Doc): boolean   // Chỉnh tay (kiểu nốt hoặc bố cục) có bị mất nếu đổi sang phong cách khác không? Dùng để hiện thông báo nhỏ sau…
function initialDoc(videoStyle: string, saved: { style?: Partial<{ base: Partial<NoteStyle>; tracks: Record<string, Partial<NoteStyle>> }>; keyboard?: Partial<KeyboardStyle> } = {}): Doc   // Tài liệu ban đầu từ thiết lập đã lưu (localStorage): phong cách video, kiểu nốt, ghi đè theo track, bàn phím …
```

#### `apps/web/src/lib/csp.ts`

Chính sách CSP của ứng dụng (NFR-SEC-03 + NFR-SEC-06). Chèn vào index.html lúc build bằng plugin trong vite.config.ts.

```text
const CSP_DIRECTIVES
const CSP
```

#### `apps/web/src/lib/editorGeometry.ts`

Hình học thuần cho Editor (T-68, SRS REQ-GRAPHICS-02/03, REQ-UI 5.3 Edit Mode). Toạ độ là pt của khung thiết kế.

```text
type Handle
const HANDLES
const MIN_SIZE   // Cỡ nhỏ nhất khi kéo tay nắm (pt). Ô nhập số vẫn cho xuống 1 pt như lược đồ preset.
function toCanvas(l: L, qx: number, qy: number): [number, number]   // Điểm trong widget (toạ độ widget) → điểm trên khung.
function resizeLayout(start: L, handle: Handle, p: { x: number; y: number }, o: { shift?: boolean; alt?: boolean } = {}): L   // Đổi cỡ bằng tay nắm. `p`: con trỏ trên khung. Cạnh/góc đối diện đứng yên (theo hướng của chính widget, kể cả …
function setAnchor(l: L, anchor: { x: number; y: number }): L   // Đổi điểm neo mà widget không nhảy chỗ trên khung.
function pointerAngle(pivot: [number, number], p: { x: number; y: number }): number   // Góc (độ) của con trỏ quanh tâm xoay; 0° = hướng lên (tay nắm xoay nằm phía trên khung).
function hitTest<W extends { id: string; zIndex: number; visible: boolean; layout: L }>(widgets: readonly W[], p: { x: number; y: number }, locked: ReadonlySet<string> = new Set()): W | null   // Widget trên cùng (zIndex lớn nhất, cùng zIndex thì đứng sau trong tài liệu) chứa điểm `p`; bỏ widget ẩn hoặc …
const round = (l: L) =>
function outsideFrame(l: WidgetLayout, W: number, H: number): boolean   // Widget nằm hẳn ngoài khung (khung bao đã xoay không giao với khung): video sẽ không thấy nó.
function intoFrame(l: WidgetLayout, W: number, H: number):    // Dời widget ít nhất có thể để khung bao của nó nằm trong khung (lớn hơn khung thì canh mép trái/trên).
```

#### `apps/web/src/lib/externalMidi.ts`

REQ-UI-08: tóm tắt tình trạng file .mid ngoài mà dự án Reaper tham chiếu. Hàm thuần; cách so tên lấy từ parser

```text
interface ExternalMidiInfo
function summarizeExternalMidi(referenced: string[], provided: string[], missing: string[], key: (n: string) => string): ExternalMidiInfo
function mergeExtras<T extends { name: string }>(old: T[], added: T[]): T[]   // Gộp tệp phụ mới vào tệp phụ cũ; trùng tên thì tệp mới thay tệp cũ.
function missingMidiLevel(info: ExternalMidiInfo | undefined, failed: boolean): 'error' | 'warning' | null   // Có cần hiện bảng "thiếu file .mid" không, và mức độ (lỗi: không có nốt nào; cảnh báo: chỉ vài track trống).
```

#### `apps/web/src/lib/fonts.ts`

Nạp phông cho khung video ở Preview (TECHNICAL-DESIGN 5.7): FontFace + document.fonts, tự host cùng origin (CSP font-src 'self').

```text
const loadBundledFont = (spec: FontFaceSpec) =>   // Nạp một mặt phông (một lần cho mỗi tệp, kể cả khi gọi lại). Lỗi được quên để lần sau thử lại.
type FontsStatus
function useFontsStatus(scene: SceneDocument, loader: FontLoader = loadBundledFont): FontsStatus   // Trạng thái phông của scene: scene không có chữ thì luôn sẵn sàng.
```

#### `apps/web/src/lib/historyLabels.ts`

Nhãn danh sách lịch sử (T-07 bước 2b). Dựng LÚC HIỂN THỊ từ loại lệnh + tham số + giá trị trước/sau, qua locales/,

```text
interface LabelCtx
function describeCommand(cmd: Cmd, c: LabelCtx): string
interface HistoryItem
function historyItems(h: Pick<History<unknown>, 'timeline' | 'position'>, label: (i: number) => string, origin: string): HistoryItem[]   // Dòng danh sách từ dòng thời gian: mới nhất trước, mốc đầu ở cuối.
```

#### `apps/web/src/lib/masterClock.ts`

Toán đồng hồ chủ (T-08, Technical Design §6.2.2). Hàm thuần, không biết Web Audio, không đọc đồng hồ thật.

```text
interface Anchor
interface LoopRange
interface Reading
const MIN_LOOP_SECONDS   // Vòng lặp chỉ có nghĩa khi đủ dài (tránh vòng lặp vô hạn / lên lịch dày đặc).
const validLoop = (l: LoopRange | null | undefined, duration: number) =>
const normalizeStart = (t0: number, duration: number, loop: LoopRange | null) =>   // Điểm bắt đầu hợp lệ: ở/sau cuối vòng lặp thì vào từ đầu vòng.
function readClock(a: Anchor, s: number, duration: number, loop: LoopRange | null): Reading   // Thời gian dự án tại giờ nguồn `s`. Có vòng lặp thì quay lại đầu vòng khi qua cuối; không thì dừng ở `duration…
const rebase = (a: Anchor, sNow: number, duration: number, loop: LoopRange | null, sNew: number) =>   // Neo lại tại đúng t đang đọc: hình không nhảy; `sNew` là giờ nguồn của mốc neo mới.
interface OutputStamp   // ── giờ nghe được trên trục AudioContext ──
interface CtxSample
const MAX_LATENCY
function deviceLatency(c: Pick<CtxSample, 'baseLatency' | 'outputLatency'>): number   // Độ trễ ước lượng (giây): baseLatency + outputLatency; thiếu thì coi là 0; kẹp [0; 0,5]. Chỉ lấy mẫu khi neo, …
const validStamp = (s: OutputStamp | null | undefined) =>
function heardContextTime(c: CtxSample, frameMs: number, latency: number): number   // Giờ (trên trục AudioContext) của mẫu đang được NGHE tại khung vẽ `frameMs` (performance.now, mili giây). Có g…
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

#### `apps/web/src/lib/peaksClient.ts`

Client sóng âm (T-08, §6.2.5): gửi PCM mono sang Worker theo khối, mỗi lần một khối (chờ ack) nên bộ nhớ tạm chỉ ~4 MB.

```text
const CHUNK_SAMPLES
interface PeaksWorkerLike
function computePeaksViaWorker(buf: PcmBuffer, makeWorker: () => PeaksWorkerLike, chunk = CHUNK_SAMPLES): Promise<Float32Array>
function computePeaksSync(buf: PcmBuffer, chunk = CHUNK_SAMPLES): Float32Array   // Cùng kết quả, chạy ngay trên luồng gọi (test và so sánh bit).
async function peaksFor(id: string, buf: PcmBuffer, makeWorker: () => PeaksWorkerLike): Promise<Float32Array>   // Bộ đệm ≤ 1 tệp (≈ 0,9 MB cho 20 phút).
```

#### `apps/web/src/lib/playback.ts`

Kho đồng hồ phát nằm ngoài state của React (T-70): vòng requestAnimationFrame chỉ cập nhật kho này, và chỉ các phần

```text
interface Playback
function createPlayback(frame: Frame = browserFrame, engine: AudioEngine = createAudioEngine(browserEngineDeps)): Playback   // Không có âm thanh: t tiến theo dt giữa các khung (performance.now). Có âm thanh: t đọc từ đồng hồ chủ AudioCo…
function usePlayback<T>(p: Playback, select: (s: ClockState) => T): T   // Theo dõi một phần của đồng hồ; chọn giá trị nguyên thuỷ (số, boolean) để chỉ vẽ lại khi nó đổi.
function usePlaybackLoop(p: Playback): boolean   // Có đang lặp không (cho nút Lặp trên thanh phát).
```

#### `apps/web/src/lib/prefs.ts`

Lưu tuỳ chọn người dùng vào localStorage (tiện lợi cho từng trình duyệt; mọi truy cập đều có try/catch, thiếu thì dùng mặc định).

```text
function loadPref<T extends object>(name: string, fallback: T): T
function savePref(name: string, value: unknown): void
```

#### `apps/web/src/lib/presetFile.ts`

Mở/lưu preset .json (T-07, REQ-STORAGE-02, NFR-SEC-04). Phần kiểm lược đồ nằm ở Render Core (`sanitizeScene`);

```text
interface PresetResult
async function readPresetFile(file: Pick<File, 'name' | 'size' | 'text'>): Promise<PresetResult>   // Đọc một tệp preset. Ném `SceneError` (ERR_PRESET_TOO_LARGE / ERR_PRESET_INVALID / ERR_SCHEMA_NEWER).
function parsePresetText(text: string): 
const serializePreset = (scene: SceneDocument) =>
function presetFileName(name: string): string   // Tên tệp an toàn từ tên preset: chữ/số/gạch, tối đa 60 ký tự.
function downloadPreset(scene: SceneDocument): void   // Tải xuống bằng Blob + liên kết (không cần quyền, chạy với CSP của ứng dụng).
```

#### `apps/web/src/lib/problems.ts`

Lỗi/cảnh báo của thư viện → chuỗi đã dịch theo mã (REQ-I18N-04). Thông điệp gốc của thư viện chỉ là "chi tiết kỹ thuật".

```text
interface Problem
const COSMETIC_WARNINGS   // Cảnh báo KHÔNG làm đổi hình người dùng thấy: chỉ là xấp xỉ đường cong automation, automation chưa đọc (độ sán…
function describeProblem(i18n: Pick<I18n, 'has' | 't'>, kind: 'error' | 'warning', code: string, message?: string, details?: Record<string, unknown>): Problem
```

#### `apps/web/src/lib/store.ts`

Store có hoàn tác (T-07, Technical Design §6.4). TypeScript thuần, không React, không đọc đồng hồ thật (đồng hồ truyền vào để test).

```text
interface Command
interface History
interface StoreState
const HISTORY_LIMIT
const MERGE_WINDOW_MS
interface Store
function createStore<D>(initial: D, opts: { limit?: number; now?: () => number } = {}): Store<D>
```

#### `apps/web/src/lib/storeReact.ts`

Cầu nối React cho store có hoàn tác: `useStoreState` (useSyncExternalStore) và ngữ cảnh cử chỉ cho thanh trượt (T-07).

```text
function useStoreState<D>(store: Store<D>): StoreState<D>
interface Gesture   // Một cử chỉ kéo = một bước hoàn tác. Mặc định là no-op để thành phần dùng được ngoài App (test, storybook).
const GestureContext
function useGesturePointer():    // Cho thanh trượt: `onPointerDown` mở cử chỉ, đóng ở pointerup/pointercancel bất kể con trỏ thả ở đâu (cũng đón…
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

#### `apps/web/src/lib/thumbnails.ts`

Ảnh thu nhỏ cho cột "Video styles": Render Core vẽ một khung nhỏ của dự án đang mở tại mốc cố định (thumbnailTime), có bộ đệm.

```text
const projectKey = (name: string, ast: UnifiedProjectAST) =>   // Khoá dự án cho bộ đệm: đổi tệp hoặc nội dung thì ảnh vẽ lại.
const THUMB_ZOOM   // Phóng 2 lần quanh vạch phát: ảnh nhỏ thấy nốt và chữ rõ thay vì cả khung thu nhỏ.
function playheadCenter(scene: SceneDocument): Pt   // Tâm cắt (đơn vị thiết kế) = vạch phát của Piano Roll đầu tiên; không có Piano Roll thì giữa khung.
function styleThumbnail(styleId: string, scene: SceneDocument, ast: UnifiedProjectAST, pkey: string, width: number): string | undefined
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

#### `apps/web/src/lib/undoKeys.ts`

Phím tắt hoàn tác (T-07, REQ-UI-02): Ctrl/Cmd+Z hoàn tác; Ctrl/Cmd+Shift+Z và Ctrl+Y làm lại.

```text
function undoAction(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): 'undo' | 'redo' | null   // Hành động ứng với một phím, hoặc null nếu không phải phím hoàn tác. Tách ra để test không cần DOM.
function bindUndoKeys(target: Pick<Window, 'addEventListener' | 'removeEventListener'>, store: Undoable): () => void
const isMac = () =>   // macOS dùng Cmd, nơi khác dùng Ctrl (chỉ để hiển thị; phím thật chấp nhận cả hai).
function shortcutLabels(mac = isMac()): 
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

#### `apps/web/src/lib/videoScenes.ts`

Phong cách video = một scene hoàn chỉnh (D-51): "Paper" là preset đọc từ presets/scene/paper-1x1.json (phong cách mặc định khi mở tệp);

```text
const PAPER_SCENE
const DEFAULT_VIDEO_STYLE
const VIDEO_STYLES   // Phong cách video = scene hoàn chỉnh (cột "Video styles"). Bộ kiểu nốt dựng sẵn KHÔNG nằm ở đây mà ở mục 02 Hì…
const NOTE_PRESETS   // Kiểu nốt dựng sẵn của Render Core: chỉ đổi NoteStyle của Piano Roll trong scene hiện tại, không đổi scene.
const noteStylePreset = (id: string) =>
function matchNotePreset(base: NoteStyle): string   // Bộ kiểu nốt dựng sẵn khớp đúng NoteStyle hiện tại (so toàn bộ trường), hoặc 'custom'.
function videoStyleBase(id: string): NoteStyle   // Kiểu nốt gốc của một phong cách (để biết "đã chỉnh").
const videoStyleKeyboard = (id: string) =>   // Bàn phím piano có bật sẵn không (Paper không có bàn phím).
function sceneForStyle(id: string, style: StyleConfig, keyboard: Partial<Pick<KeyboardStyle, 'enabled'>> = {}): SceneDocument   // Scene của phong cách `id` với kiểu nốt và bàn phím hiện tại. Trả bản sao mới, không đụng PAPER_SCENE.
```

#### `apps/web/src/main.tsx`

Điểm vào của ứng dụng web: dựng React root với I18nProvider.

#### `apps/web/src/workers/audioPeaks.worker.ts`

Worker tính đỉnh sóng âm (T-08, §6.2.5): nhận PCM mono theo khối, chỉ cộng dồn (min, max) theo ô 512 mẫu, không giữ PCM.

```text
type PeaksIn
type PeaksOut
```

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
- `scripts/gen-font-metrics.mjs` — Sinh bảng độ rộng ký tự (FONT_METRICS) từ CHÍNH các tệp phông đã đóng gói trong apps/web/public/fonts
- `scripts/rewrite-imports.mjs` — Công cụ một lần: viết lại import tương đối giữa các package khi tách monorepo.
- `scripts/split_doc.py` — Tách tài liệu Markdown (SRS/SDD/TDD...) thành các mảnh nhỏ để đưa cho AI tham chiếu.
- `scripts/sync-docs.mjs` — Đồng bộ "hệ thống ngữ cảnh AI" của repo và kiểm tra liên kết. Không phụ thuộc thư viện ngoài (Node >= 18; split dùng python3).

## 4. Tệp test

- `apps/web/src/lib/audioAsset.test.ts`
- `apps/web/src/lib/audioEngine.test.ts`
- `apps/web/src/lib/audioLength.test.ts`
- `apps/web/src/lib/audioMap.test.ts`
- `apps/web/src/lib/audioPeaks.test.ts`
- `apps/web/src/lib/clock.test.ts`
- `apps/web/src/lib/csp.test.ts`
- `apps/web/src/lib/editorGeometry.test.ts`
- `apps/web/src/lib/externalMidi.test.ts`
- `apps/web/src/lib/historyLabels.test.ts`
- `apps/web/src/lib/masterClock.test.ts`
- `apps/web/src/lib/numberInput.test.ts`
- `apps/web/src/lib/parserClient.test.ts`
- `apps/web/src/lib/playback.test.ts`
- `apps/web/src/lib/prefs.test.ts`
- `apps/web/src/lib/presetFile.test.ts`
- `apps/web/src/lib/problems.test.ts`
- `apps/web/src/lib/store.test.ts`
- `apps/web/src/lib/theme.test.ts`
- `apps/web/src/lib/undoKeys.test.ts`
- `apps/web/test/app.test.tsx`
- `apps/web/test/components.test.tsx`
- `packages/render-core/test/fonts.test.ts`
- `packages/render-core/test/glow.test.ts`
- `packages/render-core/test/hud.test.ts`
- `packages/render-core/test/legacy.test.ts`
- `packages/render-core/test/paper.test.ts`
- `packages/render-core/test/preset.test.ts`
- `packages/render-core/test/presets.test.ts`
- `packages/render-core/test/render-core.test.ts`
- `packages/render-core/test/rotate.test.ts`
- `packages/render-core/test/scene.test.ts`
- `packages/render-core/test/snap.test.ts`
- `test/als.test.js`
- `test/binary.test.js`
- `test/dawproject.test.js`
- `test/detect-bundle.test.js`
- `test/i18n.test.js`
- `test/midi-alp.test.js`
- `test/rpp.test.js`

<!-- 10 thư mục src, 577 ký hiệu công khai -->
