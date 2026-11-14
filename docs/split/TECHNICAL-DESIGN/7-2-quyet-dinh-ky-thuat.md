---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "7.2 Quyết định kỹ thuật"
path: "7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.2 Quyết định kỹ thuật"
chunk: 7-2-quyet-dinh-ky-thuat.md
source_lines: 402-409
source_sha1: 03d31db5d8
ids: [AT-03, D-01, ERR_EXPORT_FAILED, ERR_NO_SUPPORTED_ENCODER, SOI-10]
---
### 7.2 Quyết định kỹ thuật
- **Đích ghi:** File System Access (`showSaveFilePicker`, tên tệp chốt **trước** vòng render) nếu có; không thì tích luỹ chunk trong bộ nhớ rồi tải xuống. Cảnh báo RAM khi ước tính > 1 GB không có File System Access (R-01).
- **MP4 fast-start:** `MuxerAdapter` bọc Mediabunny với `fastStart: 'in-memory'` (đã đo cho `ftyp moov mdat`); ghi thẳng đĩa kèm fast-start còn [VERIFY] (SOI-10).
- **Bậc dự phòng codec:** H.264+AAC/MP4 → H.264 video-only/MP4 → VP9(VP8)+Opus/WebM → `ERR_NO_SUPPORTED_ENCODER`. Silent AAC mặc định TẮT (D-01).
- **Đồng bộ A/V:** mẫu audio đầu timestamp 0 trùng khung video đầu; bù priming AAC; kiểm bằng AT-03. Cam kết ±2 ms chỉ cho desktop (R-11).
- **Wake Lock** trong khi xuất; Worker lỗi → `ERR_EXPORT_FAILED`, giữ phiên, cho thử lại.
- **Bộ nhớ:** mỗi `VideoFrame` phải `close()` ngay; `ImageBitmap`/`AudioData` cũng vậy; kiểm bằng test dài (xuất 90 s 1080p60 không tăng bộ nhớ tuyến tính).
