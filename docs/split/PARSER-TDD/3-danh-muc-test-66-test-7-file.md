---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3. Danh mục test (66 test, 7 file)"
path: "3. Danh mục test (66 test, 7 file)"
chunk: 3-danh-muc-test-66-test-7-file.md
source_lines: 24-62
source_sha1: 42e0660dc8
ids: [ERR_ARCHIVE_TOO_LARGE, ERR_AST_INVALID, ERR_NO_NOTES, ERR_UNSUPPORTED_FORMAT, REQ-ALP-01, REQ-CMP-01, REQ-CORE-02, REQ-CORE-05, REQ-FMT-01, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_ENVELOPE_SHAPE_APPROX, WARN_RPP_SRC_UNIT, WARN_TEMPO_RAMP]
---
## 3. Danh mục test (66 test, 7 file)

### 3.1 `als.test.js` (15) — REQ-FMT-01, REQ-ALS-*
| Test | Kiểm tra |
|---|---|
| Demo.als thật | Live 12.4.16; Gzip; 167 BPM; 4/4; 11 track với số nốt từng track (69, 604, 760, 95, 35, 147, 38, 70, 7600, 175, 12 = 9605); 55 clip arrangement; 69 clip session bị bỏ + cảnh báo |
| XML thuần ≡ Gzip | AST bằng nhau sau gunzip |
| Oracle độc lập | Tính lại start/end từ XML thô (bỏ nốt `IsEnabled=false`) khớp 9605 nốt |
| Clip lặp | start-marker = LoopStart+StartRelative; lặp tới CurrentEnd; cắt ở LoopEnd/CurrentEnd |
| Clip không lặp | Bỏ nốt trước marker và sau LoopEnd; cắt tại CurrentEnd |
| Mute | Giữ track tắt tiếng nhưng ẩn; chỉ có track mute → `ERR_NO_NOTES`; `showMuted` cứu được |
| Tempo dốc + 6/8 | Bước tăng dần; bpm trung bình ≈ 150; đổi nhịp EnumEvent 302 → 6/8; `WARN_TEMPO_RAMP` |
| Không tempo | `fallback` + cảnh báo; `tempoOverride` → `user` |
| An toàn | DOCTYPE/entity không mở rộng; gzip bomb → `ERR_ARCHIVE_TOO_LARGE`; rác → `ERR_UNSUPPORTED_FORMAT`; gốc sai → `ERR_AST_INVALID` |
| Inventory | Đường dẫn MidiClip có 55; có nhánh `MainTrack…/Tempo` |
| `parsePositionText` | `0:00.000`, `90.5`, `1:30.250`, `1:02:03.5`; `1.1.00`/`5.3.50` (Reaper), `1.1.1`/`2.3.4:00` (sixteenth); 12/8 (beat = nốt móc đơn); giá trị sai (`1:75`, `0.1.1`, beat vượt nhịp, đơn vị lạ) → `ERR_AST_INVALID` |
| Reaper đếm beat theo mẫu số | 12/8 @120 BPM: `1.12.68` = 5,84 nốt đen = 2,920 s (đúng số hiển thị `1.12.68 / 0:02.920` trong Reaper); `1.13.00` bị từ chối |
| Automation | `sampleLane` pan tuyến tính, bậc thang, volume trong không gian fader (−9,97 dB ở giữa đoạn 0 → −24 dB), `shapeCurve`, `volumeToUnit` (kẹp, floor/ceil tuỳ chỉnh) |
| `parseTimeSignature` + `resolveTempoRows` | `3/4`, `12 / 8`; từ chối `4/3`, `65/4`, `0/4`; chuỗi 4/4 → 3/4 → 12/8 theo bar.beat cho beat `[0, 8, 14, 20]` và nhịp tương ứng; theo thời gian chỉ gắn nhịp |

### 3.2 `midi-alp.test.js` (11) — REQ-MIDI-*, REQ-ALP-01, REQ-CMP-01
PPQ 480→960 + tempo đổi + nhịp 3/4 + thời gian giây; running status + vận tốc 0; format 0 tách kênh + `midi-default` + override; nốt treo, file cụt, SMPTE, rác, không nốt; so sánh 960 vs 96 PPQ; ALP chọn `.als` chính bỏ Backup/MACOSX; ALP với `.als` XML thuần; ALP lỗi (không `.als`, zip-slip, bom, rác); **ALP `pl-a`** dựng giống file thật (header + 2 `.als` gzip + manifest + đuôi sample chứa magic gzip giả): mặc định chọn file lớn nhất, `alsName`/`alsIndex`, `alsName` sai → lỗi; ALP `pl-a` cụt/mất manifest/bom.

