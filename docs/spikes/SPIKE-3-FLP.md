# Spike 3: đọc `.flp` (FL Studio) bằng JSON schema

> Ngày 2026-11-18. Câu hỏi của chủ dự án: định dạng `.flp` là dòng sự kiện TLV; engine parser nhị phân theo JSON schema (D-28) có làm được không, hiệu năng có ổn không, hay phải dùng cách khác? Kết quả dẫn tới D-62 (đưa `.flp` vào 1.0, thay D-19 cho FL Studio 12 trở lên).

## 1. Kết luận

* **Làm được, bằng JSON.** Schema dựng sẵn [`schemas/flp.schema.json`](../../schemas/flp.schema.json) (khoảng 150 dòng) đọc dòng sự kiện TLV và ánh xạ sang Unified AST; không có mã riêng cho FL Studio trong `packages/*`.
* **Hiệu năng tốt.** Tệp thật `big roar.flp` (7,6 MB, FL 12.3, 6.871 sự kiện, 2.150 nốt hiển thị): **đọc cấu trúc 9–38 ms, cả `parseProject` khoảng 50 ms**. Tệp tổng hợp 100.000 nốt: 210 ms. Vượt trần 500.000 nốt thì báo `ERR_AST_TOO_LARGE` trong dưới 1 giây.
* **Đúng.** Số nốt từng kênh khớp 100% với bộ giải mã viết tay độc lập (790, 44, 32, 410, 302, 410, 162 = 2.150).
* **Không cần định dạng khác.** Phần JSON không đủ nằm ở bước *ánh xạ sang AST* chứ không ở bước đọc TLV; đã bổ sung bốn tính năng chung (mục 3), không riêng cho FL.

## 2. Vì sao TLV vẫn vừa JSON schema

FLP là chuỗi sự kiện `[id u8][giá trị]`, kiểu giá trị suy từ `id`: dưới 64 là 1 byte, dưới 128 là 2 byte, dưới 192 là 4 byte, từ 192 trở lên là chuỗi byte có độ dài varint (LEB128). Trong schema:

* `Event` = `id` + `switch` theo một biểu thức phân loại (`id < 64 ? 'b1' : …`) chọn kiểu giá trị. Phần lớn sự kiện chỉ cần *bỏ qua* (`skip`): các khối plugin (`212`, `213`) không được giải mã, đúng triết lý "không hỗ trợ plugin": chỉ đọc cái visualizer cần.
* Chỉ giải mã 5 loại: phiên bản (`199`), chuỗi UTF-16 (`193`, `194`, `196`, `203`), nốt Pattern (`224`, mỗi nốt 24 byte), clip Playlist (`233`, 32 byte, hoặc 60 byte từ FL 20.99), và các số nguyên cần dùng (tempo `156`, nhịp `17`/`18`, pattern hiện tại `65`, kênh hiện tại `64`, loại kênh `21`, bật/tắt kênh `0`).
* Chỉ đọc tới đây là phiên bản **đọc được mọi dự án FL ≥ 12** mà không cần biết plugin nào có mặt.

## 3. Điều JSON chưa làm được và bốn bổ sung cho engine

FLP có **trạng thái ngầm**: nốt (`224`) thuộc "pattern hiện tại" đặt bởi sự kiện `65` đứng trước; tên (`203`) thuộc kênh hiện tại (`64`), nhưng sau `236` (bắt đầu mixer) cùng id `203` lại là tên khe hiệu ứng. Playlist chỉ *tham chiếu* pattern, nên nốt thật phải ghép (join) pattern với clip. Engine cũ chỉ có `each` một tầng và không nhớ gì giữa các phần tử mảng. Bổ sung (đều chung, có test ở `test/binary.test.js`, mô tả ở `schemas/README.md`):

| Bổ sung | Dùng để |
|---|---|
| `$last` trong phần tử mảng | mang "trạng thái chạy": `pat = id == 65 ? v : ($last.pat \|\| 0)` |
| `ast.index` (`list` / `collect` / theo khoá) | dựng bảng tra một lần, rồi `chName[ch]`, `notesBy[pattern*65536+rack]` thay vì quét lồng nhau |
| `inner` lồng trong `each` | kiểu flatMap: với mỗi clip, duyệt nốt của pattern nó trỏ tới |
| `ast.warnings[]`, `ast.sourceFormat`, `sourceVersion`, hàm `splitNum`, `basename` | báo điều bị bỏ (`WARN_FLP_CLIPS_SKIPPED`), ghi tên định dạng/phiên bản, đọc "12.3.0.72", lấy tên mẫu làm tên kênh dự phòng |

