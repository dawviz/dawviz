---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "2. Danh mục test mới"
path: "2. Danh mục test mới"
chunk: 2-danh-muc-test-moi.md
source_lines: 23-44
source_sha1: 21a6598042
ids: [ARC-01, AT-17, D-33, NFR-PERF-05, REQ-GRAPHICS-05, REQ-GRAPHICS-06]
---
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
