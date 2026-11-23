---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "8. Lưu trữ 🟢 (M4, T-10)"
path: "8. Lưu trữ 🟢 (M4, T-10)"
chunk: 8-luu-tru-m4-t-10.md
source_lines: 469-475
source_sha1: 8cbe7fce2c
ids: [ERR_PRESET_INVALID, ERR_SCHEMA_NEWER, WARN_PRESET_MIGRATED]
---
## 8. Lưu trữ 🟢 (M4, T-10)
- **IndexedDB (Dexie):** bảng `workspace_state` (JSON Scene + cấu hình + tham chiếu Blob), bảng `blobs` (tệp dự án gốc, audio, ảnh nền, font). Ghi debounce 500 ms, trong giao dịch; lỗi ghi không được làm mất bản hợp lệ cuối. Khi `QuotaExceededError` hoặc còn < 50 MB: chỉ lưu JSON, báo cần nạp lại Blob.
- **Mở lại phiên:** phục hồi Blob → chạy lại `parseProject` (AST không lưu, luôn dựng lại từ nguồn để theo kịp bản parser mới) → áp Scene.
- **Preset `.json`** 🟢 (T-07, chi tiết ở 6.4): `schemaVersion` 0.5.0 (T-72 thêm `textStyles`, 5.9); kiểm kiểu/khoảng giá trị, trường lạ bỏ, giá trị sai về mặc định kèm cảnh báo; không đọc được → `ERR_PRESET_INVALID`; cũ hơn → di trú (`WARN_PRESET_MIGRATED`); mới hơn → `ERR_SCHEMA_NEWER`; khoá nguy hiểm bị bỏ; `rotation ≠ 0` đưa về 0 tới T-68. Lưu vào IndexedDB cùng workspace vẫn là M4.
- **Đã làm (T-10, 2026-11-18):** `lib/workspaceStore.ts` (bộ ghi `createSaver` với backend nhúng vào: Blob chỉ ghi khi chữ ký tập tệp đổi, `null` = bỏ Blob khi < 50 MB hoặc `QuotaExceededError`, một giao dịch Dexie; `createDebounced` 500 ms; `restoreWorkspace`), `lib/projectPack.ts` (fflate; giới hạn giải nén, băm, phiên bản), `lib/docSnapshot.ts` (Doc ⇄ JSON, kiểm khi nạp), `lib/session.ts` (nối App ↔ kho ↔ Pack), `lib/tempoRows.ts` (bảng tempo gõ → `tempoOverride`). Giao diện: `TempoPanel` (mục Bài), `SchemaPanel` (định dạng cần schema), `SessionSettings` (thẻ Cài đặt). Đổi tempo/schema phân tích lại cùng dự án nhưng giữ tài liệu (`load(..., {keep})`).
- **Project Pack `.zip`** (fflate): `preset.json` + tệp dự án + audio + font + ảnh nền + `manifest.json` (phiên bản, băm). Nhập pack cũng đi qua giới hạn giải nén của `parser-core`.
