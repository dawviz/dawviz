---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "2. Môi trường đo (thật, không giả lập)"
path: "2. Môi trường đo (thật, không giả lập)"
chunk: 2-moi-truong-do-that-khong-gia-lap.md
source_lines: 13-24
source_sha1: 53acc77056
ids: []
---
## 2. Môi trường đo (thật, không giả lập)

| | |
|---|---|
| Máy | Linux, 22 luồng CPU, 30 GB RAM, Intel Arc Graphics (Meteor Lake) |
| Chrome | 157 (bản cài trên máy), **có giao diện**, ANGLE trên OpenGL ES 3.2 của GPU thật |
| Firefox | 159 (Playwright), có giao diện, WebGL2 trên GPU thật. Bộ đếm giờ làm tròn 1 ms nên chỉ dùng để so chiều hướng |
| Khung | 1920×1080, `scale` 1 (như xuất 1080p) |
| Công cụ | [`scripts/perf/run.mjs`](../../../scripts/perf/run.mjs) + [`frame-bench.ts`](../../../scripts/perf/frame-bench.ts): parser của repo đọc tệp, Render Core chính thức dựng và vẽ |

Ba con số cho mỗi khung: **layout** = `layoutFrame` (thuần tính toán, đúng phần đề xuất muốn đưa sang WASM); **render** = `renderFrame` (tính + phát lệnh vẽ); **render+sync** = `renderFrame` rồi `getImageData` 1 px, buộc GPU vẽ xong (gần với Export, vì Export đọc khung ra `VideoFrame`). Số liệu chỉ đúng cho máy này, không khẳng định cho máy khác.
