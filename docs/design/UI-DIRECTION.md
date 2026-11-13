# Định hướng hình ảnh: khung preview và giao diện web

| Phiên bản | Ngày | Nội dung |
| :--- | :--- | :--- |
| v0.1 | 2026-11-13 | Chốt hướng khung preview theo ảnh tham chiếu "usagin" (D-51). Chẩn đoán vì sao giao diện web hiện trông "AI slop". Bộ prompt sinh ảnh để thử các hướng giao diện web; **chưa chọn hướng web**. |
| v0.2 | 2026-11-13 | Ghi kết quả vòng 1 (ChatGPT 4 khung, Gemini Swiss sáng). Chốt khung bố cục: ba thẻ Preview / Editor / Settings, cách sắp Cơ bản/Nâng cao theo REQ-UI-13 (mục 3.7). Bộ prompt vòng 2 cho 6 phong cách, dùng kèm tệp đính kèm, mỗi phong cách có cả theme sáng và tối (mục 3.8). |
| v0.3 | 2026-11-13 | Ghi kết quả vòng 2 (6 phong cách × 4 khung, Gemini; bảng preset của ChatGPT). Chốt: theme giao diện **chỉ đổi màu** qua bộ token cố định (D-52, mục 5). Hệ quả: 6 phong cách gộp thành **một cấu trúc + nhiều bảng màu**; đề xuất cấu trúc và vòng 3 (mục 5.3, 6). |
| v0.4 | 2026-11-13 | **Chốt cấu trúc giao diện web D + A + E** (D-53, mục 5.3) và bảng màu dựng sẵn (mục 5.4). Ghi nguyên tắc sản phẩm "sức mạnh của trình dựng thật, mặc định đơn giản" (D-54, mục 7): xoay tự do mọi widget từ 1.0, spectrum đổi hướng cột. |

Tài liệu này có hai phần tách bạch:

- **Khung preview** (video người dùng xuất ra, vẽ bằng Render Core): **đã chốt hướng** ở mục 1.
- **Giao diện web** (thanh trên, bảng chỉnh, danh sách track bao quanh preview): **đang thử**. Mục 3 là bộ prompt; mục 4 là nhật ký thử và chỗ ghi hướng được chọn.

Hai phần không được lẫn vào nhau: theme web (REQ-UI-10) không đổi khung video, và preset khung video không đổi theme web.

---

## 1. Khung preview: hướng "Bản in" 🟡 đã chốt hướng, chưa làm (D-51)

### 1.1 Tham chiếu
Ảnh tham chiếu: khung 1:1 (1080×1080) nền trắng của kênh Usagin, bài "The Last Dice". Chỉ lấy **ngôn ngữ trình bày** (bố cục, cách dùng màu, kiểu chữ); không dùng tên kênh, tên bài hay logo của họ trong preset mặc định. Tên preset: **"Bản in" / "Paper"**.

Tinh thần: giống một trang bản nhạc in, không phải màn hình game. Nền trắng, nốt là những thanh xám phẳng không phát sáng, **một màu nhấn duy nhất là vạch phát đỏ mảnh**, mọi thông tin phụ là chữ xám nhỏ đặt ở bốn góc. Khoảng trắng lớn là chủ ý.

### 1.2 Phân rã thành widget
Toạ độ ước lượng từ ảnh tham chiếu, đơn vị pt trên khung 1080×1080 (REQ-GRAPHICS-00). Đây là giá trị khởi đầu cho preset, sẽ chỉnh bằng mắt khi dựng.

| Thành phần trên ảnh | Widget | Yêu cầu | Giá trị khởi đầu | Còn thiếu so với SRS / mã hiện có |
| :--- | :--- | :--- | :--- | :--- |
| Nền trắng | Canvas | REQ-GRAPHICS-00 | `#FFFFFF` | Không |
| Nốt đã phát xám đậm, nốt sắp tới xám nhạt, không glow | Piano Roll | REQ-WIDGET-01, REQ-GRAPHICS-07 | x 80, y 150, w 690, h 770; nốt đã phát `#383838`, sắp tới `#C4C4C4`, cao ≈ 11 pt, bo 1 pt, glow 0; không bàn phím | **Màu theo trạng thái nốt** (đã phát / đang phát / sắp tới) là ba màu riêng. Hiện chỉ có `opacity` và `inactiveOpacity` (hai mức độ đục cùng một màu). Cần thêm vào `NoteStyle` hoặc dùng template nốt bốn pha (REQ-GRAPHICS-10). |
| Nốt sắp tới chỉ hiện một đoạn ngắn trước vạch | Piano Roll | REQ-WIDGET-01 | `playheadPositionRatio` ≈ 0,84; `lookaheadSeconds` 1 | Không; làm được bằng khung widget hẹp hơn khung hình. |
| Vạch phát đỏ mảnh | Piano Roll | REQ-GRAPHICS-16 | `#E06666`, 1,5 pt, không glow, vẽ trên nốt | Không |
| "The Last Dice" + "Usagin" | Track Info | REQ-WIDGET-02 | tiêu đề 72 pt, nghệ sĩ 28 pt, đen, căn trái tại (75, 40) | Widget chưa có renderer (⚪); Render Core chưa có primitive chữ (TECHNICAL-DESIGN 5.1). |
| "Num played notes: 1271/1917 (66.30%)" và dòng events | Event Counter | REQ-WIDGET-03 | xám `#777`, 22 pt, căn phải tại x 1008 | **Mẫu nhãn tự sửa** (`Num played notes: {played}/{total} ({pct})`, 2 chữ số thập phân). SRS mới có bật/tắt trường. |
| "Note: E3 (Vel: 82) Note: E4 … < Track 1" | Live Note Trigger | REQ-WIDGET-04 | xám `#888`, 15 pt, một dòng, căn phải | **Kiểu một dòng ngang** và hậu tố tên track. SRS mô tả danh sách dọc. |
| "time 001 35 083" / "beat 037 06 093" + hai vạch nhỏ | Time & Bar Counter | REQ-WIDGET-05 | 18 pt, nhãn chú thích 11 pt phía trên-phải, góc dưới trái | **Định dạng chia nhóm có số 0 đứng đầu** và **thanh nhỏ tiến độ trong beat/bar**. SRS mới có `mm:ss.sss` và `1.1.000`. |
| "E7/G#" + "Notes: G#2 E3 D4 E4 G#4 B4" | Chord Detection | REQ-WIDGET-06 | tên hợp âm 34 pt đen, danh sách nốt 17 pt, căn phải góc dưới | **Luôn hiện danh sách nốt kèm tên hợp âm**. SRS chỉ hiện danh sách nốt khi không nhận diện được. |
| Thanh xám dưới cùng + "1:35 / 2:34" nhỏ | Progress Bar | REQ-WIDGET-08 | y 1048, cao 12 pt, phần đã qua `#CCCCCC`, không vẽ nền rãnh; chữ 7 pt `#BBB` | Không (SRS đã có màu nền/tiến độ và thời gian). |
| Phông chữ | Mọi widget chữ | REQ-WIDGET-02, TECHNICAL-DESIGN 5.5 | Tiêu đề và hợp âm: grotesk hình học (Space Grotesk, OFL); chữ phụ: grotesk trung tính | Phông phải tự host và `FontFace.load()` xong trước khung đầu (5.5). |

