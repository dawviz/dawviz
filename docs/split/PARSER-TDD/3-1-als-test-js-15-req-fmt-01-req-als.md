---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.1 `als.test.js` (15) — REQ-FMT-01, REQ-ALS-*"
path: "3. Danh mục test (77 test, 8 file) > 3.1 `als.test.js` (15) — REQ-FMT-01, REQ-ALS-*"
chunk: 3-1-als-test-js-15-req-fmt-01-req-als.md
source_lines: 26-43
source_sha1: b369a49402
ids: [ERR_ARCHIVE_TOO_LARGE, ERR_AST_INVALID, ERR_NO_NOTES, ERR_UNSUPPORTED_FORMAT, REQ-FMT-01, WARN_TEMPO_RAMP]
---
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
