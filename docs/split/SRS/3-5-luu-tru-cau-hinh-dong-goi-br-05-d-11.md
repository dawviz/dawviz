---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "3.5. Lưu trữ, cấu hình & đóng gói (BR-05, D-11)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.5. Lưu trữ, cấu hình & đóng gói (BR-05, D-11)"
chunk: 3-5-luu-tru-cau-hinh-dong-goi-br-05-d-11.md
source_lines: 577-646
source_sha1: 1654c314a5
ids: [BR-05, D-11, ERR_PRESET_INVALID, ERR_SCHEMA_NEWER, REQ-PARSER-00, REQ-STORAGE-01, REQ-STORAGE-02, REQ-STORAGE-03, REQ-STORAGE-04]
---
### 3.5. Lưu trữ, cấu hình & đóng gói (BR-05, D-11)

#### REQ-STORAGE-01: Tự động lưu (IndexedDB)
* Dùng Dexie.js, bảng `workspace_state`. Debounce: ghi sau 500 ms kể từ thao tác cuối.
* Lưu Blob của file dự án gốc, audio, ảnh nền, font.
* **Suy thoái khi thiếu dung lượng**: kiểm tra `navigator.storage.estimate()` định kỳ. Còn trống < 50 MB hoặc gặp `QuotaExceededError` thì chỉ lưu JSON trạng thái, bỏ Blob lớn và báo: "Bộ nhớ trình duyệt gần đầy: tệp âm thanh/dự án sẽ cần nạp lại ở phiên sau."
* Khi mở lại, nếu phục hồi được Blob thì tự dựng lại phiên; nếu thiếu Blob thì hiển thị danh sách file cần nạp lại.
* Ghi theo giao dịch; lỗi ghi không được làm mất bản lưu cuối còn hợp lệ.

#### REQ-STORAGE-02: Preset giao diện (`.json`)
Preset phải có `schemaVersion` và được kiểm tra schema khi nhập (kiểu, khoảng giá trị, danh sách `type` hợp lệ); trường lạ bị bỏ qua, giá trị sai bị đưa về mặc định kèm cảnh báo, preset không đọc được thì báo `ERR_PRESET_INVALID`. Ví dụ:

```json
{
  "schemaVersion": "0.3.0",
  "presetName": "Minimalist Cyberpunk Horizontal",
  "author": "System Default",
  "canvas": {
    "aspectRatio": "16:9",
    "designWidth": 1920,
    "designHeight": 1080,
    "backgroundColor": "#0d0f12",
    "backgroundImageData": null,
    "snapping": { "gridEnabled": true, "gridSize": 8, "smartGuidesEnabled": true }
  },
  "widgets": [
    {
      "id": "piano-roll-main",
      "type": "PIANO_ROLL",
      "zIndex": 10,
      "layout": { "x": 120, "y": 300, "width": 1680, "height": 450, "rotation": 0 },
      "trackMappingMode": "AUTO_ASSIGN_FIRST_MELODIC",
      "assignedTrackIndices": [0],
      "properties": {
        "orientation": "HORIZONTAL",
        "pitchRangeMode": "FIT_CONTENT",
        "lookaheadSeconds": 3.5,
        "playheadPositionRatio": 0.3,
        "noteBorderRadius": 4
      }
    },
    {
      "id": "chord-hud",
      "type": "CHORD_DETECTION",
      "zIndex": 20,
      "layout": { "x": 1400, "y": 800, "width": 400, "height": 180, "rotation": 0 },
      "properties": { "detectionMode": "SUSTAINED", "displaySlashChord": true, "fontSize": 48, "fontFamily": "Inter" }
    }
  ]
}
```

Giá trị `type` hợp lệ: `TRACK_INFO`, `PIANO_ROLL`, `EVENT_COUNTER`, `LIVE_TRIGGER`, `TIME_BAR`, `CHORD_DETECTION`, `AUDIO_SPECTRUM`, `PROGRESS_BAR`. Preset không chứa dữ liệu nhị phân lớn; ảnh nền nhúng (`backgroundImageData`) bị giới hạn 5 MB **[PROVISIONAL]**.

#### REQ-STORAGE-03: Project Pack (`.zip`)
Dùng fflate trong bộ nhớ; áp dụng giới hạn và kiểm tra đường dẫn của REQ-PARSER-00 khi nhập. Cấu trúc:

```text
ProjectPack/
├── manifest.json         # schemaVersion, tác giả, ngày xuất, danh sách file kèm băm
├── workspace_preset.json # bố cục và widget
├── overrides.json        # hợp âm sửa tay
├── source_project.*      # .als, .alp, .rpp, .dawproject hoặc .mid (và lựa chọn .als trong .alp, tempoOverride nếu có)
├── audio_track.*         # nếu có
└── assets/               # ảnh nền, font (nếu có)
```

#### REQ-STORAGE-04: Phiên bản lược đồ và di trú
Mỗi dữ liệu lưu (workspace, Preset, Project Pack) mang `schemaVersion`. Phiên bản mới hơn ứng dụng hiểu thì báo `ERR_SCHEMA_NEWER`; phiên bản cũ hơn thì tự di trú, giữ bản gốc đến khi di trú thành công.
