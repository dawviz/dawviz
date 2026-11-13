---
name: DAW Visualizer
description: Bàn làm việc trật tự như thiết bị studio, bao quanh một khung video "bản in" trắng.
---

<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: DAW Visualizer (apps/web)

Nguồn quyết định: `docs/design/UI-DIRECTION.md` (mục 5.3 cấu trúc D + A + E, mục 5.4 token màu, mục 7 nguyên tắc) và BRD D-51…D-54. Tệp này là bản rút gọn cho người và agent dựng giao diện; khi hai nơi lệch nhau, UI-DIRECTION và BRD thắng, và tệp này phải sửa theo.

Giao diện hiện có trong `apps/web` (nền xanh đen, nhấn xanh dương, thẻ bóng đổ, nút viên thuốc, ánh sáng nền) là **giao diện khung để kiểm parser/Render Core**, không phải thế giới hình ảnh này. Nó là phản mẫu, không phải điểm xuất phát (UI-DIRECTION mục 2).

## Overview

**Creative North Star: "Bàn in thử trong phòng máy"**

Giao diện là một thiết bị studio hiện đại đặt cạnh một tờ bản in thử: thân máy trật tự, dày đặc, mọi nhãn và con số đúng chỗ như chữ in lụa trên mặt thiết bị; ở giữa là khung video trắng được trình bày như một bản in đang kiểm, có dấu cắt ở góc và thông số kỹ thuật chạy dọc mép. Giao diện lùi lại để khung video là thứ nổi nhất màn hình.

Cấu trúc ghép từ ba nguồn (D-53): **mật độ và trật tự** của phần cứng studio (D), **kẻ mảnh, số mục 01–04 và số căn phải** của bản in Thuỵ Sĩ (A), **sân khấu đóng khung bản in thử** của phòng tối (E). Đây là một cấu trúc cố định; theme chỉ thay màu trên cấu trúc đó (D-52).

Trang trí phải mang thông tin: số mục, thông số khung, số liệu căn phải. Không có trang trí nào chỉ để đẹp.

**Key Characteristics:**
- Khung preview là video, luôn theo preset video (mặc định "Bản in" nền trắng, D-51), kể cả khi theme app tối.
- Một màu nhấn duy nhất cho mỗi bảng màu; nền, bề mặt, kẻ và chữ dùng chung cho mọi bảng.
- Phân vùng bằng đường kẻ 1 px, không bằng thẻ nổi có bóng.
- Một grotesk trung tính tự host cho mọi chữ, chữ số đều (tabular), số căn phải.
- Dày đặc nhưng chịu được 15+ track và inspector ở chế độ Nâng cao dài gấp ba.

### Named Rules
**The Two Worlds Rule.** Theme app không bao giờ chạm vào khung video, và preset video không bao giờ chạm vào giao diện app. Bất kỳ token app nào xuất hiện bên trong canvas là lỗi.

**The Colour-Only Theme Rule.** Một theme chỉ được khai báo giá trị cho các token màu đã định. Phông, cỡ, khoảng cách, bo góc, bố cục và component không thuộc theme; CSS tuỳ ý không được nhận (D-52).

## Colors

Chiến lược Restrained: trung tính xám ấm, cộng đúng một màu nhấn có vai trò. Giá trị dưới đây theo UI-DIRECTION 5.4 v0.5, **đã kiểm AA** (số đo ở đó); T-48 vẫn chạy kiểm tự động khi dựng token.

### Primary
Mỗi bảng màu dựng sẵn chỉ đổi nhóm nhấn. `accent-text` là chữ trên nền nhấn: trắng ở theme sáng, `bg` tối ở theme tối.

| Bảng màu | `accent` sáng | `accent` tối |
| :--- | :--- | :--- |
| **Studio cam** (mặc định) | `#BE3D04` | `#FF6A2B` |
| **Bản in đỏ** | `#C8261E` | `#FF5A4F` |
| **Đồng** | `#85642E` | `#C9A467` |
| **Riso hồng** | `#BE2C7B` | `#FF5CB8` |

Vai trò của màu nhấn, và chỉ những vai trò này: nút chính "Export video", gạch chân thẻ đang mở, dấu preset đang chọn, trạng thái bật của công tắc/nút chọn, thời gian kiểu nhạc khi đang phát, `focus`.

