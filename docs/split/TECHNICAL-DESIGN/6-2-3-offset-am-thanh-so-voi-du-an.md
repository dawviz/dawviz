---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.3 Offset âm thanh so với dự án"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.3 Offset âm thanh so với dự án"
chunk: 6-2-3-offset-am-thanh-so-voi-du-an.md
source_lines: 262-269
source_sha1: ba7b039c7b
ids: [REQ-UI-15, REQ-WIDGET-07]
---
#### 6.2.3 Offset âm thanh so với dự án
- **Quy ước dấu:** `offsetMs > 0` = âm thanh **trễ** so với dự án (đầu tệp rơi vào `t = offset`; từ `0` đến `offset` im lặng). `offsetMs < 0` = âm thanh **sớm**: **phần âm thanh nằm trước mốc `t = 0` bị cắt bỏ** (không nghe, không xuất), `t = 0` ứng với giây `−offset` của tệp. Ví dụ `−80 ms` cắt 80 ms đầu tệp. Vị trí buffer `b = t − offset/1000`; `b < 0` nghĩa là chưa tới đầu tệp. Cùng một hàm `mapToBuffer(t, offsetMs)` dùng cho Preview và cho xuất (§7), để hai nơi không thể lệch nhau.
- **Phạm vi và nhập:** ±10 000 ms, bước 1 ms (REQ-WIDGET-07). Ô số (`NumberField`, đơn vị `ms`, hỗ trợ phép tính và `+=` theo REQ-UI-15) cộng nút **− / +** (bước 1 ms; giữ Shift = 10 ms; giữ Alt = 100 ms [PROVISIONAL]). Ngoài phạm vi thì kẹp và hiện thông báo, không từ chối im lặng.
- **Lưu và hoàn tác:** `Doc.audioOffsetMs: number` (mặc định 0) trong store; lệnh `setAudioOffset` với `mergeKey: 'audio.offset'` (gõ/bấm ± liên tiếp gộp thành một mục), nhãn `web.cmd.audioOffset`, có trong danh sách lịch sử. Offset là thuộc tính của **dự án, không của tệp**: đổi tệp hay gỡ tệp không đặt lại offset, nên các mục hoàn tác luôn hợp lệ.
- **Tệp âm thanh không nằm trong `Doc`/lịch sử** (quá lớn, không JSON-hoá được): nó sống ở `lib/audioAsset.ts` như tài nguyên của phiên. Nạp/gỡ tệp là thao tác phiên, **không hoàn tác được** (có thể nạp lại). Đổi offset khi đang phát: neo lại tại `t` hiện tại với offset mới (nghe thấy ngay).
- **Chữ giải thích theo giá trị (chỉnh 7, qua `locales/`):** dưới ô offset luôn có một dòng nói bằng lời: `> 0` → "Âm thanh trễ 120 ms"; `< 0` → "Âm thanh sớm 80 ms" kèm "Cắt 80 ms đầu tệp âm thanh (trước mốc 0)"; `= 0` → "Âm thanh khớp với dự án". Khoá `web.audio.offset.late/early/cut/zero`, tham số `{ms}` định dạng theo ngôn ngữ.
- **Hiển thị:** chế độ **Cơ bản** chỉ có nút "Nạp âm thanh" + tên tệp (+ thời lượng, nút gỡ); **offset** nằm sau "Thêm tuỳ chọn" (dòng ADV). Nút "Nạp âm thanh" và vùng thả tệp nằm trong mục 01 Bài.
