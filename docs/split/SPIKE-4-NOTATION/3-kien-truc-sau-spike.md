---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "3. Kiến trúc (sau spike)"
path: "3. Kiến trúc (sau spike)"
chunk: 3-kien-truc-sau-spike.md
source_lines: 24-49
source_sha1: c33d54141a
ids: [WARN_NOTATION_]
---
## 3. Kiến trúc (sau spike)

```
AST (nốt, tempoMap, dấu nhịp)
  │ ① quantize()            packages/render-core/src/notation/quantize.ts   (thuần, tất định)
  ▼
ScoreModel: ô → khuông → giọng → sự kiện (nốt/hợp âm/lặng/lặng ẩn/liên ba), mỗi nốt giữ noteId; giọng ước lượng
  │ ② engrave()             apps/web/src/lib/notation/engrave.ts (VexFlow 5.6 core, trong notation.worker.ts)
  │    RecordingContext ghi lệnh vẽ theo phần tử; đo chữ bằng bảng glyph sinh sẵn (notationFonts.generated.ts)
  ▼
NotationLayout (JSON thuần): trang → phần tử (đường/dãy glyph, chủ = nốt), chủ → giây thật, hàng → mốc thời gian→x, bảng đường viền glyph
  │ ③ notationRenderer      packages/render-core/src/notation/widget.ts + draw.ts (mỗi khung, hàm của t)
  ▼
Preview Canvas / Export Worker (nhận cùng NotationLayout qua job.notation)
```

Nguyên tắc (đã giữ khi làm):

1. **Lượng tử hoá chỉ để vẽ.** Nốt sáng theo giây thật của nốt AST (`owner.on/off`); vạch phát nội suy qua mốc thời gian → x đơn điệu. Lượng tử sai không làm lệch tiếng.
2. **Engrave một lần, vẽ nhiều lần.** Worker dựng, bộ đệm theo khoá (dự án + tempo + tập track + thuộc tính ảnh hưởng bản dựng). Đổi màu/phóng to/nét tay không dựng lại.
3. **Không phông web khi vẽ.** Glyph là đường viền (Path2D đệm theo glyph). Đo chữ lúc dàn trang cũng từ cùng bảng nên mọi trình duyệt dàn như nhau và Preview = Export.
4. **Nét tay tất định**: nhiễu băm `(id phần tử, đỉnh, floor(t·boilFps), seed)`.
5. **Suy giảm có báo** bằng mã cảnh báo (`WARN_NOTATION_*`), không bỏ thầm lặng.

Điều chỉnh so với kế hoạch: (a) **không cache bitmap trang** ở bản đầu: S3 cho thấy vẽ thẳng đã đủ nhanh, và bitmap phải dựng lại khi widget xoay/đổi cỡ; (b) **không tự rơi về Piano Roll**: chỉ cảnh báo, người dùng tự chọn; (c) đo chữ bằng **bảng sinh sẵn** thay vì fontkit lúc chạy (fontkit chỉ dùng ở script sinh); (d) Gonville/Petaluma **dự phòng sang Bravura** cho glyph thiếu (Gonville không có số liên ba và nốt của ký hiệu tempo).
