---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.2. Cấu trúc dữ liệu chuẩn hóa (Unified AST, D-08, D-09)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.2. Cấu trúc dữ liệu chuẩn hóa (Unified AST, D-08, D-09)"
chunk: 3-2-cau-truc-du-lieu-chuan-hoa-unified-ast-d-08.md
source_lines: 340-400
source_sha1: f0e666678e
ids: [D-08, D-09, D-24, ERR_AST_INVALID, ERR_AST_TOO_LARGE, ERR_NO_NOTES, NFR-ACC-02, REQ-AST-01, REQ-AST-02, WARN_ZERO_LENGTH_NOTES]
---
### 3.2. Cấu trúc dữ liệu chuẩn hóa (Unified AST, D-08, D-09)

#### REQ-AST-01: Lược đồ và quy tắc xác thực
Mọi parser phải xuất cấu trúc sau và qua bước xác thực trước khi vào Document Store:

```typescript
export interface UnifiedProjectAST {
  meta: {
    title: string;
    artist: string;
    sourceFormat: 'als' | 'alp' | 'rpp' | 'dawproject' | 'mid' | 'custom_json' | 'custom_binary';
    sourceVersion?: string;
    sourcePPQ: number;                 // PPQ gốc của nguồn (v0.3)
    tempoSource: 'file' | 'midi-default' | 'fallback' | 'user';   // v0.3, D-24
    internalPPQ: 960;
    totalTicks: number;
    totalDurationSeconds: number;
  };
  tempoMap: TempoPoint[];
  tracks: ProjectTrack[];
  chordTimeline: ChordSegment[];   // tính trước (D-09) bởi Analysis Worker, không do Parser Library tạo
}
export interface TempoPoint {
  tick: number; timeSeconds: number; bpm: number;
  timeSigNumerator: number; timeSigDenominator: number;
}
export interface ProjectTrack {
  id: string; index: number; name: string; color: string;
  isMuted: boolean; isVisible: boolean;
  sourceId?: string;                  // id gốc trong file nguồn (v0.3)
  mix?: { volumeDb: number; pan: number };            // mức fader tĩnh (Reaper VOLPAN) (v0.3)
  automation?: { volume?: AutomationLane; pan?: AutomationLane; mute?: AutomationLane; [laneId: string]: AutomationLane | undefined };   // v0.3; lane tuỳ ý: REQ-AST-02

  notes: ASTNote[];
  pitchRange: { min: number; max: number };   // 0-127
}
export interface AutomationLane { kind: 'volume' | 'pan' | 'mute' | 'send' | 'plugin' | 'midi-cc' | 'pitch-bend' | 'other'; name?: string; plugin?: { name: string; vendor?: string }; param?: { name: string; index?: number }; range?: { min: number; max: number; unit?: string }; points: { tick: number; timeSeconds: number; value: number; shape: number; tension?: number }[] }   // volume: gain tuyến tính
export interface ASTNote {
  id: string; pitch: number; pitchName: string;      // "C4", "G#5"
  startTick: number; durationTick: number; endTick: number;   // nguồn sự thật
  startTimeSeconds: number; durationSeconds: number; endTimeSeconds: number; // suy ra
  velocity: number;                                    // 1-127
  channel?: number;                                    // kênh MIDI nếu nguồn có (v0.3)
}
export interface ChordSegment {
  startTick: number; endTick: number;
  startTimeSeconds: number; endTimeSeconds: number;
  chordName: string;        // "D/F#", "Gmaj7", "N.C."
  rootNote: string; bassNote: string; pitches: number[];
  isManualOverride: boolean;
}
```

Quy tắc xác thực (vi phạm thì báo `ERR_AST_INVALID`, kèm vị trí lỗi đầu tiên):
* `startTick`, `durationTick` là số nguyên; `startTick ≥ 0`; `durationTick ≥ 1`; `endTick = startTick + durationTick`.
* `pitch` trong 0–127; `velocity` trong 1–127; không có `NaN`/`Infinity`.
* `tempoMap` không rỗng, phần tử đầu ở tick 0, tăng dần theo `tick`; `bpm` trong 10–1000 **[PROVISIONAL]**.
* Nốt mỗi track được sắp theo `startTick`; tổng số nốt ≤ 500,000 **[PROVISIONAL]** (vượt thì `ERR_AST_TOO_LARGE`).
* Không có nốt nào sau khi lọc thì báo `ERR_NO_NOTES`. Nốt dài 0 được nâng lên 1 tick kèm `WARN_ZERO_LENGTH_NOTES`. Cảnh báo là đối tượng `{code, message, details?}`.
* Giây là giá trị suy ra từ tick qua TempoMap; không được dùng giây để so sánh độ chính xác (NFR-ACC-02). Tempo thay đổi theo bậc (step); nội suy tuyến tính chỉ áp dụng khi nguồn khai báo dốc tempo **[VERIFY]**.
