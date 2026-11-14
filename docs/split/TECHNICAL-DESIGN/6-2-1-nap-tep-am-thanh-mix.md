---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.1 Nạp tệp âm thanh (mix)"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.1 Nạp tệp âm thanh (mix)"
chunk: 6-2-1-nap-tep-am-thanh-mix.md
source_lines: 227-240
source_sha1: ba7b039c7b
ids: [ARC-03, ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, ERR_FILE_TOO_LARGE, NFR-PERF-04, REQ-AUDIO-01, REQ-EXPORT-03, REQ-STORAGE-05, REQ-WIDGET-07]
---
#### 6.2.1 Nạp tệp âm thanh (mix)
- **Định dạng:** `.wav .mp3 .ogg .flac .m4a` (REQ-WIDGET-07); khả năng giải mã do trình duyệt quyết định. Nhận qua nút "Nạp âm thanh" (inspector, mục 01 Bài) và kéo thả. Chỉ **một** tệp mix ở T-08 (stem theo track là REQ-AUDIO-01, 1.2).
- **Kiểm theo thứ tự, rẻ trước đắt sau, mỗi bước thất bại là một lỗi có mã và phiên vẫn chạy được không âm thanh:**
  1. Kích thước `File.size` ≤ **300 MB** [PROVISIONAL], kiểm **trước khi đọc** → `ERR_FILE_TOO_LARGE`. Tệp rỗng → `ERR_AUDIO_DECODE`.
  2. Dò thời lượng bằng metadata (`HTMLAudioElement`, `preload="metadata"`, blob URL, không giải mã) ≤ **20 phút** [PROVISIONAL] → `ERR_AUDIO_TOO_LONG`. Bước này chặn trước khi tốn RAM (ARC-03). **CSP không cần đổi:** `media-src 'self' blob:` đã có sẵn (`lib/csp.ts`); `csp.test.ts` thêm một ca khoá chỉ thị này (có `blob:`, không có nguồn ngoài) để không ai vô tình bỏ.
  3. **Metadata không đọc được** (MP3 VBR không có tiêu đề Xing/VBRI cho `duration = Infinity` hoặc `NaN`, hoặc lỗi/quá 5 s chờ): **giải mã rồi mới kiểm giới hạn** (`buffer.duration` > 20 phút → bỏ buffer, `ERR_AUDIO_TOO_LONG`). Vì khi đó chưa biết độ dài thật, để khỏi giải mã nhầm tệp rất dài, đặt trần kích thước riêng cho nhánh này: tệp nén > **48 MB** (= 20 phút ở 320 kbps, bitrate cao nhất của MP3) thì không giải mã mà báo `ERR_AUDIO_TOO_LONG` kèm lý do "không xác định được độ dài" [PROVISIONAL].
  4. Giải mã → lỗi bất kỳ → `ERR_AUDIO_DECODE` (kèm chi tiết kỹ thuật gập lại, không stack trace).
- **Giải mã ở đâu:** luồng chính bằng `OfflineAudioContext(2, 1, 48000).decodeAudioData(...)`. `decodeAudioData` không có trong Worker, còn WebCodecs `AudioDecoder` cần tự tách container nên không đáng cho T-08. Việc giải mã thực chạy ngoài luồng JS, nên không chặn giao diện; dùng `OfflineAudioContext` nên **không dính chính sách autoplay**. Kết quả đã **ở 48 kHz** (khớp REQ-EXPORT-03, T-09 không phải resample); mono giữ 1 kênh, upmix lúc xuất.
- **Bộ nhớ (đối chiếu mục 11, chỉnh 5):** 20 phút × 60 × 48 000 mẫu × 2 kênh × 4 byte = **460,8 MB** PCM. Sau khi giải mã xong **không giữ byte tệp nén**, chỉ giữ tham chiếu `File` (Blob trỏ tới đĩa, không tốn RAM) để Project Pack sau này đọc lại. Tệp mới thay tệp cũ: bỏ tham chiếu `AudioBuffer` cũ **trước** khi giải mã tệp mới.
  - *Trạng thái ổn định:* 460,8 MB = 22,5 % trần 2,0 GB của NFR-PERF-04. Cộng phần xuất 4K ước tính ≈ 0,7 GB (canvas ngoài màn hình 4K ≈ 33 MB, hàng đợi ≤ 8 `VideoFrame` ≈ 265 MB, bộ mã hoá, AST) thì ≈ 1,2 GB, **còn dư ≈ 0,8 GB**.
  - *Đỉnh tạm khi giải mã:* tệp nén (≤ 300 MB, thực tế WAV 20 phút ≈ 230 MB; MP3/FLAC nhỏ hơn) + PCM 460,8 MB, và một số trình duyệt giữ thêm một bản trung gian khi giải mã (ước ≤ 2× PCM) ⇒ đỉnh ≲ 1,2 GB; giải mã **không chạy cùng lúc với xuất** (nút nạp bị khoá khi đang xuất, T-09).
  - **Kết luận: không vượt ngân sách, giữ nguyên 20 phút**; mục 11 thêm một dòng ngân sách cho âm thanh. Số đo thật trên trình duyệt ghi lại sau khi kiểm tay; nếu đỉnh tạm đo được > 1,5 GB thì hạ trần thời lượng (đề xuất 12 phút ≈ 276 MB PCM) và báo chủ dự án.
- **Định danh (REQ-STORAGE-05):** SHA-256 của byte tệp (`crypto.subtle.digest`) làm `assetId`; dùng làm khoá bộ đệm sóng âm. Lưu IndexedDB và đóng gói Project Pack thuộc T-xx lưu trữ (M4), ngoài phạm vi T-08.
