---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "6b. Tệp mẫu cần để gỡ [VERIFY] (danh sách cho người thử)"
path: "6b. Tệp mẫu cần để gỡ [VERIFY] (danh sách cho người thử)"
chunk: 6b-tep-mau-can-de-go-verify-danh-sach-cho-nguoi.md
source_lines: 80-93
source_sha1: 8c83939972
ids: [ERR_NO_NOTES]
---
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
