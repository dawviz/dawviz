---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "6. Lỗi thường gặp khi build lần đầu"
path: "6. Lỗi thường gặp khi build lần đầu"
chunk: 6-loi-thuong-gap-khi-build-lan-dau.md
source_lines: 77-92
source_sha1: 02fa1bd49a
ids: []
---
## 6. Lỗi thường gặp khi build lần đầu

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `npm test` báo `Unknown file extension ".ts"` | Node cũ hơn 22.18 | Cài Node 22 LTS mới nhất (`node -v`) |
| `Cannot find module '@dawviz/…'` | Chưa `npm install` ở **thư mục gốc**, hoặc chạy trong thư mục con | Chạy `npm install` ở gốc; kiểm tra `node_modules/@dawviz/` có các liên kết |
| `tsc` báo lỗi kiểu ở `apps/web` | Lần đầu chạy kiểu thật với `@types/react`; chỗ hay gặp: kiểu của `framer-motion`, `ParseResponse`, ref canvas | Sửa theo thông báo; kiểu cho gói JS khai báo ở `apps/web/src/types/dawviz.d.ts` |
| Vite báo không tìm thấy `locales/*.json` | Đường dẫn import từ `apps/web/src/i18n/I18nProvider.tsx` | Phải là `../../../../locales/…`; `vite.config.ts` đã cho phép đọc ngoài thư mục `apps/web` |
| Worker không chạy / lỗi import trong Worker | Trình duyệt cũ hoặc build chưa bật module worker | Dùng Chrome/Edge mới; `vite.config.ts` có `worker: { format: 'es' }` |
| Tailwind không có style | `tailwind.config.js` `content` sai hoặc `index.css` không nạp | Kiểm tra `content: ['./index.html','./src/**/*.{ts,tsx}']` và `import './index.css'` ở `main.tsx` |
| `npm run docs:sync` báo "không chạy được split_doc.py" | Không có `python3` | Cài Python ≥ 3.8 (Windows: `py`; đặt alias `python3`) |
| `docs:check` báo SKELETON/mục lục "đã cũ" | Đổi mã hoặc tài liệu mà chưa đồng bộ | Chạy `npm run docs:sync` rồi commit kết quả |
| Khác biệt xuống dòng trên Windows | CRLF | `.gitattributes` ép LF; nếu đã lỡ, `git add --renormalize .` |
| Workflow Docs báo `Get Pages site failed ... Not Found` | Repo chưa bật GitHub Pages | Settings → Pages → Source = **GitHub Actions**, rồi Actions → Docs site → Re-run |
| CI báo `Chạy 'npm run docs:sync' rồi commit kết quả` và `git diff` có `SKELETON.md` | `SKELETON.md`/mục lục đã commit không khớp bản sinh trên máy chủ (ví dụ cây thư mục lúc đó còn `dist-docs/` hoặc thiếu `package-lock.json`) | Kéo bản mới nhất, `npm run docs:sync`, commit lại các tệp sinh ra. Từ bản này `dist-docs/` và `package-lock.json` không còn nằm trong cây thư mục |
