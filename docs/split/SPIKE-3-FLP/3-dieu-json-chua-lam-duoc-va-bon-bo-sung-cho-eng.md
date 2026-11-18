---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "3. Điều JSON chưa làm được và bốn bổ sung cho engine"
path: "3. Điều JSON chưa làm được và bốn bổ sung cho engine"
chunk: 3-dieu-json-chua-lam-duoc-va-bon-bo-sung-cho-eng.md
source_lines: 20-32
source_sha1: 8c83939972
ids: [D-28, WARN_FLP_CLIPS_SKIPPED]
---
## 3. Điều JSON chưa làm được và bốn bổ sung cho engine

FLP có **trạng thái ngầm**: nốt (`224`) thuộc "pattern hiện tại" đặt bởi sự kiện `65` đứng trước; tên (`203`) thuộc kênh hiện tại (`64`), nhưng sau `236` (bắt đầu mixer) cùng id `203` lại là tên khe hiệu ứng. Playlist chỉ *tham chiếu* pattern, nên nốt thật phải ghép (join) pattern với clip. Engine cũ chỉ có `each` một tầng và không nhớ gì giữa các phần tử mảng. Bổ sung (đều chung, có test ở `test/binary.test.js`, mô tả ở `schemas/README.md`):

| Bổ sung | Dùng để |
|---|---|
| `$last` trong phần tử mảng | mang "trạng thái chạy": `pat = id == 65 ? v : ($last.pat \|\| 0)` |
| `ast.index` (`list` / `collect` / theo khoá) | dựng bảng tra một lần, rồi `chName[ch]`, `notesBy[pattern*65536+rack]` thay vì quét lồng nhau |
| `inner` lồng trong `each` | kiểu flatMap: với mỗi clip, duyệt nốt của pattern nó trỏ tới |
| `ast.warnings[]`, `ast.sourceFormat`, `sourceVersion`, hàm `splitNum`, `basename` | báo điều bị bỏ (`WARN_FLP_CLIPS_SKIPPED`), ghi tên định dạng/phiên bản, đọc "12.3.0.72", lấy tên mẫu làm tên kênh dự phòng |

Mọi bổ sung giữ nguyên ràng buộc an toàn của D-28: không `eval`, hàm trong danh sách trắng, ngân sách phép tính, giới hạn nút và độ sâu. Mô hình trạng thái chạy không tốn bộ nhớ ngoài (mỗi sự kiện mang vài số nguyên).
