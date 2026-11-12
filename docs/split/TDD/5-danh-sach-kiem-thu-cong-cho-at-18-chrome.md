---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "5. Danh sách kiểm thủ công cho AT-18 (Chrome)"
path: "5. Danh sách kiểm thủ công cho AT-18 (Chrome)"
chunk: 5-danh-sach-kiem-thu-cong-cho-at-18-chrome.md
source_lines: 62-69
source_sha1: 21a6598042
ids: [AT-18, WARN_RPP_EXTERNAL_MIDI]
---
## 5. Danh sách kiểm thủ công cho AT-18 (Chrome)
1. `npm install && npm run dev`, mở trang; không có lỗi trong console.
2. Thả lần lượt `BigProject4b.rpp`, `Demo.als` và `Oboe_MIDI_001.mid` (hai tệp sau để trong `test/fixtures/third-party/`, không commit) và một `.dawproject`: thấy Piano Roll, danh sách track, thời lượng.
3. Với `BigProject4.rpp` (tham chiếu `.mid` ngoài): không chọn kèm → thấy cảnh báo `WARN_RPP_EXTERNAL_MIDI` bằng ngôn ngữ đang chọn; chọn kèm `.mid` → có nốt.
4. Bấm Phát/Tạm dừng, kéo thanh tua; đưa `t` về cùng giá trị hai lần cho cùng khung hình.
5. `BigProject4b.rpp`: nguồn độ sáng `volume` làm track tối dần theo envelope; đổi sang `off` thì hết đổi; `đảo chiều` làm ngược lại.
6. Đổi ngôn ngữ en ↔ vi: mọi chuỗi và thông báo đang hiển thị đổi ngay; tải lại trang vẫn giữ lựa chọn.
7. Tệp sai định dạng (`.flp`): thấy lỗi dịch được, ứng dụng không hỏng.
