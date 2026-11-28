---
doc: VIZ-REFERENCE.md
doc_title: "Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**"
section: "5. Ràng buộc tất định"
path: "5. Ràng buộc tất định"
chunk: 5-rang-buoc-tat-dinh.md
source_lines: 63-70
source_sha1: 1ee00dca1b
ids: [AD-07]
---
## 5. Ràng buộc tất định

Khung của ta là hàm thuần của `t` (AD-07). Ba thứ của vizz.fm không thoả trực tiếp:

1. **Phản hồi khung trước** (Echo Trails, Persistence, Nostalgia feedback): khi tua phải dựng lại. Cách làm: vẽ thêm K khung trước `t` (K nhỏ, ví dụ 8–16) rồi trộn, hoặc thay bằng vệt giải tích (lịch sử của từng điểm tính được từ `t`). Chỉ hợp lý ở mức C.
2. **Mô phỏng hạt có lực hút** (Particle Dance): trạng thái phụ thuộc quá khứ. Cách làm như hạt hiện có: công thức kín theo tuổi hạt, hoặc mô phỏng bước cố định có điểm lưu mỗi N giây (tua tới điểm lưu gần nhất rồi chạy tiếp).
3. **Làm mượt âm thanh theo thời gian thực** (peak decay, smoothing): ta đã làm theo `t` (`smoothedBands` tấn công/nhả), giữ được.
