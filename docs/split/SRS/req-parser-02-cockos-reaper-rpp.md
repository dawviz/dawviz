---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-02: Cockos Reaper (`.rpp`)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-02: Cockos Reaper (`.rpp`)"
chunk: req-parser-02-cockos-reaper-rpp.md
source_lines: 284-297
source_sha1: d7467a1f28
ids: [ERR_NO_NOTES, REQ-PARSER-02, REQ-PARSER-04, REQ-UI-08, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_ENVELOPE_SHAPE_APPROX, WARN_RPP_EXTERNAL_MIDI, WARN_RPP_LOOPED_ITEMS, WARN_RPP_MUTED_ITEMS, WARN_RPP_SRC_UNIT, WARN_TEMPO_SHAPE]
---
#### REQ-PARSER-02: Cockos Reaper (`.rpp`)
**[ĐÃ KIỂM]** trên 2 dự án Reaper 7.85 có MIDI nhúng (một track 3,147 nốt; 107 item, 96 nguồn MIDI, nhiều take/loop/pooled/SOFFS cho 7,497 nốt, khớp đối chứng độc lập) và 5 template. Reaper **nhúng MIDI trực tiếp** trong `<SOURCE MIDI>` kể cả khi import `.mid` nhiều track và chọn mở rộng thành nhiều track; không tham chiếu `.mid` ngoài trong các mẫu này.

* Tokenizer duyệt từng dòng, khối lồng `<TAG ... >`; giữ thứ tự dòng/khối con để chia take.
* Tempo: `TEMPO bpm num denom`; envelope `TEMPOENV*` (`ACT`, `PT time bpm shape [sig]`): shape 1 = giữ, khác = dốc tuyến tính (đường cong xấp xỉ, `WARN_TEMPO_SHAPE`); nhịp đóng gói trong trường thứ 5 (`num = v & 0xFFFF`, `den = v >>> 16`) **[VERIFY]**.
* Mỗi `<TRACK>`: tên từ `NAME`; `MUTESOLO` ≠ 0 coi là tắt tiếng. Item `MUTE 1` bị bỏ (`WARN_RPP_MUTED_ITEMS`).
* **Nhiều take**: dùng take `TAKE SEL`, không có thì take đầu.
* Item có `<SOURCE MIDI>`: `POSITION` và `LENGTH` tính bằng **giây**, quy đổi sang tick qua TempoMap; `LOOP 1` nhân bản nguồn theo độ dài nguồn đến hết item (`WARN_RPP_LOOPED_ITEMS`); `SOFFS` coi là quarter-note **[VERIFY: đối chứng độc lập dùng cùng giả định]**; `IGNTEMPO 1 <bpm> <num> <den>` (bỏ qua tempo dự án, nguồn chạy theo BPM riêng) dùng thời gian tuyệt đối theo giây **[ĐÃ KIỂM bằng dự án thật BigProject4b: nhịp 12/8, nguồn 180 BPM → 110,6 s; khớp thước kẻ và mật độ nốt trong ảnh Reaper; chưa có đối chứng độc lập từng nốt]**; `POOLEDEVTS` (cùng GUID) dùng lại sự kiện của nguồn đã có.
* PPQ lấy **động** từ `HASDATA 1 <ppq> QN` (480, 960, 1920… do Preferences của Reaper; **[ĐÃ KIỂM]** BigProject4 dùng 480, BigProjectDemo2 dùng 960, cùng bản nhạc cho cùng 3,147 nốt); quy đổi `tick * 960 / ppq`. **Guard clause**: đơn vị khác `QN` (hoặc PPQ không phải số nguyên 1–65535) thì không đoán: bỏ nguồn MIDI đó, báo `WARN_RPP_SRC_UNIT` kèm hướng dẫn lưu lại dự án bằng Reaper bản mới, và `ERR_NO_NOTES` nêu rõ lý do nếu không còn nốt nào.
* Sự kiện `E <delta> <status> <d1> <d2>` (hex, `e` cũng hợp lệ; `Em` = sự kiện tắt tiếng bị bỏ). `delta` cộng dồn. Ghép cặp như REQ-PARSER-04. Bỏ CC, SysEx.
* **Nguồn `.mid` ngoài** (`FILE`): đọc qua `options.files` hoặc `resolveFile(path, base)`; thiếu file thì `WARN_RPP_EXTERNAL_MIDI` và, nếu không còn nốt nào, `ERR_NO_NOTES` kèm danh sách file thiếu. **[ĐÃ KIỂM]** bằng dự án thật `BigProject3.rpp` (Reaper 7.85, `FILE "Media\Oboe MIDI 001.mid" QN`) và file `.mid` kèm theo: 3,147 nốt, trùng đọc trực tiếp `.mid`. Tên file đối chiếu không phân biệt hoa/thường và coi khoảng trắng ≡ gạch dưới. `listExternalMidi`/`probeProject` cho biết trước tên file cần để giao diện chỉ hiện ô nạp `.mid` khi dự án thật sự tham chiếu (REQ-UI-08).
* `PROJOFFS ≠ 0` chưa áp dụng (cảnh báo).
* **Envelope tự động hoá** (v0.3): envelope **track** `VOLENV2` (âm lượng, ưu tiên hơn `VOLENV`), `PANENV*`, `MUTEENV` được đọc thành `track.automation` (điểm `PT` giây → tick qua TempoMap, hình dạng 0–5, tension bezier) cùng mức fader tĩnh `VOLPAN` → `track.mix`. **[ĐÃ KIỂM]** BigProject4b so với số đọc trên giao diện Reaper: 2,920 s → −25,3 dB (parser −25,36), ≈1,98 s → −15,3 dB (−15,04); nội suy volume trong không gian fader `gain^0,25` (**[VERIFY]**, suy từ 2 điểm; nội suy tuyến tính theo biên độ sai tới 2,6 dB). Pan và mute lưu **giá trị thô**: chiều của pan và nghĩa giá trị mute chưa kiểm **[VERIFY]**. Envelope trong item/take, trước FX trùng loại, `WIDTHENV*` chưa đọc, báo `WARN_RPP_ENVELOPES_IGNORED` (chỉ đếm envelope không đọc được), `WARN_RPP_ENVELOPE_SHAPE_APPROX`; đoạn cong báo `WARN_RPP_ENVELOPE_SHAPE_APPROX`. Tempo envelope đọc riêng; `TEMPOENVEX` không có điểm thì không ảnh hưởng.
