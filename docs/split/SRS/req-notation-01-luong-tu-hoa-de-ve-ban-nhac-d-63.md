---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-NOTATION-01: Lượng tử hoá để vẽ bản nhạc (D-63; đã làm 2026-11-21)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-NOTATION-01: Lượng tử hoá để vẽ bản nhạc (D-63; đã làm 2026-11-21)"
chunk: req-notation-01-luong-tu-hoa-de-ve-ban-nhac-d-63.md
source_lines: 682-690
source_sha1: 49d4aaf8cd
ids: [D-63, REQ-NOTATION-01, WARN_NOTATION_EMPTY, WARN_NOTATION_GLYPH, WARN_NOTATION_KEY_GUESS, WARN_NOTATION_OFFGRID]
---
#### REQ-NOTATION-01: Lượng tử hoá để vẽ bản nhạc (D-63; đã làm 2026-11-21)
* **Chỉ để vẽ.** Thời điểm sáng và vạch phát dùng giây thật của nốt; không ghi ngược vào AST.
* **Ô nhịp** theo dấu nhịp của `tempoMap` (đổi nhịp bắt đầu ô mới). **Lưới theo từng phách, từng khuông**: chọn trong 1, 2, 4, 8 phần (nhị phân, giới hạn bởi *nốt ngắn nhất* 8/16/32) và 3, 6, 12 phần (liên ba, khi bật) bằng điểm = sai số thời gian + phạt độ phức tạp × *ưu tiên nhịp đơn giản* (0,5–4) + phạt hai nốt cách xa bị ép thành hợp âm. Nốt sát cuối phách thuộc phách sau.
* **Đúng cấu trúc (bất biến, có test):** mọi giọng mọi ô có các sự kiện liền nhau và tổng độ dài bằng độ dài ô; mỗi sự kiện có giá trị viết khớp độ dài thật. Nốt qua vạch nhịp hoặc qua ranh phách liên ba được chia và nối bằng dấu nối; giá trị chấm; lặng lấp chỗ trống (giọng 2: lặng ẩn); ô trống là lặng cả ô (mọi nhịp).
* **Hợp âm và giọng:** nốt cùng điểm bắt đầu (sau lượng tử) gộp; độ dài khác nhau thì phần chứa nốt cao nhất ở giọng 1, phần còn lại ở giọng 2 (nếu trống); legato chồng ít thì cắt nốt trước; tối đa 1 hoặc 2 giọng mỗi khuông. **Hai tay:** nốt ≥ *điểm chia* (mặc định 60 = C4) lên khuông Sol.
* **Giọng:** AST không có hoá biểu; ước lượng Krumhansl–Schmuckler trên toàn bài (trọng số độ dài), có độ tin cậy; người dùng ghi đè (số dấu hoá, giọng thứ). Cách viết dấu hoá theo giọng (nốt trong âm giai theo hoá biểu; bậc 7 nâng của giọng thứ viết bằng chữ cái dưới chủ âm, kể cả thăng kép).
* **Cảnh báo** (dịch theo mã, hiện ở mục Thiết lập của widget): `WARN_NOTATION_EMPTY` (không có nốt), `WARN_NOTATION_OFFGRID` (dưới 30% nốt đúng lưới, từ 50 nốt: có lẽ chơi tự do, `details.onGridPct`), `WARN_NOTATION_KEY_GUESS` (độ tin cậy < 0,05), `WARN_NOTATION_GLYPH` (thiếu glyph trong bảng phông; test bảo đảm không xảy ra với các tính năng hiện có).
* Hàm thuần, tất định (không phụ thuộc thứ tự nốt), ở `packages/render-core/src/notation/quantize.ts`; test `node --test`.
