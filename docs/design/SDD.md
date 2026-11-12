# TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER

> Phiên bản tài liệu: 1.1 (2026-11-12: đồng bộ BRD/SRS v1.1; phạm vi bản phát hành ở BRD §4.4, tùy biến và biểu thức ở `CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`) · Đối chiếu `docs/product/SRS.md` (ID `REQ-…`, `ARC-…`, `NFR-…`) và BRD (`D-…`). Cơ chế và luồng chạy chi tiết: `TECHNICAL-DESIGN.md`. Thiết kế của thư viện parser nằm riêng ở `docs/parser/PARSER-SDD.md`. Tình trạng mã: **M1 đã có khung** (xem mục 8).

## 1. Phạm vi và nguyên tắc

- Ứng dụng chạy hoàn toàn trong trình duyệt, không backend (NFR-SEC-01). Dữ liệu người dùng ở lại trên máy.
- **Khung hình là hàm của thời gian:** `frame = f(AST, cấu hình, t)` (ARC-01, REQ-GRAPHICS-05). Không có trạng thái ẩn trong lúc vẽ, nên Preview và Export giống nhau và tua ngẫu nhiên tức thì (NFR-PERF-05).
- Tách ba tầng: **dữ liệu** (parser, AST) → **hiển thị** (Render Core, thuần) → **giao diện** (React). Mỗi tầng chỉ biết tầng bên trái.
- Mọi chuỗi hiển thị qua i18n theo mã (REQ-I18N); lỗi/cảnh báo của thư viện dịch theo `code`, thông điệp gốc chỉ là chi tiết kỹ thuật.

## 2. Cấu trúc kho mã (D-35)

```
dawviz/
├─ apps/web/            ứng dụng React (Vite, Tailwind, Framer Motion)
├─ apps/parser-lab/     trang thử thư viện parser (HTML thuần + Worker)
├─ packages/
│  ├─ core, midi, als, rpp, dawproject, binary, parser   @dawviz/parser-* (JS + JSDoc)
│  ├─ i18n/             @dawviz/i18n
│  └─ render-core/      @dawviz/render-core (TypeScript, hàm thuần)
├─ locales/             danh mục ngôn ngữ dùng chung (en, vi, …)
├─ schemas/ bin/ scripts/ test/ (test của parser)
└─ docs/  product/ design/ parser/ I18N.md split/ (sinh tự động)
```
Phụ thuộc một chiều: `apps/web → render-core → parser-core`; `apps/web → parser, i18n`. `render-core` không import React hay DOM.

## 3. Render Core (`@dawviz/render-core`, D-36)

| Mô-đun | Vai trò | Yêu cầu |
|---|---|---|
| `types.ts` | Kiểu tối thiểu của AST mà Render Core dùng | REQ-AST |
| `notes.ts` | `buildIndex` (nốt theo track, sắp theo thời gian, `maxDur`), `notesInRange`, `activeNotes` bằng tìm nhị phân: O(log n + k) mỗi khung | NFR-PERF-05 |
| `brightness.ts` | `trackBrightness(track, tempoMap, t, cfg)`; nguồn `volume` (mặc định), `static`, `pan`, `mute`, `off`; đảo chiều; track không có dữ liệu → 1 | REQ-GRAPHICS-06, D-33 |
| `pianoroll.ts` | `layoutPianoRoll(index, tempoMap, t, options)` → danh sách hình chữ nhật pixel (không vẽ). Cùng đầu vào cho cùng đầu ra | REQ-GRAPHICS-05 |
| `draw.ts` | `drawPianoRoll(ctx, rects, size)`: lớp vẽ duy nhất lên Canvas 2D/OffscreenCanvas; `Ctx2D` là giao diện tối thiểu nên test được bằng đối tượng giả | ARC-01, D-06 |

Độ sáng của nốt lấy tại thời điểm **bắt đầu nốt** (không đổi trong suốt nốt) để tránh nhấp nháy và giữ chi phí O(1) mỗi nốt. Phép nội suy lane volume/pan/mute và đổi gain → 0..1 dùng `sampleLane`/`volumeToUnit` của `@dawviz/parser-core` (nguồn sự thật duy nhất).

## 4. Ứng dụng web (`apps/web`, D-34)

