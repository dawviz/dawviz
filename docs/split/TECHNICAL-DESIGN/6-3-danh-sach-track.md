---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.3 Danh sách track 🟢"
path: "6. Ứng dụng web và phát lại 🟡 > 6.3 Danh sách track 🟢"
chunk: 6-3-danh-sach-track.md
source_lines: 298-307
source_sha1: 89531c2f60
ids: [D-50, REQ-UI-14]
---
### 6.3 Danh sách track 🟢
SRS REQ-UI-14 (sửa theo D-50); `apps/web/src/components/TrackPanel.tsx`.

- **Hai kiểu:** `TrackGrid` (mặc định; App đặt ở hàng riêng `lg:col-span-2` dưới khung xem trước) và `TrackList` (dòng gọn trong cột phải, mở rộng tại chỗ bằng `AnimatePresence` + chiều cao `auto`). Phần dùng chung: `TrackHeader` (màu, tên, số nốt, độ sáng hiện tại khi nguồn ≠ `off`), `TrackControls` (độ sáng nền, đảo chiều, bỏ màu tuỳ chỉnh), `TrackInfo` (tầm cao độ, fader, lane automation có dữ liệu, ngưỡng). `TrackLayoutBar` chọn kiểu và số cột (dùng `NumberField`, tối đa = số track).
- **Số cột:** `effectiveColumns(chosen, widthPx, count)` (hàm thuần, có test): `fit = floor((W + gap)/(MIN_CARD_PX + gap))`, `MIN_CARD_PX = 224`; `auto` → `min(fit, count)`; số người dùng chọn → `min(chosen, fit)` và `limited = chosen > fit` để hiện thông báo. Bề rộng lấy bằng `ResizeObserver`; lưới vẽ bằng `grid-template-columns: repeat(cols, minmax(0, 1fr))`.
- **Animation:** mỗi thẻ là `motion.li` có `layout` và `layoutId = track-<id>` dùng chung giữa hai kiểu, bọc cả App trong `LayoutGroup`, nên đổi cột hoặc đổi kiểu thì thẻ di chuyển từ chỗ cũ sang chỗ mới (lò xo `stiffness 420, damping 38`). `MotionConfig reducedMotion="user"` tắt chuyển động khi hệ điều hành bật giảm chuyển động.
- **Dính khi cuộn:** khung xem trước và cột phải chỉ `lg:sticky` ở kiểu Danh sách; ở kiểu Lưới, nếu dính sẽ đè lên thẻ track ở hàng dưới (lỗi đã gặp khi kiểm 2026-11-12).
- **Bàn phím:** `arrowNav` tìm phần tử `[data-track-focus]` gần nhất theo hướng mũi tên bằng toạ độ thật, nên đúng với cả lưới tự động; Enter/Space mở dòng ở kiểu Danh sách.
- **Chống tràn:** mọi lưới con dùng `minmax(0, …)`; `SliderField` co nhãn (`minmax(0,7rem)`) và giữ thanh trượt ≥ 3rem; tên track `truncate`. Kiểm tự động bằng Playwright: đếm phần tử con vượt mép phải thẻ ở 1440/1100/800 px.
