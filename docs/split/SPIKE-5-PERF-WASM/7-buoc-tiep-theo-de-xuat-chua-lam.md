---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "7. Bước tiếp theo đề xuất (chưa làm)"
path: "7. Bước tiếp theo đề xuất (chưa làm)"
chunk: 7-buoc-tiep-theo-de-xuat-chua-lam.md
source_lines: 93-97
source_sha1: aac793689f
ids: []
---
## 7. Bước tiếp theo đề xuất (chưa làm)

* Phần vẽ: gom `fillRect` theo màu/độ đục (một `Path2D` mỗi nhóm), thay `shadowBlur` bằng ảnh phát sáng dựng sẵn khi vượt ngân sách (CUSTOMIZATION §7 đã ghi), WebGL2 cho nốt và hạt (Spike riêng như T-27/T-36).
* Đo lại trên ít nhất một máy khác (máy yếu, Windows hoặc macOS) trước khi chốt giới hạn ở CUSTOMIZATION §7 (T-27 yêu cầu 2 máy).
* `buildSceneHud` với widget Hợp âm trên tệp rất lớn (≈ 600 ms): chạy một lần, nhưng nếu người dùng thêm widget Hợp âm trên tệp lớn thì có thể thấy giật nhẹ một lần.
