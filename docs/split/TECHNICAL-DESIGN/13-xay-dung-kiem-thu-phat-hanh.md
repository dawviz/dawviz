---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "13. Xây dựng, kiểm thử, phát hành"
path: "13. Xây dựng, kiểm thử, phát hành"
chunk: 13-xay-dung-kiem-thu-phat-hanh.md
source_lines: 430-436
source_sha1: ce30ea1fc1
ids: [D-12, D-35, REQ-CAP-01]
---
## 13. Xây dựng, kiểm thử, phát hành
- **Công cụ:** npm workspaces; Vite (dev, build, Worker module); `tsc --noEmit` cho kiểu; Node ≥ 22.18 chạy `.ts` trực tiếp cho test logic.
- **Cổng chất lượng (CI đề xuất ⚪):** `npm test` → `npm run i18n:check` → `npm run typecheck` → `npm run build` → `npm run test:components`; sau đó (M3) test ảnh chụp bằng Playwright trên Chromium.
- **Trình duyệt hỗ trợ:** Chrome/Edge desktop (WebCodecs, File System Access); Firefox/Safari: dùng được Edit/Preview, xuất theo bậc dự phòng (REQ-CAP-01). Không hỗ trợ di động (D-12).
- **Phát hành:** tĩnh (build Vite) lên máy chủ tĩnh bất kỳ; không cần backend. Đặt `Cross-Origin-Opener-Policy`/`Embedder-Policy` chỉ khi sau này dùng `SharedArrayBuffer` (hiện không).
- **Phiên bản dữ liệu:** `schemaVersion` cho Preset/Pack; thay đổi AST phải tăng phiên bản parser và cập nhật Render Core + tài liệu trong cùng thay đổi (D-35).
