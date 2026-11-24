# TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER

> **Lưu ý tên gọi:** "TDD" ở đây là *Test Design Document* (tài liệu mô tả chiến lược và danh mục test), **không** bắt buộc dự án phải làm theo phương pháp *Test-Driven Development* (viết test trước rồi mới viết mã). Khuyến nghị thực tế: làm test-first cho các hàm thuần (parser, Render Core, `snap`, `clock`), còn giao diện thì viết test sau khi bố cục ổn định. Thiết kế kỹ thuật chi tiết nằm ở `TECHNICAL-DESIGN.md`.

> Phiên bản tài liệu: 1.1 (2026-11-12: đồng bộ BRD/SRS v1.1; phạm vi bản phát hành ở BRD §4.4, tùy biến và biểu thức ở `CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`) · Đối chiếu `docs/product/SRS.md` và `docs/design/SDD.md`. Test của thư viện parser: `docs/parser/PARSER-TDD.md` (66 test).

## 1. Chiến lược

| Tầng | Công cụ | Chạy ở đâu | Trạng thái |
|---|---|---|---|
| Parser (66) | `node --test` | Node | Đã chạy, xanh |
| Render Core (5) | `node --test` (Node ≥ 22.18 chạy trực tiếp `.ts`) | Node | Đã chạy, xanh |
| Logic ứng dụng (4): đồng hồ, dịch lỗi | `node --test` | Node | Đã chạy, xanh |
| Thành phần giao diện (3) | Vitest + Testing Library + jsdom | Máy có `npm install` | **Chưa chạy** (môi trường tạo gói không cài được thư viện) |
| Kiểu (TypeScript) | `tsc` | `render-core`: đã chạy sạch lỗi; `apps/web`: chưa chạy | Xem trên |
| i18n | `npm run i18n:check` | Node | Đã chạy, xanh |
| Trình duyệt thật | Thủ công trên Chrome (AT-18) | Máy người dùng | Chưa |

Nguyên tắc: logic quyết định hình ảnh nằm trong hàm thuần để test bằng Node nhanh và tất định; test giao diện chỉ kiểm dây nối (sự kiện, văn bản), không kiểm pixel.

Lệnh: `npm test` (parser + render + logic web), `npm run test:components` (Vitest), `npm run typecheck`, `npm run i18n:check`, `npm run docs:check`.

## 2. Danh mục test mới

### 2.1 `packages/render-core/test/render-core.test.ts` (5)
| Test | Nội dung | Yêu cầu |
|---|---|---|
| `activeNotes` | Biên `[start, end)`; nốt dài bắt đầu rất sớm vẫn được tìm thấy (nhờ `maxDur`) | NFR-PERF-05 |
| `trackBrightness` | Không dữ liệu → 1; volume 0 dB → sáng nhất, −36 dB → `minBrightness`; đảo chiều; `off`; `static` (−18 dB → 0,625) | REQ-GRAPHICS-06 |
| `layoutPianoRoll` | Hai lần gọi cho kết quả bằng nhau; chỉ nốt trong cửa sổ; cờ `active` đúng | REQ-GRAPHICS-05 |
| Reaper `BigProject4b.rpp` | Parse thật → track có envelope volume; độ sáng 1 ở 0 s, ≈ 0,4717 ở 2,92 s (khớp −25,3 dB đo trong Reaper) | D-33, AT-17 |
| `drawPianoRoll` | Số lệnh vẽ (nền, nốt, playhead); alpha = độ sáng × hệ số nốt đang vang | ARC-01 |

### 2.2 `apps/web/src/lib/*.test.ts` (4)
| Test | Nội dung |
|---|---|
| `clock` advance | Chỉ chạy khi `playing`; dừng ở cuối; loop; `rate` |
| `clock` seek/toggle | Kẹp `[0, duration]`; phát lại từ đầu khi đang ở cuối |
| `problems` dịch theo mã | Văn bản dịch + giữ thông điệp gốc làm chi tiết kỹ thuật; số nhiều |
| `problems` rơi về thông điệp gốc | Mã chưa có bản dịch không làm mất thông tin |

