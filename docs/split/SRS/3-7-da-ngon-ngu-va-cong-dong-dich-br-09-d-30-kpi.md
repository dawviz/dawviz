---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.7. Đa ngôn ngữ và cộng đồng dịch (BR-09, D-30, KPI-08)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.7. Đa ngôn ngữ và cộng đồng dịch (BR-09, D-30, KPI-08)"
chunk: 3-7-da-ngon-ngu-va-cong-dong-dich-br-09-d-30-kpi.md
source_lines: 813-827
source_sha1: 3d043a49c8
ids: [BR-09, D-30, KPI-08, OI-13]
---
### 3.7. Đa ngôn ngữ và cộng đồng dịch (BR-09, D-30, KPI-08)

Triển khai tham chiếu: package `@dawviz/i18n`, thư mục `locales/`, `scripts/check-i18n.mjs`, hướng dẫn `docs/I18N.md`; trang demo đã dùng đầy đủ.

* **REQ-I18N-01:** mọi chuỗi giao diện nằm trong `locales/<mã BCP 47>.json` (JSON phẳng, khoá `nhóm.mục`, khối `@meta`: `code`, `name` bằng chính ngôn ngữ đó, `dir`, `status` ∈ `source|complete|partial`, `translators`). `en` là nguồn, `vi` đầy đủ. Không có chữ cứng trong HTML/JS.
* **REQ-I18N-02:** cú pháp chuỗi `{tham_số}` và `{n, plural, one {#…} other {#…}}` theo `Intl.PluralRules` (nhánh `other` bắt buộc); không ghép câu bằng cách nối chuỗi; số, thời lượng định dạng theo locale; dự phòng `vi-VN → vi → en → khoá`, chuỗi thiếu được ghi lại.
* **REQ-I18N-03:** mã lỗi và cảnh báo (Phụ lục A, A2) dịch theo **mã** (`errors.ERR_*`, `warn.WARN_*`); `message` gốc của thư viện parser là thông điệp kỹ thuật cho nhà phát triển, hiện trong mục "chi tiết kỹ thuật". Mã mới phải kèm khoá dịch.
* **REQ-I18N-04:** thứ tự chọn ngôn ngữ: lựa chọn đã lưu → `navigator.languages` → `en`; đổi ngôn ngữ không tải lại trang; `<html lang>` và `dir` cập nhật; lưu lựa chọn bằng `localStorage` có `try/catch`.
* **REQ-I18N-05:** bộ kiểm tự động (`npm run i18n:check`) chặn: JSON sai, thiếu/thừa khoá, chuỗi rỗng, tham số khác bản gốc, nhánh số nhiều không tồn tại trong ngôn ngữ, khoá dùng trong mã mà không có trong `en.json`, locale chưa vào `index.json`. Ngôn ngữ `partial` được thiếu khoá.
* **REQ-I18N-06:** quy trình đóng góp: thêm file `<mã>.json` và một dòng `locales/index.json`, không sửa mã; người bảo trì duyệt; tên người dịch ghi trong `@meta.translators` (OI-13).
* **REQ-I18N-07 (video xuất ra):** văn bản trên canvas và video (Track Info, Chord Detection, tên widget do người dùng đặt) dùng cùng từ điển và phải hiển thị được chữ viết của ngôn ngữ đó: font có đủ glyph (Latin mở rộng/Việt, CJK, Ả Rập, Thái, Devanagari...) nạp bằng `FontFace` trong Worker xuất video (Spike 1: nạp font trong Worker hoạt động); chữ từ phải sang trái và ký tự ghép dùng `canvas.direction` và `fontKerning` phù hợp **[VERIFY]**; khi font thiếu glyph, báo cho người dùng thay vì xuất ô vuông.
* **REQ-I18N-08 (cách ghi tên nốt/hợp âm):** thiết lập riêng, không gắn với ngôn ngữ giao diện: `C D E` (mặc định), `Do Re Mi`, `H` thay `B`, `ハニホ`, tên bậc. Áp dụng cho Piano Roll, Chord Detection, Key Detection và các widget hiển thị tên nốt; lưu trong cấu hình/Preset và Project Pack.
* **Giao diện hướng phải-sang-trái:** CSS dùng thuộc tính logic (`margin-inline-*`, `text-align:start`), bố cục canvas thiết kế theo toạ độ logic nên không bị đảo; hỗ trợ RTL đầy đủ không thuộc v1.0 nhưng không được chặn bởi cách viết CSS.