### 1.3 Biến thể tỉ lệ khung
Preset "Bản in" cần cả 16:9 và 9:16 (REQ-GRAPHICS-04). Nguyên tắc giữ khi đổi tỉ lệ: thông tin phụ luôn bám bốn góc, vùng nốt chiếm khoảng 65% bề rộng ở 16:9 và giữ khoảng trắng phía sau vạch phát. Chưa có ảnh tham chiếu cho hai tỉ lệ này; có thể sinh thử bằng prompt ở mục 3.5.

### 1.4 Thứ tự làm đề xuất
1. Primitive chữ trong `drawPrimitives` (kèm nạp phông) vì 5/6 widget còn lại cần nó.
2. Màu nốt theo trạng thái (đã phát / đang phát / sắp tới).
3. Track Info, Event Counter, Chord Detection, Progress Bar, Time & Bar Counter, Live Note Trigger.
4. Preset "Bản in" 1:1, rồi 16:9 và 9:16.

Các mục "Còn thiếu" ở bảng 1.2 cần đưa vào SRS (REQ-WIDGET-03…06, REQ-GRAPHICS-07) khi bắt đầu làm; chưa sửa SRS trong phiên bản này.

---

## 2. Giao diện web: vì sao đang trông "AI slop"

Sau đợt chỉnh 2026-11-12, giao diện đã gọn và đồng bộ hơn, nhưng vẫn là **mẫu mặc định của dashboard do AI sinh**: nền xanh đen, màu nhấn xanh dương điện tử, thẻ bo góc có bóng xếp lưới đều, nút viên thuốc, phông Inter, phát sáng. Không có gì sai, nhưng cũng **không có quyết định nào mang tính riêng**, nên mắt nhận ra ngay "mẫu chung".

Điểm chung của các ảnh tham chiếu ưng ý (hai ảnh từ impeccable: Verex, Alphabet Storm):

| Đặc điểm | Ở tham chiếu | Ở giao diện hiện tại |
| :--- | :--- | :--- |
| Giọng chữ | Một phông display rất mạnh (cao hẹp in hoa, hoặc grotesk siêu đậm) + nhãn nhỏ in hoa giãn chữ hoặc mono | Một phông Inter cho mọi thứ |
| Màu | Đơn sắc + đúng một màu nhấn có ý nghĩa (đồng, đen mực) | Xanh dương cho mọi thứ tương tác |
| Phân vùng | Đường kẻ mảnh 1 px, cột, đánh số mục 01–05 | Thẻ nổi có bóng |
| Nhân vật chính | Nội dung (áo choàng, chữ thành bão) chiếm phần lớn khung | Preview chỉ là một ô trong lưới |
| Trang trí | Có nghĩa: số liệu kỹ thuật, chú thích, đường dẫn chỉ | Phát sáng, bo góc, không mang thông tin |

Hai ảnh sinh bằng Gemini có ý hay (đồng trên đen; bản sáng kiểu "field notes"; đặt dải thông tin dưới sân khấu) nhưng **quá nhiều hộp và nhãn `[IN HOA TRONG NGOẶC]`**, chữ bị méo, nên chỉ dùng để lấy màu và bố cục, không chép nguyên.

**Hệ quả cho prompt:** mỗi hướng phải nêu rõ (1) một phông display, (2) đúng một màu nhấn, (3) cách phân vùng không dùng thẻ bóng đổ, (4) preview "Bản in" trắng là nhân vật chính.

---

## 3. Bộ prompt sinh ảnh giao diện web

### 3.1 Cách dùng
- Prompt viết **tiếng Anh** vì các mô hình sinh ảnh hiểu và viết chữ tiếng Anh tốt hơn hẳn.
- Mỗi lần: dán **khối chung (3.2)** + **một hướng (3.3)** + **khối tránh (3.4)**. Sinh 2–4 ảnh mỗi hướng.
- Nên thử cùng prompt trên ít nhất hai công cụ (ví dụ Gemini và một công cụ khác) vì mỗi mô hình có "gu" riêng.
- Chữ trên ảnh sinh hay bị méo; đánh giá **bố cục, màu, nhịp, phông**, không đánh giá nội dung chữ.
- Ghi lại ảnh đã thử ở mục 4 (hoặc gửi ảnh, mình ghi).

