---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "1. GIỚI THIỆU & MỤC TIÊU HỆ THỐNG"
path: "1. GIỚI THIỆU & MỤC TIÊU HỆ THỐNG"
chunk: 1-gioi-thieu-muc-tieu-he-thong.md
source_lines: 45-108
source_sha1: 7ab053e2fc
ids: [ARC-01, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, D-01, D-04, D-06, D-07, D-08, D-10, D-12, D-13, D-14, D-16, D-19, D-23, D-24, D-28, D-29, D-54, NFR-SEC-01, OI-08, REQ-EXPORT-00, REQ-GRAPHICS-03, REQ-GRAPHICS-15, REQ-PARSER-05, REQ-PARSER-06, REQ-UI-01, REQ-WIDGET-05]
---
## 1. GIỚI THIỆU & MỤC TIÊU HỆ THỐNG

### 1.1. Mục đích tài liệu
Tài liệu này đặc tả yêu cầu phần mềm cho **DAW Visualizer Studio**, triển khai các yêu cầu nghiệp vụ BR-01 đến BR-08 của BRD v0.2. Đây là căn cứ để lập trình viên (Front-end, Graphics, Audio/DSP) và QA triển khai, kiểm thử và nghiệm thu.

### 1.2. Phạm vi hệ thống
Ứng dụng web một trang (SPA) chạy 100% phía client trên trình duyệt desktop, chỉ cần static hosting (OBJ-2). Luồng công việc:

1. Đọc và phân tích tệp dự án (`.als`, `.alp`, `.rpp`, `.dawproject`, `.mid`) và parser JSON khai báo (nguồn nhị phân), không gửi dữ liệu lên máy chủ (BR-01, BR-08).
2. Chuẩn hóa sang **Unified Project AST**, bảo toàn Tick và Tempo Map (BR-01).
3. Canvas thiết kế theo độ phân giải logic, có **Smart Snapping** và 8 widget HUD; nhận diện hợp âm có sửa tay; audio tùy chọn (BR-02, BR-03, BR-04). Số widget: 8.
4. Tự động lưu phiên vào IndexedDB; xuất/nhập Preset và Project Pack (BR-05).
5. Render ngoại tuyến, ghép luồng bằng **WebCodecs** và **Mediabunny** để xuất MP4 (BR-06, BR-07).

### 1.3. Ngoài phạm vi phiên bản 1.0
Đồng bộ với BRD mục 4.2:

* **Chưa hỗ trợ** đọc trực tiếp `.flp` (FL Studio) và `.bwproject` gốc của Bitwig (định dạng nhị phân; engine schema nhị phân đã có, chờ file mẫu để viết schema, OI-08). Người dùng FL Studio nạp `.mid` xuất từ FL; người dùng Bitwig xuất `.dawproject` (D-19, REQ-UI-01).
* Đọc clip Session View của Ableton: chưa hỗ trợ (clip bị bỏ qua và được báo).
* Bộ tổng hợp âm thanh ảo (VST/Sampler) để phát tiếng từ nốt MIDI.
* Backend render video.
* Cắt ghép cảnh quay/clip video trên timeline. Lớp đồ hoạ, keyframe, timeline hiệu ứng thuộc phạm vi (D-54).
* Thư viện Preset/Parser tích hợp trong ứng dụng; v1.0 chia sẻ bằng file, thư viện thuộc v1.1 (D-14).
* Xoay 3D X/Y/Z và camera (1.1, REQ-GRAPHICS-15). Xoay 2D mọi widget có ở 1.0 (REQ-GRAPHICS-03, D-54).
* Giao diện thiết bị di động (D-12).
* Telemetry/analytics (D-13, NFR-SEC-01).

### 1.4. Định nghĩa và thuật ngữ

| Thuật ngữ | Giải thích |
| :--- | :--- |
| **AST** | Cấu trúc dữ liệu trung gian `UnifiedProjectAST` mà mọi parser phải xuất ra. |
| **Tick / PPQ** | Đơn vị thời gian theo nhịp. PPQ là số tick trên một phách (quarter note); nội bộ cố định **960** (D-08). |
| **Beat / Bar** | Phách / ô nhịp. Độ dài một beat theo mẫu số nhịp (REQ-WIDGET-05). |
| **TempoMap** | Danh sách điểm đổi tempo/nhịp dùng để quy đổi tick sang giây. |
| **HUD / Widget** | Thành phần đồ họa trên canvas (8 loại, mục 3.4). |
| **Design Resolution** | Kích thước canvas logic cố định theo tỉ lệ khung (D-06). |
| **Render Core** | Hàm vẽ thuần dùng chung cho Preview và Export (ARC-01). |
| **Playhead** | Vạch thời gian hiện tại, thuộc widget Piano Roll (D-07). |
| **Edit / Preview Mode** | Chế độ chỉnh sửa (có khung điều khiển) / chế độ xem trước giống video xuất. |
| **Export Range** | Đoạn thời gian được chọn để xuất (D-10). |
| **Pre-flight** | Bước kiểm tra điều kiện trước khi render (REQ-EXPORT-00). |
| **MuxerAdapter** | Lớp trừu tượng bọc thư viện ghép container, hiện dùng Mediabunny (D-04, R-07). |
| **Silent Audio** | Track âm thanh im lặng thêm vào MP4 khi không có audio nạp kèm (D-01). |
| **RM-1** | Máy chuẩn đo hiệu năng, định nghĩa ở mục 4.1 (D-16). |
| **Parser Library** | Bộ package `@dawviz/parser-*` đọc file DAW thành AST, độc lập với giao diện (D-23, mục 2.5). |
| **Live Pack (`.alp`)** | Gói Ableton định dạng `pl-a`: nhiều `.als` gzip + manifest JSON + sample (REQ-PARSER-06). |
| **tempoSource** | Cờ trong AST cho biết tempo lấy từ file, MIDI mặc định, giá trị dự phòng hay do người dùng nhập (D-24). |
| **Tempo Override** | Danh sách mốc BPM người dùng nhập, đặt theo giây hoặc beat (D-29). |
| **Binary Schema** | File JSON mô tả cấu trúc byte và ánh xạ sang AST cho định dạng nhị phân (REQ-PARSER-05, D-28). |

### 1.5. Tài liệu tham chiếu

* `BRD.md` (nguồn của mọi mã BR, OBJ, KPI, R, A, D, OI).
* `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md` (thư viện parser); `schemas/README.md` (đặc tả schema nhị phân); báo cáo Spike 1 và Spike 2 (`docs/spikes/SPIKE-1-EXPORT.md`, `docs/spikes/SPIKE-2-PARSER.md`).
* Đặc tả DAWproject (DAWproject Foundation) **[VERIFY]**; Standard MIDI File 1.0.
* Tài liệu WebCodecs, Mediabunny, @tonaljs/chord-detect, theo phiên bản chọn khi triển khai **[VERIFY]**.

### 1.6. Giả định và ràng buộc
Kế thừa BRD mục 6: **A-01** MP4 nên có track audio (kể cả im lặng), chưa có bằng chứng bắt buộc; **A-02** video chủ yếu ≤ 60–90 giây; **A-03** người dùng có desktop/laptop với Chromium mới và bộ mã hóa H.264; **A-04** người dùng chịu trách nhiệm bản quyền audio, ảnh nền, font.
**Ràng buộc:** không backend; không `eval`; chỉ desktop; dữ liệu người dùng ở lại trên máy (NFR-SEC-01).

---
