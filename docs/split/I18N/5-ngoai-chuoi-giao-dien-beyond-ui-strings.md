---
doc: I18N.md
doc_title: "Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide"
section: "5. Ngoài chuỗi giao diện (Beyond UI strings)"
path: "5. Ngoài chuỗi giao diện (Beyond UI strings)"
chunk: 5-ngoai-chuoi-giao-dien-beyond-ui-strings.md
source_lines: 52-57
source_sha1: a06175f5a4
ids: []
---
## 5. Ngoài chuỗi giao diện (Beyond UI strings)

Các phần sau cũng thuộc phạm vi đa ngôn ngữ của sản phẩm (xem SRS v0.3, REQ-I18N-*), sẽ làm khi có giao diện chính:
- **Văn bản trên canvas và video xuất ra** (Track Info, Chord Detection, tên widget): dùng cùng danh mục; cần font có đủ glyph cho chữ viết đó (CJK, Ả Rập, Thái, Devanagari...), nạp bằng `FontFace` trong Worker xuất video.
- **Cách ghi tên nốt/hợp âm** là một thiết lập riêng, không gắn với ngôn ngữ giao diện: `C D E` (mặc định), `Do Re Mi` (La tinh, Pháp, Ý, Việt...), `H` thay `B` (Đức/Bắc Âu), `ハニホ` (Nhật), tên bậc.
- **Tài liệu**: bản dịch của README và hướng dẫn đặt trong `docs/<mã>/`; bản tiếng Việt và tiếng Anh do nhóm giữ cập nhật.
