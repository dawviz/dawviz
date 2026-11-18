---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "5. Giới hạn đã biết (cần tệp mẫu hoặc quyết định để mở)"
path: "5. Giới hạn đã biết (cần tệp mẫu hoặc quyết định để mở)"
chunk: 5-gioi-han-da-biet-can-tep-mau-hoac-quyet-dinh-d.md
source_lines: 41-72
source_sha1: a703402bcf
ids: [D-24, ERR_NO_NOTES, WARN_FLP_CLIPS_SKIPPED, WARN_ZERO_LENGTH_NOTES]
---
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
| FLP-L8 | **Phiên bản đã thử trên tệp thật** (xem bảng ở §5b): 12.3, 20.8, 21.2.1, 24.1.2, 25.2.3, 25.2.5, 26.1.6, 26.1.7, 26.1.99. **Bố cục thay đổi theo phiên bản chính, đều suy từ tệp:** (a) sự kiện `172` dài 3 byte từ FL 25 (không phải 4); (b) clip Playlist dài 32 byte (FL 12–20.98), 60 byte (21–24, theo DAWVert), **80 byte (25)**, **88 byte (26)**. Cả hai bật theo `vmaj`. *Đính chính:* bản đầu ghi 240 byte cho FL 25 là sai (60 × 4 = 80 × 3 nên cứ 3 clip chỉ đọc được 1); phát hiện nhờ ảnh Playlist. Kiểm chứng độc lập: mọi clip có marker `0x5000` và điểm cuối clip tròn số bar (16, 32, 64, 128) | **[VERIFY]** FL 21.2 và 24.1 đã xác nhận 60 byte; còn thiếu 20.99–21.1, 22, 23 và đúng ranh giới 20.98 → 20.99; FL 26.x mới thấy 3 bản nhỏ |
| FLP-L10 | **Automation chỉ lấy âm lượng và pan của track** (xem §8); tham số plugin, mute, filter, pitch… chưa đọc, đếm vào `WARN_FLP_CLIPS_SKIPPED` | chấp nhận |
| FLP-L9 | `yawwapsy.zip` (gói ZIP kèm sample, bên trong `.flp` của FL 10): mở ZIP đúng, rồi bị từ chối vì phiên bản < 12 (đúng thiết kế) | chấp nhận |

### 5b. Tệp thật đã thử

| Tệp | Phiên bản | BPM | Track | Nốt | Ghi chú |
|---|---|---|---|---|---|
| `big roar.flp` | 12.3.0.72 | 128 | 7 | 2.150 | clip 32 byte |
| `TS404 Template_v20.8.flp` | 20.8.3.2293 | 140 | 1 | 17 | clip 32 byte (xác nhận ranh giới: 20.x dưới 20.99 vẫn 32 byte) |
| `TRANCECRAFTER_37.flp` | 21.2.1.3859 | 141,998 | 28 | 33.487 | clip 60 byte; 22 clip Pattern liền nhau tới bar 521 (~14,7 phút), 177 ms |
| `Promise.flp` | 24.1.2.4394 | 86,991 | 13 | 8.201 | clip 60 byte; 1 clip Pattern dài 97 bar + 2 clip âm thanh |
| `fun song.flp` | 25.2.3.5171 | 128 | 7 | 2.286 | clip 80 byte; có nốt dài 0 (`WARN_ZERO_LENGTH_NOTES`) |
| `11-7-26 ambient vocal.flp` | 25.2.5.5319 | 140 | 18 | 1.361 | lane volume "Serum 2" 48 điểm |
| `3x OSC Abuse.flp` | 26.1.6.5639 | 165 | 5 | 1.331 | clip 88 byte |
| `HOUSE, TRANCE …_21_NEW.flp` | 26.1.7.5654 | 122 | 9 | 1.618 | clip 88 byte |
| `Ction_35.flp` | 26.1.99.5789 | 120 | 6 | 320 | clip 88 byte; hai arrangement, chỉ lấy cái đầu |
| `yawwapsy_26.flp` (trong ZIP) | FL 10 | — | — | — | bị từ chối: phiên bản < 12 |

Cả bốn tệp 25/26 đều không có automation volume/pan nên chưa thêm bằng chứng cho phần lane (§6).
