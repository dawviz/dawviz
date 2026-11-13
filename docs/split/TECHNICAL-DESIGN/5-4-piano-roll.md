---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.4 Piano Roll 🟢"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.4 Piano Roll 🟢"
chunk: 5-4-piano-roll.md
source_lines: 146-152
source_sha1: e5d905cf74
ids: [D-50]
---
### 5.4 Piano Roll 🟢
- Cửa sổ nhìn `windowSeconds`, playhead tại `playheadRatio`; `t0 = t − window × ratio`.
- `notesInRange(track, t0, t1)`: tìm nhị phân nốt đầu có `start ≥ t0 − maxDur`, duyệt tới khi `start > t1`; O(log n + k).
- Toạ độ x = `(start − t0) × pxPerSec`, y theo hàng cao độ `(pitchMax − pitch) × rowH`; độ rộng tối thiểu 1 px.
- Độ sáng nền: `trackBrightness` lấy tại thời điểm bắt đầu nốt (không nhấp nháy trong nốt); alpha = `clamp(brightness × opacity × (active ? 1 : inactiveOpacity), 0,05, 1)`. **Mặc định nguồn `off` → brightness = 1, mọi nốt như nhau** (D-50).
- Phát sáng: `NoteRect.glow = style.glow × glowAmount(...)` (mục 5.6); `glowBlur = glowRadius × glow × (0,4 + 0,6 × brightness)`.
