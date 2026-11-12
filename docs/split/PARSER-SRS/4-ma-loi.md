---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "4. Mã lỗi"
path: "4. Mã lỗi"
chunk: 4-ma-loi.md
source_lines: 110-125
source_sha1: dd04828ada
ids: [ERR_ARCHIVE_INVALID, ERR_ARCHIVE_TOO_LARGE, ERR_AST_INVALID, ERR_AST_TOO_LARGE, ERR_FILE_TOO_LARGE, ERR_NO_NOTES, ERR_NO_SUPPORTED_ENV, ERR_SCHEMA_INVALID, ERR_UNSUPPORTED_FORMAT, WARN_ALP_MULTIPLE_ALS, WARN_CLIP_SKIPPED, WARN_DAWPROJECT_, WARN_MIDI_, WARN_RPP_, WARN_SESSION_CLIPS_IGNORED, WARN_TEMPO_AUTOMATION, WARN_TEMPO_FALLBACK, WARN_TEMPO_MIDI_DEFAULT, WARN_TEMPO_OVERRIDDEN, WARN_TEMPO_RAMP, WARN_TEMPO_SHAPE, WARN_TIMESIG_DEFAULT, WARN_TIME_UNIT_MIXED, WARN_ZERO_LENGTH_NOTES]
---
## 4. Mã lỗi

| Mã | Khi nào |
|---|---|
| ERR_UNSUPPORTED_FORMAT | đuôi/nội dung không hỗ trợ, magic sai, SMPTE |
| ERR_FILE_TOO_LARGE | file > `maxFileBytes` |
| ERR_ARCHIVE_INVALID | ZIP hỏng, zip-slip, thiếu `project.xml`/`.als`, ZIP64/mã hóa |
| ERR_ARCHIVE_TOO_LARGE | vượt `maxUnzippedBytes` / `maxRatio` / `maxZipEntries` |
| ERR_AST_INVALID | cấu trúc nội dung sai (gốc XML sai, MThd thiếu, đọc binary lố vùng) |
| ERR_AST_TOO_LARGE | vượt `maxNotes`, nút, ngân sách phép tính |
| ERR_NO_NOTES | không có nốt hiển thị sau khi lọc |
| ERR_SCHEMA_INVALID | schema nhị phân sai hoặc thiếu mục `ast` |
| ERR_NO_SUPPORTED_ENV | môi trường thiếu `DecompressionStream` |

Cảnh báo: `WARN_TEMPO_FALLBACK`, `WARN_TEMPO_MIDI_DEFAULT`, `WARN_TEMPO_OVERRIDDEN`, `WARN_TEMPO_RAMP`, `WARN_TEMPO_SHAPE`, `WARN_TEMPO_AUTOMATION(_SECONDS)`, `WARN_TIMESIG_DEFAULT`, `WARN_ZERO_LENGTH_NOTES`, `WARN_SESSION_CLIPS_IGNORED`, `WARN_CLIP_SKIPPED`, `WARN_ALP_MULTIPLE_ALS`, `WARN_MIDI_*`, `WARN_RPP_*`, `WARN_DAWPROJECT_*`, `WARN_TIME_UNIT_MIXED`.
