---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "4. Các spike (câu hỏi và cách làm)"
path: "4. Các spike (câu hỏi và cách làm)"
chunk: 4-cac-spike-cau-hoi-va-cach-lam.md
source_lines: 50-59
source_sha1: c33d54141a
ids: []
---
## 4. Các spike (câu hỏi và cách làm)

Mã spike là mã thử riêng (commit `1ae4887`; đã xoá khỏi cây thư mục khi widget thành chính thức, xem `git show 1ae4887`). Công cụ còn dùng được nằm ở `scripts/notation/` (đo lưới, lượng tử hoá, e2e và xuất trong ứng dụng thật); dữ liệu thử ở thư mục data của scripts/notation (bị bỏ khỏi git). Dữ liệu: tệp mẫu trong `test/fixtures` (kể cả `third-party/`, không commit) và 2 bài của bộ MAESTRO v3 (Google Magenta, **CC BY-NC-SA 4.0**, chỉ dùng để đo, không phân phối lại): Chopin Nocturne Op. 9 No. 2, Bach WTC I Prelude và Fugue La thứ BWV 865.

* **S1** VexFlow ngoài DOM + `RenderContext` ghi lại → display list; so ảnh với VexFlow vẽ thật bằng phông web.
* **S2** Lượng tử hoá trên tệp thật: lỗi cấu trúc, % đúng lưới, sai số, thời gian; đọc ảnh.
* **S3** Hiệu năng trong Worker + `VideoFrame` (như Export), 1920×1080, 4.500 khung, Chromium và Firefox, ba kiểu phát sáng, có/không cache bitmap.
* **S4** Phông viết tay (Petaluma), nét tay tĩnh và boil.
* **S5** Dàn trang tự động và N ô/trang, căn hai khuông.
