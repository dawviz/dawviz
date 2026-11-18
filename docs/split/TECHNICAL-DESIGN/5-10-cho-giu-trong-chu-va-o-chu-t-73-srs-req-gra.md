---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.10 Chỗ giữ trong chữ và Ô chữ 🟢 (T-73, SRS REQ-GRAPHICS-19, D-60/OI-18)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.10 Chỗ giữ trong chữ và Ô chữ 🟢 (T-73, SRS REQ-GRAPHICS-19, D-60/OI-18)"
chunk: 5-10-cho-giu-trong-chu-va-o-chu-t-73-srs-req-gra.md
source_lines: 213-220
source_sha1: edafc798ea
ids: [D-60, OI-18, REQ-GRAPHICS-19, WARN_PRESET_MIGRATED, WARN_PRESET_VALUE]
---
### 5.10 Chỗ giữ trong chữ và Ô chữ 🟢 (T-73, SRS REQ-GRAPHICS-19, D-60/OI-18)
- **Cú pháp** (`placeholders.ts`, thuần): `{tên}`, `{tên:định_dạng}` (tách ở dấu `:` đầu tiên), `{{` ra `{`. Tên là chữ-số-gạch dưới, bắt đầu bằng chữ. Chỗ giữ lạ hoặc định dạng sai kiểu giá trị thì **giữ nguyên chữ của mẫu** (đọc preset thì thêm `WARN_PRESET_VALUE`).
- **Giá trị `PV`:** chữ (không nhận định dạng), số (`0.0`, đệm `000`), thời gian tính bằng giây (`m:ss`, `mm:ss`, `m:ss.SSS`, `h:mm:ss`; cắt phần nghìn giây, không làm tròn, như đồng hồ DAW), danh sách (định dạng là chữ nối, `{notes:, }`). Mỗi giá trị có chữ mặc định riêng (`{bpm}` tối đa 2 số thập phân (`{tempo}` là tên cũ, cùng giá trị), `{pct}` số nguyên, thời gian `m:ss`).
- **Bộ chung** (`globalValues` ở `hud.ts`): các getter tính lười, đệm trong một lần layout của một widget, nên mẫu không dùng thì không tốn gì. `withLocals` chồng giá trị riêng của widget lên bộ chung (`{total}` của Thanh tiến độ là thời lượng, của Bộ đếm là số nốt; `{pct}` của Bộ đếm giữ `%` và `decimals`). Nguồn: AST, `Derived.hud` (`starts`, lưới nhịp, hợp âm) và các track hiển thị của widget; **không** `Date`/`Math.random`, nên Preview = Export.
- **`{chord}` ở mọi chữ:** hợp âm dò ở bước derived. `buildSceneHud` thêm nhóm track của mọi widget có `{chord` trong thuộc tính (`usesChordPlaceholder`) ngoài các widget Chord; ứng dụng dựng lại `hud` khi tập widget/nhóm track dùng nó đổi (`chordSig` ở `App.tsx`).
- **`TEXT`:** thuộc tính `{align, text, style, valueStyle}`; mỗi dòng của `text` là một mẫu, dòng trống chiếm đúng một dòng, chữ dài theo luật tràn khung của kiểu chữ (5.9). Tối đa 2000 ký tự (mẫu của các widget khác: 200).
- **Lược đồ 0.6.0:** thêm loại `TEXT`; 0.5.x di trú không đổi cấu trúc (`WARN_PRESET_MIGRATED`), preset cũ vẽ như cũ.
