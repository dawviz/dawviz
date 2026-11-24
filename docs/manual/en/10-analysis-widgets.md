# Analysis widgets

Besides the Piano roll and the text widgets, the Editor has eleven widgets that show what is going on in the song. Add them with **Add** at the top left of the Timeline; adjust them in the widget's **Settings**.

| Widget | Shows |
|---|---|
| **Tempo & time signature** | The current BPM and time signature, the tempo curve of the whole song, and a flash when tempo or time signature changes. |
| **Bar & beat** | The position as `002.2.50` (bar.beat.hundredths) or `002.2.3` (sixteenths), with a dot for each beat. |
| **Key** | The key now playing (for example "C major") and how sure the guess is, from the notes of the last few seconds. |
| **Velocity** | A level bar per track (jumps on each note, then fades), or a histogram of velocities. |
| **Note density** | One row per track, darker cells where there are more notes, plus the number of notes sounding. |
| **Pitch wheel** | 12 cells for the 12 notes; the cells of the sounding notes light up; the chord shows in the middle. Order them by semitone or as the circle of fifths. |
| **Arrangement overview** | A small map of the tracks over time, the played part darker, with a playhead. |
| **Drum pads** | A grid of pads for the drum track: a pad lights when a note hits, labelled with GM drum names (Kick, Snare, HH Closed…). |
| **Section name** | The current section (Intro, Verse…) and the next one. |
| **Lyrics** | The line being sung, the syllables already sung brighter; the next line small underneath. |
| **Automation** | The volume or pan line of a track over time, with its current value. |

## Where the data comes from

