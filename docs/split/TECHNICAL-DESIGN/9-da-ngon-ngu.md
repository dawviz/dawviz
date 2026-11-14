---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "9. Đa ngôn ngữ 🟢"
path: "9. Đa ngôn ngữ 🟢"
chunk: 9-da-ngon-ngu.md
source_lines: 409-411
source_sha1: ce30ea1fc1
ids: []
---
## 9. Đa ngôn ngữ 🟢
Danh mục phẳng `locales/<mã>.json` (`{tham_số}`, `{n, plural, one {#…} other {#…}}` qua `Intl.PluralRules`), chuỗi dự phòng `vi-VN → vi → en → khoá`. Lỗi và cảnh báo dịch **theo mã** (`errors.ERR_*`, `warn.WARN_*`), thông điệp gốc của thư viện hiện trong "Chi tiết kỹ thuật". Kiểm bằng `npm run i18n:check` (thiếu khoá, tham số lệch, khoá thừa). Canvas dùng cùng `i18n` để dịch nhãn trong widget (font phải có glyph của ngôn ngữ). Cộng đồng thêm ngôn ngữ: `docs/I18N.md`.
