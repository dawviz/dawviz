---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.5 Ableton (.als / .alp)"
path: "3. Yêu cầu chức năng > 3.5 Ableton (.als / .alp)"
chunk: 3-5-ableton-als-alp.md
source_lines: 52-76
source_sha1: dd04828ada
ids: [ERR_ARCHIVE_INVALID, ERR_AST_INVALID, ERR_NO_NOTES, REQ-ALP-01, REQ-ALP-02, REQ-ALP-03, REQ-ALP-04, REQ-ALS-01, REQ-ALS-02, REQ-ALS-03, REQ-ALS-04, REQ-ALS-05, REQ-DEMO-01, REQ-DEMO-02, REQ-DEMO-03, REQ-DEMO-04, REQ-TEMPO-03, REQ-TEMPO-04, REQ-TEMPO-05, WARN_ALP_MULTIPLE_ALS, WARN_SESSION_CLIPS_IGNORED]
---
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
