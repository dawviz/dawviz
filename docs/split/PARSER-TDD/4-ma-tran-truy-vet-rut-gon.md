---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "4. Ma trận truy vết (rút gọn)"
path: "4. Ma trận truy vết (rút gọn)"
chunk: 4-ma-tran-truy-vet-rut-gon.md
source_lines: 63-73
source_sha1: 42e0660dc8
ids: [REQ-ALS-02, REQ-AST-02, REQ-BIN-03, REQ-CMP-01, REQ-LIM-02, REQ-RPP-04, REQ-TEMPO-02]
---
## 4. Ma trận truy vết (rút gọn)
| Yêu cầu | Test |
|---|---|
| REQ-LIM-02..05 | als (bom, entity), midi-alp (bom ALP, zip-slip), binary (maxNotes) |
| REQ-TEMPO-02..03 | als, midi-alp, rpp, dawproject, binary — mỗi file có ca fallback/override |
| REQ-AST-02 | `assertAstInvariants` trong als, midi-alp, rpp, binary, dawproject |
| REQ-ALS-02 | als: oracle, clip lặp, clip không lặp |
| REQ-RPP-04 | rpp: LOOP, POOLEDEVTS |
| REQ-BIN-03 | binary: schema độc, biểu thức cấm |
| REQ-CMP-01 | midi-alp: so sánh 960 vs 96 |
