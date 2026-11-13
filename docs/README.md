# docs — tài liệu của dự án

| Tài liệu | Nội dung |
|---|---|
| `product/BRD.md` | Yêu cầu nghiệp vụ v1.0: mục tiêu, KPI, phạm vi, rủi ro, nhật ký quyết định `D-xx`, lộ trình M1–M5, vấn đề mở `OI-xx` |
| `product/SRS.md` | Đặc tả yêu cầu phần mềm v1.0: `REQ-…`, `NFR-…`, `AT-…`, mã lỗi/cảnh báo, `SOI-xx` |
| `design/SDD.md` | Thiết kế ứng dụng: kho mã, Render Core, ứng dụng web, quyết định `AD-xx` |
| `design/TECHNICAL-DESIGN.md` | **Thiết kế kỹ thuật chi tiết**: luồng dữ liệu, thời gian/tick, parser, Render Core, phát lại, xuất video, lưu trữ, hiệu năng, bảo mật, CI; đánh dấu 🟢 đã làm / 🟡 khung / ⚪ thiết kế |
| `design/TDD.md` | Test Design Document (không phải bắt buộc làm test-driven): kiểm thử ứng dụng: chiến lược, danh mục test, ma trận truy vết, khoảng trống, danh sách kiểm thủ công |
| `design/ANIMATION.md` | So sánh công cụ làm hiệu ứng chuyển động và xuất video (Remotion, GSAP, Motion Canvas, Framer Motion); quyết định AD-07/D-37 |
| `design/CUSTOMIZATION.md` | **[Đề xuất]** Tùy biến tối đa: storyboard trực quan dễ dùng, template chuyển cảnh nốt, easing, hạt, tài nguyên của phiên, preset cộng đồng; đánh giá khả thi (AD-08…AD-12, D-38) |
| `design/ANIMATION-CATALOG.md` | **[Đề xuất]** Danh mục đầy đủ hiệu ứng và kiểu nội suy, đồ thị tốc độ của các trình dựng hiện đại, kèm ưu tiên v1.0/v1.1 |
| `design/EXPRESSIONS.md` | **[Đề xuất]** Ngôn ngữ biểu thức, mô hình mối đe doạ, trình thông dịch an toàn, phòng thủ nhiều lớp, kiểm duyệt cộng đồng (AD-13…AD-15, D-39) |
| `design/UI-DIRECTION.md` | Định hướng hình ảnh: khung preview "Bản in" đã chốt (D-51) và phân rã widget; chẩn đoán giao diện web; bộ prompt sinh ảnh để thử hướng giao diện web; nhật ký thử |
| `COMMUNITY-CONTENT.md` | Thư mục `presets/` và `assets/`, định dạng preset, quy tắc giấy phép, kế hoạch tách repo cộng đồng |
| `parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md` | Thư viện parser: yêu cầu (`REQ-ALS-…`, `REQ-RPP-…`, `REQ-AUTO-…`), thiết kế (quyết định `PD-xx`), 66 test |
| `spikes/SPIKE-1-EXPORT.md`, `spikes/SPIKE-2-PARSER.md` | Báo cáo hai spike kỹ thuật (xuất video; parser và AST) kèm bảng đối chiếu từng phát hiện với tài liệu hiện hành |
| `I18N.md` | Đa ngôn ngữ và hướng dẫn đóng góp bản dịch |
| `split/` | Kết quả tách (**sinh tự động, đừng sửa tay; không đưa vào git**) |

Tài liệu parser nằm cùng một cây vì cùng vòng đời với mã: đổi AST là đổi parser, Render Core, ứng dụng và tài liệu trong một thay đổi (BRD D-35). Hai bộ ID tách nhau bằng tiền tố (`PD-xx` cho quyết định của parser, `D-xx` cho sản phẩm, `AD-xx` cho ứng dụng).

## Hệ thống ngữ cảnh AI (ở thư mục gốc)
`AI_CONTEXT.md` (điểm vào + quy tắc + định tuyến), `ARCHITECTURE.md`, `SKELETON.md` (sinh tự động từ mã), `PROGRESS.md` (viết tay). `npm run docs:sync` tách tài liệu, sinh lại `SKELETON.md`, khối mục lục trong `AI_CONTEXT.md` và `docs/split/HEADINGS.md`, rồi kiểm tra liên kết (tệp + `#heading`), đường dẫn trong backtick ở 4 tệp lõi, ID không tồn tại, tài liệu bị bỏ quên (có trong `docs/` mà không trong `DEFAULT_DOCS` của `scripts/split_doc.py`). `npm run docs:check` chỉ kiểm, exit 1 khi cũ/hỏng. Liên kết viết tay phải trỏ `docs/split/<TÀI LIỆU>/<mảnh>.md#<heading>`; lấy bằng `node scripts/sync-docs.mjs --find "từ khóa"`. Tên mảnh là slug tiêu đề nên ổn định khi thêm mục khác; đổi tên tiêu đề thì liên kết tới nó sẽ bị báo hỏng.

## Quy trình chỉnh sửa
1. Sửa tài liệu nguồn (không sửa `split/`). Không đổi số ID cũ; thêm ID mới ở cuối nhóm.
2. Đổi mã thì cập nhật theo chiều: SRS (yêu cầu) → SDD (thiết kế) → TDD (test và số lượng). Với parser dùng bộ `PARSER-*`.
3. `npm run docs:sync` sinh lại `split/` và các tệp ngữ cảnh; `npm run docs:check` báo nếu cũ/hỏng (exit 1, dùng được trong CI).

## Đưa cho AI
- Nạp `split/INDEX.md` để biết có những mảnh nào, rồi chỉ nạp mảnh cần; `split/index.json` có bản đồ `ids` (ví dụ `REQ-GRAPHICS-06` → các file nhắc tới).
- Tra nhanh: `python3 scripts/split_doc.py --find REQ-GRAPHICS-06`.
- Tùy chọn: `--level N`, `--max-chars N`, `--out DIR`, `--list`, `--check`; danh sách tài liệu mặc định ở `DEFAULT_DOCS` trong `scripts/split_doc.py`. Chỉ cần Python >= 3.8.

## Công khai và đóng góp
Toàn bộ `docs/` (kể cả `docs/split`) được commit và công khai. Trang web tài liệu: `npm run docs:site` (kết quả ở `dist-docs/`, mở `index.html`); workflow `.github/workflows/docs.yml` dựng và triển khai lên GitHub Pages. Cách đóng góp: [CONTRIBUTING.md](../CONTRIBUTING.md).
