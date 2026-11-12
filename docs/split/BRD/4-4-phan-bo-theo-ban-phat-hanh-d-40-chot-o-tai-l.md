---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "4.4. Phân bổ theo bản phát hành (D-40, chốt ở tài liệu v1.1)"
path: "4. PHẠM VI DỰ ÁN (PROJECT SCOPE) > 4.4. Phân bổ theo bản phát hành (D-40, chốt ở tài liệu v1.1)"
chunk: 4-4-phan-bo-theo-ban-phat-hanh-d-40-chot-o-tai-l.md
source_lines: 138-149
source_sha1: dda5a7c4ca
ids: [D-14, D-40, D-43, D-44, D-45, D-47, D-48, D-49, P-01, P-13, REQ-AUDIO-01, REQ-GRAPHICS-07, REQ-GRAPHICS-14, REQ-UI-10, REQ-UI-14, REQ-WIDGET-07, SOI-12]
---
### 4.4. Phân bổ theo bản phát hành (D-40, chốt ở tài liệu v1.1)

Mốc M1–M5 ở §4.3 là các bước xây dựng **bản phát hành 1.0**. Phạm vi từng bản:

| Bản | Nội dung | Tài liệu chi tiết |
| :--- | :--- | :--- |
| **1.0** | Mọi mục §4.1. **Widget:** 8 widget cốt lõi + toàn bộ đề xuất P-01…P-13 (SRS 3.4b), gồm cả marker, lời bài hát, automation lane (parser đọc thêm). **Tùy biến chính:** bộ easing đầy đủ, template chuyển cảnh nốt bốn pha, morph cùng họ, hạt không trạng thái, bộ máy keyframe (nội suy, motion path, loop, modifier), Graph Editor cơ bản (value/speed graph, velocity bằng số), các hiệu ứng gắn nhãn `v1.0` trong danh mục, text animator cơ bản, mô hình dữ liệu storyboard, tài nguyên phiên, preset mới (`note-transition`, `easing`, `particle`, `theme`, `effect`). **Biểu thức:** lõi `@dawviz/expr` + ô nhập biểu thức có báo lỗi. **An toàn:** CSP, Trusted Types, watchdog, host ở tổ chức GitHub riêng. **Xuất:** thêm nền trong suốt (chuỗi PNG, WebM alpha nếu có) để ghép và xoay 3D trong phần mềm dựng (D-47). **Giao diện:** hai chế độ Cơ bản/Nâng cao (D-48), thanh phát tuỳ chỉnh, góc chảy nốt tự do 0–360°, theme sáng/tối/theo hệ thống, bộ chọn màu nhiều định dạng (HEX, RGB, RGBA, HSL, HSV, OKLCH) và nhập bảng màu, ẩn/hiện và solo track, tuỳ chỉnh bàn phím và tên nốt trên phím, khoảng hiển thị theo thời gian cho mọi widget, spectrum/waveform nhiều kiểu (SRS REQ-UI-10…12, REQ-GRAPHICS-07, REQ-GRAPHICS-14, REQ-WIDGET-07); danh sách track xếp dọc/ngang/lưới và ô nhập giá trị cho mọi điều khiển kéo (REQ-UI-14, 15; D-49). | `docs/design/CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`; SRS §3.4, §3.4b, §3.8 |
| **1.1** | Trình soạn storyboard đầy đủ (timeline nhiều lớp), Graph Editor đầy đủ, trình soạn biểu thức nâng cao (gợi ý, bake), text animator nâng cao, các hiệu ứng `v1.1` trong danh mục (gồm WebGL sau Spike), **thư viện preset cộng đồng trong ứng dụng** (D-14) và quy trình kiểm duyệt (D-43), gói phông cộng đồng, spectrum dạng tròn/xoắn ốc, **không gian 2.5D** (xoay X/Y/Z từng lớp và cả cảnh, camera phối cảnh, preset góc nhìn; D-47), nhập bảng màu `.ase` và Coolors, theme giao diện do cộng đồng đóng góp. | Như trên; `docs/COMMUNITY-CONTENT.md` |
| **1.2** | Ableton Session View; xem/phát trên di động và máy tính bảng; nạp audio tách track (stem, người dùng tự xuất từ DAW) để hiện spectrum/waveform/meter và hiệu ứng theo âm thanh riêng từng track (SRS REQ-AUDIO-01); morph đường SVG tự do; xem lại `.flp`/`.bwproject` (nếu có tệp mẫu), AAC bằng WASM, parser khai báo XML/JSON (SOI-12); các hiệu ứng nhãn `sau` trong danh mục. | D-44 |

Điều kiện phát hành mỗi bản: toàn bộ AT của các yêu cầu thuộc bản đó đạt; mục [VERIFY] chưa đủ dữ liệu được ghi là hạn chế đã biết (D-45).
