---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "4. Commit đầu tiên"
path: "4. Commit đầu tiên"
chunk: 4-commit-dau-tien.md
source_lines: 48-67
source_sha1: 02fa1bd49a
ids: []
---
## 4. Commit đầu tiên

```bash
git init -b main
git config user.name  "Tên của bạn"
git config user.email "<id>+<username>@users.noreply.github.com"   # email ẩn của GitHub, tránh lộ email thật (Settings → Emails)

git add -A
git status --short | head -60          # SOÁT LẠI: không có node_modules/, dist/, dist-docs/, .env
git diff --cached --stat | tail -3     # tổng số tệp/dòng; mong đợi vài trăm tệp
git commit -m "chore: initial import — parser, render-core, web app, docs"

git remote add origin https://github.com/<tên>/<repo>.git
git push -u origin main
```

Nếu bạn muốn lịch sử gọn theo phần (tùy chọn): commit riêng lần lượt `LICENSE` + cấu hình gốc, `packages/`, `apps/web`, `docs/` + tài liệu gốc + `scripts/`. Một commit "initial import" cũng hoàn toàn bình thường.

Không dùng `git add -f` để ép thêm tệp bị `.gitignore` loại. Nếu `git push` hỏi mật khẩu: dùng Personal Access Token hoặc `gh auth login`.
