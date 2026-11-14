---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.9 Quyết định đã duyệt"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.9 Quyết định đã duyệt"
chunk: 6-2-9-quyet-dinh-da-duyet.md
source_lines: 305-312
source_sha1: 03d31db5d8
ids: []
---
#### 6.2.9 Quyết định đã duyệt
1. Dấu offset: dương = âm thanh *trễ*; âm = âm thanh *sớm*, cắt phần trước mốc 0.
2. Offset thuộc dự án, không thuộc tệp; nạp/gỡ tệp không hoàn tác được; nạp dự án mới thì gỡ âm thanh và đặt offset về 0.
3. Ngưỡng cảnh báo lệch độ dài (1 s/2 % ngắn; 10 s/10 % dài) và các số [PROVISIONAL] khác.
4. Độ dài phát = `max(dự án, offset + âm thanh)`.
5. Giải mã trên luồng chính bằng `OfflineAudioContext`.
6. Chỉnh sau duyệt: độ trễ tách khỏi offset và xuất (1), `rearm` (2), `getOutputTimestamp` (3), MP3 VBR giải mã rồi mới kiểm (4), đối chiếu ngân sách bộ nhớ (5), offset âm cắt trước mốc 0 (6), chữ giải thích offset (7), CSP giữ nguyên (8).
