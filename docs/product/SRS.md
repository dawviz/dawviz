# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)
## DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)

**Phiên bản:** v1.1 (đồng bộ với BRD v1.1; phạm vi theo bản phát hành ở BRD §4.4)
**Tài liệu tham chiếu:** `BRD.md`; chi tiết thư viện parser: `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md`; báo cáo Spike 1 và Spike 2 (`docs/spikes/SPIKE-1-EXPORT.md`, `docs/spikes/SPIKE-2-PARSER.md`).

### Lịch sử phiên bản

| Phiên bản | Ngày | Nội dung thay đổi chính |
| :--- | :--- | :--- |
| v0.1 | 2026-11-10 | Bản đặc tả sơ bộ ban đầu. |
| v0.2 | 2026-11-11 | Tái cấu trúc bám sát BRD v0.2: ma trận truy xuất BR-01 đến BR-08; Bitwig chuyển sang `.dawproject` (D-03); Mediabunny qua `MuxerAdapter` (D-04); trục Tick trong Unified AST (D-08); hệ tọa độ thiết kế logic (D-06); chuỗi dự phòng codec (D-05); Silent Audio (D-01); Pre-flight (REQ-EXPORT-00); ngưỡng hiệu năng gắn Máy chuẩn RM-1 (D-16). **Rà soát kiến trúc:** thêm Render Core dùng chung, Export Worker, giới hạn bộ nhớ audio, CSP đầy đủ (mục 2.4, Phụ lục B). |
| v1.0 | 2026-11-12 | **Chốt đường cơ sở yêu cầu** sau Spike 1 và Spike 2 (xem BRD v1.0): thêm REQ-GRAPHICS-06 (độ sáng theo automation), track `mix`/`automation` trong AST, đọc envelope Reaper (REQ-RPP-07 của thư viện), mục 2.6 ngăn xếp giao diện và Render Core (D-34 đến D-36), AT-17 và AT-18, SOI-18/19. Mục còn [VERIFY] giữ nguyên làm Open Issue có chủ. |
| v0.3 | 2026-11-12 | **Bổ sung sau cùng:** đa ngôn ngữ ngay từ đầu (REQ-I18N-01 đến 08, REQ-UI-09, NFR-COMP-03 sửa, AT-16); ghi đè tempo có dấu nhịp và 3 cách nhập mốc (REQ-PARSER-07, REQ-UI-06, AT-13); đề xuất widget và dữ liệu bổ sung (mục 3.4b); `IGNTEMPO` có mẫu cú pháp từ tài liệu Reaper; trạng thái Spike 1 và Spike 2: hoàn thành (Phụ lục B). **Theo Spike 1:** Silent Audio mặc định TẮT (REQ-EXPORT-03); nhập rộng × cao và tỉ lệ tuỳ ý (REQ-EXPORT-00); tên file chốt trước khi render (REQ-EXPORT-04); số đo A/V và tốc độ xuất; giới hạn di động. **Theo Spike 2:** thư viện parser độc lập (mục 2.5); không đoán tempo, ghi đè tempo theo mốc (REQ-PARSER-07, REQ-UI-06); widget Progress Bar (REQ-WIDGET-08, nay 8 widget). **Theo thư viện parser đã dựng:** `.als` XML thuần hoặc Gzip, sửa công thức clip/loop và đường dẫn đã kiểm bằng file thật (REQ-PARSER-01); `.alp` thật định dạng `pl-a` và chọn `.als` (REQ-PARSER-06, REQ-UI-07); cập nhật `.rpp`, `.dawproject`, `.mid`; parser nhị phân theo schema (REQ-PARSER-05); giới hạn nạp cập nhật (REQ-PARSER-00); AST thêm trường (REQ-AST-01); `.flp`/`.bwproject` ghi *chưa hỗ trợ*; mã lỗi và vấn đề còn mở cập nhật. |
| v1.4 | 2026-11-13 | **Theo T-69 (preset "Bản in", D-51; `docs/design/UI-DIRECTION.md` mục 1.2):** REQ-GRAPHICS-07 thêm **màu nốt theo trạng thái** (đã phát / đang phát / sắp tới, mặc định `null` = giữ hành vi cũ); REQ-WIDGET-02 thêm cách nạp phông tự host và nguồn chữ của video; REQ-WIDGET-03 thêm **mẫu nhãn tự sửa** và số chữ số thập phân; REQ-WIDGET-04 thêm **kiểu một dòng ngang** kèm hậu tố tên track; REQ-WIDGET-05 thêm **định dạng chia nhóm có số 0 đứng đầu**, chú thích nhỏ và thanh tiến độ trong beat/bar; REQ-WIDGET-06 thêm tuỳ chọn **luôn hiện danh sách nốt kèm tên hợp âm**. Không đổi hành vi mặc định của các preset đã có. |
| v1.3 | 2026-11-13 | **Theo BRD v1.3 (D-55):** REQ-GRAPHICS-02 và §5.2: đường gióng dùng token `guide` của giao diện ứng dụng (mặc định `#008C9E`) thay cho `#FF5500`, vì cam trùng tông màu nhấn mặc định Studio cam (`docs/design/UI-DIRECTION.md` v0.5). |
| v1.2 | 2026-11-13 | **Theo BRD v1.2 (D-51…D-54):** REQ-GRAPHICS-03 mở **xoay 2D tự do mọi widget ở 1.0** (tay nắm xoay, bắt dính 15°, điểm neo, bắt dính theo khung bao và tâm), thay D-15; REQ-WIDGET-07 thêm **hướng cột** lên/xuống/trái/phải/đối xứng; REQ-UI-10 theme chỉ đổi màu (D-52); ngoài phạm vi làm rõ "cắt ghép clip video"; `WARN_PRESET_UNSUPPORTED` bỏ trường hợp xoay widget. |
| v1.1 | 2026-11-12 | **Chốt sau rà soát:** thêm §3.8 (REQ-GRAPHICS-09…13, REQ-STORAGE-05/06: easing, template nốt, hạt, storyboard, biểu thức, tài nguyên phiên, preset cộng đồng); NFR-SEC-05…07 (trình thông dịch biểu thức, CSP + Trusted Types + origin riêng, mức tin cậy preset); §3.4b chuyển từ đề xuất thành **phạm vi bản 1.0** (D-40); AT-19…AT-23; cập nhật §8: đóng SOI-01, SOI-08, SOI-12, SOI-13, SOI-14; mục cần dữ liệu thật theo Chương trình tệp mẫu (D-45); ID trùng `SOI-18` thứ hai đổi thành SOI-20. **Đối chiếu Spike 1** (`docs/spikes/`): REQ-GRAPHICS-05 tách ngưỡng cùng đường vẽ (≤ 1/255) và khác đường vẽ (theo số đo max diff 57/255; tiêu chí phần trăm điểm ảnh + PSNR, [PROVISIONAL]); AT-05 so ảnh trước mã hoá; SOI-03 đạt trên Windows; REQ-EXPORT-00 thêm giao diện chọn kích thước (khoá tỉ lệ, tỉ lệ dựng sẵn); REQ-GRAPHICS-04 thêm "Neo theo cạnh". **Bổ sung theo yêu cầu chủ dự án:** REQ-UI-10 (theme sáng/tối/theo hệ thống), REQ-UI-11 (bộ chọn màu HEX/RGB/RGBA/HSL/HSV/OKLCH, hút màu, nhập bảng màu), REQ-UI-12 (ẩn/hiện, solo track), REQ-GRAPHICS-14 (khoảng hiển thị theo thời gian, đổi track theo đoạn); REQ-GRAPHICS-07 thêm tuỳ chỉnh bàn phím và tên nốt trên phím; REQ-WIDGET-07 thêm tuỳ chỉnh hình dạng spectrum/waveform, nguồn stem theo track (1.2); REQ-GRAPHICS-06 giải thích đảo chiều và phân biệt với velocity. Thêm **REQ-AUDIO-01** (âm thanh theo track: người dùng xuất stem từ DAW, điều kiện tệp, tự ghép theo tên, chỉ dùng để phân tích, giới hạn bộ nhớ, hướng dẫn xuất stem trong ứng dụng; bản 1.2), `ERR_AUDIO_TOO_MANY`, AT-24. Thêm **REQ-GRAPHICS-15** (2.5D: xoay X/Y/Z, camera phối cảnh, preset góc nhìn; bản 1.1) và **REQ-EXPORT-08** (xuất nền trong suốt: chuỗi PNG, WebM VP9 alpha [VERIFY]; bản 1.0); REQ-GRAPHICS-03 mở khoá xoay từ 1.1 (D-47). REQ-EXPORT-08 thêm chọn lớp cho từng lần xuất (xuất nền và tiền cảnh riêng), "Xuất tách lớp" ở 1.1; REQ-GRAPHICS-15 thêm cách xử lý lớp nền khi xoay (mặc định gắn màn hình). Thêm **REQ-GRAPHICS-16** (thanh phát tuỳ chỉnh: kiểu, độ dày, màu, phát sáng, phản ứng khi chạm; sprite và keyframe ở 1.1), **góc chảy tự do 0–360°** trong REQ-WIDGET-01, **REQ-UI-13** (chế độ Cơ bản/Nâng cao, hỏi lần đầu, nút "Thêm tuỳ chọn" từng bảng, bảng phân bổ tính năng; D-48). **Bổ sung sau T-61 (lỗi tràn giao diện):** **REQ-UI-14** (danh sách track xếp Dọc/Ngang/Lưới, mật độ, sắp xếp/lọc/nhóm, vị trí bảng) và **REQ-UI-15** (mọi điều khiển kéo có ô nhập kèm: đơn vị, phép tính, tương đối, phạm vi mềm/giới hạn cứng), AT-25, D-49; thêm 2 dòng vào bảng phân bổ REQ-UI-13. **Bổ sung 2026-11-12 (D-50):** độ sáng nền REQ-GRAPHICS-06 mặc định **đều nhau**; thêm **REQ-GRAPHICS-17** (phát sáng động khi chạm theo velocity/cao độ/pan/fade/automation), **REQ-AST-02** (automation tổng quát: lane tuỳ ý gồm send, tham số plugin, MIDI CC, pitch bend; chuẩn hoá 0..1; điều khiển mọi thuộc tính qua bindings); REQ-UI-14 sửa (Lưới N cột do người dùng chọn có animation, Danh sách dạng dòng gọn); AT-26. |

### Quy ước trong tài liệu

* **[PROVISIONAL]**: giá trị tạm do nhóm soạn thảo chọn vì chưa có dữ liệu thực tế; cần đo hoặc review lại.
* **[VERIFY]**: cần đối chiếu với tài liệu chính thức hoặc file mẫu thật trước khi triển khai (R-10).
* **D-xx**, **OI-xx**, **BR-xx**, **OBJ-x**, **KPI-xx**, **R-xx**, **A-xx**: mã của BRD v0.2. **SOI-xx**: câu hỏi còn mở riêng của SRS (mục 8). **ARC-xx**: phát hiện từ rà soát kiến trúc (mục 2.4).
* **[ĐÃ KIỂM]** / **[ĐÃ ĐO]**: đã kiểm bằng file thật / số đo từ spike (v0.3).
* **REQ-xxx-nn**: yêu cầu chức năng. **NFR-xxx-nn**: yêu cầu phi chức năng. **ERR_xxx**: mã lỗi hiển thị cho người dùng (Phụ lục A).
* **"phải"** là bắt buộc; **"nên"** là khuyến nghị; **"có thể"** là tùy chọn. Đơn vị `pt` là điểm trên hệ tọa độ thiết kế logic (REQ-GRAPHICS-00), không phải điểm in ấn.

### Mục lục

1. Giới thiệu & mục tiêu hệ thống
2. Kiến trúc kỹ thuật, luồng dữ liệu & đánh giá kiến trúc
3. Yêu cầu chức năng chi tiết
4. Yêu cầu phi chức năng
5. Đặc tả giao diện & trải nghiệm người dùng
6. Ma trận truy xuất nguồn gốc yêu cầu
7. Điều kiện nghiệm thu và bàn giao
8. Các vấn đề còn mở của SRS
9. Phụ lục A (mã lỗi), Phụ lục B (ghi chú rà soát)

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

## 2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC

### 2.1. Kiến trúc phân tầng hệ thống

```text
+----------------------------------------------------------------------------------------+
| PRESENTATION LAYER (UI, main thread)                                                   |
|                                                                                        |
| +-------------------------+  +-------------------------+  +--------------------------+ |
| | Track Selector Dock     |  | Canvas (Edit / Preview) |  | Inspector Panel          | |
| +-------------------------+  +-------------------------+  +--------------------------+ |
|                                                                                        |
| +-------------------------+  +-------------------------+  +--------------------------+ |
| | Timeline / Range Bar    |  | Export Pre-flight + HUD |  | Preset Selector          | |
| +-------------------------+  +-------------------------+  +--------------------------+ |
+----------------------------------------------------------------------------------------+
                                    |  user actions  v
+----------------------------------------------------------------------------------------+
| EDITOR & STATE (main thread)                                                           |
|                                                                                        |
| +----------------------------------------+  +----------------------------------------+ |
| | Project Document Store                 |  | Undo / Redo (50 steps)                 | |
| | - layout, overrides, settings          |  | - patch-based history                  | |
| | - serializable, versioned              |  | - covers layout + overrides            | |
| +----------------------------------------+  +----------------------------------------+ |
|                                                                                        |
| +----------------------------------------+  +----------------------------------------+ |
| | Snapping Engine                        |  | Layer Manager (D-07)                   | |
| | - Smart Guides <= 5 pt                 |  | - independent zIndex per widget        | |
| | - Grid 8 / 16 pt, Equal Spacing        |  | - overlay: Edit Mode only              | |
| +----------------------------------------+  +----------------------------------------+ |
+----------------------------------------------------------------------------------------+
                                   |  document state  v
+----------------------------------------------------------------------------------------+
| RENDER CORE (shared, pure, no DOM access)  [ARC-01]                                    |
|                                                                                        |
| renderFrame(document, derivedData, t, target, scale)                                   |
| - ONE code path for Preview (Canvas) and Export (OffscreenCanvas)                      |
| - random-access: state at time t comes from AST + caches, never incremental            |
| - Viewport Logical Scale (D-06): 1920x1080 / 1080x1920 / 1080x1080 x scale S           |
| - derivedData = Unified AST (D-08) + ChordTimeline (D-09) + AudioAnalysis (D-10)       |
+----------------------------------------------------------------------------------------+
              ^  AST, chords, audio cache     |     frames + audio -> MP4  v
+----------------------------------------------------------------------------------------+
| WORKERS (sandboxed, no network)                                                        |
|                                                                                        |
| +----------------------------------------+  +----------------------------------------+ |
| | PARSE & ANALYSIS WORKER (R-09)         |  | EXPORT WORKER (D-04, D-05)  [ARC-02]   | |
| |                                        |  |                                        | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | | .als (XML|Gzip), .alp (pl-a), .rpp | |  | | Frame clock + OffscreenCanvas      | | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | | .dawproject (ZIP + XML), .mid      | |  | | VideoEncoder (H.264 / VP9)         | | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | | Declarative JSON: binary (D-28)    | |  | | AudioEncoder (AAC/Opus) | none    | | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | | ChordTimeline builder (D-09)       | |  | | MuxerAdapter (Mediabunny)          | | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| | | Audio decode + FFT / peak (D-10)   | |  | | Writer: file stream or Blob        | | |
| | +------------------------------------+ |  | +------------------------------------+ | |
| +----------------------------------------+  +----------------------------------------+ |
+----------------------------------------------------------------------------------------+
                            ^  load            |  autosave  v
+----------------------------------------------------------------------------------------+
| STORAGE & PERSISTENCE LAYER (D-11)                                                     |
|                                                                                        |
| +----------------------------------------+  +----------------------------------------+ |
| | IndexedDB (Dexie.js)                   |  | fflate ZIP / JSON                      | |
| | - session + Blobs                      |  | - Project Pack (.zip)                  | |
| | - quota degradation                    |  | - Preset (.json), schema-checked       | |
| +----------------------------------------+  +----------------------------------------+ |
+----------------------------------------------------------------------------------------+
```

Điểm khác so với bản nháp trước: thêm tầng **Render Core** dùng chung (ARC-01), tách **Export Worker** khỏi luồng giao diện (ARC-02), và gom việc phân tích audio/hợp âm vào Worker (ARC-04).

### 2.2. Luồng dữ liệu chính

1. **Nạp**: kéo thả file; kiểm tra kích thước, định dạng (REQ-UI-01); chuyển cho Parse Worker (REQ-PARSER-00).
2. **Phân tích**: parser xuất `UnifiedProjectAST` và qua bước xác thực (REQ-AST-01); lỗi trả mã `ERR_*`.
3. **Tiền xử lý** (trong Worker): tính `ChordTimeline` (REQ-WIDGET-06), phân tích audio nếu có (REQ-WIDGET-07), áp preset mặc định (REQ-GRAPHICS-04).
4. **Thiết kế**: chỉnh bố cục ở Edit Mode, xem ở Preview Mode; tự động lưu (REQ-STORAGE-01).
5. **Xuất**: Pre-flight (REQ-EXPORT-00) → Export Worker dựng khung bằng Render Core (REQ-EXPORT-01) → mã hóa → ghép container → tải về (REQ-EXPORT-04).

### 2.3. Thành phần bên thứ ba

| Thành phần | Vai trò | Ghi chú |
| :--- | :--- | :--- |
| @dawviz/parser-* | Đọc `.als/.alp/.rpp/.dawproject/.mid` và binary theo schema; zero-dependency; bản bundle một file cho Worker | Tự giải nén bằng `DecompressionStream` (D-23, mục 2.5). |
| Mediabunny | Ghép luồng MP4/WebM | Thay `mp4-muxer` đã deprecated (D-04); bọc sau `MuxerAdapter` (R-07). |
| WebCodecs API | Mã hóa video/audio | Phụ thuộc trình duyệt và hệ điều hành (R-06). |
| React, Vite, Tailwind CSS, Framer Motion | Giao diện ứng dụng (D-34) | Chỉ ở `apps/web`; khung hình xuất không dùng React hay Framer Motion. |
| @dawviz/render-core | Bố cục + vẽ khung hình thuần theo `t` (ARC-01) | Hàm thuần, TypeScript, không phụ thuộc DOM (D-36). |
| fflate | Nén/giải nén ZIP | Cho Project Pack; parser file dự án không dùng fflate. |
| Dexie.js | Bao bọc IndexedDB | Tự động lưu phiên (REQ-STORAGE-01). |
| @tonaljs/chord-detect | Nhận diện hợp âm | Động cơ cốt lõi cho REQ-WIDGET-06 (OI-05). |

Giấy phép thư viện và font đóng gói kèm phải được rà soát (OI-07).

### 2.4. Đánh giá kiến trúc hiện tại

**Kết luận:** kiến trúc phân tầng (UI → Document → Render → Worker → Storage) **đúng hướng** và đủ cho phạm vi v1.0, nhưng bản nháp trước còn 7 điểm cần sửa. Các điểm 1–4 nên chốt trước khi viết code vì ảnh hưởng cấu trúc; 5–7 có thể xử lý trong lúc triển khai.

| Mã | Mức | Vấn đề ở bản nháp trước | Chỉnh sửa trong v0.2 |
| :--- | :--- | :--- | :--- |
| **ARC-01** | Cao | Chưa có tầng vẽ dùng chung. Preview và Export dễ vẽ khác nhau (font, FFT, làm tròn), phá nguyên tắc WYSIWYG (D-06) và đồng bộ hình-tiếng. | Thêm Render Core: một hàm thuần `renderFrame(...)` chạy trên `Canvas` (Preview) và `OffscreenCanvas` (Export), truy cập ngẫu nhiên theo thời gian `t` (REQ-GRAPHICS-05). |
| **ARC-02** | Cao | Vòng render xuất chạy ở đâu không rõ; nếu ở luồng chính, giao diện đứng hình và bị trình duyệt giảm tốc khi chuyển tab. | Export Worker riêng gồm khung vẽ, encoder, muxer; luồng chính chỉ nhận tiến độ và gửi lệnh hủy (REQ-EXPORT-07). |
| **ARC-03** | Cao | `AudioBuffer` giải mã toàn bộ file 300 MB có thể chiếm hàng GB PCM, mâu thuẫn NFR-PERF-04 (≤ 2 GB). | Giới hạn thời lượng giải mã, cache phân tích dạng mono, mã hóa audio theo từng khối (REQ-WIDGET-07, REQ-EXPORT-03). |
| **ARC-04** | Trung bình | `ChordTimeline` và phân tích audio không có chỗ chạy, dễ chặn UI với file lớn. | Chạy trong Parse & Analysis Worker, trả kết quả dạng cấu trúc đã xác thực. |
| **ARC-05** | Trung bình | Trạng thái lẫn lộn giữa "Session State" và dữ liệu dẫn xuất; Undo/Redo không rõ phạm vi. | Tách **Project Document Store** (nguồn sự thật, tuần tự hóa được, có phiên bản) khỏi **Derived Data** (AST, chord, audio cache; tái tạo được, không đưa vào Undo). |
| **ARC-06** | Trung bình | `FFT` dùng `AnalyserNode` ở Preview thì không tái lập được khi xuất. | FFT tự cài, tất định, tính từ PCM tại thời điểm `t` cho cả Preview và Export (REQ-WIDGET-07). |
| **ARC-07** | Thấp | CSP bản nháp chặn ảnh/font từ `blob:`/`data:` mà ứng dụng cần; font ngoài (Google Fonts) vi phạm "không mạng". | CSP đầy đủ ở NFR-SEC-03; font đóng gói cục bộ. |

Đề xuất bổ sung vào Nhật ký quyết định BRD: **D-20** (Render Core dùng chung), **D-21** (Export chạy trong Worker), **D-22** (FFT tất định, không dùng `AnalyserNode`).

### 2.5. Thư viện parser độc lập (D-23)

Logic đọc file DAW nằm trong monorepo `packages/*`, không phụ thuộc giao diện:

| Package | Nội dung |
| :--- | :--- |
| `@dawviz/parser-core` | lỗi, giới hạn, giải nén streaming, ZIP, bộ quét XML, bản đồ tempo, dựng và xác thực AST, `compareAST` |
| `@dawviz/parser-midi` | `.mid` |
| `@dawviz/parser-als` | `.als`, `.alp` (`parseAlp`, `listAlp`) |
| `@dawviz/parser-rpp` | `.rpp` |
| `@dawviz/parser-dawproject` | `.dawproject` |
| `@dawviz/parser-binary` | parser nhị phân theo JSON schema |
| `@dawviz/parser` | `detectFormat`, `parseProject(name, buffer, options)` |

