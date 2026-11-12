---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)"
path: "DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)"
chunk: du-an-trinh-truc-quan-hoa-du-lieu-du-an-am-nhac.md
source_lines: 2-39
source_sha1: 1654c314a5
ids: [AT-05, AT-13, AT-16, AT-17, AT-18, AT-19, AT-23, AT-24, BR-01, BR-08, D-01, D-03, D-04, D-05, D-06, D-08, D-16, D-34, D-36, D-40, D-45, D-47, D-48, ERR_AUDIO_TOO_MANY, NFR-COMP-03, NFR-SEC-05, REQ-AST-01, REQ-AUDIO-01, REQ-EXPORT-00, REQ-EXPORT-03, REQ-EXPORT-04, REQ-EXPORT-08, REQ-GRAPHICS-00, REQ-GRAPHICS-03, REQ-GRAPHICS-04, REQ-GRAPHICS-05, REQ-GRAPHICS-06, REQ-GRAPHICS-07, REQ-GRAPHICS-09, REQ-GRAPHICS-14, REQ-GRAPHICS-15, REQ-GRAPHICS-16, REQ-PARSER-00, REQ-PARSER-01, REQ-PARSER-05, REQ-PARSER-06, REQ-PARSER-07, REQ-RPP-07, REQ-STORAGE-05, REQ-UI-06, REQ-UI-07, REQ-UI-09, REQ-UI-10, REQ-UI-11, REQ-UI-12, REQ-UI-13, REQ-WIDGET-01, REQ-WIDGET-07, REQ-WIDGET-08, SOI-01, SOI-03, SOI-08, SOI-12, SOI-13, SOI-14, SOI-18, SOI-20]
---
## DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)

**Phiên bản:** v1.1 (đồng bộ với BRD v1.1; phạm vi theo bản phát hành ở BRD §4.4)
**Tài liệu tham chiếu:** `BRD.md`; chi tiết thư viện parser: `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md`; báo cáo Spike 1 và Spike 2 (`docs/spikes/SPIKE-1-EXPORT.md`, `docs/spikes/SPIKE-2-PARSER.md`).

### Lịch sử phiên bản

