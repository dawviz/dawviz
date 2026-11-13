# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Người dùng chính: beatmaker làm nhạc tại nhà** (Persona 1, BRD §3). 20–28 tuổi, dùng Ableton Live hoặc FL Studio. Vừa xong một bản beat và muốn có video dọc 9:16 đăng TikTok/Shorts/Reels thật nhanh, không mở Premiere hay After Effects. Kỳ vọng: kéo project vào → dùng preset dọc mặc định → (tuỳ chọn) chọn đoạn highlight → Export MP4 trong khoảng một phút. **Khi các lựa chọn thiết kế mâu thuẫn (mặc định, chế độ Cơ bản, lần mở đầu), người dùng này thắng.**

Người dùng phụ, được phục vụ chủ yếu qua chế độ Nâng cao (D-48):

- **Giảng viên piano/keyboardist** (Persona 2): dùng Reaper và bàn phím MIDI; cần tên hợp âm đúng theo thời gian, đếm nốt, nốt đang kích hoạt, và sửa tay hợp âm khi thuật toán sai.
- **Power user / VJ** (Persona 3): dùng Bitwig, Reaper; tự thiết kế bố cục HUD, màu, phổ tần, keyframe, biểu thức; tạo và chia sẻ preset JSON.
- **Người đóng góp cộng đồng**: người dịch, tác giả preset/tài nguyên, người viết schema parser; đọc tài liệu và dùng `apps/parser-lab`.

## Product Purpose

DAW Visualizer (dawviz) là ứng dụng web chạy hoàn toàn phía trình duyệt: nạp tệp dự án DAW, bóc tách nốt, tempo, hợp âm và automation, dựng cảnh HUD tối giản (piano roll, bộ đếm, hợp âm, phổ tần…) và xuất video MP4 bằng phần cứng của chính người dùng.

Mục tiêu đo được (BRD §2): từ file DAW đến MP4 cho đoạn ≤ 60 giây ở 1080p trong ≤ 3 phút (KPI-05); từ lúc mở trang đến lúc bấm Export ≤ 60 giây thao tác với preset mặc định (KPI-04); chi phí hạ tầng bằng 0, chỉ cần static hosting (OBJ-2).

## Positioning

Đọc chính tệp dự án DAW (nốt, tempo, hợp âm, automation), không phải một file âm thanh đã trộn. Khung hình là hàm thuần của thời gian, nên bản xem trước khớp đúng bản xuất. Mọi thứ, kể cả xuất video, chạy trong trình duyệt: không server, không telemetry.

## Operating Context

- Máy tính để bàn/laptop, trình duyệt Chromium (Chrome/Edge/Brave/Opera) trên Windows và macOS là nền tảng kiểm thử chính; trình duyệt khác chạy theo khả năng phát hiện được. Chỉ desktop ở 1.0 và 1.1; xem/phát trên di động ở 1.2, xuất vẫn khuyến nghị desktop (D-12, D-44).
- Người dùng đến từ DAW của họ, đọc vị trí theo đồng hồ DAW (`Bar.Beat.Sixteenth`, `Bar.Beat.%`, `m:ss.mmm`), và mang theo thuật ngữ DAW, các công cụ thiết kế (Figma/Canva cho snapping, After Effects cho keyframe, easing, graph editor).
- Đích đến của sản phẩm là video ngắn trên mạng xã hội (TikTok, Shorts, Reels, YouTube, Facebook, Instagram) hoặc phần mềm dựng (Premiere, DaVinci Resolve, Final Cut, CapCut).
- Hai chế độ giao diện **Cơ bản / Nâng cao** trên cùng dữ liệu; lần mở đầu hỏi chọn, lựa chọn được nhớ (D-48).
- Tách **Edit Mode** và **Preview Mode**.

## Capabilities and Constraints

