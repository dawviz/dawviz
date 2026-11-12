---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "2. Công cụ dùng chung (`test/helpers.mjs`)"
path: "2. Công cụ dùng chung (`test/helpers.mjs`)"
chunk: 2-cong-cu-dung-chung-test-helpers-mjs.md
source_lines: 18-23
source_sha1: 42e0660dc8
ids: []
---
## 2. Công cụ dùng chung (`test/helpers.mjs`)
- `smf({format,ppq,tracks})`, `tempoEv`, `sigEv`, `nameEv`, `on`, `off`: dựng file MIDI.
- `zip(entries,{store})`: dựng ZIP (deflate hoặc lưu thẳng) có CRC đúng; `gz`: gzip.
- `assertAstInvariants(assert, ast)`: PPQ 960; tempoMap tăng nghiêm ngặt; tick nguyên, `durationTick ≥ 1`, `endTick = start + duration`; pitch 0..127; velocity 1..127; thời gian giây hữu hạn và tăng; nốt sắp theo `startTick`.
- `fx(name)`: đọc fixture.
