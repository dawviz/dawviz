---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "2. Build và kiểm tra trên máy bạn"
path: "2. Build và kiểm tra trên máy bạn"
chunk: 2-build-va-kiem-tra-tren-may-ban.md
source_lines: 23-39
source_sha1: 02fa1bd49a
ids: []
---
## 2. Build và kiểm tra trên máy bạn

```bash
cd dawviz
npm install                 # tạo package-lock.json và liên kết các package trong monorepo
npm test                    # kỳ vọng: parser 66 (21 bị bỏ qua nếu thiếu test/fixtures/third-party/), render-core 12, logic web 9, docs-site 6
npm run i18n:check          # "danh mục ngôn ngữ hợp lệ"
npm run typecheck           # tsc cho apps/web (đã xanh từ 2026-11-12; nếu lỗi xem mục 6)
npm run build               # build Vite vào apps/web/dist
npm run test:components     # Vitest + Testing Library (4 test)
npm run docs:sync           # tách tài liệu, sinh SKELETON và mục lục; phải kết thúc "đạt"
npm run docs:site           # dựng trang tài liệu vào dist-docs/
npm run dev                 # chạy thử ứng dụng ở http://localhost:5173, thả file mẫu như test/fixtures/BigProject4b.rpp
```

`apps/web` đã build và qua test lần đầu ngày 2026-11-12. Nếu máy bạn báo lỗi, sửa **trước khi** commit để lịch sử sạch.
