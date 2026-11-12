---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)"
chunk: 3-4-dac-ta-8-widget-hud-br-02-br-03-br-04.md
source_lines: 457-511
source_sha1: 6c3a823de0
ids: [ARC-03, ARC-06, BR-02, BR-03, BR-04, D-09, D-10, D-27, ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, KPI-06, NFR-PERF-02, REQ-EXPORT-00, REQ-GRAPHICS-05, REQ-WIDGET-01, REQ-WIDGET-02, REQ-WIDGET-03, REQ-WIDGET-04, REQ-WIDGET-05, REQ-WIDGET-06, REQ-WIDGET-07, REQ-WIDGET-08, SOI-09]
---
### 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)

Mỗi widget có thuộc tính hình học `(x, y, width, height, zIndex, rotation)` và hỗ trợ snapping như nhau. **Trạng thái rỗng**: widget không có dữ liệu (không có track gán, chưa nạp audio) vẫn phải hiển thị khung giữ chỗ ở Edit Mode, và không vẽ gì ở Preview/Export, trừ khi người dùng chọn hiển thị giá trị mặc định.

#### REQ-WIDGET-01: Piano Roll
* **Hướng cuộn**: *Horizontal* (mặc định): nốt chạy phải sang trái, Playhead thẳng đứng tại `playheadPositionRatio` (mặc định 30% từ mép trái). *Vertical*: nốt rơi từ trên xuống, Playhead nằm ngang (mặc định 75% từ mép trên).
* **Đa track**: gán một hoặc nhiều track; mỗi track vẽ bằng `track.color`.
* **Thanh nốt**: hình chữ nhật bo góc, độ dài tỉ lệ với `durationSeconds`; vẽ nốt đang phát sáng hơn nốt chưa phát.
* **Pitch Range**: *Fit to Content* (mặc định) lấy min/max pitch của track được gán; *Custom Octave Range* cho chọn khoảng (ví dụ C2–C6), nốt ngoài khoảng bị cắt.
* **Lookahead**: 1.0 đến 8.0 giây (mặc định 3.0).
* **Hiệu năng**: chỉ vẽ nốt giao với cửa sổ thời gian hiển thị (tìm bằng chỉ mục theo `startTick`), không duyệt toàn bộ nốt mỗi khung (NFR-PERF-02).

#### REQ-WIDGET-02: Track Info
* Hiển thị `title`, `artist` từ `AST.meta`; người dùng sửa nội dung trong Inspector mà không đổi file gốc (giá trị sửa lưu trong Document).
* Tùy biến: font (có sẵn hoặc người dùng nạp), cỡ chữ, màu, độ đậm, căn lề trái/giữa/phải.

#### REQ-WIDGET-03: Event Counter
* "Event" là một Note-On; hợp âm 4 nốt cùng lúc tính 4 Events.
* Trường hiển thị (bật/tắt riêng): **Played Notes** (số nốt có `startTimeSeconds ≤ t`), **Total Notes** (nốt của các track đang hiển thị), **Progress** `P = Played / Total × 100%`, **Tempo hiện tại** (BPM).
* `Total = 0` thì hiển thị 0 và `0%`, không chia cho 0.

#### REQ-WIDGET-04: Live Note Trigger
* Lọc nốt thỏa `startTimeSeconds ≤ t < endTimeSeconds`; hiển thị tên nốt và lực gõ (ví dụ `B2 (Vel: 70)`).
* **Fade-out Tail**: nốt vừa kết thúc còn trong danh sách thêm 100–1000 ms (cấu hình được), độ trong suốt giảm dần về 0.
* Danh sách dài hơn số dòng hiển thị: sắp theo pitch giảm dần và cắt bớt, có thể hiện "+N".

#### REQ-WIDGET-05: Time & Bar Counter
* **Đồng hồ thực**: `mm:ss.sss`.
* **Đồng hồ nhạc**: `Bar : Beat : Sub-Tick`, Bar bắt đầu từ 1 (ví dụ `1.1.000`).
* Một beat dài `960 × 4 / denominator` tick (4/4 → 960; 6/8 → 480). Sub-Tick là phần tick lẻ trong beat.
* Tra cứu bằng TempoMap; đúng cả khi số chỉ nhịp đổi giữa bài. Nốt/Bar bắt đầu ở điểm đổi nhịp.

