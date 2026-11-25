---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-19: Ô chữ người dùng thêm và chỗ giữ dùng chung (D-60; đã làm 2026-11-18, T-73)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-19: Ô chữ người dùng thêm và chỗ giữ dùng chung (D-60; đã làm 2026-11-18, T-73)"
chunk: req-graphics-19-o-chu-nguoi-dung-them-va-cho-giu.md
source_lines: 555-563
source_sha1: fee32c2554
ids: [D-60, OI-18, P-04, REQ-GRAPHICS-01, REQ-GRAPHICS-05, REQ-GRAPHICS-12, REQ-GRAPHICS-13, REQ-GRAPHICS-18, REQ-GRAPHICS-19, REQ-UI-13, REQ-WIDGET-03]
---
#### REQ-GRAPHICS-19: Ô chữ người dùng thêm và chỗ giữ dùng chung (D-60; đã làm 2026-11-18, T-73)
* **Ô chữ (widget `TEXT`):** người dùng thêm được vào khung, nhập chữ nhiều dòng tuỳ ý; kiểu chữ theo REQ-GRAPHICS-18; vị trí, cỡ, xoay, lớp như mọi widget (REQ-GRAPHICS-01…03); chọn track riêng (`trackMappingMode` ALL/MANUAL, ô **Track** ở Thiết lập; Cơ bản với ô chữ, Nâng cao với bộ đếm, nốt đang phát, hợp âm) hoặc dùng các track đang hiện, cho `{played}`, `{total}`, `{notes}`…. Đây là phần tử Text của storyboard (REQ-GRAPHICS-12) làm sớm trong mô hình "canvas + widgets"; khi có storyboard (T-22) thì di trú sang phần tử Text.
* **Bộ chỗ giữ chung (tên cuối cùng, như đã làm):** `time`, `elapsed`, `remaining`, `total_time`, `bpm`, `bar`, `beat`, `sig`, `title`, `artist`, `chord`, `notes`, `played`, `total`, `pct`; `{tempo}` là tên cũ của `{bpm}` (cùng giá trị; còn đọc được, không gợi ý). `{key}` chờ nhận diện giọng (T-38); `{file}` không làm (tên tệp có thể nhạy cảm, không đưa vào Render Core). Danh sách duy nhất, dùng được ở **mọi** chữ trong video (ô chữ, mẫu chữ của các widget có sẵn), không gắn cứng với từng widget như mẫu chữ T-69 (REQ-WIDGET-03…). Dự kiến: thời gian (`{time}`, `{elapsed}`, `{remaining}`, `{total_time}`), nhạc (`{bpm}`, `{bar}`, `{beat}`, `{sig}`, `{chord}`, `{key}` khi có P-04), bài (`{title}`, `{artist}`, `{file}`), số đếm (`{played}`, `{total}`, `{pct}`). Tên cũ là tên khác (`{tempo}` = `{bpm}`); chỗ giữ lạ giữ nguyên chữ và cảnh báo như hiện nay; `{{` ra dấu `{`.
* **Cơ bản / Nâng cao (REQ-UI-13):** Cơ bản giữ các ô hiện có của từng widget; Nâng cao mở ô mẫu chữ, có gợi ý tên chỗ giữ khi gõ `{`.
* **Không lẫn với biểu thức:** chỗ giữ chỉ thay chữ, không tính toán; biểu thức (REQ-GRAPHICS-13, tiền tố `=`) vẫn dành cho thuộc tính số/màu.
* **Tất định:** giá trị chỗ giữ là hàm của `t` và dữ liệu tính trước (REQ-GRAPHICS-05); chữ số đều bề rộng mặc định cho chỗ giữ là số.
* **Lược đồ:** thêm loại widget làm preset lên 0.6.0; giới hạn độ dài chữ của ô chữ lớn hơn 200 ký tự của mẫu chữ hiện nay.
* **Đã chốt (OI-18, 2026-11-18):** (a) Nâng cao mở ô mẫu chữ cho mọi dòng chữ của widget có sẵn, Cơ bản giữ nguyên. (b) Định dạng `{tên:định_dạng}` (tách ở dấu `:` đầu tiên): số `{bpm:0.0}`, đệm `{bar:000}`, thời gian `{time:m:ss}`/`{time:m:ss.SSS}`; sai định dạng thì giữ nguyên chữ và cảnh báo. Mặc định khi không nhập: `{bpm}` tối đa 2 chữ số thập phân (bỏ số 0 thừa), `{pct}` số nguyên, mọi chỗ giữ thời gian `m:ss`, `{bar}`/`{beat}`/`{played}`/`{total}` số nguyên không đệm, chữ nguyên văn cho `{title}`, `{artist}`, `{chord}`. (c) Chỗ giữ theo nốt trong ô chữ chỉ có `{notes}`: mọi nốt đang vang của các track đã chọn, xếp thấp → cao, cách nhau bằng khoảng trắng (đổi bằng `{notes:, }`), rỗng khi không có nốt. Không có `{name}`/`{velocity}` trong ô chữ; hai tên này chỉ dùng ở mẫu Live Note Trigger.