| Phần | Thiết kế |
|---|---|
| `workers/parser.worker.ts` + `lib/parserClient.ts` | Một Worker module; `parseInWorker({name, buffer, files})` trả Promise; chuyển quyền sở hữu `ArrayBuffer`; lỗi là `ParseFailure{code, message, details}` |
| `lib/clock.ts` | Đồng hồ phát thuần: `advance`, `seek`, `togglePlay` (không đụng DOM) |
| `lib/problems.ts` | `describeProblem(i18n, kind, code, message, details)` → chuỗi dịch (`errors.*`, `warn.*`), rơi về thông điệp gốc nếu chưa có bản dịch |
| `i18n/I18nProvider.tsx` | Nạp `locales/*.json`, chọn ngôn ngữ (lưu `localStorage` có try/catch), đặt `<html lang dir>` |
| `components/` | `FileDrop`, `Notices`, `PianoRollCanvas`, `Transport`, `TrackPanel`, `LanguageSelect` |
| `App.tsx` | Giữ trạng thái: tệp đã nạp, đồng hồ `{t, playing, rate}`, cấu hình độ sáng theo track. Vòng `requestAnimationFrame` chỉ cập nhật `t` |

Luồng: chọn/thả tệp (kèm `.mid` ngoài nếu có) → Worker `parseProject` → `{ast, warnings}` → state → `PianoRollCanvas` gọi Render Core theo `t`. `PianoRollCanvas` xử lý DPR và kích thước; không có logic bố cục trong component.

**Framer Motion** chỉ dùng cho: khung thả tệp (hover/kéo), vào/ra của thông báo và danh sách track, chuyển cảnh sau khi nạp. Không dùng cho khung hình video.

## 5. Quyết định thiết kế của ứng dụng

| Mã | Quyết định | Lý do |
|---|---|---|
| **AD-01** | Render Core là hàm thuần, ngoài React | Dùng chung Preview/Export, test bằng Node, chạy trong Worker |
| **AD-02** | Trạng thái toàn cục nhỏ dùng `useState`/`useReducer`; chưa thêm thư viện state | Mới có ít trạng thái; thêm khi M2 (widget, preset) cần |
| **AD-03** | `t` là số duy nhất điều khiển hình ảnh; `rate`, loop chỉ ảnh hưởng cách `t` tiến | Tất định, dễ test, dễ xuất video theo khung |
| **AD-04** | Danh mục ngôn ngữ import tĩnh trong M1 | Ít ngôn ngữ; chuyển `import.meta.glob` khi cộng đồng thêm bản dịch |
| **AD-05** | Pan/mute là nguồn độ sáng "thử nghiệm", gắn nhãn trong giao diện | Chiều pan và nghĩa giá trị mute chưa kiểm (SOI-19) |
| **AD-06** | Tailwind v3 (cấu hình PostCSS) | Ổn định, tài liệu nhiều; xem lại khi chuyển Tailwind v4 |
| **AD-07** | Hiệu ứng chuyển động trong khung hình xuất là hàm thuần của `t` nằm trong Render Core (`interpolate`, easing, `spring` công thức đóng); Framer Motion/CSS chỉ cho giao diện; chưa đưa Remotion/GSAP/Motion Canvas vào lõi | Tua ngẫu nhiên và Preview=Export; không thêm khung dựng thứ hai; xem [ANIMATION.md](ANIMATION.md) |

## 6. Tính tất định và an toàn

- Không dùng `Math.random`, `Date.now` hay `performance.now` trong Render Core.
- Không `eval`; tệp người dùng chỉ được parser đọc trong Worker; giới hạn kích thước và độ sâu do parser áp dụng (xem PARSER-SRS).
- `localStorage` luôn bọc try/catch và ứng dụng chạy đúng khi không có nó.

## 7. Mở rộng

- **Widget mới (M2):** thêm hàm `layoutX(index, tempoMap, t, options)` vào Render Core + hàm vẽ trong `draw.ts`; giao diện chỉ thêm khung cấu hình.
- **Ngôn ngữ mới:** làm theo `docs/I18N.md` (thêm `locales/xx.json` + `index.json`; import ở `I18nProvider`).
- **Xuất video (M3):** gọi `layout*` + `draw*` với `OffscreenCanvas` trong Worker theo `t_k = k / fps`; Spike 1 là nguồn cho phần mã hoá/ghép.

## 8. Tình trạng (M1 — khung đầu)

Đã có và đã chạy test: Render Core (5 test), logic ứng dụng (đồng hồ, dịch lỗi: 4 test), parser (66 test). **Chưa được dựng/chạy thử:** `apps/web` (React/Vite/Tailwind/Framer Motion, kiểm thử thành phần) vì môi trường tạo gói không cho cài thư viện npm; cần `npm install` rồi `npm run build` và `npm run dev` trên máy có mạng, sau đó xử lý lỗi biên dịch nếu có. Các mục chưa làm của M1: chọn lớp phủ Track Info đầy đủ, chỉnh ngưỡng `floorDb`/`ceilDb` trong giao diện, nhập tempo ghi đè trong giao diện (M4).
