---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "5.2 Bộ token (đề xuất, chốt khi làm)"
path: "5. Theme giao diện chỉ đổi màu (D-52) > 5.2 Bộ token (đề xuất, chốt khi làm)"
chunk: 5-2-bo-token-de-xuat-chot-khi-lam.md
source_lines: 315-327
source_sha1: cae014d43d
ids: [REQ-GRAPHICS-02]
---
### 5.2 Bộ token (đề xuất, chốt khi làm)
Mỗi theme khai báo đủ token cho **cả sáng và tối**; thiếu token nào thì lấy của theme mặc định.

| Nhóm | Token |
| :--- | :--- |
| Nền và bề mặt | `bg`, `surface`, `surface-raised`, `line`, `line-control`, `line-strong` |
| Chữ | `text`, `text-muted`, `text-faint` |
| Nhấn | `accent`, `accent-text` (chữ trên nền nhấn), `focus`, `selection` |
| Trạng thái | `danger`, `warning`, `success` |
| Thanh phát và timeline | `scrub-played`, `scrub-rest`, `waveform`, `guide` (đường gióng ở Edit Mode, REQ-GRAPHICS-02; mặc định ở 5.4) |

Kiểm khi nạp theme: đúng schema (chỉ các token trên, giá trị là màu); `text`, `text-muted`, `text-faint` và `accent` đạt 4,5:1 trên cả `bg`, `surface`, `surface-raised`; `accent-text`/`accent` đạt 4,5:1; `line-control` đạt 3:1 trên cả ba nền; `guide` đạt 3:1 trên `#FFFFFF` và `#0C0E16` (quy tắc AA ở 5.4); `accent` khác đủ xa `danger` để nút xuất không bị đọc như cảnh báo. Không đạt thì từ chối kèm lý do, không áp một phần.
