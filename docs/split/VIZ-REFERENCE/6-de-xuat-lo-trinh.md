---
doc: VIZ-REFERENCE.md
doc_title: "Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**"
section: "6. Đề xuất lộ trình"
path: "6. Đề xuất lộ trình"
chunk: 6-de-xuat-lo-trinh.md
source_lines: 71-81
source_sha1: 1ee00dca1b
ids: [D-47]
---
## 6. Đề xuất lộ trình

| Bước | Gồm | Mức | Ghi chú |
|---|---|---|---|
| 1 | Phổ tần: cột LED, giữ đỉnh, kiểu rơi, đối xứng; Lưới nốt: ma trận chấm đối xứng/toả tròn; Hành lang phím; Polar Curves (widget Đường cong) | A | Làm được trong 1.0/1.1, không phụ thuộc WebGL |
| 2 | Spectrogram khớp phím, dao động ký, vectorscope, LUFS | A | Cần giữ mẫu L/R và tính K-weighting khi phân tích âm thanh |
| 3 | Camera + phép chiếu trong Render Core; Đường hầm nhịp, Vòng quãng tám, Đường theo track, Piano Roll phối cảnh (vệt sáng) | B | Cùng mô hình camera với D-47 (1.1); đo giới hạn số đoạn ở T-27 |
| 4 | Lớp ghép WebGL2: bloom, hoà trộn GPU, hiệu ứng hậu kỳ, phản hồi khung | C | Spike WebGL (T-36), quyết định mới |
| 5 | Backend 3D (three.js): Địa hình Piano Roll dày, Cầu nhô theo nốt, nền shader | C | CUSTOMIZATION §12 |

Primitive 3D (`points3d`, `lines3d`, `meshgrid` kèm camera) nên định nghĩa ngay từ bước 3 để bước 5 chỉ đổi bộ vẽ, preset không phải viết lại.
