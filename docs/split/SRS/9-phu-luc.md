---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "9. PHỤ LỤC"
path: "9. PHỤ LỤC"
chunk: 9-phu-luc.md
source_lines: 920-978
source_sha1: 6c3a823de0
ids: [D-20, D-22, ERR_ARCHIVE_INVALID, ERR_ARCHIVE_TOO_LARGE, ERR_AST_INVALID, ERR_AST_TOO_LARGE, ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, ERR_EXPORT_FAILED, ERR_FILE_TOO_LARGE, ERR_NO_NOTES, ERR_NO_SUPPORTED_ENCODER, ERR_NO_SUPPORTED_ENV, ERR_PARSER_TIMEOUT, ERR_PRESET_INVALID, ERR_SCHEMA_INVALID, ERR_SCHEMA_NEWER, ERR_UNSUPPORTED_FORMAT, KPI-01, NFR-ACC-02, NFR-COMP-01, OI-02, OI-08, REQ-AST-01, REQ-CAP-01, REQ-EXPORT-07, REQ-GRAPHICS-04, REQ-PARSER-06, REQ-STORAGE-04, REQ-UI-01, REQ-UI-06, REQ-UI-07, REQ-UI-08, SOI-12, WARN_ALP_MULTIPLE_ALS, WARN_CLIP_SKIPPED, WARN_DAWPROJECT_NO_ARRANGEMENT, WARN_DAWPROJECT_NO_METADATA, WARN_DAWPROJECT_NO_NOTE_TRACKS, WARN_MIDI_HANGING_NOTES, WARN_MIDI_TRUNCATED, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_EXTERNAL_MIDI, WARN_RPP_HANGING_NOTES, WARN_RPP_LOOPED_ITEMS, WARN_RPP_LOOP_UNKNOWN_LEN, WARN_RPP_MUTED_ITEMS, WARN_RPP_PROJOFFS, WARN_RPP_SOFFS, WARN_RPP_SRC_UNIT, WARN_SESSION_CLIPS_IGNORED, WARN_TEMPO_AUTOMATION, WARN_TEMPO_AUTOMATION_SECONDS, WARN_TEMPO_FALLBACK, WARN_TEMPO_MIDI_DEFAULT, WARN_TEMPO_OVERRIDDEN, WARN_TEMPO_RAMP, WARN_TEMPO_SHAPE, WARN_TIMESIG_DEFAULT, WARN_TIME_UNIT_MIXED, WARN_ZERO_LENGTH_NOTES]
---
## 9. PHỤ LỤC

### Phụ lục A: Mã lỗi

