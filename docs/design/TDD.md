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
1. Chưa chạy `npm install`/`build`/Vitest cho `apps/web` (xem SDD mục 8). Kỳ vọng lỗi biên dịch nhỏ ở lần đầu.
2. Chưa đo hiệu năng `layoutPianoRoll` với 500.000 nốt (giới hạn của parser) và với 8 track dày.
3. Chưa có test hình ảnh (ảnh chụp so sánh) cho Canvas; để M3 cùng đường ống xuất.
4. Chưa có kiểm thử trợ năng (bàn phím, đọc màn hình) ngoài thuộc tính `role`/`aria-*` cơ bản.
5. Phần trăm độ phủ chưa đo.

## 5. Danh sách kiểm thủ công cho AT-18 (Chrome)
1. `npm install && npm run dev`, mở trang; không có lỗi trong console.
2. Thả lần lượt `BigProject4b.rpp`, `Demo.als` và `Oboe_MIDI_001.mid` (hai tệp sau để trong `test/fixtures/third-party/`, không commit) và một `.dawproject`: thấy Piano Roll, danh sách track, thời lượng.
3. Với `BigProject3.rpp` (tham chiếu `Oboe MIDI 001.mid` ngoài; REQ-UI-08): chỉ chọn `.rpp` → thấy bảng đỏ "Dự án dùng 1 file MIDI ngoài chưa được nạp" kèm tên file và nút "Nạp file .mid…", không có thêm lỗi chung "không có nốt". Nạp một `.mid` tên khác → bảng báo tệp đó "không dùng". Nạp đúng tệp bằng nút hoặc thả vào bảng (tên khác hoa/thường hoặc dấu cách/gạch dưới vẫn khớp) → có nốt mà không phải chọn lại `.rpp`. Chọn cùng lúc `.rpp` + `.mid` ở khung thả chính cũng phải ra nốt ngay.
4. Bấm Phát/Tạm dừng, kéo thanh tua; đưa `t` về cùng giá trị hai lần cho cùng khung hình.
5. `BigProject4b.rpp`: nguồn độ sáng `volume` làm track tối dần theo envelope; đổi sang `off` thì hết đổi; `đảo chiều` làm ngược lại.
6. Đổi ngôn ngữ en ↔ vi: mọi chuỗi và thông báo đang hiển thị đổi ngay; tải lại trang vẫn giữ lựa chọn.
7. Tệp sai định dạng (`.flp`): thấy lỗi dịch được, ứng dụng không hỏng.
8. Bố cục (2026-11-12): ở bề rộng 1440, 1100 và 800 px, không phần tử nào trong bảng "Kiểu nốt" hay thẻ track tràn ra ngoài khung; trang không có thanh cuộn ngang. Ở màn rộng (`lg`), Piano Roll và thanh phát đứng yên khi cuộn danh sách track (cột phải tự cuộn).
9. Đổi cỡ cửa sổ khi đang tạm dừng: Piano Roll vẽ lại theo bề rộng mới, không bị kéo giãn.
10. Ô nhập số trong bảng "Kiểu nốt" (REQ-UI-15, phần đã làm): gõ `10*3` rồi Enter ở "Cỡ quầng sáng" → 30; gõ `500` → 64 (giới hạn cứng); ↑/↓ đổi theo bước, Shift ×10; gõ chữ → viền đỏ, Esc trả giá trị cũ; Tab qua lần lượt thanh trượt rồi ô nhập.
11. Track Info và ngưỡng độ sáng (T-03): mở "Chi tiết" của một track trong `BigProject4b.rpp`: thấy tầm cao độ (A0 – A7), fader `0 dB · pan 0`, automation `Volume`, dòng "Hiện tại: …%" chạy theo khi phát. Đặt "Sàn (dB)" = −6: nốt tối hẳn ở đoạn envelope thấp; kéo "Sàn" vượt "Trần" thì "Trần" tự lùi theo (luôn cách ≥ 1 dB); "Độ sáng thấp nhất" vượt "cao nhất" thì "cao nhất" theo lên. Đổi nguồn sang `off` thì các thanh ngưỡng ẩn và độ sáng 100%. Ô màu track tròn.
12. CSP (T-30): chạy `npm run build && npm run preview` ở gốc repo, mở địa chỉ được in ra (mặc định `http://localhost:4173/`) (không dùng `npm run dev`: dev không có CSP). DevTools → Console: không có dòng "Refused to …" hay "This document requires 'TrustedScriptURL'"; nạp một tệp vẫn parse được (Worker chạy dưới Trusted Types). Kiểm thêm trong Console: `document.body.innerHTML += '<b>x</b>'` phải báo lỗi TypeError (Trusted Types chặn). Ghi chú: Firefox bắt gõ `allow pasting` trước khi cho dán vào Console (dòng SyntaxError đi kèm là bình thường); dòng log có nguồn `moz-extension://` hoặc `chrome-extension://` là của tiện ích trình duyệt, không tính. Nên kiểm trong cửa sổ ẩn danh/không tiện ích cho log sạch. Kết quả 2026-11-12: đạt trên Firefox (thủ công) và Chrome (tự động).
13. Phát sáng động (REQ-GRAPHICS-17, AT-26): nạp một `.mid` nhiều track (hoặc `BigProject4b.rpp`). Mặc định mọi nốt đang phát sáng như nhau; "Độ sáng nền" của track là "Đều nhau". Trong "Kiểu dáng nốt" → "Phát sáng" chọn "Động khi chạm": theo Velocity thì nốt mạnh sáng hơn rõ; theo Tắt dần thì sáng nhất lúc chạm rồi mờ đến hết nốt; theo Automation + lane Âm lượng (`BigProject4b.rpp`) thì đổi theo envelope; "Tắt dần sau nốt" = 0,5 s thì nốt vừa qua còn sáng mờ một lúc; "Đảo chiều" làm ngược lại.
14. Danh sách track (REQ-UI-14 sửa, AT-26): với dự án 15 track, mặc định "Lưới" + "Tự động" nằm dưới khung xem trước, không thẻ nào tràn ở 1440/1100/800 px; bỏ "Tự động", gõ số cột 8 ở cửa sổ ~1280 px → báo chỉ vừa 4 cột; đổi số cột thấy thẻ trượt mượt tới chỗ mới; chuyển "Danh sách" → mỗi track một dòng ở cột phải, thẻ bay sang; bấm dòng hoặc Enter mở phần chỉnh; phím mũi tên đi giữa các thẻ/dòng; cuộn trang ở kiểu Lưới không có gì đè lên thẻ; tải lại trang giữ kiểu và số cột. Bật "Giảm chuyển động" của hệ điều hành thì thẻ đổi chỗ không có chuyển động.
