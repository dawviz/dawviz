---
name: DAW Visualizer
description: Bàn làm việc trật tự như thiết bị studio, bao quanh một khung video "bản in" trắng.
# Nguồn giá trị: apps/web/src/index.css (token theme, dạng "r g b") và tailwind.config.js. Theme tối là mặc định; khoá *-light là theme sáng.
colors:
  bg: "#151617"
  surface: "#1E1F21"
  surface-raised: "#26282B"
  line: "#33363A"
  line-control: "#707378"
  line-strong: "#E6E6E3"
  text: "#E6E6E3"
  text-muted: "#A3A3A0"
  text-faint: "#8E9091"
  accent: "#FF6A2B"
  accent-text: "#151617"
  selection: "#3B3F45"
  danger: "#FF8A80"
  warning: "#E8B44A"
  success: "#7FC48A"
  guide: "#008C9E"
  bg-light: "#EDECE8"
  surface-light: "#F6F5F2"
  surface-raised-light: "#FFFFFF"
  line-light: "#D6D4CE"
  line-control-light: "#878580"
  line-strong-light: "#1C1C1A"
  text-light: "#1C1C1A"
  text-muted-light: "#5E5C57"
  text-faint-light: "#6C6963"
  accent-light: "#BE3D04"
  accent-text-light: "#FFFFFF"
  selection-light: "#D3CFC6"
typography:
  title:
    fontFamily: "Inter Variable, Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "Inter Variable, Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "'cv11', 'ss01', 'tnum' (số)"
  label:
    fontFamily: "Inter Variable, Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  micro:
    fontFamily: "Inter Variable, Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
rounded:
  sm: "2px"
  md: "4px"
spacing:
  unit: "4px"
  hit: "24px"
  panel-x: "16px"
  row: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "{spacing.hit}"
  toggle-on:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    size: "{spacing.hit}"
  input-number:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "{spacing.hit}"
  keyframe-selected:
    backgroundColor: "{colors.accent}"
    size: "10px"
  keyframe:
    backgroundColor: "{colors.surface}"
    size: "10px"
---

# Design System: DAW Visualizer (apps/web)

Nguồn quyết định: `docs/design/UI-DIRECTION.md` (mục 5.3 cấu trúc D + A + E, mục 5.4 token màu, mục 7 nguyên tắc) và BRD D-51…D-54. Tệp này là bản rút gọn cho người và agent dựng giao diện; khi hai nơi lệch nhau, UI-DIRECTION và BRD thắng, và tệp này phải sửa theo.

Mã trong `apps/web` đã dựng theo hệ này (T-48 trở đi): token ở `src/index.css`, lớp dùng chung (`.tog`, `.seg`, `.btn-ghost`, `.field`, `.hit`) ở cùng tệp, component ở `src/components/`. Giao diện khung cũ (nền xanh đen, nhấn xanh dương, thẻ bóng đổ, nút viên thuốc, ánh sáng nền) là phản mẫu (UI-DIRECTION mục 2). Tệp này ghi lại hệ đã dựng; khi thêm component hay mẫu bố cục mới thì cập nhật mục Components/Layout trong cùng lần sửa (AI_CONTEXT quy tắc 3b).

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

Vai trò của màu nhấn, và chỉ những vai trò này: nút chính "Export video", gạch chân thẻ đang mở, dấu preset đang chọn, trạng thái bật của công tắc/nút chọn, thời gian kiểu nhạc khi đang phát, vạch dọc 2 px của dòng đang chọn (Lớp, cây thuộc tính của Timeline), **keyframe đang chọn** trên Timeline, khung chọn bằng hộp (`accent/10` + viền `focus`), `focus`. Màu nhấn đặc (nền) chỉ dành cho nút "Export video"; nút Phát dùng nền `text` với biểu tượng màu `bg`.

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
Thang cố định (px, không co giãn theo khung): **17** đậm 600 (tên widget đang chọn), **15** đậm 600 (tiêu đề mục inspector, tiêu đề panel Lớp), **13** (chữ chính: tên lớp, tiêu đề panel Timeline, ô thời gian), **12** (`text-xs`: nhãn inspector, ô số, nút phụ, dòng cây thuộc tính), **11** (nhãn thước Timeline, chip thời gian khi kéo, tên x1/y1 của bezier). Khoảng cách dòng `leading-tight`/`leading-snug` cho nhãn nhiều dòng. Các ràng buộc đã chốt:
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

