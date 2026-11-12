---
doc: ANIMATION.md
doc_title: "Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định"
section: "4. Việc cần làm (T-15)"
path: "4. Việc cần làm (T-15)"
chunk: 4-viec-can-lam-t-15.md
source_lines: 32-40
source_sha1: 60e6f9e591
ids: [AD-08, AD-12]
---
## 4. Việc cần làm (T-15)

1. `packages/render-core/src/motion.ts`: `clamp01`, `interpolate`, các easing (`linear`, `easeInOut`, `easeOutBack`, …), `spring` công thức đóng; test tất định (cùng `t` cùng kết quả, tua tới/lui bằng nhau).
2. Dùng thử ở nốt: hiệu ứng **xuất hiện** (phóng/làm mờ khi vào cửa sổ) và **bật sáng khi nốt bắt đầu** với thời gian tắt dần chỉnh được, đưa vào `NoteStyle`.
3. Test tĩnh quét mã nguồn Render Core tìm `Date`, `performance`, `Math.random`, `requestAnimationFrame` (đã nêu ở TECHNICAL-DESIGN mục 5.1, chưa làm).
4. Spike so sánh (tuỳ chọn) khi cần chuyển cảnh nâng cao.

Phần mở rộng (bộ easing đầy đủ, template chuyển cảnh nốt, hạt, storyboard) nằm ở [CUSTOMIZATION.md](../../design/CUSTOMIZATION.md) (AD-08…AD-12).
