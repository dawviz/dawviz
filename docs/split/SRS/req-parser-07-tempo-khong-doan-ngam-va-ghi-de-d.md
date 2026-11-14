---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-07: Tempo không đoán ngầm và ghi đè (D-24, D-29)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-07: Tempo không đoán ngầm và ghi đè (D-24, D-29)"
chunk: req-parser-07-tempo-khong-doan-ngam-va-ghi-de-d.md
source_lines: 341-346
source_sha1: 46410b6da3
ids: [D-24, D-29, ERR_AST_INVALID, OI-12, REQ-PARSER-07, WARN_TEMPO_FALLBACK, WARN_TEMPO_OVERRIDDEN]
---
#### REQ-PARSER-07: Tempo không đoán ngầm và ghi đè (D-24, D-29)
* Mọi parser gắn `meta.tempoSource`: `file` (đọc từ file), `midi-default` (SMF không có tempo), `fallback` (không có tempo; dùng 120 BPM kèm `WARN_TEMPO_FALLBACK`), `user` (người dùng ghi đè). Giao diện phải nêu rõ khi nguồn khác `file` và mời người dùng nhập tempo.
* `tempoOverride`: số BPM hoặc mảng điểm `{bpm, num?, den?}` đặt vị trí bằng **một** trong `tick`, `beat`, `timeSeconds`. `timeSeconds` được đổi tuần tự: tick của mốc n = tick của mốc n−1 + (giây giữa hai mốc) × BPM(n−1) / 60 × 960. Điểm đầu không ở 0 thì thêm điểm 0 cùng BPM; vị trí trùng thì điểm sau thắng; không trộn `timeSeconds` với `tick/beat`; BPM trong 10–1000, sai thì `ERR_AST_INVALID`.
* **Dấu nhịp trong ghi đè:** mỗi mốc có thể kèm dấu nhịp `4/4`, `3/4`, `6/8`, `12/8`... (tử 1–64, mẫu số 1/2/4/8/16/32; bỏ trống = giữ nhịp trước). Mốc nhập theo `time` (giây, `m:ss.mmm`), `reaper` (`bar.beat.%`, ví dụ `5.3.50`) hoặc `sixteenth` (`bar.beat.sixteenth`, ví dụ `5.3.2`). Với bar.beat, một beat là nốt theo **mẫu số** của nhịp (12/8: nốt móc đơn), bar cộng dồn theo từng đoạn nhịp và đổi nhịp coi như bắt đầu ở đầu ô nhịp **[ĐÃ KIỂM với Reaper: nhịp 12/8 ở 120 BPM, đồng hồ hiển thị `1.12.68 / 0:02.920`, tức bar 1, beat 12 (nốt móc đơn thứ 12), 68 phần trăm của beat = 2,920 s; còn VERIFY với Ableton, Bitwig và các nhịp ghép khác, OI-12]**. Thư viện: `parsePositionText`, `parseTimeSignature`, `resolveTempoRows`.
* Ghi đè thay hoàn toàn tempo của file (tempo đổi giữa bài trong file bị bỏ) và kèm `WARN_TEMPO_OVERRIDDEN` khi file vốn có tempo. Với `.rpp` (vị trí item tính bằng giây), nốt được đặt lại theo tempo mới.
