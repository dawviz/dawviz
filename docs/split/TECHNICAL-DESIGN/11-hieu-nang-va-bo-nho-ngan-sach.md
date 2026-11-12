---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "11. Hiệu năng và bộ nhớ (ngân sách)"
path: "11. Hiệu năng và bộ nhớ (ngân sách)"
chunk: 11-hieu-nang-va-bo-nho-ngan-sach.md
source_lines: 199-207
source_sha1: 10dd2f7ff3
ids: [NFR-PERF-05]
---
## 11. Hiệu năng và bộ nhớ (ngân sách)
| Mục | Ngân sách | Cách đạt |
|---|---|---|
| Tua ngẫu nhiên | khung mới ≤ 100 ms (NFR-PERF-05) | Chỉ mục nhị phân, không dựng lại gì ngoài khung |
| Parse tệp điển hình | không chặn UI | Worker; trần 500.000 nốt |
| Preview | ≥ 30 fps ở 1080p trên máy desktop điển hình **[PROVISIONAL]** | Chỉ vẽ nốt trong cửa sổ; không cấp phát trong vòng vẽ (tái dùng mảng) ⚪ |
| Xuất | ≥ 1× thời gian thực ở 1080p30 **[PROVISIONAL]** | `encodeQueueSize` kiểm soát dòng chảy; render trong Worker |
Cần đo thật ở M2–M3; số liệu thực ghi vào TDD mục khoảng trống.
