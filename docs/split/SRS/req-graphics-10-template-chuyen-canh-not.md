---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-10: Template chuyển cảnh nốt"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-GRAPHICS-10: Template chuyển cảnh nốt"
chunk: req-graphics-10-template-chuyen-canh-not.md
source_lines: 835-837
source_sha1: e94e9bc79b
ids: [AD-11, REQ-GRAPHICS-10, REQ-GRAPHICS-16, REQ-WIDGET-01]
---
#### REQ-GRAPHICS-10: Template chuyển cảnh nốt
* **1.0:** bốn pha `enter`, `hit`, `sustain`, `exit`, mỗi pha có thời lượng, easing, hiệu ứng; NoteLayer có hướng cuộn `left/right/up/down`, **góc tự do 0–360°** (REQ-WIDGET-01) và vạch phát tuỳ chỉnh (REQ-GRAPHICS-16); tối thiểu 9 template dựng sẵn (`scroll-left`, `fall-down`, `rise-up`, `drop-bounce`, `pop-in`, `fade-scale`, `morph`, `shatter`, `ripple`); morph cùng họ hình (AD-11). Morph đường SVG tự do: **1.2**.