Bố cục desktop, bản 1.0 chỉ desktop. Thanh trên hai hàng; dưới đó ba cột: cột trái hẹp, sân khấu ở giữa, inspector ở phải. Thẻ Editor có thêm panel **Timeline và keyframe** ở đáy (D-64). Quy tắc từng vùng theo UI-DIRECTION mục 5.3:

| Vùng | Quy tắc |
| :--- | :--- |
| Thanh trên, hàng 1 | Biểu tượng + "DAW Visualizer", tên file đang mở; bên phải: `Basic \| Advanced`, "Open file", nút chính "Export video" (màu nhấn), nút sáng/tối, ngôn ngữ |
| Thanh trên, hàng 2 | Thẻ **Preview / Editor / Settings**, thẻ đang mở gạch chân màu nhấn |
| Cột trái | "Video styles" (phong cách video, không gọi là theme): chỉ chứa preset scene (Paper, Mặc định), mỗi mục có ảnh thu nhỏ do Render Core vẽ, cắt quanh vạch phát và phóng ~2 lần. Bộ kiểu nốt dựng sẵn là chọn ở mục `02 Look`, không ở cột này |
| Sân khấu | Preview luôn trắng theo preset, kể cả theme tối. Khung "bản in thử": dấu cắt ở góc, thông số kỹ thuật dọc mép (kích thước, tỉ lệ, tên phong cách; không có thời gian, vì thời gian đã ở thanh phát), dải xám bên cạnh; mặc định bật, tắt được trong Settings |
| Thanh phát | Lùi / phát / tới (biểu tượng, không chữ), thanh tua có sóng âm mờ của file âm thanh nếu có, thời gian kiểu nhạc tô màu nhấn khi đang phát |
| Inspector | Mục đánh số `01 Song`, `02 Look`, `03 Tracks`…; "More options" ở đầu mục (REQ-UI-13); mọi thanh trượt có ô số căn phải (REQ-UI-15); dòng Nâng cao có nhãn nhỏ `ADV` |
| Dòng track | Tay nắm kéo đổi thứ tự, ô màu, mắt (ẩn/hiện), `S` (solo), số nốt căn phải. **Không** có khoá ở Preview; khoá chỉ ở danh sách lớp của Editor |
| Panel Editor (D-64) | Từ 1024 px: lưới ba cột (Lớp · sân khấu · Thiết lập) × hai hàng (trên · Timeline); cột Thiết lập cao hết hai hàng, Timeline nằm dưới Lớp và sân khấu. Mọi panel đổi cỡ bằng thanh chia, thu gọn được (Ctrl+B / Ctrl+Alt+B / Ctrl+J), cỡ nhớ trong localStorage (`lib/panelLayout.ts`). Dưới 1024 px: xếp dọc sân khấu → Lớp → Thiết lập → Timeline (cao 20rem), thanh chia ẩn |
| Timeline | Một vùng cuộn chung: cột cây thuộc tính **dính trái**, thước **dính trên**, hàng cao 24 px; nhóm "Biến đổi" và "Thuộc tính widget" gấp được. Làn có lề trái 10 px để keyframe ở 0:00 không bị cắt. Vạch chia dọc theo vạch thước (`line` 60%) |
| Phân vùng | Kẻ mảnh 1 px (`line`), không thẻ có bóng; bo góc nhỏ đồng nhất cho ô nhập và nút |
| Chữ | Một grotesk trung tính tự host cho mọi chữ; chữ số đều; nhãn mục lớn hơn chữ thường một bậc, không chữ khổng lồ |

Cơ bản / Nâng cao (REQ-UI-13): công tắc ở thanh trên đổi cả giao diện; ở thẻ Preview, Nâng cao mở rộng inspector **ngay tại chỗ** với cùng bố cục; ở Cơ bản, mỗi mục có "More options" để mở phần nâng cao của riêng mục đó. Thẻ Editor chứa thứ quá nhiều cho inspector (khung chọn và đường gióng, danh sách lớp, thuộc tính widget, timeline).

