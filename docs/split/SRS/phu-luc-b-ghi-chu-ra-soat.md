---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "Phụ lục B: Ghi chú rà soát"
path: "9. PHỤ LỤC > Phụ lục B: Ghi chú rà soát"
chunk: phu-luc-b-ghi-chu-ra-soat.md
source_lines: 1130-1161
source_sha1: c62aee35b6
ids: [D-20, D-22, KPI-01, NFR-ACC-02, NFR-COMP-01, OI-02, OI-08, REQ-AST-01, REQ-CAP-01, REQ-EXPORT-07, REQ-GRAPHICS-04, REQ-PARSER-06, REQ-STORAGE-04, REQ-UI-01, REQ-UI-06, REQ-UI-07, REQ-UI-08, SOI-12]
---
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
