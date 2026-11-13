---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "7. Nguyên tắc sản phẩm: trình dựng thật, mặc định đơn giản (D-54)"
path: "7. Nguyên tắc sản phẩm: trình dựng thật, mặc định đơn giản (D-54)"
chunk: 7-nguyen-tac-san-pham-trinh-dung-that-mac-dinh-d.md
source_lines: 420-430
source_sha1: a66e3a3c8c
ids: [D-15, D-54, REQ-GRAPHICS-03, REQ-GRAPHICS-15, REQ-UI-13, REQ-WIDGET-07]
---
## 7. Nguyên tắc sản phẩm: trình dựng thật, mặc định đơn giản (D-54)
Mục tiêu: người dùng làm được **mọi thứ một trình dựng video/motion graphics thật làm được** với các lớp đồ hoạ của mình (xoay, biến đổi, keyframe, biểu thức, timeline), **nhưng** điểm khác biệt là mặc định cực đơn giản:

- **Preset mẫu đơn giản:** mở file là có video đẹp ngay ("Bản in" là mặc định); đổi phong cách bằng một lần bấm.
- **Kéo thả dễ:** thêm widget bằng kéo từ thư viện vào khung; kéo, co giãn, xoay trực tiếp trên khung với bắt dính; mọi thao tác hoàn tác được.
- **Độ sâu theo nhu cầu:** Cơ bản chỉ hiện thứ cần cho preset và kéo thả; Nâng cao và thẻ Editor mở toàn bộ quyền chỉnh (REQ-UI-13).

Hệ quả đã ghi vào yêu cầu:
- **Xoay tự do mọi widget từ bản 1.0** (REQ-GRAPHICS-03 sửa; thay D-15). Xoay 3D X/Y/Z và camera vẫn ở 1.1 (REQ-GRAPHICS-15).
- **Spectrum đổi hướng cột** lên/xuống/trái/phải/đối xứng ngay bên trong widget (REQ-WIDGET-07), cộng với xoay widget cho mọi góc.
- "Ngoài phạm vi: biên tập video đa tầng" được làm rõ là **cắt ghép cảnh quay/clip video**; lớp đồ hoạ, keyframe, timeline hiệu ứng thì trong phạm vi.
