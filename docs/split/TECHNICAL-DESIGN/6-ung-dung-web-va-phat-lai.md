---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6. Ứng dụng web và phát lại 🟡"
path: "6. Ứng dụng web và phát lại 🟡"
chunk: 6-ung-dung-web-va-phat-lai.md
source_lines: 137-158
source_sha1: 10dd2f7ff3
ids: [REQ-UI-02]
---
## 6. Ứng dụng web và phát lại 🟡

### 6.1 Trạng thái
| Trạng thái | Nơi giữ | Ghi chú |
|---|---|---|
| Tệp đã nạp `{ast, warnings, format}` | `App` (`useState`) | Bất biến; thay cả khối khi nạp tệp mới |
| Đồng hồ `{t, playing, rate}` | `App` (`useState` + `lib/clock.ts`) | Vòng `requestAnimationFrame` chỉ gọi `advance(s, dt, duration)` |
| Cấu hình độ sáng theo track | `App` | Sẽ chuyển vào `SceneDocument`/Preset (M2) |
| Ngôn ngữ | `I18nProvider` | `localStorage` có try/catch |
| Scene, lựa chọn widget, undo/redo ⚪ | Store riêng (M2) | Xem 6.3 |

### 6.2 Phát lại và âm thanh ⚪
- **Không có audio:** `t` tiến theo `performance.now()` (chỉ trong lớp UI, không trong Render Core).
- **Có audio (M2/M3):** `AudioContext` là đồng hồ chủ: `t = audioCtx.currentTime − startedAt + offset`; UI đọc `t` mỗi khung. Tua = dừng source, tạo `AudioBufferSourceNode` mới từ vị trí mới. Offset audio người dùng chỉnh được (SRS). Trình duyệt chặn autoplay → chỉ tạo/resume `AudioContext` trong sự kiện bấm.
- Khi tab ẩn, `requestAnimationFrame` dừng; khi quay lại `t` được tính lại từ đồng hồ chủ, không cộng dồn.

### 6.3 Chế độ chỉnh sửa ⚪ (M2)
- Mô hình lệnh (command pattern): mọi thay đổi Scene là `Command{ do, undo, mergeKey? }`; ngăn xếp undo ≥ 50 bước (REQ-UI-02); kéo thả gộp theo `mergeKey` thành một lệnh.
- Kéo/đổi cỡ widget: toạ độ logic; `snap(x, y, w, h, others, grid)` thuần (lưới 8/16 pt, ngưỡng guide ≤ 5 pt, phím `Alt/Shift`) – test bằng Node.
- Lớp tương tác (khung chọn, điểm neo, đường gióng) là DOM/SVG phủ lên canvas, **không** vẽ vào canvas của Render Core, nên tự động biến mất ở Preview/Export.
- Preview Mode: ẩn lớp tương tác và gọi cùng `renderFrame` (WYSIWYG).
