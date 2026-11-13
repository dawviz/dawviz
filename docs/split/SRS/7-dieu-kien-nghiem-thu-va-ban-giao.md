---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "7. ĐIỀU KIỆN NGHIỆM THU VÀ BÀN GIAO"
path: "7. ĐIỀU KIỆN NGHIỆM THU VÀ BÀN GIAO"
chunk: 7-dieu-kien-nghiem-thu-va-ban-giao.md
source_lines: 1041-1075
source_sha1: 0fd28ef586
ids: [ARC-01, AT-01, AT-02, AT-03, AT-04, AT-05, AT-06, AT-07, AT-08, AT-09, AT-10, AT-11, AT-12, AT-13, AT-14, AT-15, AT-16, AT-17, AT-18, AT-19, AT-20, AT-21, AT-22, AT-23, AT-24, AT-25, AT-26, BR-01, BR-02, BR-05, BR-08, BR-09, D-11, D-25, D-29, KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, KPI-08, NFR-COMP-02, NFR-PERF-03, OI-01, OI-02, P-01, P-13, REQ-GRAPHICS-05, REQ-GRAPHICS-06, REQ-UI-08]
---
## 7. ĐIỀU KIỆN NGHIỆM THU VÀ BÀN GIAO

Phiên bản đạt nghiệm thu khi vượt qua toàn bộ các kiểm thử sau (các giá trị **[PROVISIONAL]** được chốt lại sau OI-02):

