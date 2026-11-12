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

## 3. Ma trận truy vết

| Yêu cầu | Test |
|---|---|
| REQ-GRAPHICS-05 (tất định) | `layoutPianoRoll`, `drawPianoRoll` |
| REQ-GRAPHICS-06 (độ sáng) | `trackBrightness`, Reaper `BigProject4b` |
| NFR-PERF-05 (tua ngẫu nhiên) | `activeNotes` (đo thời gian chưa có, xem 4) |
| REQ-I18N-04 (dịch lỗi theo mã) | `problems` ×2, `i18n:check` |
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
3. Với `BigProject4.rpp` (tham chiếu `.mid` ngoài): không chọn kèm → thấy cảnh báo `WARN_RPP_EXTERNAL_MIDI` bằng ngôn ngữ đang chọn; chọn kèm `.mid` → có nốt.
4. Bấm Phát/Tạm dừng, kéo thanh tua; đưa `t` về cùng giá trị hai lần cho cùng khung hình.
5. `BigProject4b.rpp`: nguồn độ sáng `volume` làm track tối dần theo envelope; đổi sang `off` thì hết đổi; `đảo chiều` làm ngược lại.
6. Đổi ngôn ngữ en ↔ vi: mọi chuỗi và thông báo đang hiển thị đổi ngay; tải lại trang vẫn giữ lựa chọn.
7. Tệp sai định dạng (`.flp`): thấy lỗi dịch được, ứng dụng không hỏng.
8. Bố cục (2026-11-12): ở bề rộng 1440, 1100 và 800 px, không phần tử nào trong bảng "Kiểu nốt" hay thẻ track tràn ra ngoài khung; trang không có thanh cuộn ngang. Ở màn rộng (`lg`), Piano Roll và thanh phát đứng yên khi cuộn danh sách track (cột phải tự cuộn).
9. Đổi cỡ cửa sổ khi đang tạm dừng: Piano Roll vẽ lại theo bề rộng mới, không bị kéo giãn.
10. Ô nhập số trong bảng "Kiểu nốt" (REQ-UI-15, phần đã làm): gõ `10*3` rồi Enter ở "Cỡ quầng sáng" → 30; gõ `500` → 64 (giới hạn cứng); ↑/↓ đổi theo bước, Shift ×10; gõ chữ → viền đỏ, Esc trả giá trị cũ; Tab qua lần lượt thanh trượt rồi ô nhập.
