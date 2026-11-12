# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)
## DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)

**Phiên bản:** v1.1 (2026-11-12: chốt phạm vi các bản phát hành 1.0 / 1.1 / 1.2, hướng tùy biến, biểu thức và mô hình kiểm duyệt cộng đồng; xem §4.4 và D-38…D-45. Đường cơ sở trước đó, v1.0: đường cơ sở yêu cầu cho giai đoạn xây dựng; Spike 1 và Spike 2 đã hoàn tất; tài liệu thư viện parser: `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md`; thiết kế ứng dụng: `docs/design/SDD.md`, `TDD.md`)

### Lịch sử phiên bản

| Phiên bản | Nội dung thay đổi chính |
| :--- | :--- |
| v0.1 | Bản đầu tiên. |
| v0.2 | Thêm mã BR-xx và KPI-xx để khớp ma trận truy xuất SRS; chuyển Bitwig sang `.dawproject`; thay `mp4-muxer` (đã deprecated) bằng Mediabunny; định nghĩa lại KPI A/V sync và KPI thời gian; hạ R-04 xuống thành giả định thiết kế; bổ sung rủi ro R-06 đến R-10; thêm Nhật ký quyết định (mục 7) và Open Issues (mục 8). |
| v1.0 | **Chốt đường cơ sở:** Spike 1 (đường ống xuất) và Spike 2 (thư viện parser, 66 test) đủ bằng chứng nên nâng lên 1.0. "1.0" nghĩa là yêu cầu được đóng băng để xây dựng, các mục còn **[VERIFY]** không bị giấu mà chuyển thành Open Issues có chủ (OI-10 đến OI-14) và được xử lý theo lộ trình. Thêm D-33 (độ sáng theo automation), D-34 đến D-36 (ngăn xếp giao diện, monorepo, TypeScript cho mã mới), mục 4.3 lộ trình M1 đến M5. |
| v0.3 | **Bổ sung sau cùng:** đa ngôn ngữ ngay từ đầu (tiếng Anh và tiếng Việt, cộng đồng đóng góp bản dịch; BR-09, D-30); ghi đè tempo có thêm **dấu nhịp** (4/4, 3/4, 12/8...) và nhập mốc theo kiểu đồng hồ DAW (D-31); đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11); trạng thái Spike 1 và Spike 2: hoàn thành. **Theo Spike 1:** Silent AAC chuyển sang mặc định TẮT (video-only khi không có audio, D-01 sửa); cho nhập tuỳ ý rộng × cao và tỉ lệ khung (D-26); tên file chốt trước khi render; ghi nhận lệch A/V trên di động (R-11). **Theo Spike 2:** tách parser thành thư viện độc lập (D-23); không còn fallback 120 BPM ngầm, người dùng ghi đè tempo theo mốc (D-24, D-29); thêm widget Progress Bar (D-27, nay 8 widget). **Theo thư viện parser:** thêm `.alp` thật (gói `pl-a`, chọn `.als` trong gói, D-25); `.als` nhận cả XML thuần và Gzip; parser nhị phân theo JSON schema (D-28); `.flp` và `.bwproject` ghi là *chưa hỗ trợ* (không phải "không hỗ trợ"); chốt D-20 đến D-22; cập nhật KPI/rủi ro/Open Issues bằng số đo thật. |
| v1.1 | **Chốt quyết định sau rà soát 2026-11-12.** Phạm vi theo bản phát hành (§4.4): **1.0** = lõi M1–M5 + tùy biến chính (easing, template nốt, morph cùng họ, hạt, bộ máy keyframe, lõi biểu thức, tài nguyên phiên, CSP) + toàn bộ widget đề xuất P-01…P-13; **1.1** = storyboard và Graph Editor đầy đủ, thư viện và kiểm duyệt cộng đồng, WebGL; **1.2** = Session View, xem trên di động, morph SVG tự do. Chốt D-38, D-39 (trước là đề xuất); thêm D-40…D-45. Đóng OI-09, OI-10, OI-11, OI-13 (phần quy trình), OI-15, OI-16, OI-17; các OI cần dữ liệu thật chuyển thành **Chương trình tệp mẫu** (D-45). |

### Quy ước nhãn trong tài liệu

* **[PROVISIONAL]**: giá trị tạm do nhóm soạn thảo chọn vì chưa có dữ liệu thực tế; cần đo hoặc review lại.
* **[VERIFY]**: cần đối chiếu với tài liệu chính thức hoặc file mẫu thật trước khi triển khai.
* **[ĐÃ ĐO]** / **[ĐÃ KIỂM]**: giá trị đã đo hoặc hành vi đã kiểm chứng bằng spike/file thật (ghi rõ nguồn).
* **D-xx**: mã quyết định, xem mục 7. **OI-xx**: câu hỏi còn mở, xem mục 8.

---

## 1. THÔNG TIN CHUNG & BỐI CẢNH DỰ ÁN

### 1.1. Bối cảnh thị trường (Business Context)
* Nhu cầu tạo nội dung video ngắn (Short-form video: TikTok, YouTube Shorts, Reels) và video biểu diễn dự án âm nhạc (Project showcase) của cộng đồng Music Producers, Beatmakers, Pianists đang tăng trưởng mạnh.
* Định dạng visualizer tối giản (Minimalistic HUD: piano roll cuộn ngang/dọc, hiển thị vòng hợp âm, bộ đếm nốt, vạch nhịp Bar/Beat) mang lại hiệu quả thẩm mỹ cao và được người xem đặc biệt ưa chuộng.
* **Rào cản hiện tại:**
  * Dùng phần mềm quay màn hình (OBS Studio): nặng máy, dễ giật khung hình, giao diện DAW phức tạp làm loãng sự tập trung vào âm nhạc.
  * Xuất stem âm thanh/MIDI qua phần mềm dựng phim (After Effects, Premiere Pro, CapCut): tốn thời gian (30–60 phút/video), đòi hỏi kỹ năng dựng phim chuyên sâu.
  * Các web visualizer hiện nay: chỉ nhận file âm thanh tổng (Master Audio), không hiểu cấu trúc dự án DAW, không tách được nốt hay hiển thị hợp âm theo thời gian thực.

### 1.2. Tầm nhìn sản phẩm (Product Vision)
Xây dựng một Web Application chạy 100% client-side, cho phép người dùng kéo thả trực tiếp tệp dự án DAW (Ableton Live `.als`/`.alp`, Reaper, DAWproject của Bitwig/Studio One, MIDI chuẩn; định dạng nhị phân khác sẽ được thêm dần qua parser khai báo) để bóc tách nốt nhạc và nhịp độ. Nền tảng cung cấp không gian thiết kế Canvas đa widget tùy biến (8 widget) với cơ chế Snapping, hỗ trợ thêm lớp sóng âm (Audio Spectrum) khi nạp kèm file nhạc, và xuất video MP4 (Full HD, 4K, 60 FPS) bằng phần cứng máy người dùng, không tốn chi phí vận hành server.

---

## 2. MỤC TIÊU KINH DOANH, CHỈ SỐ ĐO LƯỜNG & YÊU CẦU NGHIỆP VỤ

### 2.1. Mục tiêu kinh doanh (Business Objectives)