Ứng dụng nạp `dist/dawviz-parser.bundle.js` (một file ES module, vì module Worker không dùng được import map). Tuỳ chọn: `title`, `showMuted`, `tempoOverride`, `limits`, `schemas`, `files/resolveFile` (Reaper), `alsName/alsIndex` (`.alp`). Đầu ra: `{ast, warnings, info, format}`. Lõi thư viện không tính `chordTimeline`; việc này thuộc Parse & Analysis Worker (ARC-04). Chi tiết: `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md`; CLI `bin/dawparse.mjs`; trang kiểm thử `apps/spike-parser/`.

### 2.6. Ngăn xếp giao diện, Render Core và cấu trúc kho mã (D-34, D-35, D-36)

* **Phân lớp:** `@dawviz/parser-*` (JS) → AST → `@dawviz/render-core` (TS, hàm thuần `layout(AST, cấu hình, t)` rồi `draw(ctx, ...)`) → `apps/web` (React). Render Core không biết React; giao diện chỉ giữ trạng thái (tệp, cấu hình, đồng hồ `t`) và gọi Render Core. Preview (Canvas trong trang) và Export (OffscreenCanvas trong Worker) gọi **cùng** hàm vẽ, nên khớp khung hình (AT-05).
* **Worker:** phân tích dự án chạy trong Web Worker; giao diện nhận AST và danh sách cảnh báo/lỗi theo mã rồi dịch (REQ-I18N-04).
* **Chuyển động:** Framer Motion chỉ cho phần giao diện (khung thả file, thông báo, danh sách track). Mọi chuyển động trong khung hình video là hàm của `t` do Render Core tính, không phụ thuộc đồng hồ giao diện.
* **Kiểm thử:** Render Core và logic thuần kiểm bằng `node --test` (không cần trình duyệt); thành phần giao diện bằng Vitest + Testing Library; kiểm tra cuối trong Chrome thật. Chi tiết trong `docs/design/TDD.md`.
* **Kho mã:** monorepo (D-35); `docs/` chứa BRD/SRS (sản phẩm), SDD/TDD (ứng dụng) và `parser/` (thư viện parser); `npm run docs:split` sinh các mảnh nhỏ cho AI tham chiếu.


---

## 3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08)

#### REQ-PARSER-00: Thực thi an toàn và giới hạn đầu vào (R-05, R-09)
* Parser phải chạy trong Web Worker, không chạm DOM trang chính và không có kết nối mạng.
* Giới hạn tệp nạp **[PROVISIONAL]**: dự án/nén ≤ 100 MB; audio ≤ 300 MB. Vượt thì báo `ERR_FILE_TOO_LARGE` trước khi đọc nội dung. Gói `.alp` chứa sample nên thường lớn (mẫu thật 65 MB); thư viện chỉ giải nén các `.als`, không đụng tới sample.
* Chống zip-bomb **[PROVISIONAL]**: tỉ lệ giải nén ≤ 1:30; tổng kích thước giải nén ≤ **300 MB** (hạ từ 500 MB vì giới hạn độ dài chuỗi của V8 khi giải mã UTF-8); số entry ZIP ≤ 20,000. Vượt thì `worker.terminate()` và báo `ERR_ARCHIVE_TOO_LARGE`. Việc giải nén phải đếm byte khi đang giải, không tin kích thước khai báo trong header.
* Độ sâu lồng XML/JSON ≤ 64 cấp; số nút XML ≤ 5,000,000; số dòng `.rpp` ≤ 5,000,000; schema nhị phân: ≤ 5,000,000 nút, sâu ≤ 64 **[PROVISIONAL]**.
* XML: không mở rộng DOCTYPE/entity (chống XXE, billion laughs). Giải nén dùng `DecompressionStream`; không hỗ trợ ZIP64 và entry mã hóa (báo `ERR_ARCHIVE_INVALID`). Môi trường thiếu `DecompressionStream` báo `ERR_NO_SUPPORTED_ENV`. **[ĐÃ KIỂM]** bằng test gzip-bomb, zip-bomb, zip-slip, XXE (docs/TDD.md).
* Timeout 10 giây; quá hạn thì ngắt Worker và báo `ERR_PARSER_TIMEOUT`.
* Với ZIP (`.dawproject`, Project Pack): từ chối đường dẫn chứa `..`, đường dẫn tuyệt đối hoặc ký tự điều khiển (chống zip-slip) và báo `ERR_ARCHIVE_INVALID`.

#### REQ-PARSER-01: Ableton Live (`.als`)
Đã đối chiếu bằng file thật: Live 9.1 (`MinorVersion 9.0_305`, XML thuần và trong `.alp`) và Live 12.4.16 (Gzip) **[ĐÃ KIỂM]**; các mục còn **[VERIFY]** được nêu riêng bên dưới.

* **Container**: nhận XML thuần **hoặc** Gzip bằng magic bytes (`1F 8B` hoặc văn bản XML), không dựa vào đuôi file. Giải nén bằng `DecompressionStream` (REQ-PARSER-00). Phân tích XML bằng bộ quét tự cài, chạy trong Worker, bỏ qua cả cây con không cần (`Devices`, `AudioTrack`, `ClipSlotList`, ...).
* **Tempo**: `Ableton > LiveSet > MasterTrack` hoặc `MainTrack` (Live 12) `> DeviceChain > Mixer > Tempo`; giá trị đầu từ sự kiện `FloatEvent` có `Time < 0`, nếu không có thì `Manual@Value`; thay đổi tempo từ `ArrangerAutomation/Events` (Live 9) hoặc `AutomationEnvelopes` tra theo `AutomationTarget@Id` (Live 10+). Đoạn dốc tempo nội suy tuyến tính theo beat bằng các bước nhỏ (`WARN_TEMPO_RAMP`) **[VERIFY SOI-06]**. Không tìm thấy tempo thì **không** tự gán 120 BPM: xem REQ-PARSER-07.
* **Nhịp**: `TimeSignature` là số enum: `numerator = (v mod 99) + 1`, `denominator = 2^floor(v/99)` (201 = 4/4) **[VERIFY: suy từ một mẫu; cần mẫu nhịp khác 4/4]**. Không thấy thì 4/4 kèm cảnh báo.
* **Track**: `Ableton > LiveSet > Tracks > MidiTrack`; tên từ `Name/EffectiveName`. Track tắt tiếng khi `Speaker/Manual = false`; track này vẫn nằm trong AST với `isVisible = false` trừ khi người dùng bật hiển thị track ẩn.
* Chỉ đọc clip trong **Arrangement** (`ArrangerAutomation > Events > MidiClip`). Clip Session View bị bỏ qua, được đếm và báo bằng cảnh báo `WARN_SESSION_CLIPS_IGNORED`; nếu Arrangement không có nốt mà Session có clip thì `ERR_NO_NOTES` nêu rõ lý do. Đơn vị thời gian của `.als` là beat. Nốt `IsEnabled="false"` bị bỏ qua.
* **Mô hình phát clip** (thay công thức v0.2; v0.2 thiếu `StartRelative` và không mô tả cắt nốt):

```text
điểm bắt đầu phát trong clip = Loop.LoopStart + Loop.StartRelative
lượt phát k: gốc tick = (passBase + (Note.Time - passFrom)) * 960
            lượt 1: passBase = Clip.CurrentStart, passFrom = LoopStart + StartRelative
            lượt kế (chỉ khi Loop.LoopOn): passBase += LoopEnd - passFrom, passFrom = LoopStart
nốt chỉ được lấy khi passFrom <= Note.Time < LoopEnd; bỏ nếu start >= CurrentEnd; end = min(start + Duration, hết lượt, CurrentEnd)
```

  Với clip không lặp và `StartRelative = 0` công thức rút về `(CurrentStart + Time - LoopStart) * 960` như v0.2. **[ĐÃ KIỂM]** trên Live 12.4 (9605 nốt, đối chứng độc lập từng nốt); nhánh lặp và `StartRelative ≠ 0` mới kiểm bằng dữ liệu tổng hợp **[VERIFY]**.
* Nốt từ `KeyTracks > KeyTrack`: `MidiKey`, `MidiNoteEvent@Time/Duration/Velocity`.

#### REQ-PARSER-02: Cockos Reaper (`.rpp`)
**[ĐÃ KIỂM]** trên 2 dự án Reaper 7.85 có MIDI nhúng (một track 3,147 nốt; 107 item, 96 nguồn MIDI, nhiều take/loop/pooled/SOFFS cho 7,497 nốt, khớp đối chứng độc lập) và 5 template. Reaper **nhúng MIDI trực tiếp** trong `<SOURCE MIDI>` kể cả khi import `.mid` nhiều track và chọn mở rộng thành nhiều track; không tham chiếu `.mid` ngoài trong các mẫu này.

* Tokenizer duyệt từng dòng, khối lồng `<TAG ... >`; giữ thứ tự dòng/khối con để chia take.
* Tempo: `TEMPO bpm num denom`; envelope `TEMPOENV*` (`ACT`, `PT time bpm shape [sig]`): shape 1 = giữ, khác = dốc tuyến tính (đường cong xấp xỉ, `WARN_TEMPO_SHAPE`); nhịp đóng gói trong trường thứ 5 (`num = v & 0xFFFF`, `den = v >>> 16`) **[VERIFY]**.
* Mỗi `<TRACK>`: tên từ `NAME`; `MUTESOLO` ≠ 0 coi là tắt tiếng. Item `MUTE 1` bị bỏ (`WARN_RPP_MUTED_ITEMS`).
* **Nhiều take**: dùng take `TAKE SEL`, không có thì take đầu.
* Item có `<SOURCE MIDI>`: `POSITION` và `LENGTH` tính bằng **giây**, quy đổi sang tick qua TempoMap; `LOOP 1` nhân bản nguồn theo độ dài nguồn đến hết item (`WARN_RPP_LOOPED_ITEMS`); `SOFFS` coi là quarter-note **[VERIFY: đối chứng độc lập dùng cùng giả định]**; `IGNTEMPO 1 <bpm> <num> <den>` (bỏ qua tempo dự án, nguồn chạy theo BPM riêng) dùng thời gian tuyệt đối theo giây **[ĐÃ KIỂM bằng dự án thật BigProject4b: nhịp 12/8, nguồn 180 BPM → 110,6 s; khớp thước kẻ và mật độ nốt trong ảnh Reaper; chưa có đối chứng độc lập từng nốt]**; `POOLEDEVTS` (cùng GUID) dùng lại sự kiện của nguồn đã có.
* PPQ lấy **động** từ `HASDATA 1 <ppq> QN` (480, 960, 1920… do Preferences của Reaper; **[ĐÃ KIỂM]** BigProject4 dùng 480, BigProjectDemo2 dùng 960, cùng bản nhạc cho cùng 3,147 nốt); quy đổi `tick * 960 / ppq`. **Guard clause**: đơn vị khác `QN` (hoặc PPQ không phải số nguyên 1–65535) thì không đoán: bỏ nguồn MIDI đó, báo `WARN_RPP_SRC_UNIT` kèm hướng dẫn lưu lại dự án bằng Reaper bản mới, và `ERR_NO_NOTES` nêu rõ lý do nếu không còn nốt nào.
* Sự kiện `E <delta> <status> <d1> <d2>` (hex, `e` cũng hợp lệ; `Em` = sự kiện tắt tiếng bị bỏ). `delta` cộng dồn. Ghép cặp như REQ-PARSER-04. Bỏ CC, SysEx.
* **Nguồn `.mid` ngoài** (`FILE`): đọc qua `options.files` hoặc `resolveFile(path, base)`; thiếu file thì `WARN_RPP_EXTERNAL_MIDI` và, nếu không còn nốt nào, `ERR_NO_NOTES` kèm danh sách file thiếu. **[ĐÃ KIỂM]** bằng dự án thật `BigProject3.rpp` (Reaper 7.85, `FILE "Media\Oboe MIDI 001.mid" QN`) và file `.mid` kèm theo: 3,147 nốt, trùng đọc trực tiếp `.mid`. Tên file đối chiếu không phân biệt hoa/thường và coi khoảng trắng ≡ gạch dưới. `listExternalMidi`/`probeProject` cho biết trước tên file cần để giao diện chỉ hiện ô nạp `.mid` khi dự án thật sự tham chiếu (REQ-UI-08).
* `PROJOFFS ≠ 0` chưa áp dụng (cảnh báo).
* **Envelope tự động hoá** (v0.3): envelope **track** `VOLENV2` (âm lượng, ưu tiên hơn `VOLENV`), `PANENV*`, `MUTEENV` được đọc thành `track.automation` (điểm `PT` giây → tick qua TempoMap, hình dạng 0–5, tension bezier) cùng mức fader tĩnh `VOLPAN` → `track.mix`. **[ĐÃ KIỂM]** BigProject4b so với số đọc trên giao diện Reaper: 2,920 s → −25,3 dB (parser −25,36), ≈1,98 s → −15,3 dB (−15,04); nội suy volume trong không gian fader `gain^0,25` (**[VERIFY]**, suy từ 2 điểm; nội suy tuyến tính theo biên độ sai tới 2,6 dB). Pan và mute lưu **giá trị thô**: chiều của pan và nghĩa giá trị mute chưa kiểm **[VERIFY]**. Envelope trong item/take, trước FX trùng loại, `WIDTHENV*` chưa đọc, báo `WARN_RPP_ENVELOPES_IGNORED` (chỉ đếm envelope không đọc được), `WARN_RPP_ENVELOPE_SHAPE_APPROX`; đoạn cong báo `WARN_RPP_ENVELOPE_SHAPE_APPROX`. Tempo envelope đọc riêng; `TEMPOENVEX` không có điểm thì không ảnh hưởng.

#### REQ-PARSER-03: DAWproject (`.dawproject`, D-03)
Cấu trúc XML cần đối chiếu đặc tả chính thức và file mẫu **[VERIFY]** (OI-01, SOI-04). Định dạng do Bitwig Studio và PreSonus Studio One xuất.

* Giải nén ZIP trong bộ nhớ; bắt buộc có `project.xml` (thiếu thì `ERR_ARCHIVE_INVALID`); `metadata.xml` tùy chọn (`Title`, `Artist`).
* Transport: đọc tempo và time-signature.
* Track: chỉ lấy track có `contentType` chứa `notes` **[VERIFY]**.
* Clip và nốt: `time`, `duration`, `playStart`, `loopStart`, `loopEnd`, `contentTimeUnit`; `Note@time/duration/key/vel/channel`. `vel` trong 0–1 nhân 127 (lớn hơn 1 coi là thang 127). Đơn vị `beats` nhân 960; `seconds` quy đổi qua TempoMap (`WARN_TIME_UNIT_MIXED` khi trộn). Clip lồng clip được đệ quy; `playStart` bỏ nốt trước điểm bắt đầu; `loopStart/loopEnd` lặp đến hết clip.
* Track nốt: `contentType` chứa `notes`, loại kênh `role="master"`. Mute từ `Channel/Mute@value`.
* Tempo: `Transport/Tempo@value`; tempo/nhịp automation (`TempoAutomation`, `TimeSignatureAutomation`) **[VERIFY SOI-06]**; tempo tính bằng giây chưa hỗ trợ.
* **[ĐÃ KIỂM]** với ví dụ `project.xml` chính thức của Bitwig 5.0 (149 BPM, 9 nốt); chưa có `.dawproject` xuất thật (SOI-04).

#### REQ-PARSER-04: Standard MIDI File (`.mid`, format 0/1)
* Đọc `MThd`: `format`, `track_count`, `division`. `division` dạng SMPTE thì báo `ERR_UNSUPPORTED_FORMAT`.
* Mỗi `MTrk`: giải mã Variable-Length Quantity; hỗ trợ Running Status.
* Meta-event: `0x51` Set Tempo (`BPM = 60,000,000 / µs mỗi quarter note`), `0x58` Time Signature, `0x03` Track Name.
* Ghép cặp theo khóa `(channel << 8) | pitch`; Note-On velocity 0 xử lý như Note-Off. Khi cùng khóa có nhiều Note-On chồng, ghép theo FIFO.
* Phục hồi nốt treo: thiếu Note-Off thì kéo dài đến cuối track.
* Format 1: gộp mọi track vào một TempoMap lấy từ track tempo (thường track đầu). Format 0: tách track theo kênh MIDI (kênh 10 gắn nhãn drums).
* File không có Set Tempo: theo chuẩn SMF dùng 120 BPM nhưng **gắn cờ** `tempoSource = 'midi-default'` kèm `WARN_TEMPO_MIDI_DEFAULT` để người dùng ghi đè (REQ-PARSER-07). File cụt đọc phần hợp lệ (`WARN_MIDI_TRUNCATED`).

#### REQ-PARSER-05: Parser JSON khai báo (D-18, D-28, R-05)
* Chỉ nhận cấu hình JSON tĩnh, kiểm tra bằng bộ kiểm tra không sinh mã động; cấm `eval`/`new Function`.
* **Nguồn nhị phân (đã triển khai, D-28)**: schema `schemaVersion: 1` mô tả cấu trúc byte (số nguyên/float big/little endian, VLQ, LEB128, chuỗi, mảng, `struct`, `switch`, vùng `length`, `when`, `offset/peek`, `align`, `assert`) và mục `ast` ánh xạ sang AST (`each/as/filter`, `tempo`, `tracks`, `notes`, `ppq`, `timeUnit`). Biểu thức do bộ phân tích riêng đánh giá, hàm trắng `min max floor ceil round abs len beatsToTicks clamp`, cấm tên `__proto__`, `constructor`, `prototype`, có ngân sách phép tính (5×10⁷), số nút, độ sâu. Mọi đọc byte bị chặn trong vùng hợp lệ. Schema chọn theo `extensions` + `magic`. Đặc tả: `schemas/README.md`; ví dụ chạy được: `schemas/demo-dbin.schema.json`.
* **Nguồn XML/JSON khai báo (v0.2)**: `sourceType: "xml" | "json"`, đường dẫn dot-notation/XPath rút gọn, transformer danh sách trắng (`parseInteger`, `parseFloat`, `stringTrim`, `ticksToSeconds(ppq)`, `beatsToTicks(ppq, targetPPQ=960)`, `midiPitchToNoteName`, `velocityNormalize`): **chưa triển khai** trong thư viện (SOI-12); có thể dùng lại ngôn ngữ biểu thức và ngân sách của engine nhị phân.
* Kết quả phải qua cùng bước xác thực AST (REQ-AST-01). Lỗi schema: `ERR_SCHEMA_INVALID`; file không khớp magic: `ERR_UNSUPPORTED_FORMAT`.
* Định dạng nhị phân gốc của DAW (`.bwproject`, `.flp`) **chưa hỗ trợ** cho tới khi có file mẫu để viết schema (OI-08).

#### REQ-PARSER-06: Ableton Live Pack (`.alp`)
**[ĐÃ KIỂM]** trên một `.alp` thật (Live 9.1, 65 MB, 3 file `.als`). Giả định của v0.2 rằng `.alp` là ZIP **không đúng** với mẫu này.

* Nhận dạng bằng magic `pl-a` (4 byte đầu). Cấu trúc: 12 byte header (`pl-a`, u32 LE, u32 = 0) → N luồng gzip nối liền, mỗi luồng là một `.als` → manifest JSON `{"original_path","als":[{"current_path","original_path"}],"creator_id","version"}` (N phần tử, đúng thứ tự) → dữ liệu sample (FLAC…), không đọc.
* Ranh giới luồng gzip được xác định bằng cách thử các ứng viên (`1F 8B 08`) đến khi giải nén hợp lệ và khớp ISIZE; tổng byte giải nén chịu giới hạn của REQ-PARSER-00. Thiếu/hỏng manifest, thiếu luồng: `ERR_ARCHIVE_INVALID`. File 65 MB xử lý ≈ 0,15 giây.
* Gói có thể chứa nhiều `.als`. Thư viện cung cấp `listAlp(buffer)` (tên, kích thước, BPM, danh sách track kèm số nốt, lỗi nếu có) để giao diện cho người dùng chọn (REQ-UI-07); `parseAlp` nhận `alsName`/`alsIndex`, mặc định chọn `.als` lớn nhất và báo `WARN_ALP_MULTIPLE_ALS`.
* Vẫn nhận gói ZIP chứa `.als` (bỏ `Backup/`, `__MACOSX/`) phòng biến thể khác.

#### REQ-PARSER-07: Tempo không đoán ngầm và ghi đè (D-24, D-29)
* Mọi parser gắn `meta.tempoSource`: `file` (đọc từ file), `midi-default` (SMF không có tempo), `fallback` (không có tempo; dùng 120 BPM kèm `WARN_TEMPO_FALLBACK`), `user` (người dùng ghi đè). Giao diện phải nêu rõ khi nguồn khác `file` và mời người dùng nhập tempo.
* `tempoOverride`: số BPM hoặc mảng điểm `{bpm, num?, den?}` đặt vị trí bằng **một** trong `tick`, `beat`, `timeSeconds`. `timeSeconds` được đổi tuần tự: tick của mốc n = tick của mốc n−1 + (giây giữa hai mốc) × BPM(n−1) / 60 × 960. Điểm đầu không ở 0 thì thêm điểm 0 cùng BPM; vị trí trùng thì điểm sau thắng; không trộn `timeSeconds` với `tick/beat`; BPM trong 10–1000, sai thì `ERR_AST_INVALID`.
* **Dấu nhịp trong ghi đè:** mỗi mốc có thể kèm dấu nhịp `4/4`, `3/4`, `6/8`, `12/8`... (tử 1–64, mẫu số 1/2/4/8/16/32; bỏ trống = giữ nhịp trước). Mốc nhập theo `time` (giây, `m:ss.mmm`), `reaper` (`bar.beat.%`, ví dụ `5.3.50`) hoặc `sixteenth` (`bar.beat.sixteenth`, ví dụ `5.3.2`). Với bar.beat, một beat là nốt theo **mẫu số** của nhịp (12/8: nốt móc đơn), bar cộng dồn theo từng đoạn nhịp và đổi nhịp coi như bắt đầu ở đầu ô nhịp **[ĐÃ KIỂM với Reaper: nhịp 12/8 ở 120 BPM, đồng hồ hiển thị `1.12.68 / 0:02.920`, tức bar 1, beat 12 (nốt móc đơn thứ 12), 68 phần trăm của beat = 2,920 s; còn VERIFY với Ableton, Bitwig và các nhịp ghép khác, OI-12]**. Thư viện: `parsePositionText`, `parseTimeSignature`, `resolveTempoRows`.
* Ghi đè thay hoàn toàn tempo của file (tempo đổi giữa bài trong file bị bỏ) và kèm `WARN_TEMPO_OVERRIDDEN` khi file vốn có tempo. Với `.rpp` (vị trí item tính bằng giây), nốt được đặt lại theo tempo mới.

### 3.2. Cấu trúc dữ liệu chuẩn hóa (Unified AST, D-08, D-09)

#### REQ-AST-01: Lược đồ và quy tắc xác thực
Mọi parser phải xuất cấu trúc sau và qua bước xác thực trước khi vào Document Store:

