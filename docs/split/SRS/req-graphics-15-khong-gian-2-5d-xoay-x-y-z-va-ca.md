---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-15: Không gian 2.5D: xoay X/Y/Z và camera phối cảnh (D-47), bản 1.1"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-GRAPHICS-15: Không gian 2.5D: xoay X/Y/Z và camera phối cảnh (D-47), bản 1.1"
chunk: req-graphics-15-khong-gian-2-5d-xoay-x-y-z-va-ca.md
source_lines: 853-861
source_sha1: 0b10d2a1a5
ids: [D-47, REQ-GRAPHICS-05, REQ-GRAPHICS-09, REQ-GRAPHICS-15]
---
#### REQ-GRAPHICS-15: Không gian 2.5D: xoay X/Y/Z và camera phối cảnh (D-47), bản 1.1
* **Mỗi lớp/phần tử** có biến đổi 3D: `rotateX`, `rotateY`, `rotateZ` (độ), `positionZ` (độ sâu), điểm neo 3D, tỉ lệ; mọi trường gắn keyframe, binding và biểu thức (REQ-GRAPHICS-09…13). Cả **toàn cảnh** cũng xoay được như một tấm phẳng (cách nhanh nhất để "nhìn chéo" cả dự án).
* **Lớp nền khi xoay 3D:** mặc định nền **gắn với màn hình** (không chịu xoay của cảnh và camera), nên khi nghiêng nốt thì nền vẫn phủ kín khung, không lộ góc trống. Người dùng có thể chuyển nền thành **một tấm trong không gian 3D** (xoay cùng cảnh, hoặc đặt ở xa phía sau để có hiệu ứng thị sai); khi đó phần khung không được phủ lấp bằng màu nền dự phòng, và có nút "Phóng to để phủ kín"
* **Camera cảnh:** phối cảnh (góc nhìn 10°–120° hoặc tiêu cự quy đổi), vị trí, điểm nhìn, quay quanh (orbit), có keyframe; chế độ **trực giao** (orthographic) cho kiểu isometric.
* **Preset góc nhìn:** Nghiêng chéo (khoảng 25–35°), Nhìn từ dưới lên, Isometric, **Đường băng** (Piano Roll nằm phẳng, nốt chạy về phía chân trời như game nhịp điệu), Lật thẻ. Người dùng chọn rồi chỉnh tiếp.
* **Cách vẽ:** mỗi lớp vẫn vẽ bằng Render Core (Canvas 2D) thành một texture, sau đó ghép các tấm phẳng trong không gian 3D bằng **WebGL2** (phép chiếu phối cảnh, sắp xếp theo độ sâu; không hỗ trợ hai tấm cắt xuyên nhau). Lớp nghiêng được vẽ ở độ phân giải cao hơn theo mức co phối cảnh để không bị mờ. Preview và Export dùng cùng đường WebGL (Export trong Worker với `OffscreenCanvas` WebGL2); sai khác theo ngưỡng *khác đường vẽ* của REQ-GRAPHICS-05.
* **Chỉnh sửa:** tay nắm xoay 3 trục trong Edit Mode, ô nhập số, nút "Về phẳng 2D"; trình duyệt không có WebGL2 thì tắt 3D, vẽ phẳng và báo cảnh báo.
* **Phụ thuộc:** Spike WebGL2 (T-27). **Sau 1.2 (cân nhắc):** nốt là khối 3D thật có ánh sáng và bóng, độ sâu trường ảnh (DOF).
