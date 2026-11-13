---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-09: Bộ máy keyframe, easing và Graph Editor"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-GRAPHICS-09: Bộ máy keyframe, easing và Graph Editor"
chunk: req-graphics-09-bo-may-keyframe-easing-va-graph.md
source_lines: 817-820
source_sha1: f0e666678e
ids: [REQ-GRAPHICS-09]
---
#### REQ-GRAPHICS-09: Bộ máy keyframe, easing và Graph Editor
* **1.0:** kiểu nội suy hold, linear, bezier, continuous, auto, auto-clamped, Catmull-Rom, monotone; tách chiều; motion path tốc độ đều theo quãng đường và auto-orient; nội suy màu OKLab, góc đường ngắn; ngoại suy constant và loop (cycle, ping-pong, offset, theo nhịp); modifier noise, stepped, clamp, generator. Bộ easing: Easy Ease có influence, Penner đầy đủ, Back/Elastic/Bounce có tham số, CSS (`cubic-bezier`, `steps`), smoothstep, spring, đường cong tự vẽ. Graph Editor cơ bản: value graph, speed graph, velocity/influence bằng số, bắt dính nhịp, thư viện easing.
* **1.1:** TCB, Vector, roving keyframe, CSS `linear()`, inertia, anticipate, easing từ biểu thức; Graph Editor đầy đủ (nhiều đường cong, chuẩn hoá, flatten/align/break, co giãn vùng chọn, đường cong ma, bake).
