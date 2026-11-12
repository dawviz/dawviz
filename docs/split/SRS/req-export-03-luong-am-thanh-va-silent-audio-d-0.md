---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-03: Luồng âm thanh và Silent Audio (D-01 sửa, R-08)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-03: Luồng âm thanh và Silent Audio (D-01 sửa, R-08)"
chunk: req-export-03-luong-am-thanh-va-silent-audio-d-0.md
source_lines: 673-678
source_sha1: 77837e7134
ids: [AT-03, D-01, KPI-02, NFR-ACC-01, REQ-EXPORT-03]
---
#### REQ-EXPORT-03: Luồng âm thanh và Silent Audio (D-01 sửa, R-08)
* **Có audio**: giải mã, đổi về 48 kHz stereo nếu khác (resample), áp offset và Export Range, cắt theo khoảng xuất (đoạn thiếu thì chêm im lặng). Đưa vào `AudioEncoder` theo khối (ví dụ 1 giây mỗi khối), mã hóa AAC (mặc định 128 kbps **[PROVISIONAL]**).
* **Đồng bộ**: mẫu audio đầu tiên phải có timestamp 0, trùng với khung video đầu tiên; bù độ trễ priming của AAC để không tích lũy lệch (KPI-02, NFR-ACC-01). Nếu Mediabunny đã xử lý priming thì chỉ cần kiểm chứng bằng bài kiểm thử đồng bộ (AT-03).
* **Không có audio (v0.3)**: mặc định xuất **video-only** (`export.silentAudioFallback = false`). Spike 1: bật Silent AAC (AAC-LC 64 kbps, 48 kHz, 2 kênh) gây lỗi encoder trên máy tính (LOQ) trong khi điện thoại chạy bình thường; MP4 video-only mở tốt trên các phần mềm dựng và trình phát kiểm thử. Người dùng có thể bật công tắc để tạo PCM 0 mã hóa AAC và ghép vào MP4 (best-effort); không mã hóa được AAC thì rơi về video-only và không chặn xuất.
* **Số đo A/V [ĐÃ ĐO, Spike 1]**: PC desktop: `first audio ts − first video ts` = 0,00 ms (đạt ±2 ms). Điện thoại Snapdragon 685: −42,67 ms (không đạt) do độ trễ khởi tạo audio khi chạy đồng thời hai encoder trong Worker; KPI-02 chỉ cam kết desktop (R-11).
