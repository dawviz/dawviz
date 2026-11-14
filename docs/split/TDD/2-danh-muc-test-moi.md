---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "2. Danh mục test mới"
path: "2. Danh mục test mới"
chunk: 2-danh-muc-test-moi.md
source_lines: 23-47
source_sha1: dfc089d18c
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

### 2.4 `packages/render-core/test/typography.test.ts` (20, T-72)
Bộ kiểu dựng sẵn (phông gốc trùng `DEFAULT_FONT`, số đếm/đồng hồ bật chữ số đều); ghi đè từng thuộc tính, ↺, "Lưu thành kiểu mới"/"Cập nhật kiểu"; chữ thường giữ đường vẽ cũ; chữ số đều bề rộng ("111" = "888"); tracking và tỉ lệ ngang; căn lề; tràn khung (cắt "…" không vượt khung, tự thu nhỏ vừa khít, chạm cỡ tối thiểu thì cắt, để tràn); xuống dòng + số dòng tối đa; hoa/thường/chữ hoa nhỏ; chỉ số trên/dưới; cụm ký tự tiếng Việt; định dạng từng đoạn (valueStyle, bassStyle) qua preset; lược đồ `textStyles` + ghi đè sai bị bỏ có cảnh báo + vòng lưu/đọc; phông cần nạp theo kiểu đang dùng; lệnh vẽ: thứ tự viền/tô, viền ngoài, gạch, gradient, nghiêng, nền chữ, bóng quy theo scale và góc xoay; tất định trong widget xoay. Golden `paper-1x1` đổi có chủ ý ở chữ có số (chữ số đều bề rộng).
