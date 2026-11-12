# SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer

> Phiên bản tài liệu: 0.1 · Đối chiếu yêu cầu trong `PARSER-SRS.md` (ID `REQ-…`). Mã nguồn: `packages/*/src`.

## 1. Kiến trúc tổng thể

Monorepo npm workspaces, ES module thuần, không phụ thuộc ngoài. Mỗi định dạng là một package; mọi package phụ thuộc `core`; package `parser` ghép tất cả.

```
            @dawviz/parser  (detectFormat, parseProject)
   ┌───────┬───────┬────────┬────────────┬────────┐
  midi    als/alp  rpp   dawproject    binary
   └───────┴───────┴────────┴────────────┴────────┘
                    @dawviz/parser-core
  errors · limits · bytes · zip · xml · tempo · ast · compare
```

Nguyên tắc:
1. **Một cửa ra**: mọi parser tạo dữ liệu thô rồi gọi `buildAST` (core/ast.js) — nơi duy nhất kiểm tra bất biến và tính thời gian giây. (REQ-AST-01..03)
2. **Tick là sự thật**: parser tự chịu trách nhiệm ra tick@960; giây chỉ do `tempoMap` suy ra. (REQ-TEMPO-01)
3. **Không đoán ngầm**: thiếu thông tin → cảnh báo + cờ (`tempoSource`), không âm thầm bịa. (REQ-TEMPO-02)
4. **Đầu vào là kẻ thù**: giới hạn tài nguyên ở mọi tầng (byte, tỉ lệ, độ sâu, số nút, số nốt, ngân sách phép tính). (REQ-LIM-*)
5. **Bất đồng bộ chỉ ở nơi cần** (giải nén dùng `DecompressionStream`); phần còn lại đồng bộ để dễ test.

## 2. Package `core`

| Module | Vai trò | Hàm chính |
|---|---|---|
| `errors.js` | lỗi và cảnh báo | `DawParseError`, `fail(code,msg,details)`, `warn(list,code,msg,details)` |
| `limits.js` | giới hạn mặc định | `DEFAULT_LIMITS`, `resolveLimits` |
| `bytes.js` | byte/chuỗi | `toU8`, `sniff` → `gzip\|zip\|midi\|rpp\|xml\|unknown`, `inflateLimited(u8,'gzip'\|'deflate-raw',limits,label)`, `decodeUtf8` |
| `zip.js` | đọc ZIP | `readZipDirectory`, `extractEntry`, `findEntry` (không ZIP64, không mã hóa; chỉ method 0 và 8) |
| `xml.js` | quét XML nhanh | `parseXml(text,{maxDepth,maxNodes,skip,onSkipped})`; truy cập `kid kids at val num descendants`; `pathInventory`, `formatInventory` |
| `tempo.js` | tempo | `PPQ=960`, `makeTempoMap`, `tickToSec`, `secToTick`, `mergeTempoAndSig`, `rampToSteps` |
| `ast.js` | dựng AST | `buildAST`, `createPairer` (ghép Note-On/Off FIFO), `normalizeTempoOverride`, `pitchName` |
| `compare.js` | KPI-01 | `compareAST` |

### 2.1 Bộ quét XML (`xml.js`)
Không dùng DOM/DOMParser (chạy được trong Worker/Node, nhanh, kiểm soát được). Nút: `{n:name, a:attrs, c:children, t:text}`. Bỏ qua DOCTYPE và không mở rộng entity (REQ-LIM-04). Tham số `skip` là tập tên thẻ cần bỏ **cả cây con** (ví dụ `Devices`, `AudioTrack`, `ClipSlotList`) để giảm RAM với file hàng chục MB; `onSkipped(name,start,end)` cho phép đếm nội dung trong vùng bị bỏ (dùng đếm clip Session).

### 2.2 Giải nén (`bytes.js`, `zip.js`)
`inflateLimited` đọc `DecompressionStream` theo từng khối, cộng dồn số byte **thực**, hủy luồng ngay khi vượt `min(maxUnzippedBytes, input × maxRatio)`. ZIP đọc central directory, kiểm tên entry (REQ-LIM-03), giải nén riêng entry được yêu cầu.