Mọi bổ sung giữ nguyên ràng buộc an toàn của D-28: không `eval`, hàm trong danh sách trắng, ngân sách phép tính, giới hạn nút và độ sâu. Mô hình trạng thái chạy không tốn bộ nhớ ngoài (mỗi sự kiện mang vài số nguyên).

## 4. Mô hình ánh xạ (quyết định)

* **Track = kênh nhạc cụ (Channel Rack)**, không phải làn Playlist. Lý do: nốt FL gắn với kênh (`rack`); tên kênh ("Massive", "Serum") có nghĩa với người xem, còn làn Playlist chỉ là chỗ xếp clip. Kênh âm thanh (loại 4) và kênh automation (loại 5) không có nốt nên bị bỏ; kênh Layer (loại 3) vẫn thành track để không mất nốt thầm lặng.
* **Chỉ Playlist của arrangement đầu tiên (`arr == 0`) và chỉ clip Pattern** (như D-44: Ableton chỉ đọc Arrangement). Nốt của Pattern chưa xếp lên Playlist không phát nên không hiện. Kênh tắt (sự kiện `0` = 0) thành track "tắt tiếng", hiện khi bật *Hiện track tắt*.
* **Clip**: vị trí `pos`, độ dài `len`, `startoffset` (`so`, bỏ giá trị đánh dấu `0xFFFFFFFF` và `0xBF800000`) dời nốt; nốt bắt đầu trước `so` hoặc sau cuối clip bị bỏ, độ dài nốt bị cắt ở cuối clip. Clip tắt tiếng (cờ `0x1000`) bỏ.
* **Tick**: PPQ lấy từ header (thường 96) rồi quy ra 960 như mọi nguồn khác. **Tempo** = sự kiện `156` / 1000 (một điểm); **nhịp** từ `17`/`18`.
* **Chuỗi**: UTF-16LE (FL ≥ 12). Phiên bản dưới 12 bị từ chối (`ERR_AST_INVALID`, nêu rõ cần ≥ 12), như tham chiếu.

## 5. Giới hạn đã biết (cần tệp mẫu hoặc quyết định để mở)

| Mã | Giới hạn | Trạng thái |
|---|---|---|
| FLP-L1 | **Pattern lặp trong clip dài:** kéo dài clip Pattern trên Playlist thì FL lặp lại nội dung pattern. Tệp FLP không lưu độ dài pattern; hiện **không lặp**, nốt chỉ hiện một lần trong khoảng `[startoffset, startoffset+len)` | **[VERIFY]** cần đối chiếu với FL thật; dự định suy độ dài từ nốt cuối làm tròn ô nhịp |
| FLP-L2 | **Tempo thay đổi:** chỉ đọc tempo ban đầu. Clip automation tempo đã giải mã được nhưng **công thức giá trị → BPM chưa kiểm được**: công thức 10 + 512·v (DAWVert) cho 300 BPM trên clip "Tempo" của `big roar.flp` trong khi tempo dự án là 128, nên không đưa vào (sai tempo làm lệch cả video). Người dùng ghi đè tempo nếu cần (D-24) | **[VERIFY]** cần dự án FL có tempo automation biết trước giá trị |
| FLP-L3 | **Layer:** nốt gửi vào kênh Layer hiện ở track Layer, chưa nhân bản sang các kênh con | chấp nhận |
| FLP-L4 | **Chế độ Pattern (chưa xếp Playlist):** dự án không có clip Pattern thì báo `ERR_NO_NOTES`; người dùng kéo Pattern vào Playlist hoặc xuất MIDI | chấp nhận |
| FLP-L5 | **Nhiều arrangement (FL 20+):** chỉ arrangement `0` | **[VERIFY]** |
| FLP-L6 | **Ngữ nghĩa sự kiện `0` (kênh bật/tắt)** suy từ mô tả của bên thứ ba, chưa đối chiếu với hai tệp FL khác nhau | **[VERIFY]**; sai thì kênh bị ẩn mặc định, bật *Hiện track tắt* là thấy |
| FLP-L7 | **Màu kênh/Pattern:** chưa đọc (màu mặc định của FL giống nhau cho mọi kênh) | ngoài 1.0 |
| FLP-L8 | **Phiên bản đã thử trên tệp thật** (xem bảng ở §5b): 12.3, 25.2.3, 25.2.5, 26.1.6, 26.1.7, 26.1.99. **Bố cục thay đổi theo phiên bản chính, đều suy từ tệp:** (a) sự kiện `172` dài 3 byte từ FL 25 (không phải 4); (b) clip Playlist dài 32 byte (FL 12–20.98), 60 byte (21–24, theo DAWVert), **80 byte (25)**, **88 byte (26)**. Cả hai bật theo `vmaj`. *Đính chính:* bản đầu ghi 240 byte cho FL 25 là sai (60 × 4 = 80 × 3 nên cứ 3 clip chỉ đọc được 1); phát hiện nhờ ảnh Playlist. Kiểm chứng độc lập: mọi clip có marker `0x5000` và điểm cuối clip tròn số bar (16, 32, 64, 128) | **[VERIFY]** chưa có tệp FL 21–24 thật; FL 26.x mới thấy 3 bản nhỏ |
| FLP-L10 | **Automation chỉ lấy âm lượng và pan của track** (xem §8); tham số plugin, mute, filter, pitch… chưa đọc, đếm vào `WARN_FLP_CLIPS_SKIPPED` | chấp nhận |
| FLP-L9 | `yawwapsy.zip` (gói ZIP kèm sample, bên trong `.flp` của FL 10): mở ZIP đúng, rồi bị từ chối vì phiên bản < 12 (đúng thiết kế) | chấp nhận |

