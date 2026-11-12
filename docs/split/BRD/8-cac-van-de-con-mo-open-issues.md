---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "8. CÁC VẤN ĐỀ CÒN MỞ (OPEN ISSUES)"
path: "8. CÁC VẤN ĐỀ CÒN MỞ (OPEN ISSUES)"
chunk: 8-cac-van-de-con-mo-open-issues.md
source_lines: 250-270
source_sha1: 3ea60fc182
ids: [D-01, D-05, D-39, D-40, D-41, D-42, D-43, D-44, D-45, KPI-01, KPI-06, OI-01, OI-02, OI-03, OI-04, OI-05, OI-06, OI-07, OI-08, OI-09, OI-10, OI-11, OI-12, OI-13, OI-14, OI-15, OI-16, OI-17, P-01, P-13]
---
## 8. CÁC VẤN ĐỀ CÒN MỞ (OPEN ISSUES)

| Mã | Nội dung | Người/giai đoạn xử lý |
| :--- | :--- | :--- |
| **OI-01** | Thu thập bộ file mẫu thật để kiểm chứng parser và đo KPI-01. **Đã có:** Ableton 9.1 (`.als` + `.alp`), 12.4 (`.als`), Reaper 7.85 (2 dự án có MIDI nhúng, 1 dự án tham chiếu `.mid` ngoài kèm file `.mid`, 5 template), ví dụ `.dawproject` chính thức. **Còn thiếu:** `.dawproject` xuất thật (Bitwig/Studio One), Ableton 10/11, Reaper 6, `.alp` bản mới, clip lặp/`StartRelative ≠ 0`/nhịp ≠ 4/4, MIDI xuất từ DAW làm tham chiếu. **v1.1:** xử lý qua Chương trình tệp mẫu (D-45). | Dev/QA — trước khi hoàn tất parser |
| **OI-02** | Xác định cấu hình Máy chuẩn RM-1 thật và chạy benchmark để chốt các giá trị **[PROVISIONAL]**. **v1.1:** đo trong M5, trước khi phát hành 1.0. | Dev — spike kỹ thuật |
| **OI-03** | Kiểm tra mức hỗ trợ WebCodecs (video và audio) trên Firefox và Safari bằng thử nghiệm thực tế. **v1.1:** 1.0/1.1 chạy theo khả năng phát hiện được; kiểm thử thật trước khi phát hành 1.0 và ghi vào hạn chế đã biết (D-44). | Dev |
| **OI-04** | Kiểm tra khả năng dùng bộ mã hóa AAC chạy bằng WASM làm phương án dự phòng khi trình duyệt không có AAC gốc (và giấy phép đi kèm). **v1.1:** không có trong 1.0/1.1; xem lại ở 1.2. Khi thiếu AAC: xuất video-only hoặc WebM/Opus (D-05). | Dev |
| **OI-05** | Tích hợp thư viện @tonaljs/chord-detect làm engine nhận diện hợp âm cốt lõi thay vì viết tay. Cần thu thập bộ mẫu test gồm 30–50 đoạn MIDI thực tế (Pop, Lo-Fi, R&B, Jazz) để tinh chỉnh thuật toán gom nốt theo thời gian (time-windowing) và đo đạt KPI-06. **v1.1:** bộ mẫu MIDI tự tạo + Chương trình tệp mẫu (D-45); kiểm giấy phép thư viện trước khi dùng (OI-07). | Product/Nhạc công |
| **OI-06** | Đánh giá lại D-01 (Silent AAC) khi có phản hồi thực tế từ các nền tảng. **v1.1:** giữ mặc định TẮT; xem lại sau phản hồi của 1.0. | Product |
| **OI-07** | Kiểm tra giấy phép các thư viện phụ thuộc và font đóng gói kèm. **v1.1:** thêm bước kiểm giấy phép phụ thuộc tự động vào CI trước khi phát hành 1.0 (T-40). | Dev/Pháp lý |
| **OI-08** | Cần file `.bwproject` (và `.flp`) mẫu để viết schema nhị phân thật; cho tới lúc đó ghi là *chưa hỗ trợ*. **v1.1:** chưa hỗ trợ trong 1.0/1.1; xem lại ở 1.2 nếu có tệp mẫu (D-45). | Product/Dev |
| **OI-09** | Đo lại A/V sync trên thêm thiết bị di động và quyết định có bù offset hay giữ phạm vi desktop (R-11). **Đã chốt v1.1 (D-44):** 1.0/1.1 chỉ desktop; 1.2 xem trên di động, xuất vẫn khuyến nghị desktop. | Dev |
| **OI-10** | Quyết định chính thức: chỉ đọc Arrangement hay đọc cả Session View của Ableton (clip Session hiện bị bỏ qua). **Đã chốt v1.1 (D-44):** 1.0/1.1 chỉ Arrangement; Session View ở 1.2. | Product |
| **OI-11** | Chốt danh sách widget/dữ liệu hiển thị bổ sung đề xuất ở SRS mục 3.4b: cái nào vào v1.0, cái nào để sau; cần đọc thêm dữ liệu nào từ file (marker/vùng, lời bài hát). **Đã chốt v1.1 (D-40):** toàn bộ P-01…P-13 vào bản 1.0. | Product |
| **OI-12** | Cách đếm beat/bar trong nhịp ghép: **Reaper đã xác nhận** đếm theo mẫu số (12/8 @120 BPM: `1.12.68` = 2,920 s). Còn đối chiếu Ableton, Bitwig và nhịp 5/4... bằng file thật. **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA |
| **OI-14** | Chiều pan, nghĩa giá trị mute và hệ số nội suy volume (`gain^0,25`, suy từ 2 điểm đo) của automation chưa kiểm đủ; Ableton/Bitwig automation chưa đọc. **v1.1:** Chương trình tệp mẫu (D-45); Ableton/Bitwig automation cần cho P-13 ở 1.0. | Dev/QA |
| **OI-13** | Quy trình cộng đồng dịch: ai duyệt, giấy phép/CLA cho người đóng góp, ngôn ngữ ưu tiên, font cho CJK/Ả Rập/Thái/Devanagari trong video xuất ra, và khi nào dùng công cụ dịch có quản trị. **Đã chốt phần quy trình v1.1:** DCO (D-42); bản dịch duyệt bởi kiểm duyệt viên cộng đồng (D-43); ưu tiên en, vi. **Còn mở:** phông cho CJK/Ả Rập/Thái/Devanagari trong video xuất: 1.0 cho người dùng nạp phông riêng (tài nguyên phiên), 1.1 có gói phông cộng đồng. | Product/Dev |
| **OI-15** | **Đã đóng 2026-11-12:** không nhập storyboard osu! (`.osb`), không làm giống mô hình osu!; tập trung tùy biến nhiều hơn và dễ dùng hơn (`docs/design/CUSTOMIZATION.md` mục 2). | Product |
| **OI-16** | **Đã chốt một phần 2026-11-12:** có ngôn ngữ biểu thức (D-39, `docs/design/EXPRESSIONS.md`). Còn mở: có làm morph giữa đường SVG tự do không. **Đã đóng v1.1:** morph SVG tự do ở 1.2 (D-44). | Product/Dev |
| **OI-17** | Chọn origin để host ứng dụng: tên miền riêng hay tài khoản/tổ chức GitHub riêng (không dùng `tên-cá-nhân.github.io/dawviz` vì dùng chung origin với các repo khác). Phải chốt trước khi lưu dữ liệu người dùng trên site công khai. **Đã đóng v1.1 (D-41):** tổ chức GitHub riêng. | Product |