### 3.3 `rpp.test.js` (17) — REQ-RPP-*
Inspect 5 template thật (tempo 180, 39 điểm envelope…); `youdreamarked` thiếu `.mid` ngoài → `ERR_NO_NOTES` liệt kê file, cấp `options.files` → đọc được; MIDI nhúng (delta, giây→tick); LOOP nhân bản; TAKE SEL; item MUTE/track mute; POOLEDEVTS; tempo envelope giữ + đổi (5 beat = 4800 tick); không tempo/override; gốc sai; **dự án Reaper thật `BigProjectDemo2.rpp`** (Reaper 7.85, 1 item pooled): 1 track `Oboe`, 3147 nốt = số Note-On thô trong file.
**BigProject3 + Oboe_MIDI_001.mid thật**: thiếu `.mid` ngoài → `ERR_NO_NOTES` (`details.missingFiles`), nạp `Oboe_MIDI_001.mid` (tên đã đổi khoảng trắng→gạch dưới) → 3147 nốt = đọc thẳng `.mid`, cùng thời lượng. **IGNTEMPO** (mẫu từ tài liệu Reaper): `1 116 4 4` → giây không đổi khi đổi tempo dự án (6,207 s; 9,828 s; 13,966 s); `0` → theo tempo dự án. Trang tài liệu Reaper dán nguyên (không phải `.rpp`) bị từ chối gọn. **BigProject4b thật**: `TEMPO 120 12 8` → nhịp 12/8; `IGNTEMPO 1 180 4 4` → thời lượng 110,6 s và nốt thứ hai lúc 1/6 s; tempo envelope rỗng (0 điểm); envelope âm lượng được đọc vào `track.automation` (3 điểm; −25,3 dB tại 2,920 s ±0,3, −15,3 dB tại ≈1,98 s ±0,5 so với số đọc từ giao diện Reaper), `track.mix`, `WARN_RPP_ENVELOPE_SHAPE_APPROX`; synthetic: `ACT 0` không đọc, điểm trùng vị trí, pan/mute thô, `WARN_RPP_ENVELOPES_IGNORED` đếm đúng (item, trùng loại, `WIDTHENV`). **HASDATA**: BigProject4 thật (`HASDATA 1 480 QN`) → 3147 nốt, cùng thời lượng với bản 960; PPQ 480/960/1920 quy đổi đúng; thiếu đơn vị coi là QN; đơn vị lạ (`SECONDS`) → bỏ nguồn + `WARN_RPP_SRC_UNIT`, còn nguồn QN khác vẫn đọc; chỉ có nguồn lạ hoặc PPQ=0 → `ERR_NO_NOTES` với `details.unsupportedSources`.

### 3.4 `dawproject.test.js` (7) — REQ-DAWP-*
Ví dụ Bitwig chính thức (149 BPM, 1 track nốt, 9 nốt, vel 100, nốt dài 1440/2400); ZIP + metadata + inventory + thiếu `project.xml`; clip lặp; `playStart`; `timeUnit=seconds`; mute / thiếu tempo / override; gốc sai.

### 3.5 `binary.test.js` (7) — REQ-BIN-*
Schema demo parse đúng + `matchSchema`; không tempo → fallback + cảnh báo; file cụt / magic sai / version sai; `count` 0xFFFFFFFF; schema độc (version, tên cấm, kiểu lạ, biểu thức `process.exit`, `constructor…`, `eval`, `__proto__`, thiếu `ast`); `maxNotes` và mảng không tiến con trỏ; công cụ cấu trúc (switch/when/offset/peek).

### 3.6 `detect-bundle.test.js` (4) — REQ-CORE-02, REQ-CORE-05
`detectFormat` theo đuôi + magic + hướng dẫn flp/bwproject; `probeProject` (cần `.mid` ngoài / schema);  `parseProject` điều phối + schema đăng ký; **bundle** dựng xong chạy và `deepEqual` với bản nguồn trên Demo.als.

### 3.7 `i18n.test.js` (5) — REQ-I18N-*
`t()`: nội suy, số nhiều (`one`/`other`/`=0`, định dạng số theo locale), dự phòng `vi-VN → vi → en → khoá`, `onMissing`; `matchLocale`/`localeChain`/`dirOf` (rtl); `parseMessage`/`describeMessage` bắt chuỗi sai (ngoặc, thiếu `other`); **danh mục thật của repo qua `check-i18n`** (đủ khoá, tham số khớp, khoá dùng trong mã có mặt, các mã lỗi chính có bản dịch); `check-i18n` bắt đúng các lỗi hay gặp của cộng tác viên (sai tên tham số, thiếu `other`, thiếu/thừa khoá, chuỗi rỗng, `partial` được thiếu khoá, locale chưa vào `index.json`, nhánh số nhiều không tồn tại trong ngôn ngữ).
