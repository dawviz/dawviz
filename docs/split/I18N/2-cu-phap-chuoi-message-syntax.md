---
doc: I18N.md
doc_title: "Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide"
section: "2. Cú pháp chuỗi (Message syntax)"
path: "2. Cú pháp chuỗi (Message syntax)"
chunk: 2-cu-phap-chuoi-message-syntax.md
source_lines: 20-31
source_sha1: a06175f5a4
ids: []
---
## 2. Cú pháp chuỗi (Message syntax)

| Cú pháp | Ý nghĩa | Ví dụ |
|---|---|---|
| `{tên}` | tham số, **giữ nguyên tên**, chỉ dịch phần chữ xung quanh | `"Xin chào {name}"` |
| `{n, plural, one {# tệp} other {# tệp}}` | số nhiều theo quy tắc của ngôn ngữ (`zero one two few many other`), `#` = số đã định dạng | Nga cần `one few many other`; Việt chỉ cần `other` |
| `=0 {không có}` | nhánh cho đúng một giá trị | `{n, plural, =0 {none} one {# file} other {# files}}` |

- Nhánh `other` luôn bắt buộc. Chỉ dùng các nhánh mà ngôn ngữ của bạn có (bộ kiểm tra báo lỗi nếu dùng nhánh không tồn tại, ví dụ `one` trong tiếng Việt).
- Không đưa HTML hay Markdown vào chuỗi; không ghép câu từ nhiều chuỗi (thứ tự từ mỗi ngôn ngữ một khác).
- Giữ nguyên tên kỹ thuật: `.als`, `.rpp`, `BPM`, `PPQ`, `tick`, tên DAW.
