# SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer

> Phiên bản tài liệu: 0.1 · Phạm vi: các package trong `packages/*` (kết quả Spike 2 tách lib). Tham chiếu: SRS/BRD v0.2 của dự án (REQ-AST-01, REQ-PARSER-00..04, §8 mã lỗi).
> Quy ước: mỗi yêu cầu có ID cố định `REQ-…` (không đổi số khi thêm bớt; chỉ thêm ID mới). Trạng thái: `DONE` (đã cài + có test), `PARTIAL`, `VERIFY` (cài theo suy luận, chưa kiểm bằng file thật), `TODO`.

## 1. Mục đích và phạm vi

Đọc file dự án DAW trong trình duyệt/Worker/Node và xuất **một** cấu trúc `UnifiedProjectAST` chứa nốt MIDI, tempo, nhịp, track để vẽ visualizer. Không phát âm thanh, không đọc audio, không ghi ngược file dự án.

Ngoài phạm vi: audio clip, plugin/automation ngoài tempo và nhịp, ghi file. Chưa hỗ trợ: Session View của Ableton, `.flp`, `.bwproject` (nhị phân, chờ file mẫu).

## 2. Định dạng hỗ trợ

| ID | Định dạng | Mô tả | Trạng thái |
|---|---|---|---|
| REQ-FMT-01 | `.als` | Ableton Live; XML thuần **hoặc** Gzip XML, nhận bằng magic bytes, không dựa đuôi | DONE (file thật Live 9 và 12) |
| REQ-FMT-02 | `.alp` | Ableton Live Pack định dạng thật `pl-a` (các `.als` gzip + manifest JSON + sample); vẫn nhận biến thể ZIP | DONE (file thật Live 9.1, 65 MB) |
| REQ-FMT-03 | `.rpp` | Reaper; MIDI nhúng, take, loop, pooled, tempo envelope, `.mid` ngoài | DONE cho MIDI nhúng/take/loop/pooled/SOFFS (2 dự án thật Reaper 7.85, khớp oracle độc lập) và `.mid` ngoài (BigProject3 + Oboe_MIDI_001.mid, 3147 nốt khớp); VERIFY: IGNTEMPO=1 trong dự án thật, envelope cong; HASDATA chỉ nhận QN (PPQ động, đã kiểm 480 và 960) |
| REQ-FMT-04 | `.dawproject` | ZIP + `project.xml` (+ `metadata.xml`) | PARTIAL (chỉ có ví dụ chính thức) |
| REQ-FMT-05 | `.mid`/`.midi` | Standard MIDI File 0/1/2 | DONE |
| REQ-FMT-06 | binary theo schema | JSON schema mô tả byte → AST (cho `.bwproject` khi có mẫu) | DONE (schema demo); `.bwproject` TODO |
| REQ-FMT-07 | `.flp`, `.bwproject` (không schema) | Báo "chưa hỗ trợ" kèm hướng dẫn (xuất MIDI / xuất `.dawproject`) | DONE |

## 3. Yêu cầu chức năng

### 3.1 Chung (core)
- **REQ-CORE-01** Một điểm vào `parseProject(name, buffer, options)` trả `{ast, warnings, info, format}`; mỗi package cũng dùng được riêng.
- **REQ-CORE-02** Nhận dạng định dạng bằng đuôi **và** magic bytes (`detectFormat`); đuôi lạ mà là ZIP thì dò nội dung (`project.xml` → dawproject, `*.als` → alp).
- **REQ-CORE-03** Không có biểu thức/mã do file cung cấp được thực thi (không eval).
- **REQ-CORE-04** Mọi lỗi là `DawParseError` có `code` ổn định và `details` tùy chọn; cảnh báo là `{code, message, details?}`.
- **REQ-CORE-05** Thư viện chạy được ở Node ≥ 18, trình duyệt và module Worker; có bản bundle một file ES module.

