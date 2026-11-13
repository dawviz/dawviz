---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)"
path: "9. PHỤ LỤC > Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)"
chunk: phu-luc-a1-ma-canh-bao-khi-doc-preset-scene-req.md
source_lines: 1113-1123
source_sha1: c62aee35b6
ids: [REQ-STORAGE-02, WARN_PRESET_UNSUPPORTED, WARN_PRESET_VALUE, WARN_PRESET_VERSION, WARN_PRESET_WIDGET_UNKNOWN]
---
### Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)

Mọi cảnh báo có `details.path` (đường dẫn JSON, ví dụ `$.widgets[1].properties.lookaheadSeconds`) và `details.value`.

| Mã | Ý nghĩa | Xử lý |
| :--- | :--- | :--- |
| `WARN_PRESET_VALUE` | Giá trị sai kiểu, ngoài khoảng, id trùng hoặc `pitchMin > pitchMax` | Dùng mặc định / kẹp / đổi id / đổi chỗ; preset vẫn nạp |
| `WARN_PRESET_WIDGET_UNKNOWN` | `type` không thuộc 8 loại hợp lệ | Bỏ widget đó |
| `WARN_PRESET_UNSUPPORTED` | Tính năng chưa có ở bản này (ví dụ ảnh nền khi chưa có tài nguyên phiên, biến đổi 3D trước 1.1). Trong mã hiện tại còn gồm hướng dọc/góc tự do của Piano Roll (T-59) và xoay widget (T-68) cho tới khi làm xong | Bỏ qua tính năng, vẽ như mặc định |
| `WARN_PRESET_VERSION` | Cùng phiên bản chính nhưng khác phiên bản phụ/vá | Đọc theo phiên bản hiện tại |
