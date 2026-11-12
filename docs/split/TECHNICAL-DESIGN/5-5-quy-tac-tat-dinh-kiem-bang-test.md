---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.5 Quy tắc tất định (kiểm bằng test)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.5 Quy tắc tất định (kiểm bằng test)"
chunk: 5-5-quy-tac-tat-dinh-kiem-bang-test.md
source_lines: 150-152
source_sha1: a953f6ccd4
ids: [REQ-GRAPHICS-05]
---
### 5.5 Quy tắc tất định (kiểm bằng test)
Cùng `(scene, derived, ast, t, scale)` → cùng danh sách `Primitive` (so sánh sâu) ở Node, và ảnh khớp theo hai ngưỡng của SRS REQ-GRAPHICS-05 (sửa v1.1): ≤ 1/255 mỗi kênh khi **cùng đường vẽ**; giữa Canvas và OffscreenCanvas (khác đường vẽ, Spike 1 đo max diff 57/255 do khử răng cưa) dùng tỉ lệ điểm ảnh lệch ≤ 2/255 và PSNR, **[PROVISIONAL]**, so ảnh trước khi mã hoá (test ảnh chụp trong trình duyệt, M3 ⚪). Mẹo giảm sai khác: vẽ Primitive về toạ độ đã làm tròn theo `scale`, cùng `imageSmoothingQuality`, cùng phông đã nạp. Font người dùng phải `FontFace.load()` xong trước khung đầu khi xuất.