Bề rộng panel (mặc định, giới hạn kéo): Lớp 224 px (160–400), Thiết lập 336 px (272–560), Timeline cao 220 px (140–640), cột cây Timeline 300 px (248–480); dải thu gọn 36 px. Nhịp khoảng cách theo bậc 4 px: lề ngang panel 16 px, khoảng giữa các dòng trong mục 10 px, hàng danh sách/cây 24 px. Mật độ kiểu thiết bị, chịu được 15+ track và inspector Nâng cao dài gấp ba (mục gấp được); lưới dùng `minmax(0, 1fr)` để không tràn khung hẹp.

### Named Rules
**The Stage-First Rule.** Khung preview là vùng lớn nhất và nổi nhất màn hình ở thẻ Preview; không vùng giao diện nào tranh chỗ với nó.

**The Stage-Keeps-Its-Floor Rule.** Ở Editor, panel nhường chỗ trước sân khấu: khi cửa sổ hẹp hoặc thấp, cột lớn hơn co trước (không dưới giới hạn của nó) và Timeline thấp bớt, để sân khấu luôn còn tối thiểu 360 × 420 px. Cỡ người dùng đã lưu không bị ghi đè.

## Elevation & Depth

Phẳng. Chiều sâu chỉ đến từ bậc tông nền (`bg` → `surface` → `surface-raised`) và đường kẻ 1 px. Không bóng đổ, không kính mờ, không ánh sáng nền, không phát sáng.

Sân khấu có chiều sâu riêng theo kiểu bản in thử (E): khung trắng đặt trên `bg`, **dấu cắt mảnh ở bốn góc**, **thông số kỹ thuật chạy dọc mép** (kích thước, tỉ lệ, tên phong cách; không có thời gian, vì thời gian đã ở thanh phát), **dải xám** bên cạnh. Lớp đóng khung này mặc định bật, tắt được trong Settings, và nằm ngoài canvas (không bao giờ vào video xuất).

### Named Rules
**The No-Shadow-Card Rule.** Không có thẻ nổi có bóng. Vùng tách nhau bằng đường kẻ `line`, không bằng hộp.

## Shapes

Hình khối phẳng, gọn như mặt thiết bị. Đường kẻ phân vùng 1 px. Ô nhập và nút dùng **một bo góc nhỏ đồng nhất**: 4 px (`rounded`); nút bật/tắt nhỏ, ô trong nút chia đoạn và keyframe 2 px (`rounded-sm`); chấm và tay nắm tròn (`rounded-full`). Thanh trượt kiểu fader phẳng; công tắc và nút chọn kiểu nút vuông nhỏ của thiết bị. Khung preview giữ cạnh vuông của khung hình video.

Thanh trượt luôn đi kèm ô số căn phải (REQ-UI-15, D-49): không thuộc tính nào chỉ chỉnh được bằng chuột.

### Named Rules
**The 24-Pixel Hit Rule.** Mọi điều khiển bấm được có vùng nhận bấm tối thiểu 24 × 24 px (`--hit` trong `index.css`, WCAG 2.5.8 AA), dù phần nhìn thấy nhỏ hơn (ô màu 14 px, thanh trượt 16 px, nút ghost 20 px). Nới bằng vùng vô hình, không bằng chỗ chiếm trong bố cục: lớp `.hit`, `.btn-ghost`, `.tog` dùng `::after` căn giữa; ô nhập chữ/số, thanh trượt và ô màu (không có `::after`) dùng `--hit` làm chiều cao tối thiểu, hoặc padding trừ lề âm để phần nhìn thấy giữ nguyên. Điều khiển mới phải qua quy tắc này, không tự đặt cỡ riêng. Hai điểm cần biết: ô nhập số cao 24 px thay vì 22 px (khung nhìn thấy được); ô đánh dấu gốc 13 px luôn nằm trong `<label>` bấm được cả dòng, nên vùng bấm thật là cả dòng đó.

## Components

Mọi component dùng token màu qua lớp Tailwind (`bg-surface`, `text-muted`, `border-control`…), không màu cứng. Trạng thái chung: hover nền `surface-raised`, focus vòng 2 px `focus` (lệch 2 px, quy tắc chung trong `index.css`), tắt `opacity` 40–60% kèm con trỏ cấm.

