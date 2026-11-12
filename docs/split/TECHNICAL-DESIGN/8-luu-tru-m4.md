---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "8. Lưu trữ ⚪ (M4)"
path: "8. Lưu trữ ⚪ (M4)"
chunk: 8-luu-tru-m4.md
source_lines: 185-190
source_sha1: 10dd2f7ff3
ids: [ERR_PRESET_INVALID]
---
## 8. Lưu trữ ⚪ (M4)
- **IndexedDB (Dexie):** bảng `workspace_state` (JSON Scene + cấu hình + tham chiếu Blob), bảng `blobs` (tệp dự án gốc, audio, ảnh nền, font). Ghi debounce 500 ms, trong giao dịch; lỗi ghi không được làm mất bản hợp lệ cuối. Khi `QuotaExceededError` hoặc còn < 50 MB: chỉ lưu JSON, báo cần nạp lại Blob.
- **Mở lại phiên:** phục hồi Blob → chạy lại `parseProject` (AST không lưu, luôn dựng lại từ nguồn để theo kịp bản parser mới) → áp Scene.
- **Preset `.json`:** `schemaVersion`; kiểm kiểu/khoảng giá trị, trường lạ bỏ, giá trị sai về mặc định kèm cảnh báo; không đọc được → `ERR_PRESET_INVALID`; `rotation ≠ 0` đưa về 0.
- **Project Pack `.zip`** (fflate): `preset.json` + tệp dự án + audio + font + ảnh nền + `manifest.json` (phiên bản, băm). Nhập pack cũng đi qua giới hạn giải nén của `parser-core`.
