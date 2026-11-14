---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "7.4 Export Worker và giao diện (T-09, 2026-11-14)"
path: "7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.4 Export Worker và giao diện (T-09, 2026-11-14)"
chunk: 7-4-export-worker-va-giao-dien-t-09-2026-11-14.md
source_lines: 420-429
source_sha1: 03d31db5d8
ids: [AT-03, AT-05, D-04, D-26, ERR_EXPORT_FAILED, REQ-EXPORT-02, REQ-GRAPHICS-05, SOI-10]
---
### 7.4 Export Worker và giao diện (T-09, 2026-11-14)
- **Phụ thuộc:** `mediabunny@1.66.0` (D-04; MPL-2.0, dùng nguyên bản làm phụ thuộc của `apps/web`, không đụng `packages/*`). `npm audit` 0 lỗ hổng.
- **Vòng xuất** `lib/exportEngine.ts` (`runExport`): nhận `draw`, `VideoSink`, `AudioSink` qua giao diện nên test được bằng node (6 test với sink giả). Khối âm thanh 1 s đi trước khung đầu của giây đó; mẫu đầu timestamp 0; huỷ kiểm ở mỗi khung (`ExportCancelled`).
- **Adapter** `lib/exportOutput.ts`: `Output` + `CanvasSource` + `AudioSampleSource`; MP4 `fastStart: 'in-memory'`, WebM; đích `StreamTarget` (File System Access) hoặc `BufferTarget`; `cancel()` gọi `output.cancel()` và `abort()` đích ghi. Dòng chảy encoder do `await source.add()` của Mediabunny đảm nhiệm; `createBackpressure` (REQ-EXPORT-02) **chưa gắn**: chưa đo `encodeQueueSize` thực tế nên chưa biết Mediabunny đã đủ hay chưa (đo cùng bài kiểm bộ nhớ xuất dài).
- **Worker** `workers/export.worker.ts` + `lib/exportProtocol.ts`: dựng `derived` từ `ast` + `scene` (`buildIndex`, `buildSceneHud`), nạp phông bằng `ensureFonts` với `self.fonts` **trước khung đầu** (thiếu thì lỗi, không vẽ chữ bằng phông dự phòng), `renderFrame` lên `OffscreenCanvas` ở `scale = width / designWidth`. Lỗi → `ERR_EXPORT_FAILED`.
- **Client** `lib/exportClient.ts` (`startExport`, Worker tiêm vào, 4 test): chuyển quyền buffer âm thanh và đích ghi; `cancel()` chờ Worker báo, quá 5 s thì `terminate()`. Âm thanh chỉ gửi **phần khoảng xuất dùng** (`sliceAudioForRange`, 1 test quét nhiều offset/đoạn so từng mẫu với bản gốc), không gửi cả bài.
- **Giao diện** `components/ExportDialog.tsx`, nối với nút Xuất video ở thanh trên: cỡ 720p/1080p/4K, FPS, chất lượng; tóm tắt pre-flight; định dạng sẽ dùng và thông báo bậc dự phòng; tiến độ (khung, ×thời gian thực, ETR); Hủy; Lưu tệp. Wake Lock khi xuất. Trang hướng dẫn `docs/manual/06-xuat-video.md` (vi, en).
- **Đã kiểm trên Chromium 1254 (headless, bản build có CSP, 0 vi phạm CSP/lỗi console):** BigProject4b 720p24 chất lượng Thấp → MP4 H.264, 2 702 gói = 112,583 s (đúng N/FPS), 57 khung khoá (mỗi 2 s), `ftyp` đầu tệp, 16,2 MB trong 7,4 s (≈ 15× thời gian thực); bậc 2 (Chromium này không có AAC) đúng thông báo không tiếng; ép không có H.264 → WebM VP9 + Opus, 5 630 gói âm thanh phủ 112,6 s; Hủy giữa chừng về lại màn cấu hình, chạy lại và huỷ lần hai được.
- **Chưa kiểm / chưa làm:** AAC thật (Chromium headless không có; AT-03 bù priming AAC và ±2 ms A/V cần máy thật theo Spike 1), đường File System Access (headless không có hộp chọn tệp; đã thử đường bộ nhớ), Export Range Start→End trong giao diện (`exportDuration` đã hỗ trợ), kích thước tuỳ ý D-26 (`sizeFromCustom`, `parseAspect` đã có nhưng chưa có ô nhập), test ảnh Preview↔Export (AT-05, REQ-GRAPHICS-05), đo bộ nhớ xuất dài (90 s 1080p60), nạp phông người dùng, ghi MP4 thẳng đĩa kèm fast-start [VERIFY] (SOI-10; hiện `in-memory`).
