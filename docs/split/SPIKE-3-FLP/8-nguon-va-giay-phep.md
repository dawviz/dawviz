---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "8. Nguồn và giấy phép"
path: "8. Nguồn và giấy phép"
chunk: 8-nguon-va-giay-phep.md
source_lines: 105-107
source_sha1: 2763624485
ids: []
---
## 8. Nguồn và giấy phép

Bố cục sự kiện và cấu trúc byte (id sự kiện, kích thước nốt/clip, các giá trị đánh dấu) được đối chiếu với mô tả công khai của dự án [DAWVert](https://github.com/SatyrDiamond/DawVert) (GPL-3.0-or-later) và kiểm lại trên tệp thật `big roar.flp` bằng bộ giải mã độc lập. **Không sao chép mã**: schema JSON và engine do dự án tự viết; DAWVert được ghi công trong [CREDITS.md](../../../CREDITS.md). Tệp `big roar.flp` là tệp bên thứ ba **không commit** (nằm trong `test/fixtures/third-party/`, bị `.gitignore`); test dùng nó tự bỏ qua khi thiếu, còn bộ test chính chạy trên FLP tổng hợp do `test/helpers.mjs` dựng.