### 3.2 Khối chung (luôn dán)
```text
High-fidelity UI design screenshot of a desktop web app, 16:9, 1440x900 viewport, flat front view, no device frame, no perspective, no hands, crisp and legible small text, realistic production UI that could be built with HTML and CSS.

Product: "DAW Visualizer", a tool that turns a music project file into a piano-roll video.

Layout and content (keep these exact labels, keep text minimal):
- Slim top bar: wordmark "DAW Visualizer", file name "night-train.als", a "Basic | Advanced" switch, button "Open file", primary button "Export video", language "EN".
- The hero: a large square video preview occupying most of the left two thirds. Inside the preview, a minimalist white paper frame: large black title "Night Train", small artist line "Demo Artist" under it, flat dark-grey horizontal note bars on the left half, a few light-grey upcoming notes, one thin red vertical playhead line, tiny grey counters at top right "Played notes 1271/1917 (66.30%)", chord name "E7/G#" at bottom right, time "01 35 083" at bottom left, a thin grey progress line along the bottom edge. No glow inside the preview.
- Directly under the preview: transport row with a play button, "1:35 / 2:34", and a scrub line.
- Right column inspector titled "Note style": preset options "Paper", "Neon", "Flat", "Outline", then six labelled sliders each with a small numeric field (Opacity, Upcoming opacity, Note height, Corner radius, Glow, Outline).
- Below the inspector or below the preview: a compact list of 6 tracks ("Pad Chords", "Sub Bass", "Lead Melody", "Arpeggiator", "Bells", "Drums"), each row with a colour swatch, visibility eye toggle, solo "S" toggle and note count.
```

### 3.3 Các hướng (chọn một, dán sau khối chung)

**A. Bản in Thuỵ Sĩ** (Swiss / International Typographic Style; hợp với preview nhất)
```text
Visual direction: Swiss International Typographic Style. Off-white paper background #F4F3EF, black ink text, exactly one accent colour: signal red #E5322D, used only for the playhead, the primary button and the active state. Typography: a neo-grotesk display face (like Neue Haas Grotesk or Space Grotesk) set large and tight for section headings, small uppercase labels with wide letter-spacing for metadata. Strict 12-column grid, generous margins, alignment to a visible baseline. Regions separated by 1px black hairline rules, not by cards or shadows. Sections numbered 01, 02, 03 in small type. The square preview sits on the page like a printed plate with a short caption beneath it. Calm, precise, editorial.
```

**B. Sổ đo hiện trường / Risograph**
```text
Visual direction: field-notes notebook meets risograph print. Warm paper background #ECE8DE with a very faint graph-paper grid. Text in a monospaced typewriter face (like IBM Plex Mono) for labels and values, with one condensed sans for headings. Exactly one riso ink accent: fluorescent pink #FF48B0 (or riso blue #0078BF), used only for active states, the playhead and the primary button; slight misregistration only on the large heading. Inspector looks like a lab form: underlined input fields, small checkbox squares, hand-numbered rows. Hairline dividers, no shadows, no rounded cards. Tactile but clean.
```

**C. Obsidian và đồng** (lấy từ tham chiếu Verex; theme tối)
```text
Visual direction: luxury technical, dark. Near-black background #0E0D0C with subtle warm undertone, warm brass accent #B8955A used for hairline rules, thin annotation arcs, numbered navigation and the primary button outline. Typography: a tall condensed display face in uppercase with wide tracking for headings, small wide-tracked uppercase labels for metadata, values in a refined monospace. A vertical numbered navigation at the far left (01 Preview, 02 Style, 03 Tracks, 04 Export) with a thin brass line and a dot on the active item. The white square preview is presented like a lit museum print on a black wall, with fine brass leader lines labelling "Title", "Playhead" and "Chord". No glow, no gradients, no glass.
```

**D. Phần cứng studio** (Dieter Rams / thiết bị âm thanh hiện đại)
```text
Visual direction: modern audio hardware, Dieter Rams influence. Light warm grey panels #E4E3DF on a slightly darker body #D6D5D0, black text, exactly one accent: signal orange #FF5A1F for the play button, active toggles and the playhead. Small monospaced labels printed above controls like silkscreen on a device, module numbers (M1, M2, M3) in corners. Sliders look like flat hardware faders with tick marks, toggles are small square buttons with a tiny LED dot. Flat surfaces, crisp 1px dividers, no skeuomorphic textures, no shadows except a very subtle 1px inset. Dense but very orderly.
```

**E. Phòng tối / bản in thử**
```text
Visual direction: darkroom and print proof. Charcoal shell #1A1A1A, mid-grey panels #232323, text in light grey. The white square preview is shown as a print proof: thin crop marks at its corners, small registration marks, a strip of grey-scale swatches beside it, and technical metadata in tiny monospace along its margins ("1080 x 1080 · 30 fps · 00:01:35.083 · Paper"). Exactly one accent: amber safelight #D9822B for the primary button and active states. Inspector is monochrome with hairline dividers and right-aligned tabular numbers. No glow, no cards with shadows.
```

**F. Tạp chí chữ** (lấy từ tham chiếu Alphabet Storm)
```text
Visual direction: bold typographic editorial, monochrome. Pure white background, black text. One huge, extra-bold condensed grotesk heading set across the top-left ("NIGHT TRAIN" or the app name), very tight leading. Asymmetric editorial layout: preview large on the right, a narrow left rail with small navigation and live stats. A bottom band split into four modules by thin vertical rules: "Tracks", "Chord", "Style", "Export", each with a small uppercase label, one key figure and an arrow link. Primary button solid black, secondary button outlined black. No colour except the red playhead inside the preview.
```

### 3.4 Khối tránh (luôn dán cuối)
```text
Avoid: generic SaaS dashboard look, navy background with electric-blue accents, purple or blue gradients, glassmorphism, neon glow, drop-shadowed rounded cards everywhere, pill-shaped chips everywhere, emoji, stock 3D illustrations, fake charts, lorem ipsum, labels wrapped in [BRACKETS], more than one accent colour, cassette tapes or other decorative props, text that is garbled or nonsense.
```

### 3.5 Prompt phụ

