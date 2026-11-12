# PROGRESS — trạng thái dự án

> Cập nhật lần cuối: 2026-11-12 (tài liệu v1.1: phạm vi bản phát hành đã chốt ở [BRD §4.4](docs/split/BRD/4-4-phan-bo-theo-ban-phat-hanh-d-40-chot-o-tai-l.md#44-phân-bổ-theo-bản-phát-hành-d-40-chốt-ở-tài-liệu-v11)). **Tệp này viết tay**: sau mỗi phiên làm việc, cập nhật bảng trạng thái, mục 4 (task tiếp theo) và ngày ở trên. Số test lấy từ lần chạy gần nhất (`npm test`). Liên quan: [AI_CONTEXT.md](AI_CONTEXT.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [SKELETON.md](SKELETON.md).

Ký hiệu: ✅ xong và có test · 🟡 có mã nhưng chưa chạy/kiểm · 🔄 đang làm · ⬜ chưa làm.

## 1. Trạng thái theo hạng mục

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Spike 1: đường ống xuất (WebCodecs, Mediabunny, A/V sync) | ✅ (mã ngoài repo) | Báo cáo: [docs/spikes/SPIKE-1-EXPORT.md](docs/spikes/SPIKE-1-EXPORT.md) (kèm bảng đối chiếu). Kết quả đã ghi trong [SRS REQ-EXPORT-03](docs/split/SRS/req-export-03-luong-am-thanh-va-silent-audio-d-0.md#req-export-03-luồng-âm-thanh-và-silent-audio-d-01-sửa-r-08) và [REQ-EXPORT-04](docs/split/SRS/req-export-04-ghep-container-qua-mediabunny-d-04.md#req-export-04-ghép-container-qua-mediabunny-d-04); mã spike chưa đưa vào monorepo (M3) |
| Parser: MIDI, Ableton `.als/.alp`, Reaper `.rpp`, DAWproject, nhị phân theo schema | ✅ | 66 test (`npm run test:parser`); 21 test cần tệp trong `test/fixtures/third-party/`, thiếu thì tự bỏ qua |
| Tempo: ghi đè, dấu nhịp, 3 kiểu nhập vị trí | ✅ | `parsePositionText`, `parseTimeSignature`, `resolveTempoRows` |
| Reaper: envelope volume/pan/mute, `mix` | ✅ | volume đối chiếu với số đọc trong Reaper (±0,3 dB); pan/mute thô |
| i18n (en, vi) + kiểm danh mục | ✅ | `npm run i18n:check` |
| `@dawviz/render-core` (độ sáng, chỉ mục nốt, Piano Roll, kiểu nốt, preset) | ✅ | 12 test, `tsc` sạch |
| Logic ứng dụng (đồng hồ, dịch lỗi, tuỳ chọn, client Worker parse) | ✅ | 9 test |
| `apps/web` (React, Tailwind, Framer Motion) | ✅ | `npm install`, `typecheck`, `build` xanh (2026-11-12); 4 test thành phần (Vitest) xanh. Chưa kiểm tay trên Chrome (T-04) |
| Tài liệu: BRD/SRS 1.0, SDD, Technical Design, TDD, tài liệu parser | ✅ | công khai trong `docs/`; trang web: `npm run docs:site` |
| Hệ thống ngữ cảnh AI (`AI_CONTEXT`, `ARCHITECTURE`, `SKELETON`, `PROGRESS`, `scripts/sync-docs.mjs`) | ✅ | `npm run docs:sync` / `docs:check` |
| M1 hoàn thiện (build thật, Track Info, chỉnh ngưỡng độ sáng, kiểm Chrome) | 🔄 | xem mục 4 |
| M2: Scene/`renderFrame`, 8 widget HUD, soạn thảo, Preset, audio | ⬜ | |
| Tùy biến tối đa: storyboard, chuyển cảnh nốt, easing, hạt, tài nguyên phiên, preset cộng đồng | ⬜ (đề xuất) | thiết kế: [CUSTOMIZATION](docs/design/CUSTOMIZATION.md), [ANIMATION-CATALOG](docs/design/ANIMATION-CATALOG.md); task T-17…T-25, T-27, T-32…T-36 (T-26 huỷ) |
| Biểu thức người dùng, bảo mật, kiểm duyệt cộng đồng | ⬜ (đề xuất) | [EXPRESSIONS](docs/design/EXPRESSIONS.md); task T-29…T-31. **CSP chưa có trong `index.html`** (NFR-SEC-03) |
| M3: xuất video | ⬜ | |
| M4: lưu phiên, Project Pack, UI nạp schema, UI ghi đè tempo | ⬜ | |
| M5: hiệu năng, trợ năng, bản dịch cộng đồng, đóng OI | ⬜ | |

## 2. Giới hạn và edge-case đã chốt

Các điểm dưới đây là **quyết định có chủ đích hoặc giới hạn đã biết**; thay đổi cần cập nhật tài liệu gốc và test cùng lúc.

- **Reaper chỉ hỗ trợ nguồn MIDI đơn vị `QN`** (`HASDATA 1 <ppq> QN`, ppq đọc động 1–65535). Đơn vị khác: bỏ item + `WARN_RPP_SRC_UNIT`; hết nốt thì `ERR_NO_NOTES` kèm `details.unsupportedSources`. Xem [PARSER-SRS §3.6](docs/split/PARSER-SRS/3-6-reaper-rpp-verify.md#36-reaper-rpp--verify).
- Reaper `IGNTEMPO 1 <bpm> <num> <den>` được hiểu là phát theo giây tuyệt đối (đã kiểm trên BigProject4b); `SOFFS` coi là quarter-note **[VERIFY]**.
- Reaper envelope: chỉ envelope track đang bật (`ACT` ≠ 0) và có điểm; trong item/take, `WIDTHENV*` chưa đọc (đếm trong `WARN_RPP_ENVELOPES_IGNORED`). Hình dạng bezier xấp xỉ (`WARN_RPP_ENVELOPE_SHAPE_APPROX`). Hệ số nội suy volume `gain^0,25` suy từ 2 điểm đo **[VERIFY]** (SOI-19).
- Pan/mute chỉ lưu giá trị thô; độ sáng theo pan/mute là "thử nghiệm" trong giao diện (AD-05).
- `.flp`, `.bwproject`: **chưa hỗ trợ trực tiếp** (hướng dẫn xuất `.mid`/`.dawproject` hoặc nạp JSON schema). Ableton Session View: bỏ qua và báo.
- Tempo thiếu trong tệp: không đoán ngầm; `WARN_TEMPO_FALLBACK` (120 BPM) và cho người dùng ghi đè. BPM hợp lệ 10–1000; dấu nhịp tử 1–64, mẫu số 1/2/4/8/16/32.
- Reaper đếm beat theo mẫu số (đã kiểm); Ableton/Bitwig nhịp ghép: chưa kiểm (OI-12).
- Giới hạn an toàn parser: ≤ 500.000 nốt; giải nén có trần; XML không mở rộng DOCTYPE/entity.
- Silent AAC mặc định TẮT (Spike 1); KPI đồng bộ A/V ±2 ms chỉ cam kết trên desktop (R-11).
- Không backend, không telemetry, không hỗ trợ di động (v1.0).
- Tài liệu (`docs/**`) **công khai** và được commit, kể cả `docs/split`; trang web tài liệu dựng bằng `npm run docs:site` (chưa triển khai lên host nào, xem T-12). Giấy phép: Apache-2.0 cho mã/tài liệu/bản dịch; tệp mẫu của bên thứ ba **không commit** (`test/fixtures/third-party/`), chỉ `BigProject*.rpp` do chủ repo tự tạo được commit (T-13).

## 3. Số liệu kiểm thử gần nhất

Lần chạy 2026-11-12 (Node 22.23): `npm test`: parser 66/66 ✅ (khi có đủ tệp `third-party/`; thiếu thì 45 qua, 21 bỏ qua) · render-core 12 ✅ · logic web 9 ✅ · docs-site 6 ✅. `npm run typecheck` ✅ · `npm run build` ✅ · Vitest thành phần 4 ✅ · `i18n:check` ✅ · `docs:check` ✅.

`npm audit`: **0 lỗ hổng** (2026-11-12, sau T-28: vite 8.3, vitest 5.1, @vitejs/plugin-react 6.3, @testing-library/jest-dom 7.0; không còn gói nào cần install script).

## 4. Task tiếp theo (theo thứ tự)

| # | Task | Mốc | Điều kiện xong |
|---|---|---|---|
| ~~T-01~~ | ✅ **Xong 2026-11-12**: `npm install`, `typecheck`, `build`, Vitest thành phần đều xanh ngay lần đầu, không cần sửa | M1 | build xanh, test thành phần xanh |
| ~~T-02~~ | ✅ **Xong 2026-11-12**: `createLatestGate()` trong `parserClient.ts`, `App` bỏ kết quả của lần chọn cũ và chỉ tắt `busy` khi lần mới nhất xong. Kèm: Worker crash → từ chối mọi yêu cầu đang chờ với `ERR_WORKER_CRASHED` (có bản dịch en/vi) và tạo Worker mới ở lần sau | M1 | `apps/web/src/lib/parserClient.test.ts` (3 test) |
| T-03 | Track Info + chỉnh `floorDb/ceilDb/minBrightness/maxBrightness` trong `TrackPanel` | M1 | AT-18 mục độ sáng |
| T-04 | Kiểm tay trên Chrome theo danh sách [TDD §5](docs/split/TDD/5-danh-sach-kiem-thu-cong-cho-at-18-chrome.md#5-danh-sách-kiểm-thủ-công-cho-at-18-chrome); chụp ảnh làm tham chiếu | M1 | AT-18 đạt |
| T-05 | `SceneDocument` + `renderFrame` + hợp đồng `WidgetRenderer`; chuyển Piano Roll sang Scene | M2 | test tất định ở Node |
| T-06 | Widget: Track Info, Live Trigger, Keyboard, Chord (sau T-05) | M2 | SRS §3.4 |
| T-07 | Store + Command/undo, `snap()` thuần, Preset `.json` (schema + kiểm) | M2 | REQ-GRAPHICS-02, REQ-STORAGE-02 |
| T-08 | Audio làm đồng hồ chủ (AudioContext) + offset | M2 | tua/phát khớp |
| T-09 | Export Worker + pre-flight + tiến độ/hủy + dự phòng codec; test ảnh Preview↔Export | M3 | AT-03, AT-05 |
| T-10 | Dexie + Project Pack + UI schema nhị phân + UI tempo ghi đè | M4 | REQ-STORAGE |
| T-12 | Bật GitHub Pages cho workflow `docs.yml` (cần đẩy lên GitHub; đặt `repoUrl` trong `scripts/docs-site/config.json` để có nút "Chỉnh sửa trang này") | song song | trang tài liệu truy cập được công khai |
| T-13 | Giấy phép: **Apache-2.0** (có `LICENSE`). Tệp mẫu: `BigProject*.rpp` tự tạo được commit; tệp bên thứ ba (Demo.als, mẫu Cockos, v.v.) chuyển sang `test/fixtures/third-party/` (gitignore), test tự bỏ qua khi thiếu. Còn lại: xin phép Cockos/Ableton nếu muốn commit; xác định nguồn `Oboe_MIDI_001.mid`, bitwig xml, reaper-doc-sample | trước khi công khai | repo công khai không chứa tệp chưa rõ quyền (đạt); CI chạy được khi thiếu tệp (đạt). **2026-11-12:** 9 tệp bên thứ ba từng nằm nhầm ở `test/fixtures/` (sẽ bị commit) đã chuyển vào `third-party/`; CI có bước chặn nếu chúng quay lại. Nếu đã từng đẩy lên GitHub thì vẫn còn trong lịch sử git: cần `git filter-repo` hoặc giữ repo riêng tư đến khi dọn |
| T-14 | Kiểu dáng nốt tuỳ chỉnh (REQ-GRAPHICS-07): `style.ts` (kiểu, bộ dựng sẵn, kẹp giá trị, màu theo cao độ/cường độ), nốt bo góc/phát sáng/viền/độ đục/độ dày, bàn phím piano cạnh Piano Roll, `StylePanel` + màu theo track, lưu `localStorage`. **Đã làm** (test Render Core 10/10; giao diện chưa chạy thử trên trình duyệt trong sandbox). Còn lại: đưa `StyleConfig` vào `SceneDocument`/Preset, gradient và màu theo thang, tên nốt trên phím, đo chi phí `shadowBlur` khi xuất | M2 | người dùng đổi được màu, độ đục, độ dày, bo góc, phát sáng; kết quả giống nhau ở Preview/Export |
| T-15 | Hiệu ứng tất định (AD-07, REQ-GRAPHICS-08): `motion.ts` (`interpolate`, easing, `spring` công thức đóng), hiệu ứng xuất hiện/bật sáng/tắt dần cho nốt, test tĩnh quét `Date`/`performance`/`Math.random`/`requestAnimationFrame` trong Render Core | M2 | cùng `t` cùng ảnh; tua tới/lui khớp |
| T-16 | Tách `presets/` và `assets/` thành repo `dawviz-community` (CI kiểm schema, kích thước, giấy phép; `index.json` có băm), màn hình "Thư viện" trong ứng dụng (docs/COMMUNITY-CONTENT.md). Hiện: thư mục và 5 preset mẫu đã có, có test | M2–M3 | cộng đồng gửi preset bằng pull request không cần sửa mã |
| T-17 | Easing đầy đủ (AD-09): Penner 30 hàm + 2 hàm elastic của osu!, `cubicBezier`, `steps`, `spring` dạng đóng, đường cong tự vẽ; trình soạn đồ thị; preset `easing`. Làm chung hoặc ngay sau T-15 | M2 | [CUSTOMIZATION §4](docs/split/CUSTOMIZATION/4-duong-cong-chuyen-dong-easing-ad-09.md#4-đường-cong-chuyển-động-easing-ad-09); test biên, đơn điệu, tất định |
| T-18 | Template chuyển cảnh nốt bốn pha `enter/hit/sustain/exit` (REQ-GRAPHICS-10 dự kiến) + hướng cuộn `left/right/up/down` của NoteLayer; 9 template dựng sẵn (`scroll-left`, `fall-down`, `rise-up`, `drop-bounce`, `pop-in`, `fade-scale`, `morph`, `shatter`, `ripple`); preset `note-transition` | M2 | [CUSTOMIZATION §3.2](docs/split/CUSTOMIZATION/3-mo-hinh-du-lieu-storyboard-ad-08.md#32-template-theo-nốt-notetransition); tua tới/lui khớp, Preview = Export |
| T-19 | Morph cùng họ hình (AD-11): chữ nhật bo góc ↔ viên thuốc ↔ tròn; đa giác lấy mẫu lại cùng số đỉnh | M2 | test hình học tất định |
| T-20 | Hạt không trạng thái (AD-10): PRNG có seed, chuyển động dạng đóng, nhiễu tất định, nguồn phát theo nốt/nhịp/môi trường, chỉ mục theo thời gian, giới hạn số hạt; preset `particle` | M2 | đặt `t` trực tiếp cho cùng ảnh với chạy liên tục |
| T-21 | Tài nguyên của phiên (AD-12): ảnh, SVG (vẽ dạng ảnh), sprite sheet, phông; băm SHA-256, IndexedDB, giới hạn kích thước, mã lỗi `ERR_ASSET_*`, nạp vào Worker xuất, đóng gói vào Project Pack (cần T-10) | M2–M4 | nạp trùng không nhân đôi; Pack mở máy khác đủ tài nguyên |
| T-22 | Storyboard: `SceneDocument` có lớp/phần tử (Sprite, Text, Shape, ParticleEmitter, NoteLayer, Widget), keyframe theo `sec`/`beat`/`bar.beat`/`tick`, nội suy màu OKLab. Mô hình dữ liệu phải chốt cùng T-05 | M2 (mô hình) · v1.1 (soạn thảo đầy đủ) | đổi tempo thì keyframe theo nhịp vẫn khớp |
| T-23 | Giao diện storyboard: timeline nhiều lớp, kéo keyframe, chọn easing bằng đồ thị, bindings dữ liệu nhạc (`note.velocity`, `beat.phase`, automation…), undo/redo (dùng T-07) | v1.1 | người dùng dựng được một cảnh hoàn chỉnh không cần viết mã |
| T-24 | Preset mới (`note-transition`, `easing`, `particle`, `theme`, `scene`): JSON Schema, di trú `schemaVersion`, "Chia sẻ thành preset" xuất `.dawviz-preset.zip` (JSON + tài nguyên + băm + giấy phép SPDX bắt buộc) | M2–M4 | schema kiểm trong CI; preset sai bị từ chối kèm mã lỗi |
| T-25 | Thư viện cộng đồng trong ứng dụng (sau T-16): duyệt, xem trước, cài preset từ `index.json`, xác minh băm, đệm ngoại tuyến; mẫu issue cho người không dùng Git | v1.1 | cài và gỡ preset cộng đồng không cần tải lại trang |
| ~~T-26~~ | **Huỷ 2026-11-12** (OI-15 đã đóng): không nhập storyboard osu! `.osb` | — | — |
| T-27 | Đo hiệu năng hạt, phát sáng và số phần tử ở 1080p60 (xem trước và xuất); chốt giới hạn ở CUSTOMIZATION §7; quyết định có cần Spike WebGL2 không | M5 | số đo trên ít nhất 2 máy |
| ~~T-28~~ | ✅ **Xong 2026-11-12**: vite 5→8.3, vitest 2→5.1, @vitejs/plugin-react 4→6.3, @testing-library/jest-dom 6→7.0; tạo lại `package-lock.json`. React 18, Tailwind 3, TypeScript 5, Framer Motion 11 giữ nguyên. `typecheck`, `build`, `npm run dev`, mọi test xanh; esbuild không còn trong cây phụ thuộc | song song | `npm audit` = 0 |
| T-29 | `@dawviz/expr` (AD-13): tokenizer + parser Pratt viết tay, kiểm ngữ nghĩa theo danh sách trắng, "biên dịch" thành cây closure (không sinh JS), giới hạn độ dài/độ sâu/bước tính, hàm có sẵn (toán, `ease`, `wiggle`, `loop`, `noise`, màu); bộ test tấn công + fuzz + tất định; test tĩnh cấm `eval`/`Function`; trình soạn biểu thức trong ứng dụng (tô màu, gợi ý, lỗi theo vị trí, bake) | M2 (lõi) · v1.1 (trình soạn đầy đủ) | [EXPRESSIONS §3–4](docs/split/EXPRESSIONS/3-ngon-ngu-bieu-thuc-ad-13.md#3-ngôn-ngữ-biểu-thức-ad-13); mọi mẫu tấn công bị chặn |
| T-30 | Gia cố ứng dụng (AD-14): thẻ CSP theo NFR-SEC-03 trong `apps/web/index.html` (**hiện chưa có**), Trusted Types, watchdog huỷ Worker vẽ khi khung quá hạn, kiểm khi nạp preset/gói/ảnh, không URL ngoài trong preset; chốt origin (OI-17) | M1–M2 (CSP làm ngay) | ứng dụng chạy bình thường với CSP; test watchdog |
| T-31 | Kiểm duyệt cộng đồng (AD-15, mở rộng T-16/T-25): CI không secret kiểm schema, biểu thức, ngân sách, tài nguyên, SVG, giấy phép; sinh GIF xem trước; CODEOWNERS 2 người duyệt; mẫu PR/issue/báo cáo; `index.json` có băm và `revoked`; site kéo bản đã duyệt về cùng origin; nhãn 3 mức tin cậy | v1.1 | [EXPRESSIONS §6](docs/split/EXPRESSIONS/6-kiem-duyet-template-va-preset-qua-cong-dong-ad.md#6-kiểm-duyệt-template-và-preset-qua-cộng-đồng-ad-15) |
| T-32 | Bộ máy keyframe trong Render Core: các kiểu nội suy (hold, linear, bezier, continuous, auto, auto-clamped, Catmull-Rom, monotone; TCB, roving ở v1.1), tách chiều, motion path tốc độ đều theo quãng đường, auto-orient, nội suy màu/góc, ngoại suy + loop, modifier (noise, stepped, clamp, generator) | M2 | [CATALOG §1, §4, §5](docs/split/ANIMATION-CATALOG/1-kieu-noi-suy-keyframe-theo-thoi-gian.md#1-kiểu-nội-suy-keyframe-theo-thời-gian); test tất định |
| T-33 | Graph Editor: value graph + **speed graph**, velocity/influence bằng số, nhiều đường cong, bắt dính nhịp, flatten/align/break, co giãn vùng chọn, sao chép easing, thư viện easing (gộp phần giao diện của T-17) | M2–v1.1 | [CATALOG §3](docs/split/ANIMATION-CATALOG/3-do-thi-graph-editor.md#3-đồ-thị-graph-editor) |
| T-34 | Thư viện hiệu ứng Canvas 2D mục `v1.0` (transform, reveal, shape, vật lý, thủ tục, màu, nhân bản/vệt, chuyển cảnh, camera, hoà trộn, hiệu ứng âm nhạc) dưới dạng preset `kind: "effect"` dựng từ keyframe/modifier/biểu thức | M2 | [CATALOG §21](docs/split/ANIMATION-CATALOG/21-pham-vi-da-chot.md#21-phạm-vi-đã-chốt); ảnh Preview = Export |
| T-35 | Text animator: range selector, stagger theo ký tự/từ/dòng, typewriter, counter; v1.1: scramble, karaoke, text on path | M2–v1.1 | [CATALOG §13](docs/split/ANIMATION-CATALOG/13-chu-text.md#13-chữ-text) |
| T-36 | Hiệu ứng WebGL2 (mục `GL`: motion/zoom blur, glitch, chromatic aberration, wave warp, pixelate, kaleidoscope, grain, LUT…) sau khi Spike T-27 chốt | v1.1 | khớp Preview/Export; đạt ngân sách hiệu năng |
| T-37 | Widget P-02 (Tempo & nhịp), P-03 (Bar & Beat), P-12 (cách ghi tên nốt dùng chung) | 1.0 | SRS 3.4b; AT-23 |
| T-38 | Widget P-04 (nhận diện giọng, Krumhansl-Schmuckler theo cửa sổ trượt ở Analysis Worker), P-07 (vòng cao độ / vòng quãng năm); dùng chung bộ mẫu với hợp âm (OI-05) | 1.0 | AT-23 |
| T-39 | Hạ tầng cộng đồng (D-41…D-43): tạo tổ chức GitHub, chuyển repo, bật Pages; đội `reviewers`, CODEOWNERS; bước CI kiểm `Signed-off-by` (DCO); mẫu issue "Gửi tệp mẫu", "Báo cáo preset", "Đề cử kiểm duyệt viên" | 1.0 (làm sớm) | site chạy ở `<tổ-chức>.github.io`; PR thiếu DCO bị chặn |
| T-40 | Kiểm giấy phép phụ thuộc và phông đóng gói tự động trong CI (OI-07) | 1.0 | CI báo giấy phép ngoài danh sách cho phép |
| T-41 | Widget P-05 (velocity), P-06 (mật độ/polyphony), P-08 (tổng quan arrangement), P-09 (drum pad, nhãn GM) | 1.0 | AT-23 |
| T-42 | Parser đọc thêm `meta.markers[]` (Reaper `MARKER`, Ableton Locators, marker MIDI), `meta.lyrics[]` (MIDI meta 0x05/0x01); automation Ableton/DAWproject (SOI-18); widget P-10, P-11, P-13 | 1.0 | test parser cho từng nguồn; AT-23 |
| T-43 | Ableton Session View (D-44, SOI-14): đọc clip Session, giao diện chọn scene/clip để đặt lên thời gian | 1.2 | tệp mẫu có Session |
| T-44 | Xem/phát preset trên di động và máy tính bảng (D-44); xuất video vẫn khuyến nghị desktop | 1.2 | chạy trên ít nhất 1 điện thoại Android và 1 iPad |
| T-45 | Morph đường SVG tự do (lấy mẫu lại, ghép điểm) | 1.2 | không xoắn rối với bộ hình mẫu |
| T-46 | Xem lại `.flp`/`.bwproject` (nếu có tệp mẫu), AAC bằng WASM (OI-04), parser khai báo XML/JSON (SOI-12) | 1.2 | quyết định ghi vào BRD |
| T-47 | (Khi cần, D-46) Dịch tài liệu sang tiếng Anh: trước hết README, CONTRIBUTING, I18N, COMMUNITY-CONTENT, quy tắc kiểm duyệt; thêm nút đổi ngôn ngữ trên trang tài liệu và CI cảnh báo bản dịch cũ | sau | khi chủ dự án quyết định |
| T-48 | Theme giao diện Sáng / Tối / Theo hệ thống (REQ-UI-10): biến CSS, Tailwind `darkMode: 'class'`, lưu tuỳ chọn, kiểm tương phản AA | 1.0 (M1–M2, rẻ) | đổi theme không tải lại trang; khung hình video không đổi |
| T-49 | Bộ chọn màu dùng chung (REQ-UI-11): ô nhập HEX/RGB/RGBA/số thập phân/HSL/HSV/OKLCH/tên CSS, thanh alpha, hút màu (EyeDropper), màu gần đây; màu lưu `#rrggbbaa` (sửa `sanitizeStyle` nhận alpha); bảng màu: tạo, lưu preset, nhập từ danh sách mã / `.gpl` / JSON / biến CSS, áp lần lượt cho track | 1.0 (M2) | test hàm đọc màu cho mọi định dạng; nhập bảng màu gán đúng track |
| T-50 | Ẩn/hiện và solo track (REQ-UI-12) cho mọi widget; thay cờ `showMuted` | 1.0 (M1–M2) | AT-23 mở rộng; hoàn tác được |
| T-51 | Tuỳ chỉnh bàn phím và tên nốt trên phím (REQ-GRAPHICS-07): phạm vi phím, hình dạng, màu phím nhấn, đánh dấu thang âm, nhãn theo P-12, quy ước C3/C4 | 1.0 (M2, cùng T-37) | test bố cục nhãn tất định; Preview = Export |
| T-52 | Khoảng hiển thị theo thời gian/marker và đổi tập track theo đoạn (REQ-GRAPHICS-14) | 1.0 (M2, cùng T-22) | ẩn/hiện đúng mốc khi tua |
| T-53 | Spectrum/waveform nhiều kiểu (REQ-WIDGET-07): Bars, Mirrored, Line/Area, Dots, Oscilloscope, Waveform tổng quan, Meter, tham số hình dạng; 1.1 radial/xoắn ốc | 1.0 / 1.1 | làm mượt tất định; Preview = Export |
| T-54 | Stem theo track (REQ-AUDIO-01): nạp nhiều tệp audio, tự ghép theo tên + kéo thả, offset từng stem, phân tích trong Worker rồi giải phóng PCM, lưu bộ đệm phân tích vào Pack, hướng dẫn xuất stem theo DAW, binding `track.audio.*`, cảnh báo `WARN_STEM_*`, `ERR_AUDIO_TOO_MANY` | 1.2 | AT-24 |
| T-55 | Xuất nền trong suốt (REQ-EXPORT-08): chuỗi PNG ghi vào thư mục (File System Access) hoặc `.zip` cho đoạn ngắn; kiểm `VideoEncoder` VP9 `alpha: 'keep'`; pre-flight ước tính dung lượng; xuất kèm `.wav`; hướng dẫn After Effects / Premiere; chọn lớp cho từng lần xuất (xuất nền và tiền cảnh riêng); 1.1: "Xuất tách lớp" một lần bấm | 1.0 (M3, cùng T-09) | chuỗi PNG nhập vào After Effects đúng fps và trong suốt |
| T-56 | Không gian 2.5D (REQ-GRAPHICS-15): biến đổi 3D cho lớp và cảnh, camera phối cảnh/trực giao, preset góc nhìn, ghép texture bằng WebGL2 (cả trong Export Worker), tay nắm xoay 3 trục; lớp nền mặc định gắn màn hình (tuỳ chọn đưa vào không gian 3D); dự phòng 2D khi thiếu WebGL2 | 1.1 (sau Spike T-27) | Preview = Export theo ngưỡng khác đường vẽ; 60 fps xem trước với cảnh mẫu |
| T-57 | (Đề xuất, sau 1.2) 3D thật: gói `@dawviz/render-3d`, nốt dạng khối có ánh sáng, nạp model glTF/GLB (OBJ phụ), hoạt hoạ glTF lấy mẫu theo `t`, giới hạn an toàn cho model, preset `model` | sau 1.2 | [CUSTOMIZATION §12](docs/split/CUSTOMIZATION/12-huong-3d-day-du-sau-1-2-de-xuat-chua-chot.md#12-hướng-3d-đầy-đủ-sau-12-đề-xuất-chưa-chốt) |
| T-58 | Thanh phát tuỳ chỉnh (REQ-GRAPHICS-16): kiểu nét/dải/gradient/mũi tên, độ dày, độ dài, màu, phát sáng, phản ứng khi nốt chạm; 1.1 sprite, keyframe | 1.0 / 1.1 | test bố cục tất định; Preview = Export |
| T-59 | Góc chảy nốt tự do 0–360° (REQ-WIDGET-01): xoay làn, vạch phát, bàn phím; tự kéo dài làn phủ kín khung; tên nốt luôn đứng thẳng (tuỳ chọn) | 1.0 (M2) | ở mọi góc không lộ góc trống; tua tới/lui khớp |
| T-60 | Chế độ Cơ bản/Nâng cao (REQ-UI-13, D-48): hộp chọn lần đầu, công tắc toàn cục, nút "Thêm tuỳ chọn" từng bảng, huy hiệu "Đã chỉnh nâng cao", tìm thiết lập; mọi bảng mới phải khai báo phần Cơ bản/Nâng cao theo bảng phân bổ | 1.0 (khung làm sớm ở M1–M2) | đổi chế độ không đổi dữ liệu; test thành phần cho cả hai chế độ |
| T-11 | Chương trình tệp mẫu (D-45). Cần dữ liệu thật từ người dùng: mẫu Ableton/Bitwig nhịp ghép (OI-12), automation Ableton (SOI-18), kiểm pan/mute (SOI-19) | song song | đóng OI |

## 5. Đánh giá khả thi: làm hết trong 1 tuần với AI Agent?

**Kết luận: không khả thi cho cả dự án (M1→M5). Khả thi cho M1 + nửa đầu M2 trong 1 tuần.** Phần dưới (đến hết bảng tuần) là ước lượng **cho lõi M1–M5** (khoảng 7 tuần); lịch đầy đủ theo phạm vi đã chốt ở tài liệu v1.1 nằm ở mục 5.1. Đây là ước lượng của tôi dựa trên khối lượng còn lại và các điểm nghẽn bên dưới, chưa phải số đo; hãy hiệu chỉnh lại sau tuần 1 bằng vận tốc thực tế.

Vì sao 1 tuần không đủ, dù AI viết mã nhanh:
1. **Điểm nghẽn là xác minh, không phải gõ mã.** Hiệu ứng hình ảnh, bố cục 8 widget, trải nghiệm chỉnh sửa cần mắt người và nhiều vòng phản hồi.
2. **Xuất video phụ thuộc phần cứng.** Spike 1 đã cho thấy lỗi riêng theo máy (Silent AAC hỏng trên một laptop; lệch A/V −42,67 ms trên điện thoại). Cần chạy trên nhiều máy thật; agent trong sandbox không thay được.
3. **Dữ liệu thật còn thiếu** cho các mục [VERIFY] (Ableton/Bitwig nhịp ghép, automation Ableton, pan/mute): phụ thuộc người dùng cung cấp tệp.
4. **`apps/web` chưa từng được build.** Lần đầu thường lộ lỗi kiểu/phụ thuộc, tốn nửa đến một ngày.
5. **Hiệu năng cần đo** (500.000 nốt, 1080p60 xuất) rồi mới tối ưu; không thể làm trước.

Ước lượng theo mốc (ngày làm việc, agent + người phản hồi nhanh):

| Mốc | Ngày | Rủi ro chính |
|---|---|---|
| M1 hoàn thiện (T-01…T-04) | 2–3 | lỗi build lần đầu |
| M2 (Scene, 8 widget, soạn thảo, Preset, audio) | 8–12 | thiết kế hình ảnh lặp nhiều vòng; undo/snap |
| M3 (xuất video) | 5–8 | khác biệt codec/phần cứng; bộ nhớ khi xuất dài |
| M4 (lưu phiên, pack, UI schema/tempo) | 4–6 | hạn mức IndexedDB, nhập pack an toàn |
| M5 (hiệu năng, trợ năng, bản dịch, đóng OI) | 5–8 | cần dữ liệu thật và đo trên nhiều máy |
| **Tổng** | **24–37 ngày làm việc ≈ 5–7,5 tuần**; thêm dự phòng ⇒ **~7 tuần** | |

Kế hoạch tuần (mục tiêu, không phải cam kết):

| Tuần | Nội dung | Cửa kiểm |
|---|---|---|
| 1 | M1 xong + T-05 (Scene/`renderFrame`) + 2 widget đầu | AT-18 đạt; test Render Core xanh |
| 2 | Hết M2 phần widget (T-06), bắt đầu soạn thảo (T-07) | 8 widget vẽ đúng ở Preview |
| 3 | Hết M2 (undo, snap, Preset, audio T-08) | AT của REQ-WIDGET/GRAPHICS |
| 4 | M3: Export Worker + pre-flight + tiến độ/hủy | xuất được MP4 1080p30 trên Chrome |
| 5 | M3: dự phòng codec, A/V, test ảnh Preview↔Export, thử đa máy | AT-03, AT-05 |
| 6 | M4: lưu phiên, Pack, UI schema/tempo | REQ-STORAGE |
| 7 | M5: hiệu năng, trợ năng, hoàn thiện i18n | KPI đo được |
| 8 (dự phòng) | Sửa lỗi từ phản hồi, đóng OI còn lại | bản v1.0 |

### 5.1 Lịch theo bản phát hành (cập nhật sau khi chốt tài liệu v1.1)

Phạm vi từng bản: [BRD §4.4](docs/split/BRD/4-4-phan-bo-theo-ban-phat-hanh-d-40-chot-o-tai-l.md#44-phân-bổ-theo-bản-phát-hành-d-40-chốt-ở-tài-liệu-v11) (D-40). Đơn vị: ngày làm việc của một agent với một người phản hồi trong ngày. **Ước lượng, chưa đo**; hiệu chỉnh sau tuần đầu bằng vận tốc thực tế.

| Bản | Gồm | Ngày | Tuần |
|---|---|---|---|
| **1.0** | Lõi M1–M5 (24–37) + tùy biến chính T-17…T-22 (mô hình), T-24, T-29 (lõi), T-30, T-32, T-33 (cơ bản), T-34, T-35 (cơ bản) (43–65) + widget P-02…P-13: T-37, T-38, T-41, T-42 (16–24) + T-39, T-40 (2–3) | **85–129** | **≈ 17–26** |
| **1.1** | T-23, T-33 đầy đủ, T-29 trình soạn nâng cao, T-35 nâng cao, T-16, T-25, T-31, T-27, T-36, hiệu ứng `v1.1` | **36–56** | **≈ 7–11** |
| **1.2** | T-43 Session View, T-44 xem trên di động, T-45 morph SVG, T-46 xem lại `.flp`/`.bwproject`, AAC WASM, parser khai báo | **20–31** | **≈ 4–6** (phụ thuộc tệp mẫu và thiết bị) |

So với ước lượng trước: bản 1.0 dài hơn chủ yếu vì đưa **toàn bộ widget P-02…P-13** vào 1.0 (D-40, thêm khoảng 3–5 tuần; riêng P-10/P-11/P-13 cần parser đọc thêm marker, lời và automation Ableton).

**Đề xuất để có phản hồi sớm (chưa chốt):** phát hành **1.0-beta** công khai khi xong M1–M3 cùng T-17, T-18, T-30 (khoảng tuần 10–13): người dùng đã nạp tệp, chỉnh kiểu, chọn template nốt và xuất video được; phần còn lại của 1.0 tiếp tục sau beta.

**Cách rút ngắn nếu cần:** dời P-10/P-11/P-13 (cần parser đọc thêm) sang 1.1, tiết kiệm khoảng 1,5–2 tuần; hoặc cho nhiều agent làm song song các gói độc lập (widget, Export Worker, lưu trữ, `@dawviz/expr`), đổi lại tốn công tích hợp và cần quy ước giao diện chặt ([ARCHITECTURE.md](ARCHITECTURE.md) mục 4).
