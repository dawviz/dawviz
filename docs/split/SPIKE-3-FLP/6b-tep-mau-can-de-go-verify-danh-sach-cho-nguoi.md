---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "6b. Tệp mẫu cần để gỡ [VERIFY] (danh sách cho người thử)"
path: "6b. Tệp mẫu cần để gỡ [VERIFY] (danh sách cho người thử)"
chunk: 6b-tep-mau-can-de-go-verify-danh-sach-cho-nguoi.md
source_lines: 83-96
source_sha1: 2763624485
ids: [ERR_NO_NOTES]
---
## 6b. Tệp mẫu cần để gỡ [VERIFY] (danh sách cho người thử)

Mỗi tệp là một dự án ngắn, kèm một dòng ghi lại giá trị đã đặt (ví dụ "volume kênh 0: 100 % → 50 %, clip 1 bar"). Đặt vào `test/fixtures/third-party/` (không commit). Theo thứ tự ưu tiên:

| # | Cần | Gỡ được | Mục |
|---|---|---|---|
| 1 | ~~Tệp **FL 20.9.x/20.99**, 22, 23~~ **không cần nữa** (2026-11-20): chủ dự án xác nhận ranh giới clip 32 → 60 byte nằm ở FL 20.99 theo dawVert; 22–23 cùng bố cục với 21.2/24.1 (đã có 20.8, 21.2, 24.1, 25.x, 26.x) | | FLP-L8 |
| 2 | ~~Hai tệp độ dài pattern~~ **đã có** (`1barpattern.flp`, `4barpattern.flp`), đã chốt FLP-L1 | | FLP-L1 |
| 3 | ~~Volume insert nhiều điểm~~ **đã có** (`mixer_vol_auto2.flp`). Còn cần: **volume/pan của chính kênh** (nhiều mức, ghi cả % và dB hiển thị), **pan insert** trái → phải; làm ở FL 25/26 cho nhạc cụ đi insert **tên khác** tên kênh | đường cong volume kênh, chiều âm/dương của pan, nơi FL 25/26 lưu liên kết kênh → insert (hiện ghép theo tên) | §6 |
| 4 | ~~Tempo automation 3 điểm~~ **đã có** (`tempo_auto_2.flp`, xem FLP-L2). Còn cần: **đoạn cong** (nhiều hệ số cong khác nhau, ghi BPM ở giữa đoạn), **đoạn giữ** thêm vài mẫu, và tempo cao (ví dụ 200, 300 BPM) để xem v có vượt 1 không | công thức đoạn cong; giới hạn thang tempo | FLP-L2 |
| 5 | **Hai arrangement** (cho biết cái nào đang chọn); **kênh Layer** có nốt; **kênh tắt** ở Channel Rack; dự án **chế độ Pattern** chưa kéo lên Playlist | chọn arrangement, nhân bản nốt Layer, ngữ nghĩa sự kiện `0`, `ERR_NO_NOTES` có hợp lý không | FLP-L3–L6 |

Nếu chỉ làm được một thứ: volume/pan **của kênh** (không phải insert) với các mức đã biết, và insert khác tên kênh ở FL 25/26 (volume insert đã khớp, xem §6). Mục (1) đã chốt theo dawVert (2026-11-20).