```typescript
export interface UnifiedProjectAST {
  meta: {
    title: string;
    artist: string;
    sourceFormat: 'als' | 'alp' | 'rpp' | 'dawproject' | 'mid' | 'custom_json' | 'custom_binary';
    sourceVersion?: string;
    sourcePPQ: number;                 // PPQ gốc của nguồn (v0.3)
    tempoSource: 'file' | 'midi-default' | 'fallback' | 'user';   // v0.3, D-24
    internalPPQ: 960;
    totalTicks: number;
    totalDurationSeconds: number;
  };
  tempoMap: TempoPoint[];
  tracks: ProjectTrack[];
  chordTimeline: ChordSegment[];   // tính trước (D-09) bởi Analysis Worker, không do Parser Library tạo
}
export interface TempoPoint {
  tick: number; timeSeconds: number; bpm: number;
  timeSigNumerator: number; timeSigDenominator: number;
}
export interface ProjectTrack {
  id: string; index: number; name: string; color: string;
  isMuted: boolean; isVisible: boolean;
  sourceId?: string;                  // id gốc trong file nguồn (v0.3)
  mix?: { volumeDb: number; pan: number };            // mức fader tĩnh (Reaper VOLPAN) (v0.3)
  automation?: { volume?: AutomationLane; pan?: AutomationLane; mute?: AutomationLane; [laneId: string]: AutomationLane | undefined };   // v0.3; lane tuỳ ý: REQ-AST-02

  notes: ASTNote[];
  pitchRange: { min: number; max: number };   // 0-127
}
export interface AutomationLane { kind: 'volume' | 'pan' | 'mute' | 'send' | 'plugin' | 'midi-cc' | 'pitch-bend' | 'other'; name?: string; plugin?: { name: string; vendor?: string }; param?: { name: string; index?: number }; range?: { min: number; max: number; unit?: string }; points: { tick: number; timeSeconds: number; value: number; shape: number; tension?: number }[] }   // volume: gain tuyến tính
export interface ASTNote {
  id: string; pitch: number; pitchName: string;      // "C4", "G#5"
  startTick: number; durationTick: number; endTick: number;   // nguồn sự thật
  startTimeSeconds: number; durationSeconds: number; endTimeSeconds: number; // suy ra
  velocity: number;                                    // 1-127
  channel?: number;                                    // kênh MIDI nếu nguồn có (v0.3)
}
export interface ChordSegment {
  startTick: number; endTick: number;
  startTimeSeconds: number; endTimeSeconds: number;
  chordName: string;        // "D/F#", "Gmaj7", "N.C."
  rootNote: string; bassNote: string; pitches: number[];
  isManualOverride: boolean;
}
```

Quy tắc xác thực (vi phạm thì báo `ERR_AST_INVALID`, kèm vị trí lỗi đầu tiên):
* `startTick`, `durationTick` là số nguyên; `startTick ≥ 0`; `durationTick ≥ 1`; `endTick = startTick + durationTick`.
* `pitch` trong 0–127; `velocity` trong 1–127; không có `NaN`/`Infinity`.
* `tempoMap` không rỗng, phần tử đầu ở tick 0, tăng dần theo `tick`; `bpm` trong 10–1000 **[PROVISIONAL]**.
* Nốt mỗi track được sắp theo `startTick`; tổng số nốt ≤ 500,000 **[PROVISIONAL]** (vượt thì `ERR_AST_TOO_LARGE`).
* Không có nốt nào sau khi lọc thì báo `ERR_NO_NOTES`. Nốt dài 0 được nâng lên 1 tick kèm `WARN_ZERO_LENGTH_NOTES`. Cảnh báo là đối tượng `{code, message, details?}`.
* Giây là giá trị suy ra từ tick qua TempoMap; không được dùng giây để so sánh độ chính xác (NFR-ACC-02). Tempo thay đổi theo bậc (step); nội suy tuyến tính chỉ áp dụng khi nguồn khai báo dốc tempo **[VERIFY]**.

### 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02)

#### REQ-GRAPHICS-00: Độ phân giải thiết kế logic (D-06)
* 16:9: 1920 × 1080 pt; 9:16: 1080 × 1920 pt; 1:1: 1080 × 1080 pt; tùy biến: người dùng nhập kích thước logic cơ sở (W_base, H_base), mỗi cạnh 256–4096 pt.
* Khi xuất, hệ số co giãn `S = W_export / W_base` (ví dụ 3840 / 1920 = 2.0). Nét vẽ, cỡ chữ, bo góc, tọa độ (x, y, w, h) đều nhân `S`.
* Làm tròn tọa độ vẽ ở bước cuối (pixel), không làm tròn khi lưu layout.

#### REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)
1. **Nền cố định**: màu nền hoặc ảnh nền (phủ kín, chế độ cover).
2. **Widget tự do (1..N)**: mỗi widget có `zIndex` nguyên riêng; có Bring to Front / Send to Back.
3. **Playhead**: thuộc Piano Roll, vẽ đè lên thanh nốt nhưng nằm dưới widget có `zIndex` cao hơn Piano Roll.
4. **Lớp tương tác cố định**: khung chọn, điểm neo, đường gióng. Chỉ có ở Edit Mode; ẩn hoàn toàn ở Preview Mode và khi xuất.

#### REQ-GRAPHICS-02: Bắt dính thông minh
* **Lưới**: bước 8 pt hoặc 16 pt, bật/tắt được; làm tròn (x, y) về bội số ô lưới khi kéo.
* **Smart Guides**: ngưỡng ≤ 5 pt theo hệ tọa độ logic, so cạnh trái/giữa/phải và cạnh trên/giữa/dưới với widget khác và mép canvas. Khi chạm ngưỡng thì hút vào và vẽ đường gióng nét đứt màu token `guide` của giao diện ứng dụng (mặc định `#008C9E`, khác tông mọi màu nhấn; xem `docs/design/UI-DIRECTION.md` mục 5.4). Đường gióng là lớp phủ của Edit Mode, không bao giờ vào video xuất. Hỗ trợ khoảng cách đều (Equal Spacing) khi có 3 đối tượng thẳng hàng.
* **Phím tắt**: giữ `Alt` tắt tạm bắt dính; giữ `Shift` khóa theo trục; phím mũi tên dịch 1 pt, `Shift` + mũi tên dịch 10 pt.
* Bắt dính chỉ là thao tác chỉnh sửa; không ảnh hưởng dữ liệu layout đã lưu.

#### REQ-GRAPHICS-16: Thanh phát (playhead) tuỳ chỉnh
Vạch đánh dấu thời điểm đang phát trên Piano Roll (và các widget có trục thời gian). Mặc định giữ như hiện tại: một vạch dọc mảnh.
* **1.0:**
  * Hiện/ẩn; **vị trí** dọc theo trục chảy (0–100%, mặc định 25–30%) và lệch thêm theo px.
  * **Kiểu:** vạch liền, nét đứt, chấm; vạch đôi; **dải** (vùng sáng có độ rộng); dải mờ dần hai bên (gradient); có hoặc không có **đầu mũi tên/tam giác** ở hai đầu.
  * **Độ dày** 0,5–40 px; **độ dài** cả khung hoặc một phần (%) căn giữa/đầu/cuối; **màu** qua bộ chọn màu chung (REQ-UI-11, có alpha) hoặc theo màu track của nốt đang chạm; **phát sáng** (cường độ, bán kính); bo đầu.
  * **Phản ứng khi nốt chạm vạch:** nhấp sáng hoặc phình độ dày trong một khoảng ngắn (ms), mức theo velocity; có thể tắt.
  * Thứ tự lớp: trên hoặc dưới nốt. Vạch luôn vuông góc với hướng chảy (kể cả góc tự do của REQ-WIDGET-01).
* **1.1:** vạch là **ảnh/sprite** người dùng nạp (REQ-STORAGE-05); mọi thuộc tính gắn keyframe, binding, biểu thức (REQ-GRAPHICS-09…13), ví dụ độ dày đập theo kick; bộ phát hạt đặt tại vạch (REQ-GRAPHICS-11); preset `playhead` chia sẻ được.

#### REQ-GRAPHICS-03: Xoay widget tự do (D-54, thay D-15)
**Sửa tài liệu v1.2 (2026-11-13): xoay 2D chỉnh được từ bản phát hành 1.0.**
* **Dữ liệu:** `layout.rotation` (độ, chuẩn hoá về (−180, 180]) và `layout.anchor` (điểm neo `{x, y}` theo tỉ lệ khung widget 0..1, mặc định tâm `{0.5, 0.5}`). Preset cũ không có `anchor` thì dùng tâm. Thêm `anchor` là đổi `schemaVersion` phụ (0.3.x → 0.4.0), đọc được preset 0.3.x.
* **Chỉnh:** tay nắm xoay phía trên khung chọn; kéo bắt dính mỗi 15°, giữ `Shift` để tự do; ô nhập số (REQ-UI-15); nhấp đúp tay nắm đưa về 0°; kéo điểm neo (giữ `Alt` khi kéo tay nắm xoay để xoay quanh góc đối diện). Chọn nhiều widget thì xoay cả nhóm quanh tâm nhóm.
* **Bắt dính với widget đã xoay:** dùng **khung bao thẳng trục** của hình đã xoay và tâm của nó cho lưới và Smart Guides (REQ-GRAPHICS-02); widget cùng góc thì gióng thêm theo cạnh của chính chúng.
* **Vẽ:** Render Core dời tới điểm neo, xoay, vẽ, cắt theo khung đã xoay; tất định như mọi widget (REQ-GRAPHICS-05). Nội dung bên trong widget không bị co để vừa khung thẳng trục.
* **Hoạt hoạ:** `rotation` gắn được keyframe, binding, biểu thức như mọi thuộc tính số (REQ-GRAPHICS-09, 12, 13).
* **Từ 1.1 (D-47):** `rotation` chính là `rotateZ` trong biến đổi 3D của REQ-GRAPHICS-15; preset 1.0 mở ở 1.1 không đổi hình.

#### REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung
* Có ít nhất 3 preset dựng sẵn: dọc 9:16, ngang 16:9, vuông 1:1; preset mặc định khi nạp dự án lần đầu là **dọc 9:16** (Persona 1, KPI-04) **[PROVISIONAL]**.
* Preset tự gán track theo `trackMappingMode` (ví dụ `AUTO_ASSIGN_FIRST_MELODIC`: track đầu tiên có nốt và không phải Drums).
* Đổi tỉ lệ khung khi đã chỉnh layout: hộp thoại cho chọn "Áp preset của tỉ lệ mới", "Co giãn bố cục hiện tại theo tỉ lệ tương đối" hoặc **"Neo theo cạnh"** (v1.1: mỗi widget giữ khoảng cách tới cạnh hoặc tâm gần nhất và giữ kích thước theo cạnh ngắn, hợp với tỉ lệ tuỳ ý như 21:9 hay 4:5); thao tác phải hoàn tác được (REQ-UI-02).

#### REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)
* Mỗi track có **Nguồn độ sáng**: **`tắt` = đều nhau (mặc định từ 2026-11-12, D-50)**, `volume`, `pan`, `mute` hoặc `mức fader tĩnh`; chọn riêng từng track hoặc áp cho tất cả. Người dùng quyết định sáng hơn hay tối hơn khi âm lượng lớn: có công tắc **đảo chiều**.
* **Sửa 2026-11-12 (D-50):** trong giao diện mục này gọi là **"Độ sáng nền"** và mặc định là **đều nhau**: mọi nốt cùng độ sáng, không theo automation. Độ sáng nền tác động lên độ đục của nốt **suốt thời gian** (kể cả nốt chưa tới). Muốn nốt **phát sáng khi thanh phát chạm** theo velocity, cao độ, pan, fade hay automation thì dùng REQ-GRAPHICS-17; hai cơ chế độc lập và có thể dùng cùng lúc.
* **Volume**: `B(t) = lerp(minB, maxB, volumeToUnit(gain(t), floorDb, ceilDb))`, mặc định `floorDb = −36 dB`, `ceilDb = 0 dB`, `minB = 0,25`, `maxB = 1`; các giá trị này chỉnh được. Giá trị trên `ceilDb` (ví dụ +3 dB) kẹp ở sáng nhất.
* **Đảo chiều**: mặc định giá trị nguồn càng lớn thì càng sáng (âm lượng to → sáng). Bật đảo chiều thì ngược lại (âm lượng to → tối), tức `k = 1 − u` thay cho `k = u` trong công thức trên. Hữu ích khi muốn track đang "lùi" (fade out) nổi bật hơn, hoặc làm hiệu ứng tối dần khi nhạc dồn lên.
* **Phân biệt với cường độ nốt (velocity):** độ sáng ở đây lấy theo **automation của cả track** (fader, pan, mute trong DAW) và thay đổi theo thời gian. Độ mạnh của **từng nốt** (velocity 0–127) là chuyện khác: chọn ở chế độ màu `velocity` của kiểu nốt (REQ-GRAPHICS-07) hoặc gắn vào bất kỳ thuộc tính nào qua binding `note.velocity` (REQ-GRAPHICS-12) và biểu thức (REQ-GRAPHICS-13).
* **Pan / Mute**: dùng lane tương ứng; pan theo độ lệch khỏi giữa, mute sáng/tối theo trạng thái. Chiều pan và nghĩa giá trị mute chưa kiểm (SOI-19), nên hai nguồn này đánh dấu thử nghiệm.
* **Mức fader tĩnh**: dùng `track.mix.volumeDb` khi track không có envelope. Track không có dữ liệu nguồn thì `B = 1` (hình ảnh không đổi).
* Độ sáng áp lên màu nốt/nền của Piano Roll, Live Trigger, Track Info và các widget P-01, P-09; cách áp (đổi độ sáng HSL, độ mờ, hoặc cả hai) tuỳ widget.
* Tất định: `B` chỉ phụ thuộc `t`, automation và cấu hình (tính bằng `sampleLane`/`volumeToUnit` của thư viện); làm mượt tuỳ chọn bằng cửa sổ thời gian cố định, không phụ thuộc tốc độ khung. Lưu trong Preset và Project Pack.
* Nguồn khác Reaper (Ableton, Bitwig, DAWproject): `B = 1` cho tới khi parser đọc được automation (SOI-18).

#### REQ-GRAPHICS-07: Kiểu dáng nốt tuỳ chỉnh và bàn phím
* Kiểu nốt (`NoteStyle`) có hai tầng: **mặc định toàn cục** và **ghi đè theo track** (chỉ lưu trường khác mặc định). Mọi trường là dữ liệu thuần, tuần tự hoá được, lưu trong Preset và Project Pack (REQ-STORAGE-02).
* Trường tuỳ chỉnh: **chế độ màu** (`track`, `custom`, `pitch`, `velocity`) và màu tuỳ chọn; **màu theo trạng thái nốt** (xem dưới); **độ đục** (0 đến 1) và độ đục khi nốt chưa phát; **độ dày** nốt (0,1 đến 1,5 lần một hàng cao độ); **bo góc** (px, kẹp ở nửa chiều cao, rất lớn cho dạng viên thuốc); **phát sáng** (cường độ 0 đến 1, bán kính px, tuỳ chọn chỉ sáng khi đang phát); **viền** (độ dày, màu tự động hoặc chọn).
* **Màu theo trạng thái nốt (bổ sung T-69, 1.0):** ba trường màu tuỳ chọn `playedColor` (nốt đã phát: `end ≤ t`), `activeColor` (nốt đang phát: `start ≤ t < end`), `upcomingColor` (nốt sắp tới: `start > t`). Mỗi trường là màu hoặc `null`; **mặc định cả ba `null` = giữ hành vi cũ** (một màu theo chế độ màu, trạng thái chỉ đổi độ đục qua `opacity`/`inactiveOpacity`). Trường nào khác `null` thay màu của đúng trạng thái đó; trường `null` rơi về màu của chế độ màu như trước. Độ đục vẫn áp như cũ trên màu đã chọn. Preset và kiểu dựng sẵn cũ không có ba trường này phải ra cùng kết quả như trước T-69. Là một phần của `NoteStyle`, nên cũng có hai tầng toàn cục/theo track và nằm trong Preset. Giá trị mẫu của preset "Bản in": đã phát `#383838`, đang phát `#383838`, sắp tới `#C4C4C4`.
* Giá trị ngoài miền hợp lệ bị **kẹp** (không ném lỗi); màu sai định dạng quay về mặc định. Độ sáng theo automation (REQ-GRAPHICS-06) nhân thêm vào độ đục và cường độ phát sáng.
* Có **bộ kiểu dựng sẵn** (neon, thanh bo tròn, phẳng, chỉ viền) làm điểm xuất phát; người dùng chọn rồi chỉnh tiếp.
* **Bàn phím piano** (widget P-01) dùng chung trục cao độ với Piano Roll, phím đang phát lấy màu nốt. Bật/tắt được. Bản đầu gắn cạnh Piano Roll; tách thành widget độc lập khi có Scene (T-05).
* **Tuỳ chỉnh bàn phím (bổ sung v1.1 tài liệu, bản phát hành 1.0):**
  * **Phạm vi phím:** theo nội dung (mặc định), 88 / 76 / 61 / 49 / 37 / 25 phím, hoặc tuỳ chọn từ–đến (ví dụ C2–C6); luôn khớp trục cao độ với Piano Roll.
  * **Hướng:** theo hướng cuộn của Piano Roll (dọc bên trái khi nốt chạy ngang; nằm ngang ở dưới khi nốt rơi).
  * **Hình dạng:** màu phím trắng, phím đen, khe giữa phím, tỉ lệ dài phím đen (0,5–0,8), bo góc, kiểu phẳng hoặc có bóng nổi, viền.
  * **Phím đang nhấn:** màu theo track, theo nốt (cùng chế độ màu với nốt) hoặc một màu cố định; độ lún theo velocity; phát sáng; thời gian nhả dần (ms).
  * **Đánh dấu thang âm:** tô nhạt các phím thuộc giọng đang chọn hoặc giọng nhận diện được (P-04).
* **Tên nốt trên phím (note label, 1.0):**
  * **Hiện ở:** không; chỉ phím C; mọi phím trắng; mọi phím; chỉ phím đang nhấn.
  * **Cách ghi tên:** dùng thiết lập chung P-12 / REQ-I18N-08 (`C D E`, `Do Re Mi`, `H` thay `B`, `ハニホ`…); thăng/giáng hiển thị `♯`/`♭` hoặc `#`/`b`.
  * **Số quãng tám:** chọn quy ước Đô giữa (MIDI 60) là **C4** (mặc định, theo chuẩn khoa học) hay **C3** (kiểu Yamaha/Ableton) để khớp DAW người dùng; tuỳ chọn ẩn số.
  * **Kiểu chữ:** phông (gồm phông người dùng nạp, REQ-STORAGE-05), cỡ, màu, vị trí (đáy phím / giữa), xoay theo hướng bàn phím.
* Mọi kiểu dáng vẽ qua Render Core nên Preview và Export giống nhau (REQ-GRAPHICS-05). Phát sáng dùng `shadowBlur`; chi phí khi xuất độ phân giải cao cần đo (T-09).

#### REQ-GRAPHICS-08: Hiệu ứng chuyển động tất định (D-37)
* Hiệu ứng của đối tượng (xuất hiện, bật sáng khi nốt bắt đầu, tắt dần, chuyển cảnh) là **hàm thuần của `t`** và cấu hình, tính trong Render Core; cùng `t` luôn cho cùng giá trị, tua tới/lui không để lại trạng thái.
* Thời lượng và đường cong (easing) chỉnh được và lưu trong Preset.
* Giao diện ứng dụng được dùng CSS/Framer Motion, nhưng khung hình xuất **không** phụ thuộc chúng.

#### REQ-GRAPHICS-05: Render Core dùng chung (ARC-01, D-20)
* Mọi widget vẽ qua `renderFrame(document, derivedData, t, target, scale)`; hàm này không đọc đồng hồ hệ thống, `requestAnimationFrame`, hay trạng thái tăng dần.
* Preview và Export gọi cùng hàm; chỉ khác `target` (Canvas / OffscreenCanvas) và `scale`.
* **Hai ngưỡng sai khác** (sửa ở v1.1 theo số đo Spike 1, xem `docs/spikes/SPIKE-1-EXPORT.md`):
  * *Cùng đường vẽ* (cùng loại target, cùng máy, cùng `t`): sai khác ≤ 1/255 mỗi kênh màu. Dùng cho kiểm thử hồi quy bằng ảnh chụp và cho tính tất định (tua tới `t` so với phát liên tục tới `t`).
  * *Khác đường vẽ* (Canvas luồng chính ↔ `OffscreenCanvas` trong Worker): khác biệt khử răng cưa ở mép hình là bình thường (Spike 1 đo **max diff = 57/255**), nên **không** dùng max diff. Tiêu chí **[PROVISIONAL]**: ≥ 99,5% điểm ảnh lệch ≤ 2/255 mỗi kênh và PSNR ≥ 40 dB; đo lại phân bố sai khác ở M3 (T-09) rồi chốt.
* Font người dùng nạp phải được nạp xong (`FontFace.load`) trước khi vẽ khung đầu tiên khi xuất.

#### REQ-GRAPHICS-17: Phát sáng động khi chạm (D-50, 1.0)
Thay cho việc lấy automation làm cơ chế mặc định, mặc định mọi nốt **phát sáng như nhau**; người dùng bật **phát sáng động** để cường độ phát sáng lúc thanh phát chạm nốt phụ thuộc một tiêu chí.

* **Chế độ** (`NoteStyle.glowMode`): `uniform` = **Đều nhau** (mặc định) · `dynamic` = **Động khi chạm**. Thuộc `NoteStyle`, nên có hai tầng như REQ-GRAPHICS-07: mặc định toàn cục và ghi đè theo track (ví dụ trống theo velocity, pad theo automation).
* **Thời điểm sáng (bao thời gian):** khi `glowActiveOnly` bật (mặc định), nốt chỉ sáng từ lúc thanh phát chạm đầu nốt tới hết nốt; tắt thì nốt luôn sáng (cường độ vẫn theo tiêu chí). **Tắt dần sau nốt** `glowRelease` 0–4 s (mặc định 0): sau khi nốt kết thúc, phát sáng giảm tuyến tính về 0 trong khoảng này.
* **Tiêu chí** (`glowSource`), mỗi tiêu chí cho giá trị `s` chuẩn hoá 0..1:

