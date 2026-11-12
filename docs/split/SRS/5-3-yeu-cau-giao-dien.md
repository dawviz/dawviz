---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "5.3. Yêu cầu giao diện"
path: "5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG > 5.3. Yêu cầu giao diện"
chunk: 5-3-yeu-cau-giao-dien.md
source_lines: 898-945
source_sha1: 1654c314a5
ids: [ARC-05, BR-07, BR-09, D-19, D-25, D-29, D-30, D-48, ERR_UNSUPPORTED_FORMAT, KPI-04, REQ-EXPORT-00, REQ-GRAPHICS-06, REQ-GRAPHICS-07, REQ-GRAPHICS-09, REQ-GRAPHICS-10, REQ-GRAPHICS-11, REQ-GRAPHICS-14, REQ-GRAPHICS-15, REQ-GRAPHICS-16, REQ-PARSER-05, REQ-PARSER-07, REQ-STORAGE-05, REQ-STORAGE-06, REQ-UI-01, REQ-UI-02, REQ-UI-03, REQ-UI-04, REQ-UI-05, REQ-UI-06, REQ-UI-07, REQ-UI-08, REQ-UI-09, REQ-UI-10, REQ-UI-11, REQ-UI-12, REQ-UI-13, REQ-WIDGET-07]
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
* **REQ-UI-10 (Theme sáng/tối cho giao diện, 1.0):** ba lựa chọn **Sáng**, **Tối** (mặc định hiện nay) và **Theo hệ thống** (`prefers-color-scheme`); lưu theo trình duyệt; đổi tức thì không tải lại trang. Theme chỉ đổi **giao diện ứng dụng**; màu khung hình video do cảnh và preset quyết định, không bị ảnh hưởng. Cả hai theme đạt tương phản WCAG AA cho chữ và điều khiển. Bảng màu theme khai báo bằng biến CSS để cộng đồng thêm theme giao diện về sau (1.1).
* **REQ-UI-11 (Bộ chọn màu và bảng màu, 1.0):**
  * Mọi ô chọn màu (màu track, nốt, nền, phím, chữ, gradient) dùng chung một bộ chọn: ô vuông màu + thanh hue + thanh alpha, và **ô nhập văn bản** nhận các dạng `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(255 0 0)` / `rgb(255, 0, 0)`, `rgba(…)`, số thập phân `255, 0, 0` hoặc `1.0, 0, 0`, `hsl(…)` / `hsla(…)`, **HSV/HSB** (`hsv(0 100% 100%)`), `oklch(…)`, và tên màu CSS. Có công tắc đổi cách hiển thị giữa HEX / RGB / HSL / HSV.
  * **Alpha (RGBA):** màu lưu dạng `#rrggbbaa`; alpha nhân với độ đục của đối tượng (REQ-GRAPHICS-07).
  * **Hút màu từ màn hình** bằng EyeDropper API khi trình duyệt hỗ trợ (Chromium); màu dùng gần đây (12 ô); sao chép màu ở định dạng đang chọn.
  * **Bảng màu (palette):** tạo, đặt tên, lưu thành preset (REQ-STORAGE-06). **Nhập bảng màu** bằng cách dán danh sách mã (cách nhau bởi dấu phẩy, khoảng trắng hoặc xuống dòng, có hoặc không có `#`), tệp GIMP `.gpl`, JSON (mảng mã màu) hoặc biến CSS (`--x: #…`); 1.1 thêm Adobe `.ase` và đường dẫn bảng màu Coolors. **Áp bảng màu cho các track**: tự gán lần lượt theo thứ tự track, hoặc kéo thả từng ô màu vào track.
* **REQ-UI-12 (Hiện/ẩn và solo track, 1.0):** mỗi track có nút **mắt** (hiện/ẩn) và nút **solo** (chỉ hiện track này, bấm Alt/Option khi solo để cộng thêm). Track tắt tiếng trong DAW mặc định ẩn nhưng có thể bật hiện (thay cho cờ `showMuted`). Ẩn/hiện áp cho mọi widget dùng track đó, lưu trong phiên và preset, hoàn tác được (REQ-UI-02). Có "Hiện tất cả" / "Ẩn tất cả".
* **REQ-UI-13 (Chế độ Cơ bản và Nâng cao, D-48, 1.0):**
  * **Lần đầu mở ứng dụng** hiện hộp chọn "Tôi mới dùng" (vào **Cơ bản**) / "Tôi đã quen phần mềm dựng hình" (vào **Nâng cao**); lựa chọn được nhớ theo trình duyệt và đổi lại được bất cứ lúc nào bằng công tắc ở thanh trên cùng hoặc trong Cài đặt.
  * **Cùng một dữ liệu:** hai chế độ chỉ khác **cái được hiện**, không khác dự án. Đổi chế độ không làm mất hay đổi thiết lập nào; hoàn tác (REQ-UI-02) đi xuyên qua cả hai.
  * **Mở từng bảng:** ở Cơ bản, mỗi bảng có nút **"Thêm tuỳ chọn"** để mở phần nâng cao của riêng bảng đó, không cần chuyển cả giao diện; trạng thái mở được nhớ theo bảng.
  * **Dấu hiệu đã chỉnh nâng cao:** thuộc tính đang dùng giá trị nâng cao (ví dụ keyframe, biểu thức, góc tự do) hiện huy hiệu "Đã chỉnh nâng cao" ở Cơ bản, kèm nút "Đặt lại về đơn giản"; preset và theme dùng tính năng nâng cao vẫn áp và chạy đúng ở Cơ bản.
  * **Tìm thiết lập:** ô tìm kiếm tìm cả thiết lập nâng cao; ở Cơ bản, chọn kết quả nâng cao sẽ mở đúng bảng đó.
  * **Phân bổ tính năng** (mỗi dòng: Cơ bản thấy gì / Nâng cao thêm gì):

