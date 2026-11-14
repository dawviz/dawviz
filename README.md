# DAW Visualizer

Trình trực quan hóa dự án âm nhạc (Ableton, Reaper, DAWproject, MIDI…) và xuất video ngay trong trình duyệt, không backend.

| Thư mục | Nội dung |
|---|---|
| `apps/web` | Ứng dụng React + TypeScript + Vite + Tailwind + Framer Motion (mốc M1: nạp file → Piano Roll → phát/tua, en/vi) |
| `apps/parser-lab` | Trang thử thư viện parser (HTML thuần) |
| `packages/*` | `@dawviz/parser-*` (đọc file dự án → Unified AST), `@dawviz/i18n`, `@dawviz/render-core` (khung hình = hàm của `t`) — xem `packages/README.md` |
| `locales/` | Danh mục ngôn ngữ dùng chung (en, vi; cộng đồng thêm: `docs/I18N.md`) |
| `docs/` | Tài liệu: `product/` (BRD, SRS 1.0), `design/` (SDD, TDD), `parser/`, `I18N.md` — xem `docs/README.md` |

**Đóng góp:** xem [CONTRIBUTING.md](CONTRIBUTING.md) (tài liệu, bản dịch, mẫu kiểm chứng, mã). Toàn bộ tài liệu công khai; trang web tài liệu dựng bằng `npm run docs:site`.

**Dùng với AI:** bắt đầu từ [AI_CONTEXT.md](AI_CONTEXT.md) (quy tắc + định tuyến), rồi [ARCHITECTURE.md](ARCHITECTURE.md), [SKELETON.md](SKELETON.md), [PROGRESS.md](PROGRESS.md).

## Bắt đầu
```bash
npm install            # cần mạng; Node >= 22.18
npm test               # parser + Render Core + logic ứng dụng (không cần trình duyệt)
npm run dev            # chạy ứng dụng web (Vite)
npm run build          # kiểm kiểu + build
npm run test:components  # Vitest (thành phần React)
npm run i18n:check     # kiểm danh mục ngôn ngữ
npm run docs:site      # dựng trang web tài liệu (dist-docs/); docs:serve để xem thử
npm run docs:sync      # tách tài liệu, sinh SKELETON/mục lục AI_CONTEXT, kiểm liên kết
npm run docs:check     # chỉ kiểm (exit 1 nếu cũ/hỏng)
```

## Tình trạng
- Đã chạy và xanh (2026-11-12): 66 test parser (21 trong số đó cần tệp mẫu ở `test/fixtures/third-party/`, thiếu thì tự bỏ qua), 12 test Render Core, 9 test logic ứng dụng, 4 test thành phần (Vitest), kiểm i18n, `typecheck` và `build` của `apps/web`.
- **Chưa kiểm tay trên trình duyệt** (Chrome): danh sách kiểm thủ công ở `docs/design/TDD.md` mục 5.
- **Tài liệu v1.1 (đã chốt 2026-11-12):** phạm vi các bản phát hành 1.0 / 1.1 / 1.2 ở BRD §4.4; tùy biến, danh mục hiệu ứng, biểu thức và kiểm duyệt cộng đồng ở `docs/design/CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`. Lịch: `PROGRESS.md` mục 5.1.
- Chưa có: xuất video (M3), lưu phiên (M4), 8 widget HUD (M2). Lộ trình: BRD mục 4.3.

## Giấy phép
Apache License 2.0 — xem [LICENSE](LICENSE). © 2026 các tác giả DAW Visualizer (DAW Visualizer contributors). Tác giả và ghi công (phong cách Paper theo kênh YouTube Usagin_P): [CREDITS.md](CREDITS.md). Tệp mẫu bên thứ ba không được commit (`test/fixtures/third-party/`), xem [test/fixtures/README.md](test/fixtures/README.md). Bộ kiểu và tài nguyên cộng đồng: [`presets/`](presets/README.md), [`assets/`](assets/README.md) ([hướng dẫn](docs/COMMUNITY-CONTENT.md)). Hướng dẫn đưa dự án lên GitHub lần đầu: [docs/PUBLISHING.md](docs/PUBLISHING.md).
