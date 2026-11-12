---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.8 MIDI"
path: "3. Yêu cầu chức năng > 3.8 MIDI"
chunk: 3-8-midi.md
source_lines: 96-100
source_sha1: dd04828ada
ids: [ERR_UNSUPPORTED_FORMAT, REQ-MIDI-01, REQ-MIDI-02, REQ-MIDI-03, WARN_MIDI_HANGING_NOTES, WARN_MIDI_TRUNCATED]
---
### 3.8 MIDI
- **REQ-MIDI-01** SMF format 0/1/2, running status, Note-On vận tốc 0 = Note-Off, ghép cặp FIFO theo (kênh, pitch).
- **REQ-MIDI-02** Format 0 tách track theo kênh (kênh 10 gắn nhãn drums). Nốt treo kéo đến cuối track + `WARN_MIDI_HANGING_NOTES`; file cụt đọc phần hợp lệ + `WARN_MIDI_TRUNCATED`. SMPTE division → `ERR_UNSUPPORTED_FORMAT`.
- **REQ-MIDI-03** Tick quy đổi từ PPQ nguồn sang 960 và làm tròn.
