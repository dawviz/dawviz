---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.4 AST (REQ-AST-01)"
path: "3. Yêu cầu chức năng > 3.4 AST (REQ-AST-01)"
chunk: 3-4-ast-req-ast-01.md
source_lines: 47-51
source_sha1: dd04828ada
ids: [ERR_NO_NOTES, REQ-AST-01, REQ-AST-02, REQ-AST-03, WARN_ZERO_LENGTH_NOTES]
---
### 3.4 AST (REQ-AST-01)
- **REQ-AST-01** Cấu trúc: `meta{title, artist, sourceFormat, sourceVersion, sourcePPQ, tempoSource, internalPPQ, totalTicks, totalDurationSeconds}`; `tempoMap[{tick,timeSeconds,bpm,timeSigNumerator,timeSigDenominator}]`; `tracks[{id,index,name,color,isMuted,isVisible,sourceId,notes,pitchRange}]`; `note{id,pitch,pitchName,startTick,durationTick,endTick,startTimeSeconds,endTimeSeconds,velocity,channel}`.
- **REQ-AST-02** Bất biến: tick nguyên, `durationTick ≥ 1` (nốt dài 0 được nâng lên 1 và báo `WARN_ZERO_LENGTH_NOTES`), pitch 0..127, velocity 1..127, nốt sắp theo `startTick`.
- **REQ-AST-03** Không có nốt nhìn thấy được → `ERR_NO_NOTES`. Track tắt tiếng giữ trong AST với `isVisible=false`, trừ khi `showMuted`.
