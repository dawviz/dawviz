---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.3 Tempo và thời gian"
path: "3. Yêu cầu chức năng > 3.3 Tempo và thời gian"
chunk: 3-3-tempo-va-thoi-gian.md
source_lines: 40-46
source_sha1: dd04828ada
ids: [REQ-TEMPO-01, REQ-TEMPO-02, REQ-TEMPO-03, REQ-TEMPO-04, REQ-TEMPO-05, WARN_TEMPO_FALLBACK, WARN_TEMPO_MIDI_DEFAULT, WARN_TEMPO_RAMP]
---
### 3.3 Tempo và thời gian
- **REQ-TEMPO-01** Tick là nguồn sự thật, `internalPPQ = 960`; giây suy ra từ `tempoMap`.
- **REQ-TEMPO-02** Không bao giờ gán 120 BPM âm thầm. `meta.tempoSource` ∈ `file | midi-default | fallback | user`. `fallback` luôn kèm `WARN_TEMPO_FALLBACK`; `midi-default` (SMF không có Set Tempo) kèm `WARN_TEMPO_MIDI_DEFAULT`.
- **REQ-TEMPO-03** `options.tempoOverride` (số BPM hoặc `[{tick,bpm,num,den}]`) thay hoàn toàn tempo của file; `tempoSource = 'user'`.
- **REQ-TEMPO-04** Tempo automation tuyến tính được xấp xỉ bằng các bước nhỏ (`rampToSteps`) và báo `WARN_TEMPO_RAMP`; đổi nhịp được gộp vào `tempoMap`.
- **REQ-TEMPO-05** `tempoMap` bắt đầu ở tick 0; tick và `timeSeconds` tăng nghiêm ngặt.
