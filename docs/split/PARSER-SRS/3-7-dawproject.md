---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.7 DAWproject"
path: "3. Yêu cầu chức năng > 3.7 DAWproject"
chunk: 3-7-dawproject.md
source_lines: 89-95
source_sha1: dd04828ada
ids: [ERR_ARCHIVE_INVALID, REQ-DAWP-01, REQ-DAWP-02, REQ-DAWP-03, REQ-DAWP-04, REQ-DAWP-05, WARN_TIME_UNIT_MIXED]
---
### 3.7 DAWproject
- **REQ-DAWP-01** Đọc `project.xml` (bắt buộc), `metadata.xml` (tùy chọn: Title, Artist). Thiếu `project.xml` → `ERR_ARCHIVE_INVALID`.
- **REQ-DAWP-02** Track có `contentType` chứa `notes` và không phải kênh `role="master"`. Mute từ `Channel/Mute@value`.
- **REQ-DAWP-03** Lane/Clip: `time`, `duration`, `playStart`, `loopStart`, `loopEnd`, `contentTimeUnit`; `timeUnit` beats hoặc seconds (seconds quy đổi qua tempo, `WARN_TIME_UNIT_MIXED` khi trộn). Clip lồng clip được đệ quy.
- **REQ-DAWP-04** `Note`: `time`, `duration`, `key`, `vel` (0..1 → 1..127; >1 coi là đã thang 127), `channel`.
- **REQ-DAWP-05** Tempo từ `Transport/Tempo@value`; tempo/nhịp automation (`TempoAutomation`, `TimeSignatureAutomation`) — VERIFY.
