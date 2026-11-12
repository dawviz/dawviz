---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "2. Package `core`"
path: "2. Package `core`"
chunk: 2-package-core.md
source_lines: 25-60
source_sha1: dbb03a72c8
ids: [ERR_NO_NOTES, KPI-01, REQ-LIM-03, REQ-LIM-04]
---
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
