---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "12. Hướng 3D đầy đủ (sau 1.2) **[ĐỀ XUẤT, chưa chốt]**"
path: "12. Hướng 3D đầy đủ (sau 1.2) **[ĐỀ XUẤT, chưa chốt]**"
chunk: 12-huong-3d-day-du-sau-1-2-de-xuat-chua-chot.md
source_lines: 240-268
source_sha1: 7e5b12f60b
ids: [AD-07, AD-12, D-43, D-47, REQ-GRAPHICS-05, REQ-GRAPHICS-15, REQ-PARSER-00]
---
## 12. Hướng 3D đầy đủ (sau 1.2) **[ĐỀ XUẤT, chưa chốt]**

Ba mức, theo thứ tự làm:

| Mức | Là gì | Bản |
|---|---|---|
| 2D | Mọi thứ vẽ trên một mặt phẳng nhìn thẳng (hiện tại) | 1.0 |
| 2.5D | Vẫn là các **tấm phẳng** vẽ bằng Canvas 2D, nhưng đặt và nghiêng trong không gian 3D, có camera phối cảnh (SRS REQ-GRAPHICS-15, D-47) | 1.1 |
| 3D thật | Nốt là **khối** có độ dày, ánh sáng, đổ bóng; cảnh có **model 3D** người dùng nạp; camera bay quanh tự do | sau 1.2 |

**Vì sao kiến trúc hiện tại mở rộng được:**
* Khung hình đã là **hàm thuần của `t`** (AD-07). 3D không đổi nguyên tắc này: vị trí camera, model, ánh sáng đều là keyframe hoặc biểu thức tính tại `t`, nên tua và xuất vẫn khớp.
* Render Core đã tách **bố cục** (tính ra danh sách hình: nốt nào, ở đâu, màu gì, sáng bao nhiêu) khỏi **vẽ** (`drawPianoRoll` lên Canvas 2D). Bộ vẽ 3D chỉ cần đọc cùng dữ liệu bố cục rồi dựng khối (instancing trên GPU, đủ cho hàng trăm nghìn nốt) thay vì vẽ hình chữ nhật.
* Đường xuất video lấy khung từ một canvas. Canvas WebGL2/WebGPU trong Worker (`OffscreenCanvas`) cũng đưa được vào `VideoEncoder`, nên phần xuất gần như không đổi.
* Hệ tài nguyên (AD-12: băm nội dung, IndexedDB, Project Pack) dùng được cho mọi loại tệp, kể cả model 3D.
* Biến đổi 3D (`rotateX/Y/Z`, `positionZ`) và camera đã có trong mô hình cảnh từ 1.1, nên cảnh 2.5D mở được ở bộ vẽ 3D về sau mà không cần di trú lớn.

**Cần thêm khi làm:**
* Gói vẽ mới `@dawviz/render-3d` (WebGL2, sau có thể WebGPU), nạp lười chỉ khi cảnh dùng 3D. Nếu dùng thư viện (ví dụ three.js, giấy phép MIT) thì phải ghi quyết định, vì quy tắc "không thêm phụ thuộc" hiện chỉ miễn cho phần giao diện.
* Mô hình cảnh: nút 3D (model, ánh sáng, camera), vật liệu (PBR), tay nắm di chuyển/xoay/co giãn trong Edit Mode.
* Ngưỡng Preview↔Export theo *khác đường vẽ* (REQ-GRAPHICS-05); kết quả GPU khác nhau đôi chút giữa các máy.

**Nạp model 3D (assets 3D):**
* **glTF 2.0 / GLB** là định dạng chính: chuẩn mở, Blender, Maya, 3ds Max, Cinema 4D đều xuất được; gồm lưới, vật liệu, texture và **hoạt hoạ khung xương**. Hoạt hoạ trong glTF là keyframe nên lấy mẫu tại `t` được, giữ tất định; có thể gắn tốc độ hoạt hoạ vào tempo hay nhịp.
* OBJ: nhận được (đơn giản, không hoạt hoạ). FBX: **không** nhận trực tiếp (định dạng đóng), hướng dẫn chuyển sang glTF bằng Blender. USDZ: cân nhắc sau.
* An toàn: glTF là dữ liệu (JSON + bộ đệm nhị phân + ảnh), không có script. Vẫn cần giới hạn: dung lượng tệp, số đỉnh/tam giác, kích thước texture, số xương; giải nén Draco/Meshopt/KTX2 (WebAssembly) chạy trong Worker có trần bộ nhớ như REQ-PARSER-00; tham chiếu tệp ngoài (`uri`) chỉ trỏ vào tài nguyên trong cùng gói, không tải từ mạng (EXPRESSIONS M2).
* Preset cộng đồng loại `model` theo cùng quy trình kiểm duyệt (D-43), CI kiểm số đỉnh, texture, giấy phép.

**Ước lượng thô:** bộ vẽ 3D cho nốt dạng khối + camera + ánh sáng cơ bản khoảng 4–6 tuần; nạp glTF có vật liệu và hoạt hoạ thêm 2–4 tuần; trình chỉnh cảnh 3D (tay nắm, ánh sáng, vật liệu) thêm 3–5 tuần. Phụ thuộc kết quả Spike WebGL2 (T-27) và mức 2.5D (T-56).
