---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "0. Trạng thái cài đặt (2026-11-22)"
path: "0. Trạng thái cài đặt (2026-11-22)"
chunk: 0-trang-thai-cai-dat-2026-11-22.md
source_lines: 5-11
source_sha1: 0045fe9aeb
ids: []
---
## 0. Trạng thái cài đặt (2026-11-22)

* **T-29 lõi:** `packages/expr` (zero-dependency) đúng §3–4: tokenizer chỉ nhận ASCII in được, parser Pratt, kiểm kiểu và số đối số lúc biên dịch, cây closure, giới hạn §3.4, hàm §3.3. Thêm so với §3.2: chú thích `//`; `vec2` viết `[x, y]` hoặc `vec(x, y)`; dấu trừ một ngôi đứng dưới `**` (`-2**2 = -4`). Chuỗi chỉ dùng làm tên hằng (chữ và số, ≤ 32 ký tự) và chỉ nhận ở đối số được khai báo (`ease`, `oscillate`, `loop`).
* **Cắm vào thuộc tính:** `WidgetSpec.animate[đường dẫn] = { expr: "…" }` (preset 0.7.0). Biến cấp cho biểu thức (`EXPR_VARS`): `t`, `time.sec|progress|duration`, `beat.phase|index`, `bar.phase|index|bpm`, `notes.count`, `note.velocity|pitch|hit|active`, `track.volume|pan`, `audio.level`, `value` (giá trị tĩnh của thuộc tính), `width`, `height`, `index`, `count`, `seed`. Chưa có: `layer.*`, `note.sinceEnd`, `valueAt`/`loop` đọc keyframe thật (một thuộc tính chỉ có một kiểu hoạt hình nên hiện trả `value`).
* **T-30 (một phần):** ngân sách bước cả khung trong `layoutFrame` (tất định; vượt thì giá trị tĩnh + `derived.onExprIssue`). Watchdog theo thời gian thật chưa làm.
* **T-31 (script):** `npm run preset:check`; phần hạ tầng GitHub là thủ công (T-16/T-39).