- **Định dạng vào:** Ableton `.als`/`.alp` (chỉ Arrangement), Reaper `.rpp`, `.dawproject` (Bitwig/Studio One), MIDI `.mid`, parser khai báo bằng JSON schema (nguồn nhị phân). `.flp` và `.bwproject` *chưa hỗ trợ*. Người dùng FL Studio xuất `.mid`, và màn hình nạp file phải hướng dẫn điều này (D-19). Audio kèm tuỳ chọn.
- **Không bao giờ gán tempo ngầm:** thiếu tempo thì cảnh báo và cho người dùng nhập mốc BPM, dấu nhịp (D-24, D-29, D-31).
- **Cảnh và widget:** 8 widget cốt lõi + đề xuất P-01…P-13 trong bản 1.0; snapping, smart guides, preset 9:16 / 16:9 / 1:1. Mọi widget chỉnh như lớp của trình dựng motion graphics: vị trí, kích thước, **xoay 2D tự do từ 1.0** (D-54, thay D-15), keyframe, biểu thức; xoay 3D X/Y/Z và camera ở 1.1 (D-47).
- **Xuất:** MP4 (WebCodecs + Mediabunny), kích thước tuỳ ý (chẵn, ≤ 4096), chọn đoạn xuất, tiến độ và nút huỷ; nền trong suốt ở 1.0 (D-47).
- **Khung preview là video, không phải giao diện app:** khung do Render Core vẽ trên canvas, luôn theo preset video (mặc định "Bản in" nền trắng, D-51), kể cả khi theme app tối. Gọi là "Phong cách video"; không lẫn với theme app.
- **Theme giao diện ("Giao diện ứng dụng"):** Sáng / Tối / Theo hệ thống (REQ-UI-10); theme cộng đồng ở 1.1. Theme **chỉ đổi màu** qua bộ token cố định (D-52): không đổi phông, cỡ, khoảng cách, bố cục hay component, không nhận CSS tuỳ ý; mỗi theme kiểm tương phản AA trước khi áp, không đạt thì từ chối cả theme.
- **Mọi điều khiển kéo có ô nhập giá trị đi kèm** (số, đơn vị, phép tính, tương đối) (D-49).
- **Đa ngôn ngữ:** en (nguồn) và vi đầy đủ; mọi chữ hiển thị đi qua `locales/en.json` và `locales/vi.json`, không chữ cứng; văn bản trên video cũng được dịch (BR-09, D-30). Giao diện phải chịu được chuỗi dài hơn tiếng Anh.
- **An toàn:** không `eval`/`new Function`, CSP không `unsafe-eval`, Trusted Types; parse trong Web Worker (R-05, R-09). CSP chỉ cho `font-src 'self'` (cùng `data:`/`blob:`), nên **mọi phông phải tự host** trong repo, không dùng CDN phông; phông phải có giấy phép mở (OFL) để phân phối.
- **Ngăn xếp:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion; Canvas 2D cho khung hình video; Render Core thuần, không phụ thuộc React/DOM (D-34, D-36, D-37).
- **Tình trạng hiện tại (2026-11-13):** M1 đóng 2026-11-12 (nạp file → Piano Roll → phát/tua, en/vi); M2 đang làm (Scene + `renderFrame` xong; tiếp theo store/hoàn tác/Preset rồi widget). Chưa có xuất video (M3), lưu phiên (M4). `apps/web` hiện là **giao diện khung** để kiểm parser/Render Core, chưa phải giao diện sản phẩm; bố cục sản phẩm (ba thẻ Preview / Editor / Settings, Cơ bản/Nâng cao, theme) sẽ dựng lại theo D-53 (T-48, T-60, T-70).
- Ngoài phạm vi 1.0: Session View, giao diện di động, thư viện preset trong ứng dụng, WebGL, storyboard và Graph Editor đầy đủ (BRD §4.2, §4.4). "Biên tập video đa tầng" ngoài phạm vi nghĩa là cắt ghép clip/cảnh quay; lớp đồ hoạ, keyframe và timeline hiệu ứng **thuộc** phạm vi (D-54).

## Brand Commitments

