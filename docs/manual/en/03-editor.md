# The Editor tab

[Contents](README.md) · [Tiếng Việt](../03-chinh-sua.md)

The Editor tab is where you arrange the blocks on the video frame and change how notes and text look. Each block (a widget) does one job: piano roll, title and artist, note counter, live notes, time and bar, chord, progress bar.

The screen has three parts: **Layers** on the left, the frame in the middle, and the **properties** of the selected widget on the right.

## Selecting

- Click a widget on the frame, or its name in Layers.
- Shift-click (or Ctrl/⌘-click) to add more widgets to the selection.
- Press and hold on a layer's name and drag up or down to select the whole run of layers you pass over. Hold Shift when you start the drag to add to the layers already selected.
- **Select all** at the top of the Layers list, or Ctrl+A (⌘A on Mac), selects every layer.
- Drag on an empty part of the frame to draw a selection box: every widget it touches is selected. Hold Shift to add to the current selection.
- Press Esc to clear the selection.

## Add, duplicate, delete

- **Add:** click **Add** at the top of Layers and pick a widget type. The new widget sits in the middle of the frame, on top of the other layers, and is selected.
- **Duplicate:** the duplicate button in **Arrange**, or Ctrl+D (⌘D on Mac). The copy is moved down a little so you can see it.
- **Delete:** the bin button, or the Delete key. Locked widgets can't be deleted.

All three can be undone with Ctrl+Z.

## Move, resize, rotate

- **Move:** drag the widget. Or use the arrow keys for 1 point, Shift + arrow for 10 points.
- **Resize:** drag the square handles on the corners and edges. Hold Alt to resize evenly around the centre.
- **Rotate:** drag the round handle above the selection box. The angle steps by 15°; hold Shift to rotate freely. Double-click the round handle to go back to 0°.
- **Exact numbers:** in **Position and size**, X and Y are the top-left corner, W and H the width and height. Units are points on the design frame (on a frame 1,080 points wide, 540 is the middle), whatever your screen size or video resolution.

With several widgets selected, you move and rotate them as a group; **Rotate group by** turns the group around its own centre.

If a widget ends up completely outside the frame, the app shows **Outside the frame** because it won't be in the video. Click **Bring into frame** to pull it back.

## Align

The **Align** section has six buttons: align left, centre or right edges, and top, middle or bottom edges.

- One widget selected: it lines up with the video frame, for example to sit exactly in the middle.
- Several widgets selected: they line up with each other, for example all on the same left edge.
- Three or more widgets: two more buttons **space them evenly**, left to right or top to bottom. The two outer widgets stay put.

Rotated widgets line up by the box around them. Locked widgets stay put.

## Particles

The **Particles** widget throws out small particles whenever a note starts. Particles depend only on the moment you are looking at, so jumping anywhere shows exactly what continuous playback would, and exported video matches.

