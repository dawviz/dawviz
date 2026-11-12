---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "7. Lệch so với SRS gốc v0.2"
path: "7. Lệch so với SRS gốc v0.2"
chunk: 7-lech-so-voi-srs-goc-v0-2.md
source_lines: 134-135
source_sha1: dd04828ada
ids: [ERR_NO_SUPPORTED_ENV, ERR_SCHEMA_INVALID, WARN_SESSION_CLIPS_IGNORED]
---
## 7. Lệch so với SRS gốc v0.2
Mốc clip = `LoopStart + StartRelative`; AST thêm `sourcePPQ`, `tempoSource`, `note.channel`, `track.sourceId`, `sourceFormat` thêm `alp`/`custom_binary`; `maxUnzippedBytes` 300 MB thay vì 500 MB (giới hạn chuỗi V8); thêm `ERR_SCHEMA_INVALID`, `ERR_NO_SUPPORTED_ENV`; `.als` Session View bị bỏ qua (có đếm và cảnh báo `WARN_SESSION_CLIPS_IGNORED`).
