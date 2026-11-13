---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.6 Phát sáng động khi chạm 🟢"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.6 Phát sáng động khi chạm 🟢"
chunk: 5-6-phat-sang-dong-khi-cham.md
source_lines: 155-165
source_sha1: 7d1c483e31
ids: [D-50, REQ-GRAPHICS-06, REQ-GRAPHICS-17]
---
### 5.6 Phát sáng động khi chạm 🟢
SRS REQ-GRAPHICS-17, D-50; `packages/render-core/src/glow.ts`, test `test/glow.test.ts`.

- **Trường trong `NoteStyle`** (nên có hai tầng toàn cục/theo track như mọi trường kiểu nốt): `glowMode` (`uniform` mặc định | `dynamic`), `glowSource` (`velocity` | `pitch` | `pan` | `fade` | `automation`), `glowPanMode` (`lr` mặc định | `spread`), `glowLane`, `glowMin` (0,15), `glowMax` (1), `glowInvert`, `glowRelease` (0–4 s, mặc định 0). `sanitizeStyle` điền mặc định cho trường vắng, nên tuỳ chọn/preset cũ vẫn đọc được.
- **Công thức:** `glowAmount = env(t) × (uniform ? 1 : lerp(glowMin, glowMax, s'))`, với
  - `env = 1` khi nốt đang phát hoặc `glowActiveOnly = false`; sau khi nốt hết, `env = 1 − (t − end)/glowRelease` trong `glowRelease` giây; ngoài ra `0` (không tính gì thêm).
  - `s` theo nguồn: velocity `v/127`; pitch theo tầm cao độ đang hiển thị của widget (`pitchMin..pitchMax` truyền vào `layoutPianoRoll`); pan = lane pan **lúc nốt bắt đầu** (không có lane thì `mix.pan`), qua `panUnit`: `lr` giữ `u`, `spread` = `|2u − 1|` (giữa yếu nhất, lệch càng nhiều càng mạnh); fade `1 − (t − start)/(end − start)`; automation = `laneUnit(glowLane)` **tại t** (lane loại `pan` cũng qua `panUnit`).
  - `s' = glowInvert ? 1 − s : s`; nguồn không có dữ liệu → `s = 1` (sáng như đều nhau).
- **Ranh giới:** chỉ đổi cường độ phát sáng (`glow`), không đổi độ đục; độ đục do độ sáng nền (REQ-GRAPHICS-06) và `opacity/inactiveOpacity`. Pha `hit` của template nốt (T-18) sẽ gọi cùng `glowSourceValue` để dùng chung bộ tiêu chí.
- **Thêm tiêu chí mới:** thêm giá trị vào `GLOW_SOURCES` + một nhánh trong `glowSourceValue` trả 0..1 + chuỗi `web.glow.source.<x>` và `web.glow.hint.<x>`; không đụng `glowAmount`, `layoutPianoRoll` hay giao diện khác.