| Tiêu chí | Cách tính `s` | Ghi chú |
| :--- | :--- | :--- |
| `velocity` | `velocity / 127` | Nốt đánh mạnh sáng hơn |
| `pitch` | vị trí cao độ trong tầm cao độ đang hiển thị của widget | Nốt cao sáng hơn (đảo chiều để ngược lại) |
| `pan` | pan của track **lúc nốt bắt đầu** (lane pan nếu có, không thì `mix.pan`). Hai cách đọc (`glowPanMode`): **Trái → phải** (mặc định) −1..1 → 0..1, trái hẳn yếu nhất; **Lệch khỏi giữa** `|pan|`, giữa yếu nhất, càng lệch trái hoặc phải càng mạnh. Cách đọc cũng áp cho lane pan khi tiêu chí là `automation` | Chiều pan trong tệp theo SOI-19 **[VERIFY]** |
| `fade` | `1` lúc chạm, giảm tuyến tính về `0` ở cuối nốt | Hiệu ứng "chạm rồi tắt dần" theo độ dài nốt (chủ dự án xác nhận 2026-11-12) |
| `automation` | giá trị lane đã chọn (`glowLane`) **tại thời điểm `t`** trong lúc nốt kêu, chuẩn hoá theo loại lane | Mọi lane trong REQ-AST-02: âm lượng, pan, mute, send, tham số plugin… |

* **Ánh xạ:** cường độ = `glow × env(t) × lerp(glowMin, glowMax, s')`, với `s' = 1 − s` khi bật **Đảo chiều** (`glowInvert`). Mặc định `glowMin = 0,15`, `glowMax = 1`. Không có dữ liệu cho tiêu chí (ví dụ track không có lane đã chọn) thì `s = 1`, tức sáng như chế độ đều nhau; giao diện ghi rõ lane "không có trong dự án".
* **Mở rộng (sau 1.0):** độ dài nốt, nốt thuộc hợp âm đang vang, pha nhịp (`beat.phase`), âm lượng stem của track (REQ-AUDIO-01, 1.2), và biểu thức tuỳ ý (REQ-GRAPHICS-13). Tiêu chí mới chỉ cần trả `s` 0..1 nên không đổi phần còn lại.
* **Quan hệ với cơ chế khác:** độc lập với độ sáng nền (REQ-GRAPHICS-06). Pha `hit` của template chuyển cảnh nốt (REQ-GRAPHICS-10) dùng **cùng bộ tiêu chí** này để điều khiển hiệu ứng chạm (nảy, rung, toả hạt…), không chỉ phát sáng.
* **Tất định:** cường độ chỉ phụ thuộc `(t, nốt, track, kiểu)`, tính trong Render Core (`packages/render-core/src/glow.ts`), giống nhau ở Preview và Export.

#### REQ-AST-02: Automation tổng quát (D-50; 1.0 cho Reaper track + MIDI CC, các nguồn khác theo tệp mẫu)
Automation phải điều khiển được **mọi thuộc tính số** của khung hình (phát sáng, kích thước, màu, vị trí, tham số hiệu ứng…), **miễn là DAW hoặc plugin lưu automation đó trong tệp dự án**.

* **Lược đồ:** ngoài `automation.volume/pan/mute` hiện có (giữ để tương thích), `ProjectTrack.automation` nhận **lane tuỳ ý** theo khoá `id`. Mỗi lane có `kind`: `volume` | `pan` | `mute` | `send` | `plugin` | `midi-cc` | `pitch-bend` | `other`; nhãn `name` hiển thị; với `plugin` thêm `plugin: { name, vendor? }` và `param: { name, index? }`; tuỳ chọn `range: { min, max, unit? }` để chuẩn hoá. Điểm giữ dạng `{ tick, timeSeconds, value, shape, tension? }` như cũ.
* **Chuẩn hoá về 0..1** (dùng chung cho REQ-GRAPHICS-17 và bindings): `volume` theo dB trong [−36, 0] (như REQ-GRAPHICS-06); `pan` −1..1 → 0..1; `mute` 0/1; `midi-cc` `value / 127`; `pitch-bend` −8192..8191 → 0..1; `plugin` và `other` dùng `range` nếu có, không thì coi giá trị đã ở 0..1 (Reaper và DAWproject lưu tham số plugin dạng chuẩn hoá) **[VERIFY]**.
* **Nguồn theo DAW** (trạng thái):
  * Reaper: `VOLENV2/PANENV2/MUTEENV` của track **đã đọc**; envelope tham số FX `PARMENV` và send `AUXVOLENV` **chưa đọc** **[VERIFY]**; envelope trong item/take chưa đọc (SOI-18).
  * `.mid`: Control Change (CC1 mod wheel, CC7, CC10, CC11, CC64…) và pitch bend thành lane `midi-cc`/`pitch-bend` **chưa đọc** (làm được ngay, không cần tệp mẫu đặc biệt).
  * Ableton `.als`: `AutomationEnvelopes` ghép `PointeeId` với tham số mixer/thiết bị **chưa đọc** **[VERIFY]** (SOI-18).
  * DAWproject: `<Points target=…>` theo tham số **chưa đọc** **[VERIFY]** (SOI-18).
* **Giới hạn:** điều chế bên trong plugin (LFO, envelope nội bộ của synth) không được lưu thành automation trong tệp dự án, nên không đọc được; người dùng cần ghi nó thành automation trong DAW hoặc nạp stem (REQ-AUDIO-01).
* **Dùng automation cho thuộc tính khác:** qua bindings (`{ "bind": "track.automation.<id>", … }`, CUSTOMIZATION §3.3) và biểu thức (REQ-GRAPHICS-13). Giao diện liệt kê lane theo tên đọc được (ví dụ "Serum · Filter Cutoff"); lane không có trong dự án đang mở được đánh dấu.

### 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)

Mỗi widget có thuộc tính hình học `(x, y, width, height, zIndex, rotation)` và hỗ trợ snapping như nhau. **Trạng thái rỗng**: widget không có dữ liệu (không có track gán, chưa nạp audio) vẫn phải hiển thị khung giữ chỗ ở Edit Mode, và không vẽ gì ở Preview/Export, trừ khi người dùng chọn hiển thị giá trị mặc định.

#### REQ-WIDGET-01: Piano Roll
* **Hướng cuộn**: *Horizontal* (mặc định): nốt chạy phải sang trái, Playhead thẳng đứng tại `playheadPositionRatio` (mặc định 30% từ mép trái). *Vertical*: nốt rơi từ trên xuống, Playhead nằm ngang (mặc định 75% từ mép trên).
  * **Góc tự do (bổ sung tài liệu v1.1, bản phát hành 1.0):** ngoài 4 hướng, chọn **góc dòng chảy** bất kỳ 0–360° (bắt dính mỗi 15° khi kéo, giữ Shift để tự do; nhập số). Quy ước: 0° = nốt chạy từ phải sang trái (mặc định), 90° = nốt rơi từ trên xuống. Toàn bộ làn nốt, vạch phát và bàn phím xoay theo; làn tự kéo dài để phủ kín khung widget ở mọi góc (không lộ góc trống); tên nốt trên phím có tuỳ chọn luôn đứng thẳng. Đây là thuộc tính bên trong Piano Roll nên không phụ thuộc D-15 (xoay khung widget); góc có keyframe được từ REQ-GRAPHICS-09. Nghiêng trong không gian 3D là REQ-GRAPHICS-15 (1.1).
* **Đa track**: gán một hoặc nhiều track; mỗi track vẽ bằng `track.color`.
* **Thanh nốt**: hình chữ nhật bo góc, độ dài tỉ lệ với `durationSeconds`; vẽ nốt đang phát sáng hơn nốt chưa phát.
* **Pitch Range**: *Fit to Content* (mặc định) lấy min/max pitch của track được gán; *Custom Octave Range* cho chọn khoảng (ví dụ C2–C6), nốt ngoài khoảng bị cắt.
* **Lookahead**: 1.0 đến 8.0 giây (mặc định 3.0).
* **Hiệu năng**: chỉ vẽ nốt giao với cửa sổ thời gian hiển thị (tìm bằng chỉ mục theo `startTick`), không duyệt toàn bộ nốt mỗi khung (NFR-PERF-02).

#### REQ-WIDGET-02: Track Info
* Hiển thị `title`, `artist` từ `AST.meta`; người dùng sửa nội dung trong Inspector mà không đổi file gốc (giá trị sửa lưu trong Document).
* Tùy biến: font (có sẵn hoặc người dùng nạp), cỡ chữ, màu, độ đậm, căn lề trái/giữa/phải, **hai dòng riêng** (tiêu đề và nghệ sĩ, mỗi dòng có cỡ/độ đậm/màu riêng; dòng rỗng thì không vẽ).
* **Phông và nguồn chữ của video (bổ sung T-69):** phông mặc định của preset là **Space Grotesk** (giấy phép OFL), **tự host** cùng ứng dụng (CSP chỉ cho `font-src 'self'`, NFR-SEC-03); không dùng CDN. Phông phải được nạp xong bằng `FontFace.load()` **trước khung đầu tiên**, ở Preview lẫn Export Worker; chưa nạp xong thì **không vẽ khung có chữ** (khung hiển thị trạng thái chờ chứ không vẽ bằng phông dự phòng). Chữ trong video lấy từ **mẫu chữ trong preset** (REQ-WIDGET-03…06) và dữ liệu dự án, **không** lấy từ từ điển giao diện `locales/` của ứng dụng (khung video là sản phẩm xuất, không thuộc theme/ngôn ngữ ứng dụng; xem REQ-I18N-07 cho chữ viết ngoài Latin).

#### REQ-WIDGET-03: Event Counter
* "Event" là một Note-On; hợp âm 4 nốt cùng lúc tính 4 Events.
* Trường hiển thị (bật/tắt riêng): **Played Notes** (số nốt có `startTimeSeconds ≤ t`), **Total Notes** (nốt của các track đang hiển thị), **Progress** `P = Played / Total × 100%`, **Tempo hiện tại** (BPM).
* `Total = 0` thì hiển thị 0 và `0%`, không chia cho 0.
* **Mẫu nhãn tự sửa (bổ sung T-69):** thay cho nhãn cố định, người dùng viết **mẫu chữ** có chỗ giữ `{played}`, `{total}`, `{pct}` (kèm `%`), `{tempo}`; ví dụ `Num played notes: {played}/{total} ({pct})` ra `Num played notes: 1271/1917 (66.30%)`. Mỗi trường bật ở trên có một mẫu (một dòng); trường tắt thì dòng của nó không vẽ. **Số chữ số thập phân** của `{pct}` chỉnh được (0 đến 4, mặc định 2); `{played}`, `{total}` luôn là số nguyên. Chỗ giữ lạ được giữ nguyên chữ và kèm cảnh báo `WARN_PRESET_VALUE`, không ném lỗi. Mẫu chữ lưu trong Preset và là nguồn chữ của video (REQ-WIDGET-02); không dịch theo ngôn ngữ ứng dụng.
* **Tính trước:** `Played` lấy bằng tổng tích luỹ theo thời điểm bắt đầu và tìm nhị phân, `O(log n)` mỗi khung, không quét lại toàn bộ nốt.

#### REQ-WIDGET-04: Live Note Trigger
* Lọc nốt thỏa `startTimeSeconds ≤ t < endTimeSeconds`; hiển thị tên nốt và lực gõ (ví dụ `B2 (Vel: 70)`).
* **Fade-out Tail**: nốt vừa kết thúc còn trong danh sách thêm 100–1000 ms (cấu hình được), độ trong suốt giảm dần về 0.
* Danh sách dài hơn số dòng hiển thị: sắp theo pitch giảm dần và cắt bớt, có thể hiện "+N".
* **Kiểu hiển thị (bổ sung T-69):** *Danh sách dọc* (mặc định, như trên) hoặc **một dòng ngang**: các nốt đang phát nối trên một dòng, cách nhau bằng khoảng trắng, ví dụ `Note: E3 (Vel: 82)   Note: E4 (Vel: 80)`; mẫu chữ của từng nốt tự sửa được (`Note: {name} (Vel: {velocity})`). Dòng quá rộng so với khung widget thì cắt bớt nốt thấp nhất và hiện `+N`. Căn lề trái/giữa/phải theo khung.
* **Hậu tố tên track:** tuỳ chọn thêm tên track cuối dòng hoặc cuối mỗi nốt, ví dụ `< Track 1`; tên lấy từ `track.name`, chỉ hiện track có nốt đang phát; mẫu hậu tố tự sửa (`< {track}`).

#### REQ-WIDGET-05: Time & Bar Counter
* **Đồng hồ thực**: `mm:ss.sss`.
* **Đồng hồ nhạc**: `Bar : Beat : Sub-Tick`, Bar bắt đầu từ 1 (ví dụ `1.1.000`).
* Một beat dài `960 × 4 / denominator` tick (4/4 → 960; 6/8 → 480). Sub-Tick là phần tick lẻ trong beat.
* Tra cứu bằng TempoMap; đúng cả khi số chỉ nhịp đổi giữa bài. Nốt/Bar bắt đầu ở điểm đổi nhịp.
* **Định dạng chia nhóm (bổ sung T-69):** ngoài hai dạng trên, chọn dạng **chia nhóm có số 0 đứng đầu**: thời gian `mm ss mmm` hoặc nhạc `Bar Beat Sub` thành các nhóm rộng cố định cách nhau một khoảng trắng; độ rộng từng nhóm chỉnh được, mặc định 3. Ví dụ đồng hồ thực `001 35 083` (phút 001, giây 35, mili giây 083) và đồng hồ nhạc `037 06 093` (Bar 037, Beat 06, Sub 093). Số lớn hơn độ rộng nhóm thì hiện đủ chữ số, không cắt.
* **Chú thích nhỏ:** mỗi đồng hồ có thể có nhãn chữ nhỏ (mặc định `time`, `beat`, mẫu chữ tự sửa) đặt trên-phải của số, cỡ chữ riêng; tắt được.
* **Thanh tiến độ trong beat/bar:** mỗi đồng hồ nhạc có thể kèm hai vạch mảnh: vạch **beat** đầy dần từ 0 đến 1 trong beat hiện tại, vạch **bar** đầy dần trong ô nhịp hiện tại (`phần beat / số beat mỗi ô`). Độ dài, độ dày, màu nền và màu tiến độ chỉnh được; tắt được. Tất cả chỉ phụ thuộc `t` và `tempoMap`, nên tất định.
* **Dữ liệu dấu nhịp:** lấy từ `tempoMap[i].timeSigNumerator/timeSigDenominator` của AST (REQ-AST-01); không cần trường mới. Dự án không có dấu nhịp thì mặc định 4/4 (`makeTempoMap`). Tính trước bảng ranh giới Bar theo tick một lần khi nạp AST để tra bằng tìm nhị phân.

#### REQ-WIDGET-06: Chord Detection (D-09)
* **Nguồn nốt**: người dùng chọn track đưa vào; mặc định chọn track Piano/Keyboard/Guitar theo tên, loại Drums/Percussion. Bất kể người dùng chọn gì, nốt ở kênh MIDI 10 (chỉ số 9) và track tên Drums/Percussion không đưa vào nhận diện hợp âm. Tam hợp trưởng ghi "C" (không "CM").
* **Thuật toán**: lấy nốt thấp nhất làm `BassNote`; các nốt còn lại quy về pitch class (mod 12); gọi `@tonaljs/chord-detect` (đưa bass đứng đầu danh sách). Nếu `BassNote ≠ RootNote` thì hiển thị hợp âm đảo/phân số (`D/F#`).
* **Hai chế độ**: *Sustained* (mặc định) phân tích mọi nốt đang giữ tại `t`; *Strike* chỉ gom nốt có thời điểm bắt đầu lệch nhau ≤ 30 ms và giữ tên hợp âm đến lần dập tiếp theo.
* **ChordTimeline**: tính trước một lần khi nạp hoặc khi đổi track/chế độ; đoạn liền kề cùng tên thì gộp; đoạn ngắn hơn 80 ms **[PROVISIONAL]** (SOI-09) được gộp vào đoạn lân cận để tránh nhấp nháy.
* **Không nhận diện được**: hiển thị `N.C.` hoặc danh sách tên nốt, tùy cấu hình.
* **Luôn hiện danh sách nốt (bổ sung T-69, tuỳ chọn, mặc định tắt):** khi bật, danh sách nốt đang giữ (từ thấp đến cao, có quãng tám, ví dụ `Notes: G#2 E3 D4 E4 G#4 B4`) luôn hiện **kèm** tên hợp âm ở dòng riêng, kể cả khi đã nhận diện được; tên hợp âm và danh sách nốt có cỡ chữ, màu và mẫu chữ riêng (`Notes: {notes}`). Tắt thì giữ hành vi cũ (danh sách nốt chỉ thay cho tên khi không nhận diện được). Không có nốt nào đang giữ thì không vẽ dòng nốt.
* **Manual Override**: nhấp đúp vào làn hợp âm trên Timeline để tạo `ChordOverrideSegment` có `chordName`, `startTick`, `endTick`. Override ưu tiên tuyệt đối; override chồng nhau thì cái tạo sau thay phần giao; lưu trong Preset/Project Pack (`overrides.json`); hoàn tác được.
* Độ chính xác mục tiêu: KPI-06.

#### REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)
* Hoạt động khi nạp audio hợp lệ (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`). Trình duyệt không giải mã được thì báo `ERR_AUDIO_DECODE` và vẫn cho tiếp tục không có audio.
* **Giới hạn bộ nhớ** **[PROVISIONAL]**: thời lượng audio giải mã tối đa 20 phút; vượt thì `ERR_AUDIO_TOO_LONG`. Cache phân tích (đỉnh/RMS, FFT) lưu dạng mono; PCM stereo chỉ giữ cho phát/mã hóa và nên giải mã theo khối.
* **Offset**: thanh trượt ±10.0 giây, bước 1 ms.
* **FFT tất định**: tự cài FFT (cửa sổ Hann, kích thước 2048 **[PROVISIONAL]**) tính từ PCM tại thời điểm `t`; Preview không dùng `AnalyserNode` để Export cho cùng kết quả.
* **Kiểu hiển thị**: Frequency Bars (16–128 cột, thang log hoặc tuyến tính), Mirrored Spectrum, Oscilloscope, Peak & Crest Factor Meter (dBFS đỉnh và tỉ số đỉnh/RMS).
* **Hướng cột (sửa v1.2, D-54, bản 1.0):** cột mọc **lên, xuống, sang trái, sang phải**, hoặc **đối xứng** quanh trục giữa ngang hay dọc; trục tần số chạy theo chiều còn lại (đảo được). Đây là thuộc tính bên trong widget, nên spectrum dựng đứng dọc mép khung không cần xoay khung; mọi góc khác dùng xoay widget (REQ-GRAPHICS-03). Áp cho Bars, Mirrored, Line/Area, Dots, Waveform tổng quan và Meter; Oscilloscope dùng cùng trục.
* Khi chưa có audio nhưng widget vẫn được đặt: áp dụng quy tắc trạng thái rỗng ở đầu mục 3.4.
* **Tuỳ chỉnh hình dạng (bổ sung v1.1 tài liệu):**
  * **1.0:** kiểu Bars, Mirrored, Line/Area (đường phổ liền), Dots, Oscilloscope (dạng sóng tức thời), **Waveform tổng quan** (toàn bài, có vạch phát và phần đã phát tô màu khác), Peak/RMS Meter. Tham số: số cột 8–256, thang tần số log/tuyến tính/mel, dải tần (ví dụ 30 Hz–16 kHz), độ rộng và khe cột, bo góc, hướng (theo mục "Hướng cột" ở trên), làm mượt theo thời gian (attack/release ms, tính tất định từ PCM, không mô phỏng), chấm đỉnh rơi chậm (peak cap), màu đơn / gradient theo tần số / gradient theo biên độ, độ đục, phát sáng.
  * **1.1:** dạng **tròn/radial** (cột toả quanh tâm, có thể đặt ảnh hoặc logo ở giữa), xoắn ốc, đường cong tuỳ vẽ làm "đường nền" cho cột chạy theo; hình cột là sprite người dùng nạp; mọi tham số gắn được keyframe/biểu thức (ví dụ bán kính đập theo kick).
* **Nguồn âm thanh:** 1.0 dùng một tệp audio tổng (mix). Hiện spectrum, waveform hay meter **riêng cho từng track** cần âm thanh tách track (stem) do người dùng xuất từ DAW: xem **REQ-AUDIO-01** (bản 1.2). Widget chọn nguồn là tệp tổng hoặc stem của track nào.

#### REQ-AUDIO-01: Âm thanh theo track (stem), bản 1.2
Tệp dự án DAW chỉ chứa nốt, tempo, automation và **đường dẫn** tới sample/plugin, không chứa âm thanh đã trộn của từng track; một tệp mix chung cũng không tách ngược ra từng track được. Vì vậy mọi thứ cần **âm thanh của riêng một track** đòi người dùng **xuất (render) thêm tệp âm thanh cho track đó** từ DAW.

* **Cần stem:** spectrum, waveform, oscilloscope, meter của riêng một track; binding phản ứng theo âm thanh của một track (`track.audio.rms`, `track.audio.band(lo, hi)`, REQ-GRAPHICS-12/13). **Không cần stem:** mọi thứ dựa trên nốt và automation (Piano Roll, bàn phím, Live Trigger, Event Counter, hợp âm và giọng từ MIDI, độ sáng theo automation, P-02…P-13); widget âm thanh dùng tệp mix chung.
* **Định dạng:** như tệp mix (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`; khả năng giải mã phụ thuộc trình duyệt). Khuyến nghị WAV hoặc FLAC; MP3 có độ trễ đệm đầu tệp của bộ mã hoá (encoder delay) nên có thể lệch vài chục ms.
* **Điều kiện tệp:** mọi stem và tệp mix xuất **từ cùng điểm bắt đầu dự án** (bar 1 hoặc vị trí 0) và cùng độ dài; không cắt khoảng lặng đầu (tắt "trim silence"); cùng tần số lấy mẫu là tốt nhất (khác nhau vẫn nhận, được chuyển đổi khi phân tích). Lệch độ dài quá 50 ms thì cảnh báo `WARN_STEM_LENGTH`; mỗi stem có thanh **offset** riêng ±10 s, bước 1 ms như REQ-WIDGET-07.
* **Ghép stem với track:** tự ghép theo tên tệp so với tên track (không phân biệt hoa thường; bỏ tiền tố số như `01 `, `03-`, `Track 3 - `; bỏ hậu tố như ` (stem)`); tệp không ghép được hiện trong danh sách chờ để **kéo thả** vào track (`WARN_STEM_UNMATCHED`). Một stem có thể gán cho nhiều track (ví dụ stem của nhóm/bus), một track có thể không có stem.
* **Phát và xuất:** có tệp mix thì phát và xuất bằng mix; stem mặc định **chỉ dùng để phân tích**, không phát, tránh âm thanh bị cộng đôi. Không có mix thì cho chọn "phát bằng tổng các stem" (cộng có hệ số, cảnh báo nguy cơ vượt 0 dBFS).
* **Bộ nhớ và hiệu năng:** giải mã từng stem theo khối trong Worker, tính sẵn bộ đệm phân tích dạng mono (đỉnh/RMS, FFT theo khung) rồi **giải phóng PCM** của stem (stem không phát). Giới hạn **[PROVISIONAL]**: tối đa 24 stem, tổng thời lượng stem ≤ 240 phút; vượt thì `ERR_AUDIO_TOO_MANY` kèm gợi ý gộp stem.
* **Lưu trữ:** bộ đệm phân tích (nhỏ) lưu trong phiên và Project Pack, nên mở lại dự án **không cần nạp lại stem**; tệp stem gốc lưu kèm Pack là tuỳ chọn (mặc định không, vì nặng). Nạp lại stem khi muốn đổi tham số phân tích (kích thước FFT, dải tần).
* **Hướng dẫn trong ứng dụng:** khi người dùng chọn một track làm nguồn cho widget âm thanh mà track chưa có stem, hiện thông báo kèm hướng dẫn xuất stem theo DAW nhận diện được từ tệp dự án (bằng ngôn ngữ đang chọn), ví dụ: Ableton Live: *File → Export Audio/Video → Rendered Track: All Individual Tracks*; Reaper: *File → Render → Source: Stems (selected tracks)*; FL Studio: xuất WAV với tuỳ chọn *Split mixer tracks*; Bitwig Studio, Studio One và DAW khác: chức năng xuất stem/track riêng của DAW. Pre-flight (REQ-EXPORT-00) báo widget nào đang thiếu stem.
* **Ngoài phạm vi:** tách nguồn bằng AI ngay trong trình duyệt (tự tách vocal/trống/bass từ tệp mix). Mô hình nặng và kết quả không tất định trên mọi máy; chỉ cân nhắc sau 1.2.

