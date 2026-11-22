---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "1. Kết luận"
path: "1. Kết luận"
chunk: 1-ket-luan.md
source_lines: 5-12
source_sha1: aac793689f
ids: []
---
## 1. Kết luận

* **Chưa nên dùng WASM cho 1.0.** Ở mọi cảnh đã đo, phần WASM thay được (`layoutFrame`: tính toạ độ, hạt, nội suy) chỉ chiếm **5–25%** thời gian khung. Phần còn lại là vẽ Canvas 2D và GPU, mà WASM không vẽ được. Kể cả khi phần tính toán giảm về 0, các cảnh vượt 16,7 ms vẫn vượt.
* **GC không phải vấn đề ở cảnh thực tế.** Đo bằng CDP tracing: GC nhỏ dài nhất **2,5 ms**, GC lớn dài nhất **4,2 ms**, trung bình **0,05 ms/khung**. Mức 5–20 ms mà đề xuất giả định chỉ chạm tới (9,8 ms) ở cảnh cực đoan 500.000 nốt kèm 5.000 hạt.
* **Phân tích âm thanh từng chậm thật, nhưng do lỗi thuật toán chứ không do JS.** 75% thời gian nằm ở chỗ dồn bộ đệm sau *mỗi* khung, tức chi phí gần O(n²). Đã sửa bằng JS (dồn thưa + FFT thực cỡ N/2): **nhanh hơn 5,9 lần**, bảng kết quả giống hệt từng ô. Bài 10 phút trên Chrome giảm từ khoảng 11 s xuống **1,85 s**.
* **Parser chạy một lần khi mở tệp:** ≤ 266 ms (Node) cho tệp thật lớn nhất trong bộ thử. Không đáng chuyển.
* **Nếu sau này cần nhanh hơn, ưu tiên phần vẽ** (gom lệnh vẽ theo màu, giảm `shadowBlur`, hoặc WebGL2 như T-27/T-36 đã dự kiến), không ưu tiên WASM cho phần tính toán.