### Neutral
| Token | Sáng | Tối | Vai trò |
| :--- | :--- | :--- | :--- |
| `bg` | `#EDECE8` | `#151617` | Nền trang, vùng quanh sân khấu |
| `surface` | `#F6F5F2` | `#1E1F21` | Thanh trên, cột trái, inspector, thanh phát |
| `surface-raised` | `#FFFFFF` | `#26282B` | Ô nhập, menu, hộp thoại |
| `line` | `#D6D4CE` | `#33363A` | Đường kẻ phân vùng 1 px; không bao giờ là viền duy nhất của điều khiển |
| `line-control` | `#878580` | `#707378` | Viền ô nhập, ô chọn, ô đánh dấu, rãnh thanh trượt, nút phụ (3:1) |
| `line-strong` | `#1C1C1A` | `#E6E6E3` | Đường kẻ nhấn mạnh |
| `text` | `#1C1C1A` | `#E6E6E3` | Chữ chính |
| `text-muted` | `#5E5C57` | `#A3A3A0` | Nhãn, chú thích, đơn vị |
| `text-faint` | `#6C6963` | `#8E9091` | Bậc chữ phụ thứ ba (vẫn đạt 4,5:1) |

### Trạng thái và thanh phát
Chốt khi làm T-48 (UI-DIRECTION 5.4 v0.6): `danger` `#951A12` / `#FF8A80`, `warning` `#8A5A00` / `#E8B44A`, `success` `#2E6B34` / `#7FC48A` (sáng / tối), mỗi lỗi và cảnh báo luôn kèm biểu tượng; `selection` `#D3CFC6` / `#3B3F45`; `focus` = `accent`; thanh trượt và thanh tua dùng `scrub-played` = `text` và `scrub-rest` = `line-control`; `waveform` = `text-faint`. `guide` (đường gióng ở Edit Mode, REQ-GRAPHICS-02) là `#008C9E` ở cả hai theme: xanh mòng két khác tông mọi màu nhấn, vẽ trên khung video nên không đổi theo theme.

### Named Rules
**The One Signal Rule.** Mỗi màn hình chỉ có một màu nhấn, dùng cho đúng các vai trò kể trên. Không có màu nhấn thứ hai, không gradient, không phát sáng.

**The Danger-Is-Not-Accent Rule.** `danger` phải khác rõ `accent`; với bảng Bản in đỏ, `danger` dùng đỏ thẫm hơn và luôn đi kèm biểu tượng cảnh báo, để nút xuất không bị đọc như lỗi.

**The Faint-Is-Still-Text Rule.** `text-faint` là chữ, nên đạt 4,5:1 trên `bg`, `surface` và `surface-raised` như mọi chữ khác. Chi tiết nhạt hơn mức đó không phải chữ (đường kẻ, dấu cắt, vạch chia) và dùng token kẻ.

**The Visible-Edge Rule.** Điều khiển nhận ra được nhờ `line-control` (3:1 trên cả ba nền, WCAG 1.4.11). `line` chỉ để phân vùng, không bao giờ là dấu hiệu duy nhất của một điều khiển.

**The Accent-Anywhere Rule.** `accent` đạt 4,5:1 trên cả `bg`, `surface` và `surface-raised`, và `accent-text` đạt 4,5:1 trên `accent`. Khi chỉnh hoặc thêm bảng màu, giữ tông và độ rực (OKLCH H, C), chỉ dịch độ sáng L.

## Typography

**Body Font:** Inter Variable, tự host qua `@fontsource-variable/inter` (fallback `Inter, system-ui, sans-serif`)
**Display Font:** cùng Inter; không có phông display riêng
**Label/Mono Font:** không dùng phông mono cho nhãn

**Character:** Một grotesk trung tính làm mọi việc, giống chữ in lụa trên thiết bị: rõ, đều, không biểu cảm. Cá tính đến từ trật tự (số mục, căn phải, chữ số đều), không từ phông.

### Hierarchy
Cỡ, độ đậm, khoảng cách dòng: **[to be resolved during implementation]**. Các ràng buộc đã chốt:
- **Nhãn mục** (`01 Song`, `02 Look`, `03 Tracks`…): lớn hơn chữ thường đúng một bậc; số mục đứng trước tên mục.
- **Chữ thường và nhãn ở inspector:** đọc được ở 12–13 px (tiêu chí 3.6.3).
- **Số liệu:** `font-variant-numeric: tabular-nums`, căn phải trong cột.
- **Nhãn `ADV`:** nhãn nhỏ đánh dấu dòng chỉ có ở chế độ Nâng cao.

