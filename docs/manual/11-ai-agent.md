# Dùng với AI agent

[Mục lục](README.md) · [English](en/11-ai-agent.md)

Bạn có thể nhờ một AI (Claude hoặc chatbot khác) dàn dựng video: AI viết **preset** (tệp mô tả lớp, lúc mỗi lớp xuất hiện, precomp, keyframe, phase), bạn hoặc AI đưa preset đó vào ứng dụng rồi xuất video. Tệp dự án và âm thanh của bạn vẫn chỉ nằm trong trình duyệt của bạn.

Hướng dẫn cho AI nằm ở skill `dawviz` trong repo (`plugins/dawviz/skills/dawviz/SKILL.md`). Trong Claude Code: `/plugin marketplace add dawviz/dawviz` rồi `/plugin install dawviz@dawviz`. Với AI khác, đưa cho nó tệp SKILL.md đó.

## Cách 1: chỉ trò chuyện

1. Kể cho AI về bài (độ dài, các đoạn và lúc bắt đầu, tên track) và video bạn muốn (dọc 9:16, ngang 16:9, vuông).
2. AI trả về một khối JSON. Ở thẻ **Xem trước**, cột **Phong cách video**, bấm **Dán preset**, dán khối đó vào ô, bấm **Thêm preset**.
3. Có cảnh báo dưới cột thì gửi lại cho AI để nó sửa. Xem lại ở thẻ **Chỉnh sửa** rồi **Xuất video**.

## Cách 2: AI điều khiển trình duyệt (ví dụ Claude in Chrome)

Mở ứng dụng bằng địa chỉ có thêm `?agent=1`: với bản công khai là `https://dawviz.github.io/dawviz/app/?agent=1` (bản chạy từ mã nguồn: `http://localhost:5173/?agent=1`). Một dải ở trên cùng báo rằng AI có thể điều khiển cửa sổ này. AI sẽ bấm nút như bạn, hoặc gọi thẳng ứng dụng; mọi thao tác đều hiện ra trước mắt bạn và hoàn tác được bằng Ctrl+Z. Bạn vẫn là người chọn tệp dự án trong hộp thoại **Mở tệp**.

Không có `?agent=1` thì ứng dụng không mở đường điều khiển nào cho AI.

## Cách 3: AI có terminal (ví dụ Claude Code)

AI chạy một script mở ứng dụng trong Chrome ẩn, nạp dự án và âm thanh, áp preset, chụp vài khung để tự kiểm tra rồi xuất video ra tệp. Cần Node 22 trở lên; xuất MP4 cần Google Chrome cài trên máy (không có thì ra WebM).

## Lưu ý

- Preset không chứa tệp nhạc, tên track hay đường dẫn tệp, nên chia sẻ được.
- AI chỉ dùng được những gì có trong preset: không tự thêm ảnh của bạn được (widget **Ảnh** cần bạn chọn tệp).
