---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "2. Hiện trạng liên quan trong repo"
path: "2. Hiện trạng liên quan trong repo"
chunk: 2-hien-trang-lien-quan-trong-repo.md
source_lines: 14-25
source_sha1: 226588bac5
ids: [D-50]
---
## 2. Hiện trạng liên quan trong repo

| Thực tế | Hệ quả |
|---|---|
| `Primitive` ở `packages/render-core/src/prims.ts` chỉ có `rect` và `text` | Cần primitive đường vẽ (path) và nhóm theo phần tử |
| Quy tắc 5 và 8 ([AI_CONTEXT §3](../../../AI_CONTEXT.md)): Render Core tất định, không phụ thuộc mới trong `packages/*` | **VexFlow không được nằm trong render-core.** Phải tách bước "engrave" ra ngoài, Render Core chỉ vẽ dữ liệu thuần |
| Firefox xuất chậm dần khi nhiều mặt phông web trong Worker ([FIREFOX-FONT-SLOWDOWN](../../design/FIREFOX-FONT-SLOWDOWN.md)) | Không nạp phông nhạc bằng `FontFace` trong Worker; dùng đường viền glyph (outline) |
| AST chưa có key signature (`meta` chỉ có tempo, nhịp…) | Phải ước lượng giọng và cho người dùng ghi đè |
| Chế độ Trang theo ô nhịp, `barStartSec`/`barPageAt` đã có (T-84) | Dùng lại cho lật trang bản nhạc |
| Phát sáng động `glow.ts` (D-50), easing ở `ANIMATION-CATALOG` | Dùng lại cho nốt sáng và phóng to |
| Chỉ mục nốt nhị phân `notes.ts` | Tra nốt đang phát theo `t` mà không cấp phát |