### 2.3 Tempo (`tempo.js`)
`makeTempoMap(points)` nhận `[{tick,bpm,num,den}]`, trả mảng có `timeSeconds` tích lũy: `Δt = Δtick / 960 × 60 / bpm`. `tickToSec`/`secToTick` nội suy trong đoạn. `rampToSteps(t0,b0,t1,b1)` chia đoạn dốc thành bậc thang đủ mịn (xấp xỉ tuyến tính theo thời gian). `mergeTempoAndSig` gộp hai chuỗi sự kiện độc lập thành một danh sách điểm.

### 2.4 Dựng AST (`ast.js`)
Đầu vào của `buildAST`: `{title, artist, sourceFormat, sourceVersion, sourcePPQ, tempoPoints, tempoSource, tracks:[{name,muted,sourceId,notes:[{pitch,startTick,endTick,velocity,channel?}]}], warnings}` và tùy chọn `{maxNotes, showMuted}`. Các bước: chuẩn hóa tempo (nếu rỗng thì `fallback` + cảnh báo) → với mỗi nốt: làm tròn tick, `durationTick = max(1, end-start)`, kẹp pitch/velocity, tính giây → sắp theo `startTick` → gán id, màu (bảng 12 màu), `pitchRange` → lọc track tắt tiếng → `ERR_NO_NOTES` nếu không còn nốt → `meta.totalTicks/Duration`.

### 2.4b `parsePositionText` (`ast.js`)
Đổi vị trí người dùng gõ theo kiểu DAW (thời gian `m:ss.mmm`, `bar.beat.%` kiểu Reaper, `bar.beat.sixteenth` kiểu Ableton/Bitwig/Cubase) thành `{timeSeconds}` hoặc `{beat}` để đưa vào `normalizeTempoOverride`. Bar/beat → beat bằng `(bar-1)*numerator + (beat-1) + phần`; chỉ đúng khi nhịp không đổi tới mốc đó (giới hạn có chủ đích, giao diện nêu rõ). Đặt trong thư viện để test được; Worker gọi hàm này nên giao diện không chứa logic.

`parseTimeSignature` đọc `4/4`, `12/8`...; `resolveTempoRows(rows, {unit, base})` đổi các dòng nhập `{pos, bpm, sig?}` thành điểm tempoOverride. Với `reaper`/`sixteenth`, vị trí bar.beat cộng dồn theo từng **đoạn nhịp** (`segs`: bar bắt đầu, beat quy đổi nốt đen tại đó, num/den); một beat DAW = nốt theo mẫu số nên đổi ra nốt đen bằng ×4/den. Vị trí của dòng đổi nhịp được đọc theo nhịp *trước* nó, nhịp mới áp dụng từ dòng đó.

### 2.4c Automation (`automation.js`)
Lane `{kind, points}` đã sắp theo tick. `sampleLane` tìm đoạn bằng tìm nhị phân, áp `shapeCurve(a, shape, tension)` rồi nội suy: volume trong không gian fader (`gain^0,25`, hệ số khớp 2 số đo Reaper), pan/mute tuyến tính; `shape 1` giữ giá trị. `volumeToUnit` đổi gain → 0..1 theo dB. `buildAST` chuyển nguyên `mix`/`automation` của từng track; parser nào đọc được thì điền (hiện chỉ Reaper). Sắp xếp theo tick và quy đổi giây → tick nằm ở parser (cùng bản đồ tempo với nốt, nên `tempoOverride` kéo theo automation).

### 2.5 So sánh (`compare.js`)
Ghép nốt theo (pitch) + gần nhất về thời điểm trong cửa sổ 2 beat; dung sai = 1 tick của PPQ thô hơn trong hai nguồn quy sang 960. Trả thống kê và tối đa 10 mẫu lệch.

## 3. Package `midi` (REQ-MIDI-*)
`readSmf(u8, warnings)` đọc thô (tick theo PPQ nguồn): chunk `MThd`/`MTrk`, VLQ có chốt 4 byte, running status, meta `0x51` (tempo), `0x58` (nhịp), `0x03` (tên track), `0x2F`; ghép nốt theo khóa `(kênh<<8)|pitch`. `parseMidi` quy đổi `k = 960/division`, tách format 0 theo kênh, dựng tempo (hoặc `midi-default`).
`readSmf` được Reaper dùng lại để đọc `.mid` ngoài.

