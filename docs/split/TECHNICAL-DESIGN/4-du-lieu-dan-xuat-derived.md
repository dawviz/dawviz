---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "4. Dữ liệu dẫn xuất (derived) 🟢/⚪"
path: "4. Dữ liệu dẫn xuất (derived) 🟢/⚪"
chunk: 4-du-lieu-dan-xuat-derived.md
source_lines: 92-104
source_sha1: af52e37072
ids: [OI-05]
---
## 4. Dữ liệu dẫn xuất (derived) 🟢/⚪

| Dữ liệu | Tính khi nào | Dùng cho |
|---|---|---|
| `TimelineIndex` (nốt theo track sắp theo thời gian + `maxDur`) 🟢 | Khi nạp AST hoặc đổi track hiển thị | Piano Roll, Live Trigger, Keyboard |
| Lane đã lấy mẫu (bảng độ sáng theo bước 1/30 s) ⚪ | Khi đổi cấu hình độ sáng | Tối ưu nếu `sampleLane` mỗi khung quá chậm (hiện O(log n), có thể không cần) |
| `HudData.starts` 🟢 (T-69): mỗi track một `Float64Array` thời điểm bắt đầu nốt đã sắp (`buildHud`, hoặc `hudOf` dựng một lần rồi đệm theo `derived`) | Khi nạp AST hoặc đổi track hiển thị | Event Counter (`Played` = tìm nhị phân `starts ≤ t`, `Total` = độ dài mảng) |
| `HudData.bars` (`BarGrid`) 🟢 (T-69): ranh giới ô nhịp theo tick từ `tempoMap` (`timeSigNumerator/Denominator`), kèm giây | Khi nạp AST | Time & Bar Counter (tìm nhị phân tick → Bar, Beat, Sub, phần beat, phần bar) |
| `ChordTimeline` ⚪ | Khi nạp AST, tính trong Worker bằng `@tonaljs/chord-detect` (OI-05) | Widget hợp âm; lưu trong AST là `chordTimeline: []` |
| Đỉnh sóng audio (peaks) ⚪ | Khi nạp audio | Widget sóng âm |

Quy tắc: dữ liệu dẫn xuất là **hàm thuần** của AST + cấu hình, tính một lần ngoài vòng vẽ, có thể chuyển sang Export Worker bằng `postMessage` (transfer khi là `ArrayBuffer`).
