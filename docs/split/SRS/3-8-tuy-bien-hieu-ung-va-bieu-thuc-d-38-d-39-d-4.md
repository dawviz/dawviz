---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40)"
chunk: 3-8-tuy-bien-hieu-ung-va-bieu-thuc-d-38-d-39-d-4.md
source_lines: 718-743
source_sha1: 6c3a823de0
ids: [AD-08, AD-11, AD-12, AD-13, AD-15, D-14, D-37, D-38, D-39, D-40, D-43, ERR_ASSET_DECODE, ERR_ASSET_TOO_LARGE, REQ-GRAPHICS-05, REQ-GRAPHICS-09, REQ-GRAPHICS-10, REQ-GRAPHICS-11, REQ-GRAPHICS-12, REQ-GRAPHICS-13, REQ-STORAGE-04, REQ-STORAGE-05, REQ-STORAGE-06]
---
### 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40)

Thiết kế chi tiết: `docs/design/CUSTOMIZATION.md` (AD-08…AD-12), `docs/design/ANIMATION-CATALOG.md` (danh mục, nhãn bản phát hành), `docs/design/EXPRESSIONS.md` (AD-13…AD-15). Mọi yêu cầu dưới đây giữ tính tất định (REQ-GRAPHICS-05, D-37): khung hình là hàm của `t`.

#### REQ-GRAPHICS-09: Bộ máy keyframe, easing và Graph Editor
* **1.0:** kiểu nội suy hold, linear, bezier, continuous, auto, auto-clamped, Catmull-Rom, monotone; tách chiều; motion path tốc độ đều theo quãng đường và auto-orient; nội suy màu OKLab, góc đường ngắn; ngoại suy constant và loop (cycle, ping-pong, offset, theo nhịp); modifier noise, stepped, clamp, generator. Bộ easing: Easy Ease có influence, Penner đầy đủ, Back/Elastic/Bounce có tham số, CSS (`cubic-bezier`, `steps`), smoothstep, spring, đường cong tự vẽ. Graph Editor cơ bản: value graph, speed graph, velocity/influence bằng số, bắt dính nhịp, thư viện easing.
* **1.1:** TCB, Vector, roving keyframe, CSS `linear()`, inertia, anticipate, easing từ biểu thức; Graph Editor đầy đủ (nhiều đường cong, chuẩn hoá, flatten/align/break, co giãn vùng chọn, đường cong ma, bake).

#### REQ-GRAPHICS-10: Template chuyển cảnh nốt
* **1.0:** bốn pha `enter`, `hit`, `sustain`, `exit`, mỗi pha có thời lượng, easing, hiệu ứng; NoteLayer có hướng cuộn `left/right/up/down` và vị trí vạch phát; tối thiểu 9 template dựng sẵn (`scroll-left`, `fall-down`, `rise-up`, `drop-bounce`, `pop-in`, `fade-scale`, `morph`, `shatter`, `ripple`); morph cùng họ hình (AD-11). Morph đường SVG tự do: **1.2**.

#### REQ-GRAPHICS-11: Hạt không trạng thái
* **1.0:** PRNG có seed, chuyển động dạng đóng (trọng lực, lực cản), nhiễu tất định; nguồn phát theo nốt (`hit`, `sustain`, `exit`), vạch phát, nhịp, môi trường; hình hạt cơ bản và ảnh; hoà trộn cộng sáng; giới hạn số hạt (CUSTOMIZATION §7). **1.1:** attractor, sub-emitter, vệt hạt.

#### REQ-GRAPHICS-12: Storyboard, hiệu ứng và chữ động
* **1.0:** mô hình `SceneDocument` có lớp và phần tử (NoteLayer, Widget, Sprite, Text, Shape, ParticleEmitter); keyframe theo `sec`, `beat`, `bar.beat`, `tick`; bindings dữ liệu nhạc; các hiệu ứng nhãn `v1.0` trong ANIMATION-CATALOG dưới dạng preset `effect`; text animator cơ bản (typewriter, range selector, stagger, counter); chỉnh keyframe qua bảng thuộc tính. **1.1:** timeline nhiều lớp đầy đủ, hiệu ứng nhãn `v1.1` (gồm WebGL sau Spike T-27), text animator nâng cao.

#### REQ-GRAPHICS-13: Biểu thức thuộc tính
* **1.0:** mọi thuộc tính số/màu nhận biểu thức theo EXPRESSIONS §3 (danh sách trắng biến và hàm, không vòng lặp, giới hạn độ dài/độ sâu/bước); ô nhập báo lỗi theo vị trí; lỗi khi chạy dùng giá trị dự phòng và cảnh báo theo phần tử. **1.1:** tô màu cú pháp, gợi ý tên, nút "Bake thành keyframe".

#### REQ-STORAGE-05: Tài nguyên của phiên
* **1.0:** ảnh (PNG/JPEG/WebP/GIF khung đầu), SVG (chỉ vẽ dạng ảnh), sprite sheet, phông (WOFF2/TTF/OTF); định danh SHA-256; lưu IndexedDB; giới hạn kích thước (`ERR_ASSET_TOO_LARGE`, `ERR_ASSET_DECODE`); đóng gói vào Project Pack; pre-flight báo thiếu tài nguyên trước khi xuất.

#### REQ-STORAGE-06: Preset mới và chia sẻ
* **1.0:** các loại `note-style`, `note-transition`, `easing`, `particle`, `theme`, `effect`, `scene`; JSON Schema, `schemaVersion` và di trú (REQ-STORAGE-04); "Chia sẻ thành preset" xuất `.dawviz-preset.zip` (JSON + tài nguyên + băm + giấy phép SPDX bắt buộc); nhập kèm nhãn "Chưa kiểm duyệt". **1.1:** thư viện cộng đồng trong ứng dụng (D-14), xác minh băm, danh sách thu hồi, kiểm duyệt theo D-43.
