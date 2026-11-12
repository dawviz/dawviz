---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "5.1. Bố cục không gian làm việc"
path: "5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG > 5.1. Bố cục không gian làm việc"
chunk: 5-1-bo-cuc-khong-gian-lam-viec.md
source_lines: 894-926
source_sha1: d7467a1f28
ids: []
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
