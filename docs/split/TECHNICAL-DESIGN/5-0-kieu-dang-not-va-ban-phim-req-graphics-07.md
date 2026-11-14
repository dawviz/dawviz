---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07)"
chunk: 5-0-kieu-dang-not-va-ban-phim-req-graphics-07.md
source_lines: 107-109
source_sha1: 49e19e4d81
ids: [REQ-GRAPHICS-07]
---
### 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07)
`packages/render-core/src/style.ts` giữ `NoteStyle`/`StyleConfig` (mặc định + ghi đè theo track), `resolveNoteStyle` (gộp và kẹp), `noteColor`, `STYLE_PRESETS`. `layoutPianoRoll` nhận `style` và `left` (chừa chỗ bàn phím) rồi trả `NoteRect` đã giải sẵn màu, độ đục, bán kính, phát sáng, viền; `drawPianoRoll` chỉ việc vẽ (đường dẫn bo góc bằng `arcTo`, phát sáng bằng `shadowBlur` rồi trả về 0). `layoutKeyboard`/`drawKeyboard` cùng trục cao độ, gọi sau Piano Roll. Giao diện (`StylePanel`, `TrackPanel`) chỉ sửa dữ liệu; tuỳ chọn lưu `localStorage` qua `lib/prefs.ts`.