#### REQ-WIDGET-06: Chord Detection (D-09)
* **Nguồn nốt**: người dùng chọn track đưa vào; mặc định chọn track Piano/Keyboard/Guitar theo tên, loại Drums/Percussion.
* **Thuật toán**: lấy nốt thấp nhất làm `BassNote`; các nốt còn lại quy về pitch class (mod 12); gọi `@tonaljs/chord-detect` (đưa bass đứng đầu danh sách). Nếu `BassNote ≠ RootNote` thì hiển thị hợp âm đảo/phân số (`D/F#`).
* **Hai chế độ**: *Sustained* (mặc định) phân tích mọi nốt đang giữ tại `t`; *Strike* chỉ gom nốt có thời điểm bắt đầu lệch nhau ≤ 30 ms và giữ tên hợp âm đến lần dập tiếp theo.
* **ChordTimeline**: tính trước một lần khi nạp hoặc khi đổi track/chế độ; đoạn liền kề cùng tên thì gộp; đoạn ngắn hơn 80 ms **[PROVISIONAL]** (SOI-09) được gộp vào đoạn lân cận để tránh nhấp nháy.
* **Không nhận diện được**: hiển thị `N.C.` hoặc danh sách tên nốt, tùy cấu hình.
* **Manual Override**: nhấp đúp vào làn hợp âm trên Timeline để tạo `ChordOverrideSegment` có `chordName`, `startTick`, `endTick`. Override ưu tiên tuyệt đối; override chồng nhau thì cái tạo sau thay phần giao; lưu trong Preset/Project Pack (`overrides.json`); hoàn tác được.
* Độ chính xác mục tiêu: KPI-06.

#### REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)
* Hoạt động khi nạp audio hợp lệ (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`). Trình duyệt không giải mã được thì báo `ERR_AUDIO_DECODE` và vẫn cho tiếp tục không có audio.
* **Giới hạn bộ nhớ** **[PROVISIONAL]**: thời lượng audio giải mã tối đa 20 phút; vượt thì `ERR_AUDIO_TOO_LONG`. Cache phân tích (đỉnh/RMS, FFT) lưu dạng mono; PCM stereo chỉ giữ cho phát/mã hóa và nên giải mã theo khối.
* **Offset**: thanh trượt ±10.0 giây, bước 1 ms.
* **FFT tất định**: tự cài FFT (cửa sổ Hann, kích thước 2048 **[PROVISIONAL]**) tính từ PCM tại thời điểm `t`; Preview không dùng `AnalyserNode` để Export cho cùng kết quả.
* **Kiểu hiển thị**: Frequency Bars (16–128 cột, thang log hoặc tuyến tính), Mirrored Spectrum, Oscilloscope, Peak & Crest Factor Meter (dBFS đỉnh và tỉ số đỉnh/RMS).
* Khi chưa có audio nhưng widget vẫn được đặt: áp dụng quy tắc trạng thái rỗng ở đầu mục 3.4.

#### REQ-WIDGET-08: Progress Bar (D-27)
* Thanh tiến độ của bài nhạc, người dùng tự thêm vào Canvas (theo đề xuất Spike 2). Tiến độ `P = clamp((t − rangeStart) / (rangeEnd − rangeStart), 0, 1)`, trong đó khoảng là Export Range nếu có, không thì toàn bộ thời lượng (cùng định nghĩa thời lượng ở REQ-EXPORT-00). Khác `Progress` của Event Counter (theo số nốt).
* Hướng: *Horizontal* (mặc định) hoặc *Vertical*. Kiểu: thanh đầy, đường mảnh có đầu tròn, hoặc các đoạn theo Bar.
* Tuỳ chọn: màu nền/màu tiến độ, bo góc, độ dày, hiển thị `%`, hiển thị thời gian đã qua / còn lại (`mm:ss`), tuỳ chọn đánh dấu ranh giới đoạn hợp âm hoặc mốc Bar (mặc định tắt).
* Chỉ phụ thuộc `t` và khoảng thời gian, nên tất định cho Preview và Export (REQ-GRAPHICS-05). Không cần track gán. Thời lượng bằng 0 thì hiển thị 0%, không chia cho 0.
