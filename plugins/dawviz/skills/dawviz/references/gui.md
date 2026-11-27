# Driving DawViz by its buttons (path B without JavaScript, and instructions for users)

Button names are shown in English / Vietnamese (the app follows the browser language; the globe menu at the top right switches it). Where you can query the page, prefer the `data-testid` in brackets.

## Top bar

| What | Button | testid |
|---|---|---|
| Load the DAW project | **Open file** / **Mở tệp** (opens the file dialog: the user picks the file) | `file-input` (the hidden `<input type=file>`) |
| Basic / Advanced controls | **Basic · Advanced** / **Cơ bản · Nâng cao** | `mode-switch` |
| Tabs | **Preview · Editor · Settings** / **Xem trước · Chỉnh sửa · Cài đặt** | `#tab-preview`, `#tab-editor`, `#tab-settings` |
| Undo / redo | **Undo** / **Hoàn tác**, **Redo** / **Làm lại** (Ctrl+Z, Ctrl+Shift+Z) | `undo-button`, `redo-button` |
| Export | **Export video** / **Xuất video** | opens `export-dialog` |

With `?agent=1` a banner under the top bar says an agent can control the window (`agent-banner`). Without it, the very first visit shows a Basic/Advanced choice (`mode-choice`): **I'm new to this / Tôi mới dùng** (Basic) or **I know video editing software / Tôi đã quen phần mềm dựng hình** (Advanced); Esc picks Basic. It is not shown again, and never with `?agent=1`.

The right-hand panel of Preview and Editor starts with **Find a setting… / Tìm thiết lập…** (`settings-search`): typing keeps only the matching sections and fields, Advanced ones included.

## Preview tab

- **Video styles / Phong cách video** column (`video-styles`, each tile is a `role=radio`): click a tile to apply a style. When the playhead is inside a precomp, the tile applies to that precomp only.
- **Add preset from file / Thêm preset từ tệp** (`preset-add`): pick a `.json` preset or `.dawviz-preset.zip`.
- **Paste preset / Dán preset** (`preset-paste-open`): a text box (`preset-paste-text`) for the JSON you wrote, then **Add preset / Thêm preset** (`preset-paste-add`). Result text appears in `preset-status`; warnings and errors appear right below it.
- **Song / Bài** section: **Load audio / Nạp âm thanh** (`audio-load`, input `audio-input`) for the mixed audio; **Offset** (`audio-offset`) shifts it in milliseconds.
- Transport under the frame: play/pause (Space), the **Seek / Tua** slider and the time.

## Editor tab

- Frame in the middle (drag widgets; arrows nudge), **Widget properties / Thuộc tính widget** on the right (`editor-props`), **Timeline & keyframes / Timeline và keyframe** under the frame (`timeline-panel`, breadcrumb `timeline-crumbs`).
- Timeline level 1 (`layer-timeline`): layer column (`layers`, one `li[data-layer=<id>]` per layer) and bars (`[data-clip-of=<id>]`).
  - **Add / Thêm** (`layers-add`) adds a widget; menu items are `add-<TYPE>` (for example `add-NOTATION`, `add-NOTE_GRID`). Text widgets go through the first item **Text… / Chữ…** (`add-text`): a dialog (`text-dialog`) of templates, one click adds (`text-tpl-<id>`, ids `blank`, `titleArtist`, `noteCount`, `CHORD_DETECTION`, `LYRICS`…). Scissors (`layers-split`, Ctrl+K) splits the selected layers at the playhead. Two frames (`layers-precompose`, Ctrl+G) groups them into a precomp.
  - Drag a bar to move it, its edges to trim, the small squares at its top corners (`fade-in-<id>`, `fade-out-<id>`) to fade.
  - **Phases / Phase** lane: + (`phase-add`) adds a phase at the playhead; markers are `phase-<n>`.
  - **Music / Nhạc** (`music-toggle`) shows note and chord lanes for lining bars up.
- Double-click a bar: its keyframes (level 2, `keyframe-timeline`), or open a precomp. In the right panel: **Keyframes / Keyframe** (`props-open-keys`), **Open precomp / Mở precomp** (`props-open-comp`), **Release precomp / Gỡ precomp** (`props-uncompose`, Ctrl+Shift+G), precomp **Speed / Tốc độ** (%). Esc goes back.

## Export dialog (`export-dialog`)

Pick **Video / PNG**, the size (720p, 1080p, 4K, or **Custom… / Tuỳ chỉnh…** with **Width / Rộng** × **Height / Cao**, `export-custom`), the frame rate, **Whole song / Cả bài** or **A section / Một đoạn** (`export-range`, then the Start/End boxes `export-range-start`, `export-range-end`) and the quality; **Layers / Lớp** (`export-layers`, PNG or Advanced) ticks the layers to include. The **File name / Tên tệp** line (`export-filename`) shows the name. Then **Start export / Bắt đầu xuất** (`export-start`). When it is done, **Save file / Lưu tệp** (`export-download`). Chrome may first ask where to save. **Cancel** (`export-cancel`) stops it.

## Steps to give a user (path A)

1. Open DAW Visualizer → **Open file** → choose the project. Optional: **Load audio** in the **Song** section.
2. **Paste preset** in the **Video styles** column → paste the JSON → **Add preset**.
3. Look at it in **Editor** (Timeline shows when each layer appears). Tell me any warning under **Video styles**.
4. **Export video** → **Start export** → **Save file**.
