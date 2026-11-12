---
doc: SPIKE-1-EXPORT.md
doc_title: "Spike 1: Đường ống xuất video (Export Pipeline)"
section: "4. Container và fast-start (SOI-10)"
path: "4. Container và fast-start (SOI-10)"
chunk: 4-container-va-fast-start-soi-10.md
source_lines: 32-37
source_sha1: cbc774f4af
ids: [SOI-10]
---
## 4. Container và fast-start (SOI-10)

* `fastStart: false` → bố cục `ftyp mdat moov` (không fast-start; `moov` ở cuối tệp).
* `fastStart: 'in-memory'` → bố cục `ftyp moov mdat` (**fast-start đạt**; phát được ngay khi đang tải).
* Ghi thẳng xuống đĩa kết hợp fast-start: chưa kết luận.
