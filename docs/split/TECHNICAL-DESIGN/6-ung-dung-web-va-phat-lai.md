---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6. Ứng dụng web và phát lại 🟡"
path: "6. Ứng dụng web và phát lại 🟡"
chunk: 6-ung-dung-web-va-phat-lai.md
source_lines: 164-197
source_sha1: cda0d46b82
ids: [D-50, REQ-UI-02, REQ-UI-14]
---
## 6. Ứng dụng web và phát lại 🟡

### 6.1 Trạng thái
| Trạng thái | Nơi giữ | Ghi chú |
|---|---|---|
| Tệp đã nạp `{ast, warnings, format}` | `App` (`useState`) | Bất biến; thay cả khối khi nạp tệp mới |
| Đồng hồ `{t, playing, rate}` | `App` (`useState` + `lib/clock.ts`) | Vòng `requestAnimationFrame` chỉ gọi `advance(s, dt, duration)` |
| Cấu hình độ sáng nền theo track | `App` → `Derived.brightness` | Mặc định `off` (đều nhau); truyền vào `renderFrame` qua `Derived`; vào Preset ở T-07 |
| Kiểu nốt (gồm phát sáng động) và bàn phím | `App`, lưu `localStorage` (`dawviz.prefs.v1.style`, `.keyboard`) | Ghép vào Piano Roll của `defaultScene()` mỗi lần đổi; vào Scene/Preset ở T-07 |
| Kiểu trình bày danh sách track | `App`, lưu `localStorage` (`dawviz.prefs.v1.trackLayout` = `{mode: 'grid'\|'list', columns: number\|'auto'}`) | Tuỳ chọn giao diện, không vào Preset (REQ-UI-14) |
| Ngôn ngữ | `I18nProvider` | `localStorage` có try/catch |
| Scene, lựa chọn widget, undo/redo ⚪ | Store riêng (M2) | Xem 6.3 |

### 6.2 Phát lại và âm thanh ⚪
- **Không có audio:** `t` tiến theo `performance.now()` (chỉ trong lớp UI, không trong Render Core).
- **Có audio (M2/M3):** `AudioContext` là đồng hồ chủ: `t = audioCtx.currentTime − startedAt + offset`; UI đọc `t` mỗi khung. Tua = dừng source, tạo `AudioBufferSourceNode` mới từ vị trí mới. Offset audio người dùng chỉnh được (SRS). Trình duyệt chặn autoplay → chỉ tạo/resume `AudioContext` trong sự kiện bấm.
- Khi tab ẩn, `requestAnimationFrame` dừng; khi quay lại `t` được tính lại từ đồng hồ chủ, không cộng dồn.

### 6.3 Danh sách track 🟢
SRS REQ-UI-14 (sửa theo D-50); `apps/web/src/components/TrackPanel.tsx`.

- **Hai kiểu:** `TrackGrid` (mặc định; App đặt ở hàng riêng `lg:col-span-2` dưới khung xem trước) và `TrackList` (dòng gọn trong cột phải, mở rộng tại chỗ bằng `AnimatePresence` + chiều cao `auto`). Phần dùng chung: `TrackHeader` (màu, tên, số nốt, độ sáng hiện tại khi nguồn ≠ `off`), `TrackControls` (độ sáng nền, đảo chiều, bỏ màu tuỳ chỉnh), `TrackInfo` (tầm cao độ, fader, lane automation có dữ liệu, ngưỡng). `TrackLayoutBar` chọn kiểu và số cột (dùng `NumberField`, tối đa = số track).
- **Số cột:** `effectiveColumns(chosen, widthPx, count)` (hàm thuần, có test): `fit = floor((W + gap)/(MIN_CARD_PX + gap))`, `MIN_CARD_PX = 224`; `auto` → `min(fit, count)`; số người dùng chọn → `min(chosen, fit)` và `limited = chosen > fit` để hiện thông báo. Bề rộng lấy bằng `ResizeObserver`; lưới vẽ bằng `grid-template-columns: repeat(cols, minmax(0, 1fr))`.
- **Animation:** mỗi thẻ là `motion.li` có `layout` và `layoutId = track-<id>` dùng chung giữa hai kiểu, bọc cả App trong `LayoutGroup`, nên đổi cột hoặc đổi kiểu thì thẻ di chuyển từ chỗ cũ sang chỗ mới (lò xo `stiffness 420, damping 38`). `MotionConfig reducedMotion="user"` tắt chuyển động khi hệ điều hành bật giảm chuyển động.
- **Dính khi cuộn:** khung xem trước và cột phải chỉ `lg:sticky` ở kiểu Danh sách; ở kiểu Lưới, nếu dính sẽ đè lên thẻ track ở hàng dưới (lỗi đã gặp khi kiểm 2026-11-12).
- **Bàn phím:** `arrowNav` tìm phần tử `[data-track-focus]` gần nhất theo hướng mũi tên bằng toạ độ thật, nên đúng với cả lưới tự động; Enter/Space mở dòng ở kiểu Danh sách.
- **Chống tràn:** mọi lưới con dùng `minmax(0, …)`; `SliderField` co nhãn (`minmax(0,7rem)`) và giữ thanh trượt ≥ 3rem; tên track `truncate`. Kiểm tự động bằng Playwright: đếm phần tử con vượt mép phải thẻ ở 1440/1100/800 px.

### 6.4 Chế độ chỉnh sửa ⚪ (M2)
- Mô hình lệnh (command pattern): mọi thay đổi Scene là `Command{ do, undo, mergeKey? }`; ngăn xếp undo ≥ 50 bước (REQ-UI-02); kéo thả gộp theo `mergeKey` thành một lệnh.
- Kéo/đổi cỡ widget: toạ độ logic; `snap(x, y, w, h, others, grid)` thuần (lưới 8/16 pt, ngưỡng guide ≤ 5 pt, phím `Alt/Shift`) – test bằng Node.
- Lớp tương tác (khung chọn, điểm neo, đường gióng) là DOM/SVG phủ lên canvas, **không** vẽ vào canvas của Render Core, nên tự động biến mất ở Preview/Export.
- Preview Mode: ẩn lớp tương tác và gọi cùng `renderFrame` (WYSIWYG).