Phông trong **khung video** (Space Grotesk cho tiêu đề và hợp âm của preset "Bản in", D-51) thuộc thế giới video, do Render Core nạp; không dùng nó cho giao diện app.

### Named Rules
**The No-Giant-Type Rule.** Không có chữ khổng lồ làm trang trí (hướng F bị loại vì chữ "PREVIEW" chiếm 20% bề rộng mà không mang thông tin).

**The Self-Hosted Rule.** CSP chỉ cho `font-src 'self'`: mọi phông được đóng gói trong repo, có giấy phép mở (OFL), không nạp từ CDN.

**The Long-String Rule.** Mọi chữ đi qua `locales/en.json` và `locales/vi.json`; bố cục phải chịu được chuỗi tiếng Việt dài hơn tiếng Anh mà không tràn, không cắt mất nghĩa.

## Layout

Bố cục desktop, bản 1.0 chỉ desktop. Thanh trên hai hàng; dưới đó ba cột: cột trái hẹp, sân khấu ở giữa, inspector ở phải. Quy tắc từng vùng theo UI-DIRECTION mục 5.3:

| Vùng | Quy tắc |
| :--- | :--- |
| Thanh trên, hàng 1 | Biểu tượng + "DAW Visualizer", tên file đang mở; bên phải: `Basic | Advanced`, "Open file", nút chính "Export video" (màu nhấn), nút sáng/tối, ngôn ngữ |
| Thanh trên, hàng 2 | Thẻ **Preview / Editor / Settings**, thẻ đang mở gạch chân màu nhấn |
| Cột trái | "Video styles" (phong cách video, không gọi là theme); về sau có ảnh thu nhỏ do Render Core vẽ từ dự án đang mở |
| Sân khấu | Preview luôn trắng theo preset, kể cả theme tối. Khung "bản in thử": dấu cắt ở góc, thông số kỹ thuật dọc mép (kích thước, fps, thời điểm, tên phong cách), dải xám bên cạnh; mặc định bật, tắt được trong Settings |
| Thanh phát | Lùi / phát / tới (biểu tượng, không chữ), thanh tua có sóng âm mờ của file âm thanh nếu có, thời gian kiểu nhạc tô màu nhấn khi đang phát |
| Inspector | Mục đánh số `01 Song`, `02 Look`, `03 Tracks`…; "More options" ở đầu mục (REQ-UI-13); mọi thanh trượt có ô số căn phải (REQ-UI-15); dòng Nâng cao có nhãn nhỏ `ADV` |
| Dòng track | Tay nắm kéo đổi thứ tự, ô màu, mắt (ẩn/hiện), `S` (solo), số nốt căn phải. **Không** có khoá ở Preview; khoá chỉ ở danh sách lớp của Editor |
| Phân vùng | Kẻ mảnh 1 px (`line`), không thẻ có bóng; bo góc nhỏ đồng nhất cho ô nhập và nút |
| Chữ | Một grotesk trung tính tự host cho mọi chữ; chữ số đều; nhãn mục lớn hơn chữ thường một bậc, không chữ khổng lồ |

Cơ bản / Nâng cao (REQ-UI-13): công tắc ở thanh trên đổi cả giao diện; ở thẻ Preview, Nâng cao mở rộng inspector **ngay tại chỗ** với cùng bố cục; ở Cơ bản, mỗi mục có "More options" để mở phần nâng cao của riêng mục đó. Thẻ Editor chứa thứ quá nhiều cho inspector (khung chọn và đường gióng, danh sách lớp, thuộc tính widget, timeline).

Bề rộng cột, khoảng cách, nhịp: **[to be resolved during implementation]**. Ràng buộc: mật độ kiểu thiết bị, chịu được 15+ track và inspector Nâng cao dài gấp ba; lưới dùng `minmax(0, 1fr)` để không tràn khung hẹp.

### Named Rules
**The Stage-First Rule.** Khung preview là vùng lớn nhất và nổi nhất màn hình ở thẻ Preview; không vùng giao diện nào tranh chỗ với nó.

## Elevation & Depth

Phẳng. Chiều sâu chỉ đến từ bậc tông nền (`bg` → `surface` → `surface-raised`) và đường kẻ 1 px. Không bóng đổ, không kính mờ, không ánh sáng nền, không phát sáng.

