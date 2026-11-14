---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "7.1 Trình tự"
path: "7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.1 Trình tự"
chunk: 7-1-trinh-tu.md
source_lines: 386-401
source_sha1: 03d31db5d8
ids: [REQ-EXPORT-00, REQ-EXPORT-02, REQ-EXPORT-06]
---
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
