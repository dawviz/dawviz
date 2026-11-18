---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.10 Chỗ giữ trong chữ và Ô chữ 🟢 (T-73, SRS REQ-GRAPHICS-19, D-60/OI-18)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.10 Chỗ giữ trong chữ và Ô chữ 🟢 (T-73, SRS REQ-GRAPHICS-19, D-60/OI-18)"
chunk: 5-10-cho-giu-trong-chu-va-o-chu-t-73-srs-req-gra.md
source_lines: 213-223
source_sha1: 95f47009aa
ids: [D-60, OI-18, REQ-GRAPHICS-19, WARN_PRESET_MIGRATED, WARN_PRESET_VALUE]
---
### 5.10 Chỗ giữ trong chữ và Ô chữ 🟢 (T-73, SRS REQ-GRAPHICS-19, D-60/OI-18)
- **Cú pháp** (`placeholders.ts`, thuần): `{tên}`, `{tên:định_dạng}` (tách ở dấu `:` đầu tiên), `{{` ra `{`. Tên là chữ-số-gạch dưới, bắt đầu bằng chữ. Chỗ giữ lạ hoặc định dạng sai kiểu giá trị thì **giữ nguyên chữ của mẫu** (đọc preset thì thêm `WARN_PRESET_VALUE`).
- **Giá trị `PV`:** chữ (không nhận định dạng), số (`0.0`, đệm `000`), thời gian tính bằng giây (`m:ss`, `mm:ss`, `m:ss.SSS`, `h:mm:ss`; cắt phần nghìn giây, không làm tròn, như đồng hồ DAW), danh sách (định dạng là chữ nối, `{notes:, }`). Mỗi giá trị có chữ mặc định riêng (`{bpm}` tối đa 2 số thập phân (`{tempo}` là tên cũ, cùng giá trị), `{pct}` số nguyên, thời gian `m:ss`).
- **Bộ chung** (`globalValues` ở `hud.ts`): các getter tính lười, đệm trong một lần layout của một widget, nên mẫu không dùng thì không tốn gì. `withLocals` chồng giá trị riêng của widget lên bộ chung (`{total}` của Thanh tiến độ là thời lượng, của Bộ đếm là số nốt; `{pct}` của Bộ đếm giữ `%` và `decimals`). Nguồn: AST, `Derived.hud` (`starts`, lưới nhịp, hợp âm) và các track hiển thị của widget; **không** `Date`/`Math.random`, nên Preview = Export.
- **`{chord}` ở mọi chữ:** hợp âm dò ở bước derived. `buildSceneHud` thêm nhóm track của mọi widget có `{chord` trong thuộc tính (`usesChordPlaceholder`) ngoài các widget Chord; ứng dụng dựng lại `hud` khi tập widget/nhóm track dùng nó đổi (`chordSig` ở `App.tsx`).
- **`TEXT`:** thuộc tính `{align, text, style, valueStyle}`; mỗi dòng của `text` là một mẫu, dòng trống chiếm đúng một dòng, chữ dài theo luật tràn khung của kiểu chữ (5.9). Tối đa 2000 ký tự (mẫu của các widget khác: 200).
- **Tên lớp:** `WidgetSpec.name?` (tuỳ chọn, 1–60 ký tự, chỉ hiển thị trong ứng dụng, không vào video). `normalizeWidgetName`/`widgetNameKey` ở Render Core; `sanitizeScene` bỏ tên rỗng, quá dài hoặc trùng (so không phân biệt hoa/thường) kèm `WARN_PRESET_VALUE`. Ứng dụng kiểm trùng bằng `lib/layerName.ts` (so với tên đang hiển thị của mọi lớp, gồm cả tên theo loại) trước lệnh `renameWidget`; trùng thì **giữ tên cũ và báo lý do** (không hỏi lại). Nhân bản không mang tên.
- **Lược đồ 0.6.0:** thêm loại `TEXT`; 0.5.x di trú không đổi cấu trúc (`WARN_PRESET_MIGRATED`), preset cũ vẽ như cũ.

- **Mục Thiết lập khai báo một lần (`apps/web/src/lib/widgetFields.ts`):** `WIDGET_FIELDS[loại]` liệt kê từng thiết lập (đường dẫn trong `properties`, kiểu điều khiển, nhãn, Cơ bản/Nâng cao, điều kiện hiện, giới hạn). `WidgetSettings` vẽ điều khiển, nút ↺ và dấu "đã chỉnh nâng cao" từ bảng này; test `widgetFields.test.ts` bắt thuộc tính có trong mặc định mà thiếu trong bảng (hoặc trong `SETTINGS_EXEMPT`), nên thiết lập mới tự có ↺. ↺ so với `Doc.propsRef` (xem 6.1). Alt+nhấp (Option+nhấp trên Mac) vào nhãn của dòng khôi phục: làm một lần trong `ResetButton` (pha bắt sự kiện trên phần tử cha của nút, bỏ qua nhấp vào ô nhập), nên có hiệu lực ở mọi bảng dùng `ResetButton`, kể cả ngoài Thiết lập.
