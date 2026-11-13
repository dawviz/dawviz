# Tệp mẫu (fixtures) dùng cho test

Có hai nhóm, theo quyền phân phối:

## 1. Được commit (trong `test/fixtures/`)

| Tệp | Dùng cho | Nguồn và quyền |
|---|---|---|
| `BigProject3.rpp`, `BigProject4.rpp`, `BigProject4b.rpp`, `BigProjectDemo2.rpp` | Reaper: MIDI nhúng, take/loop, `.mid` ngoài, `HASDATA`, nhịp 12/8, `IGNTEMPO`, envelope | **Do người duy trì tự tạo** (xác nhận của chủ repo). Theo Apache-2.0 như phần còn lại của repo. |

Lưu ý: `BigProject3.rpp` tham chiếu `Oboe_MIDI_001.mid` (thuộc nhóm 2), nên test dùng cặp này bị bỏ qua khi thiếu tệp `.mid`.

## 2. KHÔNG commit (thư mục `test/fixtures/third-party/`, bị `.gitignore`)

Các tệp này do bên thứ ba tạo, hoặc chưa rõ nguồn; **chưa có giấy phép cho phép phân phối lại**, nên không đưa lên repo công khai. Người duy trì tự đặt chúng vào thư mục này để chạy đủ bộ test; thiếu tệp thì test liên quan được **bỏ qua** (`skip`), không thất bại.

| Tệp | Dùng cho | Nguồn (theo người duy trì) | Tình trạng quyền |
|---|---|---|---|
| `Demo.als` | Ableton `.als` (Live 12.4.16) | Dự án demo đi kèm Ableton Live | Nội dung của Ableton; chưa xác nhận được phép phân phối lại |
| `ode_to_zb.RPP`, `prutypils.rpp`, `siderite_oneD-8.RPP`, `tmf-small.RPP`, `youdreamarked-midi.RPP` | Reaper: dự án mẫu | Trang "REAPER Projects" của Cockos (https://www.cockos.com/reaper/samples.php) | Trang không nêu giấy phép hay tác giả; **chưa có quyền phân phối lại** |
| `Oboe_MIDI_001.mid` | `.mid` ngoài do `BigProject3.rpp` tham chiếu | Chưa rõ | Chưa rõ |
| `bitwig-5.0-example.project.xml` | DAWproject (XML) | Chưa rõ | Chưa rõ |
| `reaper-doc-sample.txt` | Đoạn cú pháp `IGNTEMPO` (không phải `.rpp` hợp lệ) | Trích tài liệu Reaper | Chưa rõ |

Về `.alp`: repo **không có tệp `.alp` thật**; test `.alp` dựng gói `pl-a` tổng hợp ngay trong `test/midi-alp.test.js`. Nếu muốn thêm tệp `.alp` tải miễn phí làm tệp mẫu, hãy đặt vào `third-party/` và ghi nguồn vào bảng trên, trừ khi trang tải nêu rõ cho phép phân phối lại.

## Muốn đưa một tệp vào nhóm 1

Chỉ khi bạn có quyền phân phối (tự tạo, hoặc giấy phép cho phép, ví dụ liên hệ Cockos xin phép bằng văn bản). Khi đó chuyển tệp ra khỏi `third-party/`, bỏ tên khỏi `THIRD_PARTY` trong `test/helpers.mjs`, và ghi nguồn, tác giả, giấy phép vào bảng nhóm 1 trong cùng pull request. Ưu tiên tệp nhỏ.

## Tệp mẫu tự sinh (`generate-synthetic.mjs`)

Để thử giao diện với dữ liệu khó (16 track tên rất dài có tiếng Việt, dự án tham chiếu 9 tệp `.mid` ngoài) mà không dính bản quyền: `node test/fixtures/generate-synthetic.mjs` ghi vào `test/fixtures/generated/`. Thư mục này nằm trong `.gitignore` (sinh lại bất cứ lúc nào, hạt giống cố định nên lần nào cũng ra đúng cùng tệp); chỉ script được commit. Nguồn tự tạo, không có bên thứ ba.
