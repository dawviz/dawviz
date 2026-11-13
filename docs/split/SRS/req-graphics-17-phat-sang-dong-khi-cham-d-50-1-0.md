---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-17: Phát sáng động khi chạm (D-50, 1.0)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-17: Phát sáng động khi chạm (D-50, 1.0)"
chunk: req-graphics-17-phat-sang-dong-khi-cham-d-50-1-0.md
source_lines: 489-508
source_sha1: c62aee35b6
ids: [D-50, REQ-AST-02, REQ-AUDIO-01, REQ-GRAPHICS-06, REQ-GRAPHICS-07, REQ-GRAPHICS-10, REQ-GRAPHICS-13, REQ-GRAPHICS-17, SOI-19]
---
#### REQ-GRAPHICS-17: Phát sáng động khi chạm (D-50, 1.0)
Thay cho việc lấy automation làm cơ chế mặc định, mặc định mọi nốt **phát sáng như nhau**; người dùng bật **phát sáng động** để cường độ phát sáng lúc thanh phát chạm nốt phụ thuộc một tiêu chí.

* **Chế độ** (`NoteStyle.glowMode`): `uniform` = **Đều nhau** (mặc định) · `dynamic` = **Động khi chạm**. Thuộc `NoteStyle`, nên có hai tầng như REQ-GRAPHICS-07: mặc định toàn cục và ghi đè theo track (ví dụ trống theo velocity, pad theo automation).
* **Thời điểm sáng (bao thời gian):** khi `glowActiveOnly` bật (mặc định), nốt chỉ sáng từ lúc thanh phát chạm đầu nốt tới hết nốt; tắt thì nốt luôn sáng (cường độ vẫn theo tiêu chí). **Tắt dần sau nốt** `glowRelease` 0–4 s (mặc định 0): sau khi nốt kết thúc, phát sáng giảm tuyến tính về 0 trong khoảng này.
* **Tiêu chí** (`glowSource`), mỗi tiêu chí cho giá trị `s` chuẩn hoá 0..1:

| Tiêu chí | Cách tính `s` | Ghi chú |
| :--- | :--- | :--- |
| `velocity` | `velocity / 127` | Nốt đánh mạnh sáng hơn |
| `pitch` | vị trí cao độ trong tầm cao độ đang hiển thị của widget | Nốt cao sáng hơn (đảo chiều để ngược lại) |
| `pan` | pan của track **lúc nốt bắt đầu** (lane pan nếu có, không thì `mix.pan`). Hai cách đọc (`glowPanMode`): **Trái → phải** (mặc định) −1..1 → 0..1, trái hẳn yếu nhất; **Lệch khỏi giữa** `|pan|`, giữa yếu nhất, càng lệch trái hoặc phải càng mạnh. Cách đọc cũng áp cho lane pan khi tiêu chí là `automation` | Chiều pan trong tệp theo SOI-19 **[VERIFY]** |
| `fade` | `1` lúc chạm, giảm tuyến tính về `0` ở cuối nốt | Hiệu ứng "chạm rồi tắt dần" theo độ dài nốt (chủ dự án xác nhận 2026-11-12) |
| `automation` | giá trị lane đã chọn (`glowLane`) **tại thời điểm `t`** trong lúc nốt kêu, chuẩn hoá theo loại lane | Mọi lane trong REQ-AST-02: âm lượng, pan, mute, send, tham số plugin… |

* **Ánh xạ:** cường độ = `glow × env(t) × lerp(glowMin, glowMax, s')`, với `s' = 1 − s` khi bật **Đảo chiều** (`glowInvert`). Mặc định `glowMin = 0,15`, `glowMax = 1`. Không có dữ liệu cho tiêu chí (ví dụ track không có lane đã chọn) thì `s = 1`, tức sáng như chế độ đều nhau; giao diện ghi rõ lane "không có trong dự án".
* **Mở rộng (sau 1.0):** độ dài nốt, nốt thuộc hợp âm đang vang, pha nhịp (`beat.phase`), âm lượng stem của track (REQ-AUDIO-01, 1.2), và biểu thức tuỳ ý (REQ-GRAPHICS-13). Tiêu chí mới chỉ cần trả `s` 0..1 nên không đổi phần còn lại.
* **Quan hệ với cơ chế khác:** độc lập với độ sáng nền (REQ-GRAPHICS-06). Pha `hit` của template chuyển cảnh nốt (REQ-GRAPHICS-10) dùng **cùng bộ tiêu chí** này để điều khiển hiệu ứng chạm (nảy, rung, toả hạt…), không chỉ phát sáng.
* **Tất định:** cường độ chỉ phụ thuộc `(t, nốt, track, kiểu)`, tính trong Render Core (`packages/render-core/src/glow.ts`), giống nhau ở Preview và Export.
