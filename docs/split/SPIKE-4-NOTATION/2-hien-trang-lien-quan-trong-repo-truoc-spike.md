---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "2. Hiện trạng liên quan trong repo (trước spike)"
path: "2. Hiện trạng liên quan trong repo (trước spike)"
chunk: 2-hien-trang-lien-quan-trong-repo-truoc-spike.md
source_lines: 14-23
source_sha1: c33d54141a
ids: [D-50]
---
## 2. Hiện trạng liên quan trong repo (trước spike)

| Thực tế | Hệ quả |
|---|---|
| `Primitive` chỉ có `rect` và `text` | Cần primitive đường vẽ: đã thêm `PathPrim` (`kind: 'path'`) |
| Quy tắc 5 và 8 ([AI_CONTEXT §3](../../../AI_CONTEXT.md)): Render Core tất định, không phụ thuộc mới trong `packages/*` | VexFlow chỉ nằm ở `apps/web` (Worker); phần thuần (lượng tử, cách viết cao độ, kiểu layout, renderer) ở Render Core |
| Firefox xuất chậm dần khi nhiều mặt phông web trong Worker ([FIREFOX-FONT-SLOWDOWN](../../design/FIREFOX-FONT-SLOWDOWN.md)) | Không `FontFace` nào cho bản nhạc: đo và vẽ glyph bằng bảng sinh sẵn |
| AST chưa có key signature | Giọng ước lượng ở bước lượng tử (dữ liệu dẫn xuất), người dùng ghi đè; AST không đổi |
| Trang theo ô nhịp (T-84), phát sáng (D-50), easing | Dùng lại ý tưởng; widget có lật trang và phóng to riêng |
