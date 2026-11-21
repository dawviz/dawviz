---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "4. Ứng dụng web (`apps/web`, D-34)"
path: "4. Ứng dụng web (`apps/web`, D-34)"
chunk: 4-ung-dung-web-apps-web-d-34.md
source_lines: 42-57
source_sha1: bd726ffa10
ids: [D-34, D-63]
---
## 4. Ứng dụng web (`apps/web`, D-34)

| Phần | Thiết kế |
|---|---|
| `workers/parser.worker.ts` + `lib/parserClient.ts` | Một Worker module; `parseInWorker({name, buffer, files})` trả Promise; chuyển quyền sở hữu `ArrayBuffer`; lỗi là `ParseFailure{code, message, details}` |
| `workers/notation.worker.ts` + `lib/notation/` | Bản nhạc (D-63): `buildNotation` (lượng tử của Render Core + `engrave` bằng VexFlow 5.6 core, `RecordingContext`, bảng glyph sinh sẵn `glyphTable.ts`); `notationClient` (một Worker dùng lại, bộ đệm theo khoá), `useNotation` (luồng chính, khoá ở `key.ts` không kéo VexFlow vào bundle chính) |
| `lib/clock.ts` | Đồng hồ phát thuần: `advance`, `seek`, `togglePlay` (không đụng DOM) |
| `lib/problems.ts` | `describeProblem(i18n, kind, code, message, details)` → chuỗi dịch (`errors.*`, `warn.*`), rơi về thông điệp gốc nếu chưa có bản dịch |
| `i18n/I18nProvider.tsx` | Nạp `locales/*.json`, chọn ngôn ngữ (lưu `localStorage` có try/catch), đặt `<html lang dir>` |
| `components/` | `FileDrop`, `Notices`, `PianoRollCanvas`, `Transport`, `TrackPanel`, `LanguageSelect` |
| `App.tsx` | Giữ trạng thái: tệp đã nạp, đồng hồ `{t, playing, rate}`, cấu hình độ sáng theo track. Vòng `requestAnimationFrame` chỉ cập nhật `t` |

Luồng: chọn/thả tệp (kèm `.mid` ngoài nếu có) → Worker `parseProject` → `{ast, warnings}` → state → `PianoRollCanvas` gọi Render Core theo `t`. `PianoRollCanvas` xử lý DPR và kích thước; không có logic bố cục trong component.

**Framer Motion** chỉ dùng cho: khung thả tệp (hover/kéo), vào/ra của thông báo và danh sách track, chuyển cảnh sau khi nạp. Không dùng cho khung hình video.
