---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-06: Chord Detection (D-09)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-06: Chord Detection (D-09)"
chunk: req-widget-06-chord-detection-d-09.md
source_lines: 600-609
source_sha1: 46410b6da3
ids: [D-09, KPI-06, REQ-WIDGET-06, SOI-09, WARN_PRESET_]
---
#### REQ-WIDGET-06: Chord Detection (D-09)
* **Nguồn nốt**: người dùng chọn track đưa vào; mặc định chọn track Piano/Keyboard/Guitar theo tên, loại Drums/Percussion. Bất kể người dùng chọn gì, nốt ở kênh MIDI 10 (chỉ số 9) và track tên Drums/Percussion không đưa vào nhận diện hợp âm. Tam hợp trưởng ghi "C" (không "CM").
* **Thuật toán**: lấy nốt thấp nhất làm `BassNote`; các nốt còn lại quy về pitch class (mod 12); gọi `@tonaljs/chord-detect` (đưa bass đứng đầu danh sách). Nếu `BassNote ≠ RootNote` thì hiển thị hợp âm đảo/phân số (`D/F#`).
* **Hai chế độ**: *Sustained* (mặc định) phân tích mọi nốt đang giữ tại `t`; *Strike* chỉ gom nốt có thời điểm bắt đầu lệch nhau ≤ 30 ms và giữ tên hợp âm đến lần dập tiếp theo. **Làm rõ khi cài đặt (T-06, 2026-11-13):** nhóm được tính từ nốt đầu tiên của nhóm (mọi nốt bắt đầu trong 30 ms sau nốt đó); nhóm chỉ có một pitch class (nốt giai điệu đơn, hoặc cùng nốt ở nhiều quãng tám) **không** phải lần dập hợp âm nên không cắt tên đang giữ; tên được giữ cả qua chỗ đã nhả nốt và khoảng lặng; lần dập cuối giữ đến khi nốt cuối cùng tắt. Chế độ lưu ở thuộc tính widget `mode: "sustained" | "strike"` (thiếu hoặc lạ thì `sustained`, có cảnh báo `WARN_PRESET_*`).
* **ChordTimeline**: tính trước một lần khi nạp hoặc khi đổi track/chế độ; đoạn liền kề cùng tên thì gộp; đoạn ngắn hơn 80 ms **[PROVISIONAL]** (SOI-09) được gộp vào đoạn lân cận để tránh nhấp nháy.
* **Không nhận diện được**: hiển thị `N.C.` hoặc danh sách tên nốt, tùy cấu hình.
* **Luôn hiện danh sách nốt (bổ sung T-69, tuỳ chọn, mặc định tắt):** khi bật, danh sách nốt đang giữ (từ thấp đến cao, có quãng tám, ví dụ `Notes: G#2 E3 D4 E4 G#4 B4`) luôn hiện **kèm** tên hợp âm ở dòng riêng, kể cả khi đã nhận diện được; tên hợp âm và danh sách nốt có cỡ chữ, màu và mẫu chữ riêng (`Notes: {notes}`). Tắt thì giữ hành vi cũ (danh sách nốt chỉ thay cho tên khi không nhận diện được). Không có nốt nào đang giữ thì không vẽ dòng nốt.
* **Manual Override**: nhấp đúp vào làn hợp âm trên Timeline để tạo `ChordOverrideSegment` có `chordName`, `startTick`, `endTick`. Override ưu tiên tuyệt đối; override chồng nhau thì cái tạo sau thay phần giao; lưu trong Preset/Project Pack (`overrides.json`); hoàn tác được.
* Độ chính xác mục tiêu: KPI-06.
