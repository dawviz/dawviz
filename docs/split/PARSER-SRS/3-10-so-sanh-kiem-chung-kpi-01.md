---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.10 So sánh kiểm chứng (KPI-01)"
path: "3. Yêu cầu chức năng > 3.10 So sánh kiểm chứng (KPI-01)"
chunk: 3-10-so-sanh-kiem-chung-kpi-01.md
source_lines: 107-109
source_sha1: dd04828ada
ids: [KPI-01, REQ-CMP-01]
---
### 3.10 So sánh kiểm chứng (KPI-01)
- **REQ-CMP-01** `compareAST(a, ref)` ghép nốt theo (pitch, thời điểm gần nhất trong cửa sổ 2 beat); dung sai = 1 tick của nguồn thô hơn (ví dụ MIDI 96 PPQ → 10 tick @960); trả `pass`, số nốt khớp/lệch/chỉ-có-một-bên, chênh tempo và tổng thời lượng.