Sân khấu có chiều sâu riêng theo kiểu bản in thử (E): khung trắng đặt trên `bg`, **dấu cắt mảnh ở bốn góc**, **thông số kỹ thuật chạy dọc mép** (kích thước, fps, thời điểm, tên phong cách), **dải xám** bên cạnh. Lớp đóng khung này mặc định bật, tắt được trong Settings, và nằm ngoài canvas (không bao giờ vào video xuất).

### Named Rules
**The No-Shadow-Card Rule.** Không có thẻ nổi có bóng. Vùng tách nhau bằng đường kẻ `line`, không bằng hộp.

## Shapes

Hình khối phẳng, gọn như mặt thiết bị. Đường kẻ phân vùng 1 px. Ô nhập và nút dùng **một bo góc nhỏ đồng nhất**; giá trị **[to be resolved during implementation]**. Thanh trượt kiểu fader phẳng; công tắc và nút chọn kiểu nút vuông nhỏ của thiết bị. Khung preview giữ cạnh vuông của khung hình video.

Thanh trượt luôn đi kèm ô số căn phải (REQ-UI-15, D-49): không thuộc tính nào chỉ chỉnh được bằng chuột.

## Do's and Don'ts

### Do:
- **Do** để khung preview luôn hiển thị đúng preset video (mặc định "Bản in" nền trắng) ở cả theme sáng lẫn tối.
- **Do** khai báo theme chỉ bằng các token màu `bg`, `surface`, `surface-raised`, `line`, `line-control`, `line-strong`, `text`, `text-muted`, `text-faint`, `accent`, `accent-text`, `focus`, `selection`, `danger`, `warning`, `success`, `scrub-played`, `scrub-rest`, `waveform`, `guide`; thiếu token nào thì lấy của theme mặc định.
- **Do** kiểm AA tự động khi nạp theme (chữ và `accent` 4,5:1 trên ba nền, `accent-text`/`accent` 4,5:1, `line-control` và `guide` 3:1) và từ chối cả theme nếu trượt.
- **Do** phân vùng bằng đường kẻ 1 px và đánh số mục `01`, `02`, `03` ở inspector.
- **Do** đặt mọi số liệu bằng chữ số đều, căn phải; mọi thanh trượt có ô số.
- **Do** làm hover của nút chính bằng vòng `line-strong` cách nút 2 px; chỉ dùng các kiểu tô nhạt đã có luật kiểm trong `STATE_RULES` (`accent/15`, `accent/10`, `danger/10`, `warning/10`).
- **Do** tự host mọi phông và đưa mọi chữ qua `locales/`.
- **Do** gọi phong cách khung video là "Video styles" / "Phong cách video", và theme app là "Giao diện ứng dụng".
- **Do** đặt khoá (lock) chỉ ở danh sách lớp của Editor; dòng track ở Preview có tay nắm kéo, ô màu, mắt, `S`, số nốt.

### Don't:
- **Don't** dùng nền xanh đen với màu nhấn xanh dương điện tử, gradient, kính mờ, phát sáng, thẻ bo góc có bóng xếp lưới đều, nút viên thuốc ở mọi nơi (mẫu "AI slop" của giao diện khung hiện tại, UI-DIRECTION mục 2).
- **Don't** đảo khung preview thành nền tối khi theme app tối.
- **Don't** dùng hơn một màu nhấn trên một màn hình.
- **Don't** dùng phông mono cho nhãn (hướng B) hoặc chữ khổng lồ làm trang trí (hướng F).
- **Don't** dùng nhãn bọc trong ngoặc kiểu `[IN HOA]`.
- **Don't** nhận CSS tuỳ ý trong theme, hoặc cho theme đổi phông, cỡ, khoảng cách, bố cục.
- **Don't** dùng `line` làm viền duy nhất của điều khiển, hoặc dùng màu cam của màu nhấn cho đường gióng.
- **Don't** làm nhạt nền nhấn khi hover (`accent/90`): chữ trắng trên Đồng sáng chỉ còn 4,39:1.
- **Don't** dùng tên, bài hát hay nhận diện của kênh tham chiếu trong preset "Bản in".
- **Don't** dùng ảnh thử AI trong UI-DIRECTION mục 4 như ảnh chụp sản phẩm hay như bản vẽ chi tiết phải chép theo.
