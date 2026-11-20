---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-NOTATION-01: Lượng tử hoá để vẽ bản nhạc **[ĐỀ XUẤT, D-63]**"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-NOTATION-01: Lượng tử hoá để vẽ bản nhạc **[ĐỀ XUẤT, D-63]**"
chunk: req-notation-01-luong-tu-hoa-de-ve-ban-nhac-de-x.md
source_lines: 680-687
source_sha1: 6d45847731
ids: [D-63, REQ-NOTATION-01, WARN_NOTATION_KEY_GUESS]
---
#### REQ-NOTATION-01: Lượng tử hoá để vẽ bản nhạc **[ĐỀ XUẤT, D-63]**
* **Chỉ để vẽ.** Thời điểm sáng và vạch phát dùng `startTick` thật; vị trí x nội suy tuyến tính đơn điệu giữa các sự kiện đã lượng tử hoá. Không ghi ngược vào AST.
* **Lưới theo từng ô nhịp:** chọn trong 1/8, 1/16, 1/32, tam liên (tuỳ chọn ngũ liên) bằng điểm = sai số thời gian + phạt độ phức tạp; người dùng ép một độ chính xác hoặc để *Tự động*.
* **Bắt buộc đúng cấu trúc:** mọi giọng trong mọi ô có tổng giá trị nốt bằng đúng độ dài ô (nốt dài qua vạch nhịp được chia và nối bằng dấu nối); lấp nốt lặng; giá trị chấm; nối chùm theo phách theo dấu nhịp; nốt chồng trong cùng giọng thì cắt ở nốt kế hoặc đưa sang giọng khác.
* **Hợp âm:** gộp nốt bắt đầu trong ngưỡng (ms) chỉnh được. **Hai tay:** theo cao độ (mặc định quanh C4, chỉnh được), theo track, hoặc người dùng gán.
* **Giọng:** AST chưa có key signature; ước lượng bằng Krumhansl–Schmuckler theo cửa sổ, ghi vào dữ liệu dẫn xuất (không vào AST), có độ tin cậy; người dùng ghi đè; cách viết dấu hoá theo giọng. Độ tin cậy thấp thì báo `WARN_NOTATION_KEY_GUESS`.
* Hàm thuần, kết quả tất định, có test (`node --test`), ngoài `packages/render-core`.
