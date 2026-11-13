---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-04: Standard MIDI File (`.mid`, format 0/1)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-04: Standard MIDI File (`.mid`, format 0/1)"
chunk: req-parser-04-standard-midi-file-mid-format-0-1.md
source_lines: 314-322
source_sha1: 3d043a49c8
ids: [ERR_UNSUPPORTED_FORMAT, REQ-PARSER-04, REQ-PARSER-07, WARN_MIDI_TRUNCATED, WARN_TEMPO_MIDI_DEFAULT]
---
#### REQ-PARSER-04: Standard MIDI File (`.mid`, format 0/1)
* Đọc `MThd`: `format`, `track_count`, `division`. `division` dạng SMPTE thì báo `ERR_UNSUPPORTED_FORMAT`.
* Mỗi `MTrk`: giải mã Variable-Length Quantity; hỗ trợ Running Status.
* Meta-event: `0x51` Set Tempo (`BPM = 60,000,000 / µs mỗi quarter note`), `0x58` Time Signature, `0x03` Track Name.
* Ghép cặp theo khóa `(channel << 8) | pitch`; Note-On velocity 0 xử lý như Note-Off. Khi cùng khóa có nhiều Note-On chồng, ghép theo FIFO.
* Phục hồi nốt treo: thiếu Note-Off thì kéo dài đến cuối track.
* Format 1: gộp mọi track vào một TempoMap lấy từ track tempo (thường track đầu). Format 0: tách track theo kênh MIDI (kênh 10 gắn nhãn drums).
* File không có Set Tempo: theo chuẩn SMF dùng 120 BPM nhưng **gắn cờ** `tempoSource = 'midi-default'` kèm `WARN_TEMPO_MIDI_DEFAULT` để người dùng ghi đè (REQ-PARSER-07). File cụt đọc phần hợp lệ (`WARN_MIDI_TRUNCATED`).