| Mã | Điều kiện | Gợi ý cho người dùng |
| :--- | :--- | :--- |
| `ERR_FILE_TOO_LARGE` | File vượt giới hạn kích thước | Cắt/đơn giản hóa dự án hoặc xuất MIDI. |
| `ERR_ARCHIVE_TOO_LARGE` | Giải nén vượt 300 MB, tỉ lệ > 1:30 hoặc quá nhiều entry ZIP | Kiểm tra file; có thể là file lỗi hoặc độc hại. |
| `ERR_ARCHIVE_INVALID` | ZIP hỏng hoặc có đường dẫn không hợp lệ | Xuất lại file từ DAW/ứng dụng. |
| `ERR_PARSER_TIMEOUT` | Phân tích quá 10 giây | Thử file nhỏ hơn hoặc xuất MIDI. |
| `ERR_UNSUPPORTED_FORMAT` | Định dạng *chưa hỗ trợ* (`.flp`, `.bwproject`, MIDI SMPTE), nội dung không khớp đuôi file hoặc không khớp magic của schema | Làm theo hướng dẫn trong màn hình nhập file. |
| `ERR_AST_INVALID` | Dữ liệu sau phân tích không hợp lệ | Báo lỗi kèm vị trí; thử xuất MIDI. |
| `ERR_AST_TOO_LARGE` | Quá 500,000 nốt | Tách đoạn hoặc bỏ bớt track. |
| `ERR_NO_NOTES` | Không có nốt nào sau khi lọc (kèm lý do nếu có: chỉ có clip Session View; chỉ tham chiếu `.mid` ngoài chưa nạp) | Bật hiển thị track ẩn, chọn `.als` khác trong gói, nạp `.mid` đi kèm hoặc chọn file khác. |
| `ERR_SCHEMA_INVALID` | Schema nhị phân sai hoặc thiếu mục `ast` | Sửa schema theo `schemas/README.md`. |
| `ERR_NO_SUPPORTED_ENV` | Môi trường thiếu `DecompressionStream` | Dùng Chrome/Edge bản mới. |
| `ERR_AUDIO_DECODE` | Trình duyệt không giải mã được audio | Đổi sang `.wav`/`.mp3`; vẫn có thể tiếp tục không audio. |
| `ERR_AUDIO_TOO_LONG` | Audio dài hơn giới hạn giải mã | Cắt ngắn audio. |
| `ERR_PRESET_INVALID` | Preset hỏng hoặc sai lược đồ | Dùng preset khác. |
| `ERR_SCHEMA_NEWER` | Dữ liệu từ phiên bản mới hơn | Cập nhật ứng dụng. |
| `ERR_NO_SUPPORTED_ENCODER` | Không có bộ mã hóa phù hợp (Tier 4) | Dùng Chrome/Edge bản mới trên Windows/macOS. |
| `ERR_EXPORT_FAILED` | Export Worker lỗi bất ngờ | Thử lại; hạ độ phân giải hoặc dùng Export Range. |

### Phụ lục A2: Mã cảnh báo của Parser Library

`WARN_TEMPO_FALLBACK`, `WARN_TEMPO_MIDI_DEFAULT`, `WARN_TEMPO_OVERRIDDEN`, `WARN_TEMPO_RAMP`, `WARN_TEMPO_SHAPE`, `WARN_TEMPO_AUTOMATION`, `WARN_TIMESIG_DEFAULT`, `WARN_ZERO_LENGTH_NOTES`, `WARN_SESSION_CLIPS_IGNORED`, `WARN_CLIP_SKIPPED`, `WARN_ALP_MULTIPLE_ALS`, `WARN_MIDI_HANGING_NOTES`, `WARN_MIDI_TRUNCATED`, `WARN_RPP_EXTERNAL_MIDI`, `WARN_RPP_LOOPED_ITEMS`, `WARN_RPP_MUTED_ITEMS`, `WARN_RPP_SOFFS`, `WARN_RPP_PROJOFFS`, `WARN_RPP_HANGING_NOTES`, `WARN_DAWPROJECT_NO_METADATA`, `WARN_DAWPROJECT_NO_NOTE_TRACKS`, `WARN_TIME_UNIT_MIXED`, `WARN_DAWPROJECT_NO_ARRANGEMENT`, `WARN_RPP_LOOP_UNKNOWN_LEN`, `WARN_RPP_SRC_UNIT`, `WARN_TEMPO_AUTOMATION_SECONDS`, `WARN_RPP_ENVELOPES_IGNORED`. Mỗi mã có khoá dịch `warn.<mã>` trong `locales/*.json` (REQ-I18N-03). Danh sách đầy đủ và điều kiện: `docs/parser/PARSER-SRS.md` mục 4.

### Phụ lục B: Ghi chú rà soát

**Đã sửa so với bản nháp trước:**