### Nút
- **Nút chính** ("Export video"): nền `accent`, chữ `accent-text`, bo 4 px; hover là vòng `line-strong` cách 2 px, không làm nhạt nền.
- **Nút phụ**: nền `surface-raised`, viền `line-control`, chữ 12 px đậm 500, cao 24 px; hover viền `line-strong`.
- **Nút ghost** (`.btn-ghost`): chữ `text-muted`, hover nền `surface-raised`.
- **Nút bật/tắt nhỏ** (`.tog`, 24 px): bật = nền `selection` + vòng `line-strong` + chữ đậm. Dùng cho mắt, khoá, S, lọc Timeline, "vừa cả bài". **Ngoại lệ có chủ ý:** đồng hồ animate và ◆ tại vạch phát trên Timeline *không* dùng kiểu bật này (quá nặng khi lặp mỗi dòng): bật = biểu tượng `text` (tắt: `text-faint`), ◆ tô kín khi có keyframe tại vạch phát.
- **Nút chia đoạn** (`.seg` / `.seg-btn`, vai trò radio): ô đang chọn nền `surface-raised` + vòng `line-strong` + chữ đậm; màu trung tính, không màu nhấn.

### Ô nhập
- **Ô số** (`NumberField`): nền `surface-raised`, viền `line-control`, chữ số đều căn phải, cao 24 px; kéo trên ô để đổi (Shift ×10, Alt ×0,1), gõ phép tính/đơn vị; lỗi hiện chữ + biểu tượng, viền `danger`.
- **Ô thời gian** (`TimeField`): cùng dáng, `m:ss.mmm`, có trạng thái tắt.
- **Ô chọn** (`Select`): lớp `.field`, mũi tên vẽ bằng SVG.

### Mục inspector (`InspectorSection`)
Tiêu đề là một nút gấp/mở: mũi tên 12 px `text-faint` (xoay 90° khi mở) · số mục `01` 12 px `text-muted` · tên 15 px đậm 600, xuống dòng được. Gấp thì thân mục không vẽ; trạng thái nhớ theo id (`lib/sectionState.ts`), dùng chung Xem trước và Editor. Ngăn bằng kẻ `line` 1 px dưới mỗi mục.

### Thanh chia panel (`Splitter`)
Vô hình khi nghỉ (đường kẻ `line` của panel là đủ); vùng bấm 8 px; rê hoặc đang kéo hiện vạch `line-strong` 2 px, focus bàn phím hiện vạch `focus`. `role="separator"` có `aria-valuenow/min/max`; mũi tên 8 px (Shift 32), Home/End, Enter thu gọn, nhấp đúp về mặc định.

### Dải panel thu gọn (`Rail`)
Dải 36 px nền `surface`, cả dải là một nút mở: biểu tượng panel + tên chạy dọc 12 px `text-muted`; hover nền `surface-raised`. Dưới 1024 px là một hàng ngang.

### Timeline và keyframe (`TimelinePanel`, `KeyframeTimeline`)
- **Thanh tiêu đề** cao 36 px: nút panel, tiêu đề 13 px đậm 600, tên widget 12 px `text-muted`.
- **Góc công cụ** (trên cột cây, cao 28 px): lọc "chỉ thuộc tính đang animate", thu nhỏ, vừa cả bài, phóng to (`.tog`).
- **Thước**: nền `surface`, vạch chính `line-control` + nhãn 11 px `text-muted` số đều, vạch phụ `line`. Đầu vạch phát là ngũ giác nhỏ màu `text`; vạch phát dọc 1 px màu `text` (không màu nhấn, không phát sáng).
- **Dòng cây** (24 px): đồng hồ · tên 12 px (`text` khi đang animate, `text-muted` khi không; cắt bằng `…` kèm chú thích, cột cây đổi cỡ được) · giá trị tại vạch phát (ô số 60 px khi có keyframe, chữ `text-muted` khi đứng yên, "Theo nhạc" khi binding) · ◀ ◆ ▶ (tam giác đặc, 24 px). Dòng đang chọn: nền `surface-raised` + vạch `accent` 2 px bên trái (như Lớp).
- **Keyframe**: ô 10 px viền 1,5 px. Hình dạng mang thông tin cách đi tiếp: thoi (xoay 45°) = đều, vuông = giữ rồi nhảy, tròn = cong mượt. Chưa chọn: viền `text-muted`, nền `surface`, hover viền `text`. Đang chọn: nền và viền `accent`. Chấm 2 px `text-muted` dưới keyframe = gắn theo nhạc. Vùng bấm 24 px.
- **Đoạn nối** giữa keyframe: 1 px `line-control` 70%; sau keyframe "giữ rồi nhảy" là nét đứt.
- **Binding**: thanh cao 12 px, viền `line-control`, nền `surface-raised`, chữ 11 px "Theo nhạc · nguồn".
- **Chip thời gian khi kéo**: nền `surface-raised`, viền `line-control`, 11 px số đều, nằm trên keyframe.

