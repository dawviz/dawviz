---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "1. Bức tranh tổng thể"
path: "1. Bức tranh tổng thể"
chunk: 1-buc-tranh-tong-the.md
source_lines: 7-37
source_sha1: ce30ea1fc1
ids: [ARC-01]
---
## 1. Bức tranh tổng thể

```
 Tệp dự án (.als .alp .rpp .dawproject .mid | nhị phân + schema)         Audio (tuỳ chọn)  Font/Ảnh nền
        │                                                                     │              │
        ▼  [Worker: parse]                                                    ▼              │
 detectFormat → probeProject → parseProject → buildAST ──► UnifiedProjectAST  AudioBuffer     │
        │ (lỗi/cảnh báo theo mã)                │                              │              │
        └───────────────────────────────────────┴──────────┬───────────────────┘              │
                                                           ▼                                  │
                              Dữ liệu dẫn xuất (derived): TimelineIndex, ChordTimeline,       │
                              đường lane đã lấy mẫu, đỉnh sóng audio                          │
                                                           ▼                                  ▼
 Scene Document (preset: canvas + widgets + cấu hình) ──► renderFrame(scene, derived, t, target, scale)
                                                           │                  │
                                    ┌──────────────────────┘                  └───────────────────┐
                                    ▼ Preview (luồng chính)                                       ▼ Export (Worker)
                         Canvas + đồng hồ phát (t)                          OffscreenCanvas, t_k = start + k/FPS
                                    │                                       VideoEncoder/AudioEncoder → Mediabunny → MP4/WebM
                                    ▼                                                             │
                         UI React (Edit Mode: chọn, kéo, bắt dính, undo)                           ▼
                                    │                                                  Tệp (File System Access / tải xuống)
                                    ▼
                         Lưu phiên IndexedDB (Dexie) · Preset .json · Project Pack .zip
```

Ba nguyên tắc chi phối mọi thiết kế bên dưới:
1. **Khung hình là hàm của `t`** (ARC-01): không trạng thái ẩn, không đồng hồ trong lúc vẽ.
2. **Một nguồn sự thật cho thời gian:** tick (PPQ 960) trong AST; giây là kết quả quy đổi qua `tempoMap`.
3. **Nặng thì ở Worker, vẽ thì ở Render Core, React chỉ giữ trạng thái và dây nối.**