#### REQ-WIDGET-08: Progress Bar (D-27)
* Thanh tiến độ của bài nhạc, người dùng tự thêm vào Canvas (theo đề xuất Spike 2). Tiến độ `P = clamp((t − rangeStart) / (rangeEnd − rangeStart), 0, 1)`, trong đó khoảng là Export Range nếu có, không thì toàn bộ thời lượng (cùng định nghĩa thời lượng ở REQ-EXPORT-00). Khác `Progress` của Event Counter (theo số nốt).
* Hướng: *Horizontal* (mặc định) hoặc *Vertical*. Kiểu: thanh đầy, đường mảnh có đầu tròn, hoặc các đoạn theo Bar.
* Tuỳ chọn: màu nền/màu tiến độ, bo góc, độ dày, hiển thị `%`, hiển thị thời gian đã qua / còn lại (`mm:ss`), tuỳ chọn đánh dấu ranh giới đoạn hợp âm hoặc mốc Bar (mặc định tắt).
* Chỉ phụ thuộc `t` và khoảng thời gian, nên tất định cho Preview và Export (REQ-GRAPHICS-05). Không cần track gán. Thời lượng bằng 0 thì hiển thị 0%, không chia cho 0.

### 3.4b. Đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11) **[ĐỀ XUẤT, chưa cam kết v1.0]**

> **Cập nhật v1.1 (D-40):** toàn bộ P-01…P-13 thuộc **phạm vi bản 1.0**. Tiêu đề mục giữ nguyên để không làm hỏng liên kết. P-10 (marker), P-11 (lời) cần thêm `meta.markers[]`, `meta.lyrics[]` vào AST; P-13 cần đọc automation Ableton/DAWproject (SOI-18).

Dựa trên dữ liệu AST đã có (nốt, tick, kênh, tempo, dấu nhịp, `tempoSource`). Cột *Dữ liệu* cho biết có sẵn hay cần parser đọc thêm.

| # | Đề xuất | Hiển thị | Dữ liệu | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- |
| P-01 | **Piano Keyboard** | Bàn phím 88/61/49 phím, phím sáng theo nốt đang phát (màu theo track, hiện tên nốt tuỳ chọn) | Có sẵn (`pitch`, thời gian) | Cao: dễ hiểu, hợp Persona 2 |
| P-02 | **Tempo & Time Signature** | BPM và dấu nhịp hiện tại, đường cong tempo, hiệu ứng khi tempo/nhịp đổi | Có sẵn (`tempoMap`) | Cao: tận dụng ghi đè tempo và dấu nhịp |
| P-03 | **Bar & Beat Counter** | `Bar.Beat.%` hoặc `Bar.Beat.Sixteenth`, nhấp nháy theo beat, đếm theo dấu nhịp | Có sẵn | Cao (mở rộng Time & Bar Counter) |
| P-04 | **Key / Scale Detection** | Giọng và điệu thức đang chạy (ví dụ C minor), độ tin cậy; thuật toán dạng Krumhansl-Schmuckler theo cửa sổ trượt | Có sẵn (tính ở Analysis Worker, cùng phía với hợp âm) | Cao |
| P-05 | **Velocity / Dynamics** | Thanh mức vận tốc theo track hoặc tổng, biểu đồ phân bố vận tốc | Có sẵn | Trung bình |
| P-06 | **Note Density / Polyphony** | Bản đồ nhiệt mật độ nốt theo ô nhịp và track; số nốt đang vang | Có sẵn | Trung bình |
| P-07 | **Pitch-Class Wheel / Circle of Fifths** | Vòng 12 cao độ sáng theo nốt đang chơi, kèm hợp âm (liên kết Chord Detection) | Có sẵn | Trung bình |
| P-08 | **Arrangement Overview** | Bản đồ thu nhỏ các track theo thời gian, vạch phát | Có sẵn (nốt gom theo ô nhịp) | Trung bình |
| P-09 | **Drum Pad Grid** | Lưới pad cho track trống (GM, kênh 10), pad sáng theo nốt | Có sẵn (`channel`; nhãn GM) | Trung bình |
| P-10 | **Section / Marker Label** | Hiện tên đoạn (Intro, Verse, Drop...) từ marker/vùng | **Cần parser đọc thêm**: Reaper `MARKER`, Ableton Locators, marker MIDI | Thấp–trung bình |
| P-11 | **Lyrics / Text Cue** | Chữ chạy theo MIDI meta Lyric/Text | **Cần parser đọc thêm**: meta sự kiện 0x01/0x05 | Thấp |
| P-13 | **Automation Lane** | Đường âm lượng/pan/mute theo thời gian; nguồn của độ sáng track (REQ-GRAPHICS-06) | Reaper đã đọc (track-level, `track.automation`); **còn thiếu**: Ableton automation, envelope trong item, kiểm chiều pan/mute | Thấp–trung bình |
| P-12 | **Cách ghi tên nốt/hợp âm** | Thiết lập dùng chung cho mọi widget: `C D E`, `Do Re Mi`, `H` thay `B`, `ハニホ`, tên bậc | Cấu hình (liên quan REQ-I18N-08) | Cao: rẻ, tránh làm lại |

Nguyên tắc: mỗi widget mới chỉ phụ thuộc `t` và dữ liệu AST/phân tích tính trước (REQ-GRAPHICS-05), nên tất định cho Preview và Export. Nếu chốt P-10/P-11 thì thêm trường `meta.markers[]` / `meta.lyrics[]` vào AST (REQ-AST-01) và việc đọc vào từng parser.

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

### 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07)

#### REQ-CAP-01: Phát hiện khả năng của trình duyệt (R-06, D-05)
Khi khởi động và trước mỗi lần xuất, kiểm tra: `VideoEncoder`, `AudioEncoder`, `OffscreenCanvas`, `isConfigSupported` cho H.264/AAC/VP9/Opus, File System Access API, `navigator.storage`. Kết quả được dùng để bật/tắt tính năng và chọn bậc dự phòng ở REQ-EXPORT-06. Thiếu WebCodecs thì hiển thị thông báo rõ nguyên nhân và vẫn cho dùng Edit/Preview.

#### REQ-EXPORT-00: Pre-flight (R-01, D-17)
* **Kích thước chẵn**: chiều rộng và cao phải là số chẵn dương; số lẻ tự làm tròn lên số chẵn gần nhất và thông báo. Cạnh dài ≤ 4096 px.
* **Lớp độ phân giải** (theo cạnh ngắn): 720p = 720, 1080p = 1080, 4K = 2160; cạnh dài = `round(cạnh_ngắn × tỉ_lệ)` rồi làm chẵn; nếu cạnh dài > 4096 thì thu nhỏ đồng tỉ lệ.

| Tỉ lệ | 720p | 1080p | 4K |
| :--- | :--- | :--- | :--- |
| 16:9 | 1280×720 | 1920×1080 | 3840×2160 |
| 9:16 | 720×1280 | 1080×1920 | 2160×3840 |
| 1:1 | 720×720 | 1080×1080 | 2160×2160 |

* **Kích thước tuỳ ý (D-26, Spike 1)**: ngoài các mốc 720p/1080p/4K, người dùng nhập **rộng × cao** tuỳ ý hoặc một **tỉ lệ khung tuỳ chỉnh** (ví dụ 21:9) cộng cạnh ngắn. Áp dụng cùng quy tắc: số chẵn dương, cạnh dài ≤ 4096 (thu nhỏ đồng tỉ lệ nếu vượt), kèm thông báo khi làm tròn.
* **Giao diện chọn kích thước (bổ sung v1.1):**
  * Ô **Rộng** và **Cao** (px), nút **khoá tỉ lệ** (sửa một ô thì ô kia tự tính), ô **tỉ lệ** nhận dạng `W:H` hoặc số thập phân (`21:9`, `4:5`, `2.39:1`, `1.91`).
  * Danh sách dựng sẵn: 16:9, 9:16, 1:1, 4:5 (bài dọc mạng xã hội), 4:3, 3:2, 21:9, 2.39:1 (điện ảnh), 1.91:1 (ảnh xem trước liên kết), cùng mục "Tuỳ chỉnh"; người dùng lưu kích thước hay dùng thành preset.
  * Giới hạn: cạnh ngắn ≥ 128, cạnh dài ≤ 4096 (đủ DCI 4K 4096×2160); số lẻ làm tròn xuống số chẵn. Hiện ngay kích thước thực sau làm tròn, tỉ lệ thực, dung lượng ước tính và cảnh báo nếu `isConfigSupported` từ chối.
  * Khung Preview đổi theo tỉ lệ ngay khi nhập; bố cục xử lý theo REQ-GRAPHICS-04. Kích thước trên 4096 (8K) cân nhắc ở bản 1.2, vì phụ thuộc codec (VP9/AV1/HEVC) và bộ nhớ.
* **FPS**: 24, 30, 60 (mặc định 30; preset ngang 16:9 mặc định 60 **[PROVISIONAL]**).
* **Thương lượng codec**: gọi `VideoEncoder.isConfigSupported` với cấu hình thực tế; chọn profile/level H.264 theo độ phân giải và FPS, dò từ cao xuống thấp (ví dụ level 4.2 cho 1080p60, 5.1/5.2 cho 4K) **[VERIFY]** (SOI-05). Không hỗ trợ thì cảnh báo vàng và đề xuất hạ cấu hình.
* **Ước lượng tài nguyên**: tính kích thước file ≈ `bitrate × thời lượng`. Trình duyệt không có File System Access và ước lượng > 1 GB thì cảnh báo nguy cơ thiếu RAM (R-01) và gợi ý hạ độ phân giải hoặc dùng Export Range.
* **Bitrate mặc định** **[PROVISIONAL]**: 720p 6 Mbps; 1080p 12 Mbps; 4K 35 Mbps (chất lượng Thấp/Vừa/Cao nhân 0.5/1/1.5).
* **Export Range**: xuất cả bài hoặc đoạn Start→End (KPI-05). Khi xuất cả bài: `Duration = max(ProjectDuration, AudioDuration) + 2.0 s`.
* Hiển thị tóm tắt: kích thước, FPS, thời lượng, số khung hình, kích thước file ước tính, codec sẽ dùng, mọi cảnh báo.

#### REQ-EXPORT-01: Xung nhịp khung hình độc lập
* Không dùng `requestAnimationFrame` hay đồng hồ phát audio. Bước `Δt = 1/FPS`; tại khung `k`: `t_k = start + k × Δt`.
* Mỗi khung: gọi Render Core với `t_k` (REQ-GRAPHICS-05) lên `OffscreenCanvas` ở độ phân giải thực; tạo `VideoFrame` với `timestamp = Math.round(k × 1,000,000 / FPS)` µs và `duration` tương ứng; `encode(frame)`; **phải** `frame.close()` ngay sau đó.
* Chỉ định khung khóa (keyframe) mỗi 2 giây.
* Số khung `N = ceil(Duration × FPS)`.

#### REQ-EXPORT-02: Kiểm soát dòng chảy (R-01)
Theo dõi `videoEncoder.encodeQueueSize`. Nếu > 8 thì tạm dừng sinh khung (chờ sự kiện `dequeue`) cho đến khi ≤ 2. Áp dụng cho cả `AudioEncoder`.

#### REQ-EXPORT-03: Luồng âm thanh và Silent Audio (D-01 sửa, R-08)
* **Có audio**: giải mã, đổi về 48 kHz stereo nếu khác (resample), áp offset và Export Range, cắt theo khoảng xuất (đoạn thiếu thì chêm im lặng). Đưa vào `AudioEncoder` theo khối (ví dụ 1 giây mỗi khối), mã hóa AAC (mặc định 128 kbps **[PROVISIONAL]**).
* **Đồng bộ**: mẫu audio đầu tiên phải có timestamp 0, trùng với khung video đầu tiên; bù độ trễ priming của AAC để không tích lũy lệch (KPI-02, NFR-ACC-01). Nếu Mediabunny đã xử lý priming thì chỉ cần kiểm chứng bằng bài kiểm thử đồng bộ (AT-03).
* **Không có audio (v0.3)**: mặc định xuất **video-only** (`export.silentAudioFallback = false`). Spike 1: bật Silent AAC (AAC-LC 64 kbps, 48 kHz, 2 kênh) gây lỗi encoder trên máy tính (LOQ) trong khi điện thoại chạy bình thường; MP4 video-only mở tốt trên các phần mềm dựng và trình phát kiểm thử. Người dùng có thể bật công tắc để tạo PCM 0 mã hóa AAC và ghép vào MP4 (best-effort); không mã hóa được AAC thì rơi về video-only và không chặn xuất.
* **Số đo A/V [ĐÃ ĐO, Spike 1]**: PC desktop: `first audio ts − first video ts` = 0,00 ms (đạt ±2 ms). Điện thoại Snapdragon 685: −42,67 ms (không đạt) do độ trễ khởi tạo audio khi chạy đồng thời hai encoder trong Worker; KPI-02 chỉ cam kết desktop (R-11).

#### REQ-EXPORT-04: Ghép container qua Mediabunny (D-04)
* `MuxerAdapter` bọc Mediabunny, ghép MP4 **fast-start** (moov ở đầu file) khi có thể. **[ĐÃ ĐO, Spike 1]** `fastStart: false` cho bố cục `ftyp mdat moov`; `fastStart: 'in-memory'` cho `ftyp moov mdat` (đạt fast-start). Chế độ ghi thẳng xuống đĩa kết hợp fast-start vẫn **[VERIFY]** (SOI-10).
* Có File System Access API: ghi trực tiếp xuống đĩa qua `FileSystemWritableFileStream`. Không có: tích lũy chunk vào bộ nhớ và kích hoạt tải xuống khi xong.
* Tên file mặc định: `{tên_dự_án}_{rộng}x{cao}_{fps}fps.mp4` (kích thước thực sau khi làm chẵn, v0.3), ký tự không hợp lệ bị thay bằng `_`. Tên file **phải được chốt trước khi bắt đầu vòng render** và dùng ngay khi mở luồng ghi (File System Access `showSaveFilePicker` hoặc tên tải xuống), không đổi tên thụ động khi kết thúc (Spike 1).

#### REQ-EXPORT-05: Giao diện tiến độ và hủy
Lớp phủ modal hiển thị: thanh tiến độ 0–100%, `Frame x / N`, tốc độ (FPS render, bội số thời gian thực, ví dụ `1.8x`), thời gian còn lại ước tính (ETR, làm mượt theo trung bình trượt). Nút **Hủy xuất**: gửi lệnh cho Export Worker, gọi `reset()`/`close()` các encoder, hủy luồng ghi (`abort()` để không để lại file dở), giải phóng bộ nhớ mà không làm sập tab. Hoàn thành thì hiển thị tên file, kích thước, thời gian xuất.

#### REQ-EXPORT-06: Chuỗi dự phòng codec (D-05, R-06)

```text
+----------------------------------------------------------------------------+
| TIER 1 - Maximum compatibility (default)                                   |
| Video: H.264 (AVC), profile/level chosen per D-17                          |
| Audio: AAC (real audio or Silent Audio)                                    |
| Container: MP4 (Mediabunny)                                                |
+----------------------------------------------------------------------------+
                     |  AAC encode unsupported on this OS
                                      v
+----------------------------------------------------------------------------+
| TIER 2 - Video-only MP4                                                    |
| Video: H.264 (AVC)                                                         |
| Audio: none                                                                |
| Container: MP4                                                             |
| Notice: file has no audio because the OS lacks an AAC encoder              |
+----------------------------------------------------------------------------+
                         |  H.264 encode unsupported
                                      v
+----------------------------------------------------------------------------+
| TIER 3 - Open standards fallback                                           |
| Video: VP9 (or VP8)                                                        |
| Audio: Opus (or none)                                                      |
| Container: WebM (Mediabunny)                                               |
| Notice: WebM output because the browser lacks H.264                        |
+----------------------------------------------------------------------------+
                           |  no supported encoder
                                      v
+----------------------------------------------------------------------------+
| TIER 4 - Fatal error                                                       |
| Abort export, show ERR_NO_SUPPORTED_ENCODER                                |
+----------------------------------------------------------------------------+
```

KPI-03 chỉ áp dụng cho Tier 1. Từ Tier 2 trở đi, người dùng được thông báo rõ phiên bản đầu ra khác mặc định.

#### REQ-EXPORT-08: Xuất nền trong suốt để ghép trong phần mềm dựng (D-47), bản 1.0
Dành cho người muốn tự xoay 3D, ghép cảnh hay thêm hiệu ứng trong After Effects, Premiere Pro, DaVinci Resolve, CapCut…
* Tuỳ chọn **Nền trong suốt** (bỏ màu/ảnh nền của cảnh; mọi lớp khác giữ nguyên, kể cả độ trong của phát sáng). Nền, ảnh nền, video nền **vẫn nằm trong dự án**; chỉ là không vẽ vào lần xuất này.
* **Chọn lớp cho từng lần xuất:** danh sách lớp có ô tick "đưa vào lần xuất này" (mặc định tất cả). Nhờ vậy người dùng xuất **hai lần**: lần 1 chỉ lớp nền (không cần alpha, có thể MP4), lần 2 các lớp còn lại với nền trong suốt; trong After Effects/Premiere đặt nền ở dưới, chỉ nghiêng lớp trên. Hai lần xuất dùng cùng kích thước, fps, Export Range và điểm đầu nên khớp từng khung.
* **Bản 1.1:** nút **"Xuất tách lớp"** làm tự động việc trên: một lần bấm cho ra mỗi nhóm lớp đã chọn (ví dụ Nền / Nốt / HUD / Hạt) thành một chuỗi PNG hoặc tệp riêng trong cùng thư mục, tên có hậu tố nhóm.
* **Định dạng:**
  * **Chuỗi ảnh PNG** (luôn có): `{tên}_{rộng}x{cao}_{fps}fps_000001.png`…; ghi thẳng vào một **thư mục** người dùng chọn (File System Access, `showDirectoryPicker`); trình duyệt không hỗ trợ thì đóng thành `.zip`, chỉ cho phép đoạn ngắn. Pre-flight ước tính dung lượng (PNG 1080p cỡ 1–3 MB mỗi khung, nên một bài 3 phút 60 fps có thể tới hàng chục GB) và gợi ý Export Range hoặc hạ fps.
  * **WebM VP9 có kênh alpha** khi `VideoEncoder` hỗ trợ (`alpha: 'keep'`) **[VERIFY]** trên Chrome/Edge Windows và macOS; nhẹ hơn nhiều nhưng không phải phần mềm dựng nào cũng đọc được alpha của WebM.
  * MP4 H.264 **không** có kênh alpha nên bị khoá khi bật nền trong suốt.
* **Hướng dẫn trong ứng dụng** (hiện sau khi xuất): After Effects: nhập chuỗi PNG (tick "PNG Sequence"), đặt fps, bật công tắc **3D Layer** rồi chỉnh X/Y/Z Rotation; Premiere Pro: hiệu ứng **Basic 3D** (Swivel/Tilt) hoặc nhập vào After Effects qua Dynamic Link. Khuyến nghị xuất độ phân giải cao hơn khung cuối nếu sẽ nghiêng mạnh, vì phía xa bị co lại.
* Âm thanh: tuỳ chọn xuất kèm tệp `.wav` cùng tên (cùng điểm đầu) để ghép lại trong phần mềm dựng.

#### REQ-EXPORT-07: Thực thi trong Worker (ARC-02, D-21)
* Vòng render, encoder và muxer chạy trong Export Worker; luồng chính chỉ gửi cấu hình, nhận tiến độ và lệnh hủy.
* Dữ liệu cần thiết (AST, ChordTimeline, cache audio, font, ảnh nền) được chuyển sang Worker bằng `postMessage` có chuyển quyền sở hữu (transferable) khi có thể.
* Worker lỗi bất ngờ thì báo `ERR_EXPORT_FAILED`, giữ nguyên phiên làm việc và cho thử lại.
* Nên dùng Screen Wake Lock trong lúc xuất để máy không ngủ (nếu trình duyệt hỗ trợ).

---


### 3.7. Đa ngôn ngữ và cộng đồng dịch (BR-09, D-30, KPI-08)

Triển khai tham chiếu: package `@dawviz/i18n`, thư mục `locales/`, `scripts/check-i18n.mjs`, hướng dẫn `docs/I18N.md`; trang demo đã dùng đầy đủ.