| Mã | Mục tiêu |
| :--- | :--- |
| **OBJ-1** | **Tối ưu quy trình sản xuất nội dung:** rút ngắn thời gian từ lúc có bản thảo trên DAW đến lúc có video đăng mạng xã hội từ 45 phút xuống dưới 3 phút (với đoạn video ≤ 60 giây, xem KPI-05). |
| **OBJ-2** | **Chi phí hạ tầng bằng 0 (Zero Infrastructure Cost):** tận dụng WebCodecs, Canvas, Web Audio API của trình duyệt; loại bỏ chi phí server render. Chỉ cần static hosting. |
| **OBJ-3** | **Tăng trưởng dựa trên cộng đồng:** cho phép người dùng tự viết Parser khai báo (Declarative JSON Schema) và chia sẻ Preset giao diện bằng file. Trong v1.0 việc chia sẻ thực hiện thủ công (ví dụ qua GitHub); thư viện preset/parser tích hợp trong ứng dụng thuộc v1.1 (D-14). |

### 2.2. Chỉ số thành công cốt lõi (KPIs)

| Mã | Chỉ số | Mục tiêu | Cách đo |
| :--- | :--- | :--- | :--- |
| **KPI-01** | Độ chính xác bóc tách | ≥ 98% số file trong bộ mẫu được tính là "thành công" | Bộ mẫu ≥ 20 file thật cho mỗi định dạng **[PROVISIONAL]**. File "thành công" khi mọi nốt khớp bản MIDI tham chiếu (xuất từ chính DAW): pitch đúng, `startTick` và `durationTick` sai số ≤ 1 tick (dung sai tính theo độ phân giải thô hơn của hai nguồn). Công cụ so sánh (`compareAST`) đã có trong thư viện; **[ĐÃ KIỂM]** bằng đối chứng độc lập trên Ableton Live 12 (9605 nốt) và Reaper 7.85 (7497 và 3147 nốt) chưa phải bằng MIDI xuất từ DAW. Màn hình demo không còn ô nạp MIDI tham chiếu; phép so này chạy bằng CLI (`--ref`) hoặc trong bộ test. |
| **KPI-02** | Đồng bộ A/V | Lệch ≤ ±2 ms giữa timestamp video và audio trong container, **không tích lũy** (đầu và cuối video đều lệch ≤ 2 ms) | Phân tích timestamp container + clip kiểm thử có tiếng click và khung hình chớp (D-02). Giá trị "0 ms" của v0.1 bị bỏ vì video 60 FPS bị lượng tử hóa theo frame (16,67 ms). **[ĐÃ ĐO, Spike 1]** Desktop (LOQ, Chromium): 0,00 ms, đạt. Di động tầm trung (Redmi Note 12, Snapdragon 685): −42,67 ms, không đạt; KPI-02 chỉ cam kết cho desktop (D-12, R-11). |
| **KPI-03** | Tương thích nền tảng | 100% mục trong ma trận tương thích phát được không cần transcode | Ma trận: YouTube, TikTok, Facebook, Instagram, Premiere Pro, DaVinci Resolve, Final Cut Pro, CapCut, VLC, QuickTime, Windows Media Player. Kiểm thủ công mỗi bản phát hành, với đầu ra H.264 + AAC (Tier 1, xem SRS REQ-EXPORT-06). |
| **KPI-04** | Time to First Video | ≤ 60 giây thao tác (từ lúc mở trang đến lúc bấm Export) với preset mặc định | Usability test; không tính thời gian render. |
| **KPI-05** | Thời gian làm video | ≤ 3 phút từ file DAW đến file MP4 cho đoạn ≤ 60 giây ở 1080p | Giả định đo: dùng Export Range cho đoạn highlight, máy chuẩn RM-1 (SRS mục 4.1) **[PROVISIONAL]**. |
| **KPI-06** | Độ chính xác hợp âm | ≥ 90% với hợp âm 3–4 âm (triad, seventh) trên bộ mẫu có đáp án; hợp âm mở rộng (jazz) là best-effort + Override | Bộ mẫu ≥ 50 đoạn có đáp án do nhạc công gán **[PROVISIONAL]**. |
| **KPI-07** | Tốc độ xuất | 1080p@60fps với H.264 phần cứng: ≥ 1,2× thời gian thực. 4K@60fps: best-effort | Benchmark trên RM-1 **[PROVISIONAL]**. **[ĐÃ ĐO, Spike 1]** Máy LOQ (chưa phải RM-1): 600 khung 1080p xuất trong 3,8–4,2 giây, tức 2,4× đến 2,65× thời gian thực. |
| **KPI-08** | Thêm ngôn ngữ mới | Thêm một ngôn ngữ bằng một pull request chỉ gồm file JSON (và một dòng danh sách); bộ kiểm `npm run i18n:check` đạt; 100% chuỗi giao diện đi qua từ điển (không chữ cứng); ngôn ngữ chưa dịch đủ vẫn chạy nhờ chuỗi dự phòng tiếng Anh | Từ khi có giao diện chính |

### 2.3. Danh mục yêu cầu nghiệp vụ (Business Requirements)

| Mã | Yêu cầu nghiệp vụ | Phục vụ |
| :--- | :--- | :--- |
| **BR-01** | Đa dạng hóa đầu vào dự án (`.als`, `.alp`, `.rpp`, `.dawproject`, `.mid`, Parser JSON tùy biến gồm nguồn nhị phân); người dùng chủ động ghi đè tempo và chọn `.als` trong gói `.alp` | OBJ-1, OBJ-3, KPI-01 |
| **BR-02** | Đồ họa tối giản, tùy biến cao (Canvas, 8 widget HUD, snapping, preset dựng sẵn) | OBJ-1, KPI-04 |
| **BR-03** | Nhận diện hợp âm thông minh có sửa tay | KPI-06 |
| **BR-04** | Tương thích âm thanh linh hoạt (có hoặc không có file audio) | KPI-02, KPI-03 |
| **BR-05** | Lưu trữ và chia sẻ tiện lợi (auto-save, Preset, Project Pack) | OBJ-3 |
| **BR-06** | Xuất video trực tiếp trên máy người dùng, không backend; kích thước và tỉ lệ khung tuỳ biến | OBJ-2, KPI-03, KPI-07 |
| **BR-07** | Nhanh và dễ dùng cho người mới (preset mặc định, chọn đoạn xuất, tiến độ xuất) | OBJ-1, KPI-04, KPI-05 |
| **BR-08** | Riêng tư và an toàn (không gửi dữ liệu lên server, không chạy mã người dùng) | OBJ-2 |
| **BR-09** | Đa ngôn ngữ và cộng đồng dịch: giao diện, văn bản trên video xuất ra và tài liệu; thêm ngôn ngữ chỉ bằng file JSON, không sửa mã | OBJ-1, KPI-08 |

---

## 3. CHÂN DUNG NGƯỜI DÙNG MỤC TIÊU (USER PERSONAS)

### Persona 1: Hoàng Minh - Bedroom Beatmaker (Mục tiêu: Social Media Reach)
* **Độ tuổi:** 20 - 28. **Công cụ:** FL Studio, Ableton Live.
* **Nhu cầu:** làm video dọc 9:16 thật nhanh để đăng TikTok/Shorts khoe beat mới; không muốn mở Premiere Pro hay After Effects.
* **Kỳ vọng:** kéo project vào web → dùng preset dọc mặc định → (tùy chọn) chọn đoạn highlight → Export MP4 trong khoảng 1 phút.
* **Lưu ý về FL Studio:** v1.0 *chưa hỗ trợ* đọc `.flp` trực tiếp. Người dùng FL Studio xuất file MIDI từ FL rồi nạp file `.mid` (D-19). Hướng dẫn thao tác này phải có trong màn hình nhập file.

### Persona 2: Elena Rostova - Giảng viên Piano & Keyboardist (Mục tiêu: Phân tích nhạc lý)
* **Độ tuổi:** 25 - 40. **Công cụ:** Reaper, MIDI Keyboard.
* **Nhu cầu:** video bài giảng hiển thị chính xác tên hợp âm đang đánh, đếm nốt, hiển thị nốt kích hoạt.
* **Kỳ vọng:** nhận diện hợp âm chính xác, cho phép sửa tay tên hợp âm khi thuật toán sai.

