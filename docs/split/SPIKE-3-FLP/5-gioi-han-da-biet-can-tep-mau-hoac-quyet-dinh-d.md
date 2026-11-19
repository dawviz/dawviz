---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "5. Giới hạn đã biết (cần tệp mẫu hoặc quyết định để mở)"
path: "5. Giới hạn đã biết (cần tệp mẫu hoặc quyết định để mở)"
chunk: 5-gioi-han-da-biet-can-tep-mau-hoac-quyet-dinh-d.md
source_lines: 41-72
source_sha1: 5bf69b7604
ids: [ERR_AST_INVALID, ERR_NO_NOTES, WARN_FLP_CLIPS_SKIPPED, WARN_TEMPO_RAMP, WARN_TEMPO_SHAPE, WARN_ZERO_LENGTH_NOTES]
---
## 5. Giới hạn đã biết (cần tệp mẫu hoặc quyết định để mở)

| Mã | Giới hạn | Trạng thái |
|---|---|---|
| FLP-L1 | **Pattern lặp trong clip dài:** **FL không lặp; parser giữ nguyên (nốt hiện một lần trong `[startoffset, startoffset+len)`).** Hai quan sát từ ảnh Playlist của FL: (1) `looped_pattern.flp` (FL 25.2.5, clip 4 bar, nốt chỉ ở bar 1): một nhãn, bar 2–4 trống; (2) `big roar.flp` (bar 1–11, pattern `bass melo`): không thấy nội dung lặp ở phần clip dài hơn nốt. Hai clip 4,375 bar ở bar 17 và 81 chưa kiểm riêng phần cuối clip; chủ dự án quyết định bỏ qua và coi là không lặp (2026-11-19). Đã thử suy độ dài pattern từ nốt cuối làm tròn lên bar rồi lặp: **sai so với FL**, đã hoàn tác. Cặp `1barpattern.flp` / `4barpattern.flp` (FL 25.2.5, cùng clip 4 bar, nốt dài 1 bar so với 4 bar) chỉ khác đúng 3 sự kiện: nốt `224` (độ dài nốt 384 so với 1536 tick @96), DWORD `167` (0 so với 1; ngược chiều với cặp bên dưới nên là cờ không liên quan, không phải độ dài pattern) và dấu thời gian `237`; clip giống hệt, ảnh Playlist của tệp 1 bar không lặp. Kết luận: **tệp không lưu độ dài pattern**. So sánh sự kiện `looped_pattern.flp` với `tempo_auto.flp` (pattern 4 bar, clip 4 bar): chỉ khác nốt, DWORD `167`, dấu thời gian `237` và clip (cờ ở byte 19, `endoffset` = 1536 thay vì −1); không có sự kiện nào mang độ dài pattern | **Đã chốt, chấp nhận.** Tệp không có độ dài pattern nên không có gì để lặp theo; hành vi hiện tại khớp FL ở mọi ảnh đã đối chiếu |
| FLP-L2 | **Tempo thay đổi:** **đã đọc** (đích `0x4000`/`5`, nhất quán từ FL 12.3 đến 25.2). Công thức giá trị → BPM: **`bpm = 60 + 120·v`**, đã kiểm trên 4 tệp độc lập: `tempo_auto.flp` (0,5 → 120, 0,75 → 150), `tempo_auto_2.flp` (điểm đầu 0,0833 = 70 BPM = tempo dự án; 0,8333 → 160; 0,75 → 150; 0,3 → 96; 0,1714 → 80,57; chủ dự án xác nhận các giá trị đã đặt), `big roar.flp` (FL 12.3: 4 clip phẳng, mọi điểm đúng 128 BPM = tempo dự án; công thức DAWVert `10 + 512·v` cho 300 BPM nên sai) và `Promise.flp` (FL 24.1: bắt đầu đúng 86,99 = tempo dự án, kết thúc chậm dần về 60 BPM). Nội suy theo từng đoạn nối (trường kiểu ở 4 byte cuối mỗi điểm): đoạn **thẳng** (byte 3 = 2) và đoạn **giữ** (byte 0 = 2, byte 3 = 0: giữ giá trị trước rồi nhảy bậc) khớp ảnh Playlist; đoạn **cong** (byte 3 = 1, kèm hệ số cong f32) **chưa biết công thức**, được xấp xỉ bằng đoạn thẳng kèm `WARN_TEMPO_SHAPE`. Đoạn dốc lấy mẫu mỗi nửa beat (tối đa 256 bậc mỗi đoạn) bằng giá trị giữa bậc, như parser dawproject, kèm `WARN_TEMPO_RAMP`; giá trị cuối đoạn được giữ cho tới điểm kế (đoạn giữ cần giá trị này). Giá trị sau cuối clip được giữ. Tempo ngoài [10, 1000] BPM vẫn bị `ERR_AST_INVALID` | **[VERIFY]** một phần: công thức cong; nhận diện đoạn giữ chỉ có 1 mẫu; chưa kiểm tempo vượt [60, 180] (v ngoài [0, 1] có xảy ra không) và nhiều clip tempo chồng nhau |
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
