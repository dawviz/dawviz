---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở)"
path: "7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở)"
chunk: 7-duong-ong-xuat-video-m3-spike-1-la-co-so.md
source_lines: 198-223
source_sha1: a953f6ccd4
ids: [AT-03, D-01, ERR_EXPORT_FAILED, ERR_NO_SUPPORTED_ENCODER, REQ-EXPORT-00, REQ-EXPORT-02, REQ-EXPORT-06, SOI-10]
---
## 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở)

### 7.1 Trình tự
```
UI ──start{scene, ast, derived, audio?, config}──► Export Worker
Worker: preflight (REQ-EXPORT-00) → chọn tier codec (REQ-EXPORT-06) → mở muxer + đích ghi
  for k in 0..N-1:
     t_k = start + k/FPS ; renderFrame(scene, derived, ast, t_k, offscreen, scale)
     frame = new VideoFrame(offscreen, { timestamp: round(k·1e6/FPS), duration: round(1e6/FPS) })
     videoEncoder.encode(frame, { keyFrame: k % (2·FPS) === 0 }); frame.close()
     if videoEncoder.encodeQueueSize > 8: await dequeue cho tới ≤ 2          // REQ-EXPORT-02
     mỗi ~100 ms: postMessage({ progress: k/N, fps, etr })
  audio (nếu có): giải mã → resample 48 kHz stereo → cắt theo Export Range → khối 1 s → audioEncoder (cùng cơ chế dòng chảy)
  flush encoder → muxer.finalize() → đóng đích ghi → postMessage({ done })
Hủy: UI gửi cancel → reset()/close() encoder, abort() đích ghi (không để lại tệp dở), giải phóng bộ nhớ
```
`N = ceil(Duration × FPS)`; `Duration = max(ProjectDuration, AudioDuration) + 2,0 s` khi xuất cả bài.

### 7.2 Quyết định kỹ thuật
- **Đích ghi:** File System Access (`showSaveFilePicker`, tên tệp chốt **trước** vòng render) nếu có; không thì tích luỹ chunk trong bộ nhớ rồi tải xuống. Cảnh báo RAM khi ước tính > 1 GB không có File System Access (R-01).
- **MP4 fast-start:** `MuxerAdapter` bọc Mediabunny với `fastStart: 'in-memory'` (đã đo cho `ftyp moov mdat`); ghi thẳng đĩa kèm fast-start còn [VERIFY] (SOI-10).
- **Bậc dự phòng codec:** H.264+AAC/MP4 → H.264 video-only/MP4 → VP9(VP8)+Opus/WebM → `ERR_NO_SUPPORTED_ENCODER`. Silent AAC mặc định TẮT (D-01).
- **Đồng bộ A/V:** mẫu audio đầu timestamp 0 trùng khung video đầu; bù priming AAC; kiểm bằng AT-03. Cam kết ±2 ms chỉ cho desktop (R-11).
- **Wake Lock** trong khi xuất; Worker lỗi → `ERR_EXPORT_FAILED`, giữ phiên, cho thử lại.
- **Bộ nhớ:** mỗi `VideoFrame` phải `close()` ngay; `ImageBitmap`/`AudioData` cũng vậy; kiểm bằng test dài (xuất 90 s 1080p60 không tăng bộ nhớ tuyến tính).
