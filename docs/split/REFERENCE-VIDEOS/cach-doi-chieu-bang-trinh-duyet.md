---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Cách đối chiếu bằng trình duyệt"
path: "Cách đối chiếu bằng trình duyệt"
chunk: cach-doi-chieu-bang-trinh-duyet.md
source_lines: 12-20
source_sha1: 9a4c7b7f41
ids: []
---
## Cách đối chiếu bằng trình duyệt

```bash
cd apps/web && npx vite --port 5311 &              # hoặc thêm --serve vào lệnh dưới
node scripts/references/shot.mjs presets/scene/dark-score-16x9.json --times 0:20,0:40 --out references/shots
```

Script mở ứng dụng bằng Playwright, nạp dự án (mặc định `test/fixtures/BigProject4.rpp`), nhập preset ở cột Phong cách rồi chụp canvas ở các mốc. Đặt ảnh chụp cạnh khung tham chiếu để chỉnh. Fixture không có âm thanh nên các visualizer âm thanh (cột, sóng) không hiện trong ảnh chụp; kiểm riêng bằng dự án có audio.
