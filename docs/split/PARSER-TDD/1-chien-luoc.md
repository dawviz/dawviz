---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "1. Chiến lược"
path: "1. Chiến lược"
chunk: 1-chien-luoc.md
source_lines: 5-17
source_sha1: 42e0660dc8
ids: []
---
## 1. Chiến lược

| Tầng | Mục tiêu | Cách làm |
|---|---|---|
| Đơn vị / tích hợp theo package | Đúng nghiệp vụ từng định dạng | `node:test` + dữ liệu tự dựng (builder MIDI/ZIP/XML trong `test/helpers.mjs`) |
| Đối chứng độc lập | Bắt lỗi công thức | Viết lại phép tính bằng cách khác (ví dụ oracle clip Ableton) và so từng nốt trên **file thật** |
| Kiểm chứng file thật | Xác nhận giả định [VERIFY] | `test/fixtures/` (Demo.als, 5 template Reaper, Bitwig `project.xml` mẫu) |
| An toàn | Chống DoS/XXE/zip-slip/schema độc | Test âm tính cố ý |
| Bundle | Bản phát hành chạy được như bản nguồn | Dựng bundle rồi so kết quả |
| Trình duyệt | Worker + bundle + giao diện | Playwright thủ công (xem §6) |

Chạy: `npm test` (= `node --test test/*.test.js`). Không dùng `node --test test/` vì sẽ nhặt cả `helpers.mjs`.