### 2.3 `apps/web/test/components.test.tsx` (3, chưa chạy)
`Transport` (bấm, kéo thanh tua), `Notices` (văn bản + chi tiết kỹ thuật), `LanguageSelect` (đổi `lang` của `<html>`).

### 2.4 `packages/render-core/test/typography.test.ts` (20, T-72)
Bộ kiểu dựng sẵn (phông gốc trùng `DEFAULT_FONT`, số đếm/đồng hồ bật chữ số đều); ghi đè từng thuộc tính, ↺, "Lưu thành kiểu mới"/"Cập nhật kiểu"; chữ thường giữ đường vẽ cũ; chữ số đều bề rộng ("111" = "888"); tracking và tỉ lệ ngang; căn lề; tràn khung (cắt "…" không vượt khung, tự thu nhỏ vừa khít, chạm cỡ tối thiểu thì cắt, để tràn); xuống dòng + số dòng tối đa; hoa/thường/chữ hoa nhỏ; chỉ số trên/dưới; cụm ký tự tiếng Việt; định dạng từng đoạn (valueStyle, bassStyle) qua preset; lược đồ `textStyles` + ghi đè sai bị bỏ có cảnh báo + vòng lưu/đọc; phông cần nạp theo kiểu đang dùng; lệnh vẽ: thứ tự viền/tô, viền ngoài, gạch, gradient, nghiêng, nền chữ, bóng quy theo scale và góc xoay; tất định trong widget xoay. Golden `paper-1x1` đổi có chủ ý ở chữ có số (chữ số đều bề rộng). Thêm: phông không có sẵn (cảnh báo một lần mỗi họ, giữ tên, vẽ bằng phông mặc định; có phông thì vẽ đúng phông).

### 2.5 Mục "Chữ" của Editor (T-72)
`apps/web/src/lib/textRef.test.ts` (5): đặt/bỏ ghi đè theo đường dẫn, chỗ chữ theo widget, kiểu tham chiếu của dòng và đoạn, lệnh gộp bước theo thuộc tính + hoàn tác + lưu kiểu, id kiểu từ tên tiếng Việt. Vitest `components.test.tsx` › TextPanel (2): đổi cỡ, ↺, căn lề, chọn đoạn; bật đổ bóng, Lưu thành kiểu mới.

### 2.6 Editor bổ sung (T-68, 2026-11-14)
`render-core/test/scene.test.ts`: `createWidget` cho mọi loại thêm được (id không trùng, trong khung, trên cùng, qua lược đồ không cảnh báo) và `duplicateWidget`. `apps/web/src/lib/editorGeometry.test.ts` (3): căn chỉnh theo khung bao (kể cả widget xoay) và theo khung video, chia đều, khung chọn. `textRef.test.ts`: lệnh thêm/nhân bản/xoá + hoàn tác giữ thứ tự. Vitest `app.test.tsx` (2): thêm từ menu (chọn ngay, mục Thiết lập và Chữ sau Vị trí), Ctrl+D, Delete, hoàn tác; chọn nhiều → Căn chỉnh, chia đều cần ≥ 3.

## 3. Ma trận truy vết

| Yêu cầu | Test |
|---|---|
| REQ-GRAPHICS-05 (tất định) | `layoutPianoRoll`, `drawPianoRoll` |
| REQ-GRAPHICS-06 (độ sáng) | `trackBrightness`, Reaper `BigProject4b` |
| NFR-PERF-05 (tua ngẫu nhiên) | `activeNotes` (đo thời gian chưa có, xem 4) |
| REQ-I18N-04 (dịch lỗi theo mã) | `problems` ×2, `i18n:check` |
| REQ-GRAPHICS-18 (kiểu chữ, T-72) | `typography.test.ts`, golden `paper-1x1`, `preset.test.ts` (di trú 0.3/0.4 → 0.5 vẽ giống bản dựng sẵn) |
| AT-18 (mốc M1) | Thủ công trên Chrome, danh sách ở mục 5 |