1. **Kiến trúc:** thêm Render Core dùng chung, Export Worker, tách Document Store khỏi Derived Data; đưa phân tích hợp âm/audio vào Worker (mục 2.4).
2. **Công thức Ableton:** bản nháp nhân `960 / PPQ_native` trong khi đơn vị `.als` đã là beat; sửa thành nhân trực tiếp 960 và làm tròn.
3. **NFR-ACC-02:** bản nháp ghi "chính xác 100%" nhưng nghiệm thu cho phép ≤ 1 tick; thống nhất ≤ 1 tick theo KPI-01.
4. **Widget Text:** mục phân lớp nhắc "Text" nhưng không nằm trong 7 widget; thay bằng Track Info.
5. **NFR-COMP-01:** bản nháp coi Linux là nền tảng kiểm thử chính, mâu thuẫn BRD 4.1 và R-06; đổi thành best-effort.
6. **Ví dụ Preset:** bỏ liên kết Markdown lẫn trong URL `$schema`; thêm kiểm tra schema, danh sách `type`, giới hạn ảnh nhúng.
7. **CSP:** bổ sung `img-src`, `media-src`, `font-src`, `connect-src`, cấm font CDN.
8. **Thiếu yêu cầu được BRD/SRS tham chiếu:** bổ sung REQ-AST-01, REQ-GRAPHICS-04/05, REQ-CAP-01, REQ-UI-01 đến 05, REQ-STORAGE-04, REQ-EXPORT-07.
9. **Chuỗi thời gian xuất:** thêm công thức số khung, khung khóa mỗi 2 giây, bảng độ phân giải, bitrate mặc định.
10. **Bảo mật đầu vào:** thêm chống zip-slip, giới hạn độ sâu, số nốt, kích thước ảnh nhúng.

**BRD không bắt buộc sửa**, chỉ nên bổ sung D-20 đến D-22 vào mục 7 và làm rõ mục 4.1 rằng Linux là best-effort. Các giá trị **[PROVISIONAL]** mới thêm ở SRS (giới hạn nốt, thời lượng audio, bitrate, ngưỡng đoạn hợp âm) cần được xem xét cùng OI-02.

**Ghi chú rà soát v0.3**

Thay đổi so với v0.2 và nguồn gốc:

1. **`.alp` không phải ZIP** (file thật): header `pl-a` + các `.als` gzip + manifest JSON; thêm REQ-PARSER-06, REQ-UI-07.
2. **`.als`**: nhận cả XML thuần và Gzip; công thức clip bổ sung `StartRelative`, cắt nốt, bỏ nốt tắt; đường dẫn tempo cho `MainTrack` (Live 12) và `AutomationEnvelopes`.
3. **`.rpp`**: Reaper nhúng MIDI kể cả khi import nhiều track; bổ sung take, loop, pooled, mute, `.mid` ngoài.
4. **Tempo**: bỏ fallback 120 BPM ngầm; cờ `tempoSource`; nhập nhiều mốc (Spike 2).
5. **Xuất**: Silent AAC mặc định tắt, kích thước/tỉ lệ tuỳ ý, tên file chốt trước (Spike 1).
6. **Widget**: thêm Progress Bar (ghi chú cuối v0.2 và Spike 2).
7. **Ngôn từ**: định dạng nhị phân gốc (`.flp`, `.bwproject`) ghi là *chưa hỗ trợ*.
8. **Đầu vào theo ngữ cảnh**: ô nạp `.mid` ngoài và schema JSON chỉ hiện khi cần, có cảnh báo khi thiếu (REQ-UI-08); mốc BPM nhập theo kiểu đồng hồ DAW (REQ-UI-06).
9. **Đa ngôn ngữ** xây ngay từ đầu (REQ-I18N-01 đến 08); **dấu nhịp** trong ghi đè tempo; **đề xuất widget bổ sung** (mục 3.4b).
10. **Trạng thái spike:** Spike 1 (xuất video) và Spike 2 (parser và AST) hoàn thành. Phần còn lại là việc cần mẫu thật hoặc chưa làm, nêu ở mục 9 và Phụ lục B, không chặn giai đoạn xây ứng dụng chính.
11. **Chưa làm**: parser XML/JSON khai báo (SOI-12), Session View, schema `.bwproject` (OI-08).
