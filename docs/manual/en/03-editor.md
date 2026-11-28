# The Editor tab

[Contents](README.md) · [Tiếng Việt](../03-chinh-sua.md)

The Editor tab is where you arrange the blocks on the video frame and change how notes and text look. Each block (a widget) does one job: piano roll, title and artist, note counter, live notes, time and bar, chord, progress bar.

The screen has three parts: the frame in the middle, **Widget properties** on the right (full height), and the **Timeline & keyframes** panel under the frame. The Timeline holds the layer list too: each layer is a row and each stretch of time it appears is a bar, as in the timeline of Premiere Pro or After Effects.

## Resize and collapse panels

- **Resize:** drag the border between two panels (the pointer turns into a two-headed arrow). Double-click the border to go back to the default size. You can also Tab to the border and use the arrow keys (Shift: bigger steps).
- **Collapse:** press the panel button at the top corner of Widget properties, or the button at the start of the **Timeline & keyframes** bar. A collapsed panel leaves a thin strip; click the strip to open it again. Shortcuts: Ctrl+Alt+B (Widget properties), Ctrl+J (Timeline).
- **Make the Timeline as tall as you like:** drag the border above the Timeline up or down; it goes up until only a small strip of the frame is left.
- **Fold sections:** click a section title (for example **Position and size**) to fold it away when you don't need it, click again to open it. The right column gets much shorter. The app remembers which sections are folded, on the Preview tab too.
- **Find a setting:** type in the **Find a setting…** box at the top of Widget properties to keep only the sections and boxes whose names match, Advanced ones included while in Basic mode; folded sections open when they have a match (see [Contents](README.md)). Esc clears the text.
- **Groups in Settings:** the settings of many widgets are split into named groups (for example **Tempo curve**, **Beat flash**, **Aura**, **Playhead**); click a group name to fold or unfold it, remembered per widget type. A tick box or list to the right of a group name switches the whole group: turn it off (or choose **Off**/**None**) and the boxes in the group hide, keeping their values. A box where 0 already means off (such as **Glow**) has no separate switch; its extra boxes show only when the value is above 0. A box that has no effect with the current choice is hidden altogether (for example **Circle radius** while the Spectrum is a Line); choose again and it returns with its value. A box with keyframes always shows. The keyframe Timeline uses the same groups.
- Panel sizes and states are remembered in this browser. On screens narrower than 1024 points the panels stack as before.

## Selecting

- Click a widget on the frame, click its name in the Timeline's layer column, or click its bar in the Timeline.
- Shift-click (or Ctrl/⌘-click) to add more widgets to the selection.
- Press and hold on a layer's name and drag up or down to select the whole run of layers you pass over. Hold Shift when you start the drag to add to the layers already selected.
- Ctrl+A (⌘A on Mac) selects every layer.
- Drag on an empty part of the frame to draw a selection box: every widget it touches is selected. Hold Shift to add to the current selection.
- **Deselect:** press **Deselect** at the top of the right-hand panel (while something is selected), press Esc, click the background around the frame, or click an empty spot in the Timeline. This works even when a widget covers the whole frame, where clicking on the frame cannot clear the selection.

## Add, duplicate, delete

- **Add:** click **Add** at the top left of the Timeline and pick a widget type. The new widget sits in the middle of the frame, on top of the other layers, and is selected.
- **Add text:** the first item of the **Add** menu is **Text…**. It opens the **Add text** dialog with two groups: **Text boxes** filled in with [placeholders](08-placeholders.md) (empty box, title and artist, note count, time, tempo, key, chord name) and **Text with its own drawing** (time with progress bar, notes playing, chord with note line, lyrics, section name, bar and beat, key with confidence, tempo with curve). Hover a template to see a preview, click once to add it. Esc closes the dialog without adding anything. For a text box from a template, ↺ puts the text back the way it was when added.
- **Duplicate:** the duplicate button in **Arrange**, or Ctrl+D (⌘D on Mac). The copy is moved down a little so you can see it.
- **Delete:** the bin button, or the Delete key. Locked widgets can't be deleted.

All three can be undone with Ctrl+Z.

## Frame ratio

The **9:16 · 1:1 · 16:9** switch sits above the frame, the same one as in the Preview tab. Changing the ratio scales every block; then fine-tune their positions here. It is a single Undo step.

In Advanced, with nothing selected, the **Frame size** part lets you type any **Width** and **Height** (256–4096 points) for other shapes such as 4:5 or 21:9; none of the switch buttons is marked then.

## Move, resize, rotate

- **Move:** drag the widget. Or use the arrow keys for 1 point, Shift + arrow for 10 points.
- **Resize:** drag the square handles on the corners and edges. Hold Alt to resize evenly around the centre. While resizing, the edge snaps to the edges and middle of the video frame, and to the edges and centres of other widgets.
- **Drag a shared edge:** select two widgets whose edges touch (side by side, or one above the other) and a small handle appears on the shared edge. Drag it and one widget grows while the other shrinks, so their combined size stays the same. The edge also snaps to the video frame's edges and middle; hold Ctrl (⌘ on Mac) to turn snapping off. It only works for widgets that are not rotated or locked. The whole drag is one undo step.
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
- In Advanced: harder notes give more particles, speed variation, circle or square, opacity, fade out, glow, **Start position** (**At the note, where it meets the playhead**: particles fly out from the exact spot a note touches the Piano Roll's playhead, like sparks; by pitch across the widget's width; centre; or spread evenly. With "At the note", the Particles widget's frame is hidden on the picture (select the layer from the Timeline's layer column), and particles are not clipped to the widget: they fly across the whole video frame; with no Piano Roll there are no particles) and start height, **Random seed** (change it for a different scatter), **Most particles at once** (beyond it the oldest are dropped).
- Choose the tracks for the widget in the **Track** part of **Settings**, like other widgets.

**Example: sparks rising from notes at the playhead.** Add a Particles widget, then set:

| Setting | Value |
|---|---|
| Start position | At the note, where it meets the playhead |
| Particles per note | 8 |
| Lifetime | 1.8 |
| Speed | 200 |
| Direction | 0 (up) |
| Spread | 70 |
| Gravity | −140 (negative keeps them rising) |
| Start size / End size | 8 / 0 (shrink away) |
| Colour | One colour, pick orange (for example `#ff7a1a`) |
| Glow (Advanced) | 0.9 |
| Speed variation (Advanced) | 0.6 |

For slow, plentiful embers: raise Particles per note and Lifetime, lower Speed. For fast sparks: raise Speed, lower Lifetime. On a light style such as Paper, pick a dark colour, because the default of "One colour" is white. Ready-made particle sets (fire, smoke, mist, snow…) are planned for a later version, so you will not have to pick the settings yourself.

## Sheet music

The **Sheet music** widget writes your notes as a two-staff score; playing notes light up and grow. How to use it and every setting: [Sheet music](09-sheet-music.md).

## Background image

The **Background image** section is gone from the Properties panel: to put a picture behind everything, add an **Image** widget (**Add** button) and move it to the bottom of the layers list. Older sessions that already have a background image still show it as before.

## Image

The **Image** widget (from **Add** at the top left of the Timeline) draws one of your pictures on the frame, such as a logo or a character. In **Settings**, press **Choose an image file…** to add a PNG, JPEG, WebP, GIF (first frame) or SVG; added images show in the **Image** box so other widgets can reuse them. **Fit**: **Fit inside** (whole picture visible), **Fill** (crop the overflow) or **Stretch**.

Each file can be up to 20 MB, images up to 8192 px on the long side, and the whole session up to 200 MB. The app recognises the file type from its content, not its name. An SVG with scripts, event handlers or external links is refused. Adding the same file twice keeps one copy.

**Sprite sheet** (Advanced): a picture made of several frames in a grid. Set **Sprite columns**, **Sprite rows**, **Frames used** and **Frames per second**; the widget steps through the frames (row by row) from when it starts showing, and **Loop**s or stops on the last frame. Turn off **Smooth when scaled** for pixel art.

## Spectrum

The **Spectrum** widget draws bars that jump with the sound. You need to load audio in the Preview tab (after loading, the app takes a few seconds to analyse it; until then, and when there is no audio, the bars rest at their lowest height so you can still see where the widget is). The spectrum follows the project's **Audio offset**.

Its settings are split into the groups **Style**, **Geometry**, **Bars**, **Peaks**, **Colour** and **Response**, and only the boxes that do something for the current style show: the **Peak/RMS meter** always lies along a line, so it has no **Shape**, **Circle radius** or **Start angle**; **Reverse frequencies**, **Frequency scale**, the frequency range and **Attack**/**Release** are only there for Bars, Area, Line and Dots; **Gradient by frequency** only for Bars, Dots and the meter; **Mirror** on the Circle only for Bars.

**Style** picks how it is drawn: **Bars** (default), **Area** (filled under the spectrum line), **Line**, **Dots**, **Oscilloscope** (the instant waveform over a **Time window** of a few dozen milliseconds), **Whole-song waveform** (the whole song, the played part in **Played / hold colour**, with a playhead) and **Peak/RMS meter** (two level bars and a peak-hold mark of about 1.5 seconds). For Bars and Dots, turn on **Falling peak caps** (the tick box in the **Peaks** group title) so each bar has a cap at its recent highest level that then falls. When it is on, **Cap shape** picks **Line** (a thin line across the bar, the default) or **Dot** (a round dot floating above the bar, like a classic spectrum analyser). In Advanced: **Cap fall speed**; **Cap hold (seconds)** keeps the cap still for a moment before it falls; **Fall acceleration** makes it fall faster and faster (0 falls at a steady speed); **Cap colour** (unticked, the cap uses the bar colour). These boxes are hidden while Falling peak caps is off. In Advanced, **Frequency scale** picks Log, Linear or Mel.

There are two shapes, chosen with **Shape** in the **Settings** section:

- **Line:** the bars sit along a line, low frequencies at its start. **Angle** turns the line to any angle from -360° to 360° (0° is horizontal, increasing clockwise; 90° is upright with low frequencies on top). **Line length** and **Bar height** are the size of the shape; the whole shape always sits in the middle of the widget's frame.
- **Circle:** the bars radiate from the centre of the frame. **Circle radius** is the radius of the inner ring and **Bar height** is the longest a bar can be. **Start angle** (Advanced) turns the first bar's position, measured from the top, clockwise.

For both: **Bars** (8 to 256) and **Colour**. In Advanced there is also:

- **Mirror:** on the line, bars grow on both sides of it; on the circle, the left and right halves are mirror images.
- **Reverse frequencies**, **Gradient by frequency** (from **Colour** to **High-frequency colour**), bar width, roundness, **Quiet height**.
- **Lowest/Highest frequency** (log scale): only show part of the range.
- **Attack** and **Release** (milliseconds): bars rise fast and fall slowly to look smooth. Set 0 for instant jumps.
- **Floor** and **Ceiling** (dB): sounds quieter than the floor give the lowest bar, louder than the ceiling the tallest. For quiet music raise the floor or lower the ceiling so the bars move more.
- **Opacity** and **Glow**.

To get a shape at some other angle you can also drag the rotate handle of the whole widget; **Angle** here turns the line without turning the frame.

## Key

When no widget is selected, the **Key** section lets you pick the song's key note (C to B). With a key set, `{bass}` shows the **scale degree** of the bass note (1, ♭2, 2, … 7); without one it shows note names.

## Motion

Select a widget and open **Motion** to give it an entrance, an exit and a repeating move on the beat. It works for every kind of widget. Details in [Analysis widgets](10-analysis-widgets.md#motion-for-every-widget).

## Timeline & keyframes

The **Timeline & keyframes** panel under the frame has two levels. Its title bar shows where you are, for example **Main timeline › Intro › Keyframes · Chord**; click an item there to go back up.

### Level 1: the layer timeline

The layer column is on the left, the time ruler and the bars on the right. Each bar is a stretch of time when that layer is in the video. A layer shown for the whole song has one bar from start to end.

- **Move a bar:** drag the middle of it. Every selected layer moves together. The layer's keyframes move with the bar, so its animation still starts when the layer appears.
- **Trim:** drag the start or end edge of a bar. Keyframes stay where they are. Drag the end to the end of the song to show the layer until the end. With several layers selected, the same edge of every selected layer moves by the same amount.
- **Fade in / fade out:** drag the small squares at the top corners of a bar (they show on hover or when the layer is selected).
- **Bar names stay in view:** when you scroll or zoom the Timeline and a bar's start is off screen, the layer's name stays at the left edge of the view until the bar ends.
- **Snapping:** while you drag, bars stick to the playhead, the edges of other bars, phases, chord changes (while the Music lanes are open) and the beats of the song. When you trim, a bar also sticks to the **length** of other bars: the label "= Progress (0:12)" means both layers are the same length at that point. Hold Alt to turn it off.
- **Music lanes:** press **Music** under the Phases lane to show a chord lane and one note lane per track, to line bars up with the music. Each track row works like the track list on the Preview tab, and changes here show up in Preview too:
  - **Reorder:** drag the six-dot handle up or down, or click the handle and press Alt+Up / Alt+Down.
  - **Change the color:** click the color dot to open the color picker. The track's notes in the lane change color too.
  - **Hide / solo:** click the eye to hide the track, click **S** to show only soloed tracks. A hidden track keeps its row (empty lane, name crossed out) so you can turn it back on.
  - **Lock:** the lock at the end of the row (see **Lock a track** below).
  - **Drag across tracks:** press and drag down the eye, **S** or lock column to change several tracks at once. The whole drag is one undo step.
  - **All tracks row** (right under the **Music** title): the eye shows everything first, then hides everything; **S** clears every solo (dimmed when nothing is soloed); the lock locks or unlocks every track. Locked tracks stay as they are.
  - **Undo:** each change is one undo step (Ctrl+Z).
- **Rows slide when reordered:** when you reorder layers or tracks, the rows slide to their new place instead of jumping. If your system is set to reduce motion, rows switch places at once.
- **Split a layer at the playhead:** put the playhead over the bar, select the layer and press Ctrl+K (or the scissors button at the top left). The layer becomes two layers that meet there: the original keeps the part before, the copy (just above it) keeps the part after. Each has its own keyframes and is edited on its own.
- **Move a bar to the playhead:** `[` moves the bar so it starts at the playhead, `]` so it ends there. Alt+`[` and Alt+`]` trim the start or end at the playhead.
- **Nudge:** Alt+← / Alt+→ moves by 1/30 second; add Shift for 1 second.
- **Zoom:** Ctrl+scroll (or the magnifier buttons) zooms horizontally; Alt+scroll (or the two buttons with lines) makes rows taller or shorter. Plain scrolling moves up/down or sideways.
- **Drag the ruler** to scrub. The playhead sticks to bar edges and phases; hold Alt to turn it off.
- **See a layer's keyframes:** double-click its bar, press the ◆ button on its row, select it and press Enter, or press **Keyframes** at the top of the right-hand panel. Press Esc to go back to the layer timeline.

The **All layers** row at the bottom of the layer column hides/shows or locks/unlocks every layer at once.

### Level 2: keyframes

This level shows the selected layer's properties over time: the property list on the left, the time ruler and diamond-shaped keyframes on the right. The **Transform** group has Position, Scale, Rotation and Opacity. The widget's other properties are collected into collapsible groups as in After Effects (**Playhead**, **Keyboard**, **Grid**, **Notes**, **Glow**, **Colour**, **Frame**, **Timing**, **Text animator**, **Text**, **General**; a widget shows only the groups it has). Groups start closed and open by themselves when a property inside is animated; click a group name to fold or unfold it. Press the stopwatch on a property to start animating it; once it is on, dragging the widget on the frame sets a keyframe at the playhead. Drag keyframes to change their time, and select a keyframe to shape its curve in the **Keyframe** section on the right. The **List / Graph** switch at the right of the panel's title bar switches to **Graph**, where you see and shape the value and speed curves of the selected row. Details in [Analysis widgets](10-analysis-widgets.md#animate-properties).

Keyframes set in seconds move with the bar when you move it. Keyframes set on the beat grid (bar, beat) belong to the music and stay put.

### Precomps

A precomp groups several layers into one layer, like a precomp in After Effects. Use it when a whole group should appear, move, fade or animate together, for example the whole intro.

- **Make one:** select the layers and press Ctrl+G (or the two-frames button at the top left of the Timeline, or **Precompose** in the right-hand panel when a layer is selected). They go into a new precomp, in exactly the same place on the frame and in time. The precomp's bar spans from the earliest to the latest bar of the group.
- **Open it:** double-click the precomp's bar, press the › button on its row, or press **Open precomp** in the right-hand panel. The frame shows only what is inside; the time when the precomp is not shown is dimmed in the Timeline. Press Esc (with nothing selected) or click **Main timeline** in the title bar to come back out.
- **Inside a precomp** you work as on the main timeline: add, drag, keyframe, split, and even precompose again. Precomps nest up to 4 levels deep.
- **A precomp layer** has position, rotation, scale, opacity, motion, display ranges and keyframes like any layer, and everything inside follows. It is always the size of the frame: to make it bigger or smaller use **Scale** on the keyframe level.
- **Moving the precomp's bar** moves everything inside. Trimming it only trims when it is shown.
- **Rename** a precomp layer like any layer: double-click its name.
- **Duplicating** a precomp layer (Ctrl+D) makes an **independent** copy: the app copies the whole precomp (and any precomps inside it) and names it anew ("Precomp 1" → "Precomp 2"). Changing one does not change the other. A project holds at most 32 precomps; past that the app says so and does not copy.
- **Speed:** the **Speed** (%) field in the right-hand panel when a precomp layer is selected. 200% plays what is inside twice as fast, 50% at half speed. Only the keyframes and show times of the layers inside are stretched; notes, beats and chords still follow the song.
- **Release a precomp:** select the precomp layer and press **Release precomp** in the right-hand panel (or Ctrl+Shift+G). The layers inside come back to the open timeline, in the same place on the frame and at the same times. The precomp layer's own keyframes, motion, scale and fades cannot be carried over; when the precomp layer has any, the app asks first (**Release anyway** to go ahead, **Cancel** or Esc to stop; Ctrl+Z still undoes it) and shows no further notice afterwards. With none, it is released at once without asking.
- With every precomp opened up, there can be at most 512 layers. If an action would go over, the app tells you and does nothing.
- On the Preview tab, when the playhead is inside a precomp, clicking a **Video styles** tile applies that style to that precomp instead of the whole video. If the Piano roll is inside a precomp, the per-track colours on the Preview tab change the Piano roll of the precomp shown at the playhead. See [Preview](02-preview.md).

## Colour picker and palettes

Every colour swatch opens the same picker: drag in the colour area and hue bar, or type a code in the input. The input understands `#f80`, `#ff8800`, `#ff880080` (the last two digits are opacity), `rgb(255 136 0)`, `hsl(32 100% 50%)`, `hsv(32 100% 100%)`, `oklch(0.75 0.15 60)`, CSS colour names such as `tomato`, or a number. The **Opacity** bar only appears on swatches that allow transparency; the colour is saved as `#rrggbbaa`, and older presets look the same. The HEX/RGB/HSL/HSV switch changes the display, the copy button copies the code, and the eyedropper picks a colour from the screen (only where the browser supports it, such as Chrome and Edge). **Recent** keeps your last 12 colours. Esc closes the picker.

**Palettes** sit at the top of the **Tracks** section: paste a list of colour codes, a GIMP `.gpl` palette, JSON or CSS variables (`--name: #aabbcc`), or press **Use current track colors**; edit any colour, name it and **Save palette**. **Apply to tracks in order** gives the colours to the tracks in order (cycling when colours run out) as one undo step (Ctrl+Z).

## Note names

Also with no widget selected, the **Note names** section changes the names of notes and chords in every widget at once (letters, Do Re Mi, German; sharps or flats; C4 or C3). Details in [Analysis widgets](10-analysis-widgets.md#note-names).

## Display range

By default a widget is shown for the whole song. When it appears is shown by its bars on the Timeline, so change it there (the right-hand panel no longer has a section for this):

- **Change when it shows:** drag the middle of a bar to move it, drag its start or end edge to trim. Drag the end to the end of the song to show it until the end.
- **Show it in several parts:** split the bar with Ctrl+K at the playhead and trim each part, or duplicate the layer (Ctrl+D) and move the copy.
- **Fade in / fade out:** drag the small square at the top of the bar's start to the right (fade in), or the one at the top of its end to the left (fade out). A diagonal line on the bar shows how long the fade is. The fade applies to every bar of the layer, up to 30 seconds and never longer than the shortest bar.

The display range only affects the video and Preview; in the Editor you can still select and drag the widget as usual.

## Phases

Phases are the parts of a song (verse, chorus…). They live on the **Phases** lane at the top of the layer timeline. A phase lasts until the next one; the last phase lasts to the end of the song.

- **Add:** press + at the start of the **Phases** lane to add a phase at the playhead, or double-click an empty spot on the lane. Type a name and press Enter.
- **Move:** drag the phase marker (it sticks to the playhead, beats and bar edges; hold Alt to turn it off), or click the marker and press Alt+← / Alt+→ (add Shift for 1 second).
- **Rename:** double-click the marker.
- **Remove:** click the marker and press Delete.
- **From markers:** if the project has markers, the download button at the start of the **Phases** lane creates phases from them (one phase per marker, same name). If phases already exist, it replaces them all.
- **Lock a track:** in the **Music** lanes each track has a lock. A locked track cannot change its show/hide, solo, color, order or brightness (also in the Tracks panel) until unlocked. Locks last for the session and are not saved in the preset.
- When you drag a layer's bar it sticks to phases, so it is easy to show a layer exactly during the chorus.

The values `{phase}`, `{next_phase}`, `{phase_remaining}`… work in any text (see [Placeholders](08-placeholders.md)).

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

The layer column on the left of the Timeline shows which widget sits on top: the top row is drawn on top.

- **Reorder:** drag the six-dot handle (only the handle reorders; dragging elsewhere on the row doesn't), or select a row and press Alt+Up / Alt+Down. **Arrange** on the right has four buttons: bring to front, bring forward, send backward, send to back (shortcuts Ctrl+] and Ctrl+[, add Shift to go all the way).
- **Parent:** the **Parent** box in **Arrange** attaches this widget to another one. When the parent moves, rotates, scales or fades (through keyframes or motion), the child follows exactly that change; the child stays where it is while the parent is at rest. A widget that is already its child can't be chosen. Deleting the parent unparents the child. Note: while the parent is away from its original place, the child's selection box on the canvas doesn't follow it yet.
- **Rename:** double-click a layer's name (or select the layer and press F2), type the new name, press Enter. Esc cancels. Leave it empty and press Enter to go back to the name by type (for example Chord 2). A name can have up to 60 characters and cannot match another layer (upper and lower case count as the same). If it matches, the old name is kept and the app tells you why. Layer names are only for finding things; they do not appear in the video and are saved in the preset. A duplicate does not carry over the original's name.
- **Eye:** hide or show the widget in the video (same as **Show in video**).
- **◆:** opens the layer's keyframes. The diamond is filled once the layer has keyframes. A precomp layer has a › button that opens the precomp.
- **Lock:** stops the widget from being changed by accident. A locked layer cannot be dragged, rotated, resized, duplicated, deleted or edited, and the matching boxes in the right-hand panel are greyed out (including **Show in video** and the **Snapping** section when every selected layer is locked). A locked layer can still be selected to see its numbers or to unlock it with **Lock on the frame**.
- **Quick hide or lock:** press and hold an eye (or lock) and drag up or down over other layers; every layer you pass gets the same state as the first one you pressed. A drag that hides/shows is one undo step.

## Settings

Text widgets have a **Settings** section for what is special about them:

- **Title & artist:** type the title and artist. Leave them empty to use the project's.
- **Note counter:** each line (played notes, note count, progress, tempo) is a group; the tick box in the group title turns that line on or off. Advanced: edit the text of each line; the **Format** group has decimal places and line spacing (line spacing shows only with two or more lines on).
- **Live notes:** one note per line or all on one line, most lines, show the track name (the tick box in the **Track name** group title). Advanced: edit the text, how long notes fade after release.
- **Time & bar:** turn each row on or off, number style (grouped digits or clock, bar.beat.tick), progress bars under the numbers. Advanced: labels, digits per group (minutes, seconds, milliseconds; bar, beat, tick), row spacing, bar length, thickness and colours.
- **Chord:** read chords from held notes or when struck, always show the note list, and what to show for an unknown chord ("no chord" text or the notes). Advanced: the text of the note line (shown only when the note line can appear: always show notes on, or show the notes for an unknown chord).
- **Progress bar:** horizontal or vertical, thickness, colour, show the time. Advanced: bar background, corner radius, time text.
- **Text box:** type text over several lines and mix in values such as `{bpm}` or `{title}`; choose which tracks the values read. See [Putting live numbers into text](08-placeholders.md).
  - **Animate the text:** tick it to make the text appear (or disappear) piece by piece by **Letter**, **Word** or **Line**. **Effect**: **Typewriter** (one letter at a time), **Fade in**, **Rise**, **Pop**, or **Custom** (set the starting opacity, x/y offset, scale and colour yourself). **Order**: first to last, last to first, from the middle, or random (the same on every play). **Start** is in seconds from when the widget starts showing (start of its visibility range, or the song start); **Duration** is how long each piece takes; **Delay between** is the gap between two pieces. **Count numbers up** runs every number in the text from 0 to its real value (e.g. `{bpm}`).

Every setting in this section has a ↺ button when it differs from its original value (tick boxes, button groups, colours, text boxes and **Tracks** included), and Alt+click (Option+click on Mac) on the label resets it quickly.

When you edit the text of a line, words in curly brackets such as `{played}` or `{bpm}` are replaced with the real numbers, in any text. Click `{bpm}` or `{title}` under the box to insert it, or type `{` to see suggestions, or hover over the text box. The full list and how to choose the number style are on [Putting live numbers into text](08-placeholders.md). Press Enter or click outside the box to apply; Esc cancels.

## Text

Select a widget that has text (title, note counter, live notes, time, chord, progress bar, text box) to see the **Text** section.

Each piece of text uses a **text style** (Title, Subtitle, Counter, Clock…). Whatever you change differs from the style; everything else keeps following it. Next to each change there is a ↺ button that goes back to the style's value.

- **Text:** when a widget has several pieces of text, pick the one to edit here, for example Title or Artist. Some entries are part of a line, such as **Numbers in the lines** of the note counter or **Bass note after /** of the chord: changes there apply only to that part, the rest of the line stays the same. Text you have changed is marked • in the list.
- **Text style:** pick the style for this text (see **Shared text styles** below). A • next to the box means this text differs from its style; hover it to see how many properties you changed.
- **Font**, **Size**, **Colour**, **Weight** (Light, Regular, Bold), **Italic**. At the end of the **Font** list, **Load a font file…** lets you use your own font (WOFF2, WOFF, TTF, OTF, up to 20 MB); it travels with the session, the project pack and the exported video. Only use fonts you are allowed to use.
- **Align:** left, centre or right inside the widget box.

In Advanced mode (or after **More options**):

- **Letters:** all caps, all lowercase, Title Case, small caps; letter spacing; width and height of the letters; raise or lower; superscript/subscript; underline, strikethrough; opacity; **Fixed-width digits** (every digit takes the same space, so changing numbers don't push the text next to them; on by default for counters and clocks).
- **Fill:** turn on **Gradient** to fill the text with two colours, in a straight line at an angle or radiating from the centre.
- **Outline:** width, colour, centred on the edge or outside, over or under the fill.
- **Shadow:** colour, opacity, distance, direction, softness. A distance of 0 gives an even glow around the letters.
- **Background:** a coloured box behind the text, with padding and rounded corners, to keep text readable over busy pictures.
- **When the text is too long:** cut with "…", shrink to fit (no smaller than **Smallest size**), or let it run over. Turn on **Wrap onto more lines** to split long text, with a maximum number of lines and line spacing.
### Shared text styles

Text styles belong to the whole project: every widget with text, including widgets inside a precomp, can use the same style. Change a style once and every place that uses it follows. Text styles are saved in the preset.

Click the **⋯** button next to the **Text style** box (in both Basic and Advanced):

- **Save as new style…** stores the current look as a named style you can use for other text.
- **Update "…"** pushes this text's changes into the style it uses. The item says how many places in the project use that style, because they all change. It can't be clicked when nothing differs from the style.
- **Clear changes** puts the text back to the plain style.
- **Rename…** gives the style another name.
- **Delete style** deletes a style you made. Places that use it go back to their own default style. If the style is in use you are asked first. Built-in styles (Title, Subtitle…) can't be deleted.
- **Save to My library** keeps the current look in this browser so you can use it in other projects (up to 64 styles; saving under an existing name replaces it).
- **Remove from My library…** pick a style in the library to drop. Projects that already use it keep their own copy.

Styles in **My library** appear as their own group at the end of the **Text style** box. Picking one copies it into the project and applies it, so a preset you send to someone else still has every style. Every style action (except the library) can be undone with Ctrl+Z.

## Note look

Select the Piano roll widget (or click **Edit note look** when nothing is selected) to change how notes are drawn:

- **Presets:** Neon, Soft bars, Flat, Outline. Pick one and adjust from there.
- **Colour:** track colour, one custom colour, by pitch, or by velocity. With **By pitch** or **By velocity**, tick **Own colour range** to pick the two end colours yourself: **Lowest note colour** and **Highest note colour** (across the pitch range shown), or **Softest note colour** and **Loudest note colour**; notes in between get a blend of the two. Untick it to go back to the built-in colouring (by pitch: one colour per note name C, C#, D…; by velocity: the track colour, brighter when played harder).
- **Opacity**, **Note thickness**, **Corner radius**, **Outline width** (Advanced), **Idle opacity** (Advanced: opacity of notes that haven't played yet or have passed).
- **Pitch range:** **Fit content** follows the lowest and highest notes of the tracks (so a track with few notes is zoomed in); **Custom** (the default, A0–C8, all 88 keys) has two boxes, **Lowest note** and **Highest note**, that show note names. Drag up or down on a box to move one semitone at a time (hold Shift to go faster, Alt to go slower), or click it and type a note name such as `C2`, `C#3`, `Db4` or a MIDI number from 0 to 127. The **88 keys** and **Full range (0–127)** buttons pick the two common ranges (the full range runs from C-1 to G9). Notes outside the range are cut off. Preset files store the range as MIDI numbers (`pitchMin`, `pitchMax`).
- **Show piano keyboard:** draws a keyboard on the left edge; keys light up as notes reach them. With the keyboard on, the playhead sits at the keyboard's edge, so both **Show playhead** and **Playhead position** are hidden. Turn the keyboard off to adjust the playhead. In the **Settings** section, the **Keyboard** and **Playhead** groups have a tick box in their title that does the same as **Show piano keyboard** and **Show playhead**; turn it off and the group's boxes hide.
- **Note motion:** **Scroll** (default) notes flow past a fixed playhead; **Page** notes stay still page by page, the playhead sweeps left to right, and at the end of the page it returns to the start and shows the next page of notes (notes that cross a page boundary are cut at the page edge; played notes are solid, upcoming notes are faded by **Idle opacity**). **Visible time** is the time scale in Scroll mode and the length of one page in Page mode. In Page mode the **Playhead position** field has no effect, so it is hidden.
- **Page length (Page mode):** **Seconds** or **Bars**. With **Bars**, each page holds exactly the number of bars you set (**Bars per page**); pages start on the first beat of a bar and turn exactly when a new bar begins, even when the song changes tempo or time signature (pages then differ in length).
- **Show notes ahead (Page mode):** 0 shows the whole page. Set some seconds (for example 2) and a note only appears when it is that close to the playhead; played notes stay until the end of the page. This gives the "notes appear as you go" look of many videos.
- **Note flow angle (°):** 0 makes notes run right to left (default), 90 makes them fall from the top, 180 and 270 the other directions; type any angle from 0 to 360. Notes, playhead, keyboard and grid turn inside the widget frame (unlike **Rotation** of the whole widget). **Flip pitch direction** swaps which side holds the high notes (90° with flip: low notes on the left). **Keep labels upright** stops note names and bar numbers from turning with the lane. At angles that are not a multiple of 90°, the keyboard and the playhead arrows may fall outside the frame.
- **Playhead:** **Playhead style** has **Solid line**, **Dashed**, **Band**, **Soft band (fades out)**; **Playhead thickness**, **Playhead colour**, **Playhead length** (a share of the lane height, centred), **Playhead glow** and **Arrow heads**. **When a note hits**: **Flash** (the line leans toward the colour of the note that just hit) or **Swell** (the line gets thicker), stronger with velocity and fading over **Hit fade time (ms)**.
- **Keyboard:** besides on/off there are **Key shape** (**Flat**, **Rounded**), **Pressed keys use note colour** (off uses **Pressed key colour**), **Highlight scale** (**Detected key**, **Major of the key note**, **Minor of the key note**; the key note comes from the project's key note when set) with **Scale colour** and **Scale highlight strength**, and **Note names on keys** (**C keys only**, **All white keys**, **All keys**, **Pressed keys only**; plus **Show octave number**, **Note name colour**). Names follow the shared note-name setting.
- **Bar grid:** **Bar lines**, **Beat lines**, **Bar numbers**, **Grid colour**, **Grid opacity**. The grid follows the song's metre and tempo, so it stays right when they change.
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
