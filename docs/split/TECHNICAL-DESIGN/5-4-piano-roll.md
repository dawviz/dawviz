---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.4 Piano Roll 🟢"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.4 Piano Roll 🟢"
chunk: 5-4-piano-roll.md
source_lines: 146-154
source_sha1: b8f684ea5d
ids: [D-50]
---
### 5.4 Piano Roll 🟢
- Cửa sổ nhìn `windowSeconds`, playhead tại `playheadRatio`; `t0 = t − window × ratio`.
- `notesInRange(track, t0, t1)`: tìm nhị phân nốt đầu có `start ≥ t0 − maxDur`, duyệt tới khi `start > t1`; O(log n + k).
- Toạ độ x = `(start − t0) × pxPerSec`, y theo hàng cao độ `(pitchMax − pitch) × rowH`; độ rộng tối thiểu 1 px.
- Độ sáng nền: `trackBrightness` lấy tại thời điểm bắt đầu nốt (không nhấp nháy trong nốt); alpha = `clamp(brightness × opacity × (active ? 1 : inactiveOpacity), 0,05, 1)`. **Mặc định nguồn `off` → brightness = 1, mọi nốt như nhau** (D-50).
- Phát sáng: `NoteRect.glow = style.glow × glowAmount(...)` (mục 5.6); `glowBlur = glowRadius × glow × (0,4 + 0,6 × brightness)`.
- **Góc chảy (T-59, 2026-11-25):** `pianoRollLane(props, W, H, t, page?)` dựng hình học trên **làn** (u: thời gian, v: cao độ) qua `flowFrame(W, H, flowAngle, flowMirror)`: làn `Lw = W|cos| + H|sin|`, `Lh = W|sin| + H|cos|`; `span`/`pitchSpan` = đoạn trục thời gian/cao độ qua tâm nằm trong khung; `pianoRollGeometry` chạy trên `span` rồi dời `u0 = (Lw − span)/2`. Renderer tạo primitive trên làn rồi `flowRect` (góc bội 90°: vẫn thẳng trục, đổi rộng/cao; góc khác: `RectPrim.rotation`) và `flowLabel` (chữ đứng thẳng hoặc `TextPrim.rotation`). Góc 0, không lật: làn trùng khung, chuỗi lệnh vẽ như trước. Điểm phát hạt `NOTE` (emitter) dùng cùng `pianoRollLane` + `flowPoint`.
- **Vạch phát, bàn phím, lưới (T-58, T-51, 2026-11-25):** `playheadPrims` (LINE một hình; DASHED nhiều đoạn; BAND dải 35% + lõi 1 pt; GRADIENT 6 dải lồng; mũi tên ghép bằng lát chữ nhật, chờ primitive `poly`), `playheadHitAt` (nốt bắt đầu trong `playheadHitMs` vừa qua, mức = (1 − Δt/T) × velocity/127). `keyboardScaleAt` (thang âm theo `scene.tonic`/`keyAt`), `keyLabels` (tên theo `Derived.naming`). `gridLinesIn(BarGrid, t0, t1, beats)` (hud.ts) trả vạch phách/đầu ô nhịp trong cửa sổ, tính bằng tick nên đúng khi đổi tempo/nhịp. Trường mới của `PianoRollProps` đều tuỳ chọn; renderer điền mặc định (`rollProps`) nên tài liệu cũ vẽ y hệt.