**Cặp sáng/tối cho hướng đã ưng** (REQ-UI-10 bắt buộc có cả hai theme):
```text
Show the same desktop web app screen twice side by side, left in a light theme and right in a dark theme, identical layout and content. Keep the same single accent colour in both themes. The square white "paper" video preview stays white in both themes, because it is the video output, not part of the app theme. [paste the shared block and the chosen direction here]
```

**Biến thể khung preview "Bản in" ở tỉ lệ khác:**
```text
A single video frame, flat, no UI around it, 1920x1080 (then try 1080x1920). Minimalist white "paper" piano-roll music visualization: white background, large black geometric-grotesk title "Night Train" with a smaller artist line "Demo Artist" at top left; flat dark-grey horizontal note bars for notes already played, light-grey bars for the few upcoming notes; one thin red vertical playhead line; tiny grey counters at top right "Played notes 1271/1917 (66.30%)"; a large chord name "E7/G#" with a small line "Notes: G#2 E3 D4 E4 G#4 B4" at bottom right; time counters "01 35 083" and "037 06 093" with tiny captions at bottom left; a thin light-grey progress bar along the bottom. Lots of white space. No glow, no gradients, no shadows, no grid lines.
```

### 3.6 Tiêu chí chọn
Một hướng được chọn khi đạt được hết:

1. Preview trắng vẫn là thứ nổi nhất màn hình, giao diện không tranh chỗ.
2. Có bản sáng và tối đều đẹp (REQ-UI-10), cùng một màu nhấn.
3. Đọc được nhãn 12–13 px ở bảng chỉnh; số liệu căn phải, chữ số đều (tabular).
4. Vẫn đứng được khi có 15+ track và khi bảng chỉnh ở chế độ Nâng cao dài gấp ba (REQ-UI-13, REQ-UI-14).
5. Dựng được bằng CSS và SVG; không cần ảnh texture nặng, không cần phông thương mại (phải có phông OFL tương đương để tự host).
6. Đúng một màu nhấn; trang trí mang thông tin.

### 3.7 Khung bố cục chung (từ vòng 1, dùng cho vòng 2)
Ảnh 4 khung của ChatGPT cho bố cục ưng ý nhất; giữ lại làm **khung chung**, chỉ đổi phong cách:

- **Thanh trên:** biểu tượng + "DAW Visualizer"; ba thẻ **Preview / Editor / Settings**; bên phải: công tắc **Basic | Advanced**, nút "Open file", nút chính "Export video", nút đổi theme sáng/tối, "EN".
- **Cột trái hẹp:** danh sách preset (Paper đang chọn, Dark, Minimal, Neon, Calm).
- **Giữa:** sân khấu preview (khung video), dưới là thanh phát: lùi, phát, tới, thanh tua có sóng âm mờ, "1:35 / 2:34".
- **Cột phải:** bảng chỉnh (inspector).

**Cơ bản / Nâng cao: theo REQ-UI-13, gộp cả ba ý đã bàn:**

1. **Công tắc ở thanh trên** đổi cả giao diện giữa hai chế độ (REQ-UI-13 đã quy định).
2. **Ở thẻ Preview, Nâng cao mở rộng ngay tại chỗ:** cùng bố cục, inspector có thêm mục và thêm dòng (mỗi mục đánh số, gập/mở được, cuộn riêng). Ở Cơ bản, mỗi mục có nút "More options" để mở phần nâng cao của riêng mục đó mà không đổi cả giao diện (REQ-UI-13 "Mở từng bảng").
3. **Thẻ Editor** là chỗ của những thứ quá nhiều để nhét vào inspector: chỉnh bố cục widget trên khung (khung chọn, đường gióng), danh sách lớp, thuộc tính widget, timeline có làn track, làn hợp âm và keyframe. Ở Cơ bản, Editor chỉ còn kéo thả widget và chọn preset bố cục (đúng bảng phân bổ REQ-UI-13: "Widget và bố cục", "Hiệu ứng và storyboard").

**Settings** chứa theme, ngôn ngữ, chế độ mặc định, mặc định xuất; không cần sinh ảnh ở vòng 2.

Đây là đề xuất cho vòng 2; chốt khi chọn được phong cách.

### 3.8 Prompt vòng 2 (dùng kèm tệp đính kèm)

**Đính kèm mỗi lần:**
1. `UI-DIRECTION.md` (tài liệu này).
2. Ảnh bố cục 4 khung (`good_layout_including_preview_editor_and_settings.png`).
3. Ảnh khung preview tham chiếu (`usagin.jpg`).
4. Tuỳ phong cách, thêm **một** ảnh gợi cảm hứng: Verex cho C, Alphabet Storm cho F, ảnh Gemini Swiss sáng cho A.

**Dán:** khối chung vòng 2 rồi đến khối của một phong cách. Mỗi lần ra một **tờ 2×2**. Nếu chữ quá nhỏ, dùng prompt "từng khung" ở cuối mục để sinh riêng từng khung.