### 5b. Tệp thật đã thử

| Tệp | Phiên bản | BPM | Track | Nốt | Ghi chú |
|---|---|---|---|---|---|
| `big roar.flp` | 12.3.0.72 | 128 | 7 | 2.150 | clip 32 byte |
| `fun song.flp` | 25.2.3.5171 | 128 | 7 | 2.286 | clip 80 byte; có nốt dài 0 (`WARN_ZERO_LENGTH_NOTES`) |
| `11-7-26 ambient vocal.flp` | 25.2.5.5319 | 140 | 18 | 1.361 | lane volume "Serum 2" 48 điểm |
| `3x OSC Abuse.flp` | 26.1.6.5639 | 165 | 5 | 1.331 | clip 88 byte |
| `HOUSE, TRANCE …_21_NEW.flp` | 26.1.7.5654 | 122 | 9 | 1.618 | clip 88 byte |
| `Ction_35.flp` | 26.1.99.5789 | 120 | 6 | 320 | clip 88 byte; hai arrangement, chỉ lấy cái đầu |
| `yawwapsy_26.flp` (trong ZIP) | FL 10 | — | — | — | bị từ chối: phiên bản < 12 |

Cả bốn tệp 25/26 đều không có automation volume/pan nên chưa thêm bằng chứng cho phần lane (§6).

## 6. Automation (volume, pan của track)

AST đã có lane `volume/pan/mute` của track (REQ-AST-02, độ sáng track theo automation REQ-GRAPHICS-06); chỗ thiếu chỉ ở engine JSON (trước đây chỉ ánh xạ `tracks.notes`). Bổ sung hai mục chung cho engine: `tracks.let` (biến riêng của track) và `tracks.automation[]` (`kind` volume|pan|mute, `each/inner`, `tick`, `value`), engine tự sắp điểm theo tick, điểm trùng tick thì điểm sau thắng, và điền `timeSeconds` theo TempoMap.

* **Dữ liệu FLP:** clip automation trên Playlist trỏ tới một *kênh loại 5* (`idx` = số kênh). Điểm nằm ở sự kiện `234` (header 21 byte, mỗi điểm 24 byte: vị trí *beat, cộng dồn từ điểm trước*, giá trị 0..1, tension, kiểu); đích điều khiển ở sự kiện `227` (số 32 bit = nhóm × 65536 + điều khiển).
* **Giải mã đích:** nhóm `0x0000–0x1FFF` = kênh (`ctl` 0 = volume, 1 = pan); nhóm `0x2000–0x3FFF` = insert mixer số `(nhóm >> 6) − 128` (`ctl` `0x1FC0` = volume, `0x1FC1` = pan); riêng **FL 25** insert nằm ở `0x7000 + (số << 6)`. Kiểm trên `big roar.flp` (đủ loại đích) và `11-7-26 ambient vocal.flp` (`0x70401FC0` = volume insert 1 = "Serum 2").
* **Gắn vào track:** track là kênh nhạc cụ, nên lane của một insert gắn vào mọi kênh đi qua insert đó (sự kiện `22`, FL ≤ 24). **FL 25 không còn sự kiện `22`** → tạm ghép **theo tên** (insert trùng tên kênh) **[VERIFY]**.
* **Giá trị:** volume = gain tuyến tính `(v / 0,8)³` (80 % = 0 dB, 100 % ≈ +5,8 dB; dạng lập phương xấp xỉ +5,6 dB của FL) **[VERIFY]**; pan = `2v − 1` (chiều âm/dương chưa kiểm). Ngoài các clip, lane giữ giá trị điểm biên (đúng cách `sampleLane` hoạt động). Đo trên tệp FL 25: track "Serum 2" có 48 điểm (16 clip × 3 điểm) khớp ảnh Playlist (16 clip dốc lên rồi rơi mỗi 4 bar).
* **Không làm:** tham số plugin (đúng triết lý không hỗ trợ plugin), mute, tempo (FLP-L2).

