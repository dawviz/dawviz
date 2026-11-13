---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "6. MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU"
path: "6. MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU"
chunk: 6-ma-tran-truy-xuat-nguon-goc-yeu-cau.md
source_lines: 1025-1040
source_sha1: f3c5cc8778
ids: [BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, KPI-08, NFR-ACC-01, NFR-ACC-02, NFR-ACC-03, NFR-COMP-02, NFR-COMP-03, NFR-PERF-03, NFR-SEC-01, REQ-AST-01, REQ-CAP-01, REQ-EXPORT-00, REQ-EXPORT-03, REQ-EXPORT-05, REQ-GRAPHICS-00, REQ-GRAPHICS-04, REQ-PARSER-00, REQ-PARSER-05, REQ-STORAGE-01, REQ-UI-01, REQ-UI-02, REQ-UI-03, REQ-UI-05, REQ-UI-06, REQ-UI-07, REQ-UI-08, REQ-UI-09, REQ-WIDGET-01, REQ-WIDGET-06, REQ-WIDGET-07, REQ-WIDGET-08]
---
## 6. MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU

| Mã BRD | Yêu cầu nghiệp vụ | Mục tiêu & KPI | Yêu cầu SRS phụ trách | Thành phần |
| :--- | :--- | :--- | :--- | :--- |
| BR-01 | Đa dạng hóa đầu vào dự án | OBJ-1, OBJ-3, KPI-01 | REQ-PARSER-00 đến 07, REQ-AST-01, REQ-UI-01, REQ-UI-06, REQ-UI-07, REQ-UI-08, NFR-ACC-02 | Parse Worker, AST |
| BR-02 | Đồ họa tối giản, tùy biến cao | OBJ-1, KPI-04 | REQ-GRAPHICS-00 đến 05, REQ-WIDGET-01 đến 05, REQ-WIDGET-08, REQ-UI-02 | Render Core, Snapping Engine, Layer Manager |
| BR-03 | Nhận diện hợp âm có sửa tay | KPI-06 | REQ-WIDGET-06, REQ-UI-03, NFR-ACC-03 | ChordTimeline (Worker) |
| BR-04 | Tương thích âm thanh linh hoạt | KPI-02, KPI-03 | REQ-WIDGET-07, REQ-EXPORT-03, NFR-ACC-01 | Audio Analysis, AudioEncoder |
| BR-05 | Lưu trữ và chia sẻ tiện lợi | OBJ-3 | REQ-STORAGE-01 đến 04 | Dexie.js, fflate |
| BR-06 | Xuất video trực tiếp trên máy | OBJ-2, KPI-03, KPI-07 | REQ-CAP-01, REQ-EXPORT-00 đến 07, NFR-PERF-03, NFR-COMP-02 | Export Worker, Mediabunny |
| BR-07 | Nhanh và dễ dùng cho người mới | OBJ-1, KPI-04, KPI-05 | REQ-GRAPHICS-04, REQ-EXPORT-00 (Range), REQ-EXPORT-05, REQ-UI-05 | UI/UX, Timeline |
| BR-09 | Đa ngôn ngữ và cộng đồng dịch | OBJ-1, KPI-08 | REQ-I18N-01 đến 08, REQ-UI-09, NFR-COMP-03 | `@dawviz/i18n`, locales, bộ kiểm i18n |
| BR-08 | Riêng tư và an toàn | OBJ-2 | REQ-PARSER-00, REQ-PARSER-05, NFR-SEC-01 đến 04 | Sandbox Worker, CSP |

---