### Persona 3: Alex Chen - Power User & VJ (Mục tiêu: Cá nhân hóa cao độ)
* **Độ tuổi:** 22 - 35. **Công cụ:** Bitwig, Reaper, Three.js.
* **Nhu cầu:** tự thiết kế bố cục HUD, chỉnh màu sắc, thêm phổ tần âm thanh, tạo preset để chia sẻ.
* **Kỳ vọng:** widget kéo thả mượt, snapping chuẩn Figma, xuất/nhập JSON preset và backup toàn bộ project.

---

## 4. PHẠM VI DỰ ÁN (PROJECT SCOPE)

### 4.1. Trong phạm vi phiên bản 1.0 (In-Scope)
* **Định dạng đầu vào:**
  * Ableton Live: `.als` (XML thuần **hoặc** Gzip XML, nhận bằng magic bytes) và `.alp` (gói Live Pack định dạng `pl-a`: nhiều `.als` nén gzip + manifest JSON + sample; người dùng chọn `.als` trong gói sau khi nạp; **[ĐÃ KIỂM]** trên Live 9.1 và Live 12.4). Chỉ đọc Arrangement.
  * Cockos Reaper (`.rpp` — văn bản có cấu trúc thẻ lồng nhau); MIDI nhúng, nhiều take, loop, pooled, tempo envelope **[ĐÃ KIỂM]** trên 2 dự án thật (Reaper 7.85); `.mid` ngoài được nạp kèm.
  * DAWproject (`.dawproject` — ZIP chứa XML; do Bitwig Studio và PreSonus Studio One xuất). Thay cho `.bwproject` (D-03).
  * Standard MIDI File (`.mid`, format 0/1).
  * Parser khai báo tùy chỉnh (Declarative JSON Schema do người dùng nạp). **Nguồn nhị phân** đã có engine (schema v1, biểu thức an toàn, không `eval`); nguồn XML/JSON khai báo: chưa triển khai (D-28, SOI-12).
  * Người dùng có thể **ghi đè tempo theo mốc** (giây hoặc beat) và nhập nhiều mốc BPM; không còn mặc định 120 BPM ngầm (D-24, D-29).
  * Audio đính kèm tùy chọn: `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`. Khả năng giải mã thực tế phụ thuộc trình duyệt; nếu không giải mã được, hiển thị thông báo rõ ràng.
* **Canvas & Layout Engine:**
  * Canvas 2D hỗ trợ nhiều tỉ lệ khung (16:9, 9:16, 1:1, tùy biến); xuất ở 720p, 1080p, 4K hoặc **kích thước rộng × cao nhập tuỳ ý** (làm tròn số chẵn, cạnh dài ≤ 4096 px; D-26).
  * Snapping theo lưới và Smart Guides; tách Edit Mode và Preview Mode.
  * Ảnh nền, màu nền và font chữ tùy chỉnh.
  * Preset dựng sẵn (dọc 9:16, ngang 16:9, vuông 1:1).
* **Bộ Widget cốt lõi (8 widget):** Track Info, Piano Roll, Event Counter, Live Trigger, Time & Bar Counter, Chord Detection, Audio Spectrum/Meter, **Progress Bar** (D-27).
* **Lưu trữ & Chia sẻ:** auto-save vào IndexedDB (gồm cả file dự án và audio); xuất/nhập Preset `.json`; xuất/nhập Project Pack `.zip`.
* **Xuất video ngoại tuyến:**
  * WebCodecs API + Mediabunny (thay `mp4-muxer` đã deprecated, D-04) để xuất MP4.
  * Chọn đoạn xuất (Export Range), độ phân giải, FPS, chất lượng; có thanh tiến độ và nút hủy.
  * Cơ chế dự phòng codec theo khả năng của trình duyệt (D-05).
  * Khi không có audio nạp kèm, mặc định xuất MP4 **video-only**; track Silent AAC là công tắc tuỳ chọn, mặc định TẮT (D-01 sửa theo Spike 1).
  * Tên file ghi được chốt (gồm rộng×cao, fps) trước khi bắt đầu render, kể cả khi ghi thẳng xuống đĩa (D-26).
* **Nền tảng:** trình duyệt desktop. Chromium (Chrome/Edge/Brave/Opera) trên Windows và macOS là nền tảng kiểm thử chính; các trình duyệt khác chạy theo khả năng phát hiện được (D-05).
* **Đa ngôn ngữ (BR-09, D-30):** xây từ đầu bằng từ điển JSON (`locales/`); bản đầu có Tiếng Anh (gốc) và Tiếng Việt, cộng đồng đóng góp ngôn ngữ khác theo `docs/I18N.md`; phạm vi gồm giao diện, thông báo lỗi/cảnh báo (dịch theo mã), văn bản trên canvas và video xuất ra (cần font đủ glyph), và thiết lập cách ghi tên nốt/hợp âm riêng.
* **Độ sáng track theo automation** (D-33): mặc định theo âm lượng, người dùng đổi nguồn/đảo chiều/ngưỡng.
* **Ghi đè tempo** có dấu nhịp (4/4, 3/4, 6/8, 12/8...) và nhập mốc theo giây, `Bar.Beat.%` (Reaper) hay `Bar.Beat.Sixteenth` (Ableton/Bitwig/Cubase) (D-31).

### 4.3. Lộ trình phát hành (Milestones)

| Mốc | Nội dung | Điều kiện hoàn thành |
| :--- | :--- | :--- |
| **M1** | Nạp file → Unified AST → Piano Roll (Canvas) + Track Info + thanh phát/tua, đa ngôn ngữ en/vi, độ sáng track theo volume. Chưa xuất video, chưa lưu phiên. | Mở được file mẫu của cả 5 định dạng; Preview tất định theo `t`; test Render Core và logic đạt; kiểm thủ công trên Chrome. |
| **M2** | Đủ 8 widget HUD, hệ tọa độ và bắt dính, chỉnh sửa bố cục, Preset. | AT của REQ-WIDGET, REQ-GRAPHICS đạt. |
| **M3** | Đường ống xuất MP4/WebM (Spike 1 đưa vào Render Core), Preview Mode WYSIWYG. | AT-05, AT-06 đạt. |
| **M4** | Lưu phiên (IndexedDB), Project Pack, nạp schema nhị phân, nhập ghi đè tempo trong giao diện. | REQ-STORAGE đạt. |
| **M5** | Cứng hoá: hiệu năng, trợ năng, bản dịch cộng đồng, đóng các OI còn lại hoặc ghi rõ hạn chế đã biết. | Toàn bộ AT; KPI đo được. |

### 4.4. Phân bổ theo bản phát hành (D-40, chốt ở tài liệu v1.1)

Mốc M1–M5 ở §4.3 là các bước xây dựng **bản phát hành 1.0**. Phạm vi từng bản:

