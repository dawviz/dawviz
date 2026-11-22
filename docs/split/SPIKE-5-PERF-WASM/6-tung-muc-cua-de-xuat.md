---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "6. Từng mục của đề xuất"
path: "6. Từng mục của đề xuất"
chunk: 6-tung-muc-cua-de-xuat.md
source_lines: 80-92
source_sha1: 53acc77056
ids: [AD-13]
---
## 6. Từng mục của đề xuất

| Mục đề xuất | Số đo | Đánh giá |
|---|---|---|
| Âm thanh (FFT, dải log, đỉnh) | 1,1 s/phút → 0,18–0,25 s/phút sau khi sửa JS | WASM SIMD có thể nhanh thêm khoảng 2 lần nữa, nhưng việc này chạy một lần trong Worker; không đáng thêm chuỗi công cụ Rust |
| Parser (inflate, XML, TLV, `.rpp`) | ≤ 266 ms một lần (tệp 4 MB nén); FLP 20 MB 188 ms | Không đáng |
| Render Core: layout Piano Roll, hạt, nội suy | 0,1–2,5 ms/khung (thực tế); ≤ 7,8 ms (cực đoan) | Không giải quyết được nút thắt là vẽ; thêm chi phí chép mảng qua lại JS↔WASM |
| GC | ≤ 4,2 ms (thực tế) | Không cần WASM; giảm cấp phát trong JS nếu cần |
| Lượng tử hoá, lý thuyết nhạc, snap, hit-test | không nằm trên đường nóng | Không đáng |
| `@dawviz/expr` viết bằng Rust | chưa có | Trái AD-13 (package zero-dependency, chạy được trong Node test và Worker không cần bước build riêng). Biểu thức chỉ là cây closure nhỏ mỗi khung |

Chi phí nếu dùng WASM: Rust + target `wasm32` cho CI cả Linux và Windows, bước build mới cho `packages/*` (hiện là TS/JS chạy thẳng bằng `node --test`), mã tất định phải giữ khớp bit giữa hai cách cài (Preview ↔ Export), và tăng cỡ tải về.