## 6b. Tệp mẫu cần để gỡ [VERIFY] (danh sách cho người thử)

Mỗi tệp là một dự án ngắn, kèm một dòng ghi lại giá trị đã đặt (ví dụ "volume kênh 0: 100 % → 50 %, clip 1 bar"). Đặt vào `test/fixtures/third-party/` (không commit). Theo thứ tự ưu tiên:

| # | Cần | Gỡ được | Mục |
|---|---|---|---|
| 1 | Tệp **FL 21, 22, 23, 24** (mỗi bản một tệp; cũng nên có 20.x và 20.99) | ranh giới clip 32 → 60 → 80 byte; hiện FL 21–24 chỉ dựa vào mã DAWVert | FLP-L8 |
| 2 | **Pattern 1 bar có 4 nốt khác cao độ, kéo clip dài 4 bar** + ảnh Playlist | FL có lặp nội dung pattern không (nguy cơ hiển thị sai lớn nhất: hiện nốt chỉ vẽ một lần) | FLP-L1 |
| 3 | **Automation volume insert** 0 dB → −12 dB và 0 dB → +5,6 dB; **pan insert** trái → phải; **volume/pan kênh** 100 % → 50 %; ghi lại giá trị đầu và cuối trên fader. Làm ở FL 12–24 **và** FL 25/26; ở FL 25/26 cho nhạc cụ đi insert **tên khác** tên kênh | gain `(v/0,8)³`, chiều âm/dương của pan, nơi FL 25/26 lưu liên kết kênh → insert (không còn sự kiện `22`, hiện ghép theo tên) | §6 |
| 4 | **Tempo automation** 120 → 140 → 90 BPM tại các bar đã biết | công thức giá trị → BPM (10 + 512·v cho 300 BPM trên `big roar.flp` với tempo 128, nên chưa dùng) và cách nội suy | FLP-L2 |
| 5 | **Hai arrangement** (cho biết cái nào đang chọn); **kênh Layer** có nốt; **kênh tắt** ở Channel Rack; dự án **chế độ Pattern** chưa kéo lên Playlist | chọn arrangement, nhân bản nốt Layer, ngữ nghĩa sự kiện `0`, `ERR_NO_NOTES` có hợp lý không | FLP-L3–L6 |

Nếu chỉ làm được ba thứ: (1) một tệp FL 21–24, (2) pattern lặp, (3) automation volume insert.

## 7. Phương án đã cân nhắc

| Phương án | Nhận xét |
|---|---|
| **Giữ JSON schema (đã chọn)** | Một engine cho mọi định dạng nhị phân; người dùng ghi đè được schema (`options.schemas` ưu tiên hơn bản dựng sẵn) để vá khi FL đổi cấu trúc; kiểm toán an toàn một chỗ; đo được nhanh |
| Viết `packages/flp` bằng JS thuần | Nhanh hơn một chút và dễ viết tuần tự, nhưng thêm một package có trạng thái riêng, mất khả năng vá bằng JSON, và không chứng minh được engine tổng quát (D-28) |
| Đổi biểu diễn schema sang mô tả khác (ví dụ kiểu Kaitai) | Không cần: TLV vừa đủ; chi phí đổi cú pháp lớn hơn lợi ích |

## 8. Nguồn và giấy phép

Bố cục sự kiện và cấu trúc byte (id sự kiện, kích thước nốt/clip, các giá trị đánh dấu) được đối chiếu với mô tả công khai của dự án [DAWVert](https://github.com/SatyrDiamond/DawVert) (GPL-3.0-or-later) và kiểm lại trên tệp thật `big roar.flp` bằng bộ giải mã độc lập. **Không sao chép mã**: schema JSON và engine do dự án tự viết; DAWVert được ghi công trong [CREDITS.md](../../CREDITS.md). Tệp `big roar.flp` là tệp bên thứ ba **không commit** (nằm trong `test/fixtures/third-party/`, bị `.gitignore`); test dùng nó tự bỏ qua khi thiếu, còn bộ test chính chạy trên FLP tổng hợp do `test/helpers.mjs` dựng.