**Khối chung vòng 2:**
```text
Attached: (1) UI-DIRECTION.md, the product and design brief; (2) a 4-panel layout reference; (3) "usagin.jpg", the reference for what the video preview frame looks like; (4) optionally one mood image.

Use attachment (2) ONLY for layout and structure. Use the mood image ONLY for colour, type and atmosphere. Do NOT copy any text, logo, photo, illustration, headline or product from any attachment (no "Words Shape Weather", no birds, no cloak, no "One pull total form", no mountain photo, no "Usagin" logo, no "Precision Acoustic Laboratory"). No operating-system window buttons: this is a web app in a browser tab.

Make ONE image: a 2x2 sheet of four high-fidelity desktop screens of the web app "DAW Visualizer", each panel 16:10, flat front view, small text crisp and legible, consistent design system across all four panels, thin gutter between panels, small caption above each panel exactly as written below.

Shared layout of every screen:
- Top bar: small logo mark and wordmark "DAW Visualizer"; three tabs "PREVIEW", "EDITOR", "SETTINGS"; on the right a segmented switch "Basic | Advanced", a button "Open file", a primary button "Export video", a sun/moon theme toggle, "EN".
- Narrow left rail: "Presets" list: "Paper" (selected), "Dark", "Minimal", "Neon", "Calm".
- Centre: the video preview stage. The preview shows the "Paper" preset exactly like attachment (3): white background, large black title "Night Train", small artist line "Demo Artist", flat dark-grey bars for notes already played, light-grey bars for the few upcoming notes, one thin red vertical playhead, tiny grey counter "1271 / 1917 (66.30%)" at top right, chord "E7/G#" with "G#2 E3 D4 E4 G#4 B4" at bottom right, time "01 35 083" and "037 06 093" at bottom left, thin grey progress bar at the bottom. No piano keyboard, no glow, no grid inside the preview. The preview stays white in BOTH app themes because it is the video output, not part of the app theme.
- Under the stage: transport with previous, play, next buttons, a scrub line with a faint waveform, "1:35 / 2:34".
- Right column: inspector.

Panel 1, caption "PREVIEW · BASIC · LIGHT": light app theme. Inspector shows three short numbered sections: "01 Song" (Title and Artist text fields), "02 Look" (Note height, Opacity, Playhead colour swatch), "03 Tracks" (6 compact rows: Pad Chords, Sub Bass, Lead Melody, Arpeggiator, Bells, Drums; each with colour swatch, eye toggle, "S" solo toggle, note count). Each section header has a small "More options" link.

Panel 2, caption "PREVIEW · BASIC · DARK": identical content to panel 1 in the dark app theme.

Panel 3, caption "PREVIEW · ADVANCED · LIGHT": same layout; the switch shows Advanced; the inspector is expanded in place and scrolls: "01 Note style" with every slider paired with a numeric field (Opacity, Upcoming opacity, Played colour, Upcoming colour, Note height, Corner radius, Glow, Outline) and a segmented control "Glow: Even | Dynamic on hit"; "02 Playhead" (Position %, Width, Colour); "03 Range" (Pitch range "Fit | Custom" with "C2 – C6", Lookahead "3.0 s"); "04 Tracks" with a "Base brightness" dropdown per row. Advanced-only rows carry a tiny "ADV" tag.

Panel 4, caption "EDITOR · ADVANCED · DARK": the editor workspace. Centre: the same white preview frame with a selected widget (the title) showing a bounding box, resize handles and one dashed orange alignment guide. Left: "Layers" list (Title, Counter, Piano roll, Chord, Time, Progress bar) each with eye and lock icons. Right: "Properties" for the selected widget (X, Y, W, H, Font, Size, Colour, Align). Bottom: a timeline with a time ruler, one lane per track with small note blocks, a "Chords" lane with chord names, a playhead and a few keyframe diamonds.

Avoid: generic SaaS dashboard look, navy background with electric-blue accents, purple gradients, glassmorphism, neon glow, drop-shadowed rounded cards everywhere, emoji, stock illustrations, fake charts, lorem ipsum, labels in [BRACKETS], more than one accent colour, garbled or nonsense text, any instruction text from this prompt rendered as a caption.
```

**A. Bản in Thuỵ Sĩ** (đính kèm thêm ảnh Gemini Swiss sáng)
```text
Style: Swiss International Typographic Style.
Light theme: off-white paper #F4F3EF, black ink #111111, hairline rules #111111 at 1px.
Dark theme: near-black #121212, warm white text #EDEDE8, hairline rules #3A3A3A.
One accent in both themes: signal red #E5322D, only for the primary button, the active tab underline, the selected preset marker and the playhead.
Type: a neo-grotesk (like Neue Haas Grotesk or Inter Display) set large and tight for the wordmark and section numbers; small uppercase labels with wide letter-spacing; tabular numbers right-aligned.
Structure: strict grid, regions separated by 1px rules, no cards, no shadows, square corners. Section numbers 01, 02, 03 set in the margin.
```

**B. Sổ đo hiện trường / Risograph**
```text
Style: field-notes notebook meets risograph print.
Light theme: warm paper #ECE8DE with a very faint graph-paper grid, ink #1D1D1B.
Dark theme: blue-black paper #15171C with a faint lighter grid, text #E8E4DA.
One accent in both themes: fluorescent riso pink #FF48B0, only for active states, the primary button and the playhead.
Type: monospaced typewriter face (like IBM Plex Mono) for labels and values; one condensed sans for the wordmark and section titles.
Structure: inspector looks like a lab form: underlined fields, small square checkboxes, numbered rows. Hairline dividers, no shadows, no rounded cards.
```

**C. Obsidian và đồng** (đính kèm thêm ảnh Verex)
```text
Style: luxury technical, from the attached mood image's colour and type only.
Dark theme: near-black #0E0D0C with warm undertone, text #E9E4D8, brass #B8955A for hairlines, thin annotation lines, the active tab underline, the selected preset dot and the primary button outline.
Light theme: bone #F2EEE6, ink #1A1814, deeper brass #8C6A35 for the same roles.
Type: tall condensed uppercase display with wide tracking for the wordmark and section titles; small wide-tracked uppercase labels; values in a refined monospace.
Structure: thin brass vertical line in the left rail with a dot on the selected preset; fine leader lines are allowed only in the preview stage margins. No glow, no gradients, no glass.
```

**D. Phần cứng studio**
```text
Style: modern audio hardware, Dieter Rams influence.
Light theme: warm light-grey panels #E4E3DF on a body #D6D5D0, black text.
Dark theme: graphite panels #1E1F21 on a body #151617, text #E6E6E3.
One accent in both themes: signal orange #FF5A1F for the play button, active toggles, the primary button and the playhead.
Type: small monospaced labels printed above controls like silkscreen; module numbers M1, M2, M3 in panel corners; a clean grotesk for the wordmark.
Structure: sliders drawn as flat hardware faders with tick marks; toggles are small square buttons with a tiny LED dot; crisp 1px dividers; no skeuomorphic textures; at most a very subtle 1px inset.
```

