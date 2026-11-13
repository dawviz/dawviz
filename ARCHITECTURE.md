# ARCHITECTURE — kiến trúc tổng thể

> Tóm tắt kiến trúc để AI/lập trình viên nắm nhanh. Chi tiết nằm ở các mảnh tài liệu được liên kết (mở đúng mảnh cần dùng, đừng nạp cả tài liệu). Điều hướng: [AI_CONTEXT.md](AI_CONTEXT.md) · cấu trúc mã: [SKELETON.md](SKELETON.md) · trạng thái: [PROGRESS.md](PROGRESS.md).

## 1. Bức tranh một đoạn

Ứng dụng chạy hoàn toàn trong trình duyệt, không backend. Tệp dự án âm nhạc đi qua **parser** (Web Worker) để thành một **Unified AST** thống nhất theo tick; **Render Core** biến `(AST, cấu hình, t)` thành khung hình bằng hàm thuần; **Preview** (Canvas, luồng chính) và **Export** (OffscreenCanvas + WebCodecs, Worker) dùng *cùng* hàm đó nên hình ảnh khớp nhau. Chi tiết: [Technical Design §1 Bức tranh tổng thể](docs/split/TECHNICAL-DESIGN/1-buc-tranh-tong-the.md#1-bức-tranh-tổng-thể).

```text
 tệp dự án ─► [Worker] detectFormat → probeProject → parseProject → buildAST ─► UnifiedProjectAST
                                                                                   │
        SceneDocument (preset) ─────────────────────────────────────────┐          ▼
                                                                         ▼   dữ liệu dẫn xuất (chỉ mục nốt, hợp âm…)
                                              renderFrame(scene, derived, ast, t, target, scale)
                                                   │                                   │
                                      Preview (Canvas, UI React)          Export (OffscreenCanvas → WebCodecs → Mediabunny → MP4/WebM)
```

Ba nguyên tắc: (1) **khung hình là hàm của `t`**, không trạng thái ẩn (ARC-01); (2) **tick (PPQ 960) là nguồn sự thật về thời gian**, giây là giá trị suy ra từ `tempoMap`; (3) **nặng thì ở Worker, vẽ thì ở Render Core, React chỉ giữ trạng thái**.

## 2. Luồng dữ liệu chính: từ `.rpp` đến khung hình

Ví dụ với Reaper vì có nhiều trường hợp biên nhất. Các định dạng khác chỉ khác bước 3.

| Bước | Việc xảy ra | Mã | Tham chiếu |
|---|---|---|---|
| 1. Chọn tệp | Giao diện nhận tệp chính (+ `.mid` ngoài nếu có), gửi sang Worker, chuyển quyền sở hữu `ArrayBuffer` | `apps/web/src/components/FileDrop.tsx`, `apps/web/src/lib/parserClient.ts`, `apps/web/src/workers/parser.worker.ts` | [Technical Design §3 Đường ống phân tích](docs/split/TECHNICAL-DESIGN/3-duong-ong-phan-tich-parser.md#3-đường-ống-phân-tích-parser-) |
| 2. Nhận dạng | `detectFormat` theo đuôi + magic bytes; `.flp`/`.bwproject` trả `ERR_UNSUPPORTED_FORMAT` kèm hướng dẫn. `probeProject` cho biết cần thêm `.mid` ngoài hay schema (giao diện chỉ hiện ô nạp khi cần) | `packages/parser/src/index.js` | [PARSER-SDD §8](docs/split/PARSER-SDD/8-package-parser-bao-ngoai.md#8-package-parser-bao-ngoài) |
| 3. Phân tích Reaper | `parseRppTree` (tokenize theo dòng, cây khối) → `parseRppText`: tempo từ `TEMPO` + `TEMPOENV*`; mỗi `TRACK`/`ITEM`: chọn take, đọc nguồn `MIDI` nhúng / pool GUID / `.mid` ngoài; **chỉ nhận `HASDATA 1 <ppq> QN`**, đơn vị khác bị bỏ + `WARN_RPP_SRC_UNIT`; đổi giây → tick qua `secToTick`; nhân bản loop, cắt nốt ngoài item; đọc envelope volume/pan/mute của track vào `track.automation` và `VOLPAN` vào `track.mix` | `packages/rpp/src/rpp.js` | [PARSER-SDD §5 Package rpp](docs/split/PARSER-SDD/5-package-rpp-req-rpp.md#5-package-rpp-req-rpp-) · [SRS REQ-PARSER-02](docs/split/SRS/req-parser-02-cockos-reaper-rpp.md#req-parser-02-cockos-reaper-rpp) · [PARSER-SRS §3.6](docs/split/PARSER-SRS/3-6-reaper-rpp-verify.md#36-reaper-rpp--verify) |
| 4. Chuẩn hoá | `buildAST`: tick về PPQ 960, tính `startTimeSeconds/endTimeSeconds` một lần, kiểm bất biến (pitch 0..127, velocity 1..127, tempo 10..1000 BPM, ≤ 500.000 nốt), sắp nốt, ghép `mix`/`automation`, gom cảnh báo | `packages/core/src/ast.js`, `packages/core/src/tempo.js` | [SRS §3.2 Unified AST](docs/split/SRS/3-2-cau-truc-du-lieu-chuan-hoa-unified-ast-d-08.md#32-cấu-trúc-dữ-liệu-chuẩn-hóa-unified-ast-d-08-d-09) · [Technical Design §2](docs/split/TECHNICAL-DESIGN/2-mo-hinh-du-lieu-va-thoi-gian.md#2-mô-hình-dữ-liệu-và-thời-gian-) |
| 5. Về giao diện | Worker trả `{ast, warnings, format, ms}` hoặc `{code, message, details}`; giao diện dịch lỗi/cảnh báo **theo mã** | `apps/web/src/lib/problems.ts`, `apps/web/src/App.tsx` | [Technical Design §9 Đa ngôn ngữ](docs/split/TECHNICAL-DESIGN/9-da-ngon-ngu.md#9-đa-ngôn-ngữ-) |
| 6. Dữ liệu dẫn xuất | `buildIndex`: nốt theo track sắp theo thời gian + `maxDur`, để tìm nốt trong cửa sổ bằng tìm nhị phân | `packages/render-core/src/notes.ts` | [Technical Design §4](docs/split/TECHNICAL-DESIGN/4-du-lieu-dan-xuat-derived.md#4-dữ-liệu-dẫn-xuất-derived-) |
| 7. Bố cục | `layoutFrame(scene, derived, ast, t)`: sắp widget theo `zIndex`, mỗi `WidgetRenderer.layout` trả `Primitive[]` (pt, thuần, test bằng Node). Piano Roll dùng `layoutPianoRoll`/`layoutKeyboard`; độ sáng từng nốt qua `trackBrightness` | `packages/render-core/src/render.ts`, `packages/render-core/src/scene.ts`, `packages/render-core/src/pianoroll.ts`, `packages/render-core/src/brightness.ts` | [Technical Design §5 Render Core](docs/split/TECHNICAL-DESIGN/5-1-giao-dien-chinh.md#51-giao-diện-chính-) |
| 8. Vẽ | `renderFrame(scene, derived, ast, t, target, scale)` → nền, rồi từng widget cắt theo khung + `drawPrimitives`, lên Canvas 2D (Preview) hoặc OffscreenCanvas (Export, M3) | `packages/render-core/src/render.ts`, `apps/web/src/components/SceneCanvas.tsx` | [SRS §3.3 Đồ họa Canvas (REQ-GRAPHICS-05, 06)](docs/split/SRS/req-graphics-05-render-core-dung-chung-arc-01-d.md#req-graphics-05-render-core-dùng-chung-arc-01-d-20) |
| 9. Phát lại | Vòng `requestAnimationFrame` chỉ tăng số `t` (`advance`); mọi thứ nhìn thấy là hàm của `t` | `apps/web/src/lib/clock.ts`, `apps/web/src/App.tsx` | [Technical Design §6 Phát lại](docs/split/TECHNICAL-DESIGN/6-1-trang-thai.md#61-trạng-thái) |
| 10. Xuất video (M3, chưa làm) | `t_k = start + k/FPS`, `renderFrame` → `VideoFrame` → `VideoEncoder` (kiểm soát `encodeQueueSize`) → Mediabunny; dự phòng H.264/AAC → video-only → VP9/Opus WebM | — | [Technical Design §7 Xuất video](docs/split/TECHNICAL-DESIGN/7-duong-ong-xuat-video-m3-spike-1-la-co-so.md#7-đường-ống-xuất-video--m3-spike-1-là-cơ-sở) · [SRS REQ-EXPORT-01](docs/split/SRS/req-export-01-xung-nhip-khung-hinh-doc-lap.md#req-export-01-xung-nhịp-khung-hình-độc-lập) · [REQ-EXPORT-06](docs/split/SRS/req-export-06-chuoi-du-phong-codec-d-05-r-06.md#req-export-06-chuỗi-dự-phòng-codec-d-05-r-06) |

## 3. Mô hình thời gian và automation

- **Tick là sự thật.** `internalPPQ = 960`; nguồn PPQ khác được quy đổi, giữ `meta.sourcePPQ`. Mỗi nốt lưu cả tick và giây (tính một lần ở `buildAST`) nên Render Core không tính lại tempo cho nốt.
- **Tempo không đoán ngầm.** Nguồn tempo ghi trong `meta.tempoSource` (`file` | `midi-default` | `fallback` | `user`); thiếu tempo thì cảnh báo `WARN_TEMPO_FALLBACK` và người dùng có thể ghi đè (`tempoOverride`: BPM hoặc điểm có dấu nhịp, vị trí gõ theo giây / `Bar.Beat.%` của Reaper / `Bar.Beat.Sixteenth`). Xem [SRS REQ-PARSER-07](docs/split/SRS/req-parser-07-tempo-khong-doan-ngam-va-ghi-de-d.md#req-parser-07-tempo-không-đoán-ngầm-và-ghi-đè-d-24-d-29).
- **Beat theo mẫu số.** Reaper đếm beat theo nốt của mẫu số (12/8 @120: `1.12.68` = 2,920 s); đã kiểm với Reaper, còn Ableton/Bitwig là mục mở (OI-12).
- **Automation.** `sampleLane(lane, tick)` + `volumeToUnit(gain)` (độ sáng 0..1); volume nội suy trong không gian fader `gain^0,25` (xấp xỉ, SOI-19). Độ sáng của track là hàm thuần của `(track, t, cấu hình)`; track không có dữ liệu → 1. Xem [Technical Design §2.3](docs/split/TECHNICAL-DESIGN/2-mo-hinh-du-lieu-va-thoi-gian.md#2-mô-hình-dữ-liệu-và-thời-gian-).

## 4. Ranh giới và quy tắc phụ thuộc

```text
apps/web ──► packages/render-core ──► packages/core (chỉ sampleLane, volumeToUnit, secToTick…)
   │
   ├────► packages/parser ──► packages/{core, midi, als, rpp, dawproject, binary}
   └────► packages/i18n  ·  locales/*.json
```

- `packages/*` (parser, i18n, render-core) **không** import React, DOM hay `apps/*`. `render-core` không dùng `Date`, `performance`, `Math.random`, `requestAnimationFrame`.
- Parser chỉ ném `DawParseError{code, message, details}` và trả cảnh báo `{code, message, details?}`; giao diện dịch theo mã.
- Mọi chuỗi hiển thị qua `@dawviz/i18n` (khoá trong `locales/*.json`); kiểm bằng `npm run i18n:check`.
- Framer Motion chỉ dùng cho giao diện, **không** cho khung hình xuất.

## 5. Các quyết định kỹ thuật chính

| Mã | Quyết định | Nơi ghi đầy đủ |
|---|---|---|
| D-34 | React 18 + TypeScript + Vite + Tailwind + Framer Motion; Vitest + Testing Library; Canvas 2D cho khung hình | [BRD §7 Nhật ký quyết định](docs/split/BRD/7-nhat-ky-quyet-dinh-decision-log.md#7-nhật-ký-quyết-định-decision-log) |
| D-35 | Một monorepo (parser, i18n, render-core, web, tài liệu) | BRD §7 (như trên) |
| D-36 | Mã mới viết bằng TypeScript; parser giữ JS + JSDoc (66 test); Render Core là hàm thuần | BRD §7 (như trên) |
| D-33 | Độ sáng track theo automation, mặc định theo volume, người dùng đổi nguồn | BRD §7 (như trên) · [SRS REQ-GRAPHICS-06](docs/split/SRS/req-graphics-06-do-sang-track-theo-automation-d.md#req-graphics-06-độ-sáng-track-theo-automation-d-33) |
| AD-01…06 | Render Core thuần; state nhỏ bằng `useState`; `t` là số duy nhất điều khiển hình ảnh; i18n tĩnh; pan/mute thử nghiệm; Tailwind v3 | [SDD §5 Quyết định thiết kế](docs/split/SDD/5-quyet-dinh-thiet-ke-cua-ung-dung.md#5-quyết-định-thiết-kế-của-ứng-dụng) |
| PD-xx | Quyết định của thư viện parser (không đoán tempo, giới hạn an toàn, i18n theo mã…) | [PARSER-SDD §10](docs/split/PARSER-SDD/10-quyet-dinh-thiet-ke-va-danh-doi.md#10-quyết-định-thiết-kế-và-đánh-đổi) |

## 6. Giới hạn đã chốt (đừng "sửa" mà không xin quyết định)

- **Reaper:** chỉ nhận nguồn MIDI có `HASDATA 1 <ppq> QN`; đơn vị khác bị bỏ qua kèm `WARN_RPP_SRC_UNIT` (nếu không còn gì thì `ERR_NO_NOTES` + `details.unsupportedSources`). Envelope trong item/take và trước-FX trùng loại **chưa đọc** (đếm trong `WARN_RPP_ENVELOPES_IGNORED`). Pan/mute lưu giá trị thô; chiều pan và nghĩa giá trị mute chưa kiểm.
- **Không hỗ trợ trực tiếp:** `.flp` (FL Studio), `.bwproject` (Bitwig nhị phân) → hướng dẫn xuất `.mid`/`.dawproject` hoặc nạp JSON schema. Ableton Session View: clip bị bỏ qua và được báo.
- **Chưa có:** xuất video, lưu phiên, 8 widget HUD, âm thanh trong Preview (xem [PROGRESS.md](PROGRESS.md)).
- **Bảo mật:** không backend/telemetry/`eval`; zip và XML có trần (zip bomb, DOCTYPE/entity, độ sâu); chi tiết [Technical Design §12](docs/split/TECHNICAL-DESIGN/12-bao-mat-va-quyen-rieng-tu.md#12-bảo-mật-và-quyền-riêng-tư).
- **Môi trường:** Node ≥ 22.18 (chạy `.ts` trực tiếp trong test); Chrome/Edge desktop cho xuất video; không hỗ trợ di động.

## 7. Cách mở rộng

| Việc | Làm gì | Đọc |
|---|---|---|
| Thêm định dạng DAW | Package parser mới trả đầu vào thô cho `buildAST`; đăng ký trong `detectFormat`/`parseProject`; thêm mã lỗi/cảnh báo vào `locales/*.json` | [PARSER-SDD §11 Mở rộng](docs/split/PARSER-SDD/11-mo-rong.md#11-mở-rộng) |
| Thêm widget | Thêm một `WidgetRenderer` (chỉ `layout` → `Primitive[]`) vào `WIDGET_RENDERERS` + nhánh kiểm thuộc tính trong `sanitizeScene`; kiểu hình mới thì thêm vào `drawPrimitives`; khung cấu hình trong `apps/web` | [SDD §7 Mở rộng](docs/split/SDD/7-mo-rong.md#7-mở-rộng) · [Technical Design §5.2](docs/split/TECHNICAL-DESIGN/5-1-giao-dien-chinh.md#51-giao-diện-chính-) |
| Thêm ngôn ngữ | Thêm `locales/<mã>.json` + dòng trong `locales/index.json`, import ở `I18nProvider` | [I18N §1](docs/split/I18N/1-them-mot-ngon-ngu-moi-how-to-add-a-language.md#1-thêm-một-ngôn-ngữ-mới-how-to-add-a-language) |
