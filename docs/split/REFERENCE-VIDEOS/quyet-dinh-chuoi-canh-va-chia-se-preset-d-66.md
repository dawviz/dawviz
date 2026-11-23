---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Quyết định: chuỗi cảnh và chia sẻ preset (D-66)"
path: "Quyết định: chuỗi cảnh và chia sẻ preset (D-66)"
chunk: quyet-dinh-chuoi-canh-va-chia-se-preset-d-66.md
source_lines: 69-79
source_sha1: 70b5971deb
ids: [D-66]
---
## Quyết định: chuỗi cảnh và chia sẻ preset (D-66)

Video 2 và 4 đổi giao diện theo đoạn nhạc. Thay vì một preset khổng lồ tự chia thời gian, ta dùng **nhiều preset trọn vẹn + manifest thời gian của dự án**:

- **Manifest** là dạng lưu của chuỗi cảnh: danh sách `{preset, từ, đến, chuyển cảnh}` và một lớp chung luôn bật. Nó đi cùng dự án, không nằm trong preset. Preset không chứa mốc thời gian nào, nên dùng lại cho bài dài ngắn khác nhau.
- **Thời gian cục bộ**: trong một cảnh, `t_cảnh = t − từ`; keyframe và `time.progress` tính theo cảnh. Render Core vẫn tất định (chỉ thêm offset).
- **Không làm** mốc theo phần trăm bài, phase chia đều hay một preset dùng chung tự co giãn.
- **Chia sẻ**: A. bộ preset (`collection`, chọn từng preset hoặc một preset lẻ; không mốc thời gian, không tệp DAW) và C. dự án đầy đủ (DAW + manifest + preset đã dùng). Không có kiểu "bộ preset kèm kịch bản".
- **Trùng tên khi nhập**: hỏi người dùng ghi đè hoặc đổi tên (không tự quyết); chuỗi cảnh tham chiếu bằng id nội bộ.
- **Lưu ý khi làm**: id widget phải có không gian tên theo cảnh; mọi cảnh cùng tỉ lệ khung; chỉ vẽ cảnh đang hiện hoặc đang chuyển, Bản nhạc dựng sẵn cho từng cảnh; mỗi cảnh có nền riêng; preset chia sẻ không được chứa tên bài, tên track hay đường dẫn tệp.
