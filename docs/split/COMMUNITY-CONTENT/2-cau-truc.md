---
doc: COMMUNITY-CONTENT.md
doc_title: "Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp"
section: "2. Cấu trúc"
path: "2. Cấu trúc"
chunk: 2-cau-truc.md
source_lines: 10-22
source_sha1: d3268bcf29
ids: []
---
## 2. Cấu trúc

```text
presets/
  schema/note-style.schema.json   JSON Schema cho preset kiểu nốt
  note-style/<slug>.json          một preset một tệp
assets/
  fonts/<slug>/                   phông + LICENSE + meta.json
  backgrounds/<slug>/             ảnh nền + LICENSE + meta.json
```

Sau khi tách repo, thêm `index.json` (danh mục sinh tự động, có băm SHA-256 từng tệp) ở gốc repo cộng đồng.
