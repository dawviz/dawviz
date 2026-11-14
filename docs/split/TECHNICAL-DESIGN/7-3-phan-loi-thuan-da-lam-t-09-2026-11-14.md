---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "7.3 Phần lõi thuần đã làm (T-09, 2026-11-14)"
path: "7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.3 Phần lõi thuần đã làm (T-09, 2026-11-14)"
chunk: 7-3-phan-loi-thuan-da-lam-t-09-2026-11-14.md
source_lines: 410-419
source_sha1: 03d31db5d8
ids: [D-26, ERR_NO_SUPPORTED_ENCODER, REQ-EXPORT-00, REQ-EXPORT-01, REQ-EXPORT-02, REQ-EXPORT-03, REQ-EXPORT-05, REQ-EXPORT-06, SOI-05]
---
### 7.3 Phần lõi thuần đã làm (T-09, 2026-11-14)
`apps/web/src/lib/exportPlan.ts` (test `exportPlan.test.ts`, chạy bằng `node --test`, không cần trình duyệt) giữ mọi phép tính mà Export Worker sẽ gọi, để kiểm được ngoài trình duyệt:
- **Kích thước (REQ-EXPORT-00):** `sizeForClass` (lớp 720/1080/2160 theo cạnh ngắn, cạnh dài làm chẵn lên, > 4096 thu nhỏ đồng tỉ lệ), `sizeFromCustom` (D-26: làm chẵn xuống, cạnh ngắn ≥ 128), `parseAspect` (`21:9`, `2.39:1`, `1.91`).
- **Khung hình (REQ-EXPORT-01):** `exportDuration`, `frameCount` (có dung sai 1e-6 để 0,1 s × 30 không ra 4 khung), `frameTimestampUs`, `isKeyFrame` (mỗi 2 s).
- **Pre-flight:** `videoBitrate` (6/12/35 Mbps × 0,5/1/1,5), `estimateBytes`, `preflight` (cảnh báo `LARGE_IN_MEMORY` khi không có File System Access và > 1 GB), `h264Candidates` (level nhỏ nhất đủ dùng theo MaxMBPS/MaxFS bảng A-1, thử High → Main → Baseline; 4K cần level 5.1 trở lên vì 32 400 macroblock vượt MaxFS của 5.0 **[VERIFY]** SOI-05).
- **Bậc codec (REQ-EXPORT-06):** `chooseCodec(probe, cfg)` nhận `isConfigSupported` qua giao diện `CodecProbe` (ném lỗi = không hỗ trợ); trả bậc 1/2/3 kèm mã thông báo (`NO_AAC_VIDEO_ONLY`, `WEBM_NO_H264`, `WEBM_NO_AUDIO`) hoặc `null` = `ERR_NO_SUPPORTED_ENCODER`. Dự án không có âm thanh thì bậc 1 không đòi AAC.
- **Dòng chảy (REQ-EXPORT-02):** `createBackpressure` trễ hai ngưỡng (dừng > 8, chạy lại ≤ 2), dùng riêng cho video và audio.
- **Tiến độ (REQ-EXPORT-05):** `createProgress` trung bình trượt 5 s cho fps, bội số thời gian thực và ETR.
- **Âm thanh (REQ-EXPORT-03):** `audioBlocks` (khối 1 s) và `renderAudioBlock` (cắt/chêm im lặng theo `audioOffsetMs`, căn theo mẫu nguyên nên khối nối nhau không hở không chồng; test khớp từng đoạn với `exportSegments`).
