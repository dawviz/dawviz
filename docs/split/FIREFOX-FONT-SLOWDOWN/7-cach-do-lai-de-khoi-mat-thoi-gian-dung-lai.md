---
doc: FIREFOX-FONT-SLOWDOWN.md
doc_title: "Firefox xuất chậm dần: điều tra và cách giảm nhẹ"
section: "7. Cách đo lại (để khỏi mất thời gian dựng lại)"
path: "7. Cách đo lại (để khỏi mất thời gian dựng lại)"
chunk: 7-cach-do-lai-de-khoi-mat-thoi-gian-dung-lai.md
source_lines: 71-78
source_sha1: a549031f0a
ids: []
---
## 7. Cách đo lại (để khỏi mất thời gian dựng lại)

Dựng một trang thử trong `apps/web/.bench/` (đừng commit) chạy chính `workers/export.worker.ts` hoặc bản sao có bấm giờ, dự án mẫu `test/fixtures/BigProject4.rpp` chia thành 15 track, `sceneForStyle('paper', …)`, `start = 20`, `duration = 150`, rồi `vite --port 5199`. Báo số về một server HTTP nhỏ trên cổng khác bằng `fetch` (POST).

- **Chrome:** `google-chrome --headless=new --remote-debugging-port=… --user-data-dir=…`, mở trang qua `/json/new` và đọc `document.title` bằng CDP (`ws` đã có trong `node_modules`).
- **Firefox (snap):** `firefox --headless --no-remote --new-instance --profile <thư mục>`. Thư mục hồ sơ phải nằm trong `~/snap/firefox/common/` (snap bị giới hạn quyền, `/tmp` không dùng được). **Mỗi lần chạy dùng hồ sơ mới**: dùng lại thì Firefox khôi phục phiên và mở lại URL cũ (đã gây nhầm kết quả).
- Bấm giờ riêng `renderFrame` (vẽ) và `await video.add` (mã hoá), báo theo cửa sổ 300 khung. Chỉ nhìn trung bình toàn bài sẽ **không thấy** xu hướng tăng.
- Bẫy khi viết script điều khiển: `pkill -f` / `pgrep -f` khớp cả dòng lệnh của chính shell chứa mẫu đó và giết nó (mã thoát 144); chạy lâu thì dùng `setsid` + tệp kết quả, không chờ trong lệnh tiền cảnh; hai lần chạy dùng chung cổng nhận kết quả sẽ lẫn.
