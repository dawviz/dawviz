---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "16. Nhân bản và vệt"
path: "16. Nhân bản và vệt"
chunk: 16-nhan-ban-va-vet.md
source_lines: 248-256
source_sha1: 94903865f6
ids: []
---
## 16. Nhân bản và vệt

| Hiệu ứng | Mô tả | Ưu tiên | Kỹ thuật |
|---|---|---|---|
| Grid / Array / Radial clone | Nhân bản theo lưới, hàng, vòng | v1.0 | C2D |
| Echo / Ghost trail | Vẽ thêm các bản ở thời điểm `t − k·Δ` mờ dần (không giữ trạng thái) | v1.0 | C2D $ |
| Motion trail | Vệt liền theo quỹ đạo | v1.1 | C2D |
| Instancing có stagger | Mỗi bản sao lệch thời gian, màu, seed | v1.0 | C2D |