## 4. Package `als` (REQ-ALS-*, REQ-ALP-*)
Luồng `parseAls`: kiểm kích thước → `sniff` (gzip → `inflateLimited`; xml → dùng thẳng; khác → `ERR_UNSUPPORTED_FORMAT`) → `parseAlsText`:
1. `parseXml` với `SKIP` = {Devices, AudioTrack, ReturnTrack, PreHearTrack, ClipSlotList, WarpMarkers, SampleRef, Scenes, AudioClip}.
2. Gốc phải là `Ableton/LiveSet`. Master = `MasterTrack` hoặc `MainTrack`.
3. `readTimeline`: lấy sự kiện tempo và enum nhịp (kiểu cũ `ArrangerAutomation/Events` và kiểu mới `AutomationEnvelopes` tra `AutomationTarget Id`), sắp theo thời gian, giá trị ở `Time<0` là giá trị đầu; đoạn dốc → `rampToSteps`.
4. Với mỗi `MidiTrack`: duyệt `MidiClip`; `clipNotes` thực hiện mô hình phát: `passBase=CurrentStart`, `passFrom=LoopStart+StartRelative`; mỗi lượt lấy nốt `t∈[passFrom,LoopEnd)`, `start = passBase + (t − passFrom)`, bỏ nếu `≥ CurrentEnd`, `end = min(start+d, passEnd)`; nếu `LoopOn` thì `passBase += LoopEnd − passFrom; passFrom = LoopStart` và lặp (chốt 1e6 vòng).
5. Mute = `Speaker/Manual == false`. Tên = `Name/EffectiveName`.

`alsInventory` dùng `pathInventory` để in mọi đường dẫn thẻ + số lần + thuộc tính mẫu (công cụ kiểm chứng [VERIFY]).
`parseAlp` có hai nhánh theo `sniff`:
- **`pl-a` (định dạng thật)**: `indexOfBytes` tìm manifest `{"original_path"` → `readJsonObject` (đếm ngoặc, tôn trọng chuỗi, tối đa 1 MB) → `readGzipMembers` cắt `[12, jsonAt)` thành đúng N luồng gzip: với mỗi luồng thử các ứng viên kết thúc (vị trí magic `1f8b08` kế tiếp, cuối cùng là `jsonAt`), nhận ứng viên đầu tiên cho `inflateLimited` thành công và `ISIZE` (4 byte cuối) khớp độ dài giải nén; ngân sách `maxUnzippedBytes` giảm dần qua các luồng. Chọn `.als` theo `alsName/alsIndex` hoặc lớn nhất → `parseAls` (XML đã giải nén) → `sourceFormat='alp'`. Phần sample phía sau manifest không bị chạm tới (file 65 MB xử lý ≈ 0,15 s).
- **ZIP (dự phòng)**: đọc central directory → `pickMainAls` (bỏ `Backup/`, `__MACOSX/`, ưu tiên gốc/ngắn nhất) → giải nén entry đó → `parseAls`.

## 5. Package `rpp` (REQ-RPP-*)
`parseRppTree` tokenizes theo dòng (`tokenize` xử lý nháy kép/đơn/backtick), nút `<NAME args … >` gồm `lines` (thuộc tính), `kids` (nút con) và `after` (số dòng đứng trước con — giữ thứ tự để chia take). `parseRppText`:
1. Tempo gốc từ `TEMPO`, envelope `TEMPOENV*` (bỏ nếu `ACT 1` sai/`ACT 0`); `buildTempo` chuyển điểm `PT` (giây) sang tick: shape 1 = giữ, khác = dốc tuyến tính chia bước; nhịp đóng gói trong `PT[4]` (`num = v & 0xffff`, `den = v >>> 16`).
2. Với mỗi `TRACK`/`ITEM`: `splitTakes` → chọn take; nguồn `MIDI` → `readEmbeddedSource` (cộng dồn delta) / pool GUID / `loadExternal`.
3. Quy đổi vị trí item từ giây qua `secToTick`; nhân bản loop theo độ dài nguồn; `SOFFS` coi là quarter-note (VERIFY); cắt nốt ngoài item.
4. Bọc `buildAST` để lỗi `ERR_NO_NOTES` có `details.missingFiles` khi do thiếu `.mid` ngoài.
`inspectRpp` chỉ đọc cấu trúc, không dựng AST. `listExternalMidi` duyệt cây tìm nút `SOURCE MIDI` có dòng `FILE` và trả tên file (bỏ thư mục, không trùng). `loadExternal` đối chiếu tên trong `options.files` theo thứ tự: khớp đúng → khớp không phân biệt hoa/thường và coi khoảng trắng ≡ gạch dưới (tải lên thường đổi tên kiểu này). Đã kiểm với BigProject3.rpp + Oboe_MIDI_001.mid.