### 3.2 Giới hạn và an toàn (REQ-PARSER-00)
- **REQ-LIM-01** Mặc định (ghi đè qua `options.limits`): `maxFileBytes` 100e6; `maxUnzippedBytes` 300e6; `maxRatio` 30; `maxXmlDepth` 64; `maxXmlNodes` 5e6; `maxNotes` 500000; `maxZipEntries` 20000; `maxRppLines` 5e6; `maxBinaryNodes` 5e6; `maxBinaryDepth` 64.
- **REQ-LIM-02** Giải nén theo luồng, đếm byte thật, dừng ngay khi vượt `maxUnzippedBytes` hoặc `maxRatio` (không tin kích thước khai báo).
- **REQ-LIM-03** ZIP: chặn đường dẫn thoát (`..`, tuyệt đối), chỉ giải nén entry cần dùng, không hỗ trợ ZIP64/mã hóa (báo `ERR_ARCHIVE_INVALID`).
- **REQ-LIM-04** XML: không mở rộng DOCTYPE/entity (chống XXE, billion laughs); giới hạn độ sâu và số nút.
- **REQ-LIM-05** Vượt `maxNotes` → `ERR_AST_TOO_LARGE`, kể cả khi mở rộng loop.

### 3.3 Tempo và thời gian
- **REQ-TEMPO-01** Tick là nguồn sự thật, `internalPPQ = 960`; giây suy ra từ `tempoMap`.
- **REQ-TEMPO-02** Không bao giờ gán 120 BPM âm thầm. `meta.tempoSource` ∈ `file | midi-default | fallback | user`. `fallback` luôn kèm `WARN_TEMPO_FALLBACK`; `midi-default` (SMF không có Set Tempo) kèm `WARN_TEMPO_MIDI_DEFAULT`.
- **REQ-TEMPO-03** `options.tempoOverride` (số BPM hoặc `[{tick,bpm,num,den}]`) thay hoàn toàn tempo của file; `tempoSource = 'user'`.
- **REQ-TEMPO-04** Tempo automation tuyến tính được xấp xỉ bằng các bước nhỏ (`rampToSteps`) và báo `WARN_TEMPO_RAMP`; đổi nhịp được gộp vào `tempoMap`.
- **REQ-TEMPO-05** `tempoMap` bắt đầu ở tick 0; tick và `timeSeconds` tăng nghiêm ngặt.

### 3.4 AST (REQ-AST-01)
- **REQ-AST-01** Cấu trúc: `meta{title, artist, sourceFormat, sourceVersion, sourcePPQ, tempoSource, internalPPQ, totalTicks, totalDurationSeconds}`; `tempoMap[{tick,timeSeconds,bpm,timeSigNumerator,timeSigDenominator}]`; `tracks[{id,index,name,color,isMuted,isVisible,sourceId,notes,pitchRange}]`; `note{id,pitch,pitchName,startTick,durationTick,endTick,startTimeSeconds,endTimeSeconds,velocity,channel}`.
- **REQ-AST-02** Bất biến: tick nguyên, `durationTick ≥ 1` (nốt dài 0 được nâng lên 1 và báo `WARN_ZERO_LENGTH_NOTES`), pitch 0..127, velocity 1..127, nốt sắp theo `startTick`.
- **REQ-AST-03** Không có nốt nhìn thấy được → `ERR_NO_NOTES`. Track tắt tiếng giữ trong AST với `isVisible=false`, trừ khi `showMuted`.

