---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "3. Tạo repo trên GitHub"
path: "3. Tạo repo trên GitHub"
chunk: 3-tao-repo-tren-github.md
source_lines: 40-47
source_sha1: 02fa1bd49a
ids: []
---
## 3. Tạo repo trên GitHub

1. Vào github.com → **New repository**. Đặt tên (ví dụ `dawviz`), chọn Public.
2. **Đừng tick** "Add a README", "Add .gitignore", "Choose a license" (repo đã có sẵn; tick sẽ làm hai lịch sử xung đột).
3. Bấm Create. Copy địa chỉ repo, dạng `https://github.com/<tên>/<repo>.git`.

Hoặc dùng GitHub CLI: `gh repo create <repo> --public --source=. --remote=origin` (sau bước 4 bên dưới).
