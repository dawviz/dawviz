---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "6. Automation (volume, pan của track)"
path: "6. Automation (volume, pan của track)"
chunk: 6-automation-volume-pan-cua-track.md
source_lines: 73-82
source_sha1: a703402bcf
ids: [REQ-AST-02, REQ-GRAPHICS-06]
---
## 6. Automation (volume, pan của track)

AST đã có lane `volume/pan/mute` của track (REQ-AST-02, độ sáng track theo automation REQ-GRAPHICS-06); chỗ thiếu chỉ ở engine JSON (trước đây chỉ ánh xạ `tracks.notes`). Bổ sung hai mục chung cho engine: `tracks.let` (biến riêng của track) và `tracks.automation[]` (`kind` volume|pan|mute, `each/inner`, `tick`, `value`), engine tự sắp điểm theo tick, điểm trùng tick thì điểm sau thắng, và điền `timeSeconds` theo TempoMap.

* **Dữ liệu FLP:** clip automation trên Playlist trỏ tới một *kênh loại 5* (`idx` = số kênh). Điểm nằm ở sự kiện `234` (header 21 byte, mỗi điểm 24 byte: vị trí *beat, cộng dồn từ điểm trước*, giá trị 0..1, tension, kiểu); đích điều khiển ở sự kiện `227` (số 32 bit = nhóm × 65536 + điều khiển).
* **Giải mã đích:** nhóm `0x0000–0x1FFF` = kênh (`ctl` 0 = volume, 1 = pan); nhóm `0x2000–0x3FFF` = insert mixer số `(nhóm >> 6) − 128` (`ctl` `0x1FC0` = volume, `0x1FC1` = pan); riêng **FL 25** insert nằm ở `0x7000 + (số << 6)`. Kiểm trên `big roar.flp` (đủ loại đích) và `11-7-26 ambient vocal.flp` (`0x70401FC0` = volume insert 1 = "Serum 2").
* **Gắn vào track:** track là kênh nhạc cụ, nên lane của một insert gắn vào mọi kênh đi qua insert đó (sự kiện `22`, FL ≤ 24). **FL 25 không còn sự kiện `22`** → tạm ghép **theo tên** (insert trùng tên kênh) **[VERIFY]**.
* **Giá trị:** volume = gain tuyến tính `(v / 0,8)³` (80 % = 0 dB, 100 % ≈ +5,8 dB; dạng lập phương xấp xỉ +5,6 dB của FL) **[VERIFY]**; pan = `2v − 1` (chiều âm/dương chưa kiểm). Ngoài các clip, lane giữ giá trị điểm biên (đúng cách `sampleLane` hoạt động). Đo trên tệp FL 25: track "Serum 2" có 48 điểm (16 clip × 3 điểm) khớp ảnh Playlist (16 clip dốc lên rồi rơi mỗi 4 bar).
* **Không làm:** tham số plugin (đúng triết lý không hỗ trợ plugin), mute, tempo (FLP-L2).
