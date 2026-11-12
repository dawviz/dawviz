---
doc: I18N.md
doc_title: "Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide"
section: "3. Nhóm khoá (Key groups)"
path: "3. Nhóm khoá (Key groups)"
chunk: 3-nhom-khoa-key-groups.md
source_lines: 32-42
source_sha1: a06175f5a4
ids: []
---
## 3. Nhóm khoá (Key groups)

| Tiền tố | Nội dung |
|---|---|
| `app.*`, `lang.*`, `file.*`, `btn.*`, `opt.*`, `th.*`, `out.*` | nhãn, nút, bảng, kết quả |
| `tempo.*`, `pack.*`, `midi.*`, `schema.*`, `notice.*` | khối ghi đè BPM, chọn `.als` trong `.alp`, thông báo cần thêm file |
| `errors.ERR_*` | thông báo lỗi cho người dùng, theo **mã lỗi** của thư viện |
| `warn.WARN_*` | thông báo cảnh báo, theo **mã cảnh báo** của thư viện |

Thư viện parser trả về `code` + `message`. `message` là chuỗi **kỹ thuật cho nhà phát triển** (hiện bằng tiếng Việt), được giao diện đặt trong mục "chi tiết kỹ thuật"; người dùng đọc bản dịch của `code`. Vì vậy thêm mã lỗi/cảnh báo mới ở thư viện thì phải thêm khoá `errors.*`/`warn.*` tương ứng vào `en.json` và `vi.json`.
