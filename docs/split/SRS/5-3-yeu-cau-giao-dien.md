---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "5.3. Yêu cầu giao diện"
path: "5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG > 5.3. Yêu cầu giao diện"
chunk: 5-3-yeu-cau-giao-dien.md
source_lines: 831-844
source_sha1: 6c3a823de0
ids: [ARC-05, BR-07, BR-09, D-19, D-25, D-29, D-30, ERR_UNSUPPORTED_FORMAT, KPI-04, REQ-PARSER-05, REQ-PARSER-07, REQ-UI-01, REQ-UI-02, REQ-UI-03, REQ-UI-04, REQ-UI-05, REQ-UI-06, REQ-UI-07, REQ-UI-08, REQ-UI-09]
---
### 5.3. Yêu cầu giao diện

* **REQ-UI-01 (Nhập file, D-19):** màn hình nhập file hỗ trợ kéo thả và chọn file; liệt kê định dạng hỗ trợ; có hướng dẫn "FL Studio: xuất MIDI rồi nạp file `.mid`"; ghi chú Ableton chỉ đọc clip Arrangement. Nhận `.flp` hoặc `.bwproject` thì báo `ERR_UNSUPPORTED_FORMAT` với nội dung **"chưa hỗ trợ"** kèm hướng dẫn thay thế (xuất MIDI; xuất `.dawproject`), không dùng cách nói "không hỗ trợ". Phần mở rộng không khớp nội dung (kiểm tra magic bytes: Gzip `1F 8B`, ZIP `PK`, MIDI `MThd`, Live Pack `pl-a`, `<REAPER_PROJECT`, XML) thì báo lỗi rõ ràng.
* **REQ-UI-02 (Hoàn tác):** Undo/Redo 50 bước cho thao tác bố cục, thuộc tính widget, override hợp âm, đổi preset/tỉ lệ. Phím tắt `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`. Dữ liệu dẫn xuất (AST, cache) không nằm trong lịch sử (ARC-05).
* **REQ-UI-03 (Phát và Timeline):** Play/Pause, nhảy đầu/cuối, kéo Playhead, chọn Export Range bằng hai tay nắm, Loop Range. Làn hợp âm hiển thị trên Timeline; nhấp đúp để thêm override.
* **REQ-UI-04 (Thông báo lỗi):** mọi lỗi `ERR_*` hiển thị bằng ngôn ngữ đang chọn, nêu nguyên nhân và hành động tiếp theo; mã lỗi hiển thị nhỏ kèm theo để người dùng báo cáo.
* **REQ-UI-06 (Nhập tempo thủ công, D-29):** khối "Ghi đè BPM" cho thêm nhiều ô nhập, mỗi ô gồm **mốc** (timestamp) và **BPM**; mỗi dòng có thêm ô **dấu nhịp** (gợi ý 4/4, 3/4, 2/4, 5/4, 6/8, 7/8, 9/8, 12/8; để trống = giữ nhịp trước); chọn **cách nhập mốc** theo đúng kiểu đồng hồ DAW: thời gian (`giây` hoặc `m:ss.mmm`, mọi DAW đều có), `Bar.Beat.%` (Reaper, vd `1.1.00`) hoặc `Bar.Beat.Sixteenth` (Ableton/Bitwig/Cubase, vd `1.1.1`); Bar.Beat quy đổi theo dấu nhịp hiệu lực tại từng dòng (nhịp đầu lấy từ file); nút thêm/xoá từng mốc và xoá hết. Mốc đầu tiên tính từ 0; chỉ có một mốc ở 0 thì dùng như BPM cố định. Ô để trống thì dùng tempo của file. Khi `tempoSource` khác `file` thì hiển thị nổi bật và gợi ý nhập (REQ-PARSER-07). Kết quả áp dụng ngay vào AST và Timeline; lưu trong Project Pack.
* **REQ-UI-07 (Chọn `.als` trong `.alp`, D-25):** sau khi nạp `.alp`, giao diện liệt kê các `.als` bằng `listAlp` (tên, dung lượng, BPM, danh sách track kèm số nốt, track tắt tiếng, lỗi nếu file không có nốt) dưới dạng danh sách chọn một; chọn là phân tích lại ngay, không phải nhập số thứ tự. Mặc định chọn `.als` lớn nhất. File không dùng được thì vô hiệu hoá kèm lý do. Lựa chọn được lưu trong phiên.
* **REQ-UI-08 (Đầu vào bổ sung theo ngữ cảnh):** giao diện chỉ hiện ô nạp thêm khi file vừa chọn thật sự cần: (a) `.rpp` tham chiếu `.mid` ngoài → hiện ô nạp `.mid` kèm tên các file cần; (b) định dạng nhị phân chưa hỗ trợ trực tiếp (`.bwproject`, `.flp`, đuôi lạ) → hiện ô nạp schema JSON (REQ-PARSER-05). Không cần thì ẩn. Nếu người dùng chưa nạp file cần thiết, **phải** hiển thị thông báo nêu rõ thiếu gì và hậu quả (không có nốt/chưa phân tích được); tempo không đọc được từ file cũng phải được báo kèm gợi ý nhập BPM (REQ-UI-06). Thư viện cung cấp `probeProject`.
* **REQ-UI-09 (Chọn ngôn ngữ, BR-09, D-30):** bộ chọn ngôn ngữ luôn thấy được, liệt kê theo tên ngôn ngữ viết bằng chính ngôn ngữ đó (lấy từ `locales/index.json`). Mặc định: lựa chọn đã lưu, nếu chưa có thì ngôn ngữ trình duyệt khớp theo chuỗi `vi-VN → vi`, cuối cùng là tiếng Anh. Đổi ngôn ngữ có hiệu lực ngay (kể cả kết quả đang hiển thị) và cập nhật `lang`/`dir` của trang.
* **REQ-UI-05 (Người dùng mới, BR-07, KPI-04):** sau khi nạp file hợp lệ, hệ thống tự áp preset mặc định, gán track và hiển thị sẵn nút Export nổi bật; đường đi tối thiểu "nạp → (chọn đoạn) → Export" không cần mở Inspector.

---
