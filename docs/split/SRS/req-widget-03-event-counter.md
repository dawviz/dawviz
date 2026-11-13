---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-03: Event Counter"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-03: Event Counter"
chunk: req-widget-03-event-counter.md
source_lines: 544-550
source_sha1: 0fd28ef586
ids: [REQ-WIDGET-02, REQ-WIDGET-03, WARN_PRESET_VALUE]
---
#### REQ-WIDGET-03: Event Counter
* "Event" là một Note-On; hợp âm 4 nốt cùng lúc tính 4 Events.
* Trường hiển thị (bật/tắt riêng): **Played Notes** (số nốt có `startTimeSeconds ≤ t`), **Total Notes** (nốt của các track đang hiển thị), **Progress** `P = Played / Total × 100%`, **Tempo hiện tại** (BPM).
* `Total = 0` thì hiển thị 0 và `0%`, không chia cho 0.
* **Mẫu nhãn tự sửa (bổ sung T-69):** thay cho nhãn cố định, người dùng viết **mẫu chữ** có chỗ giữ `{played}`, `{total}`, `{pct}` (kèm `%`), `{tempo}`; ví dụ `Num played notes: {played}/{total} ({pct})` ra `Num played notes: 1271/1917 (66.30%)`. Mỗi trường bật ở trên có một mẫu (một dòng); trường tắt thì dòng của nó không vẽ. **Số chữ số thập phân** của `{pct}` chỉnh được (0 đến 4, mặc định 2); `{played}`, `{total}` luôn là số nguyên. Chỗ giữ lạ được giữ nguyên chữ và kèm cảnh báo `WARN_PRESET_VALUE`, không ném lỗi. Mẫu chữ lưu trong Preset và là nguồn chữ của video (REQ-WIDGET-02); không dịch theo ngôn ngữ ứng dụng.
* **Tính trước:** `Played` lấy bằng tổng tích luỹ theo thời điểm bắt đầu và tìm nhị phân, `O(log n)` mỗi khung, không quét lại toàn bộ nốt.
