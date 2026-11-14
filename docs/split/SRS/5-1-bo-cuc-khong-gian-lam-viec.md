---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "5.1. Bố cục không gian làm việc"
path: "5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG > 5.1. Bố cục không gian làm việc"
chunk: 5-1-bo-cuc-khong-gian-lam-viec.md
source_lines: 949-986
source_sha1: 46410b6da3
ids: [D-57, REQ-GRAPHICS-14]
---
### 5.1. Bố cục không gian làm việc

```text
+--------------------------------------------------------------------------------------------------------------------------------+
| [Logo] DAW Visualizer | Project: "Synthwave_Track.als" | Lang: [VI/EN v] | [Undo] [Redo] | [EXPORT MP4]                        |
+--------------------------------------------------------------------------------------------------------------------------------+
+------------------------------------+ +------------------------------------------------------+ +--------------------------------+
| LEFT PANEL: ASSETS & TRACKS        | | CENTER: CANVAS VIEWPORT                              | | RIGHT: INSPECTOR               |
|                                    | | [Aspect 16:9 v] [Zoom 75% v]                         | |                                |
| [+] Import project file            | | [x] Grid 8 pt  [x] Smart Guides                      | | Selected: [Piano Roll #1]      |
|     (.als .rpp .dawproject .mid)   | | +--------------------------------------------------+ | |                                |
| [?] FL Studio: export MIDI first   | | | [Track Info]            [Event Counter]          | | | X: 120    Y: 300               |
|                                    | | |                                                  | | | W: 1680   H: 450               |
| Tracks discovered (3):             | | | ======== [Piano Roll] ==============             | | | Z-Index: 10                    |
| [x] Lead Synth (Track 1)           | | |                                                  | | |                                |
| [x] Bassline   (Track 2)           | | | [Live Trigger]  [Time/Bar]  [Chord]              | | | Pitch range:                   |
| [ ] Drum Kit   (Track 3)           | | | [Audio Spectrum / Meter]                         | | | (*) Fit to content             |
|                                    | | +--------------------------------------------------+ | | ( ) Custom octave              |
| Audio (optional):                  | | Mode: (o) Edit  ( ) Preview                          | |                                |
| [song_master.wav] (active)         | |                                                      | | Orientation:                   |
| Offset: [ 0.000 s ]                | |                                                      | | (*) Horizontal                 |
|                                    | |                                                      | | ( ) Vertical                   |
| Preset: [Vertical 9:16 v] [Save]   | |                                                      | |                                |
+------------------------------------+ +------------------------------------------------------+ +--------------------------------+
+--------------------------------------------------------------------------------------------------------------------------------+
| BOTTOM: TIMELINE & RANGE CONTROLLER                                                                                            |
| [Play/Pause] [|<] [>|]   Current: 01:24.500 / Total: 03:45.000 (Bar 34.2.048)           [x] Loop range                         |
| Chord lane:   |  Am  |  F   |  C   | D/F# |   (double-click to add an override)                                                |
| Timeline:     [====|=================[========================]=========================]                                      |
|               00:00             Range Start 00:45.000   Range End 01:45.000 (60 s)                                             |
+--------------------------------------------------------------------------------------------------------------------------------+
```

**Hai thẻ, một dữ liệu (D-57):** thẻ **Preview** và thẻ **Editor** không phải hai bộ dữ liệu mà là hai cách bày bảng trên cùng tài liệu, cùng lựa chọn và cùng lịch sử hoàn tác (giống workspace của phần mềm Adobe).
* **Preview:** sân khấu sạch (không khung chọn, không tay nắm), cột phong cách video, inspector chỉnh nhanh: Bài (kèm âm thanh) và Track (màu, mắt, solo, thứ tự). Đây là đường đi nhanh của người dùng Cơ bản. **Không có mục Hình thức** (chủ dự án chốt 2026-11-14): kiểu nốt là thuộc tính của Piano Roll nên chỉ chỉnh ở Editor.
* **Editor:** thêm danh sách Lớp, tay nắm trên khung, bắt dính; sau này thêm timeline có làn track, khoảng hiển thị (REQ-GRAPHICS-14) và keyframe. Bảng Thuộc tính đi theo widget đang chọn: tên widget đứng riêng ở đầu bảng ("Đang chọn"), mục 01 là **Vị trí và kích thước**; chọn Piano Roll thì mục **Hình thức** (kiểu nốt, phát sáng, bàn phím, vạch phát) đứng ngay sau mục Vị trí. Khi chưa chọn gì, bảng Thuộc tính có nút "Chỉnh hình thức nốt" chọn sẵn Piano Roll, để người mới không phải đoán chỗ.
* **Khoá:** khoá lớp ở danh sách Lớp của Editor; khoá track ở làn track trên timeline của Editor (làm cùng T-52). Preview không có khoá.
