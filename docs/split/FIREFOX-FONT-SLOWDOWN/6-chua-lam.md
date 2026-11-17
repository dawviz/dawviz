---
doc: FIREFOX-FONT-SLOWDOWN.md
doc_title: "Firefox xuất chậm dần: điều tra và cách giảm nhẹ"
section: "6. Chưa làm"
path: "6. Chưa làm"
chunk: 6-chua-lam.md
source_lines: 64-70
source_sha1: a549031f0a
ids: []
---
## 6. Chưa làm

- **Chia việc vẽ cho nhiều Worker** (đề xuất A): mỗi đoạn ~300 khung một Worker mới (không kịp chậm đi), chuyển `VideoFrame` sang Worker mã hoá để xếp lại thứ tự. Dự đoán 10–15 s cho bài 150 s trên Firefox và nhanh hơn trên mọi trình duyệt (hiện chỉ một lõi vẽ). Cái giá: làm lại Export Worker, xếp lại thứ tự khung, kiểm soát bộ nhớ (mỗi khung 1080² ≈ 4,6 MB), huỷ/lỗi. Chỉ làm nếu người thử vẫn phàn nàn sau bản này.
- **Preview trên Firefox** (canvas luồng chính, `document.fonts`, 6 mặt): chưa kiểm có chậm dần khi phát lâu không.
- Cơ chế bên trong Firefox, báo lỗi lên Mozilla.
- Gộp ba dải thành một mặt phông mỗi độ đậm, hoặc dùng phông biến thiên (một mặt cho mọi độ đậm): sẽ còn 1–2 mặt cho cả tiếng Việt, nhưng cần tệp phông mới (kho chưa có Space Grotesk biến thiên; thêm gói là quyết định phụ thuộc mới).
