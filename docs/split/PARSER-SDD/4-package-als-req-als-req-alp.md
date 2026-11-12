---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "4. Package `als` (REQ-ALS-*, REQ-ALP-*)"
path: "4. Package `als` (REQ-ALS-*, REQ-ALP-*)"
chunk: 4-package-als-req-als-req-alp.md
source_lines: 65-77
source_sha1: dbb03a72c8
ids: [ERR_UNSUPPORTED_FORMAT]
---
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