| Phiên bản | Ngày | Nội dung thay đổi chính |
| :--- | :--- | :--- |
| v0.1 | 2026-11-10 | Bản đặc tả sơ bộ ban đầu. |
| v0.2 | 2026-11-11 | Tái cấu trúc bám sát BRD v0.2: ma trận truy xuất BR-01 đến BR-08; Bitwig chuyển sang `.dawproject` (D-03); Mediabunny qua `MuxerAdapter` (D-04); trục Tick trong Unified AST (D-08); hệ tọa độ thiết kế logic (D-06); chuỗi dự phòng codec (D-05); Silent Audio (D-01); Pre-flight (REQ-EXPORT-00); ngưỡng hiệu năng gắn Máy chuẩn RM-1 (D-16). **Rà soát kiến trúc:** thêm Render Core dùng chung, Export Worker, giới hạn bộ nhớ audio, CSP đầy đủ (mục 2.4, Phụ lục B). |
| v1.0 | 2026-11-12 | **Chốt đường cơ sở yêu cầu** sau Spike 1 và Spike 2 (xem BRD v1.0): thêm REQ-GRAPHICS-06 (độ sáng theo automation), track `mix`/`automation` trong AST, đọc envelope Reaper (REQ-RPP-07 của thư viện), mục 2.6 ngăn xếp giao diện và Render Core (D-34 đến D-36), AT-17 và AT-18, SOI-18/19. Mục còn [VERIFY] giữ nguyên làm Open Issue có chủ. |
| v0.3 | 2026-11-12 | **Bổ sung sau cùng:** đa ngôn ngữ ngay từ đầu (REQ-I18N-01 đến 08, REQ-UI-09, NFR-COMP-03 sửa, AT-16); ghi đè tempo có dấu nhịp và 3 cách nhập mốc (REQ-PARSER-07, REQ-UI-06, AT-13); đề xuất widget và dữ liệu bổ sung (mục 3.4b); `IGNTEMPO` có mẫu cú pháp từ tài liệu Reaper; trạng thái Spike 1 và Spike 2: hoàn thành (Phụ lục B). **Theo Spike 1:** Silent Audio mặc định TẮT (REQ-EXPORT-03); nhập rộng × cao và tỉ lệ tuỳ ý (REQ-EXPORT-00); tên file chốt trước khi render (REQ-EXPORT-04); số đo A/V và tốc độ xuất; giới hạn di động. **Theo Spike 2:** thư viện parser độc lập (mục 2.5); không đoán tempo, ghi đè tempo theo mốc (REQ-PARSER-07, REQ-UI-06); widget Progress Bar (REQ-WIDGET-08, nay 8 widget). **Theo thư viện parser đã dựng:** `.als` XML thuần hoặc Gzip, sửa công thức clip/loop và đường dẫn đã kiểm bằng file thật (REQ-PARSER-01); `.alp` thật định dạng `pl-a` và chọn `.als` (REQ-PARSER-06, REQ-UI-07); cập nhật `.rpp`, `.dawproject`, `.mid`; parser nhị phân theo schema (REQ-PARSER-05); giới hạn nạp cập nhật (REQ-PARSER-00); AST thêm trường (REQ-AST-01); `.flp`/`.bwproject` ghi *chưa hỗ trợ*; mã lỗi và vấn đề còn mở cập nhật. |
| v1.1 | 2026-11-12 | **Chốt sau rà soát:** thêm §3.8 (REQ-GRAPHICS-09…13, REQ-STORAGE-05/06: easing, template nốt, hạt, storyboard, biểu thức, tài nguyên phiên, preset cộng đồng); NFR-SEC-05…07 (trình thông dịch biểu thức, CSP + Trusted Types + origin riêng, mức tin cậy preset); §3.4b chuyển từ đề xuất thành **phạm vi bản 1.0** (D-40); AT-19…AT-23; cập nhật §8: đóng SOI-01, SOI-08, SOI-12, SOI-13, SOI-14; mục cần dữ liệu thật theo Chương trình tệp mẫu (D-45); ID trùng `SOI-18` thứ hai đổi thành SOI-20. **Đối chiếu Spike 1** (`docs/spikes/`): REQ-GRAPHICS-05 tách ngưỡng cùng đường vẽ (≤ 1/255) và khác đường vẽ (theo số đo max diff 57/255; tiêu chí phần trăm điểm ảnh + PSNR, [PROVISIONAL]); AT-05 so ảnh trước mã hoá; SOI-03 đạt trên Windows; REQ-EXPORT-00 thêm giao diện chọn kích thước (khoá tỉ lệ, tỉ lệ dựng sẵn); REQ-GRAPHICS-04 thêm "Neo theo cạnh". **Bổ sung theo yêu cầu chủ dự án:** REQ-UI-10 (theme sáng/tối/theo hệ thống), REQ-UI-11 (bộ chọn màu HEX/RGB/RGBA/HSL/HSV/OKLCH, hút màu, nhập bảng màu), REQ-UI-12 (ẩn/hiện, solo track), REQ-GRAPHICS-14 (khoảng hiển thị theo thời gian, đổi track theo đoạn); REQ-GRAPHICS-07 thêm tuỳ chỉnh bàn phím và tên nốt trên phím; REQ-WIDGET-07 thêm tuỳ chỉnh hình dạng spectrum/waveform, nguồn stem theo track (1.2); REQ-GRAPHICS-06 giải thích đảo chiều và phân biệt với velocity. Thêm **REQ-AUDIO-01** (âm thanh theo track: người dùng xuất stem từ DAW, điều kiện tệp, tự ghép theo tên, chỉ dùng để phân tích, giới hạn bộ nhớ, hướng dẫn xuất stem trong ứng dụng; bản 1.2), `ERR_AUDIO_TOO_MANY`, AT-24. Thêm **REQ-GRAPHICS-15** (2.5D: xoay X/Y/Z, camera phối cảnh, preset góc nhìn; bản 1.1) và **REQ-EXPORT-08** (xuất nền trong suốt: chuỗi PNG, WebM VP9 alpha [VERIFY]; bản 1.0); REQ-GRAPHICS-03 mở khoá xoay từ 1.1 (D-47). REQ-EXPORT-08 thêm chọn lớp cho từng lần xuất (xuất nền và tiền cảnh riêng), "Xuất tách lớp" ở 1.1; REQ-GRAPHICS-15 thêm cách xử lý lớp nền khi xoay (mặc định gắn màn hình). Thêm **REQ-GRAPHICS-16** (thanh phát tuỳ chỉnh: kiểu, độ dày, màu, phát sáng, phản ứng khi chạm; sprite và keyframe ở 1.1), **góc chảy tự do 0–360°** trong REQ-WIDGET-01, **REQ-UI-13** (chế độ Cơ bản/Nâng cao, hỏi lần đầu, nút "Thêm tuỳ chọn" từng bảng, bảng phân bổ tính năng; D-48). |

### Quy ước trong tài liệu

* **[PROVISIONAL]**: giá trị tạm do nhóm soạn thảo chọn vì chưa có dữ liệu thực tế; cần đo hoặc review lại.
* **[VERIFY]**: cần đối chiếu với tài liệu chính thức hoặc file mẫu thật trước khi triển khai (R-10).
* **D-xx**, **OI-xx**, **BR-xx**, **OBJ-x**, **KPI-xx**, **R-xx**, **A-xx**: mã của BRD v0.2. **SOI-xx**: câu hỏi còn mở riêng của SRS (mục 8). **ARC-xx**: phát hiện từ rà soát kiến trúc (mục 2.4).
* **[ĐÃ KIỂM]** / **[ĐÃ ĐO]**: đã kiểm bằng file thật / số đo từ spike (v0.3).
* **REQ-xxx-nn**: yêu cầu chức năng. **NFR-xxx-nn**: yêu cầu phi chức năng. **ERR_xxx**: mã lỗi hiển thị cho người dùng (Phụ lục A).
* **"phải"** là bắt buộc; **"nên"** là khuyến nghị; **"có thể"** là tùy chọn. Đơn vị `pt` là điểm trên hệ tọa độ thiết kế logic (REQ-GRAPHICS-00), không phải điểm in ấn.

### Mục lục

1. Giới thiệu & mục tiêu hệ thống
2. Kiến trúc kỹ thuật, luồng dữ liệu & đánh giá kiến trúc
3. Yêu cầu chức năng chi tiết
4. Yêu cầu phi chức năng
5. Đặc tả giao diện & trải nghiệm người dùng
6. Ma trận truy xuất nguồn gốc yêu cầu
7. Điều kiện nghiệm thu và bàn giao
8. Các vấn đề còn mở của SRS
9. Phụ lục A (mã lỗi), Phụ lục B (ghi chú rà soát)

---