**E. Phòng tối / bản in thử**
```text
Style: darkroom and print proof.
Dark theme: charcoal shell #1A1A1A, panels #232323, text #D8D8D4.
Light theme: lightbox white #F5F5F3, panels #EBEBE8, text #1C1C1C.
One accent: amber safelight #D9822B in dark, deeper amber #B5651D in light; only for the primary button, active states and the playhead.
The preview stage is presented as a print proof in both themes: thin crop marks at the corners of the white frame, small registration marks, a strip of grey swatches beside it, tiny monospace metadata along its margins ("1080 x 1080 · 30 fps · 00:01:35.083 · Paper").
Inspector is monochrome with hairline dividers and right-aligned tabular numbers. No glow, no shadowed cards.
```

**F. Tạp chí chữ** (đính kèm thêm ảnh Alphabet Storm)
```text
Style: bold typographic editorial, monochrome, using the mood image only for type and layout feel.
Light theme: pure white #FFFFFF, black text #0A0A0A.
Dark theme: black #0A0A0A, white text #F2F2F2.
No accent colour in the app chrome at all; the only colour on screen is the red playhead inside the preview.
Type: an extra-bold condensed grotesk for the wordmark and for one large section word per screen ("PREVIEW" or "EDITOR") set very large and tight in the top-left of the work area; small uppercase labels; tabular numbers.
Structure: asymmetric editorial layout, thin vertical rules between columns, primary button solid (black in light, white in dark), secondary buttons outlined.
```

**Từng khung** (khi tờ 2×2 có chữ quá nhỏ; dán thay cho phần "Make ONE image … Panel 4" của khối chung):
```text
Make ONE image of a single desktop screen, 16:10, 1440x900, flat front view. Render only this panel: [paste the panel description, e.g. Panel 3 "PREVIEW · ADVANCED · LIGHT"]. Keep all shared layout rules, the style block and the avoid list.
```

**Sửa lỗi lọt nội dung ảnh cũ** (gửi tiếp trong cùng cuộc trò chuyện):
```text
Regenerate panel [N] only. The preview stage must contain only the white "Paper" piano-roll frame described in the brief. Remove every element copied from the reference images (large headlines, birds, particles, photos, cloaks, logos). Keep everything else identical.
```

---

## 4. Nhật ký thử và hướng được chọn

| Ngày | Hướng | Công cụ | Ảnh / ghi chú | Đánh giá theo 3.6 |
| :--- | :--- | :--- | :--- | :--- |
| 2026-11-13 | (tham chiếu) Verex, Alphabet Storm | impeccable | Giọng chữ mạnh, một màu nhấn, kẻ mảnh | Nguồn cho hướng C và F |
| 2026-11-13 | (tham chiếu) Obsidian & Brass / Field-Notes | Gemini | Màu tốt, quá nhiều hộp và nhãn ngoặc, chữ méo | Lấy màu và dải thông tin dưới sân khấu |
| 2026-11-13 | Vòng 1: tờ 4 khung (Obsidian, AS sáng, đồng, đen trắng) | ChatGPT | **Bố cục tốt nhất**: ba thẻ Preview/Editor/Settings, cột preset trái, cột thông tin phải, thanh phát dưới. Theme tối đẹp. Bản sáng (AS) bị **lọt nội dung ảnh tham chiếu** (chữ "WORDS SHAPE WEATHER", chim) vào sân khấu. Preview vẽ kiểu tối có bàn phím, không đúng "Bản in". Có nút cửa sổ hệ điều hành dù là web app. | Đạt 1, 3 (tối), 6; trượt 2 (sáng hỏng). Lấy làm **khung bố cục chung** (3.7). |
| 2026-11-13 | Vòng 1: A. Bản in Thuỵ Sĩ, sáng | Gemini | Preview đúng tinh thần "Bản in", kẻ mảnh, đánh số mục, đỏ đúng chỗ. Chỉ một theme, không có phần Nâng cao. **Lọt chữ của prompt** thành chú thích ("The square preview like a printed plate…"), chữ méo ("Contiemparent"). | Đạt 1, 5, 6; chưa kiểm 2, 4. Giữ làm ảnh gợi cảm hứng cho hướng A. |
| 2026-11-13 | Vòng 2: A. Bản in Thuỵ Sĩ | Gemini | Gọn, đỏ đúng vai trò, số đi kèm thanh trượt. Nốt trong preview bị đơn giản hoá thành vài thanh dài (không giống "Bản in"). | Đạt 1, 2, 3, 6. Ứng viên cấu trúc. |
| 2026-11-13 | Vòng 2: B. Risograph | Gemini | Lưới giấy và hồng nổi bật. Ở theme tối **preview bị đảo thành nền tối** (sai quy tắc preview luôn trắng). Phông mono khó đọc ở bảng dài; chữ số lỗi nhiều. | Trượt 1 (tối), 3. Giữ **bảng màu hồng**, bỏ phông mono. |
| 2026-11-13 | Vòng 2: C. Obsidian và đồng | Gemini | Bản tối đẹp nhất, bản sáng màu xương ấm dễ chịu. Phông cao hẹp làm nhãn nhỏ hơi khó đọc. | Đạt 1, 2, 6. Giữ **bảng màu đồng** (sáng + tối). |
| 2026-11-13 | Vòng 2: D. Phần cứng studio | Gemini | Tên file ngay trên thanh trên, thẻ ở hàng riêng, tay nắm kéo thả ở dòng track, thanh tua có sóng âm và thời gian kiểu nhạc tô cam. Mật độ tốt nhất. | Đạt 1–6. **Ứng viên cấu trúc mạnh nhất.** |
| 2026-11-13 | Vòng 2: E. Phòng tối / bản in thử | Gemini | Dấu cắt, dải xám, chữ kỹ thuật dọc mép làm preview thành "bản in thử", rất hợp D-51. Chữ "lùi/tới" bị lọt thành nhãn nút. | Đạt 1, 2, 6. Giữ **cách đóng khung sân khấu** (làm nhẹ, bật/tắt được). |
| 2026-11-13 | Vòng 2: F. Tạp chí chữ | Gemini | Chữ "PREVIEW"/"EDITOR" khổng lồ tốn khoảng 20% bề rộng mà không mang thông tin; công tắc "Theme/Basic" gây nhầm. | Trượt 4. Không chọn. |
| 2026-11-13 | Vòng 2: thư viện 6 preset video | ChatGPT | Ý tưởng **duyệt preset bằng ảnh thu nhỏ** hay. Vẫn lọt nội dung ảnh tham chiếu (chim, núi), có nút cửa sổ hệ điều hành, và trộn lẫn theme app với preset video. | Giữ ý tưởng ảnh thu nhỏ cho cột Presets (mục 6). |

