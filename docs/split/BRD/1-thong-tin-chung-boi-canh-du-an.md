---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "1. THÔNG TIN CHUNG & BỐI CẢNH DỰ ÁN"
path: "1. THÔNG TIN CHUNG & BỐI CẢNH DỰ ÁN"
chunk: 1-thong-tin-chung-boi-canh-du-an.md
source_lines: 25-39
source_sha1: 3ea60fc182
ids: []
---
## 1. THÔNG TIN CHUNG & BỐI CẢNH DỰ ÁN

### 1.1. Bối cảnh thị trường (Business Context)
* Nhu cầu tạo nội dung video ngắn (Short-form video: TikTok, YouTube Shorts, Reels) và video biểu diễn dự án âm nhạc (Project showcase) của cộng đồng Music Producers, Beatmakers, Pianists đang tăng trưởng mạnh.
* Định dạng visualizer tối giản (Minimalistic HUD: piano roll cuộn ngang/dọc, hiển thị vòng hợp âm, bộ đếm nốt, vạch nhịp Bar/Beat) mang lại hiệu quả thẩm mỹ cao và được người xem đặc biệt ưa chuộng.
* **Rào cản hiện tại:**
  * Dùng phần mềm quay màn hình (OBS Studio): nặng máy, dễ giật khung hình, giao diện DAW phức tạp làm loãng sự tập trung vào âm nhạc.
  * Xuất stem âm thanh/MIDI qua phần mềm dựng phim (After Effects, Premiere Pro, CapCut): tốn thời gian (30–60 phút/video), đòi hỏi kỹ năng dựng phim chuyên sâu.
  * Các web visualizer hiện nay: chỉ nhận file âm thanh tổng (Master Audio), không hiểu cấu trúc dự án DAW, không tách được nốt hay hiển thị hợp âm theo thời gian thực.

### 1.2. Tầm nhìn sản phẩm (Product Vision)
Xây dựng một Web Application chạy 100% client-side, cho phép người dùng kéo thả trực tiếp tệp dự án DAW (Ableton Live `.als`/`.alp`, Reaper, DAWproject của Bitwig/Studio One, MIDI chuẩn; định dạng nhị phân khác sẽ được thêm dần qua parser khai báo) để bóc tách nốt nhạc và nhịp độ. Nền tảng cung cấp không gian thiết kế Canvas đa widget tùy biến (8 widget) với cơ chế Snapping, hỗ trợ thêm lớp sóng âm (Audio Spectrum) khi nạp kèm file nhạc, và xuất video MP4 (Full HD, 4K, 60 FPS) bằng phần cứng máy người dùng, không tốn chi phí vận hành server.

---
