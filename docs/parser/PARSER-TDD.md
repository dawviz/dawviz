# TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer

> Phiên bản tài liệu: 0.1 · Đối chiếu `PARSER-SRS.md` (REQ-…) và `PARSER-SDD.md`. Bộ test nằm ở `test/`.

## 1. Chiến lược

| Tầng | Mục tiêu | Cách làm |
|---|---|---|
| Đơn vị / tích hợp theo package | Đúng nghiệp vụ từng định dạng | `node:test` + dữ liệu tự dựng (builder MIDI/ZIP/XML trong `test/helpers.mjs`) |
| Đối chứng độc lập | Bắt lỗi công thức | Viết lại phép tính bằng cách khác (ví dụ oracle clip Ableton) và so từng nốt trên **file thật** |
| Kiểm chứng file thật | Xác nhận giả định [VERIFY] | `test/fixtures/` (Demo.als, 5 template Reaper, Bitwig `project.xml` mẫu) |
| An toàn | Chống DoS/XXE/zip-slip/schema độc | Test âm tính cố ý |
| Bundle | Bản phát hành chạy được như bản nguồn | Dựng bundle rồi so kết quả |
| Trình duyệt | Worker + bundle + giao diện | Playwright thủ công (xem §6) |

Chạy: `npm test` (= `node --test test/*.test.js`). Không dùng `node --test test/` vì sẽ nhặt cả `helpers.mjs`.

## 2. Công cụ dùng chung (`test/helpers.mjs`)
- `smf({format,ppq,tracks})`, `tempoEv`, `sigEv`, `nameEv`, `on`, `off`: dựng file MIDI.
- `zip(entries,{store})`: dựng ZIP (deflate hoặc lưu thẳng) có CRC đúng; `gz`: gzip.
- `assertAstInvariants(assert, ast)`: PPQ 960; tempoMap tăng nghiêm ngặt; tick nguyên, `durationTick ≥ 1`, `endTick = start + duration`; pitch 0..127; velocity 1..127; thời gian giây hữu hạn và tăng; nốt sắp theo `startTick`.
- `fx(name)`: đọc fixture.

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

## 4. Ma trận truy vết (rút gọn)
| Yêu cầu | Test |
|---|---|
| REQ-LIM-02..05 | als (bom, entity), midi-alp (bom ALP, zip-slip), binary (maxNotes) |
| REQ-TEMPO-02..03 | als, midi-alp, rpp, dawproject, binary — mỗi file có ca fallback/override |
| REQ-AST-02 | `assertAstInvariants` trong als, midi-alp, rpp, binary, dawproject |
| REQ-ALS-02 | als: oracle, clip lặp, clip không lặp |
| REQ-RPP-04 | rpp: LOOP, POOLEDEVTS |
| REQ-BIN-03 | binary: schema độc, biểu thức cấm |
| REQ-CMP-01 | midi-alp: so sánh 960 vs 96 |

## 5. Khoảng trống kiểm thử (cần dữ liệu thật, xem SRS §6)
1. `.rpp`: MIDI nhúng, take, loop, pooled, SOFFS đã được kiểm bằng 2 dự án thật (đã đối chiếu oracle Python độc lập: `BigProjectDemo.rpp` 13 MB, 107 item, 96 nguồn MIDI → 7497 nốt khớp tuyệt đối; file này quá lớn nên không đưa vào repo). `.mid` ngoài thật đã kiểm (BigProject3.rpp + Oboe_MIDI_001.mid → 3147 nốt, khớp đọc trực tiếp `.mid`). Còn thiếu đối chứng độc lập cho `IGNTEMPO 1` (đã có dự án thật) và mẫu envelope tempo cong (`HASDATA` ≠ QN xử lý bằng guard clause).
2. `.dawproject` thật: tempo/nhịp automation, đơn vị giây, clip lồng nhiều tầng.
3. Clip `StartRelative ≠ 0`; nhịp ≠ 4/4; tempo automation thật (công thức enum nhịp suy từ 1 mẫu).
4. KPI-01 end-to-end (dự án + MIDI xuất từ chính DAW) — hạ tầng sẵn sàng (`--ref`, trang demo).
5. Hiệu năng/bộ nhớ với file lớn (> 50 MB) và trình duyệt di động.
6. ZIP64, mã hóa, phương thức nén lạ — chỉ kiểm mã lỗi theo thiết kế, chưa có file mẫu.

## 6. Kiểm thử thủ công trình duyệt
1. `node scripts/bundle.mjs`; `python3 -m http.server` ở thư mục gốc; mở `/apps/parser-lab/`.
2. Chọn `Demo.als` → "Phân tích": kỳ vọng 11 track, 9605 nốt, 167 BPM, ~0,6 s.
3. Nhập BPM 100 → "Phân tích": kỳ vọng `tempo: user`.
4. "Liệt kê cấu trúc": dòng đầu `/Ableton ×1 …`.
5. "Tự kiểm tra MIDI tổng hợp": kỳ vọng ĐẠT 6/6.
6. Chọn `.RPP` chỉ có audio: kỳ vọng `ERR_NO_NOTES`. Console không có lỗi.

## 7. Quy ước viết test mới
- Mỗi hành vi mới có ít nhất: ca đúng, ca biên, ca lỗi có `code`.
- Dùng oracle độc lập khi có công thức; không copy công thức từ code.
- Với định dạng chưa có file thật, dữ liệu tự dựng phải ghi rõ giả định ở comment và gắn nhãn [VERIFY] trong SRS.
- Khi thêm cảnh báo/lỗi: thêm vào SRS §4 và có test khẳng định mã.
- Cập nhật số test ở §3 khi thay đổi.

## 8. Tiêu chí chấp nhận
`npm test` xanh (66/66); bundle `deepEqual` với nguồn; demo trình duyệt chạy đủ các bước §6 không lỗi console; mục §5 còn lại được liệt kê công khai trong báo cáo.