### 3.5 Ableton (.als / .alp)
- **REQ-ALS-01** Chỉ đọc Arrangement (`MidiTrack/…/ArrangerAutomation/Events/MidiClip`); `ClipSlotList` (Session) bị bỏ qua, đếm và báo `WARN_SESSION_CLIPS_IGNORED`.
- **REQ-ALS-02** Mô hình clip: điểm bắt đầu phát = `LoopStart + StartRelative`; nếu `LoopOn` thì hết `LoopEnd` quay về `LoopStart`, lặp đến `CurrentEnd`; nốt bị cắt tại `LoopEnd`/`CurrentEnd`; nốt `IsEnabled="false"` bỏ qua.
- **REQ-ALS-03** Tempo từ `MasterTrack` hoặc `MainTrack` (Live 12): sự kiện `FloatEvent` (Time<0 = giá trị đầu) hoặc `AutomationEnvelopes` tra theo `AutomationTarget Id`. Nhịp: `EnumEvent` giải mã `num=(v%99)+1`, `den=2^floor(v/99)` (201 = 4/4) — VERIFY.
- **REQ-ALS-04** Track tắt tiếng khi `Speaker/Manual=false`.
- **REQ-ALP-01** Nhận dạng `.alp` bằng magic `pl-a` (`sniff` → `alp-pack`). Cấu trúc: 12 byte header (`pl-a`, u32 LE, u32 0) → N luồng gzip nối liền, mỗi luồng là một `.als` → manifest JSON `{"original_path","als":[{"current_path","original_path"}],…}` (N phần tử, đúng thứ tự) → dữ liệu sample (FLAC…, không đọc).
- **REQ-ALP-03** `listAlp(buffer, options)` trả `{container, files:[{index,name,bytes,bpm,tempoSource,tracks:[{name,notes,muted}],error?,message?}], defaultIndex}` để giao diện cho người dùng chọn `.als` và track thay vì nhập số; file không có nốt vẫn được liệt kê kèm `error`.
- **REQ-TEMPO-03** `tempoOverride`: số BPM hoặc mảng `{bpm, num?, den?, tick|beat|timeSeconds}` (đúng một đơn vị vị trí); BPM 10–1000; giây đổi tuần tự theo BPM điểm trước; điểm 0 tự thêm; trùng vị trí thì điểm sau thắng; trộn `timeSeconds` với `tick/beat` là lỗi `ERR_AST_INVALID`.
- **REQ-DEMO-01** Trang demo không có ô MIDI tham chiếu để so sánh (so sánh vẫn có ở thư viện và CLI `--ref`); có bộ chọn `.als` trong `.alp` và các dòng nhập mốc + BPM (thêm/xoá nhiều dòng).
- **REQ-DEMO-02** Ô nạp thêm chỉ hiện khi cần, dựa trên `probeProject(name, buffer, options)` → `{format|null, needs:{externalMidi:[tên], schema:boolean}, code?, message?}`: ô `.mid` đi kèm chỉ hiện khi `.rpp` tham chiếu `.mid` ngoài (liệt kê tên cần); ô schema JSON chỉ hiện với định dạng nhị phân/chưa hỗ trợ (`.bwproject`, `.flp`, đuôi lạ). Đuôi đã biết nhưng nội dung sai thì không mời nạp schema.
- **REQ-DEMO-03** Khi người dùng chưa nạp file cần thiết, trang phải báo rõ: thiếu `.mid` ngoài (tên file), thiếu schema (kèm lý do chưa hỗ trợ), tempo không đọc được từ file (`tempoSource` ≠ `file`/`user`) kèm gợi ý nhập BPM.
- **REQ-DEMO-04** Ô mốc BPM nhận 3 cách gõ theo `parsePositionText` (REQ-TEMPO-04), mỗi dòng có thêm ô **dấu nhịp** (gợi ý 4/4, 3/4, 2/4, 5/4, 6/8, 7/8, 9/8, 12/8; để trống = giữ nhịp trước) theo REQ-TEMPO-05; nhịp gốc lấy từ lần phân tích trước (mặc định 4/4).
- **REQ-I18N-01** Mọi chuỗi giao diện của trang demo nằm trong `locales/<mã>.json` (JSON phẳng, `en` là nguồn, `vi` đầy đủ), truy cập qua `@dawviz/i18n` (`t(khoá, tham_số)`, `data-i18n`). Chữ cứng trong HTML/JS là lỗi.
- **REQ-I18N-02** Cú pháp chuỗi: `{tham_số}` và `{n, plural, one {#…} other {#…}}` theo `Intl.PluralRules`; dự phòng `vi-VN → vi → en → khoá`; chuỗi thiếu được báo qua `onMissing`.
- **REQ-I18N-03** Mã lỗi/cảnh báo của thư viện được dịch theo **mã** (`errors.ERR_*`, `warn.WARN_*`); `message` gốc của thư viện là thông điệp kỹ thuật cho nhà phát triển, hiện trong mục "chi tiết kỹ thuật". Thêm mã mới phải thêm khoá dịch.
- **REQ-I18N-04** Chọn ngôn ngữ: lựa chọn đã lưu (`localStorage`, có `try/catch`) → `navigator.languages` khớp theo chuỗi locale → `en`. Đổi ngôn ngữ cập nhật ngay `<html lang>`, `dir`, mọi chuỗi và kết quả đang hiển thị, không tải lại trang.
- **REQ-I18N-05** `npm run i18n:check` (`scripts/check-i18n.mjs`) kiểm danh mục: JSON, `@meta`, khoá thiếu/thừa, chuỗi rỗng, tham số khớp bản gốc, nhánh số nhiều hợp lệ theo ngôn ngữ, khoá dùng trong mã có mặt trong `en.json`, khoá mồ côi, locale chưa vào `index.json`. `status: partial` được thiếu khoá.
- **REQ-I18N-06** Đóng góp bản dịch theo `docs/I18N.md` (thêm file + một dòng `index.json`, không sửa mã). CSS dùng thuộc tính logic và `dir` để sẵn sàng cho ngôn ngữ từ phải sang trái.
- **REQ-TEMPO-04** `parsePositionText(text, {unit, numerator})` → `{timeSeconds}` hoặc `{beat}`: `time` (giây, `m:ss`, `m:ss.mmm`, `h:mm:ss.mmm`; đồng hồ thời gian mọi DAW đều có), `reaper` (`bar.beat.phần_trăm`, vd `5.3.50`), `sixteenth` (`bar.beat.sixteenth` đếm từ 1, vd `5.3.2`, kiểu Ableton/Bitwig/Cubase; tick sau `:` bị bỏ qua). Bar/beat đổi bằng `numerator` (đúng khi nhịp không đổi tới mốc đó). Sai định dạng/giá trị → `ERR_AST_INVALID`.
- **REQ-TEMPO-05** Dấu nhịp trong ghi đè: `parseTimeSignature(text)` nhận `4/4`, `3/4`, `6/8`, `12/8`, `7/8`, `5/4`... (tử 1–64, mẫu số ∈ {1,2,4,8,16,32}), sai → `ERR_AST_INVALID`. `resolveTempoRows(rows, {unit, base})` với `rows = [{pos, bpm, sig?}]` trả điểm `{bpm, num, den, beat|timeSeconds}` cho `tempoOverride`: bỏ trống `sig` = giữ nhịp trước đó (điểm đầu lấy `base`, nhịp đầu của file). Với `reaper`/`sixteenth`, "beat" của DAW là nốt theo **mẫu số** (4/4: nốt đen; 12/8: nốt móc đơn = 0,5 nốt đen) và bar được cộng dồn theo từng đoạn nhịp; đổi nhịp coi như bắt đầu ở đầu ô nhịp. **[VERIFY]** cách đếm beat của từng DAW trong nhịp ghép (6/8, 12/8) cần đối chiếu với DAW thật.
- **REQ-ALP-02** Một gói có thể chứa nhiều `.als`. Chọn bằng `options.alsName` (tên hoặc tên không đuôi) hoặc `options.alsIndex`; mặc định là `.als` có XML lớn nhất. Luôn báo `WARN_ALP_MULTIPLE_ALS` kèm danh sách; `info.alsCandidates` liệt kê tên. Không khớp → `ERR_ARCHIVE_INVALID` kèm `details.candidates`.
- **REQ-ALP-03** Ranh giới các luồng gzip được xác định bằng cách thử từng ứng viên magic `1f 8b 08` đến khi giải nén hợp lệ **và** khớp ISIZE; không tin kích thước header. Tổng byte giải nén bị chặn bởi `maxUnzippedBytes`. Thiếu/hỏng manifest, thiếu luồng → `ERR_ARCHIVE_INVALID`.
- **REQ-ALP-04** Biến thể ZIP: chọn một `.als` chính, bỏ `Backup/` và `__MACOSX/`; không có `.als` → `ERR_ARCHIVE_INVALID`.
- **REQ-ALS-05** Nếu Arrangement không có nốt nhưng Session View có clip MIDI, `ERR_NO_NOTES` nêu rõ số clip Session (chưa hỗ trợ đọc Session).

