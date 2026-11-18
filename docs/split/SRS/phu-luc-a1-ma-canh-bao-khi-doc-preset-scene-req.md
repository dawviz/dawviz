---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)"
path: "9. PHỤ LỤC > Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)"
chunk: phu-luc-a1-ma-canh-bao-khi-doc-preset-scene-req.md
source_lines: 1180-1196
source_sha1: 4a4e62e7ba
ids: [NFR-SEC-04, REQ-STORAGE-02, WARN_PACK_AUDIO_MISSING, WARN_PACK_NEWER_MINOR, WARN_PACK_UNLISTED_FILE, WARN_PRESET_MIGRATED, WARN_PRESET_UNSAFE_KEY, WARN_PRESET_UNSUPPORTED, WARN_PRESET_VALUE, WARN_PRESET_VERSION, WARN_PRESET_WIDGET_UNKNOWN, WARN_STORAGE_LOW]
---
### Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)

Mọi cảnh báo có `details.path` (đường dẫn JSON, ví dụ `$.widgets[1].properties.lookaheadSeconds`) và `details.value`.

| Mã | Ý nghĩa | Xử lý |
| :--- | :--- | :--- |
| `WARN_PRESET_VALUE` | Giá trị sai kiểu, ngoài khoảng, id trùng hoặc `pitchMin > pitchMax` | Dùng mặc định / kẹp / đổi id / đổi chỗ; preset vẫn nạp |
| `WARN_PRESET_WIDGET_UNKNOWN` | `type` không thuộc 8 loại hợp lệ | Bỏ widget đó |
| `WARN_PRESET_UNSUPPORTED` | Tính năng chưa có ở bản này (ví dụ ảnh nền khi chưa có tài nguyên phiên, biến đổi 3D trước 1.1). Trong mã hiện tại còn gồm hướng dọc/góc tự do của Piano Roll (T-59) | Bỏ qua tính năng, vẽ như mặc định |
| `WARN_PRESET_VERSION` | Phiên bản hiện tại (0.4) nhưng khác bản vá | Đọc theo phiên bản hiện tại |
| `WARN_PACK_NEWER_MINOR` | Project Pack do bản mới hơn (cùng phiên bản chính) tạo ra; trường lạ bị bỏ | Cập nhật ứng dụng nếu thiếu tính năng. |
| `WARN_PACK_UNLISTED_FILE` | Tệp trong gói không có trong manifest nên bị bỏ qua; `details.path` | Không cần làm gì. |
| `WARN_PACK_AUDIO_MISSING` | Manifest nêu âm thanh nhưng gói không có tệp đó | Nạp lại âm thanh. |
| `WARN_STORAGE_LOW` | Còn trống < 50 MB hoặc `QuotaExceededError`: chỉ lưu JSON, Blob cần nạp lại ở phiên sau | Giải phóng bộ nhớ hoặc lưu Project Pack. |
| `WARN_PRESET_MIGRATED` | Preset 0.3.x được di trú lên 0.4.0 (thêm `layout.anchor` = tâm); `details.from`, `details.to` | Dùng bản đã di trú; lưu lại để giữ. Preset dựng sẵn đã ở 0.4.0 nên không báo |
| `WARN_PRESET_UNSAFE_KEY` | Có khoá `__proto__`, `constructor` hoặc `prototype` ở bất kỳ độ sâu nào (NFR-SEC-04) | Bỏ khoá đó, giữ phần còn lại |
