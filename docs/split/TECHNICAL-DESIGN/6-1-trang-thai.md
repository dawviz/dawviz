---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.1 Trạng thái"
path: "6. Ứng dụng web và phát lại 🟡 > 6.1 Trạng thái"
chunk: 6-1-trang-thai.md
source_lines: 211-221
source_sha1: 6f5f3c0f08
ids: [REQ-UI-14]
---
### 6.1 Trạng thái
| Trạng thái | Nơi giữ | Ghi chú |
|---|---|---|
| Tệp đã nạp `{ast, warnings, format}` | `App` (`useState`) | Bất biến; thay cả khối khi nạp tệp mới |
| Đồng hồ `{t, playing, rate}` | `lib/playback.ts` (kho riêng, ngoài store hoàn tác và ngoài state của `App`) | Vòng `requestAnimationFrame` chỉ gọi `advance(s, dt, duration)`; chỉ canvas, thanh phát và số đo đăng ký theo dõi |
| Cấu hình độ sáng nền theo track | Store (`Doc.brightness`) → `Derived.brightness` | Mặc định `off` (đều nhau); truyền vào `renderFrame` qua `Derived`; hoàn tác được; chưa vào Preset (Preset chỉ chứa scene) |
| Kiểu nốt (gồm phát sáng động) và bàn phím | Store (trong `Doc.scene`), bản sao lưu `localStorage` (`dawviz.prefs.v1.style`, `.keyboard`) | Nạp vào tài liệu ban đầu khi mở ứng dụng; không ghi khi scene đến từ preset mở từ tệp |
| Kiểu trình bày danh sách track | `App`, lưu `localStorage` (`dawviz.prefs.v1.trackLayout` = `{mode: 'grid'\|'list', columns: number\|'auto'}`) | Tuỳ chọn giao diện, không vào Preset (REQ-UI-14) |
| Ngôn ngữ | `I18nProvider` | `localStorage` có try/catch |
| Scene, phong cách video, kiểu nốt, độ sáng, ẩn/solo/thứ tự, undo/redo 🟡 | Store riêng `lib/store.ts` (T-07) | Xem 6.4; đồng hồ phát vẫn ở `lib/playback.ts` |
