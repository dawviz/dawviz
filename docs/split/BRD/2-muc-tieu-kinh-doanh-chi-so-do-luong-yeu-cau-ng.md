---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "2. MỤC TIÊU KINH DOANH, CHỈ SỐ ĐO LƯỜNG & YÊU CẦU NGHIỆP VỤ"
path: "2. MỤC TIÊU KINH DOANH, CHỈ SỐ ĐO LƯỜNG & YÊU CẦU NGHIỆP VỤ"
chunk: 2-muc-tieu-kinh-doanh-chi-so-do-luong-yeu-cau-ng.md
source_lines: 42-80
source_sha1: 3e8360d118
ids: [BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, D-02, D-12, D-14, KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, KPI-08, REQ-EXPORT-06]
---
## 2. MỤC TIÊU KINH DOANH, CHỈ SỐ ĐO LƯỜNG & YÊU CẦU NGHIỆP VỤ

### 2.1. Mục tiêu kinh doanh (Business Objectives)

| Mã | Mục tiêu |
| :--- | :--- |
| **OBJ-1** | **Tối ưu quy trình sản xuất nội dung:** rút ngắn thời gian từ lúc có bản thảo trên DAW đến lúc có video đăng mạng xã hội từ 45 phút xuống dưới 3 phút (với đoạn video ≤ 60 giây, xem KPI-05). |
| **OBJ-2** | **Chi phí hạ tầng bằng 0 (Zero Infrastructure Cost):** tận dụng WebCodecs, Canvas, Web Audio API của trình duyệt; loại bỏ chi phí server render. Chỉ cần static hosting. |
| **OBJ-3** | **Tăng trưởng dựa trên cộng đồng:** cho phép người dùng tự viết Parser khai báo (Declarative JSON Schema) và chia sẻ Preset giao diện bằng file. Trong v1.0 việc chia sẻ thực hiện thủ công (ví dụ qua GitHub); thư viện preset/parser tích hợp trong ứng dụng thuộc v1.1 (D-14). |

### 2.2. Chỉ số thành công cốt lõi (KPIs)

