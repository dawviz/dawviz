---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "2. Vì sao TLV vẫn vừa JSON schema"
path: "2. Vì sao TLV vẫn vừa JSON schema"
chunk: 2-vi-sao-tlv-van-vua-json-schema.md
source_lines: 12-19
source_sha1: a703402bcf
ids: []
---
## 2. Vì sao TLV vẫn vừa JSON schema

FLP là chuỗi sự kiện `[id u8][giá trị]`, kiểu giá trị suy từ `id`: dưới 64 là 1 byte, dưới 128 là 2 byte, dưới 192 là 4 byte, từ 192 trở lên là chuỗi byte có độ dài varint (LEB128). Trong schema:

* `Event` = `id` + `switch` theo một biểu thức phân loại (`id < 64 ? 'b1' : …`) chọn kiểu giá trị. Phần lớn sự kiện chỉ cần *bỏ qua* (`skip`): các khối plugin (`212`, `213`) không được giải mã, đúng triết lý "không hỗ trợ plugin": chỉ đọc cái visualizer cần.
* Chỉ giải mã 5 loại: phiên bản (`199`), chuỗi UTF-16 (`193`, `194`, `196`, `203`), nốt Pattern (`224`, mỗi nốt 24 byte), clip Playlist (`233`, 32 byte, hoặc 60 byte từ FL 20.99), và các số nguyên cần dùng (tempo `156`, nhịp `17`/`18`, pattern hiện tại `65`, kênh hiện tại `64`, loại kênh `21`, bật/tắt kênh `0`).
* Chỉ đọc tới đây là phiên bản **đọc được mọi dự án FL ≥ 12** mà không cần biết plugin nào có mặt.
