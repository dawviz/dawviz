---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "5.4 Bảng màu dựng sẵn (đã kiểm AA, v0.5)"
path: "5. Theme giao diện chỉ đổi màu (D-52) > 5.4 Bảng màu dựng sẵn (đã kiểm AA, v0.5)"
chunk: 5-4-bang-mau-dung-san-da-kiem-aa-v0-5.md
source_lines: 350-412
source_sha1: a66e3a3c8c
ids: [REQ-GRAPHICS-02]
---
### 5.4 Bảng màu dựng sẵn (đã kiểm AA, v0.5)
Nền, bề mặt, kẻ và chữ **dùng chung** cho mọi bảng; mỗi bảng chỉ đổi nhóm nhấn. Giá trị dưới đây **đã kiểm AA** (v0.5; quy tắc và số đo ở cuối mục này); T-48 vẫn chạy kiểm tự động (5.2) khi dựng token.

| Token | Sáng | Tối |
| :--- | :--- | :--- |
| `bg` | `#EDECE8` | `#151617` |
| `surface` | `#F6F5F2` | `#1E1F21` |
| `surface-raised` | `#FFFFFF` | `#26282B` |
| `line` | `#D6D4CE` | `#33363A` |
| `line-control` | `#878580` | `#707378` |
| `line-strong` | `#1C1C1A` | `#E6E6E3` |
| `text` | `#1C1C1A` | `#E6E6E3` |
| `text-muted` | `#5E5C57` | `#A3A3A0` |
| `text-faint` | `#6C6963` | `#8E9091` |

| Bảng màu | `accent` sáng (`accent-text` trắng) | `accent` tối (`accent-text` = `bg` tối) |
| :--- | :--- | :--- |
| Studio cam (mặc định) | `#BE3D04` | `#FF6A2B` |
| Bản in đỏ | `#C8261E` | `#FF5A4F` |
| Đồng | `#85642E` | `#C9A467` |
| Riso hồng | `#BE2C7B` | `#FF5CB8` |

`danger` phải khác rõ `accent`: với bảng đỏ, `danger` dùng đỏ thẫm hơn kèm biểu tượng cảnh báo, để nút xuất không bị đọc như lỗi.

| Token | Sáng và tối | Ghi chú |
| :--- | :--- | :--- |
| `danger` | `#951A12` / `#FF8A80` | Thẫm hơn đỏ Bản in rõ rệt ở theme sáng (1,54:1 giữa hai màu); luôn kèm biểu tượng lỗi. |
| `warning` | `#8A5A00` / `#E8B44A` | Gần tông Đồng, nên luôn kèm biểu tượng cảnh báo; không dùng màu một mình để báo. |
| `success` | `#2E6B34` / `#7FC48A` | |
| `selection` | `#D3CFC6` / `#3B3F45` | Nền chữ được chọn, trung tính cho mọi bảng màu; `text` trên nó 10,98:1 / 8,47:1. |
| `focus` | = `accent` | Vòng focus 2 px. |
| `scrub-played`, `scrub-rest` | = `text`, = `line-control` | Thanh tua và mọi thanh trượt: phần đã chọn đậm như chữ, phần còn lại như viền điều khiển. Màu nhấn để dành cho trạng thái bật. |
| `waveform` | = `text-faint` | |
| `guide` | `#008C9E` (cả hai theme) | Xanh mòng két, khác tông cả bốn màu nhấn (cam, đỏ, đồng, hồng) và `danger`. Đường gióng vẽ trên khung video chứ không trên nền app, nên dùng một giá trị cho cả hai theme. Thay `#FF5500` cũ vì cam trùng tông Studio cam (REQ-GRAPHICS-02 đã sửa). |

#### Quy tắc tương phản (AA)
Ba quy tắc dưới đây sinh ra từ lần kiểm v0.5: giá trị khởi đầu v0.4 trượt ở đúng ba chỗ này. Mọi bảng màu, kể cả theme cộng đồng ở 1.1, phải giữ chúng; bộ kiểm khi nạp theme (5.2) từ chối theme vi phạm.

1. **Chữ phụ vẫn là chữ.** `text-faint` dùng cho chữ, nên đạt **4,5:1** trên `bg`, `surface` và `surface-raised` như mọi chữ khác. Muốn chi tiết nhạt hơn mức đó thì đó không còn là chữ (đường kẻ, dấu cắt, vạch chia), dùng token kẻ. Giá trị v0.4 (`#8D8A84` / `#6E6F70`) chỉ đạt 2,91:1 / 3,6:1.
2. **Điều khiển nhìn thấy được viền.** Viền ô nhập, ô chọn, ô đánh dấu, rãnh thanh trượt và nút phụ dùng `line-control`, đạt **3:1** trên cả ba nền (WCAG 1.4.11). `line` chỉ để phân vùng (1,25:1 / 1,49:1), không bao giờ là dấu hiệu duy nhất nhận ra một điều khiển.
3. **Màu nhấn đứng được trên mọi nền.** `accent` đạt **4,5:1** trên `bg`, `surface` và `surface-raised` (để làm chữ: thời gian kiểu nhạc, thẻ đang mở, liên kết), và `accent-text` đạt 4,5:1 trên `accent` (chữ nút chính). Ở v0.4, Studio cam, Đồng, Riso hồng sáng trượt trên `bg` (4,38 / 4,2 / 4,42:1).

Cách chỉnh: giữ nguyên tông và độ rực (OKLCH H, C), chỉ dịch độ sáng L tới mức đạt ngưỡng cộng một chút dư, để bảng màu không đổi tính cách.

**Trạng thái tô nhạt** (màu phủ có độ đục lên nền) cũng phải đạt các ngưỡng trên, đo sau khi trộn với từng nền `bg`, `surface`, `surface-raised`. Chỉ dùng các kiểu đã kiểm: `accent/15`, `accent/10`, `danger/10`, `warning/10` (`STATE_RULES` trong `apps/web/src/lib/theme.ts`). **Không** làm nhạt nút nhấn khi hover (`accent/90`): chữ trắng trên Đồng sáng chỉ còn 4,39:1; hover dùng vòng `line-strong` cách nút 2 px.

Số đo sau chỉnh (tỉ lệ thấp nhất trên `bg`/`surface`/`surface-raised`):

| Token | Sáng | Tối |
| :--- | :--- | :--- |
| `text` | 14,44:1 | 11,82:1 |
| `text-muted` | 5,65:1 | 5,84:1 |
| `text-faint` | 4,63:1 | 4,61:1 |
| `line-control` | 3,12:1 | 3,11:1 |
| `accent` Studio cam | 4,6:1 (chữ trắng trên nhấn 5,44:1) | 5,17:1 (`bg` trên nhấn 6,34:1) |
| `accent` Bản in đỏ | 4,73:1 (5,6:1) | 4,81:1 (5,89:1) |
| `accent` Đồng | 4,6:1 (5,44:1) | 6,33:1 (7,76:1) |
| `accent` Riso hồng | 4,63:1 (5,47:1) | 5,26:1 (6,45:1) |
| `danger` | 7,3:1 | 6,47:1 |
| `warning` | 5,01:1 | 7,78:1 |
| `success` | 5,43:1 | 7,15:1 |
| `guide` trên khung video | 4,0:1 trên `#FFFFFF` ("Bản in") | 4,81:1 trên `#0C0E16` (nền khung tối mặc định) |