### 3.6 Reaper (.rpp) — VERIFY
- **REQ-RPP-01** Cây `<…>` theo dòng; nguồn `<SOURCE MIDI` với `HASDATA <n> <ppq> QN` và các dòng `E <delta> <status> <d1> <d2>` (hex, delta cộng dồn). **Guard clause tại dòng `HASDATA`**: tham số 3 là `QN` (hoặc vắng mặt, cấu trúc vẫn khớp chuẩn) → parse bình thường với `ppq` đọc **động** từ tham số 2 (số nguyên 1–65535: 480, 960, 1920… đều được; BigProject4 thật dùng 480). Đơn vị khác `QN`, hoặc PPQ không hợp lệ → **không đoán**: bỏ nguồn đó, báo `WARN_RPP_SRC_UNIT` (`details.{unit, ppq}`, nội dung nêu rõ "chưa hỗ trợ, hãy lưu lại dự án bằng Reaper bản mới"); nếu không còn nốt nào thì `ERR_NO_NOTES` kèm `details.unsupportedSources`. Lý do: đoán sai đơn vị làm lệch thời gian mà không ai biết; cách này đơn giản, dễ gỡ lỗi khi gặp ca hiếm.
- **REQ-RPP-02** Vị trí/độ dài item tính bằng **giây** → đổi sang tick qua `tempoMap`. `TEMPOENV*` điểm `PT <time> <bpm> <shape> …`: shape 1 = giữ, 0 = dốc tuyến tính; shape cong xấp xỉ tuyến tính + `WARN_TEMPO_SHAPE`.
- **REQ-RPP-03** (đã kiểm với dự án thật) Nhiều take: dùng take `TAKE SEL`, nếu không có thì take đầu. Item `MUTE 1` bỏ qua (`WARN_RPP_MUTED_ITEMS`). Track `MUTESOLO` ≠ 0 coi là tắt tiếng.
- **REQ-RPP-04** `LOOP 1`: nhân bản nguồn theo độ dài nguồn đến hết item (`WARN_RPP_LOOPED_ITEMS`). `POOLEDEVTS`: item sau dùng lại sự kiện của item đầu cùng GUID. `IGNTEMPO 1 <bpm> <num> <den>`: nguồn chạy theo BPM riêng nên thời gian nguồn tính theo giây tuyệt đối (đổi tempo dự án không làm đổi giây); `IGNTEMPO 0 …`: theo tempo dự án. Cú pháp lấy từ trang tài liệu "Interactive Project Map" của Reaper; sau đó có **dự án thật** BigProject4b (`TEMPO 120 12 8`, `IGNTEMPO 1 180 4 4`): thời lượng 110,6 s = 165,9 × 120/180, ô nhịp 12/8 ở 120 BPM = 3 s khớp thước kẻ Reaper, mật độ nốt trong 3 s đầu khớp ảnh chụp piano roll. Chưa có đối chứng độc lập từng nốt nên vẫn đánh dấu **[VERIFY]** mức thấp.
- **REQ-RPP-05** Nguồn tham chiếu `.mid` ngoài đọc qua `options.files` (map tên → byte; so tên không phân biệt hoa/thường và coi khoảng trắng ≡ gạch dưới, vì tải lên có thể đổi tên) hoặc `options.resolveFile(path, base)`; `listExternalMidi(buffer)` liệt kê tên file cần. **[ĐÃ KIỂM]** BigProject3.rpp (`FILE "Media\Oboe MIDI 001.mid" QN`, `IGNTEMPO 0 120 4 4`) + Oboe_MIDI_001.mid: 3147 nốt, cùng thời lượng với đọc trực tiếp `.mid`; thiếu file → `WARN_RPP_EXTERNAL_MIDI`, và nếu cuối cùng không có nốt thì `ERR_NO_NOTES` kèm danh sách file thiếu.
- **REQ-RPP-07** Envelope của track được đọc thành `track.automation` (REQ-AUTO-01): `VOLENV2` (âm lượng sau FX, là "Volume" trong giao diện; ưu tiên hơn `VOLENV`), `PANENV2`/`PANENV`, `MUTEENV`; chỉ envelope bật (`ACT` ≠ 0) và có điểm `PT <giây> <giá trị> <shape> … <tension bezier ở trường cuối>`; giây đổi sang tick qua bản đồ tempo; điểm trùng vị trí: điểm sau thắng. `VOLPAN <gain> <pan> …` → `track.mix {volumeDb, pan}`. Envelope **không** đọc (trong item/take, trước FX trùng loại, `WIDTHENV*`) được đếm trong `WARN_RPP_ENVELOPES_IGNORED` (`details.{ignored, read}`); có đoạn cong (shape 2–5) → `WARN_RPP_ENVELOPE_SHAPE_APPROX`. Tempo envelope (`TEMPOENV*`) đọc riêng. **[ĐÃ KIỂM]** BigProject4b: volume 3 điểm (0 s = 0 dB; 3 s = −26,4 dB; 4,5 s = +3 dB, bezier tension 0,6) và so với số đọc từ giao diện Reaper: 2,920 s → −25,3 dB (parser −25,36), ≈1,98 s → −15,3 dB (parser −15,04). Pan/mute lưu **giá trị thô**; chiều của pan và nghĩa giá trị mute chưa kiểm **[VERIFY]**.
- **REQ-AUTO-01** AST: `track.automation?: { volume?, pan?, mute? }`, mỗi lane `{ kind, points:[{tick, timeSeconds, value, shape, tension?}] }` sắp theo tick; `track.mix?: { volumeDb, pan }` (mức fader tĩnh). `value` của volume là gain tuyến tính (1 = 0 dB, 1,4125 = +3 dB).
- **REQ-AUTO-02** `sampleLane(lane, tick)` trả giá trị tại tick (giữ giá trị biên ngoài khoảng điểm). Hình dạng (theo Reaper): 0 tuyến tính, 1 bậc thang, 2 chậm đầu-cuối, 3 nhanh đầu, 4 nhanh cuối, 5 bezier (xấp xỉ bằng đường cong mượt theo tension). Lane volume nội suy trong không gian fader `p = gain^0,25` (khớp 2 số đo Reaper ≤ 0,3 dB; nội suy tuyến tính theo biên độ sai tới 2,6 dB, theo dB sai tới 0,4–1,8 dB) **[VERIFY: hệ số 0,25 suy từ 2 điểm]**.
- **REQ-AUTO-03** `volumeToUnit(gain, {floorDb = −36, ceilDb = 0})` → độ sáng 0..1 (tuyến tính theo dB, kẹp hai đầu). Ứng dụng quyết định cách dùng (REQ-GRAPHICS-06 của SRS sản phẩm).
- **REQ-RPP-06** `inspectRpp` mô tả cấu trúc (tempo, envelope, track, item, take, loại nguồn) mà không cần có nốt.