## 4. Khoảng trống đã biết
1. ~~Chưa chạy `npm install`/`build`/Vitest cho `apps/web`~~ Đã chạy từ 2026-11-12; kết quả mới nhất ở PROGRESS §3.
2. Chưa đo hiệu năng `layoutPianoRoll` với 500.000 nốt (giới hạn của parser) và với 8 track dày.
3. Chưa có test hình ảnh (ảnh chụp so sánh) cho Canvas; để M3 cùng đường ống xuất.
4. Trợ năng: `npm run a11y` (axe-core) 0 vi phạm WCAG A–AA và đã kiểm vòng phím Tab (2026-11-22); chưa thử với trình đọc màn hình thật.
5. Phần trăm độ phủ chưa đo.

## 5. Danh sách kiểm thủ công cho AT-18 (Chrome)
1. `npm install && npm run dev`, mở trang; không có lỗi trong console.
2. Thả lần lượt `BigProject4b.rpp`, `Demo.als` và `Oboe_MIDI_001.mid` (hai tệp sau để trong `test/fixtures/third-party/`, không commit) và một `.dawproject`: thấy Piano Roll, danh sách track, thời lượng.
3. Với `BigProject3.rpp` (tham chiếu `Oboe MIDI 001.mid` ngoài; REQ-UI-08): chỉ chọn `.rpp` → thấy bảng đỏ "Dự án dùng 1 file MIDI ngoài chưa được nạp" kèm tên file và nút "Nạp file .mid…", không có thêm lỗi chung "không có nốt". Nạp một `.mid` tên khác → bảng báo tệp đó "không dùng". Nạp đúng tệp bằng nút hoặc thả vào bảng (tên khác hoa/thường hoặc dấu cách/gạch dưới vẫn khớp) → có nốt mà không phải chọn lại `.rpp`. Chọn cùng lúc `.rpp` + `.mid` ở khung thả chính cũng phải ra nốt ngay.
4. Bấm Phát/Tạm dừng, kéo thanh tua; đưa `t` về cùng giá trị hai lần cho cùng khung hình.
5. `BigProject4b.rpp`: nguồn độ sáng `volume` làm track tối dần theo envelope; đổi sang `off` thì hết đổi; `đảo chiều` làm ngược lại.
6. Đổi ngôn ngữ en ↔ vi: mọi chuỗi và thông báo đang hiển thị đổi ngay; tải lại trang vẫn giữ lựa chọn.
7. Tệp sai định dạng (ví dụ `.bwproject` hoặc `.flp` có nội dung MIDI): thấy lỗi dịch được, ứng dụng không hỏng.
8. Bố cục (2026-11-12): ở bề rộng 1440, 1100 và 800 px, không phần tử nào trong bảng "Kiểu nốt" hay thẻ track tràn ra ngoài khung; trang không có thanh cuộn ngang. Ở màn rộng (`lg`), Piano Roll và thanh phát đứng yên khi cuộn danh sách track (cột phải tự cuộn).
9. Đổi cỡ cửa sổ khi đang tạm dừng: Piano Roll vẽ lại theo bề rộng mới, không bị kéo giãn.
10. Ô nhập số trong bảng "Kiểu nốt" (REQ-UI-15, phần đã làm): gõ `10*3` rồi Enter ở "Cỡ quầng sáng" → 30; gõ `500` → 64 (giới hạn cứng); ↑/↓ đổi theo bước, Shift ×10; gõ chữ → viền đỏ, Esc trả giá trị cũ; Tab qua lần lượt thanh trượt rồi ô nhập.
11. Track Info và ngưỡng độ sáng (T-03): mở "Chi tiết" của một track trong `BigProject4b.rpp`: thấy tầm cao độ (A0 – A7), fader `0 dB · pan 0`, automation `Volume`, dòng "Hiện tại: …%" chạy theo khi phát. Đặt "Sàn (dB)" = −6: nốt tối hẳn ở đoạn envelope thấp; kéo "Sàn" vượt "Trần" thì "Trần" tự lùi theo (luôn cách ≥ 1 dB); "Độ sáng thấp nhất" vượt "cao nhất" thì "cao nhất" theo lên. Đổi nguồn sang `off` thì các thanh ngưỡng ẩn và độ sáng 100%. Ô màu track tròn.
12. CSP (T-30): chạy `npm run build && npm run preview` ở gốc repo, mở địa chỉ được in ra (mặc định `http://localhost:4173/`) (không dùng `npm run dev`: dev không có CSP). DevTools → Console: không có dòng "Refused to …" hay "This document requires 'TrustedScriptURL'"; nạp một tệp vẫn parse được (Worker chạy dưới Trusted Types). Kiểm thêm trong Console: `document.body.innerHTML += '<b>x</b>'` phải báo lỗi TypeError (Trusted Types chặn). Ghi chú: Firefox bắt gõ `allow pasting` trước khi cho dán vào Console (dòng SyntaxError đi kèm là bình thường); dòng log có nguồn `moz-extension://` hoặc `chrome-extension://` là của tiện ích trình duyệt, không tính. Nên kiểm trong cửa sổ ẩn danh/không tiện ích cho log sạch. Kết quả 2026-11-12: đạt trên Firefox (thủ công) và Chrome (tự động).
13. Phát sáng động (REQ-GRAPHICS-17, AT-26): nạp một `.mid` nhiều track (hoặc `BigProject4b.rpp`). Mặc định mọi nốt đang phát sáng như nhau; "Độ sáng nền" của track là "Đều nhau". Trong "Kiểu dáng nốt" → "Phát sáng" chọn "Động khi chạm": theo Velocity thì nốt mạnh sáng hơn rõ; theo Tắt dần thì sáng nhất lúc chạm rồi mờ đến hết nốt; theo Automation + lane Âm lượng (`BigProject4b.rpp`) thì đổi theo envelope; "Tắt dần sau nốt" = 0,5 s thì nốt vừa qua còn sáng mờ một lúc; "Đảo chiều" làm ngược lại.
14. Danh sách track (REQ-UI-14 sửa, AT-26): với dự án 15 track, mặc định "Lưới" + "Tự động" nằm dưới khung xem trước, không thẻ nào tràn ở 1440/1100/800 px; bỏ "Tự động", gõ số cột 8 ở cửa sổ ~1280 px → báo chỉ vừa 4 cột; đổi số cột thấy thẻ trượt mượt tới chỗ mới; chuyển "Danh sách" → mỗi track một dòng ở cột phải, thẻ bay sang; bấm dòng hoặc Enter mở phần chỉnh; phím mũi tên đi giữa các thẻ/dòng; cuộn trang ở kiểu Lưới không có gì đè lên thẻ; tải lại trang giữ kiểu và số cột. Bật "Giảm chuyển động" của hệ điều hành thì thẻ đổi chỗ không có chuyển động.
15. Timeline lớp (D-69/D-70, AT-28): nạp `BigProject4b.rpp`, mở thẻ Chỉnh sửa. Kéo tay nắm hiện dần/ẩn dần ở góc trên đầu/cuối một thanh: dốc mờ có đường chéo, khung xem trước mờ dần theo; kéo tay nắm về sát mép thì dốc mờ hết (bảng Thuộc tính không còn ô số Hiện dần/Ẩn dần). Kéo mép một thanh gần độ dài thanh khác: thanh dính vào và chip hiện "= <tên lớp> (m:ss)". Chọn 3 lớp rồi cắt mép một lớp: cả ba dời cùng khoảng. Mục **Khoảng hiển thị** không còn trong Thuộc tính và các mục còn lại đánh số liền nhau. Bật làn **Nhạc**: thấy hợp âm và nốt từng track, cuộn và thu phóng timeline vẫn mượt (không giật với dự án nhiều nốt); kéo mép thanh gần chỗ đổi hợp âm thì dính vào đó. Ctrl+Z hoàn tác từng bước.
16. Precomp (D-69, AT-28): chọn 2–3 lớp rồi Ctrl+G → thanh precomp trùm đúng khoảng, khung hình không đổi. Nhấp đúp để vào trong, Esc để ra. Đặt **Tốc độ** 200%: keyframe bên trong nhanh gấp đôi, nốt/hợp âm không đổi; 50% thì chậm một nửa; so Xem trước với một khung xuất tại cùng thời điểm (giống nhau). Nhân bản lớp precomp (Ctrl+D) → bản **độc lập** (tên "<tên> 2"): sửa bên trong bản này thì bản kia không đổi; Ctrl+Z gỡ cả bản nhân và precomp sao chép trong một bước. Ctrl+Shift+G: các lớp ra lại timeline đúng vị trí, góc xoay và lúc hiện; nếu lớp precomp có hoạt hình riêng (keyframe, chuyển động, tỉ lệ, hiện/ẩn dần) thì hiện hộp thoại "Gỡ precomp này?" với **Vẫn gỡ** / **Huỷ** (Esc = Huỷ; tiêu điểm ở Huỷ); không có hoạt hình thì gỡ ngay, không hỏi. Thẻ Xem trước: khi gốc không có Piano Roll, màu theo track chỉnh Piano Roll của precomp tại vạch phát. Lồng 4 cấp được, cấp thứ 5 bị báo và không làm; tổng 512 lớp.
17. AI agent (D-70, AT-29): (a) mở ứng dụng KHÔNG có `?agent=1`, trong Console gõ `window.dawviz` → `undefined`; có `?agent=1` → có đối tượng và dải báo trên cùng. (b) Cách A: mở `plugins/dawviz/skills/dawviz/examples/section-cards-9x16.json`, bấm **Dán preset** ở cột Phong cách video, dán, **Thêm preset** → có preset mới, không cảnh báo; thử dán JSON hỏng → báo lỗi, không đổi gì. (c) Cách B (Claude in Chrome, cần bản công khai đã có `?agent=1`, tức sau khi PR #23 vào `main` và workflow Docs site chạy xong): mở `https://dawviz.github.io/dawviz/app/?agent=1`, nhờ Claude nạp dự án mẫu, áp preset, chụp khung và xuất; kiểm mọi bước hoàn tác được và hộp thoại Xuất không hỏi nơi lưu. (d) Cách C: `cd plugins/dawviz/skills/dawviz/scripts && npm install`, rồi `node dawviz.mjs --project <tệp> --preset ../examples/intro-precomp-16x9.json --frames 0,8 --out-dir out --export out/v.mp4` (trong repo, script tự chạy app từ repo; thêm `--url https://dawviz.github.io/dawviz/app/` để dùng bản công khai, sau khi nó có `?agent=1`): in một dòng JSON `ok: true`, PNG đúng nội dung, MP4 mở được (ffprobe: H.264). Không có Chrome cài sẵn thì script dùng Chromium của Playwright (đã thử: vẫn ra MP4 H.264); trình duyệt không có H.264 thì ra WebM và script báo rõ. (e) `/plugin marketplace add dawviz/dawviz` rồi `/plugin install dawviz@dawviz` trong Claude Code: skill hiện ra.
18. Khoá lớp (T-115): khoá một lớp rồi chọn nó: mọi ô ở bảng bên phải mờ (Vị trí, Xoay, Chữ, Hiện trong video, Nhân bản, Xoá, Căn chỉnh, Chuyển động), chỉ còn **Khoá trên khung** và mục xem-thôi (chọn khe chữ đang hiển thị). Mục **Bắt dính** (Đường gióng, Bắt theo lưới, Cỡ ô lưới) mờ khi mọi lớp đang chọn đã khoá, còn bật khi có ít nhất một lớp chưa khoá. Delete, mũi tên, Ctrl+D, kéo thanh và tay nắm fade không đổi gì.
19. Menu và hộp thoại (T-114, T-120): thu cửa sổ xuống ~700 px cao, mở **Thêm** ở Timeline và menu lịch sử (⏱): menu lật lên khi dưới không đủ chỗ và luôn nằm trong cửa sổ. Hộp thoại gỡ precomp: Tab xoay vòng trong hộp, Esc đóng.
20. Giao diện (T-116…T-119): Xem trước không còn dải xám bên phải khung; Cài đặt → bỏ chọn **Khung bản in thử** → dấu cắt biến mất ở Xem trước, Chỉnh sửa, Cài đặt và ô thả tệp; hàng **Tất cả lớp** có mắt/khoá thẳng cột với các hàng lớp; nút **Thêm** cao bằng các nút biểu tượng cùng hàng.
21. Tên thanh dính mép (T-121): Timeline: phóng to rồi cuộn ngang để đầu một thanh dài ra ngoài màn hình → tên lớp vẫn hiện sát mép trái vùng thanh (không đè lên cột tên lớp) cho tới hết thanh. (Nhãn hợp âm trên Piano Roll đã bỏ theo quyết định chủ dự án.)