- Tên: **DAW Visualizer**; tên gói/repo `dawviz`.
- Mã nguồn mở Apache-2.0; người đóng góp ký DCO, không CLA (D-42). Preset và tài nguyên cộng đồng mang SPDX riêng.
- Riêng tư là cam kết sản phẩm: không gửi dữ liệu dự án lên server, không telemetry (BR-08, D-13).
- Tài liệu dự án viết bằng tiếng Việt (D-46); giao diện ứng dụng đa ngôn ngữ.
- Host trên tổ chức GitHub riêng của dự án (D-41).
- **Nguồn sự thật về hình ảnh:** `docs/design/UI-DIRECTION.md` (mục 5.3 cấu trúc D + A + E, mục 5.4 token màu, mục 7 nguyên tắc) và BRD D-51…D-54. Khung preview mặc định "Bản in" (D-51) chỉ lấy ngôn ngữ trình bày từ ảnh tham chiếu, **không** dùng tên, bài hay nhận diện của kênh gốc. Giao diện web theo cấu trúc D + A + E (D-53) với bốn bảng màu dựng sẵn (Studio cam mặc định, Bản in đỏ, Đồng, Riso hồng), mỗi bảng có sáng và tối; thay đổi hướng hình ảnh phải sửa tài liệu đó và thêm quyết định `D-xx` vào BRD trước.

## Evidence on Hand

- Số đo thật từ Spike 1/2 (BRD §2.2): A/V lệch 0,00 ms trên desktop; xuất 1080p ở 2,4–2,65× thời gian thực trên máy LOQ; đối chứng parser trên Ableton Live 12 (9605 nốt) và Reaper 7.85 (7497 và 3147 nốt); 66 test parser.
- Tệp dự án mẫu: `test/fixtures/*.rpp`; tệp bên thứ ba không được commit (`test/fixtures/third-party/`).
- Preset kiểu nốt: `presets/note-style/` (flat, neon, outline, rainbow-pitch, soft-bars).
- `assets/backgrounds/`, `assets/fonts/`: hiện trống.
- Ảnh thử hướng giao diện trong `UI-DIRECTION.md` mục 4 là **ảnh AI minh hoạ**, có lỗi do mô hình sinh; không phải giao diện hiện có, không được dùng làm ảnh chụp sản phẩm.
- **Chưa có:** logo, ảnh chụp sản phẩm, video demo, lời chứng thực, người dùng hay số liệu sử dụng. Không được bịa. KPI gắn **[PROVISIONAL]** chưa phải số đo, và KPI-02 chỉ đạt trên desktop (di động lệch −42,67 ms).

## Product Principles

1. **Quyền chỉnh của trình dựng thật, mặc định đơn giản (D-54).** Mặc định, chế độ Cơ bản và lần mở đầu phục vụ beatmaker: kéo vào, preset mẫu dùng ngay, kéo thả widget, xuất; một phút tới video đầu tiên. Toàn bộ quyền chỉnh (xoay, biến đổi, keyframe, biểu thức, timeline) mở dần qua "Thêm tuỳ chọn", Nâng cao và thẻ Editor, không chắn đường.
2. **Hiểu dự án, không đoán.** Dữ liệu lấy từ tệp DAW; khi thiếu (tempo, nốt, định dạng chưa hỗ trợ) thì nói rõ và để người dùng sửa, không che bằng giá trị ngầm.
3. **Xem trước là bản xuất.** Mọi thứ thấy trên canvas phải ra đúng như vậy trong video; giao diện ứng dụng và khung hình video là hai thế giới tách biệt: theme app không đổi khung video, preset video không đổi theme app.
4. **Máy của người dùng, dữ liệu của người dùng.** Không server, không telemetry, không chạy mã người dùng.
5. **Cộng đồng mở rộng bằng tệp.** Ngôn ngữ, preset, theme, schema parser được thêm bằng JSON và pull request, không phải sửa mã.

## Accessibility & Inclusion

- Cả theme sáng và tối đạt tương phản WCAG AA cho chữ và điều khiển (REQ-UI-10).
- Điều hướng bàn phím đầy đủ, vai trò ARIA đúng cho danh sách track (REQ-UI-14); mọi điều khiển kéo có ô nhập thay thế (D-49).
- Trợ năng nằm trong mốc cứng hoá M5; không có chuẩn nào cao hơn AA được cam kết.
- Bố cục và font phải chịu được chuỗi dịch dài và chữ không phải Latin (font cho CJK/Ả Rập/Thái/Devanagari trong video còn mở, OI-13).
