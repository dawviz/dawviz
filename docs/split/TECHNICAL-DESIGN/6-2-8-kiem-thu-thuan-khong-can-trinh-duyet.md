---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.8 Kiểm thử (thuần, không cần trình duyệt)"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.8 Kiểm thử (thuần, không cần trình duyệt)"
chunk: 6-2-8-kiem-thu-thuan-khong-can-trinh-duyet.md
source_lines: 287-289
source_sha1: 89531c2f60
ids: [ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, ERR_FILE_TOO_LARGE]
---
#### 6.2.8 Kiểm thử (thuần, không cần trình duyệt)
`AudioContextLike` giả có `currentTime` tự đặt, `baseLatency`, `outputLatency`, ghi lại các lệnh `start/stop`. Test: phát; dừng; tua khi dừng/đang phát; lặp (qua biên, `t0` trước/sau `a`); offset âm/dương (`b < 0`, `b` vượt buffer); bù độ trễ (nhánh dự phòng: đứng yên đúng bằng độ trễ rồi chạy; `outputLatency` thiếu; kẹp 0,5 s) và nhánh `getOutputTimestamp` (nội suy theo khung, không trừ độ trễ lần hai, cặp không hợp lệ thì rơi về dự phòng); `rearm` khi `sinkchange`/`devicechange`/`statechange` (hình không nhảy, độ trễ lấy lại); **xuất không phụ thuộc độ trễ**; chuyển chế độ khi dừng/đang phát (không nhảy: `|t_sau − t_trước| = 0`); tab ẩn (nhảy `currentTime` mà không có khung); `suspended`; offset hoàn tác/gộp/làm lại trong store; `ERR_FILE_TOO_LARGE`/`ERR_AUDIO_TOO_LONG`/`ERR_AUDIO_DECODE` có mã; sóng âm bit-giống nhau khi đổi cách chia khối; `audioLengthCheck`. Kiểm tay trên trình duyệt thật: phát bài có tiếng, tua nhiều lần, hình–tiếng vẫn khớp.
