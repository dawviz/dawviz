---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.4 Phát / dừng / tua / lặp / về đầu"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.4 Phát / dừng / tua / lặp / về đầu"
chunk: 6-2-4-phat-dung-tua-lap-ve-dau.md
source_lines: 255-262
source_sha1: e5d905cf74
ids: [REQ-UI-03]
---
#### 6.2.4 Phát / dừng / tua / lặp / về đầu
- **Phát:** lần đầu trong sự kiện bấm: tạo `AudioContext({ sampleRate: 48000, latencyHint: 'interactive' })` (không hỗ trợ 48k thì để mặc định, trình duyệt tự resample) rồi `resume()`. **Không tạo/resume ngoài sự kiện người dùng.** Nếu `resume()` chưa xong, đồng hồ không chạy, nên hình không chạy trước tiếng.
- **Dừng:** `stop()` các nguồn, hạ gain 5 ms trước để không bị tiếng "tách"; `t` đứng đúng tại vị trí nghe được.
- **Tua (kéo thanh, ←/→, nhảy đầu/cuối):** đang dừng chỉ đổi `t`; đang phát thì hạ gain đoạn cũ 3 ms, tạo đoạn mới tại vị trí mới và neo lại. Mỗi lần neo tăng `generation`; sự kiện `ended` của đoạn cũ bị bỏ qua nếu `generation` đã đổi. Giới hạn một lần tạo nguồn mỗi khung hình khi kéo liên tục.
- **Lặp (Loop Range / cả bài, REQ-UI-03):** không dùng `loop` của nút nguồn (không xử lý được phần im lặng do offset). Trình lên lịch **đặt trước đoạn kế** trên trục `AudioContext` khoảng 100–150 ms trước điểm kết thúc đoạn hiện tại (nên chính xác theo mẫu). Toán thuần `positionWithLoop(t0, trôi, [a,b])`: `t0 + trôi < b` thì tiến thẳng, ngược lại `a + ((t0 + trôi − b) mod (b − a))`.
- **Về đầu:** `seek(0)`. **Hết bài:** dừng tại `duration`, bấm Phát lại thì về 0 (như `togglePlay` hiện nay).
- **Độ dài phát** = `max(độ dài dự án, offset + độ dài âm thanh)` để âm thanh dài hơn không bị cắt, đúng công thức `Duration` ở §7 (chưa cộng 2 s đệm cuối, phần đó chỉ của xuất).