| Bản | Nội dung | Tài liệu chi tiết |
| :--- | :--- | :--- |
| **1.0** | Mọi mục §4.1. **Widget:** 8 widget cốt lõi + toàn bộ đề xuất P-01…P-13 (SRS 3.4b), gồm cả marker, lời bài hát, automation lane (parser đọc thêm). **Tùy biến chính:** bộ easing đầy đủ, template chuyển cảnh nốt bốn pha, morph cùng họ, hạt không trạng thái, bộ máy keyframe (nội suy, motion path, loop, modifier), Graph Editor cơ bản (value/speed graph, velocity bằng số), các hiệu ứng gắn nhãn `v1.0` trong danh mục, text animator cơ bản, mô hình dữ liệu storyboard, tài nguyên phiên, preset mới (`note-transition`, `easing`, `particle`, `theme`, `effect`). **Biểu thức:** lõi `@dawviz/expr` + ô nhập biểu thức có báo lỗi. **An toàn:** CSP, Trusted Types, watchdog, host ở tổ chức GitHub riêng. **Xuất:** thêm nền trong suốt (chuỗi PNG, WebM alpha nếu có) để ghép và xoay 3D trong phần mềm dựng (D-47). **Giao diện:** hai chế độ Cơ bản/Nâng cao (D-48), thanh phát tuỳ chỉnh, góc chảy nốt tự do 0–360°, theme sáng/tối/theo hệ thống, bộ chọn màu nhiều định dạng (HEX, RGB, RGBA, HSL, HSV, OKLCH) và nhập bảng màu, ẩn/hiện và solo track, tuỳ chỉnh bàn phím và tên nốt trên phím, khoảng hiển thị theo thời gian cho mọi widget, spectrum/waveform nhiều kiểu (SRS REQ-UI-10…12, REQ-GRAPHICS-07, REQ-GRAPHICS-14, REQ-WIDGET-07). | `docs/design/CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`; SRS §3.4, §3.4b, §3.8 |
| **1.1** | Trình soạn storyboard đầy đủ (timeline nhiều lớp), Graph Editor đầy đủ, trình soạn biểu thức nâng cao (gợi ý, bake), text animator nâng cao, các hiệu ứng `v1.1` trong danh mục (gồm WebGL sau Spike), **thư viện preset cộng đồng trong ứng dụng** (D-14) và quy trình kiểm duyệt (D-43), gói phông cộng đồng, spectrum dạng tròn/xoắn ốc, **không gian 2.5D** (xoay X/Y/Z từng lớp và cả cảnh, camera phối cảnh, preset góc nhìn; D-47), nhập bảng màu `.ase` và Coolors, theme giao diện do cộng đồng đóng góp. | Như trên; `docs/COMMUNITY-CONTENT.md` |
| **1.2** | Ableton Session View; xem/phát trên di động và máy tính bảng; nạp audio tách track (stem, người dùng tự xuất từ DAW) để hiện spectrum/waveform/meter và hiệu ứng theo âm thanh riêng từng track (SRS REQ-AUDIO-01); morph đường SVG tự do; xem lại `.flp`/`.bwproject` (nếu có tệp mẫu), AAC bằng WASM, parser khai báo XML/JSON (SOI-12); các hiệu ứng nhãn `sau` trong danh mục. | D-44 |

Điều kiện phát hành mỗi bản: toàn bộ AT của các yêu cầu thuộc bản đó đạt; mục [VERIFY] chưa đủ dữ liệu được ghi là hạn chế đã biết (D-45).

### 4.2. Ngoài phạm vi phiên bản 1.0 (Out-of-Scope)
* **Chưa hỗ trợ** trong v1.0: phân tích trực tiếp `.flp` (FL Studio) và `.bwproject` gốc của Bitwig (định dạng nhị phân). Người dùng dùng `.mid` (FL Studio) hoặc `.dawproject` (Bitwig). Engine parser nhị phân theo schema đã sẵn sàng, nên khi có file mẫu và schema thì có thể thêm mà không đổi lõi (D-28, OI-08).
* Đọc clip Session View của Ableton: chưa hỗ trợ ở 1.0/1.1 (clip bị bỏ qua và được báo cho người dùng); dự kiến 1.2 (D-44).
* Bộ tổng hợp âm thanh ảo (VST/Sampler) để phát tiếng từ nốt MIDI.
* Backend render video.
* Biên tập video đa tầng timeline phức tạp.
* Thư viện Preset/Parser tích hợp trong ứng dụng (GitHub Hub) — bản 1.1 (D-14, §4.4).
* Trình soạn storyboard đầy đủ, Graph Editor đầy đủ, hiệu ứng WebGL — bản 1.1 (§4.4).
* Ableton Session View, giao diện di động, morph SVG tự do — bản 1.2 (D-44).
* Xoay widget (rotation) — trường dữ liệu được giữ chỗ nhưng không cho chỉnh trong v1.0 (D-15); mở ở bản 1.1 cùng xoay X/Y/Z (D-47).
* Giao diện cho thiết bị di động (D-12); xem trên di động dự kiến 1.2 (D-44).
* Telemetry/analytics (D-13).

---

## 5. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU (RISK MANAGEMENT)

| STT | Rủi ro | Mức độ | Phương án giảm thiểu |
| :--- | :--- | :--- | :--- |
| **R-01** | Trình duyệt máy yếu bị tràn bộ nhớ (OOM) khi render 4K | Cao | Backpressure qua `encodeQueueSize`; giải phóng `VideoFrame` ngay sau khi encode; ghi MP4 theo luồng ra đĩa khi trình duyệt hỗ trợ; kiểm tra và cảnh báo trước khi render (SRS REQ-EXPORT-00). |
| **R-02** | Nhận diện sai hợp âm phức tạp (jazz, nốt nghịch) | Trung bình | Manual Chord Override; hai chế độ quét (Sustained/Strike); chọn track nguồn hợp âm. |
| **R-03** | Nhà sản xuất DAW đổi cấu trúc file ở bản mới | Trung bình | Tách parser thành tầng AST trung gian; hỗ trợ Declarative JSON Schema; ghi `sourceApp`/phiên bản trong AST; có bộ file mẫu hồi quy. |
| **R-04** | *(Hạ cấp xuống Giả định thiết kế A-01)* MP4 không có audio có thể gặp vấn đề tương thích ở một số nền tảng/phần mềm dựng | Thấp **[chưa kiểm chứng]** | v0.1 coi đây là rủi ro cao nhưng chưa có lỗi thực tế nào được ghi nhận. v0.2 giữ track Silent AAC ở dạng công tắc `export.silentAudioFallback` (mặc định bật). **v0.3:** Spike 1 ghi nhận lỗi encoder khi bật Silent AAC trên máy tính, trong khi MP4 video-only không gây lỗi ở các phần mềm kiểm thử; công tắc đổi thành mặc định TẮT (D-01 sửa). |
| **R-05** | Mã độc qua parser tùy chỉnh hoặc Project Pack | Nghiêm ngặt | Không `eval`/`new Function`; chỉ chấp nhận JSON khai báo, kiểm tra schema bằng bộ kiểm tra không sinh code động; giới hạn kích thước, độ sâu, tỉ lệ giải nén; CSP không có `unsafe-eval`. |
| **R-06** | Khả năng mã hóa video/audio khác nhau giữa trình duyệt và hệ điều hành (ví dụ có báo cáo Chromium trên Linux không mã hóa được AAC) | Cao | Phát hiện tính năng (feature detection) khi khởi động và trước khi xuất; chuỗi dự phòng codec; thông báo rõ nguyên nhân khi không xuất được (SRS REQ-CAP-01, REQ-EXPORT-06). |
| **R-07** | Thư viện phụ thuộc bị ngừng bảo trì (ví dụ `mp4-muxer` đã deprecated) | Trung bình | Chọn thư viện đang được bảo trì (Mediabunny); bọc sau lớp trừu tượng `MuxerAdapter` để thay được; rà soát phụ thuộc mỗi bản phát hành. |
| **R-08** | Lệch A/V do độ trễ khởi tạo của bộ mã hóa AAC (priming) | Trung bình | Bài kiểm thử đồng bộ tự động; bù trừ timestamp audio (SRS REQ-EXPORT-03); đo bằng KPI-02. |
| **R-09** | File đầu vào quá lớn hoặc cố tình nén bom làm treo trình duyệt | Trung bình | Parse trong Web Worker; giới hạn kích thước giải nén và tỉ lệ nén; hủy Worker khi quá thời gian (SRS REQ-PARSER-00). |
| **R-10** | Chi tiết cấu trúc file DAW trong tài liệu chưa được kiểm chứng bằng file mẫu thật | Trung bình | Mọi đường dẫn XML/JSON trong SRS gắn nhãn **[VERIFY]** và phải được đối chiếu bằng file mẫu trước khi coi parser là hoàn tất. **Cập nhật v0.3:** đã kiểm bằng file thật cho `.als` (Live 9.1, 12.4), `.alp` (Live 9.1), `.rpp` (Reaper 7.85), ví dụ chính thức của `.dawproject`; còn [VERIFY] cho `.dawproject` xuất thật, envelope tempo cong của Reaper và đối chứng độc lập cho IGNTEMPO=1 (đã có dự án thật; HASDATA ≠ QN không cần mẫu: guard clause) (`.mid` ngoài đã kiểm bằng mẫu thật), nhịp ≠ 4/4 của Ableton. Một giả định của v0.2 đã sai và được sửa: `.alp` không phải ZIP. |
| **R-11** | Lệch A/V lớn trên thiết bị di động tầm trung (Spike 1: −42,67 ms trên Snapdragon 685) | Trung bình | Phạm vi chỉ desktop (D-12); KPI-02 chỉ cam kết desktop; ghi chú trong tài liệu và cảnh báo khi phát hiện thiết bị di động; có thể bù offset audio sau khi có thêm số đo. |
| **R-12** | Người dùng thiếu thông tin tempo (file không có tempo, hoặc đổi tempo mà parser chưa đọc được) dẫn tới thời gian sai | Trung bình | Không đoán ngầm: AST mang cờ `tempoSource` (`file`/`midi-default`/`fallback`/`user`), `fallback` luôn kèm cảnh báo; giao diện cho nhập nhiều mốc BPM theo giây hoặc beat (D-24, D-29). |
| **R-13** | Gói `.alp` chứa nhiều `.als`, hoặc `.als` chỉ có clip ở Session View nên không có nốt | Thấp | Liệt kê các `.als` kèm track/nốt/BPM để người dùng chọn; thông báo rõ khi chỉ có clip Session (D-25). |
| **R-14** | Bản dịch cộng đồng sai nghĩa, lệch chuỗi gốc hoặc bị bỏ rơi khi giao diện đổi | Trung bình | Danh mục JSON có kiểm tự động (khoá, tham số, số nhiều); `status: partial` cho phép thiếu và dùng chuỗi tiếng Anh; người bảo trì duyệt pull request; chuỗi mới luôn bắt đầu từ `en` rồi `vi`; ghi tên người dịch trong `@meta` |

