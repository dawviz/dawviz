---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.3 Hệ toạ độ và tỉ lệ 🟡"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.3 Hệ toạ độ và tỉ lệ 🟡"
chunk: 5-3-he-toa-do-va-ti-le.md
source_lines: 143-145
source_sha1: ce30ea1fc1
ids: []
---
### 5.3 Hệ toạ độ và tỉ lệ 🟡
Toạ độ widget tính bằng **pt logic** theo `designWidth × designHeight` của preset (1920×1080 cho 16:9…). Khi vẽ/xuất, `scale = W_target / designWidth`; mọi kích thước (nét, chữ, bo góc, x/y/w/h) nhân `scale`; chỉ làm tròn ở bước pixel cuối. `PianoRollCanvas` hiện dùng pixel của phần tử canvas và DPR (thay bằng `scale` khi có Scene).