**Hướng web được chọn (2026-11-13):** cấu trúc **D + A + E** (D-53), chi tiết ở mục 5.3 và bảng màu ở mục 5.4. Ảnh tham chiếu: tờ 2×2 của vòng 2 hướng D và tờ 2×2 cam có dấu cắt quanh preview ở lượt thử kế tiếp (cùng ngày). Lưu ý: mọi ảnh là ảnh AI minh hoạ hướng nhìn, **không phải giao diện hiện có** và có lỗi do mô hình sinh (biểu tượng lặp, nhãn méo, số vô lý); khi làm thật theo tài liệu, không theo từng chi tiết ảnh. Khi chọn, ghi ở đây: hướng, ảnh tham chiếu, bảng token (màu sáng/tối, phông display/nhãn/số, bán kính, độ dày kẻ, khoảng cách), rồi thêm quyết định `D-xx` vào BRD.

---

## 5. Theme giao diện chỉ đổi màu (D-52)

### 5.1 Quyết định
Theme của **ứng dụng** (REQ-UI-10, theme cộng đồng ở 1.1) chỉ đổi **màu**, qua một bộ token cố định. Không đổi cỡ chữ, phông, khoảng cách, bo góc, bố cục hay từng component, và không nhận CSS tuỳ ý. Lý do:

- **An toàn:** CSS tuỳ ý ẩn hoặc giả được nút (che nút xuất thật, làm mờ cảnh báo), đi ngược NFR-SEC-05…07.
- **Tương phản:** mỗi theme được kiểm WCAG AA tự động trước khi áp.
- **Bền:** cập nhật giao diện không làm hỏng theme của người dùng; hướng dẫn và ảnh chụp tài liệu chỉ cần một bố cục.

**Phân biệt tên:** "Giao diện ứng dụng" (theme app, mục này) khác "Phong cách video" (preset `theme` của CUSTOMIZATION.md mục 6, ví dụ "Bản in"). Cột Presets ở thẻ Preview chỉ chứa phong cách video; theme app chọn ở Settings và nút sáng/tối trên thanh trên.

### 5.2 Bộ token (đề xuất, chốt khi làm)
Mỗi theme khai báo đủ token cho **cả sáng và tối**; thiếu token nào thì lấy của theme mặc định.

| Nhóm | Token |
| :--- | :--- |
| Nền và bề mặt | `bg`, `surface`, `surface-raised`, `line`, `line-strong` |
| Chữ | `text`, `text-muted`, `text-faint` |
| Nhấn | `accent`, `accent-text` (chữ trên nền nhấn), `focus`, `selection` |
| Trạng thái | `danger`, `warning`, `success` |
| Thanh phát và timeline | `scrub-played`, `scrub-rest`, `waveform`, `guide` (đường gióng, mặc định `#FF5500` theo REQ-GRAPHICS-02) |

Kiểm khi nạp theme: đúng schema (chỉ các token trên, giá trị là màu); `text`/`bg`, `text-muted`/`surface`, `accent-text`/`accent` đạt AA; `accent` khác đủ xa `danger` để nút xuất không bị đọc như cảnh báo. Không đạt thì từ chối kèm lý do, không áp một phần.

### 5.3 Cấu trúc giao diện: D + A + E (D-53, đã chốt 2026-11-13)
Vì theme chỉ đổi màu, 6 phong cách không phải 6 giao diện khác nhau mà là **một cấu trúc** (phông, khoảng cách, cách phân vùng, hình dạng điều khiển) **cộng nhiều bảng màu**. Cấu trúc đã chốt:

- **Cấu trúc:** lấy D (phần cứng studio) làm nền vì mật độ và trật tự tốt nhất, với cách kẻ mảnh, số mục 01–04 và số căn phải của A. Phông: một grotesk trung tính (Inter hoặc tương đương, OFL) cho chữ và nhãn; số dùng chữ số đều. Không dùng phông mono cho nhãn (B) và không dùng chữ khổng lồ (F).
- **Sân khấu:** cách đóng khung "bản in thử" của E (dấu cắt mảnh, thông số dọc mép), làm nhẹ và bật/tắt được.
- **Bảng màu dựng sẵn (theme app):** Studio cam (D, mặc định), Bản in đỏ (A), Đồng (C), Riso hồng (B). Mỗi bảng có sáng và tối (mục 5.4).

**Chi tiết cấu trúc (theo khung chung 3.7):**

