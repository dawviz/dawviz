---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-08: Xuất nền trong suốt để ghép trong phần mềm dựng (D-47), bản 1.0"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-08: Xuất nền trong suốt để ghép trong phần mềm dựng (D-47), bản 1.0"
chunk: req-export-08-xuat-nen-trong-suot-de-ghep-trong.md
source_lines: 778-789
source_sha1: c62aee35b6
ids: [D-47, REQ-EXPORT-08]
---
#### REQ-EXPORT-08: Xuất nền trong suốt để ghép trong phần mềm dựng (D-47), bản 1.0
Dành cho người muốn tự xoay 3D, ghép cảnh hay thêm hiệu ứng trong After Effects, Premiere Pro, DaVinci Resolve, CapCut…
* Tuỳ chọn **Nền trong suốt** (bỏ màu/ảnh nền của cảnh; mọi lớp khác giữ nguyên, kể cả độ trong của phát sáng). Nền, ảnh nền, video nền **vẫn nằm trong dự án**; chỉ là không vẽ vào lần xuất này.
* **Chọn lớp cho từng lần xuất:** danh sách lớp có ô tick "đưa vào lần xuất này" (mặc định tất cả). Nhờ vậy người dùng xuất **hai lần**: lần 1 chỉ lớp nền (không cần alpha, có thể MP4), lần 2 các lớp còn lại với nền trong suốt; trong After Effects/Premiere đặt nền ở dưới, chỉ nghiêng lớp trên. Hai lần xuất dùng cùng kích thước, fps, Export Range và điểm đầu nên khớp từng khung.
* **Bản 1.1:** nút **"Xuất tách lớp"** làm tự động việc trên: một lần bấm cho ra mỗi nhóm lớp đã chọn (ví dụ Nền / Nốt / HUD / Hạt) thành một chuỗi PNG hoặc tệp riêng trong cùng thư mục, tên có hậu tố nhóm.
* **Định dạng:**
  * **Chuỗi ảnh PNG** (luôn có): `{tên}_{rộng}x{cao}_{fps}fps_000001.png`…; ghi thẳng vào một **thư mục** người dùng chọn (File System Access, `showDirectoryPicker`); trình duyệt không hỗ trợ thì đóng thành `.zip`, chỉ cho phép đoạn ngắn. Pre-flight ước tính dung lượng (PNG 1080p cỡ 1–3 MB mỗi khung, nên một bài 3 phút 60 fps có thể tới hàng chục GB) và gợi ý Export Range hoặc hạ fps.
  * **WebM VP9 có kênh alpha** khi `VideoEncoder` hỗ trợ (`alpha: 'keep'`) **[VERIFY]** trên Chrome/Edge Windows và macOS; nhẹ hơn nhiều nhưng không phải phần mềm dựng nào cũng đọc được alpha của WebM.
  * MP4 H.264 **không** có kênh alpha nên bị khoá khi bật nền trong suốt.
* **Hướng dẫn trong ứng dụng** (hiện sau khi xuất): After Effects: nhập chuỗi PNG (tick "PNG Sequence"), đặt fps, bật công tắc **3D Layer** rồi chỉnh X/Y/Z Rotation; Premiere Pro: hiệu ứng **Basic 3D** (Swivel/Tilt) hoặc nhập vào After Effects qua Dynamic Link. Khuyến nghị xuất độ phân giải cao hơn khung cuối nếu sẽ nghiêng mạnh, vì phía xa bị co lại.
* Âm thanh: tuỳ chọn xuất kèm tệp `.wav` cùng tên (cùng điểm đầu) để ghép lại trong phần mềm dựng.
