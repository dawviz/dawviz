---
doc: SPIKE-1-EXPORT.md
doc_title: "Spike 1: Đường ống xuất video (Export Pipeline)"
section: "5. Đối chiếu với tài liệu v1.1"
path: "5. Đối chiếu với tài liệu v1.1"
chunk: 5-doi-chieu-voi-tai-lieu-v1-1.md
source_lines: 38-50
source_sha1: cbc774f4af
ids: [AT-05, BR-06, D-01, D-20, D-26, D-44, KPI-02, KPI-07, NFR-ACC-01, NFR-PERF-03, OI-02, REQ-EXPORT-00, REQ-EXPORT-03, REQ-EXPORT-04, REQ-GRAPHICS-04, REQ-GRAPHICS-05, SOI-03, SOI-10]
---
## 5. Đối chiếu với tài liệu v1.1

| Phát hiện | Đã ghi ở | Trạng thái |
|---|---|---|
| Tốc độ 2,4–2,65× thời gian thực (LOQ) | BRD KPI-07; SRS NFR-PERF-03 | ✅ Đã ghi; RM-1 thật vẫn cần đo (OI-02) |
| Max diff 57/255 Preview↔Export | SRS REQ-GRAPHICS-05, AT-05 | ✅ **Sửa ở v1.1:** trước đây AT-05 đòi ≤ 1/255, mâu thuẫn với số đo. Nay tách hai ngưỡng (cùng đường vẽ / khác đường vẽ), xem REQ-GRAPHICS-05 |
| `FontFace` trong Worker hoạt động | BRD D-20; SRS SOI-03 | ✅ **Cập nhật v1.1:** SOI-03 đạt trên Windows; còn macOS |
| Silent AAC lỗi encoder → mặc định TẮT | BRD D-01, A-01, R-04; SRS REQ-EXPORT-03 | ✅ Đã ghi |
| Tên tệp chốt trước khi render | BRD D-26; SRS REQ-EXPORT-04 | ✅ Đã ghi |
| Kích thước và tỉ lệ tuỳ ý | BRD D-26, BR-06; SRS REQ-EXPORT-00 | ✅ Đã ghi; **bổ sung v1.1:** khoá tỉ lệ, danh sách tỉ lệ dựng sẵn, neo theo cạnh khi đổi tỉ lệ (REQ-GRAPHICS-04) |
| A/V 0,00 ms desktop, −42,67 ms di động | BRD R-11, KPI-02, D-44; SRS NFR-ACC-01 | ✅ Đã ghi; di động chỉ để xem ở 1.2 |
| Fast-start `in-memory` đạt | SRS REQ-EXPORT-04, SOI-10 | ✅ Đã ghi; ghi đĩa + fast-start còn mở |
| Mã spike chưa vào monorepo | PROGRESS mục 1 | ⬜ Đưa vào ở M3 (T-09) |
