---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "11. Hiệu năng và bộ nhớ (ngân sách)"
path: "11. Hiệu năng và bộ nhớ (ngân sách)"
chunk: 11-hieu-nang-va-bo-nho-ngan-sach.md
source_lines: 400-409
source_sha1: e5d905cf74
ids: [NFR-PERF-04, NFR-PERF-05]
---
## 11. Hiệu năng và bộ nhớ (ngân sách)
| Mục | Ngân sách | Cách đạt |
|---|---|---|
| Tua ngẫu nhiên | khung mới ≤ 100 ms (NFR-PERF-05) | Chỉ mục nhị phân, không dựng lại gì ngoài khung |
| Parse tệp điển hình | không chặn UI | Worker; trần 500.000 nốt |
| Preview | ≥ 30 fps ở 1080p trên máy desktop điển hình **[PROVISIONAL]** | Chỉ vẽ nốt trong cửa sổ; không cấp phát trong vòng vẽ (tái dùng mảng) ⚪ |
| Xuất | ≥ 1× thời gian thực ở 1080p30 **[PROVISIONAL]** | `encodeQueueSize` kiểm soát dòng chảy; render trong Worker |
| Âm thanh (T-08) | PCM 48 kHz stereo ≤ 20 phút = 460,8 MB ≤ 25 % trần 2,0 GB của NFR-PERF-04; đỉnh tạm khi giải mã ≲ 1,2 GB, không chạy cùng lúc với xuất **[PROVISIONAL]** | Dò thời lượng trước khi giải mã, bỏ buffer cũ trước khi nạp mới, không giữ byte tệp nén, sóng âm tính theo khối (§6.2) |
Cần đo thật ở M2–M3; số liệu thực ghi vào TDD mục khoảng trống.