* **REQ-I18N-01:** mọi chuỗi giao diện nằm trong `locales/<mã BCP 47>.json` (JSON phẳng, khoá `nhóm.mục`, khối `@meta`: `code`, `name` bằng chính ngôn ngữ đó, `dir`, `status` ∈ `source|complete|partial`, `translators`). `en` là nguồn, `vi` đầy đủ. Không có chữ cứng trong HTML/JS.
* **REQ-I18N-02:** cú pháp chuỗi `{tham_số}` và `{n, plural, one {#…} other {#…}}` theo `Intl.PluralRules` (nhánh `other` bắt buộc); không ghép câu bằng cách nối chuỗi; số, thời lượng định dạng theo locale; dự phòng `vi-VN → vi → en → khoá`, chuỗi thiếu được ghi lại.
* **REQ-I18N-03:** mã lỗi và cảnh báo (Phụ lục A, A2) dịch theo **mã** (`errors.ERR_*`, `warn.WARN_*`); `message` gốc của thư viện parser là thông điệp kỹ thuật cho nhà phát triển, hiện trong mục "chi tiết kỹ thuật". Mã mới phải kèm khoá dịch.
* **REQ-I18N-04:** thứ tự chọn ngôn ngữ: lựa chọn đã lưu → `navigator.languages` → `en`; đổi ngôn ngữ không tải lại trang; `<html lang>` và `dir` cập nhật; lưu lựa chọn bằng `localStorage` có `try/catch`.
* **REQ-I18N-05:** bộ kiểm tự động (`npm run i18n:check`) chặn: JSON sai, thiếu/thừa khoá, chuỗi rỗng, tham số khác bản gốc, nhánh số nhiều không tồn tại trong ngôn ngữ, khoá dùng trong mã mà không có trong `en.json`, locale chưa vào `index.json`. Ngôn ngữ `partial` được thiếu khoá.
* **REQ-I18N-06:** quy trình đóng góp: thêm file `<mã>.json` và một dòng `locales/index.json`, không sửa mã; người bảo trì duyệt; tên người dịch ghi trong `@meta.translators` (OI-13).
* **REQ-I18N-07 (video xuất ra):** văn bản trên canvas và video (Track Info, Chord Detection, tên widget do người dùng đặt) dùng cùng từ điển và phải hiển thị được chữ viết của ngôn ngữ đó: font có đủ glyph (Latin mở rộng/Việt, CJK, Ả Rập, Thái, Devanagari...) nạp bằng `FontFace` trong Worker xuất video (Spike 1: nạp font trong Worker hoạt động); chữ từ phải sang trái và ký tự ghép dùng `canvas.direction` và `fontKerning` phù hợp **[VERIFY]**; khi font thiếu glyph, báo cho người dùng thay vì xuất ô vuông.
* **REQ-I18N-08 (cách ghi tên nốt/hợp âm):** thiết lập riêng, không gắn với ngôn ngữ giao diện: `C D E` (mặc định), `Do Re Mi`, `H` thay `B`, `ハニホ`, tên bậc. Áp dụng cho Piano Roll, Chord Detection, Key Detection và các widget hiển thị tên nốt; lưu trong cấu hình/Preset và Project Pack.
* **Giao diện hướng phải-sang-trái:** CSS dùng thuộc tính logic (`margin-inline-*`, `text-align:start`), bố cục canvas thiết kế theo toạ độ logic nên không bị đảo; hỗ trợ RTL đầy đủ không thuộc v1.0 nhưng không được chặn bởi cách viết CSS.


### 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40)

Thiết kế chi tiết: `docs/design/CUSTOMIZATION.md` (AD-08…AD-12), `docs/design/ANIMATION-CATALOG.md` (danh mục, nhãn bản phát hành), `docs/design/EXPRESSIONS.md` (AD-13…AD-15). Mọi yêu cầu dưới đây giữ tính tất định (REQ-GRAPHICS-05, D-37): khung hình là hàm của `t`.

#### REQ-GRAPHICS-09: Bộ máy keyframe, easing và Graph Editor
* **1.0:** kiểu nội suy hold, linear, bezier, continuous, auto, auto-clamped, Catmull-Rom, monotone; tách chiều; motion path tốc độ đều theo quãng đường và auto-orient; nội suy màu OKLab, góc đường ngắn; ngoại suy constant và loop (cycle, ping-pong, offset, theo nhịp); modifier noise, stepped, clamp, generator. Bộ easing: Easy Ease có influence, Penner đầy đủ, Back/Elastic/Bounce có tham số, CSS (`cubic-bezier`, `steps`), smoothstep, spring, đường cong tự vẽ. Graph Editor cơ bản: value graph, speed graph, velocity/influence bằng số, bắt dính nhịp, thư viện easing.
* **1.1:** TCB, Vector, roving keyframe, CSS `linear()`, inertia, anticipate, easing từ biểu thức; Graph Editor đầy đủ (nhiều đường cong, chuẩn hoá, flatten/align/break, co giãn vùng chọn, đường cong ma, bake).

#### REQ-GRAPHICS-10: Template chuyển cảnh nốt
* **1.0:** bốn pha `enter`, `hit`, `sustain`, `exit`, mỗi pha có thời lượng, easing, hiệu ứng; NoteLayer có hướng cuộn `left/right/up/down`, **góc tự do 0–360°** (REQ-WIDGET-01) và vạch phát tuỳ chỉnh (REQ-GRAPHICS-16); tối thiểu 9 template dựng sẵn (`scroll-left`, `fall-down`, `rise-up`, `drop-bounce`, `pop-in`, `fade-scale`, `morph`, `shatter`, `ripple`); morph cùng họ hình (AD-11). Morph đường SVG tự do: **1.2**.

#### REQ-GRAPHICS-11: Hạt không trạng thái
* **1.0:** PRNG có seed, chuyển động dạng đóng (trọng lực, lực cản), nhiễu tất định; nguồn phát theo nốt (`hit`, `sustain`, `exit`), vạch phát, nhịp, môi trường; hình hạt cơ bản và ảnh; hoà trộn cộng sáng; giới hạn số hạt (CUSTOMIZATION §7). **1.1:** attractor, sub-emitter, vệt hạt.

#### REQ-GRAPHICS-12: Storyboard, hiệu ứng và chữ động
* **1.0:** mô hình `SceneDocument` có lớp và phần tử (NoteLayer, Widget, Sprite, Text, Shape, ParticleEmitter); keyframe theo `sec`, `beat`, `bar.beat`, `tick`; bindings dữ liệu nhạc; các hiệu ứng nhãn `v1.0` trong ANIMATION-CATALOG dưới dạng preset `effect`; text animator cơ bản (typewriter, range selector, stagger, counter); chỉnh keyframe qua bảng thuộc tính. **1.1:** timeline nhiều lớp đầy đủ, hiệu ứng nhãn `v1.1` (gồm WebGL sau Spike T-27), text animator nâng cao.

#### REQ-GRAPHICS-13: Biểu thức thuộc tính
* **1.0:** mọi thuộc tính số/màu nhận biểu thức theo EXPRESSIONS §3 (danh sách trắng biến và hàm, không vòng lặp, giới hạn độ dài/độ sâu/bước); ô nhập báo lỗi theo vị trí; lỗi khi chạy dùng giá trị dự phòng và cảnh báo theo phần tử. **1.1:** tô màu cú pháp, gợi ý tên, nút "Bake thành keyframe".

#### REQ-GRAPHICS-14: Khoảng hiển thị theo thời gian và theo track
* **1.0:** mọi widget và phần tử cảnh có danh sách **khoảng hiển thị** (`from`–`to`), nhập bằng giây, `bar.beat` hoặc chọn **marker** của dự án (P-10); có thời gian hiện dần/ẩn dần và easing (REQ-GRAPHICS-09). Mặc định: hiện suốt bài. Kéo hai đầu khoảng trực tiếp trên timeline (REQ-UI-03).
* **Gán track:** widget dùng dữ liệu nốt (Piano Roll, Track Info, Live Trigger, Event Counter, bàn phím, P-04…P-09) chọn một, nhiều hoặc tất cả track. Có thể **đổi tập track theo khoảng thời gian** (ví dụ đoạn verse chỉ hiện piano, đoạn điệp khúc hiện thêm dây), khai báo như một khoảng hiển thị kèm danh sách track.
* Spectrum/waveform: khoảng hiển thị như trên; chọn nguồn audio theo REQ-WIDGET-07.

#### REQ-GRAPHICS-15: Không gian 2.5D: xoay X/Y/Z và camera phối cảnh (D-47), bản 1.1
* **Mỗi lớp/phần tử** có biến đổi 3D: `rotateX`, `rotateY`, `rotateZ` (độ), `positionZ` (độ sâu), điểm neo 3D, tỉ lệ; mọi trường gắn keyframe, binding và biểu thức (REQ-GRAPHICS-09…13). Cả **toàn cảnh** cũng xoay được như một tấm phẳng (cách nhanh nhất để "nhìn chéo" cả dự án).
* **Lớp nền khi xoay 3D:** mặc định nền **gắn với màn hình** (không chịu xoay của cảnh và camera), nên khi nghiêng nốt thì nền vẫn phủ kín khung, không lộ góc trống. Người dùng có thể chuyển nền thành **một tấm trong không gian 3D** (xoay cùng cảnh, hoặc đặt ở xa phía sau để có hiệu ứng thị sai); khi đó phần khung không được phủ lấp bằng màu nền dự phòng, và có nút "Phóng to để phủ kín"
* **Camera cảnh:** phối cảnh (góc nhìn 10°–120° hoặc tiêu cự quy đổi), vị trí, điểm nhìn, quay quanh (orbit), có keyframe; chế độ **trực giao** (orthographic) cho kiểu isometric.
* **Preset góc nhìn:** Nghiêng chéo (khoảng 25–35°), Nhìn từ dưới lên, Isometric, **Đường băng** (Piano Roll nằm phẳng, nốt chạy về phía chân trời như game nhịp điệu), Lật thẻ. Người dùng chọn rồi chỉnh tiếp.
* **Cách vẽ:** mỗi lớp vẫn vẽ bằng Render Core (Canvas 2D) thành một texture, sau đó ghép các tấm phẳng trong không gian 3D bằng **WebGL2** (phép chiếu phối cảnh, sắp xếp theo độ sâu; không hỗ trợ hai tấm cắt xuyên nhau). Lớp nghiêng được vẽ ở độ phân giải cao hơn theo mức co phối cảnh để không bị mờ. Preview và Export dùng cùng đường WebGL (Export trong Worker với `OffscreenCanvas` WebGL2); sai khác theo ngưỡng *khác đường vẽ* của REQ-GRAPHICS-05.
* **Chỉnh sửa:** tay nắm xoay 3 trục trong Edit Mode, ô nhập số, nút "Về phẳng 2D"; trình duyệt không có WebGL2 thì tắt 3D, vẽ phẳng và báo cảnh báo.
* **Phụ thuộc:** Spike WebGL2 (T-27). **Sau 1.2 (cân nhắc):** nốt là khối 3D thật có ánh sáng và bóng, độ sâu trường ảnh (DOF).

#### REQ-STORAGE-05: Tài nguyên của phiên
* **1.0:** ảnh (PNG/JPEG/WebP/GIF khung đầu), SVG (chỉ vẽ dạng ảnh), sprite sheet, phông (WOFF2/TTF/OTF); định danh SHA-256; lưu IndexedDB; giới hạn kích thước (`ERR_ASSET_TOO_LARGE`, `ERR_ASSET_DECODE`); đóng gói vào Project Pack; pre-flight báo thiếu tài nguyên trước khi xuất.

#### REQ-STORAGE-06: Preset mới và chia sẻ
* **1.0:** các loại `note-style`, `note-transition`, `easing`, `particle`, `theme`, `effect`, `scene`; JSON Schema, `schemaVersion` và di trú (REQ-STORAGE-04); "Chia sẻ thành preset" xuất `.dawviz-preset.zip` (JSON + tài nguyên + băm + giấy phép SPDX bắt buộc); nhập kèm nhãn "Chưa kiểm duyệt". **1.1:** thư viện cộng đồng trong ứng dụng (D-14), xác minh băm, danh sách thu hồi, kiểm duyệt theo D-43.

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 4.1. Hiệu năng & tài nguyên (NFR-PERF)

**Máy chuẩn RM-1 [PROVISIONAL] (D-16, OI-02):** CPU 6 nhân/12 luồng x86-64 ≥ 2.5 GHz hoặc Apple M1 (8 nhân); RAM 16 GB; GPU tích hợp (Intel Iris Xe / AMD Radeon Graphics / Apple 8-core) có bộ mã hóa H.264 phần cứng; Windows 11 hoặc macOS, Google Chrome bản ổn định mới nhất. Mọi chỉ số bên dưới đo trên RM-1.

| Mã | Yêu cầu |
| :--- | :--- |
| **NFR-PERF-01** [PROVISIONAL] | Phân tích tệp dự án ≤ 30 MB (giải nén ≤ 100 MB) trong ≤ 1.5 giây. **[ĐÃ ĐO]** Demo.als (4 MB gzip, 9,605 nốt): ≈ 0,6 giây trong Worker; `.alp` 65 MB (3 `.als`): ≈ 0,15 giây; Reaper 13 MB (7,497 nốt): chưa đo thời gian chính thức. |
| **NFR-PERF-02** | Edit/Preview giữ ≥ 55 FPS trên màn 60 Hz với tới 5,000 nốt hiển thị đồng thời. |
| **NFR-PERF-03** [PROVISIONAL] | 1080p@60fps, H.264 phần cứng: tốc độ xuất ≥ 1.2× thời gian thực (đoạn 60 s xuất trong ≤ 50 s). 4K@60fps: best-effort (KPI-07). **[ĐÃ ĐO, Spike 1]** máy LOQ (chưa phải RM-1): 2,4–2,65×. |
| **NFR-PERF-04** [PROVISIONAL] | RAM của tab khi render 4K ≤ 2.0 GB; không rò rỉ bộ nhớ qua các lần xuất liên tiếp (RAM sau 3 lần xuất liên tiếp không tăng quá 10% so với sau lần đầu). |
| **NFR-PERF-05** [PROVISIONAL] | Khi kéo thanh Timeline (seek), khung hình mới hiện trong ≤ 100 ms (nhờ truy cập ngẫu nhiên, REQ-GRAPHICS-05). |

### 4.2. Độ chính xác & toàn vẹn (NFR-ACC)

* **NFR-ACC-01 (KPI-02):** lệch A/V giữa timestamp video và audio trong container ≤ ±2.0 ms và không tích lũy (đầu và cuối video đều ≤ 2.0 ms). Áp dụng cho desktop; **[ĐÃ ĐO]** 0,00 ms trên PC, −42,67 ms trên điện thoại tầm trung (R-11).
* **NFR-ACC-02 (KPI-01):** `startTick` và `durationTick` sai số ≤ 1 tick so với MIDI tham chiếu xuất từ DAW gốc; pitch phải đúng 100%. Sai số 1 tick chấp nhận do làm tròn khi đổi đơn vị (beat/giây/PPQ gốc → 960).
* **NFR-ACC-03 (KPI-06):** nhận diện hợp âm 3–4 âm đạt ≥ 90% trên bộ mẫu có đáp án **[PROVISIONAL]**; hợp âm mở rộng là best-effort cùng Override.

### 4.3. An toàn, bảo mật & quyền riêng tư (NFR-SEC, BR-08)

* **NFR-SEC-01:** mọi dữ liệu file nhạc, dự án và video được xử lý trong bộ nhớ máy khách; không gửi nội dung người dùng ra ngoài. Ứng dụng chỉ tải tài nguyên tĩnh của chính nó (mã, từ điển ngôn ngữ, font đóng gói).
* **NFR-SEC-02:** cấm `eval()`, `new Function()`, `setTimeout(string)`, và chèn HTML chưa khử khuẩn vào DOM. Tên nốt, tên track, tiêu đề lấy từ file phải được hiển thị bằng `textContent`/vẽ canvas, không bằng `innerHTML`.
* **NFR-SEC-03 (CSP):** ứng dụng phải gửi chính sách (qua header hoặc thẻ `meta` khi hosting không đặt được header):

