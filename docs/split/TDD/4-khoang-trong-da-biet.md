---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "4. Khoảng trống đã biết"
path: "4. Khoảng trống đã biết"
chunk: 4-khoang-trong-da-biet.md
source_lines: 55-61
source_sha1: 36a8291014
ids: []
---
## 4. Khoảng trống đã biết
1. Chưa chạy `npm install`/`build`/Vitest cho `apps/web` (xem SDD mục 8). Kỳ vọng lỗi biên dịch nhỏ ở lần đầu.
2. Chưa đo hiệu năng `layoutPianoRoll` với 500.000 nốt (giới hạn của parser) và với 8 track dày.
3. Chưa có test hình ảnh (ảnh chụp so sánh) cho Canvas; để M3 cùng đường ống xuất.
4. Chưa có kiểm thử trợ năng (bàn phím, đọc màn hình) ngoài thuộc tính `role`/`aria-*` cơ bản.
5. Phần trăm độ phủ chưa đo.