## 6. Package `dawproject` (REQ-DAWP-*)
`parseDawproject` (ZIP) → `parseDawprojectXml`: tempo gốc + tự động hóa; thu `Structure/Track` có `notes`; duyệt `Arrangement/Lanes` đệ quy với ngữ cảnh `{origin, unit, lo, hi, trackId}`. `placeClip` xử lý `playStart`, loop (`loopStart/loopEnd`), clip lồng; `conv()` đổi delta (beats→tick hoặc seconds→tick qua tempoMap). Ghi chú: `vel ≤ 1` coi là chuẩn hóa nhân 127.

## 7. Package `binary` (REQ-BIN-*)
Ba lớp:
1. **Biểu thức**: tokenizer → parser đệ quy (`ternary → logic → … → postfix`) cho cây `lit/id/mem/idx/un/bin/if/call`; cache theo chuỗi nguồn; `evalNode` trừ ngân sách mỗi nút; định danh tra qua chuỗi scope (`Object.hasOwn`), `parent`, `root`, `$index/$pos/$remaining/$item`. Định danh không biết → `undefined` (an toàn).
2. **Đọc nhị phân**: `readValue`/`readStruct` đệ quy theo schema; mỗi đọc kiểm `pos + size ≤ end` của vùng hiện tại; `length` tạo vùng con; `array` có `count|size|until` và chống phần tử không tiến con trỏ; `offset/peek/align/when/assert/switch`.
3. **Ánh xạ**: `parseBinaryWithSchema` chạy `readBinary` rồi duyệt `ast.tempo`/`ast.tracks` (`each/as/filter`) → `buildAST`. `timeUnit: ticks` chia `ppq`; `beats` nhân 960.
`validateSchema` kiểm toàn bộ schema trước khi đọc (tên, kiểu, biên dịch mọi biểu thức).

## 8. Package `parser` (bao ngoài)
`detectFormat(name, buffer, options)`: ưu tiên schema khớp (`matchSchema`), rồi switch theo đuôi + `sniff`; thông báo lỗi có hướng dẫn (flp, bwproject, .als dạng ZIP). `probeProject(name, buffer, options)` (không ném lỗi) trả `{format|null, needs:{externalMidi, schema}, code?, message?}`: giao diện dùng để chỉ hiện ô nạp `.mid` ngoài (khi `.rpp` tham chiếu) hoặc ô schema (định dạng nhị phân/đuôi lạ như `.bwproject`, `.flp`; đuôi đã biết nhưng nội dung sai thì không). `parseProject` gán `title` mặc định = tên file bỏ đuôi, truyền `limits` đã resolve, gọi parser tương ứng, trả thêm `format`.

## 8b. Package `i18n` (`@dawviz/i18n`)
Một file `src/index.js`, không phụ thuộc, không nằm trong bundle parser (parser/Worker không cần dịch). `createI18n({locale, fallback, catalogs, onMissing})` trả `{t, has, number, duration, setLocale, locale, dir}`. Danh mục là JSON phẳng `{ "khoá.chấm": "chuỗi" }` + `@meta`. `parseMessage` tách chuỗi thành mảnh chữ / `{arg}` / `{arg, plural, nhánh…}` (có lồng, kiểm ngoặc, bắt buộc `other`); kết quả được cache theo (locale, khoá). `t` tra `localeChain(locale)` rồi `localeChain(fallback)` (`vi-VN → vi → en`), thiếu thì gọi `onMissing` và trả chính khoá; số nhiều dùng `Intl.PluralRules`, `#` = số định dạng theo locale. `matchLocale(navigator.languages, codes)` chọn ngôn ngữ; `dirOf` trả `rtl` cho `ar he fa ur ps sd ug yi dv`; `loadLocales(baseUrl)` fetch `index.json` + từng `<mã>.json`.
`scripts/check-i18n.mjs` là bộ kiểm cho cộng tác viên/CI (xem `docs/I18N.md`); `--dir` cho phép test trên thư mục tạm. Lý do tách danh mục khỏi mã: thêm ngôn ngữ chỉ là thêm file JSON, và có thể kiểm tự động mà không cần chạy giao diện.