| Khu vực | Cơ bản | Nâng cao thêm |
| :--- | :--- | :--- |
| Nạp tệp | Kéo thả; chọn `.als` trong `.alp`; nạp `.mid` ngoài khi được hỏi (REQ-UI-07, 08) | Nạp schema nhị phân; xem cấu trúc tệp (inventory); hiện track tắt tiếng |
| Tempo | Một ô BPM và dấu nhịp, hiện nổi bật khi tệp thiếu tempo | Nhiều mốc tempo, nhập theo `bar.beat`/giây, dấu nhịp theo mốc (REQ-UI-06) |
| Track | Màu, ẩn/hiện, solo, dán bảng màu (REQ-UI-11, 12) | Nguồn độ sáng, đảo chiều, ngưỡng dB (REQ-GRAPHICS-06); kiểu nốt riêng từng track; gán stem (1.2) |
| Kiểu nốt | Theme/preset; chế độ màu; độ dày; bo góc; phát sáng bật/tắt và mức | Độ đục khi chờ, bán kính phát sáng, viền, chỉ sáng khi phát, gradient, biểu thức |
| Hướng và chuyển cảnh nốt | 4 hướng; chọn template nốt (rơi, nảy, phóng…); tốc độ cuộn | Góc tự do; chỉnh từng pha `enter/hit/sustain/exit`, easing, morph (REQ-GRAPHICS-10) |
| Thanh phát | Hiện/ẩn, màu, độ dày, kiểu nét dựng sẵn, vị trí | Dải và gradient, mũi tên, phát sáng, phản ứng khi chạm, độ dài; 1.1: sprite, keyframe (REQ-GRAPHICS-16) |
| Bàn phím | Hiện/ẩn; tên nốt bật/tắt và cách ghi tên; số phím tự động | Phạm vi tuỳ chọn, hình dạng phím, màu phím nhấn, độ lún, thang âm, quy ước C3/C4, phông (REQ-GRAPHICS-07) |
| Widget và bố cục | Thêm/xoá/kéo thả widget; preset bố cục; chọn track cho widget | Khoảng hiển thị theo thời gian/marker; đổi track theo đoạn (REQ-GRAPHICS-14); tham số chi tiết từng widget |
| Spectrum/waveform | Chọn kiểu; màu; số cột | Dải tần, thang tần số, làm mượt, đỉnh rơi, gradient; 1.1 dạng tròn (REQ-WIDGET-07) |
| Hạt | Chọn preset hạt, bật/tắt, mật độ | Mọi tham số nguồn phát, lực, tuổi thọ, hình hạt (REQ-GRAPHICS-11) |
| Hiệu ứng và storyboard | Áp preset hiệu ứng/theme bằng một lần bấm | Keyframe, Graph Editor, timeline, binding, biểu thức, text animator chi tiết (REQ-GRAPHICS-09, 12, 13) |
| 3D (1.1) | Preset góc nhìn (nghiêng chéo, isometric, đường băng) và mức nghiêng | Xoay X/Y/Z từng lớp, camera, độ sâu, nền trong không gian 3D (REQ-GRAPHICS-15) |
| Nền và tài nguyên | Màu/ảnh nền, logo, phông | Sprite sheet, quản lý tài nguyên, giới hạn và dung lượng (REQ-STORAGE-05) |
| Xuất | Preset nền tảng (YouTube 16:9, Shorts/TikTok/Reels 9:16, Instagram 4:5 và 1:1); chất lượng Thấp/Vừa/Cao; 30/60 fps; kích thước tuỳ chỉnh rộng × cao; đoạn xuất | Codec, bitrate, fast-start, nền trong suốt, chuỗi PNG, chọn lớp/tách lớp, Silent AAC, offset audio (REQ-EXPORT-00…08) |
| Preset và cộng đồng | Cài/áp preset, chia sẻ (bắt buộc chọn giấy phép) | Sửa từng phần của preset, xem dữ liệu thô, quản lý phiên bản |
| Giao diện | Theme sáng/tối, ngôn ngữ, chế độ | Như Cơ bản |


---
