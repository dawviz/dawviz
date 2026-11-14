---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "3.8 Prompt vòng 2 (dùng kèm tệp đính kèm)"
path: "3. Bộ prompt sinh ảnh giao diện web > 3.8 Prompt vòng 2 (dùng kèm tệp đính kèm)"
chunk: 3-8-prompt-vong-2-dung-kem-tep-dinh-kem.md
source_lines: 178-284
source_sha1: 4b6c40ad59
ids: []
---
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
