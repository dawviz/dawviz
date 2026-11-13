---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2 Phát lại và âm thanh ⚪"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh ⚪"
chunk: 6-2-phat-lai-va-am-thanh.md
source_lines: 208-212
source_sha1: c8028d766d
ids: []
---
### 6.2 Phát lại và âm thanh ⚪
- **Không có audio:** `t` tiến theo `performance.now()` (chỉ trong lớp UI, không trong Render Core).
- **Có audio (M2/M3):** `AudioContext` là đồng hồ chủ: `t = audioCtx.currentTime − startedAt + offset`; UI đọc `t` mỗi khung. Tua = dừng source, tạo `AudioBufferSourceNode` mới từ vị trí mới. Offset audio người dùng chỉnh được (SRS). Trình duyệt chặn autoplay → chỉ tạo/resume `AudioContext` trong sự kiện bấm.
- Khi tab ẩn, `requestAnimationFrame` dừng; khi quay lại `t` được tính lại từ đồng hồ chủ, không cộng dồn.
