---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "5b. Lưới nốt: gộp Mật độ nốt, Tổng quan bản phối, Lưới chấm (D-77, T-139)"
path: "5b. Lưới nốt: gộp Mật độ nốt, Tổng quan bản phối, Lưới chấm (D-77, T-139)"
chunk: 5b-luoi-not-gop-mat-do-not-tong-quan-ban-phoi-lu.md
source_lines: 169-193
source_sha1: faa5b53b06
ids: [D-77]
---
## 5b. Lưới nốt: gộp Mật độ nốt, Tổng quan bản phối, Lưới chấm (D-77, T-139)

Ba widget cùng vẽ một lưới hàng × thời gian, ô sáng khi có nốt, kèm vạch phát. Gộp thành một loại `NOTE_GRID` (tên hiện: **Lưới nốt**) với các lựa chọn độc lập:

| Thuộc tính | Giá trị | Ghi chú |
|---|---|---|
| `rows` **Hàng theo** | `TRACK` / `PITCH` | Track: mỗi track một hàng (kể cả trống), tối đa `maxRows`. Cao độ: dải cao độ (`pitchRangeMode`, `pitchMin`, `pitchMax`), bỏ nốt trống; dải rộng hơn `maxRows` thì nhiều cao độ chung một hàng. |
| `span` **Khoảng hiện** | `SONG` / `WINDOW` | Cả bài: `cols` cột chia đều thời lượng, ô sáng khi có nốt **bắt đầu** trong cột (như hai widget cũ). Quanh vạch phát: mỗi cột một ô lưới nhịp (`grid` ô mỗi nốt tròn), lưới cuộn nguyên cột, vạch phát đứng ở `playheadRatio`; ô sáng suốt độ dài nốt. |
| `light` **Ô sáng theo** | `NOTES` / `DENSITY` / `VELOCITY` | Có nốt: độ đục 1. Mật độ: `minAlpha` → 1 theo số nốt so với ô nhiều nhất của hàng. Cường độ: `minAlpha` → 1 theo cường độ lớn nhất trong ô. Ô chưa phát nhân thêm `upcomingAlpha`. |
| `shape` **Hình ô** | `FILL` / `SQUARE` / `ROUND` / `BAR` | Ô đầy: chữ nhật kín ô trừ `cellGap`. Chấm vuông/tròn: cỡ `dotSize` của ô, có `activeScale` và `velocitySize`. Thanh liền: các ô sáng liền nhau cùng màu và độ đục nối thành một thanh, dày `dotSize` của hàng, bo góc tối đa bằng bề rộng một cột. |
| `playheadMark` **Vạch phát** | `LINE` / `COLUMN` | Vạch dọc dày `playheadWidth`, hoặc khung quanh cột đang phát. Màu rỗng = không vẽ. |
| `emptyColor` | màu hoặc rỗng | Ô trống vẽ khi `emptyAlpha` > 0; rỗng = màu của hàng. `emptyColorB` cho dải màu trên → dưới. |
| `showPolyphony` | bật/tắt | Dòng chữ `polyTemplate` (chỗ giữ `{poly}`) phía trên lưới, lưới lùi xuống. |
| `rowLabels` | bật/tắt | Cột nhãn bên trái: tên track, hoặc tên nốt C khi hàng theo cao độ. `beatLines` chỉ có ở Quanh vạch phát. |

**Chuyển preset cũ (lược đồ 0.9.0).** Khi đọc, loại cũ đổi thành `NOTE_GRID`, giữ nguyên mọi thuộc tính cũ (cùng tên) và đặt thêm:

| Loại cũ | Đặt thêm |
|---|---|
| `DENSITY` | `rows TRACK`, `span SONG`, `light DENSITY`, `shape FILL`, `maxRows 24`, `upcomingAlpha 1`, `emptyColor ''`, `emptyAlpha = minAlpha × 0,5`, `playheadMark LINE`, `playheadWidth 1,5` |
| `ARRANGEMENT` | `rows TRACK`, `span SONG`, `light NOTES`, `shape FILL`, `maxRows 32`, `cellGap 0,5`, `emptyAlpha 0`, `playheadMark LINE`, `showPolyphony false` |
| `DOTS` | `rows PITCH`, `span WINDOW`, `light NOTES`, `rowGap 0`, `playheadMark COLUMN`, `showPolyphony false` |

Thuộc tính cũ vắng thì lấy mặc định của loại cũ (không phải của Lưới nốt), nên hình vẽ như trước. Khác biệt duy nhất đã biết: vạch phát của Mật độ nốt cũ có độ đục 0,9 và dừng ở mép phải trừ 1 px, nay theo Lưới nốt (0,95, trừ bề dày vạch) — chênh nhau không thấy được. Keyframe cũ vẫn chạy vì đường dẫn thuộc tính không đổi; riêng hoạt hình `minAlpha` của Mật độ nốt cũ không còn kéo theo ô trống (ô trống nay theo `emptyAlpha`). Preset lưu từ bản mới là 0.9.0, bản cũ của ứng dụng báo "preset mới hơn" thay vì bỏ mất lớp.