| Mã | Chỉ số | Mục tiêu | Cách đo |
| :--- | :--- | :--- | :--- |
| **KPI-01** | Độ chính xác bóc tách | ≥ 98% số file trong bộ mẫu được tính là "thành công" | Bộ mẫu ≥ 20 file thật cho mỗi định dạng **[PROVISIONAL]**. File "thành công" khi mọi nốt khớp bản MIDI tham chiếu (xuất từ chính DAW): pitch đúng, `startTick` và `durationTick` sai số ≤ 1 tick (dung sai tính theo độ phân giải thô hơn của hai nguồn). Công cụ so sánh (`compareAST`) đã có trong thư viện; **[ĐÃ KIỂM]** bằng đối chứng độc lập trên Ableton Live 12 (9605 nốt) và Reaper 7.85 (7497 và 3147 nốt) chưa phải bằng MIDI xuất từ DAW. Màn hình demo không còn ô nạp MIDI tham chiếu; phép so này chạy bằng CLI (`--ref`) hoặc trong bộ test. |
| **KPI-02** | Đồng bộ A/V | Lệch ≤ ±2 ms giữa timestamp video và audio trong container, **không tích lũy** (đầu và cuối video đều lệch ≤ 2 ms) | Phân tích timestamp container + clip kiểm thử có tiếng click và khung hình chớp (D-02). Giá trị "0 ms" của v0.1 bị bỏ vì video 60 FPS bị lượng tử hóa theo frame (16,67 ms). **[ĐÃ ĐO, Spike 1]** Desktop (LOQ, Chromium): 0,00 ms, đạt. Di động tầm trung (Redmi Note 12, Snapdragon 685): −42,67 ms, không đạt; KPI-02 chỉ cam kết cho desktop (D-12, R-11). |
| **KPI-03** | Tương thích nền tảng | 100% mục trong ma trận tương thích phát được không cần transcode | Ma trận: YouTube, TikTok, Facebook, Instagram, Premiere Pro, DaVinci Resolve, Final Cut Pro, CapCut, VLC, QuickTime, Windows Media Player. Kiểm thủ công mỗi bản phát hành, với đầu ra H.264 + AAC (Tier 1, xem SRS REQ-EXPORT-06). |
| **KPI-04** | Time to First Video | ≤ 60 giây thao tác (từ lúc mở trang đến lúc bấm Export) với preset mặc định | Usability test; không tính thời gian render. |
| **KPI-05** | Thời gian làm video | ≤ 3 phút từ file DAW đến file MP4 cho đoạn ≤ 60 giây ở 1080p | Giả định đo: dùng Export Range cho đoạn highlight, máy chuẩn RM-1 (SRS mục 4.1) **[PROVISIONAL]**. |
| **KPI-06** | Độ chính xác hợp âm | ≥ 90% với hợp âm 3–4 âm (triad, seventh) trên bộ mẫu có đáp án; hợp âm mở rộng (jazz) là best-effort + Override | Bộ mẫu ≥ 50 đoạn có đáp án do nhạc công gán **[PROVISIONAL]**. |
| **KPI-07** | Tốc độ xuất | 1080p@60fps với H.264 phần cứng: ≥ 1,2× thời gian thực. 4K@60fps: best-effort | Benchmark trên RM-1 **[PROVISIONAL]**. **[ĐÃ ĐO, Spike 1]** Máy LOQ (chưa phải RM-1): 600 khung 1080p xuất trong 3,8–4,2 giây, tức 2,4× đến 2,65× thời gian thực. |
| **KPI-08** | Thêm ngôn ngữ mới | Thêm một ngôn ngữ bằng một pull request chỉ gồm file JSON (và một dòng danh sách); bộ kiểm `npm run i18n:check` đạt; 100% chuỗi giao diện đi qua từ điển (không chữ cứng); ngôn ngữ chưa dịch đủ vẫn chạy nhờ chuỗi dự phòng tiếng Anh | Từ khi có giao diện chính |

### 2.3. Danh mục yêu cầu nghiệp vụ (Business Requirements)

| Mã | Yêu cầu nghiệp vụ | Phục vụ |
| :--- | :--- | :--- |
| **BR-01** | Đa dạng hóa đầu vào dự án (`.als`, `.alp`, `.rpp`, `.dawproject`, `.mid`, Parser JSON tùy biến gồm nguồn nhị phân); người dùng chủ động ghi đè tempo và chọn `.als` trong gói `.alp` | OBJ-1, OBJ-3, KPI-01 |
| **BR-02** | Đồ họa tối giản, tùy biến cao (Canvas, 8 widget HUD, snapping, preset dựng sẵn) | OBJ-1, KPI-04 |
| **BR-03** | Nhận diện hợp âm thông minh có sửa tay | KPI-06 |
| **BR-04** | Tương thích âm thanh linh hoạt (có hoặc không có file audio) | KPI-02, KPI-03 |
| **BR-05** | Lưu trữ và chia sẻ tiện lợi (auto-save, Preset, Project Pack) | OBJ-3 |
| **BR-06** | Xuất video trực tiếp trên máy người dùng, không backend; kích thước và tỉ lệ khung tuỳ biến | OBJ-2, KPI-03, KPI-07 |
| **BR-07** | Nhanh và dễ dùng cho người mới (preset mặc định, chọn đoạn xuất, tiến độ xuất) | OBJ-1, KPI-04, KPI-05 |
| **BR-08** | Riêng tư và an toàn (không gửi dữ liệu lên server, không chạy mã người dùng) | OBJ-2 |
| **BR-09** | Đa ngôn ngữ và cộng đồng dịch: giao diện, văn bản trên video xuất ra và tài liệu; thêm ngôn ngữ chỉ bằng file JSON, không sửa mã | OBJ-1, KPI-08 |

---
