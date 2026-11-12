---
doc: SPIKE-1-EXPORT.md
doc_title: "Spike 1: Đường ống xuất video (Export Pipeline)"
section: "1. Môi trường và kết quả chung"
path: "1. Môi trường và kết quả chung"
chunk: 1-moi-truong-va-ket-qua-chung.md
source_lines: 5-11
source_sha1: cbc774f4af
ids: [AT-05]
---
## 1. Môi trường và kết quả chung

* **Máy tính (LOQ, Windows):** chạy qua HTTP server cục bộ trên Chromium/Edge. Xuất 600 khung hình 1080p mất khoảng 3,8–4,2 giây, tức **2,4× đến 2,65× thời gian thực**.
* **Điện thoại (Redmi Note 12 4G, Snapdragon 685):** trình duyệt di động Chromium.
* **Độ khớp WYSIWYG (AT-05):** sai khác lớn nhất trên mỗi kênh màu giữa khung Preview và khung Export (`max diff`) là **57/255**. Nguyên nhân dự đoán là khác biệt rasterize và khử răng cưa giữa Canvas trên luồng chính và `OffscreenCanvas` trong Worker. Phân bố sai khác (bao nhiêu điểm ảnh lệch) chưa được đo.
* **Phông trong Worker:** nạp `FontFace` bên trong Worker hoạt động khi có tệp phông đầu vào ("Font nạp trong Worker: OK").
