---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.7 Dữ liệu giữ lại cho T-09 (xuất video, §7)"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.7 Dữ liệu giữ lại cho T-09 (xuất video, §7)"
chunk: 6-2-7-du-lieu-giu-lai-cho-t-09-xuat-video-7.md
source_lines: 291-301
source_sha1: ba7b039c7b
ids: [AT-03, REQ-EXPORT-03]
---
#### 6.2.7 Dữ liệu giữ lại cho T-09 (xuất video, §7)
`lib/audioAsset.ts` giữ cho cả phiên, và T-09 chỉ đọc:
| Giữ | Dùng để |
|---|---|
| `AudioBuffer` 48 kHz (1–2 kênh, Float32) | phát; xuất đọc theo **khối 1 s** bằng `getChannelData(c).slice(...)` rồi chuyển sang Export Worker (mỗi khối một bản sao, không chuyển nguyên buffer vì Preview còn dùng) |
| `assetId` (SHA-256), `name`, `File` | pre-flight, tên mặc định của tệp xuất, Project Pack (M4) |
| `durationSec`, `sampleRate`, số kênh | `Duration` (§7.1), kiểm đồng bộ |
| `Doc.audioOffsetMs` | `mapToBuffer` / `exportSegments` dùng chung: đoạn thiếu thì chêm im lặng, đoạn thừa (kể cả phần trước mốc 0 khi offset âm) thì cắt (REQ-EXPORT-03) |
| Đỉnh cơ sở 512 mẫu | không dùng ở xuất |
Cắt theo Export Range, chêm im lặng, mã hoá AAC, bù priming (AT-03) và độ trễ khởi tạo là việc của T-09; T-08 chỉ bảo đảm **`mapToBuffer` đã được kiểm test và dùng chung**. Xuất là offline nên **không bao giờ** áp độ trễ thiết bị (chỉnh 1); điều này được khoá bằng test (§6.2.2).
