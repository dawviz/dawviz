---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "1. Chiến lược"
path: "1. Chiến lược"
chunk: 1-chien-luoc.md
source_lines: 7-22
source_sha1: 21a6598042
ids: [AT-18]
---
## 1. Chiến lược

| Tầng | Công cụ | Chạy ở đâu | Trạng thái |
|---|---|---|---|
| Parser (66) | `node --test` | Node | Đã chạy, xanh |
| Render Core (5) | `node --test` (Node ≥ 22.18 chạy trực tiếp `.ts`) | Node | Đã chạy, xanh |
| Logic ứng dụng (4): đồng hồ, dịch lỗi | `node --test` | Node | Đã chạy, xanh |
| Thành phần giao diện (3) | Vitest + Testing Library + jsdom | Máy có `npm install` | **Chưa chạy** (môi trường tạo gói không cài được thư viện) |
| Kiểu (TypeScript) | `tsc` | `render-core`: đã chạy sạch lỗi; `apps/web`: chưa chạy | Xem trên |
| i18n | `npm run i18n:check` | Node | Đã chạy, xanh |
| Trình duyệt thật | Thủ công trên Chrome (AT-18) | Máy người dùng | Chưa |

Nguyên tắc: logic quyết định hình ảnh nằm trong hàm thuần để test bằng Node nhanh và tất định; test giao diện chỉ kiểm dây nối (sự kiện, văn bản), không kiểm pixel.

Lệnh: `npm test` (parser + render + logic web), `npm run test:components` (Vitest), `npm run typecheck`, `npm run i18n:check`, `npm run docs:check`.
