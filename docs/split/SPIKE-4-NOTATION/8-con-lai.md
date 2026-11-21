---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "8. Còn lại"
path: "8. Còn lại"
chunk: 8-con-lai.md
source_lines: 131-135
source_sha1: c33d54141a
ids: [OI-20]
---
## 8. Còn lại

* ~~Giấy phép~~ **chốt 2026-11-21 (chủ dự án, OI-20 (a))**: không cần hỏi thêm Steinberg. OFL 1.1 cho phép chuyển glyph thành đường vẽ và nhúng vào phần mềm; Reserved Font Name chỉ cấm đặt tên bản dẫn xuất trùng tên gốc, và giao diện gọi theo kiểu ("In", "Viết tay", "Cổ điển"). Ghi công ở CREDITS. Bản build phát hành mang văn bản giấy phép: `dist/fonts/OFL-SMuFL-Steinberg.txt` (OFL + dòng bản quyền Steinberg) và `dist/THIRD-PARTY-NOTICES.txt` (giấy phép của mọi gói chạy trong ứng dụng, sinh bởi `scripts/gen-third-party.mjs` sau `vite build`); `packages/render-core/test/fonts.test.ts` kiểm tệp OFL có dòng bản quyền.
* **Mã spike** đã chuyển thành chính thức khi widget hoàn tất (2026-11-21): phần engrave/vẽ nay là `apps/web/src/lib/notation/` và `packages/render-core/src/notation/`; công cụ đo còn lại ở `scripts/notation/` (README ghi cách chạy và cách tải MAESTRO); bản thử cũ (so ảnh S1, trang đo S3, engraver S5) xoá khỏi cây thư mục nhưng giữ trong lịch sử git (`git show 1ae4887`). Kết quả chạy và dữ liệu MAESTRO không commit.
* Dò phách cho nhạc chơi tự do; ký hiệu hợp âm, tên nốt, dấu động, 8va, cuộn ngang; nạp phông SMuFL người dùng; nhận diện điệu thức tốt hơn (trưởng/thứ cùng hoá biểu).
