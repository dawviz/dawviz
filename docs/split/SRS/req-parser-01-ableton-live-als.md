---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-01: Ableton Live (`.als`)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-01: Ableton Live (`.als`)"
chunk: req-parser-01-ableton-live-als.md
source_lines: 266-286
source_sha1: ae88fa5f8b
ids: [ERR_NO_NOTES, REQ-PARSER-00, REQ-PARSER-01, REQ-PARSER-07, SOI-06, WARN_SESSION_CLIPS_IGNORED, WARN_TEMPO_RAMP]
---
#### REQ-PARSER-01: Ableton Live (`.als`)
Đã đối chiếu bằng file thật: Live 9.1 (`MinorVersion 9.0_305`, XML thuần và trong `.alp`) và Live 12.4.16 (Gzip) **[ĐÃ KIỂM]**; các mục còn **[VERIFY]** được nêu riêng bên dưới.

* **Container**: nhận XML thuần **hoặc** Gzip bằng magic bytes (`1F 8B` hoặc văn bản XML), không dựa vào đuôi file. Giải nén bằng `DecompressionStream` (REQ-PARSER-00). Phân tích XML bằng bộ quét tự cài, chạy trong Worker, bỏ qua cả cây con không cần (`Devices`, `AudioTrack`, `ClipSlotList`, ...).
* **Tempo**: `Ableton > LiveSet > MasterTrack` hoặc `MainTrack` (Live 12) `> DeviceChain > Mixer > Tempo`; giá trị đầu từ sự kiện `FloatEvent` có `Time < 0`, nếu không có thì `Manual@Value`; thay đổi tempo từ `ArrangerAutomation/Events` (Live 9) hoặc `AutomationEnvelopes` tra theo `AutomationTarget@Id` (Live 10+). Đoạn dốc tempo nội suy tuyến tính theo beat bằng các bước nhỏ (`WARN_TEMPO_RAMP`) **[VERIFY SOI-06]**. Không tìm thấy tempo thì **không** tự gán 120 BPM: xem REQ-PARSER-07.
* **Nhịp**: `TimeSignature` là số enum: `numerator = (v mod 99) + 1`, `denominator = 2^floor(v/99)` (201 = 4/4) **[VERIFY: suy từ một mẫu; cần mẫu nhịp khác 4/4]**. Không thấy thì 4/4 kèm cảnh báo.
* **Track**: `Ableton > LiveSet > Tracks > MidiTrack`; tên từ `Name/EffectiveName`. Track tắt tiếng khi `Speaker/Manual = false`; track này vẫn nằm trong AST với `isVisible = false` trừ khi người dùng bật hiển thị track ẩn.
* Chỉ đọc clip trong **Arrangement** (`ArrangerAutomation > Events > MidiClip`). Clip Session View bị bỏ qua, được đếm và báo bằng cảnh báo `WARN_SESSION_CLIPS_IGNORED`; nếu Arrangement không có nốt mà Session có clip thì `ERR_NO_NOTES` nêu rõ lý do. Đơn vị thời gian của `.als` là beat. Nốt `IsEnabled="false"` bị bỏ qua.
* **Mô hình phát clip** (thay công thức v0.2; v0.2 thiếu `StartRelative` và không mô tả cắt nốt):

```text
điểm bắt đầu phát trong clip = Loop.LoopStart + Loop.StartRelative
lượt phát k: gốc tick = (passBase + (Note.Time - passFrom)) * 960
            lượt 1: passBase = Clip.CurrentStart, passFrom = LoopStart + StartRelative
            lượt kế (chỉ khi Loop.LoopOn): passBase += LoopEnd - passFrom, passFrom = LoopStart
nốt chỉ được lấy khi passFrom <= Note.Time < LoopEnd; bỏ nếu start >= CurrentEnd; end = min(start + Duration, hết lượt, CurrentEnd)
```

  Với clip không lặp và `StartRelative = 0` công thức rút về `(CurrentStart + Time - LoopStart) * 960` như v0.2. **[ĐÃ KIỂM]** trên Live 12.4 (9605 nốt, đối chứng độc lập từng nốt); nhánh lặp và `StartRelative ≠ 0` mới kiểm bằng dữ liệu tổng hợp **[VERIFY]**.
* Nốt từ `KeyTracks > KeyTrack`: `MidiKey`, `MidiNoteEvent@Time/Duration/Velocity`.