- **Particles per note**, **Lifetime**, **Speed**, **Direction** (0° is up, increasing clockwise), **Spread** (width of the fan), **Gravity** (positive falls, negative rises), **Start size** and **End size**.
- **Colour:** the colour of the track that plays the note, or **One colour**.
- In Advanced: harder notes give more particles, speed variation, circle or square, opacity, fade out, glow, **Start position** (by pitch across the widget's width, centre, or spread evenly) and start height, **Random seed** (change it for a different scatter), **Most particles at once** (beyond it the oldest are dropped).
- Choose the tracks for the widget in the **Track** part of **Settings**, like other widgets.

## Background image

When no widget is selected, the **Background image** section lets you pick a PNG, JPEG, WebP or GIF (up to 20 MB; very large images are scaled down to 4096 pixels on the long side, GIFs use the first frame). The image sits under every widget.

- **Fit:** **Fill** (crops the extra in the middle), **Fit inside** (whole image, background colour around it) or **Stretch** (may distort).
- **Opacity** and **Darken** (a black layer over the image so text and notes read well).
- The image is saved with the session and the project pack. **Presets don't contain the image**, only how it is placed, so someone who opens your preset picks their own image.

## Spectrum

The **Spectrum** widget draws bars that jump with the sound. You need to load audio in the Preview tab (after loading, the app takes a few seconds to analyse it; until then, and when there is no audio, the bars rest at their lowest height so you can still see where the widget is). The spectrum follows the project's **Audio offset**.

There are two shapes, chosen with **Shape** in the **Settings** section:

- **Line:** the bars sit along a line, low frequencies at its start. **Angle** turns the line to any angle from -360° to 360° (0° is horizontal, increasing clockwise; 90° is upright with low frequencies on top). **Line length** and **Bar height** are the size of the shape; the whole shape always sits in the middle of the widget's frame.
- **Circle:** the bars radiate from the centre of the frame. **Circle radius** is the radius of the inner ring and **Bar height** is the longest a bar can be. **Start angle** (Advanced) turns the first bar's position, measured from the top, clockwise.

For both: **Bars** (8 to 128) and **Colour**. In Advanced there is also:

- **Mirror:** on the line, bars grow on both sides of it; on the circle, the left and right halves are mirror images.
- **Reverse frequencies**, **Gradient by frequency** (from **Colour** to **High-frequency colour**), bar width, roundness, **Quiet height**.
- **Lowest/Highest frequency** (log scale): only show part of the range.
- **Attack** and **Release** (milliseconds): bars rise fast and fall slowly to look smooth. Set 0 for instant jumps.
- **Floor** and **Ceiling** (dB): sounds quieter than the floor give the lowest bar, louder than the ceiling the tallest. For quiet music raise the floor or lower the ceiling so the bars move more.
- **Opacity** and **Glow**.

To get a shape at some other angle you can also drag the rotate handle of the whole widget; **Angle** here turns the line without turning the frame.

## Key

When no widget is selected, the **Key** section lets you pick the song's key note (C to B). With a key set, `{bass}` shows the **scale degree** of the bass note (1, ♭2, 2, … 7); without one it shows note names.

## Display range

By default a widget is shown for the whole song. Select a widget and turn on **Show only in these ranges** in the **Display range** section to limit when it appears, for example showing the title only for the first 10 seconds.

- Each row is a range: **Show from** and **Show until**. Type seconds (`90`, `90.5`) or minutes:seconds (`1:30`, `1:30.5`). Leave **Show until** empty to show it until the end of the song.
- **Add range** adds a row; the × button removes one. With no range left the widget is never shown.
- **Fade in** and **Fade out** (seconds) make the widget fade in when a range starts and fade out when it ends. If a range is shorter than the two times together, both shrink in proportion.
- Turn the tick off again to show it for the whole song.

The display range only affects the video and Preview; in the Editor you can still select and drag the widget as usual.

## Phases

Phases are the parts of a song (verse, chorus…). When no widget is selected, the **Phases** section on the right lets you add them: each row has a name and a start time. A phase lasts until the next one; the last phase lasts to the end of the song. The values `{phase}`, `{next_phase}`, `{phase_remaining}`… work in any text (see [Placeholders](08-placeholders.md)).

## Anchor (Advanced)

The anchor is the point a widget turns around. By default it is the centre.

- Drag the small circle in the widget to move the anchor. Moving the anchor doesn't move the widget.
- Or pick one of the nine points in **Anchor**, or type **Anchor X** and **Anchor Y** in percent.
- The ↺ button puts the anchor back in the centre.

In Basic mode widgets always turn around their centre.

## Snapping

While you drag, a widget sticks to the frame edges, the frame centre and other widgets. Coloured guide lines show what it is sticking to. The **Snapping** section on the right has:

- **Smart guides and equal spacing:** line up with other widgets and keep equal gaps between them.
- **Snap to grid:** stick to an 8 or 16 point grid.

To turn snapping off for a moment, hold Alt while moving, or Ctrl (⌘ on Mac) while resizing.

## Layers

The **Layers** list shows which widget sits on top: the top row is drawn on top.

- **Reorder:** drag the six-dot handle (only the handle reorders; dragging elsewhere on the row doesn't), or select a row and press Alt+Up / Alt+Down. **Arrange** on the right has four buttons: bring to front, bring forward, send backward, send to back (shortcuts Ctrl+] and Ctrl+[, add Shift to go all the way).
- **Rename:** double-click a layer's name (or select the layer and press F2), type the new name, press Enter. Esc cancels. Leave it empty and press Enter to go back to the name by type (for example Chord 2). A name can have up to 60 characters and cannot match another layer (upper and lower case count as the same). If it matches, the old name is kept and the app tells you why. Layer names are only for finding things; they do not appear in the video and are saved in the preset. A duplicate does not carry over the original's name.
- **Eye:** hide or show the widget in the video (same as **Show in video**).
- **Lock:** stops the widget from being dragged by accident. A locked widget can still be selected in Layers to see its numbers or unlock it.
- The top row hides/shows or locks/unlocks every layer at once.
- **Quick hide or lock:** press and hold an eye (or lock) and drag up or down over other layers; every layer you pass gets the same state as the first one you pressed. A drag that hides/shows is one undo step.

## Settings

Text widgets have a **Settings** section for what is special about them:

- **Title & artist:** type the title and artist. Leave them empty to use the project's.
- **Note counter:** turn each line on or off (played notes, note count, progress, tempo). Advanced: edit the text of each line, decimal places, line spacing.
- **Live notes:** one note per line or all on one line, most lines, show the track name. Advanced: edit the text, how long notes fade after release.
- **Time & bar:** turn each row on or off, number style (grouped digits or clock, bar.beat.tick), progress bars under the numbers. Advanced: labels, digits per group (minutes, seconds, milliseconds; bar, beat, tick), row spacing, bar length, thickness and colours.
- **Chord:** read chords from held notes or when struck, always show the note list, and what to show for an unknown chord ("no chord" text or the notes).
- **Progress bar:** horizontal or vertical, thickness, colour, show the time. Advanced: bar background, corner radius, time text.
- **Text box:** type text over several lines and mix in values such as `{bpm}` or `{title}`; choose which tracks the values read. See [Putting live numbers into text](08-placeholders.md).

Every setting in this section has a ↺ button when it differs from its original value (tick boxes, button groups, colours, text boxes and **Tracks** included), and Alt+click (Option+click on Mac) on the label resets it quickly.

When you edit the text of a line, words in curly brackets such as `{played}` or `{bpm}` are replaced with the real numbers, in any text. Click `{bpm}` or `{title}` under the box to insert it, or type `{` to see suggestions, or hover over the text box. The full list and how to choose the number style are on [Putting live numbers into text](08-placeholders.md). Press Enter or click outside the box to apply; Esc cancels.

## Text

Select a widget that has text (title, note counter, live notes, time, chord, progress bar, text box) to see the **Text** section.

Each piece of text uses a **text style** (Title, Subtitle, Counter, Clock…). Whatever you change differs from the style; everything else keeps following it. Next to each change there is a ↺ button that goes back to the style's value.

- **Text:** when a widget has several pieces of text, pick the one to edit here, for example Title or Artist. Some entries are part of a line, such as **Numbers in the lines** of the note counter or **Bass note after /** of the chord: changes there apply only to that part, the rest of the line stays the same. Text you have changed is marked • in the list.
- **Text style**, **Font**, **Size**, **Colour**, **Bold**, **Italic**.
- **Align:** left, centre or right inside the widget box.

In Advanced mode (or after **More options**):

- **Letters:** all caps, all lowercase, Title Case, small caps; letter spacing; width and height of the letters; raise or lower; superscript/subscript; underline, strikethrough; opacity; **Fixed-width digits** (every digit takes the same space, so changing numbers don't push the text next to them; on by default for counters and clocks).
- **Fill:** turn on **Gradient** to fill the text with two colours, in a straight line at an angle or radiating from the centre.
- **Outline:** width, colour, centred on the edge or outside, over or under the fill.
- **Shadow:** colour, opacity, distance, direction, softness. A distance of 0 gives an even glow around the letters.
- **Background:** a coloured box behind the text, with padding and rounded corners, to keep text readable over busy pictures.
- **When the text is too long:** cut with "…", shrink to fit (no smaller than **Smallest size**), or let it run over. Turn on **Wrap onto more lines** to split long text, with a maximum number of lines and line spacing.
- **Text styles:**
  - **Save as new style…** stores the current look as a named style you can use for other text.
  - **Update style** pushes this text's changes into the style it uses. Every other text using that style changes too.
  - **Clear changes** puts the text back to the plain style.

Text styles are saved in the preset.

## Note look

Select the Piano roll widget (or click **Edit note look** when nothing is selected) to change how notes are drawn:

- **Presets:** Neon, Soft bars, Flat, Outline. Pick one and adjust from there.
- **Colour:** track colour, one custom colour, by pitch, or by velocity.
- **Opacity**, **Note thickness**, **Corner radius**, **Outline width** (Advanced), **Idle opacity** (Advanced: opacity of notes that haven't played yet or have passed).
- **Pitch range:** **Fit content** follows the lowest and highest notes of the tracks (so a track with few notes is zoomed in); **Custom** (the default, A0–C8, all 88 keys) lets you type the lowest and highest note by name, such as `C2`, `C#3`, `Db4`. Notes outside the range are cut off. Preset files store the range as MIDI numbers (`pitchMin`, `pitchMax`).
- **Show piano keyboard:** draws a keyboard on the left edge; keys light up as notes reach them. With the keyboard on, the playhead sits at the keyboard's edge, so both **Show playhead** and **Playhead position** are hidden. Turn the keyboard off to adjust the playhead.
- **Note motion:** **Scroll** (default) notes flow past a fixed playhead; **Page** notes stay still page by page, the playhead sweeps left to right, and at the end of the page it returns to the start and shows the next page of notes (notes that cross a page boundary are cut at the page edge; played notes are solid, upcoming notes are faded by **Idle opacity**). **Visible time** is the time scale in Scroll mode and the length of one page in Page mode. In Page mode the **Playhead position** field has no effect, so it is hidden.
- **Page length (Page mode):** **Seconds** or **Bars**. With **Bars**, each page holds exactly the number of bars you set (**Bars per page**); pages start on the first beat of a bar and turn exactly when a new bar begins, even when the song changes tempo or time signature (pages then differ in length).
- **Show notes ahead (Page mode):** 0 shows the whole page. Set some seconds (for example 2) and a note only appears when it is that close to the playhead; played notes stay until the end of the page. This gives the "notes appear as you go" look of many videos.
- **Show playhead:** when hidden, notes still play at the same place; the line just isn't drawn. While the line is hidden, **Playhead position** is hidden too; show the line again to adjust it.

### Glow

- **Glow** and **Glow size:** how strong and how wide the halo around notes is.
- **Glow only while playing:** notes glow only while they sound.
- **Glow behaviour:** **Even** (every note the same) or **Dynamic on hit** (each note glows differently, depending on **Driven by**):
  - **Velocity:** harder-played notes glow more.
  - **Pitch:** higher notes glow more.
  - **Pan:** follows the track's left-right position. **Left → right**: hard left is weakest, hard right strongest. **Away from centre**: centre is weakest, the further to either side the stronger.
  - **Fade:** brightest at the hit, fading out until the note ends.
  - **Automation:** follows an automation lane from the project (choose it in **Lane**). Tracks without that lane glow evenly.
- Advanced: **Weakest glow**, **Strongest glow**, **Invert**, **Fade after note** (how many seconds the glow lasts after the note ends).

Hover over **Driven by** to see how the current choice works.