### 3.7 DAWproject
- **REQ-DAWP-01** Đọc `project.xml` (bắt buộc), `metadata.xml` (tùy chọn: Title, Artist). Thiếu `project.xml` → `ERR_ARCHIVE_INVALID`.
- **REQ-DAWP-02** Track có `contentType` chứa `notes` và không phải kênh `role="master"`. Mute từ `Channel/Mute@value`.
- **REQ-DAWP-03** Lane/Clip: `time`, `duration`, `playStart`, `loopStart`, `loopEnd`, `contentTimeUnit`; `timeUnit` beats hoặc seconds (seconds quy đổi qua tempo, `WARN_TIME_UNIT_MIXED` khi trộn). Clip lồng clip được đệ quy.
- **REQ-DAWP-04** `Note`: `time`, `duration`, `key`, `vel` (0..1 → 1..127; >1 coi là đã thang 127), `channel`.
- **REQ-DAWP-05** Tempo từ `Transport/Tempo@value`; tempo/nhịp automation (`TempoAutomation`, `TimeSignatureAutomation`) — VERIFY.

### 3.8 MIDI
- **REQ-MIDI-01** SMF format 0/1/2, running status, Note-On vận tốc 0 = Note-Off, ghép cặp FIFO theo (kênh, pitch).
- **REQ-MIDI-02** Format 0 tách track theo kênh (kênh 10 gắn nhãn drums). Nốt treo kéo đến cuối track + `WARN_MIDI_HANGING_NOTES`; file cụt đọc phần hợp lệ + `WARN_MIDI_TRUNCATED`. SMPTE division → `ERR_UNSUPPORTED_FORMAT`.
- **REQ-MIDI-03** Tick quy đổi từ PPQ nguồn sang 960 và làm tròn.

