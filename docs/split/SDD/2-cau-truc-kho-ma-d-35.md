---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "2. Cấu trúc kho mã (D-35)"
path: "2. Cấu trúc kho mã (D-35)"
chunk: 2-cau-truc-kho-ma-d-35.md
source_lines: 12-27
source_sha1: b1d59a382a
ids: [D-35]
---
## 2. Cấu trúc kho mã (D-35)

```
dawviz/
├─ apps/web/            ứng dụng React (Vite, Tailwind, Framer Motion)
├─ apps/parser-lab/     trang thử thư viện parser (HTML thuần + Worker)
├─ packages/
│  ├─ core, midi, als, rpp, dawproject, binary, parser   @dawviz/parser-* (JS + JSDoc)
│  ├─ i18n/             @dawviz/i18n
│  └─ render-core/      @dawviz/render-core (TypeScript, hàm thuần)
├─ locales/             danh mục ngôn ngữ dùng chung (en, vi, …)
├─ schemas/ bin/ scripts/ test/ (test của parser)
└─ docs/  product/ design/ parser/ I18N.md split/ (sinh tự động)
```
Phụ thuộc một chiều: `apps/web → render-core → parser-core`; `apps/web → parser, i18n`. `render-core` không import React hay DOM.
