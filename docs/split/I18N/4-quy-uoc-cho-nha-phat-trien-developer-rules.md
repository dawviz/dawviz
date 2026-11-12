---
doc: I18N.md
doc_title: "Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide"
section: "4. Quy ước cho nhà phát triển (Developer rules)"
path: "4. Quy ước cho nhà phát triển (Developer rules)"
chunk: 4-quy-uoc-cho-nha-phat-trien-developer-rules.md
source_lines: 43-51
source_sha1: a06175f5a4
ids: []
---
## 4. Quy ước cho nhà phát triển (Developer rules)

- Mọi chuỗi hiển thị phải qua `t('khoá', {tham_số})` hoặc thuộc tính `data-i18n="khoá"`; không viết chữ cứng trong HTML/JS. Khoá viết thường, phân cấp bằng dấu chấm: `nhóm.mục`.
- Thêm khoá vào `en.json` **và** `vi.json` cùng lúc. `en.json` là nguồn; mọi khoá mới phải có ở đó.
- Không ghép chuỗi bằng `+`; dùng tham số. Số và thời lượng định dạng bằng `i18n.number()`/`Intl`, không tự thêm dấu phân cách.
- Dùng thuộc tính CSS logic (`margin-inline-start`, `text-align:start`) và `dir` của `<html>` để sẵn sàng cho ngôn ngữ viết từ phải sang trái.
- `npm run i18n:check` kiểm: JSON hợp lệ, `@meta`, đủ khoá (khi `complete`), không khoá thừa, không chuỗi rỗng, tham số khớp bản gốc, nhánh số nhiều hợp lệ, khoá dùng trong mã nguồn đều có trong `en.json`, khoá không còn dùng.
- Chọn ngôn ngữ: lưu lựa chọn người dùng (`localStorage`, có `try/catch`), nếu chưa có thì `navigator.languages` khớp theo chuỗi `vi-VN → vi`, cuối cùng dùng `en`.
