---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.5 Sóng âm cho thanh tua (việc để dành từ T-70)"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.5 Sóng âm cho thanh tua (việc để dành từ T-70)"
chunk: 6-2-5-song-am-cho-thanh-tua-viec-de-danh-tu-t-70.md
source_lines: 262-268
source_sha1: af52e37072
ids: [REQ-WIDGET-07]
---
#### 6.2.5 Sóng âm cho thanh tua (việc để dành từ T-70)
- **Tính trong Worker** `workers/audioPeaks.worker.ts`. Luồng chính gửi PCM **theo khối** 2²⁰ mẫu đã trộn mono `(L+R)/2` (chuyển quyền sở hữu bản sao; không gửi cả 460 MB một lần); Worker chỉ cộng dồn đỉnh, **không giữ PCM**.
- **Tất định:** mức cơ sở cố định **512 mẫu mỗi ô**, ô theo vị trí tuyệt đối trong tệp, mỗi ô lưu `(min, max)` Float32. Nên kết quả **không phụ thuộc cách chia khối** và không phụ thuộc kích thước thanh tua. Mọi mức hiển thị lấy bằng hàm thuần `reducePeaks(base, cột)` (min/max theo nhóm ô, không nội suy, không số ngẫu nhiên). Test: cùng PCM chia khối khác nhau cho `Float32Array` giống từng bit.
- **Bộ đệm:** `Map<assetId, PeaksBase>` trong bộ nhớ, ≤ 1 tệp (≈ 0,9 MB cho 20 phút). Đổi kích thước thanh tua chỉ chạy lại `reducePeaks` (rẻ), không đụng Worker. Bộ đệm bền qua phiên là việc của M4.
- **Vẽ:** lớp canvas dưới vạch phát của `Transport`; có offset thì dịch sóng đi `offset` (hình thấy được lệch nhịp trực tiếp). Trong lúc chưa tính xong hiện đường phẳng, không chặn phát.
- Cùng bộ đệm đỉnh này sẽ là đầu vào cho Waveform tổng quan của REQ-WIDGET-07 sau này; FFT/RMS theo khung là việc của widget, không thuộc T-08.
