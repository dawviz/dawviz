---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)"
path: "4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)"
chunk: 4-yeu-cau-phi-chuc-nang-non-functional-requireme.md
source_lines: 868-914
source_sha1: 0fd28ef586
ids: [ARC-07, BR-08, D-05, D-12, D-16, D-30, D-41, KPI-01, KPI-02, KPI-03, KPI-06, KPI-07, NFR-ACC-01, NFR-ACC-02, NFR-ACC-03, NFR-COMP-01, NFR-COMP-02, NFR-COMP-03, NFR-PERF-01, NFR-PERF-02, NFR-PERF-03, NFR-PERF-04, NFR-PERF-05, NFR-REL-01, NFR-SEC-01, NFR-SEC-02, NFR-SEC-03, NFR-SEC-04, NFR-SEC-05, NFR-SEC-06, NFR-SEC-07, OI-02, OI-03, REQ-GRAPHICS-05, REQ-PARSER-00, SOI-07]
---
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