```text
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:;
img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data: blob:;
style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

  Ghi chú: `frame-ancestors` chỉ có hiệu lực khi đặt bằng header. Nếu cần `style-src 'unsafe-inline'` cho thư viện giao diện thì phải ghi rõ lý do trong quyết định thiết kế (ARC-07, SOI-07). Font phải đóng gói cùng ứng dụng, không tải từ CDN.
* **NFR-SEC-04:** các giới hạn của REQ-PARSER-00 áp dụng cho mọi đường nhập (kéo thả, Project Pack, Preset, parser JSON, audio).
* **NFR-SEC-05 (biểu thức, 1.0):** trình thông dịch `@dawviz/expr` không sinh hay chạy JavaScript; tra biến/hàm theo danh sách trắng bằng `Map`; giới hạn EXPRESSIONS §3.4; có bộ test tấn công, fuzz có seed và test tĩnh cấm `eval`/`new Function`/`Proxy`/`Reflect`.
* **NFR-SEC-06 (1.0):** `apps/web/index.html` có CSP theo NFR-SEC-03 bằng thẻ `meta`, thêm `require-trusted-types-for 'script'`; preset không chứa URL ngoài; Worker vẽ có watchdog; host ở tổ chức GitHub riêng (D-41).
* **NFR-SEC-07 (1.0 phần nhập tệp, 1.1 phần thư viện):** ba mức tin cậy preset (dựng sẵn, cộng đồng đã duyệt, tự nạp); kiểm băm; danh sách `revoked`; thư viện cộng đồng được đưa vào cùng origin lúc build, không tải từ máy chủ ngoài khi chạy.

### 4.4. Tương thích, độ tin cậy & quốc tế hóa (NFR-COMP, NFR-REL)

* **NFR-COMP-01 (D-12, D-05):** nền tảng kiểm thử chính là Chromium (Chrome/Edge/Brave/Opera) trên Windows và macOS. Linux chạy theo khả năng phát hiện được; trình duyệt di động không cam kết (Spike 1: xuất được nhưng lệch A/V, R-11); AAC có thể không khả dụng (R-06), khi đó đi đường dự phòng Tier 2. Safari/Firefox chạy theo feature detection (OI-03).
* **NFR-COMP-02 (KPI-03):** MP4 Tier 1 (H.264 + AAC khi có audio; video-only khi không có audio, v0.3) phải phát và nhập được, không cần transcode, trên: YouTube, TikTok, Facebook, Instagram, Premiere Pro, DaVinci Resolve, Final Cut Pro, CapCut, VLC, QuickTime, Windows Media Player. Kiểm thủ công mỗi bản phát hành.
* **NFR-COMP-03 (D-12, D-30):** giao diện có Tiếng Anh (bản gốc) và Tiếng Việt, mở cho ngôn ngữ cộng đồng đóng góp (REQ-I18N-01 đến 08); mọi chuỗi giao diện nằm trong từ điển JSON, không hardcode; lựa chọn ngôn ngữ được lưu.
* **NFR-REL-01:** lỗi của Worker (parse, phân tích, xuất) không được làm mất phiên làm việc; ứng dụng báo lỗi bằng mã `ERR_*` và cho thử lại. Dữ liệu đã tự lưu phải khôi phục được sau khi tải lại trang.

---

## 5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG

### 5.1. Bố cục không gian làm việc

```text
+--------------------------------------------------------------------------------------------------------------------------------+
| [Logo] DAW Visualizer | Project: "Synthwave_Track.als" | Lang: [VI/EN v] | [Undo] [Redo] | [EXPORT MP4]                        |
+--------------------------------------------------------------------------------------------------------------------------------+
+------------------------------------+ +------------------------------------------------------+ +--------------------------------+
| LEFT PANEL: ASSETS & TRACKS        | | CENTER: CANVAS VIEWPORT                              | | RIGHT: INSPECTOR               |
|                                    | | [Aspect 16:9 v] [Zoom 75% v]                         | |                                |
| [+] Import project file            | | [x] Grid 8 pt  [x] Smart Guides                      | | Selected: [Piano Roll #1]      |
|     (.als .rpp .dawproject .mid)   | | +--------------------------------------------------+ | |                                |
| [?] FL Studio: export MIDI first   | | | [Track Info]            [Event Counter]          | | | X: 120    Y: 300               |
|                                    | | |                                                  | | | W: 1680   H: 450               |
| Tracks discovered (3):             | | | ======== [Piano Roll] ==============             | | | Z-Index: 10                    |
| [x] Lead Synth (Track 1)           | | |                                                  | | |                                |
| [x] Bassline   (Track 2)           | | | [Live Trigger]  [Time/Bar]  [Chord]              | | | Pitch range:                   |
| [ ] Drum Kit   (Track 3)           | | | [Audio Spectrum / Meter]                         | | | (*) Fit to content             |
|                                    | | +--------------------------------------------------+ | | ( ) Custom octave              |
| Audio (optional):                  | | Mode: (o) Edit  ( ) Preview                          | |                                |
| [song_master.wav] (active)         | |                                                      | | Orientation:                   |
| Offset: [ 0.000 s ]                | |                                                      | | (*) Horizontal                 |
|                                    | |                                                      | | ( ) Vertical                   |
| Preset: [Vertical 9:16 v] [Save]   | |                                                      | |                                |
+------------------------------------+ +------------------------------------------------------+ +--------------------------------+
+--------------------------------------------------------------------------------------------------------------------------------+
| BOTTOM: TIMELINE & RANGE CONTROLLER                                                                                            |
| [Play/Pause] [|<] [>|]   Current: 01:24.500 / Total: 03:45.000 (Bar 34.2.048)           [x] Loop range                         |
| Chord lane:   |  Am  |  F   |  C   | D/F# |   (double-click to add an override)                                                |
| Timeline:     [====|=================[========================]=========================]                                      |
|               00:00             Range Start 00:45.000   Range End 01:45.000 (60 s)                                             |
+--------------------------------------------------------------------------------------------------------------------------------+
```

### 5.2. Chế độ tương tác

**Edit Mode:** widget hiện khung viền mờ khi rê chuột; chọn widget thì hiện 8 điểm neo co giãn (4 góc, 4 cạnh); hiện đường gióng (token `guide`) khi bắt dính; Inspector tự mở tab tương ứng.
**Preview Mode:** ẩn khung, điểm neo, lưới, đường gióng; hiển thị giống hệt video xuất (Render Core, REQ-GRAPHICS-05); phát thử cùng audio nếu có.

### 5.3. Yêu cầu giao diện

* **REQ-UI-01 (Nhập file, D-19):** màn hình nhập file hỗ trợ kéo thả và chọn file; liệt kê định dạng hỗ trợ; có hướng dẫn "FL Studio: xuất MIDI rồi nạp file `.mid`"; ghi chú Ableton chỉ đọc clip Arrangement. Nhận `.flp` hoặc `.bwproject` thì báo `ERR_UNSUPPORTED_FORMAT` với nội dung **"chưa hỗ trợ"** kèm hướng dẫn thay thế (xuất MIDI; xuất `.dawproject`), không dùng cách nói "không hỗ trợ". Phần mở rộng không khớp nội dung (kiểm tra magic bytes: Gzip `1F 8B`, ZIP `PK`, MIDI `MThd`, Live Pack `pl-a`, `<REAPER_PROJECT`, XML) thì báo lỗi rõ ràng.
* **REQ-UI-02 (Hoàn tác):** Undo/Redo 50 bước cho thao tác bố cục, thuộc tính widget, override hợp âm, đổi preset/tỉ lệ. Phím tắt `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`. Dữ liệu dẫn xuất (AST, cache) không nằm trong lịch sử (ARC-05).
* **REQ-UI-03 (Phát và Timeline):** Play/Pause, nhảy đầu/cuối, kéo Playhead, chọn Export Range bằng hai tay nắm, Loop Range. Làn hợp âm hiển thị trên Timeline; nhấp đúp để thêm override.
* **REQ-UI-04 (Thông báo lỗi):** mọi lỗi `ERR_*` hiển thị bằng ngôn ngữ đang chọn, nêu nguyên nhân và hành động tiếp theo; mã lỗi hiển thị nhỏ kèm theo để người dùng báo cáo.
* **REQ-UI-06 (Nhập tempo thủ công, D-29):** khối "Ghi đè BPM" cho thêm nhiều ô nhập, mỗi ô gồm **mốc** (timestamp) và **BPM**; mỗi dòng có thêm ô **dấu nhịp** (gợi ý 4/4, 3/4, 2/4, 5/4, 6/8, 7/8, 9/8, 12/8; để trống = giữ nhịp trước); chọn **cách nhập mốc** theo đúng kiểu đồng hồ DAW: thời gian (`giây` hoặc `m:ss.mmm`, mọi DAW đều có), `Bar.Beat.%` (Reaper, vd `1.1.00`) hoặc `Bar.Beat.Sixteenth` (Ableton/Bitwig/Cubase, vd `1.1.1`); Bar.Beat quy đổi theo dấu nhịp hiệu lực tại từng dòng (nhịp đầu lấy từ file); nút thêm/xoá từng mốc và xoá hết. Mốc đầu tiên tính từ 0; chỉ có một mốc ở 0 thì dùng như BPM cố định. Ô để trống thì dùng tempo của file. Khi `tempoSource` khác `file` thì hiển thị nổi bật và gợi ý nhập (REQ-PARSER-07). Kết quả áp dụng ngay vào AST và Timeline; lưu trong Project Pack.
* **REQ-UI-07 (Chọn `.als` trong `.alp`, D-25):** sau khi nạp `.alp`, giao diện liệt kê các `.als` bằng `listAlp` (tên, dung lượng, BPM, danh sách track kèm số nốt, track tắt tiếng, lỗi nếu file không có nốt) dưới dạng danh sách chọn một; chọn là phân tích lại ngay, không phải nhập số thứ tự. Mặc định chọn `.als` lớn nhất. File không dùng được thì vô hiệu hoá kèm lý do. Lựa chọn được lưu trong phiên.
* **REQ-UI-08 (Đầu vào bổ sung theo ngữ cảnh):** giao diện chỉ hiện ô nạp thêm khi file vừa chọn thật sự cần: (a) `.rpp` tham chiếu `.mid` ngoài → hiện ô nạp `.mid` kèm tên các file cần; (b) định dạng nhị phân chưa hỗ trợ trực tiếp (`.bwproject`, `.flp`, đuôi lạ) → hiện ô nạp schema JSON (REQ-PARSER-05). Không cần thì ẩn. Nếu người dùng chưa nạp file cần thiết, **phải** hiển thị thông báo nêu rõ thiếu gì và hậu quả (không có nốt/chưa phân tích được); tempo không đọc được từ file cũng phải được báo kèm gợi ý nhập BPM (REQ-UI-06). Thư viện cung cấp `probeProject`.
* **REQ-UI-09 (Chọn ngôn ngữ, BR-09, D-30):** bộ chọn ngôn ngữ luôn thấy được, liệt kê theo tên ngôn ngữ viết bằng chính ngôn ngữ đó (lấy từ `locales/index.json`). Mặc định: lựa chọn đã lưu, nếu chưa có thì ngôn ngữ trình duyệt khớp theo chuỗi `vi-VN → vi`, cuối cùng là tiếng Anh. Đổi ngôn ngữ có hiệu lực ngay (kể cả kết quả đang hiển thị) và cập nhật `lang`/`dir` của trang.
* **REQ-UI-05 (Người dùng mới, BR-07, KPI-04):** sau khi nạp file hợp lệ, hệ thống tự áp preset mặc định, gán track và hiển thị sẵn nút Export nổi bật; đường đi tối thiểu "nạp → (chọn đoạn) → Export" không cần mở Inspector.
* **REQ-UI-10 (Theme sáng/tối cho giao diện, 1.0):** ba lựa chọn **Sáng**, **Tối** (mặc định hiện nay) và **Theo hệ thống** (`prefers-color-scheme`); lưu theo trình duyệt; đổi tức thì không tải lại trang. Theme chỉ đổi **giao diện ứng dụng**; màu khung hình video do cảnh và preset quyết định, không bị ảnh hưởng. Cả hai theme đạt tương phản WCAG AA cho chữ và điều khiển. Bảng màu theme khai báo bằng biến CSS để cộng đồng thêm theme giao diện về sau (1.1). **Theme chỉ đổi màu** (D-52): bộ token màu cố định (`docs/design/UI-DIRECTION.md` mục 5.2), không đổi phông, cỡ chữ, khoảng cách, bố cục, không nhận CSS tuỳ ý; theme cộng đồng được kiểm schema và tương phản AA trước khi áp, không đạt thì từ chối. Trong giao diện gọi là "Giao diện ứng dụng", phân biệt với "Phong cách video" (preset).
* **REQ-UI-11 (Bộ chọn màu và bảng màu, 1.0):**
  * Mọi ô chọn màu (màu track, nốt, nền, phím, chữ, gradient) dùng chung một bộ chọn: ô vuông màu + thanh hue + thanh alpha, và **ô nhập văn bản** nhận các dạng `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(255 0 0)` / `rgb(255, 0, 0)`, `rgba(…)`, số thập phân `255, 0, 0` hoặc `1.0, 0, 0`, `hsl(…)` / `hsla(…)`, **HSV/HSB** (`hsv(0 100% 100%)`), `oklch(…)`, và tên màu CSS. Có công tắc đổi cách hiển thị giữa HEX / RGB / HSL / HSV.
  * **Alpha (RGBA):** màu lưu dạng `#rrggbbaa`; alpha nhân với độ đục của đối tượng (REQ-GRAPHICS-07).
  * **Hút màu từ màn hình** bằng EyeDropper API khi trình duyệt hỗ trợ (Chromium); màu dùng gần đây (12 ô); sao chép màu ở định dạng đang chọn.
  * **Bảng màu (palette):** tạo, đặt tên, lưu thành preset (REQ-STORAGE-06). **Nhập bảng màu** bằng cách dán danh sách mã (cách nhau bởi dấu phẩy, khoảng trắng hoặc xuống dòng, có hoặc không có `#`), tệp GIMP `.gpl`, JSON (mảng mã màu) hoặc biến CSS (`--x: #…`); 1.1 thêm Adobe `.ase` và đường dẫn bảng màu Coolors. **Áp bảng màu cho các track**: tự gán lần lượt theo thứ tự track, hoặc kéo thả từng ô màu vào track.
* **REQ-UI-12 (Hiện/ẩn và solo track, 1.0):** mỗi track có nút **mắt** (hiện/ẩn) và nút **solo** (chỉ hiện track này, bấm Alt/Option khi solo để cộng thêm). Track tắt tiếng trong DAW mặc định ẩn nhưng có thể bật hiện (thay cho cờ `showMuted`). Ẩn/hiện áp cho mọi widget dùng track đó, lưu trong phiên và preset, hoàn tác được (REQ-UI-02). Có "Hiện tất cả" / "Ẩn tất cả".
* **REQ-UI-13 (Chế độ Cơ bản và Nâng cao, D-48, 1.0):**
  * **Lần đầu mở ứng dụng** hiện hộp chọn "Tôi mới dùng" (vào **Cơ bản**) / "Tôi đã quen phần mềm dựng hình" (vào **Nâng cao**); lựa chọn được nhớ theo trình duyệt và đổi lại được bất cứ lúc nào bằng công tắc ở thanh trên cùng hoặc trong Cài đặt.
  * **Cùng một dữ liệu:** hai chế độ chỉ khác **cái được hiện**, không khác dự án. Đổi chế độ không làm mất hay đổi thiết lập nào; hoàn tác (REQ-UI-02) đi xuyên qua cả hai.
  * **Mở từng bảng:** ở Cơ bản, mỗi bảng có nút **"Thêm tuỳ chọn"** để mở phần nâng cao của riêng bảng đó, không cần chuyển cả giao diện; trạng thái mở được nhớ theo bảng.
  * **Dấu hiệu đã chỉnh nâng cao:** thuộc tính đang dùng giá trị nâng cao (ví dụ keyframe, biểu thức, góc tự do) hiện huy hiệu "Đã chỉnh nâng cao" ở Cơ bản, kèm nút "Đặt lại về đơn giản"; preset và theme dùng tính năng nâng cao vẫn áp và chạy đúng ở Cơ bản.
  * **Tìm thiết lập:** ô tìm kiếm tìm cả thiết lập nâng cao; ở Cơ bản, chọn kết quả nâng cao sẽ mở đúng bảng đó.
  * **Phân bổ tính năng** (mỗi dòng: Cơ bản thấy gì / Nâng cao thêm gì):

| Khu vực | Cơ bản | Nâng cao thêm |
| :--- | :--- | :--- |
| Nạp tệp | Kéo thả; chọn `.als` trong `.alp`; nạp `.mid` ngoài khi được hỏi (REQ-UI-07, 08) | Nạp schema nhị phân; xem cấu trúc tệp (inventory); hiện track tắt tiếng |
| Tempo | Một ô BPM và dấu nhịp, hiện nổi bật khi tệp thiếu tempo | Nhiều mốc tempo, nhập theo `bar.beat`/giây, dấu nhịp theo mốc (REQ-UI-06) |
| Track | Màu, ẩn/hiện, solo, dán bảng màu (REQ-UI-11, 12) | Độ sáng nền (mặc định đều nhau), đảo chiều, ngưỡng dB (REQ-GRAPHICS-06); kiểu nốt riêng từng track; gán stem (1.2) |
| Kiểu nốt | Theme/preset; chế độ màu; độ dày; bo góc; phát sáng bật/tắt và mức; phát sáng Đều nhau / Động khi chạm + chọn tiêu chí (REQ-GRAPHICS-17) | Độ đục khi chờ, bán kính phát sáng, viền, chỉ sáng khi phát, mức yếu/mạnh nhất, đảo chiều, tắt dần sau nốt, lane automation, gradient, biểu thức |
| Hướng và chuyển cảnh nốt | 4 hướng; chọn template nốt (rơi, nảy, phóng…); tốc độ cuộn | Góc tự do; chỉnh từng pha `enter/hit/sustain/exit`, easing, morph (REQ-GRAPHICS-10) |
| Thanh phát | Hiện/ẩn, màu, độ dày, kiểu nét dựng sẵn, vị trí | Dải và gradient, mũi tên, phát sáng, phản ứng khi chạm, độ dài; 1.1: sprite, keyframe (REQ-GRAPHICS-16) |
| Bàn phím | Hiện/ẩn; tên nốt bật/tắt và cách ghi tên; số phím tự động | Phạm vi tuỳ chọn, hình dạng phím, màu phím nhấn, độ lún, thang âm, quy ước C3/C4, phông (REQ-GRAPHICS-07) |
| Widget và bố cục | Thêm/xoá/kéo thả widget; kéo, co giãn, **xoay** trên khung bằng tay nắm (REQ-GRAPHICS-03); preset bố cục; chọn track cho widget | Khoảng hiển thị theo thời gian/marker; đổi track theo đoạn (REQ-GRAPHICS-14); tham số chi tiết từng widget |
| Spectrum/waveform | Chọn kiểu; màu; số cột | Dải tần, thang tần số, làm mượt, đỉnh rơi, gradient; 1.1 dạng tròn (REQ-WIDGET-07) |
| Hạt | Chọn preset hạt, bật/tắt, mật độ | Mọi tham số nguồn phát, lực, tuổi thọ, hình hạt (REQ-GRAPHICS-11) |
| Hiệu ứng và storyboard | Áp preset hiệu ứng/theme bằng một lần bấm | Keyframe, Graph Editor, timeline, binding, biểu thức, text animator chi tiết (REQ-GRAPHICS-09, 12, 13) |
| 3D (1.1) | Preset góc nhìn (nghiêng chéo, isometric, đường băng) và mức nghiêng | Xoay X/Y/Z từng lớp, camera, độ sâu, nền trong không gian 3D (REQ-GRAPHICS-15) |
| Nền và tài nguyên | Màu/ảnh nền, logo, phông | Sprite sheet, quản lý tài nguyên, giới hạn và dung lượng (REQ-STORAGE-05) |
| Xuất | Preset nền tảng (YouTube 16:9, Shorts/TikTok/Reels 9:16, Instagram 4:5 và 1:1); chất lượng Thấp/Vừa/Cao; 30/60 fps; kích thước tuỳ chỉnh rộng × cao; đoạn xuất | Codec, bitrate, fast-start, nền trong suốt, chuỗi PNG, chọn lớp/tách lớp, Silent AAC, offset audio (REQ-EXPORT-00…08) |
| Preset và cộng đồng | Cài/áp preset, chia sẻ (bắt buộc chọn giấy phép) | Sửa từng phần của preset, xem dữ liệu thô, quản lý phiên bản |
| Danh sách track | Lưới (số cột tự động hoặc tự chọn) / Danh sách dòng gọn; lọc theo tên (REQ-UI-14) | Sắp xếp theo tiêu chí, kéo đổi thứ tự, nhóm/folder track |
| Nhập giá trị | Mọi điều khiển kéo có ô nhập kèm: số, đơn vị, phép tính `+ - * /`, ↑/↓ (REQ-UI-15) | Tương đối `+=`/`-=`/`*=`/`/=` cho nhiều đối tượng; biểu thức (tiền tố `=`, REQ-GRAPHICS-13) |
| Giao diện | Theme sáng/tối, ngôn ngữ, chế độ | Như Cơ bản |

* **REQ-UI-14 (Bố cục danh sách track, D-49, sửa 2026-11-12 theo D-50, 1.0):**
  * **Hai kiểu trình bày** (không xếp thẻ to chồng thành một cột dài):
    * **Lưới (mặc định):** thẻ track xếp theo **hàng ngang**, nằm dưới khung xem trước và trải hết bề rộng. **Số cột do người dùng chọn** bằng ô nhập (REQ-UI-15) hoặc để **Tự động** (vừa bề rộng). Không có trần cứng: tối đa là số track. Nếu bề rộng hiện tại không đủ cho số cột đã chọn (mỗi thẻ cần tối thiểu ~224 px để không tràn) thì vẽ ít cột hơn và **báo** "Bề rộng hiện tại chỉ vừa N cột", giữ nguyên lựa chọn để khi cửa sổ rộng ra lại đủ cột.
    * **Danh sách:** ở cột phải, **mỗi track một dòng gọn**: chấm màu, tên (cắt "…"), số nốt, độ sáng hiện tại (khi độ sáng nền khác "đều nhau") và mũi tên ▸. Bấm dòng hoặc Enter/Space để **mở rộng tại chỗ** phần chỉnh (độ sáng nền, đảo chiều, thông tin track, ngưỡng); nhiều dòng mở cùng lúc được.
  * **Animation:** khi đổi số cột, đổi kiểu trình bày, thêm/bớt track hay mở/đóng dòng, thẻ **di chuyển mượt tới vị trí mới** (cùng một thẻ bay từ lưới sang danh sách và ngược lại; Framer Motion `layout` + `layoutId`, lò xo ~0,3 s). Tôn trọng "giảm chuyển động" của hệ điều hành (`prefers-reduced-motion` → bỏ chuyển động).
  * **Không đè nội dung:** ở kiểu Lưới, khung xem trước và cột kiểu nốt **không dính** khi cuộn (để không che thẻ track); ở kiểu Danh sách, khung xem trước và cột phải dính trên màn hình rộng như trước.
  * **Thứ tự và lọc (chưa làm):** mặc định theo thứ tự trong DAW; sắp theo tên, số nốt, màu; kéo thả để đổi thứ tự hiển thị (luôn có cách thay thế bằng bàn phím); ô lọc theo tên. Thứ tự trong danh sách **không** đổi thứ tự vẽ, trừ khi bật "Vẽ theo thứ tự danh sách" (lưu vào dự án, hoàn tác được).
  * **Nhóm (chưa làm):** track nhóm/folder thu gọn/mở được; cần parser đọc thông tin nhóm **[VERIFY]**.
  * **Lưu:** kiểu trình bày và số cột là **tuỳ chọn giao diện** lưu theo trình duyệt, không vào preset video và không đổi khung hình xuất.
  * **Bàn phím và trợ năng:** phím mũi tên đi theo hướng xếp (trái/phải/lên/xuống tới thẻ gần nhất theo hướng, đúng cả với lưới tự động); vai trò `list`; dòng mở rộng có `aria-expanded`.
* **REQ-UI-15 (Nhập giá trị chính xác cho mọi điều khiển, D-49, 1.0):**
  * **Quy tắc chung:** mọi thuộc tính chỉnh được bằng kéo (thanh trượt, núm xoay, kéo/co giãn widget trên canvas, tay nắm bezier và keyframe trên Graph Editor, ô màu, tay nắm xoay 3D, mốc đầu/cuối đoạn trên timeline, offset audio…) **phải** có ô nhập đi kèm, hiện giá trị hiện tại và sửa được bằng bàn phím. Không thuộc tính nào chỉ chỉnh được bằng chuột. Áp dụng ở cả Cơ bản và Nâng cao.
  * **Cách nhập:** Enter hoặc rời ô để áp; Esc để huỷ. ↑/↓ tăng giảm theo bước, Shift ×10, Alt/Option ×0,1; kết quả làm tròn theo bước. Kéo ngang trên nhãn để chỉnh (scrub) như phần mềm dựng hình; con lăn chuột chỉ đổi giá trị khi ô đang được chọn.
  * **Cú pháp:** số với dấu chấm hoặc dấu phẩy thập phân (`0.7`, `0,7`; chuỗi mơ hồ như `1,000.5` bị từ chối, không đoán); đơn vị khai báo cho từng thuộc tính (`px`, `pt`, `%`, `s`, `ms`, `deg`, `beat`, `bar`), quy đổi về đơn vị gốc; phép tính `+ - * /` và ngoặc (`1920/2`, `(4+2)*3`); tương đối với giá trị hiện tại `+=`, `-=`, `*=`, `/=` (hữu ích khi chọn nhiều đối tượng). Tiền tố `=` chuyển sang ô biểu thức đầy đủ (REQ-GRAPHICS-13). Bộ đọc là hàm thuần viết tay, **không** dùng `eval`/`Function` (NFR-SEC-05).
  * **Giới hạn:** thanh trượt có **phạm vi mềm** (khoảng hay dùng), ô nhập cho gõ vượt tới **giới hạn cứng** của thuộc tính (ví dụ bán kính phát sáng: kéo 0–40, gõ tới 64; bo góc: kéo 0–20, gõ tới 999 để thành viên thuốc). Vượt giới hạn cứng thì kẹp. Giới hạn cứng của ô nhập phải trùng với giới hạn kẹp trong Render Core (`sanitizeStyle` và tương đương) để giá trị hiện ra là giá trị thực được vẽ.
  * **Lỗi:** chuỗi không đọc được thì viền đỏ, `aria-invalid`, giữ nguyên giá trị cũ, không áp nửa chừng; rời ô thì trả lại giá trị cũ.
  * **Nhiều đối tượng:** khi chọn nhiều đối tượng có giá trị khác nhau, ô hiện "—"; gõ số tuyệt đối áp cho tất cả, gõ dạng tương đối áp riêng cho từng đối tượng.
  * **Hoàn tác:** mỗi lần áp từ ô là một bước hoàn tác; một lần kéo liên tục (thanh trượt, scrub) gộp thành một bước (REQ-UI-02).
  * **Hiển thị:** số chữ số thập phân theo bước; đơn vị hiện cạnh ô; ô đủ hẹp để không làm tràn bảng (tối thiểu 3,25rem ở bảng 20rem).


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

## 7. ĐIỀU KIỆN NGHIỆM THU VÀ BÀN GIAO

Phiên bản đạt nghiệm thu khi vượt qua toàn bộ các kiểm thử sau (các giá trị **[PROVISIONAL]** được chốt lại sau OI-02):

| Mã | Kiểm thử | Tiêu chí đạt | Liên quan |
| :--- | :--- | :--- | :--- |
| **AT-01** | Phân tích tệp | Bộ mẫu ≥ 20 file mỗi định dạng (Ableton 10/11/12 gồm `.als` và `.alp`, Reaper 6/7, `.dawproject` từ Bitwig/Studio One, MIDI): ≥ 98% file "thành công"; mọi nốt đúng pitch, sai số ≤ 1 tick so với MIDI tham chiếu từ DAW gốc. | KPI-01, OI-01 |
| **AT-02** | Canvas và snapping | Kéo thả mượt; đường gióng hiện đúng khi khoảng cách ≤ 5 pt; đổi tỉ lệ 16:9, 9:16, 1:1 không làm sai lệch tỉ lệ tương đối giữa các thành phần. | BR-02 |
| **AT-03** | Đồng bộ A/V | Clip kiểm thử (click âm thanh + khung chớp tại mốc nhịp) có lệch ≤ ±2 ms ở cả đầu và cuối video, đo bằng phần mềm phân tích tín hiệu; chạy cho trường hợp có audio và, nếu công tắc Silent Audio bật, cả trường hợp Silent Audio; chỉ áp dụng cho desktop. | KPI-02 |
| **AT-04** | Tương thích xuất | MP4 Tier 1 (có audio và video-only) tải lên được và phát tốt trên YouTube, TikTok; mở trực tiếp được trên Premiere Pro, DaVinci Resolve (và các mục khác của ma trận NFR-COMP-02) mà không cần transcode. | KPI-03 |
| **AT-05** | WYSIWYG | So khung Preview với khung Export **trước khi mã hoá** (ảnh trên `OffscreenCanvas`, không phải ảnh giải mã từ video), ở 720p, 1080p, 4K và ít nhất một kích thước tuỳ ý: đạt ngưỡng *khác đường vẽ* của REQ-GRAPHICS-05. | ARC-01 |
| **AT-06** | Hiệu năng xuất | RM-1: 1080p60 H.264 phần cứng ≥ 1.2× thời gian thực; 4K RAM ≤ 2 GB; không rò rỉ sau 3 lần xuất liên tiếp. | KPI-07, NFR-PERF-03/04 |
| **AT-07** | Thời gian làm video | Người thử mới: từ mở trang đến bấm Export ≤ 60 giây; từ file DAW đến MP4 đoạn ≤ 60 s ở 1080p ≤ 3 phút. | KPI-04, KPI-05 |
| **AT-08** | Hợp âm | ≥ 90% hợp âm 3–4 âm đúng trên bộ ≥ 50 đoạn có đáp án; Override hoạt động và được lưu vào Project Pack. | KPI-06 |
| **AT-09** | Bảo mật đầu vào | Zip-bomb, ZIP có đường dẫn `..`, JSON parser chứa hàm/regex nguy hiểm, XML lồng quá sâu: bị từ chối với đúng mã lỗi, tab không treo. | BR-08, R-05, R-09 |
| **AT-10** | Dự phòng codec | Giả lập thiếu AAC, thiếu H.264, thiếu cả hai: ứng dụng rơi đúng bậc Tier 2/3/4, thông báo đúng. | R-06 |
| **AT-11** | Lưu và phục hồi | Tải lại trang khôi phục đầy đủ phiên; giả lập thiếu quota thì vào chế độ suy thoái và báo rõ file cần nạp lại. | BR-05, D-11 |
| **AT-12** | Thư viện parser | `npm run test:parser` đạt (hiện 66 test: Ableton thật + đối chứng độc lập, `.alp` thật dạng `pl-a`, Reaper thật, dawproject mẫu chính thức, MIDI, binary schema, an toàn đầu vào, bundle); `docs/TDD.md` cập nhật. | BR-01, BR-08 |
| **AT-13** | Tempo thủ công | Nhập 2 mốc (ví dụ 0 s: 100 BPM, 10 s: 200 BPM); nhập theo `Bar.Beat.%`/`Bar.Beat.Sixteenth` và đổi nhịp 4/4 → 3/4 → 12/8 cho beat đúng (4/4 hai ô nhịp = 8 beat rồi 3/4 hai ô nhịp = 6 beat): `tempoSource = user`, tick và giây của nốt đúng theo mốc; file thiếu tempo hiện cảnh báo và mời nhập; BPM ngoài 10–1000 bị từ chối. | R-12, D-29 |
| **AT-14** | Chọn `.als` trong `.alp` | Nạp gói nhiều `.als`: danh sách hiện đúng tên/track/BPM; chọn file khác thì AST đổi theo; file không có nốt bị vô hiệu hoá kèm lý do. | D-25 |
| **AT-15** | Đầu vào theo ngữ cảnh | `.rpp` nhúng MIDI: không hiện ô `.mid`; `.rpp` tham chiếu `.mid` ngoài: hiện ô kèm tên file, chưa nạp thì có cảnh báo, nạp rồi thì ra đủ nốt; `.bwproject`: hiện ô schema và cảnh báo "chưa hỗ trợ". | REQ-UI-08 |
| **AT-16** | Đa ngôn ngữ | Đổi giữa Tiếng Việt và Tiếng Anh: mọi chuỗi, lỗi/cảnh báo, kết quả đang hiển thị đổi ngay; thêm ngôn ngữ thử (chỉ file JSON + một dòng danh sách) xuất hiện trong bộ chọn; chuỗi thiếu rơi về tiếng Anh; `npm run i18n:check` bắt đúng khoá thiếu/thừa, tham số sai, nhánh số nhiều sai; video xuất ra hiển thị đúng chữ Việt có dấu. | KPI-08, BR-09 |
| **AT-17** | Độ sáng theo automation | Nạp `BigProject4b.rpp`: track có envelope volume thấy độ sáng đổi theo đường cong (−26,4 dB tối nhất, 0 dB sáng nhất); đổi nguồn sang `tắt` thì độ sáng cố định; Preview và Export cùng giá trị tại cùng `t`. | REQ-GRAPHICS-06 |
| **AT-18** | Mốc M1 | Mở lần lượt `Demo.als`, `BigProject4b.rpp`, `.dawproject`, `.mid`, `.alp`: có Piano Roll, thanh phát/tua, danh sách track; lỗi/cảnh báo hiện bằng ngôn ngữ đang chọn; đổi ngôn ngữ cập nhật ngay; kéo `t` đến cùng giá trị cho cùng khung hình (tất định). | REQ-GRAPHICS-05, 06; REQ-I18N |
| **AT-19** | Tất định của tùy biến (1.0) | Với một cảnh có template nốt, hạt, biểu thức: ảnh khung ở `t` khi tua thẳng tới `t` trùng với khi phát liên tục tới `t`; ảnh Preview trùng ảnh Export (sai khác điểm ảnh trong ngưỡng TDD). |
| **AT-20** | Easing và Graph Editor (1.0) | Mọi easing có `f(0)=0`, `f(1)=1`; đổi tay cầm trên speed graph thấy chuyển động đổi ngay khi xem trước; lưu và nạp preset `easing` cho cùng đường cong. |
| **AT-21** | An toàn biểu thức (1.0) | Bộ mẫu tấn công (EXPRESSIONS §4) đều bị từ chối hoặc ra giá trị dự phòng; fuzz 100.000 biểu thức không treo, không lỗi ngoài `ExprError`; trang chạy đủ chức năng với CSP bật. |
| **AT-22** | Tài nguyên và preset (1.0) | Nạp cùng ảnh hai lần chỉ lưu một bản; Project Pack mở trên trình duyệt khác đủ tài nguyên; preset sai schema hoặc vượt giới hạn bị từ chối kèm mã lỗi. |
| **AT-23** | Widget bổ sung (1.0) | P-01…P-13 hiển thị đúng với tệp mẫu (marker và lời với tệp có dữ liệu tương ứng); đổi cách ghi tên nốt áp cho mọi widget. |
| **AT-25** | Bố cục track và nhập giá trị (1.0) | Đổi Dọc/Ngang/Lưới và Gọn/Đầy đủ với dự án 15+ track: không phần tử tràn khỏi thẻ ở bề rộng 1440/1100/800 px, phím mũi tên đi đúng hướng; mọi thuộc tính có tay nắm kéo đều có ô nhập; gõ `1920/2`, `+=10`, `0,5`, `50%` cho kết quả đúng; chuỗi sai giữ giá trị cũ; giá trị ngoài giới hạn cứng bị kẹp và trùng với giá trị Render Core vẽ. |
| **AT-26** | Phát sáng động và bố cục track (1.0) | Mặc định mọi nốt sáng như nhau và độ sáng nền "đều nhau". Bật "Động khi chạm": theo velocity thì nốt velocity 127 sáng hơn rõ nốt velocity 30; theo fade thì sáng nhất lúc chạm rồi tắt dần; theo automation âm lượng (`BigProject4b.rpp`) thì đổi theo envelope; track không có lane sáng đều. Dự án 15 track: Lưới tự động không tràn ở 1440/1100/800 px; chọn 8 cột ở 1280 px thì báo chỉ vừa 4; đổi số cột và đổi Lưới ↔ Danh sách thấy thẻ di chuyển mượt; Danh sách mở dòng bằng Enter; tải lại trang giữ lựa chọn. |
| **AT-24** | Stem theo track (1.2) | Nạp tệp mix + 4 stem xuất từ Reaper và Ableton (cùng điểm đầu): tự ghép đúng tên track; spectrum của từng track khớp âm thanh của track đó; stem lệch độ dài có cảnh báo; mở lại dự án từ Project Pack không cần stem mà widget vẫn vẽ được. |

---

## 8. CÁC VẤN ĐỀ CÒN MỞ CỦA SRS

| Mã | Nội dung | Xử lý |
| :--- | :--- | :--- |
| **SOI-01** | Chốt D-20, D-21, D-22 (Render Core chung, Export Worker, FFT tất định) và đưa vào Nhật ký quyết định BRD. **Đã đóng v1.1:** D-20, D-21, D-22 đã có trong Nhật ký quyết định BRD. | Product/Dev, trước khi code |
| **SOI-02** | Chiến lược giải mã audio theo khối cho file dài (WebCodecs `AudioDecoder` hay `decodeAudioData` theo đoạn) và đo bộ nhớ thực tế. | Dev, spike |
| **SOI-03** | Kiểm chứng `OffscreenCanvas` 2D, nạp `FontFace` và vẽ chữ trong Worker hoạt động nhất quán giữa Chrome/Edge trên Windows và macOS. **v1.1:** Spike 1 xác nhận `FontFace` trong Worker hoạt động trên Windows (Chromium/Edge, máy LOQ); còn kiểm macOS. | Dev, spike |
| **SOI-04** | Đối chiếu lược đồ DAWproject (tên phần tử/thuộc tính, `contentType`, đơn vị thời gian) với đặc tả và file thật. *Cập nhật v0.3:* đã khớp ví dụ chính thức của Bitwig 5.0; còn thiếu `.dawproject` xuất thật. **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA (OI-01) |
| **SOI-05** | Lập bảng profile/level H.264 thực tế theo độ phân giải × FPS và kiểm bằng `isConfigSupported` trên RM-1. | Dev (OI-02) |
| **SOI-06** | Tempo automation của Ableton và tempo envelope của Reaper: cách đọc, nội suy dốc tempo. *Cập nhật v0.3:* đã cài (Ableton: sự kiện và envelope; Reaper: PT, shape 1 = giữ), kiểm bằng dữ liệu tổng hợp; thiếu mẫu thật có dốc tempo. **v1.1:** Chương trình tệp mẫu (D-45). | Dev (OI-01) |
| **SOI-07** | Có thể chặn hoàn toàn `style-src 'unsafe-inline'` với thư viện giao diện được chọn không. **v1.1:** kiểm khi làm T-30 (CSP); React đặt style qua CSSOM nên dự kiến không cần `unsafe-inline`. | Dev |
| **SOI-08** | Mức hỗ trợ chính thức cho Linux (hiện là best-effort). **Đã chốt v1.1 (D-44):** Linux theo khả năng phát hiện được ở 1.0/1.1. | Product |
| **SOI-09** | Ngưỡng độ dài tối thiểu đoạn hợp âm (80 ms) cần chỉnh theo bộ mẫu thật. | Nhạc công (OI-05) |
| **SOI-10** | Mediabunny khi ghi luồng có đạt MP4 fast-start không, hay phải dùng chế độ phân mảnh; ảnh hưởng nhập vào Premiere/DaVinci/CapCut (KPI-03). *Cập nhật v0.3:* `in-memory` đạt fast-start (`ftyp moov mdat`); ghi thẳng xuống đĩa + fast-start chưa kết luận. | Dev, spike |
| **SOI-11** | Viết schema nhị phân cho `.bwproject` (và `.flp`) khi có file mẫu; hiện *chưa hỗ trợ*. | Dev (OI-08) |
| **SOI-12** | Triển khai parser khai báo cho nguồn XML/JSON (REQ-PARSER-05) hoặc bỏ yêu cầu nếu `.dawproject` và schema nhị phân đủ dùng. **Đã chốt v1.1:** không có trong 1.0/1.1; xem lại ở 1.2 (BRD §4.4). | Product/Dev |
| **SOI-13** | Bù độ lệch A/V trên di động hay giữ phạm vi desktop (R-11, OI-09). **Đã chốt v1.1 (D-44):** 1.0/1.1 chỉ desktop; 1.2 xem trên di động. | Dev |
| **SOI-14** | Đọc clip Session View của Ableton (OI-10). **Đã chốt v1.1 (D-44):** bản 1.2. | Product |
| **SOI-15** | Cách chọn `.als` mặc định trong `.alp` (hiện: lớn nhất) và ý nghĩa thứ tự trong manifest. | Dev |
| **SOI-17** | Cách đếm beat/bar trong nhịp ghép: **Reaper đã xác nhận** (đếm theo mẫu số, 12/8 @120: `1.12.68` = 2,920 s). Còn Ableton, Bitwig và các nhịp ghép khác để chốt D-31 (OI-12). **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA |
| **SOI-18** | Đọc automation của Ableton/DAWproject/Bitwig và envelope trong item/take của Reaper (REQ-GRAPHICS-06, P-13). **v1.1:** cần cho widget P-13 ở bản 1.0 (Ableton/DAWproject automation). | Dev |
| **SOI-19** | Kiểm với Reaper thật: chiều của pan (âm = trái?), nghĩa giá trị `MUTEENV` (0/1), và hệ số nội suy fader `gain^0,25` với thêm vài điểm đo. **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA |
| **SOI-20** | Font và hiển thị chữ cho video xuất ra với các hệ chữ ngoài Latin; chữ từ phải sang trái trên canvas (REQ-I18N-07, OI-13). **v1.1:** đổi ID từ SOI-18 trùng; 1.0 dùng phông người dùng nạp (REQ-STORAGE-05), 1.1 gói phông cộng đồng (OI-13). | Dev |
| **SOI-16** | Ý nghĩa `SOFFS`, `IGNTEMPO 1`, shape cong và `PROJOFFS` của Reaper bằng mẫu thật có các giá trị này (`.mid` ngoài đã kiểm). **v1.1:** Chương trình tệp mẫu (D-45). | Dev (OI-01) |

---

## 9. PHỤ LỤC

### Phụ lục A: Mã lỗi

| Mã | Điều kiện | Gợi ý cho người dùng |
| :--- | :--- | :--- |
| `ERR_FILE_TOO_LARGE` | File vượt giới hạn kích thước | Cắt/đơn giản hóa dự án hoặc xuất MIDI. |
| `ERR_ARCHIVE_TOO_LARGE` | Giải nén vượt 300 MB, tỉ lệ > 1:30 hoặc quá nhiều entry ZIP | Kiểm tra file; có thể là file lỗi hoặc độc hại. |
| `ERR_ARCHIVE_INVALID` | ZIP hỏng hoặc có đường dẫn không hợp lệ | Xuất lại file từ DAW/ứng dụng. |
| `ERR_PARSER_TIMEOUT` | Phân tích quá 10 giây | Thử file nhỏ hơn hoặc xuất MIDI. |
| `ERR_UNSUPPORTED_FORMAT` | Định dạng *chưa hỗ trợ* (`.flp`, `.bwproject`, MIDI SMPTE), nội dung không khớp đuôi file hoặc không khớp magic của schema | Làm theo hướng dẫn trong màn hình nhập file. |
| `ERR_AST_INVALID` | Dữ liệu sau phân tích không hợp lệ | Báo lỗi kèm vị trí; thử xuất MIDI. |
| `ERR_AST_TOO_LARGE` | Quá 500,000 nốt | Tách đoạn hoặc bỏ bớt track. |
| `ERR_NO_NOTES` | Không có nốt nào sau khi lọc (kèm lý do nếu có: chỉ có clip Session View; chỉ tham chiếu `.mid` ngoài chưa nạp) | Bật hiển thị track ẩn, chọn `.als` khác trong gói, nạp `.mid` đi kèm hoặc chọn file khác. |
| `ERR_SCHEMA_INVALID` | Schema nhị phân sai hoặc thiếu mục `ast` | Sửa schema theo `schemas/README.md`. |
| `ERR_NO_SUPPORTED_ENV` | Môi trường thiếu `DecompressionStream` | Dùng Chrome/Edge bản mới. |
| `ERR_AUDIO_DECODE` | Trình duyệt không giải mã được audio | Đổi sang `.wav`/`.mp3`; vẫn có thể tiếp tục không audio. |
| `ERR_AUDIO_TOO_LONG` | Audio dài hơn giới hạn giải mã | Cắt ngắn audio. |
| `ERR_AUDIO_TOO_MANY` | Số stem hoặc tổng thời lượng stem vượt giới hạn (REQ-AUDIO-01) | Gộp bớt stem (theo nhóm nhạc cụ) hoặc chỉ nạp stem của track cần hiện. |
| `ERR_PRESET_INVALID` | Preset hỏng hoặc sai lược đồ | Dùng preset khác. |
| `ERR_SCHEMA_NEWER` | Dữ liệu từ phiên bản mới hơn | Cập nhật ứng dụng. |
| `ERR_NO_SUPPORTED_ENCODER` | Không có bộ mã hóa phù hợp (Tier 4) | Dùng Chrome/Edge bản mới trên Windows/macOS. |
| `ERR_EXPORT_FAILED` | Export Worker lỗi bất ngờ | Thử lại; hạ độ phân giải hoặc dùng Export Range. |

### Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)

Mọi cảnh báo có `details.path` (đường dẫn JSON, ví dụ `$.widgets[1].properties.lookaheadSeconds`) và `details.value`.

| Mã | Ý nghĩa | Xử lý |
| :--- | :--- | :--- |
| `WARN_PRESET_VALUE` | Giá trị sai kiểu, ngoài khoảng, id trùng hoặc `pitchMin > pitchMax` | Dùng mặc định / kẹp / đổi id / đổi chỗ; preset vẫn nạp |
| `WARN_PRESET_WIDGET_UNKNOWN` | `type` không thuộc 8 loại hợp lệ | Bỏ widget đó |
| `WARN_PRESET_UNSUPPORTED` | Tính năng chưa có ở bản này (ví dụ ảnh nền khi chưa có tài nguyên phiên, biến đổi 3D trước 1.1). Trong mã hiện tại còn gồm hướng dọc/góc tự do của Piano Roll (T-59) và xoay widget (T-68) cho tới khi làm xong | Bỏ qua tính năng, vẽ như mặc định |
| `WARN_PRESET_VERSION` | Cùng phiên bản chính nhưng khác phiên bản phụ/vá | Đọc theo phiên bản hiện tại |

### Phụ lục A2: Mã cảnh báo của Parser Library

`WARN_TEMPO_FALLBACK`, `WARN_TEMPO_MIDI_DEFAULT`, `WARN_TEMPO_OVERRIDDEN`, `WARN_TEMPO_RAMP`, `WARN_TEMPO_SHAPE`, `WARN_TEMPO_AUTOMATION`, `WARN_TIMESIG_DEFAULT`, `WARN_ZERO_LENGTH_NOTES`, `WARN_SESSION_CLIPS_IGNORED`, `WARN_CLIP_SKIPPED`, `WARN_ALP_MULTIPLE_ALS`, `WARN_MIDI_HANGING_NOTES`, `WARN_MIDI_TRUNCATED`, `WARN_RPP_EXTERNAL_MIDI`, `WARN_RPP_LOOPED_ITEMS`, `WARN_RPP_MUTED_ITEMS`, `WARN_RPP_SOFFS`, `WARN_RPP_PROJOFFS`, `WARN_RPP_HANGING_NOTES`, `WARN_DAWPROJECT_NO_METADATA`, `WARN_DAWPROJECT_NO_NOTE_TRACKS`, `WARN_TIME_UNIT_MIXED`, `WARN_DAWPROJECT_NO_ARRANGEMENT`, `WARN_RPP_LOOP_UNKNOWN_LEN`, `WARN_RPP_SRC_UNIT`, `WARN_TEMPO_AUTOMATION_SECONDS`, `WARN_RPP_ENVELOPES_IGNORED`. Mỗi mã có khoá dịch `warn.<mã>` trong `locales/*.json` (REQ-I18N-03). Danh sách đầy đủ và điều kiện: `docs/parser/PARSER-SRS.md` mục 4.

**Cảnh báo của ứng dụng (không thuộc parser):** `WARN_STEM_LENGTH` (stem lệch độ dài với tệp mix quá 50 ms), `WARN_STEM_UNMATCHED` (tệp stem chưa ghép được với track nào), xem REQ-AUDIO-01.

### Phụ lục B: Ghi chú rà soát

**Đã sửa so với bản nháp trước:**

1. **Kiến trúc:** thêm Render Core dùng chung, Export Worker, tách Document Store khỏi Derived Data; đưa phân tích hợp âm/audio vào Worker (mục 2.4).
2. **Công thức Ableton:** bản nháp nhân `960 / PPQ_native` trong khi đơn vị `.als` đã là beat; sửa thành nhân trực tiếp 960 và làm tròn.
3. **NFR-ACC-02:** bản nháp ghi "chính xác 100%" nhưng nghiệm thu cho phép ≤ 1 tick; thống nhất ≤ 1 tick theo KPI-01.
4. **Widget Text:** mục phân lớp nhắc "Text" nhưng không nằm trong 7 widget; thay bằng Track Info.
5. **NFR-COMP-01:** bản nháp coi Linux là nền tảng kiểm thử chính, mâu thuẫn BRD 4.1 và R-06; đổi thành best-effort.
6. **Ví dụ Preset:** bỏ liên kết Markdown lẫn trong URL `$schema`; thêm kiểm tra schema, danh sách `type`, giới hạn ảnh nhúng.
7. **CSP:** bổ sung `img-src`, `media-src`, `font-src`, `connect-src`, cấm font CDN.
8. **Thiếu yêu cầu được BRD/SRS tham chiếu:** bổ sung REQ-AST-01, REQ-GRAPHICS-04/05, REQ-CAP-01, REQ-UI-01 đến 05, REQ-STORAGE-04, REQ-EXPORT-07.
9. **Chuỗi thời gian xuất:** thêm công thức số khung, khung khóa mỗi 2 giây, bảng độ phân giải, bitrate mặc định.
10. **Bảo mật đầu vào:** thêm chống zip-slip, giới hạn độ sâu, số nốt, kích thước ảnh nhúng.

**BRD không bắt buộc sửa**, chỉ nên bổ sung D-20 đến D-22 vào mục 7 và làm rõ mục 4.1 rằng Linux là best-effort. Các giá trị **[PROVISIONAL]** mới thêm ở SRS (giới hạn nốt, thời lượng audio, bitrate, ngưỡng đoạn hợp âm) cần được xem xét cùng OI-02.

**Ghi chú rà soát v0.3**

Thay đổi so với v0.2 và nguồn gốc:

1. **`.alp` không phải ZIP** (file thật): header `pl-a` + các `.als` gzip + manifest JSON; thêm REQ-PARSER-06, REQ-UI-07.
2. **`.als`**: nhận cả XML thuần và Gzip; công thức clip bổ sung `StartRelative`, cắt nốt, bỏ nốt tắt; đường dẫn tempo cho `MainTrack` (Live 12) và `AutomationEnvelopes`.
3. **`.rpp`**: Reaper nhúng MIDI kể cả khi import nhiều track; bổ sung take, loop, pooled, mute, `.mid` ngoài.
4. **Tempo**: bỏ fallback 120 BPM ngầm; cờ `tempoSource`; nhập nhiều mốc (Spike 2).
5. **Xuất**: Silent AAC mặc định tắt, kích thước/tỉ lệ tuỳ ý, tên file chốt trước (Spike 1).
6. **Widget**: thêm Progress Bar (ghi chú cuối v0.2 và Spike 2).
7. **Ngôn từ**: định dạng nhị phân gốc (`.flp`, `.bwproject`) ghi là *chưa hỗ trợ*.
8. **Đầu vào theo ngữ cảnh**: ô nạp `.mid` ngoài và schema JSON chỉ hiện khi cần, có cảnh báo khi thiếu (REQ-UI-08); mốc BPM nhập theo kiểu đồng hồ DAW (REQ-UI-06).
9. **Đa ngôn ngữ** xây ngay từ đầu (REQ-I18N-01 đến 08); **dấu nhịp** trong ghi đè tempo; **đề xuất widget bổ sung** (mục 3.4b).
10. **Trạng thái spike:** Spike 1 (xuất video) và Spike 2 (parser và AST) hoàn thành. Phần còn lại là việc cần mẫu thật hoặc chưa làm, nêu ở mục 9 và Phụ lục B, không chặn giai đoạn xây ứng dụng chính.
11. **Chưa làm**: parser XML/JSON khai báo (SOI-12), Session View, schema `.bwproject` (OI-08).
