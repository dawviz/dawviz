---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)"
path: "DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)"
chunk: du-an-trinh-truc-quan-hoa-du-lieu-du-an-am-nhac.md
source_lines: 2-24
source_sha1: 3ea60fc182
ids: [BR-09, D-01, D-20, D-22, D-23, D-24, D-25, D-26, D-27, D-28, D-29, D-30, D-31, D-32, D-33, D-34, D-36, D-38, D-39, D-40, D-45, OI-09, OI-10, OI-11, OI-13, OI-14, OI-15, OI-16, OI-17, P-01, P-13]
---
## DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)

**Phiên bản:** v1.1 (2026-11-12: chốt phạm vi các bản phát hành 1.0 / 1.1 / 1.2, hướng tùy biến, biểu thức và mô hình kiểm duyệt cộng đồng; xem §4.4 và D-38…D-45. Đường cơ sở trước đó, v1.0: đường cơ sở yêu cầu cho giai đoạn xây dựng; Spike 1 và Spike 2 đã hoàn tất; tài liệu thư viện parser: `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md`; thiết kế ứng dụng: `docs/design/SDD.md`, `TDD.md`)

### Lịch sử phiên bản

| Phiên bản | Nội dung thay đổi chính |
| :--- | :--- |
| v0.1 | Bản đầu tiên. |
| v0.2 | Thêm mã BR-xx và KPI-xx để khớp ma trận truy xuất SRS; chuyển Bitwig sang `.dawproject`; thay `mp4-muxer` (đã deprecated) bằng Mediabunny; định nghĩa lại KPI A/V sync và KPI thời gian; hạ R-04 xuống thành giả định thiết kế; bổ sung rủi ro R-06 đến R-10; thêm Nhật ký quyết định (mục 7) và Open Issues (mục 8). |
| v1.0 | **Chốt đường cơ sở:** Spike 1 (đường ống xuất) và Spike 2 (thư viện parser, 66 test) đủ bằng chứng nên nâng lên 1.0. "1.0" nghĩa là yêu cầu được đóng băng để xây dựng, các mục còn **[VERIFY]** không bị giấu mà chuyển thành Open Issues có chủ (OI-10 đến OI-14) và được xử lý theo lộ trình. Thêm D-33 (độ sáng theo automation), D-34 đến D-36 (ngăn xếp giao diện, monorepo, TypeScript cho mã mới), mục 4.3 lộ trình M1 đến M5. |
| v0.3 | **Bổ sung sau cùng:** đa ngôn ngữ ngay từ đầu (tiếng Anh và tiếng Việt, cộng đồng đóng góp bản dịch; BR-09, D-30); ghi đè tempo có thêm **dấu nhịp** (4/4, 3/4, 12/8...) và nhập mốc theo kiểu đồng hồ DAW (D-31); đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11); trạng thái Spike 1 và Spike 2: hoàn thành. **Theo Spike 1:** Silent AAC chuyển sang mặc định TẮT (video-only khi không có audio, D-01 sửa); cho nhập tuỳ ý rộng × cao và tỉ lệ khung (D-26); tên file chốt trước khi render; ghi nhận lệch A/V trên di động (R-11). **Theo Spike 2:** tách parser thành thư viện độc lập (D-23); không còn fallback 120 BPM ngầm, người dùng ghi đè tempo theo mốc (D-24, D-29); thêm widget Progress Bar (D-27, nay 8 widget). **Theo thư viện parser:** thêm `.alp` thật (gói `pl-a`, chọn `.als` trong gói, D-25); `.als` nhận cả XML thuần và Gzip; parser nhị phân theo JSON schema (D-28); `.flp` và `.bwproject` ghi là *chưa hỗ trợ* (không phải "không hỗ trợ"); chốt D-20 đến D-22; cập nhật KPI/rủi ro/Open Issues bằng số đo thật. |
| v1.1 | **Chốt quyết định sau rà soát 2026-11-12.** Phạm vi theo bản phát hành (§4.4): **1.0** = lõi M1–M5 + tùy biến chính (easing, template nốt, morph cùng họ, hạt, bộ máy keyframe, lõi biểu thức, tài nguyên phiên, CSP) + toàn bộ widget đề xuất P-01…P-13; **1.1** = storyboard và Graph Editor đầy đủ, thư viện và kiểm duyệt cộng đồng, WebGL; **1.2** = Session View, xem trên di động, morph SVG tự do. Chốt D-38, D-39 (trước là đề xuất); thêm D-40…D-45. Đóng OI-09, OI-10, OI-11, OI-13 (phần quy trình), OI-15, OI-16, OI-17; các OI cần dữ liệu thật chuyển thành **Chương trình tệp mẫu** (D-45). |

### Quy ước nhãn trong tài liệu

* **[PROVISIONAL]**: giá trị tạm do nhóm soạn thảo chọn vì chưa có dữ liệu thực tế; cần đo hoặc review lại.
* **[VERIFY]**: cần đối chiếu với tài liệu chính thức hoặc file mẫu thật trước khi triển khai.
* **[ĐÃ ĐO]** / **[ĐÃ KIỂM]**: giá trị đã đo hoặc hành vi đã kiểm chứng bằng spike/file thật (ghi rõ nguồn).
* **D-xx**: mã quyết định, xem mục 7. **OI-xx**: câu hỏi còn mở, xem mục 8.

---