## 9. Bundle, CLI, demo
- `scripts/bundle.mjs`: gộp các module thành **một** file ES (`dist/dawviz-parser.bundle.js`) vì module Worker không dùng được import map. Mỗi module bọc trong IIFE; `import {…} from` thành destructuring từ module phụ thuộc; `export *` gộp bằng `Object.assign`. Chỉ hỗ trợ import tương đối và `@dawviz/*`; cú pháp import/export khác phải sửa bundler.
- `bin/dawparse.mjs`: CLI (xem README).
- `apps/parser-lab`: trang demo + Worker nạp bundle, không chứa logic parser. Luồng: chọn file → Worker `probe` → hiện/ẩn ô `.mid` ngoài, ô schema, bộ chọn `.als` (`.alp`) → phân tích; thông báo màu vàng khi thiếu file cần; dòng nhập mốc BPM chuyển kiểu gõ qua Worker bằng `parsePositionText`.

## 10. Quyết định thiết kế và đánh đổi
| ID | Quyết định | Lý do / hệ quả |
|---|---|---|
| PD-01 | Tự viết bộ quét XML thay vì DOMParser | Chạy trong Worker/Node, bỏ cả cây con, kiểm soát DoS; đổi lại không hỗ trợ XML phức tạp (namespace, CDATA tối thiểu) |
| PD-02 | `DecompressionStream` thay vì thư viện inflate | Zero-dependency; yêu cầu Chrome 103+/Node 18+ (`ERR_NO_SUPPORTED_ENV`) |
| PD-03 | Không ZIP64 | Chưa có nhu cầu; báo lỗi rõ |
| PD-04 | Chỉ đọc Arrangement của Ableton | Visualizer theo timeline; Session có số lượng cảnh báo |
| PD-05 | Tempo dốc xấp xỉ bằng bậc thang | Giữ `tempoMap` đơn giản; sai số nhỏ, có cảnh báo |
| PD-06 | Binary khai báo bằng JSON, không cho mã | An toàn (R-05/PD-18); đổi lại biểu đạt hạn chế, khó với định dạng cần tra bảng phức tạp hoặc nén |
| PD-07 | Cờ `tempoSource` thay vì mặc định 120 | Người dùng thấy và sửa được (`tempoOverride`) |
| PD-08 | Tolerance KPI theo PPQ thô hơn | So MIDI 96 PPQ với 960 PPQ mà không báo lỗi giả |
| PD-09 | Bundler tự viết | Không có mạng để cài esbuild; đủ cho cấu trúc hiện tại. Có thể thay bằng esbuild khi có mạng |
| PD-10 | `.alp` tách luồng gzip bằng thử-và-kiểm ISIZE thay vì tự cài inflate | Zero-dependency; `DecompressionStream` không báo điểm kết thúc luồng; chi phí giải nén lại ứng viên sai là nhỏ vì thường chỉ có vài luồng |
| PD-11 | i18n theo **mã lỗi**, không dịch `message` của thư viện | Thư viện giữ thông điệp kỹ thuật một ngôn ngữ cho nhà phát triển; giao diện dịch theo `code` nên thêm ngôn ngữ không đụng parser |
| PD-12 | Danh mục JSON phẳng + cú pháp `{tham_số}`/plural tự viết thay vì thư viện ngoài | Zero-dependency như phần còn lại; chỉ cần nội suy và số nhiều; cộng tác viên chỉ sửa JSON |

## 11. Mở rộng
- **Thêm định dạng mới**: tạo `packages/<fmt>`; viết `parse<Fmt>(buffer, options)` trả `{ast, warnings, info}` bằng cách gọi `buildAST`; export trong `index.js`; thêm vào `SUPPORTED` và `detectFormat`/`parseProject` ở `packages/parser`; thêm test và mục SRS.
- **Thêm trường AST**: sửa `buildAST`, `assertAstInvariants` (test/helpers.mjs), SRS §3.4, README.
- **Thêm cảnh báo/lỗi**: dùng `warn`/`fail` trong code và cập nhật bảng SRS §4.