---

## 6. GIẢ ĐỊNH (ASSUMPTIONS)

* **A-01:** *(sửa v0.3)* MP4 video-only được các phần mềm dựng và trình phát thông dụng xử lý tốt (Spike 1); track audio im lặng không còn là mặc định (xem R-04, D-01).
* **A-02:** Phần lớn video showcase là đoạn ngắn (≤ 60–90 giây); các KPI thời gian được định nghĩa theo giả định này.
* **A-03:** Người dùng có sẵn máy tính để bàn/laptop với trình duyệt Chromium bản mới và có bộ mã hóa H.264 (phần cứng hoặc phần mềm).
* **A-04:** Người dùng tự chịu trách nhiệm bản quyền của file audio, ảnh nền và font họ nạp vào.

---

## 7. NHẬT KÝ QUYẾT ĐỊNH (DECISION LOG)

Các quyết định dưới đây do nhóm soạn thảo chọn thay cho người ra quyết định để đưa tài liệu lên bản ổn định. Tất cả cần được review lại sau khi dùng thực tế.

| Mã | Quyết định | Lý do | Xem lại khi |
| :--- | :--- | :--- | :--- |
| **D-01** | *(sửa v0.3)* Silent AAC là công tắc tuỳ chọn, **mặc định TẮT**; không có audio thì xuất video-only. | Spike 1: lỗi encoder khi bật Silent AAC trên máy tính; video-only chạy tốt trên các phần mềm kiểm thử. Bản v0.2 từng giữ mặc định BẬT. | Có bằng chứng nền tảng nào từ chối MP4 không audio. |
| **D-02** | KPI A/V sync: ≤ ±2 ms theo timestamp container, không tích lũy. | 0 ms không đo được. | Có dữ liệu đo thực tế. |
| **D-03** | Bitwig hỗ trợ qua `.dawproject`, không qua `.bwproject`. | `.dawproject` là định dạng mở, ZIP + XML, do Bitwig và PreSonus công bố; Studio One cũng xuất được. | Có spec `.bwproject` công khai. |
| **D-04** | Dùng Mediabunny thay `mp4-muxer`. | `mp4-muxer` đã deprecated, tác giả khuyến nghị Mediabunny. | Mediabunny thay đổi giấy phép/API. |
| **D-05** | Tương thích theo feature detection và chuỗi dự phòng codec, bỏ bảng số phiên bản Chrome. | AAC encode phụ thuộc hệ điều hành; số phiên bản không phản ánh đúng. | Kết quả test Safari/Firefox. |
| **D-06** | Canvas có "độ phân giải thiết kế" (logical size) cố định theo tỉ lệ; xuất ra bằng hệ số scale. | WYSIWYG, preset không vỡ khi đổi độ phân giải. | — |
| **D-07** | Mỗi widget có `zIndex` riêng; Playhead thuộc Piano Roll; chỉ nền (dưới cùng) và lớp tương tác (trên cùng) là cố định. | Giống công cụ thiết kế thương mại (Figma/Canva). | — |
| **D-08** | AST lưu tick làm nguồn gốc; giây là giá trị suy ra. PPQ nội bộ của định dạng tính theo beat là 960. | Đảm bảo chính xác tick (NFR-ACC-02). | — |
| **D-09** | Hợp âm tính trước thành `ChordTimeline`; Override có `startTick`/`endTick` rõ ràng. | Xác định, tái lập được khi xuất video; dễ undo. | — |
| **D-10** | Audio có offset thủ công (±10 s); thời lượng xuất mặc định = max(project, audio) + 2 s đệm; có Export Range. | Cách làm phổ biến của các visualizer thương mại; hỗ trợ video ngắn. | — |
| **D-11** | Auto-save lưu cả Blob file dự án, audio, ảnh nền, font vào IndexedDB; nếu thiếu quota thì chỉ lưu trạng thái và báo người dùng nạp lại file. | Khôi phục phiên 100%. | Có số liệu quota thực tế. |
| **D-12** | Chỉ desktop; giao diện song ngữ Việt/Anh. | Persona quốc tế; mobile chưa có yêu cầu. | Có nhu cầu mobile. |
| **D-13** | v1.0 không telemetry; KPI đo bằng usability test và benchmark. | Phù hợp NFR-SEC-01 và OBJ-2. | Cần dữ liệu sử dụng ở quy mô lớn. |
| **D-14** | Chia sẻ preset/parser bằng file ở v1.0; thư viện trong ứng dụng ở v1.1. | Giảm phạm vi v1.0. | — |
| **D-15** | Rotation chỉ giữ chỗ trong dữ liệu, chưa cho chỉnh. | Tránh độ phức tạp của snapping với widget xoay. | Có yêu cầu từ người dùng. |
| **D-16** | Các ngưỡng hiệu năng là **[PROVISIONAL]** và gắn với "Máy chuẩn RM-1". | Chưa có benchmark thực tế. | Sau spike benchmark. |
| **D-17** | Kích thước khung xuất làm tròn về số chẵn; cạnh dài ≤ 4096 px; chọn level H.264 theo độ phân giải/FPS và dò bằng `isConfigSupported`. | H.264 yêu cầu kích thước chẵn; hạn chế level. | — |
| **D-18** | Parser JSON v1.0 chỉ nhận nguồn XML/JSON; chỉ dùng bộ biến đổi trong danh sách trắng. | An toàn và kiểm thử được. | Có nhu cầu định dạng text. |
| **D-19** | Người dùng FL Studio dùng `.mid` xuất từ FL ở v1.0. | `.flp` *chưa hỗ trợ*. | Có parser `.flp`. |
| **D-20** | Render Core dùng chung cho Preview và Export (`renderFrame` thuần). | WYSIWYG, tái lập được (SRS ARC-01). Spike 1: Worker + OffscreenCanvas + FontFace hoạt động, độ lệch màu tối đa 57/255 mỗi kênh giữa Preview và video ở khung đo. | Có khác biệt hiển thị giữa các trình duyệt. |
| **D-21** | Vòng xuất chạy trong Export Worker. | Giao diện không đứng hình, chống giảm tốc khi chuyển tab (ARC-02). Spike 1 chạy được. | — |
| **D-22** | FFT tự cài, tất định, không dùng `AnalyserNode`. | Preview và Export cho cùng kết quả (ARC-06). | Hiệu năng không đạt. |
| **D-23** | Logic đọc file DAW là thư viện độc lập (monorepo `@dawviz/parser-*`, không phụ thuộc ngoài, có bản bundle một file cho Worker). | Khuyến nghị Spike 2: dễ bảo trì, kiểm thử, tái sử dụng. | — |
| **D-24** | Không bao giờ gán tempo ngầm: AST có `meta.tempoSource`; thiếu tempo thì báo cảnh báo và cho người dùng nhập. | Spike 2: fallback 120 BPM chỉ chấp nhận trong spike. | — |
| **D-25** | `.alp` là gói `pl-a` (không phải ZIP); gói có thể có nhiều `.als`, người dùng chọn sau khi nạp (mặc định `.als` lớn nhất). | Quan sát trên file `.alp` thật (65 MB, 3 `.als`). Giữ nhánh ZIP phòng biến thể. | Có thêm mẫu `.alp` (Live 10/11/12). |
| **D-26** | Xuất: cho nhập rộng × cao và tỉ lệ tuỳ ý (làm chẵn, ≤ 4096); tên file chốt trước khi render. | Spike 1: bó cứng mốc phân giải gây hạn chế; tên file bị đổi muộn khi ghi thẳng xuống đĩa. | — |
| **D-27** | Thêm widget Progress Bar (tổng 8 widget). | Đề xuất Spike 2 và ghi chú cuối SRS v0.2. | — |
| **D-28** | Parser khai báo hỗ trợ nguồn **nhị phân** bằng JSON schema với ngôn ngữ biểu thức an toàn (không `eval`, hàm trong danh sách trắng, có ngân sách). Nguồn XML/JSON khai báo (D-18) chưa triển khai. `.bwproject`/`.flp`: chưa hỗ trợ cho đến khi có mẫu và schema. | Yêu cầu của dự án: binary cần file cấu trúc để parser theo; giữ R-05. | Có `.bwproject` mẫu. |
| **D-29** | Ghi đè tempo gồm nhiều mốc, mốc đặt theo giây (đổi tuần tự qua BPM của mốc trước) hoặc beat; BPM trong 10–1000. | Yêu cầu từ Spike 2: người dùng chủ động thêm timestamp/offset tempo. | — |
| **D-30** | Đa ngôn ngữ xây từ đầu: từ điển JSON phẳng, `en` là nguồn, `vi` đầy đủ, nhóm khoá `errors.*`/`warn.*` dịch theo mã; thư viện parser không dịch `message` của nó; cộng đồng thêm ngôn ngữ bằng pull request chỉ gồm JSON, có bộ kiểm tự động. | Chưa có nhiều chuỗi nên chi phí thấp nhất; làm sau sẽ phải sửa lại toàn bộ giao diện. | Cần công cụ dịch có quản trị (Weblate...) khi cộng đồng đủ lớn |
| **D-31** | Ghi đè tempo có thêm dấu nhịp theo từng mốc; mốc nhập theo thời gian (`m:ss.mmm`), `Bar.Beat.%` hoặc `Bar.Beat.Sixteenth`; một beat của DAW là nốt theo mẫu số của nhịp. | Người dùng đọc vị trí từ đồng hồ của DAW; đổi nhịp làm thay đổi cách đếm bar. | Phát hiện DAW đếm beat khác trong nhịp ghép (OI-12) |
| **D-32** | Đề xuất các widget/dữ liệu hiển thị bổ sung (SRS mục 3.4b); chưa cam kết vào v1.0. | Dữ liệu AST đã có sẵn cho phần lớn đề xuất. | Chốt ở OI-11 |
| **D-34** | Ngăn xếp giao diện: **React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion**, kiểm thử bằng Vitest + Testing Library; Canvas 2D cho khung hình video. | Hệ sinh thái lớn, dễ tuyển người đóng góp; Tailwind giúp nhất quán giao diện; Framer Motion cho chuyển động giao diện (kéo thả, danh sách, thông báo); Canvas thuần cho khung xuất để không phụ thuộc React (D-06). Framer Motion chỉ dùng cho giao diện, **không** dùng cho khung hình xuất. | Khi bản dựng đo thấy chi phí bó (bundle) hoặc hiệu năng không đạt NFR-PERF. |
| **D-35** | Một monorepo `dawviz` chứa: `packages/*` (parser-*, i18n, render-core), `apps/web` (ứng dụng), `apps/parser-lab` (công cụ thử parser), `docs/` (tài liệu sản phẩm, thiết kế và thư viện parser) và `scripts/`. Tài liệu parser nằm trong `docs/parser/` với tiền tố `PARSER-`; quyết định của parser dùng mã `PD-xx`. Công cụ `scripts/split_doc.py` dùng chung cho mọi tài liệu. | Đổi AST thì sửa parser, Render Core, ứng dụng và tài liệu trong cùng một thay đổi; AST chưa ổn định nên tách repo sớm chỉ thêm chi phí. | AST ổn định qua ≥ 2 mốc và có người dùng thư viện parser bên ngoài. |
| **D-36** | Mã mới viết bằng TypeScript (Render Core, ứng dụng); thư viện parser giữ JavaScript + JSDoc đã có 66 test. Render Core chỉ gồm hàm thuần, không phụ thuộc React/DOM, chạy được cả trong Worker và test bằng Node. | Không viết lại mã đã kiểm chứng; Render Core tách khỏi giao diện để Preview và Export dùng chung (ARC-01). | Cần kiểu chặt cho AST ở mọi nơi: sinh `.d.ts` từ JSDoc hoặc chuyển parser sang TS. |
| **D-37** | Hiệu ứng chuyển động cho video xuất tính bằng hàm thuần của thời gian trong Render Core, không dùng CSS transition hay thư viện chạy thời gian thực; chưa nhận khung dựng video ngoài (Remotion, GSAP, Motion Canvas) vào lõi. Bộ kiểu (preset) và tài nguyên (assets) do cộng đồng đóng góp, dự kiến tách repo riêng. | Giữ WYSIWYG và tua chính xác (D-06); mở đóng góp không cần sửa mã; chi tiết ở `docs/design/ANIMATION.md` và `docs/COMMUNITY-CONTENT.md`. |
| **D-38** | **[ĐÃ CHỐT v1.1]** Hướng "tùy biến tối đa": storyboard dạng dữ liệu, soạn trực quan trên web, nhiều khả năng và dễ dùng hơn storyboard viết bằng lệnh (không nhập `.osb`), template chuyển cảnh nốt bốn pha, bộ easing đầy đủ (Penner, cubic-bezier, spring, tự vẽ), hạt không trạng thái, tài nguyên của phiên theo băm nội dung, preset mới chia sẻ lên thư viện cộng đồng. Không chạy script người dùng trong v1 (AD-08…AD-12). | Tạo khác biệt lớn nhất về hình ảnh mà vẫn giữ tất định và an toàn khi chia sẻ; chi tiết ở `docs/design/CUSTOMIZATION.md`. | Phân bổ theo bản phát hành ở §4.4. |
| **D-39** | **[ĐÃ CHỐT v1.1]** Cho phép người dùng gõ biểu thức điều khiển thuộc tính, chạy bằng trình thông dịch riêng (`@dawviz/expr`) theo danh sách trắng, không bao giờ sinh hay chạy JavaScript. An toàn dựa trên thiết kế (sandbox, CSP, origin riêng), không dựa vào người duyệt; template và preset cộng đồng qua CI tự động + 2 người duyệt, phát hành theo băm, có thu hồi (AD-13…AD-15). | Tùy biến mạnh như expression của After Effects mà vẫn giữ NFR-SEC-01…04 khi host trên GitHub Pages và chạy trên máy người dùng; chi tiết ở `docs/design/EXPRESSIONS.md`. | Lõi biểu thức ở 1.0, trình soạn đầy đủ và kiểm duyệt cộng đồng ở 1.1; origin đã chốt ở D-41. |
| **D-40** | Phạm vi theo bản phát hành 1.0 / 1.1 / 1.2 như §4.4. Bản 1.0 gồm toàn bộ widget đề xuất P-01…P-13 (SRS 3.4b) cùng 8 widget cốt lõi. | Chủ dự án chọn "lõi + tùy biến chính" cho 1.0 và đưa đủ widget vào 1.0 để sản phẩm khác biệt ngay bản đầu. | Lịch 1.0 dài khoảng 16–25 tuần (PROGRESS §5); nếu cần ra mắt sớm, phát hành 1.0-beta sau M3. |
| **D-41** | Host ứng dụng và trang tài liệu bằng **tổ chức GitHub riêng** cho dự án (Pages ở `<tổ-chức>.github.io`), không dùng `github.io` của tài khoản cá nhân. Có thể trỏ tên miền riêng sau. | Tách origin, nên dữ liệu người dùng trong trình duyệt không chia sẻ với trang khác (EXPRESSIONS M10); miễn phí. | Cần tên miền riêng khi thương hiệu lớn. |
| **D-42** | Người đóng góp (mã, bản dịch, preset, tài nguyên) xác nhận quyền bằng **DCO**: mỗi commit có dòng `Signed-off-by`; đóng góp theo giấy phép của repo (Apache-2.0 cho mã/tài liệu/bản dịch; preset và tài nguyên theo SPDX ghi trong tệp). Không dùng CLA. | Đơn giản, phổ biến, không cản người đóng góp. | Cần đổi giấy phép toàn dự án. |
| **D-43** | Kiểm duyệt cộng đồng do **kiểm duyệt viên cộng đồng** đảm nhận: người đóng góp được gán vai trò reviewer (đội `reviewers` trên GitHub) sau khi có đóng góp tốt; mỗi preset/bản dịch cần CI xanh + **2 phê duyệt** từ đội reviewers (khi đội còn dưới 3 người: 1 reviewer + 1 maintainer); không tự duyệt bài của mình; CI, schema, `@dawviz/expr`, workflow chỉ maintainer duyệt (CODEOWNERS). | Mở rộng được theo cộng đồng mà an toàn vẫn dựa trên thiết kế (EXPRESSIONS §1). | Có preset độc lọt qua hoặc reviewer lạm quyền: thu hồi vai trò, danh sách `revoked`. |
| **D-44** | Nền tảng: 1.0 và 1.1 chỉ desktop (Chromium chính thức; Firefox/Safari, Linux theo khả năng phát hiện được). **1.2**: mở và xem/phát preset trên di động và máy tính bảng; xuất video vẫn khuyến nghị desktop. Ableton Session View đọc ở **1.2**. Morph đường SVG tự do ở **1.2**. | Tập trung nguồn lực cho trải nghiệm chính; các mục này cần dữ liệu và thiết bị thật. | Có nhu cầu lớn từ người dùng di động. |
| **D-45** | **Chương trình tệp mẫu:** các mục [VERIFY] cần dữ liệu thật (OI-01, OI-05, OI-08, OI-12, OI-14, SOI-04, SOI-06, SOI-16, SOI-17, SOI-19) được giải quyết qua mẫu issue "Gửi tệp mẫu" (người gửi xác nhận quyền chia sẻ; tệp không công khai thì để `third-party/`). Mục chưa đủ dữ liệu khi phát hành được ghi là **hạn chế đã biết** trong ghi chú phát hành, không chặn bản phát hành. | Không để bản phát hành phụ thuộc vào dữ liệu chưa có. | — |
| **D-46** | Tài liệu dự án (BRD, SRS, thiết kế, hướng dẫn đóng góp, trang web tài liệu) **giữ tiếng Việt** làm ngôn ngữ duy nhất ở thời điểm này. Bản tiếng Anh làm sau khi có nhu cầu, ưu tiên các trang cho người đóng góp (README, CONTRIBUTING, I18N, COMMUNITY-CONTENT, quy tắc kiểm duyệt). Giao diện ứng dụng vẫn đa ngôn ngữ en/vi (D-30), không bị ảnh hưởng. | Ngôn ngữ làm việc của chủ dự án; tránh hai bản lệch nhau khi tài liệu còn thay đổi nhiều. | Cộng đồng quốc tế lớn dần hoặc có người đóng góp không đọc được tiếng Việt. |
| **D-47** | Hai cách cho góc nhìn nghiêng/3D: (1) **bản 1.0** xuất **nền trong suốt** (chuỗi PNG; WebM VP9 alpha nếu trình duyệt hỗ trợ) để người dùng xoay 3D trong After Effects/Premiere; (2) **bản 1.1** dựng sẵn **2.5D** trong ứng dụng: mỗi lớp và cả cảnh xoay theo X/Y/Z, camera phối cảnh, preset góc nhìn (nghiêng chéo, isometric, đường băng), ghép bằng WebGL2 sau Spike T-27. Nốt là khối 3D thật: cân nhắc sau 1.2. Thay thế D-15 từ bản 1.1. | Người dùng muốn nhìn dự án chéo thay vì vuông góc; cách (1) rẻ và mở đường cho người dùng chuyên nghiệp ngay, cách (2) cho người không dùng phần mềm dựng. | Spike WebGL2 cho thấy không đạt hiệu năng hoặc khác biệt Preview/Export quá lớn. |
| **D-48** | Giao diện có hai chế độ **Cơ bản** và **Nâng cao** trên cùng một dữ liệu dự án. Lần đầu mở ứng dụng hỏi người dùng chọn; lựa chọn được nhớ, đổi lại được. Ở Cơ bản, mỗi bảng có nút "Thêm tuỳ chọn" mở phần nâng cao của riêng bảng đó. Phân bổ tính năng theo bảng ở SRS REQ-UI-13. | Mục tiêu "tuỳ biến tối đa" làm số thiết lập rất lớn; người mới cần đường đi ngắn (KPI-04), người quen cần đủ quyền điều khiển. | Thử nghiệm với người dùng cho thấy người mới vẫn bị ngợp, hoặc người quen phải mở "Thêm tuỳ chọn" quá nhiều. |
| **D-33** | Độ sáng/độ mờ của track có thể lấy từ automation (mặc định: âm lượng, to hơn thì sáng hơn); người dùng đổi nguồn (volume, pan, mute, mức tĩnh, tắt), đảo chiều và chỉnh ngưỡng. Cần AST có `track.mix`/`track.automation` và parser đọc envelope (đã làm cho Reaper). | Hiệu ứng trực quan có ý nghĩa âm nhạc, tất định cho Preview/Export; người dùng muốn tự chọn nguồn nên không khoá cứng. | Chấp nhận |

