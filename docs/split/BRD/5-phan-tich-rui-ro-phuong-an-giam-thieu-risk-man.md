---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "5. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU (RISK MANAGEMENT)"
path: "5. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU (RISK MANAGEMENT)"
chunk: 5-phan-tich-rui-ro-phuong-an-giam-thieu-risk-man.md
source_lines: 167-187
source_sha1: 3e8360d118
ids: [D-01, D-12, D-24, D-25, D-29, KPI-02, REQ-CAP-01, REQ-EXPORT-00, REQ-EXPORT-03, REQ-EXPORT-06, REQ-PARSER-00]
---
## 5. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU (RISK MANAGEMENT)

| STT | Rủi ro | Mức độ | Phương án giảm thiểu |
| :--- | :--- | :--- | :--- |
| **R-01** | Trình duyệt máy yếu bị tràn bộ nhớ (OOM) khi render 4K | Cao | Backpressure qua `encodeQueueSize`; giải phóng `VideoFrame` ngay sau khi encode; ghi MP4 theo luồng ra đĩa khi trình duyệt hỗ trợ; kiểm tra và cảnh báo trước khi render (SRS REQ-EXPORT-00). |
| **R-02** | Nhận diện sai hợp âm phức tạp (jazz, nốt nghịch) | Trung bình | Manual Chord Override; hai chế độ quét (Sustained/Strike); chọn track nguồn hợp âm. |
| **R-03** | Nhà sản xuất DAW đổi cấu trúc file ở bản mới | Trung bình | Tách parser thành tầng AST trung gian; hỗ trợ Declarative JSON Schema; ghi `sourceApp`/phiên bản trong AST; có bộ file mẫu hồi quy. |
| **R-04** | *(Hạ cấp xuống Giả định thiết kế A-01)* MP4 không có audio có thể gặp vấn đề tương thích ở một số nền tảng/phần mềm dựng | Thấp **[chưa kiểm chứng]** | v0.1 coi đây là rủi ro cao nhưng chưa có lỗi thực tế nào được ghi nhận. v0.2 giữ track Silent AAC ở dạng công tắc `export.silentAudioFallback` (mặc định bật). **v0.3:** Spike 1 ghi nhận lỗi encoder khi bật Silent AAC trên máy tính, trong khi MP4 video-only không gây lỗi ở các phần mềm kiểm thử; công tắc đổi thành mặc định TẮT (D-01 sửa). |
| **R-05** | Mã độc qua parser tùy chỉnh hoặc Project Pack | Nghiêm ngặt | Không `eval`/`new Function`; chỉ chấp nhận JSON khai báo, kiểm tra schema bằng bộ kiểm tra không sinh code động; giới hạn kích thước, độ sâu, tỉ lệ giải nén; CSP không có `unsafe-eval`. |
| **R-06** | Khả năng mã hóa video/audio khác nhau giữa trình duyệt và hệ điều hành (ví dụ có báo cáo Chromium trên Linux không mã hóa được AAC) | Cao | Phát hiện tính năng (feature detection) khi khởi động và trước khi xuất; chuỗi dự phòng codec; thông báo rõ nguyên nhân khi không xuất được (SRS REQ-CAP-01, REQ-EXPORT-06). |
| **R-07** | Thư viện phụ thuộc bị ngừng bảo trì (ví dụ `mp4-muxer` đã deprecated) | Trung bình | Chọn thư viện đang được bảo trì (Mediabunny); bọc sau lớp trừu tượng `MuxerAdapter` để thay được; rà soát phụ thuộc mỗi bản phát hành. |
| **R-08** | Lệch A/V do độ trễ khởi tạo của bộ mã hóa AAC (priming) | Trung bình | Bài kiểm thử đồng bộ tự động; bù trừ timestamp audio (SRS REQ-EXPORT-03); đo bằng KPI-02. |
| **R-09** | File đầu vào quá lớn hoặc cố tình nén bom làm treo trình duyệt | Trung bình | Parse trong Web Worker; giới hạn kích thước giải nén và tỉ lệ nén; hủy Worker khi quá thời gian (SRS REQ-PARSER-00). |
| **R-10** | Chi tiết cấu trúc file DAW trong tài liệu chưa được kiểm chứng bằng file mẫu thật | Trung bình | Mọi đường dẫn XML/JSON trong SRS gắn nhãn **[VERIFY]** và phải được đối chiếu bằng file mẫu trước khi coi parser là hoàn tất. **Cập nhật v0.3:** đã kiểm bằng file thật cho `.als` (Live 9.1, 12.4), `.alp` (Live 9.1), `.rpp` (Reaper 7.85), ví dụ chính thức của `.dawproject`; còn [VERIFY] cho `.dawproject` xuất thật, envelope tempo cong của Reaper và đối chứng độc lập cho IGNTEMPO=1 (đã có dự án thật; HASDATA ≠ QN không cần mẫu: guard clause) (`.mid` ngoài đã kiểm bằng mẫu thật), nhịp ≠ 4/4 của Ableton. Một giả định của v0.2 đã sai và được sửa: `.alp` không phải ZIP. |
| **R-11** | Lệch A/V lớn trên thiết bị di động tầm trung (Spike 1: −42,67 ms trên Snapdragon 685) | Trung bình | Phạm vi chỉ desktop (D-12); KPI-02 chỉ cam kết desktop; ghi chú trong tài liệu và cảnh báo khi phát hiện thiết bị di động; có thể bù offset audio sau khi có thêm số đo. |
| **R-12** | Người dùng thiếu thông tin tempo (file không có tempo, hoặc đổi tempo mà parser chưa đọc được) dẫn tới thời gian sai | Trung bình | Không đoán ngầm: AST mang cờ `tempoSource` (`file`/`midi-default`/`fallback`/`user`), `fallback` luôn kèm cảnh báo; giao diện cho nhập nhiều mốc BPM theo giây hoặc beat (D-24, D-29). |
| **R-13** | Gói `.alp` chứa nhiều `.als`, hoặc `.als` chỉ có clip ở Session View nên không có nốt | Thấp | Liệt kê các `.als` kèm track/nốt/BPM để người dùng chọn; thông báo rõ khi chỉ có clip Session (D-25). |
| **R-14** | Bản dịch cộng đồng sai nghĩa, lệch chuỗi gốc hoặc bị bỏ rơi khi giao diện đổi | Trung bình | Danh mục JSON có kiểm tự động (khoá, tham số, số nhiều); `status: partial` cho phép thiếu và dùng chuỗi tiếng Anh; người bảo trì duyệt pull request; chuỗi mới luôn bắt đầu từ `en` rồi `vi`; ghi tên người dịch trong `@meta` |

---