### Animation Inspector (`AnimationInspector`, `EaseGraph`)
Mục 01 của cột Thiết lập khi Timeline đang chọn keyframe hoặc hàng; các mục sau lùi một số. Đồ thị đường cong vuông, rộng tối đa 15rem, nền `bg`, viền `line-control`: khung 0..1 và đường chéo "đều" bằng `line` (đứt), đường cong thật 2 px màu `text` (mờ `text-faint` khi nhiều giá trị), tay cầm là vạch `line-control` + chấm tròn nền `surface` viền `text`; tay nắm mờ 50% khi đường cong hiện tại không phải bezier. **Không dùng màu nhấn** trong đồ thị. Dưới đồ thị: ô chọn đường cong có tên, 4 ô số x1 y1 x2 y2 (D-49: mọi điều khiển kéo có ô số), "Giữa các keyframe", "Sau keyframe cuối", nút xoá. Nhiều keyframe khác nhau thì ô ghi "Nhiều giá trị".

### Named Rules
**The Shape-Carries-Meaning Rule.** Hình dạng keyframe là thông tin (cách đi tiếp), không phải trang trí; không thêm hình dạng hay màu nào chỉ để đẹp.

**The Timeline-Is-Quiet Rule.** Timeline lặp lại hàng chục lần một hàng: mọi trạng thái "bật" trên hàng dùng đổi màu biểu tượng/chữ, không hộp viền; màu nhấn chỉ cho keyframe và dòng đang chọn.

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
- **Do** cho panel mới của Editor đổi cỡ bằng `Splitter` và thu gọn được; dùng `lib/panelLayout.ts` cho giới hạn, không tự đặt cỡ cố định.
- **Do** để mục inspector mới đi qua `InspectorSection` (đánh số, gấp được); đừng tự vẽ tiêu đề mục.
- **Do** vẽ lớp chỉnh sửa của Editor (khung chọn, tay nắm, đường gióng, dấu khoảng cách đều) bằng một màu `guide` trên nền trắng của tay nắm; chip số đo trên khung nền trắng, chữ `#1C1C1A`, viền `guide`. Đường gióng nét liền; khung chờ của widget là chấm mảnh nhạt. Lớp này nằm trong bàn đệm quanh khung và không bao giờ vào canvas (T-68).

### Don't:
- **Don't** dùng nền xanh đen với màu nhấn xanh dương điện tử, gradient, kính mờ, phát sáng, thẻ bo góc có bóng xếp lưới đều, nút viên thuốc ở mọi nơi (mẫu "AI slop" của giao diện khung hiện tại, UI-DIRECTION mục 2).
- **Don't** đảo khung preview thành nền tối khi theme app tối.
- **Don't** dùng hơn một màu nhấn trên một màn hình.
- **Don't** dùng phông mono cho nhãn (hướng B) hoặc chữ khổng lồ làm trang trí (hướng F).
- **Don't** dùng nhãn bọc trong ngoặc kiểu `[IN HOA]`.
- **Don't** nhận CSS tuỳ ý trong theme, hoặc cho theme đổi phông, cỡ, khoảng cách, bố cục.
- **Don't** dùng `line` làm viền duy nhất của điều khiển, hoặc dùng màu cam của màu nhấn cho đường gióng.
- **Don't** tô màu nhấn cho vạch phát, đường cong easing hay keyframe chưa chọn; không phát sáng keyframe (ảnh thử AI của Timeline có cả hai, là phản mẫu).
- **Don't** để phím Delete/Ctrl+A trong Timeline lọt ra Editor (xoá hay chọn widget).
- **Don't** làm nhạt nền nhấn khi hover (`accent/90`): chữ trắng trên Đồng sáng chỉ còn 4,39:1.
- **Don't** dùng tên, bài hát hay nhận diện của kênh tham chiếu trong preset "Bản in".
- **Don't** dùng ảnh thử AI trong UI-DIRECTION mục 4 như ảnh chụp sản phẩm hay như bản vẽ chi tiết phải chép theo.
