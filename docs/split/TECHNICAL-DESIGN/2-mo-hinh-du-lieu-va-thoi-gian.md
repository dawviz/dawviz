---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "2. Mô hình dữ liệu và thời gian 🟢"
path: "2. Mô hình dữ liệu và thời gian 🟢"
chunk: 2-mo-hinh-du-lieu-va-thoi-gian.md
source_lines: 38-62
source_sha1: 10dd2f7ff3
ids: [SOI-19, WARN_TEMPO_RAMP]
---
## 2. Mô hình dữ liệu và thời gian 🟢

### 2.1 Unified AST
Hợp đồng đầy đủ ở SRS mục 3.2. Phần cốt lõi (đã có kiểu trong `packages/render-core/src/types.ts`):

```ts
UnifiedProjectAST {
  meta: { title, sourceFormat, sourcePPQ, internalPPQ: 960, tempoSource: 'file'|'midi-default'|'fallback'|'user',
          totalTicks, totalDurationSeconds }
  tempoMap: { tick, timeSeconds, bpm, num?, den? }[]          // sắp theo tick, điểm đầu ở tick 0
  tracks: { id, index, name, color, isMuted, isVisible, notes[], pitchRange,
            mix?: { volumeDb, pan }, automation?: { volume?, pan?, mute? } }[]
}
ASTNote { id, pitch, startTick, endTick, startTimeSeconds, endTimeSeconds, velocity, channel? }
```
Bất biến do `buildAST` bảo đảm và được test: nốt có `endTick > startTick`, `pitch 0..127`, `velocity 1..127`, nốt sắp theo `startTick` rồi `pitch`, `tempo` trong 10..1000 BPM, số nốt ≤ giới hạn (mặc định 500.000).

### 2.2 Quy đổi thời gian
- `tickToSec(map, tick)` và `secToTick(map, sec)` tìm đoạn tempo bằng tìm nhị phân rồi nội suy tuyến tính trong đoạn (tempo hằng số trong mỗi đoạn; dốc tempo được xấp xỉ bằng bậc thang `rampToSteps`, kèm `WARN_TEMPO_RAMP`).
- Mỗi nốt lưu sẵn cả tick và giây (tính một lần ở `buildAST`) → Render Core không tính lại tempo cho nốt; chỉ lane automation cần `secToTick` (một lần mỗi lần lấy mẫu).
- **Ghi đè tempo** (`tempoOverride`): số BPM hoặc điểm `{bpm, num?, den?, tick|beat|timeSeconds}`. Giao diện nhập vị trí theo ba kiểu (giây `m:ss.mmm`, `bar.beat.%` của Reaper, `bar.beat.sixteenth`) và `resolveTempoRows` đổi thành điểm tempo; nhịp ghép như 12/8 đếm beat theo mẫu số (đã xác nhận với Reaper: `1.12.68` = 2,920 s ở 120 BPM).

### 2.3 Automation 🟢
`Lane { kind, points:[{tick, timeSeconds, value, shape, tension?}] }`. `sampleLane(lane, tick)`: giữ giá trị biên ngoài khoảng; trong khoảng tìm đoạn bằng tìm nhị phân, áp `shapeCurve` (0 tuyến tính, 1 bậc thang, 2 mượt, 3 nhanh đầu, 4 nhanh cuối, 5 bezier xấp xỉ), riêng **volume** nội suy trong không gian fader `p = gain^0,25` (khớp ≤ 0,3 dB với Reaper tại hai điểm đo; hệ số này còn [VERIFY], SOI-19). `volumeToUnit(gain, {floorDb, ceilDb})` cho độ sáng 0..1.
