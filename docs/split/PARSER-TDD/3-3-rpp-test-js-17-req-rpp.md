---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.3 `rpp.test.js` (17) — REQ-RPP-*"
path: "3. Danh mục test (77 test, 8 file) > 3.3 `rpp.test.js` (17) — REQ-RPP-*"
chunk: 3-3-rpp-test-js-17-req-rpp.md
source_lines: 47-50
source_sha1: b369a49402
ids: [ERR_NO_NOTES, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_ENVELOPE_SHAPE_APPROX, WARN_RPP_SRC_UNIT]
---
### 3.3 `rpp.test.js` (17) — REQ-RPP-*
Inspect 5 template thật (tempo 180, 39 điểm envelope…); `youdreamarked` thiếu `.mid` ngoài → `ERR_NO_NOTES` liệt kê file, cấp `options.files` → đọc được; MIDI nhúng (delta, giây→tick); LOOP nhân bản; TAKE SEL; item MUTE/track mute; POOLEDEVTS; tempo envelope giữ + đổi (5 beat = 4800 tick); không tempo/override; gốc sai; **dự án Reaper thật `BigProjectDemo2.rpp`** (Reaper 7.85, 1 item pooled): 1 track `Oboe`, 3147 nốt = số Note-On thô trong file.
**BigProject3 + Oboe_MIDI_001.mid thật**: thiếu `.mid` ngoài → `ERR_NO_NOTES` (`details.missingFiles`), nạp `Oboe_MIDI_001.mid` (tên đã đổi khoảng trắng→gạch dưới) → 3147 nốt = đọc thẳng `.mid`, cùng thời lượng. **IGNTEMPO** (mẫu từ tài liệu Reaper): `1 116 4 4` → giây không đổi khi đổi tempo dự án (6,207 s; 9,828 s; 13,966 s); `0` → theo tempo dự án. Trang tài liệu Reaper dán nguyên (không phải `.rpp`) bị từ chối gọn. **BigProject4b thật**: `TEMPO 120 12 8` → nhịp 12/8; `IGNTEMPO 1 180 4 4` → thời lượng 110,6 s và nốt thứ hai lúc 1/6 s; tempo envelope rỗng (0 điểm); envelope âm lượng được đọc vào `track.automation` (3 điểm; −25,3 dB tại 2,920 s ±0,3, −15,3 dB tại ≈1,98 s ±0,5 so với số đọc từ giao diện Reaper), `track.mix`, `WARN_RPP_ENVELOPE_SHAPE_APPROX`; synthetic: `ACT 0` không đọc, điểm trùng vị trí, pan/mute thô, `WARN_RPP_ENVELOPES_IGNORED` đếm đúng (item, trùng loại, `WIDTHENV`). **HASDATA**: BigProject4 thật (`HASDATA 1 480 QN`) → 3147 nốt, cùng thời lượng với bản 960; PPQ 480/960/1920 quy đổi đúng; thiếu đơn vị coi là QN; đơn vị lạ (`SECONDS`) → bỏ nguồn + `WARN_RPP_SRC_UNIT`, còn nguồn QN khác vẫn đọc; chỉ có nguồn lạ hoặc PPQ=0 → `ERR_NO_NOTES` với `details.unsupportedSources`.