---

## 8. CÁC VẤN ĐỀ CÒN MỞ (OPEN ISSUES)

| Mã | Nội dung | Người/giai đoạn xử lý |
| :--- | :--- | :--- |
| **OI-01** | Thu thập bộ file mẫu thật để kiểm chứng parser và đo KPI-01. **Đã có:** Ableton 9.1 (`.als` + `.alp`), 12.4 (`.als`), Reaper 7.85 (2 dự án có MIDI nhúng, 1 dự án tham chiếu `.mid` ngoài kèm file `.mid`, 5 template), ví dụ `.dawproject` chính thức. **Còn thiếu:** `.dawproject` xuất thật (Bitwig/Studio One), Ableton 10/11, Reaper 6, `.alp` bản mới, clip lặp/`StartRelative ≠ 0`/nhịp ≠ 4/4, MIDI xuất từ DAW làm tham chiếu. **v1.1:** xử lý qua Chương trình tệp mẫu (D-45). | Dev/QA — trước khi hoàn tất parser |
| **OI-02** | Xác định cấu hình Máy chuẩn RM-1 thật và chạy benchmark để chốt các giá trị **[PROVISIONAL]**. **v1.1:** đo trong M5, trước khi phát hành 1.0. | Dev — spike kỹ thuật |
| **OI-03** | Kiểm tra mức hỗ trợ WebCodecs (video và audio) trên Firefox và Safari bằng thử nghiệm thực tế. **v1.1:** 1.0/1.1 chạy theo khả năng phát hiện được; kiểm thử thật trước khi phát hành 1.0 và ghi vào hạn chế đã biết (D-44). | Dev |
| **OI-04** | Kiểm tra khả năng dùng bộ mã hóa AAC chạy bằng WASM làm phương án dự phòng khi trình duyệt không có AAC gốc (và giấy phép đi kèm). **v1.1:** không có trong 1.0/1.1; xem lại ở 1.2. Khi thiếu AAC: xuất video-only hoặc WebM/Opus (D-05). | Dev |
| **OI-05** | Tích hợp thư viện @tonaljs/chord-detect làm engine nhận diện hợp âm cốt lõi thay vì viết tay. Cần thu thập bộ mẫu test gồm 30–50 đoạn MIDI thực tế (Pop, Lo-Fi, R&B, Jazz) để tinh chỉnh thuật toán gom nốt theo thời gian (time-windowing) và đo đạt KPI-06. **v1.1:** bộ mẫu MIDI tự tạo + Chương trình tệp mẫu (D-45); kiểm giấy phép thư viện trước khi dùng (OI-07). | Product/Nhạc công |
| **OI-06** | Đánh giá lại D-01 (Silent AAC) khi có phản hồi thực tế từ các nền tảng. **v1.1:** giữ mặc định TẮT; xem lại sau phản hồi của 1.0. | Product |
| **OI-07** | Kiểm tra giấy phép các thư viện phụ thuộc và font đóng gói kèm. **v1.1:** thêm bước kiểm giấy phép phụ thuộc tự động vào CI trước khi phát hành 1.0 (T-40). | Dev/Pháp lý |
| **OI-08** | Cần file `.bwproject` (và `.flp`) mẫu để viết schema nhị phân thật; cho tới lúc đó ghi là *chưa hỗ trợ*. **v1.1:** chưa hỗ trợ trong 1.0/1.1; xem lại ở 1.2 nếu có tệp mẫu (D-45). | Product/Dev |
| **OI-09** | Đo lại A/V sync trên thêm thiết bị di động và quyết định có bù offset hay giữ phạm vi desktop (R-11). **Đã chốt v1.1 (D-44):** 1.0/1.1 chỉ desktop; 1.2 xem trên di động, xuất vẫn khuyến nghị desktop. | Dev |
| **OI-10** | Quyết định chính thức: chỉ đọc Arrangement hay đọc cả Session View của Ableton (clip Session hiện bị bỏ qua). **Đã chốt v1.1 (D-44):** 1.0/1.1 chỉ Arrangement; Session View ở 1.2. | Product |
| **OI-11** | Chốt danh sách widget/dữ liệu hiển thị bổ sung đề xuất ở SRS mục 3.4b: cái nào vào v1.0, cái nào để sau; cần đọc thêm dữ liệu nào từ file (marker/vùng, lời bài hát). **Đã chốt v1.1 (D-40):** toàn bộ P-01…P-13 vào bản 1.0. | Product |
| **OI-12** | Cách đếm beat/bar trong nhịp ghép: **Reaper đã xác nhận** đếm theo mẫu số (12/8 @120 BPM: `1.12.68` = 2,920 s). Còn đối chiếu Ableton, Bitwig và nhịp 5/4... bằng file thật. **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA |
| **OI-14** | Chiều pan, nghĩa giá trị mute và hệ số nội suy volume (`gain^0,25`, suy từ 2 điểm đo) của automation chưa kiểm đủ; Ableton/Bitwig automation chưa đọc. **v1.1:** Chương trình tệp mẫu (D-45); Ableton/Bitwig automation cần cho P-13 ở 1.0. | Dev/QA |
| **OI-13** | Quy trình cộng đồng dịch: ai duyệt, giấy phép/CLA cho người đóng góp, ngôn ngữ ưu tiên, font cho CJK/Ả Rập/Thái/Devanagari trong video xuất ra, và khi nào dùng công cụ dịch có quản trị. **Đã chốt phần quy trình v1.1:** DCO (D-42); bản dịch duyệt bởi kiểm duyệt viên cộng đồng (D-43); ưu tiên en, vi. **Còn mở:** phông cho CJK/Ả Rập/Thái/Devanagari trong video xuất: 1.0 cho người dùng nạp phông riêng (tài nguyên phiên), 1.1 có gói phông cộng đồng. | Product/Dev |
| **OI-15** | **Đã đóng 2026-11-12:** không nhập storyboard osu! (`.osb`), không làm giống mô hình osu!; tập trung tùy biến nhiều hơn và dễ dùng hơn (`docs/design/CUSTOMIZATION.md` mục 2). | Product |
| **OI-16** | **Đã chốt một phần 2026-11-12:** có ngôn ngữ biểu thức (D-39, `docs/design/EXPRESSIONS.md`). Còn mở: có làm morph giữa đường SVG tự do không. **Đã đóng v1.1:** morph SVG tự do ở 1.2 (D-44). | Product/Dev |
| **OI-17** | Chọn origin để host ứng dụng: tên miền riêng hay tài khoản/tổ chức GitHub riêng (không dùng `tên-cá-nhân.github.io/dawviz` vì dùng chung origin với các repo khác). Phải chốt trước khi lưu dữ liệu người dùng trên site công khai. **Đã đóng v1.1 (D-41):** tổ chức GitHub riêng. | Product |
