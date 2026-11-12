---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "6. Kiểm thử thủ công trình duyệt"
path: "6. Kiểm thử thủ công trình duyệt"
chunk: 6-kiem-thu-thu-cong-trinh-duyet.md
source_lines: 82-89
source_sha1: 42e0660dc8
ids: [ERR_NO_NOTES]
---
## 6. Kiểm thử thủ công trình duyệt
1. `node scripts/bundle.mjs`; `python3 -m http.server` ở thư mục gốc; mở `/apps/parser-lab/`.
2. Chọn `Demo.als` → "Phân tích": kỳ vọng 11 track, 9605 nốt, 167 BPM, ~0,6 s.
3. Nhập BPM 100 → "Phân tích": kỳ vọng `tempo: user`.
4. "Liệt kê cấu trúc": dòng đầu `/Ableton ×1 …`.
5. "Tự kiểm tra MIDI tổng hợp": kỳ vọng ĐẠT 6/6.
6. Chọn `.RPP` chỉ có audio: kỳ vọng `ERR_NO_NOTES`. Console không có lỗi.
