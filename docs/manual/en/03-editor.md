# The Editor tab

[Contents](README.md) · [Tiếng Việt](../03-chinh-sua.md)

The Editor tab is where you arrange the blocks on the video frame and change how they look. Each block (a widget) does one job: piano roll, title and artist, note counter, live notes, time and bar, chord, progress bar.

The screen has three parts: **Layers** on the left, the frame in the middle, and the **properties** of the selected widget on the right.

## Selecting

- Click a widget on the frame, or its name in Layers.
- Shift-click to add more widgets to the selection.
- Press Esc to clear the selection.

## Move, resize, rotate

- **Move:** drag the widget. Or use the arrow keys for 1 point, Shift + arrow for 10 points.
- **Resize:** drag the square handles on the corners and edges. Hold Alt to resize evenly around the centre.
- **Rotate:** drag the round handle above the selection box. The angle steps by 15°; hold Shift to rotate freely. Double-click the round handle to go back to 0°.
- **Exact numbers:** in **Position and size**, X and Y are the top-left corner, W and H the width and height. Units are points on the design frame (on a frame 1,080 points wide, 540 is the middle), whatever your screen size or video resolution.

With several widgets selected, you move and rotate them as a group; **Rotate group by** turns the group around its own centre.

If a widget ends up completely outside the frame, the app shows **Outside the frame** because it won't be in the video. Click **Bring into frame** to pull it back.

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

- **Reorder:** drag the six-dot handle, or select a row and press Alt+Up / Alt+Down. **Arrange** on the right has four buttons: bring to front, bring forward, send backward, send to back (shortcuts Ctrl+] and Ctrl+[, add Shift to go all the way).
- **Eye:** hide or show the widget in the video (same as **Show in video**).
- **Lock:** stops the widget from being dragged by accident. A locked widget can still be selected in Layers to see its numbers or unlock it.
- The top row hides/shows or locks/unlocks every layer at once.

## Note look

Select the Piano roll widget (or click **Edit note look** when nothing is selected) to change how notes are drawn:

- **Presets:** Neon, Soft bars, Flat, Outline. Pick one and adjust from there.
- **Colour:** track colour, one custom colour, by pitch, or by velocity.
- **Opacity**, **Note thickness**, **Corner radius**, **Outline width** (Advanced), **Idle opacity** (Advanced: opacity of notes that haven't played yet or have passed).
- **Show piano keyboard:** draws a keyboard on the left edge; keys light up as notes reach them. With the keyboard on, the playhead sits at the keyboard's edge, so **Playhead position** is locked. Turn the keyboard off to move the playhead.
- **Show playhead:** when hidden, notes still play at the same place; the line just isn't drawn.

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
