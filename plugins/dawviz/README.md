# Plugin `dawviz` (skill cho AI agent)

Skill `skills/dawviz/SKILL.md` giúp AI agent làm video bằng DAW Visualizer theo ba cách: chỉ chat (agent viết preset, người dùng dán vào ô **Dán preset**), điều khiển trình duyệt (Claude in Chrome: bấm nút hoặc gọi `window.dawviz`), và terminal (script Playwright `skills/dawviz/scripts/dawviz.mjs`). Quyết định: D-69 (mục skill), task T-113.

- **Cài vào Claude Code:** `/plugin marketplace add dawviz/dawviz` rồi `/plugin install dawviz@dawviz`. Agent khác đọc chuẩn Agent Skills: chép thư mục `skills/dawviz/` vào chỗ skill của agent đó.
- **Chạy script:** `cd skills/dawviz/scripts && npm install`, rồi `node dawviz.mjs --help`.
- **Giữ đồng bộ với app:** `npm run test:tools` kiểm SKILL.md, các preset mẫu (qua bộ kiểm preset cộng đồng) và việc `references/api.md` liệt kê đủ mọi hàm của `window.dawviz` (`apps/web/src/lib/agentApi.ts`). Đổi API, nút hay lược đồ preset thì sửa skill trong cùng PR.