### 3.9 Binary theo schema
- **REQ-BIN-01** Schema JSON `schemaVersion: 1` mô tả cấu trúc byte và mục `ast` ánh xạ (xem `schemas/README.md`).
- **REQ-BIN-02** Mọi đọc byte bị chặn trong vùng hợp lệ; `count`/`length` không hợp lệ hoặc quá lớn → lỗi, không cấp phát theo giá trị trong file.
- **REQ-BIN-03** Biểu thức do bộ phân tích riêng đánh giá; hàm trắng `min max floor ceil round abs len beatsToTicks clamp`; tên `__proto__`, `constructor`, `prototype` bị cấm; có ngân sách phép tính (5e7), nút, độ sâu.
- **REQ-BIN-04** Schema sai → `ERR_SCHEMA_INVALID`; file không khớp `magic` → `ERR_UNSUPPORTED_FORMAT`; schema được chọn theo `extensions` + `magic`.

### 3.10 So sánh kiểm chứng (KPI-01)
- **REQ-CMP-01** `compareAST(a, ref)` ghép nốt theo (pitch, thời điểm gần nhất trong cửa sổ 2 beat); dung sai = 1 tick của nguồn thô hơn (ví dụ MIDI 96 PPQ → 10 tick @960); trả `pass`, số nốt khớp/lệch/chỉ-có-một-bên, chênh tempo và tổng thời lượng.