| Mã | Kiểm thử | Tiêu chí đạt | Liên quan |
| :--- | :--- | :--- | :--- |
| **AT-01** | Phân tích tệp | Bộ mẫu ≥ 20 file mỗi định dạng (Ableton 10/11/12 gồm `.als` và `.alp`, Reaper 6/7, `.dawproject` từ Bitwig/Studio One, MIDI): ≥ 98% file "thành công"; mọi nốt đúng pitch, sai số ≤ 1 tick so với MIDI tham chiếu từ DAW gốc. | KPI-01, OI-01 |
| **AT-02** | Canvas và snapping | Kéo thả mượt; đường gióng hiện đúng khi khoảng cách ≤ 5 pt; đổi tỉ lệ 16:9, 9:16, 1:1 không làm sai lệch tỉ lệ tương đối giữa các thành phần. | BR-02 |
| **AT-03** | Đồng bộ A/V | Clip kiểm thử (click âm thanh + khung chớp tại mốc nhịp) có lệch ≤ ±2 ms ở cả đầu và cuối video, đo bằng phần mềm phân tích tín hiệu; chạy cho trường hợp có audio và, nếu công tắc Silent Audio bật, cả trường hợp Silent Audio; chỉ áp dụng cho desktop. | KPI-02 |
| **AT-04** | Tương thích xuất | MP4 Tier 1 (có audio và video-only) tải lên được và phát tốt trên YouTube, TikTok; mở trực tiếp được trên Premiere Pro, DaVinci Resolve (và các mục khác của ma trận NFR-COMP-02) mà không cần transcode. | KPI-03 |
| **AT-05** | WYSIWYG | So khung Preview với khung Export **trước khi mã hoá** (ảnh trên `OffscreenCanvas`, không phải ảnh giải mã từ video), ở 720p, 1080p, 4K và ít nhất một kích thước tuỳ ý: đạt ngưỡng *khác đường vẽ* của REQ-GRAPHICS-05. | ARC-01 |
| **AT-06** | Hiệu năng xuất | RM-1: 1080p60 H.264 phần cứng ≥ 1.2× thời gian thực; 4K RAM ≤ 2 GB; không rò rỉ sau 3 lần xuất liên tiếp. | KPI-07, NFR-PERF-03/04 |
| **AT-07** | Thời gian làm video | Người thử mới: từ mở trang đến bấm Export ≤ 60 giây; từ file DAW đến MP4 đoạn ≤ 60 s ở 1080p ≤ 3 phút. | KPI-04, KPI-05 |
| **AT-08** | Hợp âm | ≥ 90% hợp âm 3–4 âm đúng trên bộ ≥ 50 đoạn có đáp án; Override hoạt động và được lưu vào Project Pack. | KPI-06 |
| **AT-09** | Bảo mật đầu vào | Zip-bomb, ZIP có đường dẫn `..`, JSON parser chứa hàm/regex nguy hiểm, XML lồng quá sâu: bị từ chối với đúng mã lỗi, tab không treo. | BR-08, R-05, R-09 |
| **AT-10** | Dự phòng codec | Giả lập thiếu AAC, thiếu H.264, thiếu cả hai: ứng dụng rơi đúng bậc Tier 2/3/4, thông báo đúng. | R-06 |
| **AT-11** | Lưu và phục hồi | Tải lại trang khôi phục đầy đủ phiên; giả lập thiếu quota thì vào chế độ suy thoái và báo rõ file cần nạp lại. | BR-05, D-11 |
| **AT-12** | Thư viện parser | `npm run test:parser` đạt (hiện 66 test: Ableton thật + đối chứng độc lập, `.alp` thật dạng `pl-a`, Reaper thật, dawproject mẫu chính thức, MIDI, binary schema, an toàn đầu vào, bundle); `docs/TDD.md` cập nhật. | BR-01, BR-08 |
| **AT-13** | Tempo thủ công | Nhập 2 mốc (ví dụ 0 s: 100 BPM, 10 s: 200 BPM); nhập theo `Bar.Beat.%`/`Bar.Beat.Sixteenth` và đổi nhịp 4/4 → 3/4 → 12/8 cho beat đúng (4/4 hai ô nhịp = 8 beat rồi 3/4 hai ô nhịp = 6 beat): `tempoSource = user`, tick và giây của nốt đúng theo mốc; file thiếu tempo hiện cảnh báo và mời nhập; BPM ngoài 10–1000 bị từ chối. | R-12, D-29 |
| **AT-14** | Chọn `.als` trong `.alp` | Nạp gói nhiều `.als`: danh sách hiện đúng tên/track/BPM; chọn file khác thì AST đổi theo; file không có nốt bị vô hiệu hoá kèm lý do. | D-25 |
| **AT-15** | Đầu vào theo ngữ cảnh | `.rpp` nhúng MIDI: không hiện ô `.mid`; `.rpp` tham chiếu `.mid` ngoài: hiện ô kèm tên file, chưa nạp thì có cảnh báo, nạp rồi thì ra đủ nốt; `.bwproject`: hiện ô schema và cảnh báo "chưa hỗ trợ". | REQ-UI-08 |
| **AT-16** | Đa ngôn ngữ | Đổi giữa Tiếng Việt và Tiếng Anh: mọi chuỗi, lỗi/cảnh báo, kết quả đang hiển thị đổi ngay; thêm ngôn ngữ thử (chỉ file JSON + một dòng danh sách) xuất hiện trong bộ chọn; chuỗi thiếu rơi về tiếng Anh; `npm run i18n:check` bắt đúng khoá thiếu/thừa, tham số sai, nhánh số nhiều sai; video xuất ra hiển thị đúng chữ Việt có dấu. | KPI-08, BR-09 |
| **AT-17** | Độ sáng theo automation | Nạp `BigProject4b.rpp`: track có envelope volume thấy độ sáng đổi theo đường cong (−26,4 dB tối nhất, 0 dB sáng nhất); đổi nguồn sang `tắt` thì độ sáng cố định; Preview và Export cùng giá trị tại cùng `t`. | REQ-GRAPHICS-06 |
| **AT-18** | Mốc M1 | Mở lần lượt `Demo.als`, `BigProject4b.rpp`, `.dawproject`, `.mid`, `.alp`: có Piano Roll, thanh phát/tua, danh sách track; lỗi/cảnh báo hiện bằng ngôn ngữ đang chọn; đổi ngôn ngữ cập nhật ngay; kéo `t` đến cùng giá trị cho cùng khung hình (tất định). | REQ-GRAPHICS-05, 06; REQ-I18N |
| **AT-19** | Tất định của tùy biến (1.0) | Với một cảnh có template nốt, hạt, biểu thức: ảnh khung ở `t` khi tua thẳng tới `t` trùng với khi phát liên tục tới `t`; ảnh Preview trùng ảnh Export (sai khác điểm ảnh trong ngưỡng TDD). |
| **AT-20** | Easing và Graph Editor (1.0) | Mọi easing có `f(0)=0`, `f(1)=1`; đổi tay cầm trên speed graph thấy chuyển động đổi ngay khi xem trước; lưu và nạp preset `easing` cho cùng đường cong. |
| **AT-21** | An toàn biểu thức (1.0) | Bộ mẫu tấn công (EXPRESSIONS §4) đều bị từ chối hoặc ra giá trị dự phòng; fuzz 100.000 biểu thức không treo, không lỗi ngoài `ExprError`; trang chạy đủ chức năng với CSP bật. |
| **AT-22** | Tài nguyên và preset (1.0) | Nạp cùng ảnh hai lần chỉ lưu một bản; Project Pack mở trên trình duyệt khác đủ tài nguyên; preset sai schema hoặc vượt giới hạn bị từ chối kèm mã lỗi. |
| **AT-23** | Widget bổ sung (1.0) | P-01…P-13 hiển thị đúng với tệp mẫu (marker và lời với tệp có dữ liệu tương ứng); đổi cách ghi tên nốt áp cho mọi widget. |
| **AT-25** | Bố cục track và nhập giá trị (1.0) | Đổi Dọc/Ngang/Lưới và Gọn/Đầy đủ với dự án 15+ track: không phần tử tràn khỏi thẻ ở bề rộng 1440/1100/800 px, phím mũi tên đi đúng hướng; mọi thuộc tính có tay nắm kéo đều có ô nhập; gõ `1920/2`, `+=10`, `0,5`, `50%` cho kết quả đúng; chuỗi sai giữ giá trị cũ; giá trị ngoài giới hạn cứng bị kẹp và trùng với giá trị Render Core vẽ. |
| **AT-26** | Phát sáng động và bố cục track (1.0) | Mặc định mọi nốt sáng như nhau và độ sáng nền "đều nhau". Bật "Động khi chạm": theo velocity thì nốt velocity 127 sáng hơn rõ nốt velocity 30; theo fade thì sáng nhất lúc chạm rồi tắt dần; theo automation âm lượng (`BigProject4b.rpp`) thì đổi theo envelope; track không có lane sáng đều. Dự án 15 track: Lưới tự động không tràn ở 1440/1100/800 px; chọn 8 cột ở 1280 px thì báo chỉ vừa 4; đổi số cột và đổi Lưới ↔ Danh sách thấy thẻ di chuyển mượt; Danh sách mở dòng bằng Enter; tải lại trang giữ lựa chọn. |
| **AT-24** | Stem theo track (1.2) | Nạp tệp mix + 4 stem xuất từ Reaper và Ableton (cùng điểm đầu): tự ghép đúng tên track; spectrum của từng track khớp âm thanh của track đó; stem lệch độ dài có cảnh báo; mở lại dự án từ Project Pack không cần stem mà widget vẫn vẽ được. |

---
