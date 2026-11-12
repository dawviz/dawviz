---
doc: I18N.md
doc_title: "Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide"
section: "1. Thêm một ngôn ngữ mới (How to add a language)"
path: "1. Thêm một ngôn ngữ mới (How to add a language)"
chunk: 1-them-mot-ngon-ngu-moi-how-to-add-a-language.md
source_lines: 6-19
source_sha1: a06175f5a4
ids: []
---
## 1. Thêm một ngôn ngữ mới (How to add a language)

1. Sao chép `locales/en.json` thành `locales/<mã>.json`. Mã theo BCP 47: `fr`, `es`, `pt-BR`, `zh-Hans`, `ja`, `ar`...
2. Sửa khối `@meta`:
   ```json
   "@meta": { "code": "fr", "name": "Français", "dir": "ltr", "status": "partial", "translators": ["Tên bạn"] }
   ```
   - `name`: tên ngôn ngữ viết **bằng chính ngôn ngữ đó** (hiện trong danh sách chọn).
   - `dir`: `ltr` hoặc `rtl` (Ả Rập, Do Thái, Ba Tư, Urdu: `rtl`).
   - `status`: `partial` khi dịch chưa đủ (khoá thiếu sẽ tự dùng tiếng Anh), đổi thành `complete` khi đã đủ; khi `complete`, thiếu khoá là lỗi.
3. Dịch **giá trị** (bên phải dấu `:`), **không đổi khoá** (bên trái). Khoá chưa dịch có thể xoá đi; đừng để chuỗi rỗng.
4. Thêm một dòng vào `locales/index.json`: `{ "code": "fr", "name": "Français" }`.
5. `npm run i18n:check` (hoặc `node scripts/check-i18n.mjs fr`) rồi mở pull request.
