---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.2 Đồng hồ chủ"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.2 Đồng hồ chủ"
chunk: 6-2-2-dong-ho-chu.md
source_lines: 241-261
source_sha1: 03d31db5d8
ids: []
---
#### 6.2.2 Đồng hồ chủ
Một mô hình duy nhất cho cả hai chế độ: **neo + thời gian trôi qua**, `t = t0 + rate · max(0, s − s0)`, với `s` là giờ của *nguồn* tại khung đang vẽ và `s0` là giờ nguồn lúc neo (`t = t0`). Hai chế độ chỉ khác `s`:
| Chế độ | `s` tại khung vẽ | Độ trễ thiết bị |
|---|---|---|
| Không âm thanh (như nay) | `performance.now()/1000` | 0 |
| Có âm thanh | **giờ nghe được** trên trục `AudioContext` (bên dưới) | đã nằm trong `s` |

- **Độ trễ thiết bị tách hẳn khỏi offset (chỉnh 1).** Độ trễ chỉ có ở *đồng hồ xem trước*, ở một chỗ duy nhất: `heardContextTime` trong `lib/masterClock.ts`. `audioOffsetMs` là lựa chọn của người dùng, lưu trong dự án. `mapToBuffer` và đường xuất (§7) **không nhận và không import** độ trễ: xuất là offline, không có thiết bị. Test bắt buộc: (a) `lib/audioMap.ts` không chứa chữ `latency` và không import `masterClock`; (b) kế hoạch cắt âm thanh để xuất (`exportSegments`) cho cùng kết quả từng bit với mọi cấu hình độ trễ dựng ra trong test.
- **Giờ nghe được `heardContextTime(sample, frameMs)`, mỗi khung (chỉnh 3):**
  1. *Có `getOutputTimestamp()`* và cho cặp hợp lệ (`performanceTime > 0`, hữu hạn, `contextTime ≥ 0`, ngữ cảnh đang `running`): `heard = ts.contextTime + (frameMs − ts.performanceTime)/1000`. Quy đổi `performance.now` ↔ trục `AudioContext` này nội suy mượt **từng khung** (không bị bậc thang ≈ 2,7 ms của `currentTime`). Theo đặc tả, `contextTime` của hàm này là mẫu *đang phát ra loa*, nên độ trễ đầu ra **đã nằm trong đó**, không trừ thêm (trừ lần nữa là đếm đôi).
  2. *Dự phòng* (không có hàm, cặp không hợp lệ, hoặc ngữ cảnh chưa chạy): `heard = currentTime − L`, `L = clamp(baseLatency + outputLatency, 0, 0,5)` (`undefined` coi là 0). `L` lấy mẫu **một lần mỗi lần neo**, không đọc mỗi khung vì ước lượng dao động làm `t` rung.
  3. Trong cả hai nhánh, trong một đoạn phát liên tục `t` không bao giờ giảm (kẹp đơn điệu) để nhiễu của cặp mốc thời gian không làm hình giật lùi; chỉ tua và vòng lặp mới làm `t` lùi.
- **Neo lại và lấy mẫu lại độ trễ (chỉnh 2).** `rearm` = đọc `t*` bằng cách tính hiện tại → dừng các đoạn (hạ gain 5 ms) → lấy mẫu lại `L` → mở đoạn mới tại `t*` → neo mới. **Hình không nhảy** (cùng `t*`), tiếng và hình khớp theo độ trễ *mới*. `rearm` chạy khi: `sinkchange` của `AudioContext`, `devicechange` của `navigator.mediaDevices`, `statechange` về `running` (sau `suspended`/`interrupted`) khi đang ở trạng thái phát, đổi offset, và đổi tệp âm thanh. Đang dừng thì chỉ lấy lại `L` cho lần phát sau.
- **Phát một đoạn:** mỗi đoạn là một `AudioBufferSourceNode` qua một `GainNode`, lên lịch `start(when, offsetTrongBuffer, độDài)` với `when = currentTime + 0,03 s` (đệm khởi động), neo `s0 = when` (cùng trục giờ nghe được, nên `t` đứng ở `t0` đến lúc âm thanh thực sự tới tai). Mọi thời điểm tính trên **trục `AudioContext`** nên chính xác theo mẫu, không phụ thuộc `setTimeout`. `AudioContext` đang `suspended` thì `currentTime` đứng yên và `t` đứng yên theo, tự khớp khi `resume()` xong.
- **Offset (§6.2.3):** vị trí trong buffer `b = t − offset`; `planSegment` cho biết trễ bao lâu mới có tiếng, bắt đầu từ đâu trong buffer, dài bao nhiêu.
- **Chuyển chế độ không nhảy:** việc duy nhất khi nạp/gỡ âm thanh là **neo lại tại `t` đang đọc từ nguồn cũ**: `t* = đọc(cũ)`, `t0 = t*`, `s0 = nguồn mới tại thời điểm đó`. Đang phát thì khởi động đoạn mới từ `t*` (`t` đứng yên ≈ 30 ms đệm rồi chạy tiếp, không nhảy); đang dừng thì chỉ đổi nguồn. Gỡ âm thanh khi đang phát: `t* = đọc(âm thanh)` rồi quay về `performance.now()` với `last = now`.
- **Tab ẩn:** ở chế độ có âm thanh không cộng dồn `dt`; mỗi khung đọc lại từ `AudioContext` nên quay lại tab là đúng ngay. Âm thanh vẫn chạy khi tab ẩn; bộ lên lịch lặp chạy bằng `setInterval` 250 ms và đặt trước 2 s (trình duyệt bóp timer nền nên vòng lặp quá ngắn trong tab ẩn có thể vấp; chấp nhận, ghi chú).
- **`AudioContext` bị hệ thống treo** (`suspended`/`interrupted` sau khi đã chạy, ví dụ rút tai nghe): `currentTime` đứng nên `t` tự đứng; chuyển `playing = false` giữ nguyên `t`, người dùng bấm Phát để tiếp.
- **Tốc độ:** `rate` là 1 khi có âm thanh. Công thức đã có `rate` để sau này nối `playbackRate` mà không đổi mô hình.
- **Cấu trúc mã:** `lib/masterClock.ts` (toán đồng hồ thuần, không biết Web Audio), `lib/audioMap.ts` (`mapToBuffer`, `planSegment`, `exportSegments`, **không** biết độ trễ), `lib/audioEngine.ts` (điều khiển `AudioContext` qua giao diện `AudioContextLike`, test bằng bản giả), `lib/playback.ts` chọn nguồn. API `Playback` giữ nguyên và thêm `setDuration`, `setLoop`, `audio`.
