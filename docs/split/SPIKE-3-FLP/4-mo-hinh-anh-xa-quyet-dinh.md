---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "4. Mô hình ánh xạ (quyết định)"
path: "4. Mô hình ánh xạ (quyết định)"
chunk: 4-mo-hinh-anh-xa-quyet-dinh.md
source_lines: 33-40
source_sha1: 8c83939972
ids: [D-44, ERR_AST_INVALID]
---
## 4. Mô hình ánh xạ (quyết định)

* **Track = kênh nhạc cụ (Channel Rack)**, không phải làn Playlist. Lý do: nốt FL gắn với kênh (`rack`); tên kênh ("Massive", "Serum") có nghĩa với người xem, còn làn Playlist chỉ là chỗ xếp clip. Kênh âm thanh (loại 4) và kênh automation (loại 5) không có nốt nên bị bỏ; kênh Layer (loại 3) vẫn thành track để không mất nốt thầm lặng.
* **Chỉ Playlist của arrangement đầu tiên (`arr == 0`) và chỉ clip Pattern** (như D-44: Ableton chỉ đọc Arrangement). Nốt của Pattern chưa xếp lên Playlist không phát nên không hiện. Kênh tắt (sự kiện `0` = 0) thành track "tắt tiếng", hiện khi bật *Hiện track tắt*.
* **Clip**: vị trí `pos`, độ dài `len`, `startoffset` (`so`, bỏ giá trị đánh dấu `0xFFFFFFFF` và `0xBF800000`) dời nốt; nốt bắt đầu trước `so` hoặc sau cuối clip bị bỏ, độ dài nốt bị cắt ở cuối clip. Clip tắt tiếng (cờ `0x1000`) bỏ.
* **Tick**: PPQ lấy từ header (thường 96) rồi quy ra 960 như mọi nguồn khác. **Tempo** = sự kiện `156` / 1000 (một điểm); **nhịp** từ `17`/`18`.
* **Chuỗi**: UTF-16LE (FL ≥ 12). Phiên bản dưới 12 bị từ chối (`ERR_AST_INVALID`, nêu rõ cần ≥ 12), như tham chiếu.