## 4. Mã lỗi

| Mã | Khi nào |
|---|---|
| ERR_UNSUPPORTED_FORMAT | đuôi/nội dung không hỗ trợ, magic sai, SMPTE |
| ERR_FILE_TOO_LARGE | file > `maxFileBytes` |
| ERR_ARCHIVE_INVALID | ZIP hỏng, zip-slip, thiếu `project.xml`/`.als`, ZIP64/mã hóa |
| ERR_ARCHIVE_TOO_LARGE | vượt `maxUnzippedBytes` / `maxRatio` / `maxZipEntries` |
| ERR_AST_INVALID | cấu trúc nội dung sai (gốc XML sai, MThd thiếu, đọc binary lố vùng) |
| ERR_AST_TOO_LARGE | vượt `maxNotes`, nút, ngân sách phép tính |
| ERR_NO_NOTES | không có nốt hiển thị sau khi lọc |
| ERR_SCHEMA_INVALID | schema nhị phân sai hoặc thiếu mục `ast` |
| ERR_NO_SUPPORTED_ENV | môi trường thiếu `DecompressionStream` |

Cảnh báo: `WARN_TEMPO_FALLBACK`, `WARN_TEMPO_MIDI_DEFAULT`, `WARN_TEMPO_OVERRIDDEN`, `WARN_TEMPO_RAMP`, `WARN_TEMPO_SHAPE`, `WARN_TEMPO_AUTOMATION(_SECONDS)`, `WARN_TIMESIG_DEFAULT`, `WARN_ZERO_LENGTH_NOTES`, `WARN_SESSION_CLIPS_IGNORED`, `WARN_CLIP_SKIPPED`, `WARN_ALP_MULTIPLE_ALS`, `WARN_MIDI_*`, `WARN_RPP_*`, `WARN_DAWPROJECT_*`, `WARN_TIME_UNIT_MIXED`.

## 5. Yêu cầu phi chức năng
- **REQ-NFR-01** Không phụ thuộc gói ngoài (zero dependency).
- **REQ-NFR-02** `Demo.als` (≈ 9600 nốt) phân tích dưới 1 giây trong Worker (đo ≈ 0,6 s).
- **REQ-NFR-03** Đầu vào không tin cậy: không đệ quy không giới hạn, không vòng lặp vô hạn (mọi vòng lặp loop/mảng có chốt chặn).

## 6. Câu hỏi mở / cần dữ liệu
- OI-01 (đã giải quyết một phần: 2 dự án Reaper thật có MIDI nhúng và 1 dự án có `.mid` ngoài thật; `IGNTEMPO 1` đã có dự án thật (BigProject4b), thiếu đối chứng độc lập từng nốt; còn thiếu envelope cong; HASDATA ≠ QN đã xử lý bằng guard clause, không cần mẫu); OI-02 `.dawproject` xuất thật từ Bitwig; OI-03 clip Ableton có `StartRelative ≠ 0`; OI-04 cặp (dự án, MIDI xuất từ DAW) cho KPI-01; OI-05 file `.bwproject` mẫu; OI-06 nhịp Ableton ≠ 4/4 để xác nhận công thức enum.

## 7. Lệch so với SRS gốc v0.2
Mốc clip = `LoopStart + StartRelative`; AST thêm `sourcePPQ`, `tempoSource`, `note.channel`, `track.sourceId`, `sourceFormat` thêm `alp`/`custom_binary`; `maxUnzippedBytes` 300 MB thay vì 500 MB (giới hạn chuỗi V8); thêm `ERR_SCHEMA_INVALID`, `ERR_NO_SUPPORTED_ENV`; `.als` Session View bị bỏ qua (có đếm và cảnh báo `WARN_SESSION_CLIPS_IGNORED`).