- **Section name** uses the project's markers: Reaper (`MARKER` and regions), Ableton (Locators), DAWproject (Markers), MIDI (Marker). With no markers the widget uses the **Phases** you set in the Editor when no widget is selected.
- **Lyrics** come from MIDI (Lyric events, or karaoke-style Text events from a `.kar`). A new line starts at `/` or `\`, after a long pause, or when a line gets too long. With no lyrics the widget shows nothing.
- **Automation** comes from Reaper volume and pan envelopes, Ableton track volume and pan automation, and DAWproject Points. FL Studio gives channel volume and pan. A track without automation draws nothing.
- **Drum pads** takes only tracks with notes on MIDI channel 10 or a name with "Drums"; set **Tracks** to "All chosen tracks" to include others.
- The widgets that read notes (Key, Velocity, Note density, Pitch wheel, Arrangement, Drum pads, Automation) have a track picker under **Advanced**.

## Note names

With no widget selected, the **Note names** section changes the names of notes and chords in every widget at once:

- **Names**: letters (C D E), solfège (Do Re Mi) or German (H for B, Cis, Es).
- **Black keys**: written as sharps (C♯) or flats (D♭).
- **Write # and b instead of ♯ and ♭**: turn on if your font lacks those two characters.
- **Middle C**: C4 (standard) or C3 (Yamaha style).

Leave it on "Default" to keep the names as before.

## Tips

- The text in these widgets is a template with placeholders, as in [Inserting live values into text](08-placeholders.md). For example Key uses `{key}`, `{scale}`, `{confidence}`; Section name uses `{section}`, `{next}`, `{next_in}`, `{section_no}`, `{section_elapsed}`; Note density uses `{poly}`.
- The words "major" and "minor" in the Key widget are text you can edit (Advanced), so you can change them to your own language.
- Preview and the exported video are identical: these widgets depend only on the moment being shown.

## Motion for every widget

Not only the analysis widgets: **every widget** (Piano roll, text, spectrum, particles, sheet music…) has a **Motion** section when you select it in the Editor.

- **Entrance** runs at the start of each of the widget's display ranges (see **Display range**); a widget with no range runs it at the start of the song. Pick a style (fade, slide from the left/right/top/bottom, pop, zoom, drop, spin) and a length in seconds.
- **Exit** runs just before the end of the display range, with the same styles.
- **Repeating**: breathe, float, sway, pulse on the beat, blink, wobble. Adjust **Strength** and **Repeat every** (in beats or seconds). Counted in beats, it stays on the beat when the tempo changes.

You can combine them: for example the entrance "Slide from the left" with the repeating "Pulse on the beat" on the same widget. Scaling and rotation happen around the widget's **anchor point**. Preview and the exported video are identical.

## Per-note animation

The Piano roll also has **Note animation** under **Settings**: each note goes through four phases (arriving, hit, sounding, just ended) in the style you pick: pop in, fade and scale, drop and bounce, rise up, morph (dot to bar), burst when it ends, pulse on hit, ripple on hit (a ring spreading from the start of the note). Choose **None** and notes just scroll as before. To make notes fall from above or rise from below, rotate the whole Piano roll widget.

## Animate properties

To make a property **change over time or with the music** instead of staying still, use the keyframe level of the **Timeline & keyframes** panel at the bottom of the Editor tab: double-click the widget's bar in the Timeline, or press **Keyframes** at the top of the right-hand panel. Any number or colour can be animated. The **Transform** group has **Position** (X and Y on one row, one keyframe for both), **Scale** (percent, 100 is full size; grows or shrinks the whole widget around its anchor), **Rotation** and **Opacity**. The **Widget properties** group has every number or colour field in the widget's **Settings** (for example bar colour, line thickness, glow). Older presets that animate Width/Height show those two rows as well.

### Setting keyframes

1. Select the widget on the frame or in the Timeline, then open its keyframes (double-click its bar, or press **Keyframes** on the right). The Timeline shows its properties.
2. Move the playhead to the moment you want: play the song, or click/drag on the Timeline's time ruler.
3. Press the **stopwatch** at the start of the property's row. A keyframe is set at the playhead with the current value.
4. Move the playhead somewhere else and type a new value in that row's value field (or drag on the field). A new keyframe is added at the playhead. The diamond button between the two triangle buttons also adds a keyframe at the playhead (press it again to remove it). To set keyframes on several rows at once, press the diamond of one row and drag down (or up) across the other rows; the rows you pass are highlighted, and releasing the mouse applies it (one undo step). Starting on a row that already has a keyframe at the playhead makes the drag remove instead; the triangles move the playhead to the previous or next keyframe.

**Drag on the frame:** once Position, Rotation (or Width/Height) has its stopwatch on, moving, rotating or resizing the widget on the frame (or typing into X, Y, W, H, Angle on the right) sets a keyframe at the playhead instead of moving the widget for good. A quick way to make motion: move the playhead somewhere, drag the widget; move it again, drag again. The selection box on the frame always follows where the widget is at the playhead, even while **Scale** is changing (dragging the box then still changes the original size correctly).

**On/off and choices:** checkboxes (e.g. Show the time), choice boxes and text have a stopwatch too. Their value doesn't glide; it **switches exactly at each keyframe** (holding until the next one). They can't follow the music and have no curve.

**Piano roll:** besides position, rotation, scale and opacity, the piano roll can animate the seconds across the roll, the playhead's position, width, colour and visibility, the keyboard, and the shared note style (opacity, corners, height, glow, colour).

**Copy and paste:** select keyframes and press Ctrl+C; move the playhead (or select another widget) and press Ctrl+V. The earliest keyframe lands on the playhead and the others keep their spacing. Properties the target widget doesn't have are skipped.

Press the stopwatch again to stop animating that property (its keyframes are removed). The funnel button at the top corner shows only the properties that are animated (key U).

### Editing keyframes on the Timeline

- **Select:** click a diamond. Hold Shift (or Ctrl/⌘) to add more. Drag on an empty part of the Timeline to select with a box. Ctrl+A selects every keyframe of the widget.
- **Move:** drag a diamond left or right; every selected keyframe moves with it. Keyframes snap to the playhead, to other keyframes and to the song's beats; a teal guide line shows while snapping. Hold Alt while dragging to place them freely. Alt+Left/Right moves them one frame (add Shift: one second).
- **Add:** double-click a property's row at the moment you want.
- **Delete:** select (click, Ctrl+click or drag a box over empty space) then press Delete, or use the **Delete keyframes** button in the Settings column; the number in brackets is how many diamonds are selected.
- **Jump to a keyframe:** drag on the time ruler and the playhead snaps to keyframes (the small marks on the ruler); hold Alt to scrub freely.
- **Look closer:** hold Ctrl and scroll over the Timeline, or use zoom in, zoom out and **Fit the whole song** at the top corner.

A keyframe's shape tells how the value moves on to the next one: a diamond is even, a square is hold then jump, a circle is a soft curve. Selected keyframes are highlighted. A small dot under a keyframe means it is anchored to the music (beat, bar); dragging it turns it into a time in seconds.

### Shaping the curve

When you select keyframes, the **Keyframe** section appears first in the right column:

- **Time** and **Value** (when one keyframe is selected).
- **Curve into this keyframe**: a graph with time across and value up. Drag the two round handles to shape how the value arrives at this keyframe (slow then fast, overshoot and settle…). The four fields **x1, y1, x2, y2** below take exact numbers. The first keyframe has nothing before it, so its curve can't be shaped.
- **Curve**: pick a ready-made curve (even, overshoot, bounce, spring…).
- **Between keyframes**: smooth to the next, hold then jump, or soft curve.
- **After the last keyframe**: stay, repeat, back and forth, or repeat and keep adding.

The ↺ button next to **Curve**, **Between keyframes** and **After the last keyframe** puts that field back to its default (even, smooth to the next, stay). **Deselect** (or Esc on the Timeline) closes the **Keyframe** section. Selecting a Position diamond shows two fields, **Value X** and **Value Y**.

Select several keyframes and change a field to change all of them; a field where they differ reads **Several values**. Colours blend smoothly, without going muddy in the middle.

### The graph (Graph Editor)

The **List / Graph** switch at the right of the Timeline title bar changes the view. **Graph** draws the curve of the selected row (Position has two lines: x solid, y dashed):

- **Value**: the vertical axis is the value over time. Drag a square to move a keyframe in time and change its value at once; hold Shift while dragging to move in one direction only. Keyframes snap to the playhead, beats, other keyframes, each frame and round numbers; hold Alt to place freely. Select a keyframe to show the round handles of the segments on both sides; drag a handle to shape that segment.
- **Speed**: the vertical axis is how fast the value changes (per second). Drag a handle sideways to change the influence, up or down to change the velocity.
- **In / Out**: with one keyframe selected, two pairs of boxes on the right take the **velocity** (units per second) and **influence** (%) of the incoming and outgoing segments. A linear segment has 0% influence: set an influence first so the handle moves away from the keyframe and can be dragged.
- **Copy easing / Paste easing**: copy the curve leading into the selected keyframe, then paste it on other keyframes.
- **Easing library**: pick a curve with a thumbnail to apply it to the selected keyframes. **Save this curve** adds the selected keyframe's curve to **Saved** (kept on this computer).

Scroll to move along time, Ctrl+scroll to zoom around the pointer, and **Fit the curves** to see everything again. Delete, Ctrl+A and Esc work as in the list; Left/Right on a keyframe moves it one frame (add Shift: one second), Up/Down changes its value. Colour properties have no graph; use the list. Several properties on one graph comes in version 1.1.

### Following the music

Click a property's name on the Timeline (not a keyframe), then choose **Follow the music** in the **Keyframe** section on the right. The value follows a source of the song's data: beat, bar, song progress, the number of notes sounding, the loudest note sounding, a note that just hit (jumps, then fades), a track's volume or pan automation, the loudness of the audio. You set where the source runs from and to and the matching values, for example glow from 0 to 1 when a note has just hit. On the Timeline that property shows a **Follows the music** bar instead of keyframes. **Stop animating** puts the property back to a fixed value.

The value always stays inside the property's valid range: pushing past a limit stops at the limit instead of breaking the picture. Different properties run independently, and Preview is identical to the exported video. Sheet music accepts only position, size, rotation, scale and opacity (changing sheet-music properties means rewriting the score).

### Expressions

In the **Keyframe** section, choose **Expression** and type a formula that computes the value from time and the music, like After Effects expressions. Examples:

- Opacity breathing with the beat: `0.5 + 0.5 * sin(beat.phase * TAU)`
- x drifting and shaking on strong notes: `value + t * 20 + wiggle(6, note.velocity / 20)`
- Colour by pitch: `mix(#4aa8f5, #ff6b9d, smoothstep(48, 72, note.pitch))`
- Show on odd bars only: `bar.index % 2 == 1`

Data you can read: `t` (seconds), `beat.phase`, `bar.phase`, `beat.index`, `bar.index`, `bar.bpm`, `time.progress`, `notes.count`, `note.velocity`, `note.pitch`, `note.hit`, `note.active`, `track.volume`, `track.pan`, `audio.level`, `value` (the property's set value), `width`, `height`. Functions: maths (`sin`, `clamp`, `mix`, `smoothstep`, `map`, `linear`…), `ease(x, "easeOutCubic")`, `random()`, `noise(x)`, `wiggle(frequency, amount)`, `oscillate(frequency, amount, "sine")`, colour (`rgb`, `hsl`, `oklch`, `lighten`, `darken`), vec2. Your own variables: `let a = …;` at the start.

A mistake turns the box red and says what is wrong and at which character; the expression is only saved when it is valid (Enter or leaving the box). Randomness is the same on every play, so Preview matches the exported video exactly. If an expression gives an unusable number (for example dividing by 0), the property uses its set value. Choices and text can't use expressions.
