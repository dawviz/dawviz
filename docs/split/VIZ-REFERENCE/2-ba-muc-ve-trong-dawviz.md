---
doc: VIZ-REFERENCE.md
doc_title: "Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**"
section: "2. Ba mức vẽ trong DawViz"
path: "2. Ba mức vẽ trong DawViz"
chunk: 2-ba-muc-ve-trong-dawviz.md
source_lines: 19-28
source_sha1: 1ee00dca1b
ids: [D-47]
---
## 2. Ba mức vẽ trong DawViz

| Mức | Cách vẽ | Giới hạn |
|---|---|---|
| **A. 2D** | Canvas 2D hiện tại: `rect`, `poly`, `path`, chữ, ảnh | Phát sáng (`shadowBlur`) đắt khi nhiều hình |
| **B. 2.5D giả lập** | Render Core tự chiếu điểm 3D → 2D (ma trận camera, chia phối cảnh), sắp theo chiều sâu, vẽ bằng Canvas 2D | Không có bộ đệm độ sâu, không ánh sáng/đổ bóng, không shader; vài nghìn đoạn/điểm mỗi khung |
| **C. WebGL** | Lớp ghép WebGL2 + backend 3D (đề xuất three.js, như vizz.fm) | Cần Spike, quyết định thêm phụ thuộc, ngưỡng so ảnh Preview↔Export |

"2.5D" trong D-47 là tấm phẳng nghiêng trong không gian; mức B ở đây rộng hơn một chút: điểm và đường 3D chiếu xuống, đủ cho đường hầm, vòng, lưới thưa. Mẫu nào cần mặt lưới dày, đổ bóng, bloom hay shader toàn khung thì phải mức C.
