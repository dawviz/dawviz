---
doc: COMMUNITY-CONTENT.md
doc_title: "Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp"
section: "3. Định dạng preset kiểu nốt"
path: "3. Định dạng preset kiểu nốt"
chunk: 3-dinh-dang-preset-kieu-not.md
source_lines: 23-44
source_sha1: f89d7ee23f
ids: [REQ-GRAPHICS-07, REQ-STORAGE-02]
---
## 3. Định dạng preset kiểu nốt

```json
{
  "schemaVersion": "0.1.0",
  "kind": "note-style",
  "name": "Neon",
  "author": "DAW Visualizer team",
  "license": "Apache-2.0",
  "description": "Nốt mảnh, phát sáng mạnh, sáng cả khi chờ.",
  "style": { "cornerRadius": 4, "heightScale": 0.7, "glow": 0.9 }
}
```

* `style` là một phần của `NoteStyle` (REQ-GRAPHICS-07): chỉ ghi trường khác mặc định; trường lạ bị bỏ qua, giá trị ngoài miền bị kẹp khi nạp (REQ-STORAGE-02).
* Tệp phải là JSON hợp lệ, dưới 16 KB, tên tệp là slug chữ thường `a-z0-9-`.
* Trường `license` bắt buộc, giá trị SPDX (ví dụ `CC0-1.0`, `Apache-2.0`, `CC-BY-4.0`).

### Gói `.dawviz-preset.zip` (T-24)

Nút **Chia sẻ thành preset…** trong ứng dụng tạo gói gồm `preset.json` (lược đồ [`presets/schema/preset-pack.schema.json`](../../../presets/schema/preset-pack.schema.json): `format`, `formatVersion`, `kind` = `scene` / `note-style` / `easing` / `particle`, `name`, `author`, `license`, `description`, `payload`, `assets`) và thư mục `assets/` (ảnh, SVG, phông) với SHA-256 từng tệp. Kiểm trước khi gửi: `npm run preset:check -- --community <gói>.dawviz-preset.zip`.
