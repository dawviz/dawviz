---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "5. Danh sách kiểm thủ công cho AT-18 (Chrome)"
path: "5. Danh sách kiểm thủ công cho AT-18 (Chrome)"
chunk: 5-danh-sach-kiem-thu-cong-cho-at-18-chrome.md
source_lines: 69-83
source_sha1: 8d240985ec
ids: [AT-18, AT-26, REQ-GRAPHICS-17, REQ-UI-08, REQ-UI-14, REQ-UI-15]
---
## 5. Danh sách kiểm thủ công cho AT-18 (Chrome)
1. `npm install && npm run dev`, mở trang; không có lỗi trong console.
2. Thả lần lượt `BigProject4b.rpp`, `Demo.als` và `Oboe_MIDI_001.mid` (hai tệp sau để trong `test/fixtures/third-party/`, không commit) và một `.dawproject`: thấy Piano Roll, danh sách track, thời lượng.
3. Với `BigProject3.rpp` (tham chiếu `Oboe MIDI 001.mid` ngoài; REQ-UI-08): chỉ chọn `.rpp` → thấy bảng đỏ "Dự án dùng 1 file MIDI ngoài chưa được nạp" kèm tên file và nút "Nạp file .mid…", không có thêm lỗi chung "không có nốt". Nạp một `.mid` tên khác → bảng báo tệp đó "không dùng". Nạp đúng tệp bằng nút hoặc thả vào bảng (tên khác hoa/thường hoặc dấu cách/gạch dưới vẫn khớp) → có nốt mà không phải chọn lại `.rpp`. Chọn cùng lúc `.rpp` + `.mid` ở khung thả chính cũng phải ra nốt ngay.
4. Bấm Phát/Tạm dừng, kéo thanh tua; đưa `t` về cùng giá trị hai lần cho cùng khung hình.
5. `BigProject4b.rpp`: nguồn độ sáng `volume` làm track tối dần theo envelope; đổi sang `off` thì hết đổi; `đảo chiều` làm ngược lại.
6. Đổi ngôn ngữ en ↔ vi: mọi chuỗi và thông báo đang hiển thị đổi ngay; tải lại trang vẫn giữ lựa chọn.
7. Tệp sai định dạng (`.flp`): thấy lỗi dịch được, ứng dụng không hỏng.
8. Bố cục (2026-11-12): ở bề rộng 1440, 1100 và 800 px, không phần tử nào trong bảng "Kiểu nốt" hay thẻ track tràn ra ngoài khung; trang không có thanh cuộn ngang. Ở màn rộng (`lg`), Piano Roll và thanh phát đứng yên khi cuộn danh sách track (cột phải tự cuộn).
9. Đổi cỡ cửa sổ khi đang tạm dừng: Piano Roll vẽ lại theo bề rộng mới, không bị kéo giãn.
10. Ô nhập số trong bảng "Kiểu nốt" (REQ-UI-15, phần đã làm): gõ `10*3` rồi Enter ở "Cỡ quầng sáng" → 30; gõ `500` → 64 (giới hạn cứng); ↑/↓ đổi theo bước, Shift ×10; gõ chữ → viền đỏ, Esc trả giá trị cũ; Tab qua lần lượt thanh trượt rồi ô nhập.
11. Track Info và ngưỡng độ sáng (T-03): mở "Chi tiết" của một track trong `BigProject4b.rpp`: thấy tầm cao độ (A0 – A7), fader `0 dB · pan 0`, automation `Volume`, dòng "Hiện tại: …%" chạy theo khi phát. Đặt "Sàn (dB)" = −6: nốt tối hẳn ở đoạn envelope thấp; kéo "Sàn" vượt "Trần" thì "Trần" tự lùi theo (luôn cách ≥ 1 dB); "Độ sáng thấp nhất" vượt "cao nhất" thì "cao nhất" theo lên. Đổi nguồn sang `off` thì các thanh ngưỡng ẩn và độ sáng 100%. Ô màu track tròn.
12. CSP (T-30): chạy `npm run build && npm run preview` ở gốc repo, mở địa chỉ được in ra (mặc định `http://localhost:4173/`) (không dùng `npm run dev`: dev không có CSP). DevTools → Console: không có dòng "Refused to …" hay "This document requires 'TrustedScriptURL'"; nạp một tệp vẫn parse được (Worker chạy dưới Trusted Types). Kiểm thêm trong Console: `document.body.innerHTML += '<b>x</b>'` phải báo lỗi TypeError (Trusted Types chặn). Ghi chú: Firefox bắt gõ `allow pasting` trước khi cho dán vào Console (dòng SyntaxError đi kèm là bình thường); dòng log có nguồn `moz-extension://` hoặc `chrome-extension://` là của tiện ích trình duyệt, không tính. Nên kiểm trong cửa sổ ẩn danh/không tiện ích cho log sạch. Kết quả 2026-11-12: đạt trên Firefox (thủ công) và Chrome (tự động).
13. Phát sáng động (REQ-GRAPHICS-17, AT-26): nạp một `.mid` nhiều track (hoặc `BigProject4b.rpp`). Mặc định mọi nốt đang phát sáng như nhau; "Độ sáng nền" của track là "Đều nhau". Trong "Kiểu dáng nốt" → "Phát sáng" chọn "Động khi chạm": theo Velocity thì nốt mạnh sáng hơn rõ; theo Tắt dần thì sáng nhất lúc chạm rồi mờ đến hết nốt; theo Automation + lane Âm lượng (`BigProject4b.rpp`) thì đổi theo envelope; "Tắt dần sau nốt" = 0,5 s thì nốt vừa qua còn sáng mờ một lúc; "Đảo chiều" làm ngược lại.
14. Danh sách track (REQ-UI-14 sửa, AT-26): với dự án 15 track, mặc định "Lưới" + "Tự động" nằm dưới khung xem trước, không thẻ nào tràn ở 1440/1100/800 px; bỏ "Tự động", gõ số cột 8 ở cửa sổ ~1280 px → báo chỉ vừa 4 cột; đổi số cột thấy thẻ trượt mượt tới chỗ mới; chuyển "Danh sách" → mỗi track một dòng ở cột phải, thẻ bay sang; bấm dòng hoặc Enter mở phần chỉnh; phím mũi tên đi giữa các thẻ/dòng; cuộn trang ở kiểu Lưới không có gì đè lên thẻ; tải lại trang giữ kiểu và số cột. Bật "Giảm chuyển động" của hệ điều hành thì thẻ đổi chỗ không có chuyển động.