| Vùng | Quy tắc |
| :--- | :--- |
| Thanh trên, hàng 1 | Biểu tượng + "DAW Visualizer", tên file đang mở; bên phải: `Basic | Advanced`, "Open file", nút chính "Export video" (màu nhấn), nút sáng/tối, ngôn ngữ |
| Thanh trên, hàng 2 | Thẻ **Preview / Editor / Settings**, thẻ đang mở gạch chân màu nhấn |
| Cột trái | "Video styles" (phong cách video, không gọi là theme); về sau có ảnh thu nhỏ (mục 6) |
| Sân khấu | Preview luôn trắng theo preset, kể cả theme tối. Khung "bản in thử" của E: dấu cắt ở góc, thông số kỹ thuật chạy dọc mép (kích thước, fps, thời điểm, tên phong cách), dải xám bên cạnh; mặc định bật, tắt được trong Settings |
| Thanh phát | Lùi / phát / tới (biểu tượng, không chữ), thanh tua có sóng âm mờ của file âm thanh nếu có, thời gian kiểu nhạc tô màu nhấn khi đang phát |
| Inspector | Mục đánh số `01 Song`, `02 Look`, `03 Tracks`…; "More options" ở đầu mục (REQ-UI-13); mọi thanh trượt có ô số căn phải (REQ-UI-15); dòng Nâng cao có nhãn nhỏ `ADV` |
| Dòng track | Tay nắm kéo đổi thứ tự, ô màu, mắt (ẩn/hiện), `S` (solo), số nốt căn phải. **Không** có khoá ở Preview; khoá chỉ ở danh sách lớp của Editor |
| Phân vùng | Kẻ mảnh 1 px (`line`), không thẻ có bóng; bo góc nhỏ đồng nhất cho ô nhập và nút |
| Chữ | Một grotesk trung tính tự host cho mọi chữ; chữ số đều (tabular); nhãn mục cỡ lớn hơn chữ thường một bậc, không dùng chữ khổng lồ |

### 5.4 Bảng màu dựng sẵn (giá trị khởi đầu)
Nền, bề mặt, kẻ và chữ **dùng chung** cho mọi bảng; mỗi bảng chỉ đổi nhóm nhấn. Giá trị là điểm khởi đầu: phải chạy kiểm tương phản AA (5.2) khi làm T-48 và chỉnh nếu trượt.

| Token | Sáng | Tối |
| :--- | :--- | :--- |
| `bg` | `#EDECE8` | `#151617` |
| `surface` | `#F6F5F2` | `#1E1F21` |
| `surface-raised` | `#FFFFFF` | `#26282B` |
| `line` | `#D6D4CE` | `#33363A` |
| `line-strong` | `#1C1C1A` | `#E6E6E3` |
| `text` | `#1C1C1A` | `#E6E6E3` |
| `text-muted` | `#5E5C57` | `#A3A3A0` |
| `text-faint` | `#8D8A84` | `#6E6F70` |

| Bảng màu | `accent` sáng (`accent-text` trắng) | `accent` tối (`accent-text` = `bg` tối) |
| :--- | :--- | :--- |
| Studio cam (mặc định) | `#C2410C` | `#FF6A2B` |
| Bản in đỏ | `#C8261E` | `#FF5A4F` |
| Đồng | `#8C6A35` | `#C9A467` |
| Riso hồng | `#C2307E` | `#FF5CB8` |

`danger` phải khác rõ `accent`: với bảng đỏ, `danger` dùng đỏ thẫm hơn kèm biểu tượng cảnh báo, để nút xuất không bị đọc như lỗi.

## 6. Việc tiếp theo đề xuất

1. **Vòng 3: các màn chưa có ảnh**, sinh bằng cấu trúc đã chọn: trạng thái rỗng (chưa mở file), hộp chọn Cơ bản/Nâng cao lần đầu (REQ-UI-13), cảnh báo khi nạp và hỏi file `.mid` thiếu (REQ-UI-07, 08), ô tempo khi file thiếu tempo (REQ-UI-06), hộp xuất video và tiến trình xuất (REQ-EXPORT-00), Settings → Giao diện (chọn bảng màu, xem trước tương phản).
2. **Cột Presets có ảnh thu nhỏ:** mỗi phong cách video hiện một khung nhỏ do chính Render Core vẽ từ dự án đang mở (ý từ bảng preset của ChatGPT), không dùng ảnh minh hoạ.
3. **Đặt tên trong giao diện:** thống nhất "Played / Upcoming" (đã phát / sắp tới) cho màu nốt; khoá (lock) chỉ có ở danh sách lớp của Editor, không có ở dòng track của Preview; mọi thanh trượt có ô số (REQ-UI-15).
4. **Dựng token trước khi dựng màn:** chuyển `apps/web/src/index.css` sang bộ token 5.2, làm theme sáng/tối mặc định, rồi mới dựng lại bố cục theo 5.3 (T-70).

## 7. Nguyên tắc sản phẩm: trình dựng thật, mặc định đơn giản (D-54)
Mục tiêu: người dùng làm được **mọi thứ một trình dựng video/motion graphics thật làm được** với các lớp đồ hoạ của mình (xoay, biến đổi, keyframe, biểu thức, timeline), **nhưng** điểm khác biệt là mặc định cực đơn giản:

- **Preset mẫu đơn giản:** mở file là có video đẹp ngay ("Bản in" là mặc định); đổi phong cách bằng một lần bấm.
- **Kéo thả dễ:** thêm widget bằng kéo từ thư viện vào khung; kéo, co giãn, xoay trực tiếp trên khung với bắt dính; mọi thao tác hoàn tác được.
- **Độ sâu theo nhu cầu:** Cơ bản chỉ hiện thứ cần cho preset và kéo thả; Nâng cao và thẻ Editor mở toàn bộ quyền chỉnh (REQ-UI-13).

Hệ quả đã ghi vào yêu cầu:
- **Xoay tự do mọi widget từ bản 1.0** (REQ-GRAPHICS-03 sửa; thay D-15). Xoay 3D X/Y/Z và camera vẫn ở 1.1 (REQ-GRAPHICS-15).
- **Spectrum đổi hướng cột** lên/xuống/trái/phải/đối xứng ngay bên trong widget (REQ-WIDGET-07), cộng với xoay widget cho mọi góc.
- "Ngoài phạm vi: biên tập video đa tầng" được làm rõ là **cắt ghép cảnh quay/clip video**; lớp đồ hoạ, keyframe, timeline hiệu ứng thì trong phạm vi.
