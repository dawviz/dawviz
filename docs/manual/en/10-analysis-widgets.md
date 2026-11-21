# Analysis widgets

Besides the Piano roll and the text widgets, the Editor has eleven widgets that show what is going on in the song. Add them with **Add** at the top of the Layers list; adjust them in the widget's **Settings**.

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

The Piano roll also has **Note animation** under **Settings**: each note goes through four phases (arriving, hit, sounding, just ended) in the style you pick: pop in, fade and scale, drop and bounce, rise up, morph (dot to bar), burst when it ends, pulse on hit. Choose **None** and notes just scroll as before. To make notes fall from above or rise from below, rotate the whole Piano roll widget.

## Animate properties

To make a property **change over time or with the music** instead of staying still, use the **Timeline & keyframes** panel at the bottom of the Editor tab (open it with the button at the start of its bar, or Ctrl+J). Any number or colour can be animated: position, size, rotation, the opacity of the whole widget (the **Transform** group), and every number or colour field in the widget's **Settings** (the **Widget properties** group, for example bar colour, line thickness, glow).

### Setting keyframes

1. Select the widget on the frame or in Layers. The Timeline shows its properties.
2. Move the playhead to the moment you want: play the song, or click/drag on the Timeline's time ruler.
3. Press the **stopwatch** at the start of the property's row. A keyframe is set at the playhead with the current value.
4. Move the playhead somewhere else and type a new value in that row's value field (or drag on the field). A new keyframe is added at the playhead. The diamond button between the two triangle buttons also adds a keyframe at the playhead (press it again to remove it); the triangles move the playhead to the previous or next keyframe.

Press the stopwatch again to stop animating that property (its keyframes are removed). The funnel button at the top corner shows only the properties that are animated (key U).

### Editing keyframes on the Timeline

- **Select:** click a diamond. Hold Shift (or Ctrl/⌘) to add more. Drag on an empty part of the Timeline to select with a box. Ctrl+A selects every keyframe of the widget.
- **Move:** drag a diamond left or right; every selected keyframe moves with it. Keyframes snap to the playhead, to other keyframes and to the song's beats; hold Alt while dragging to place them freely. Alt+Left/Right moves them one frame (add Shift: one second).
- **Add:** double-click a property's row at the moment you want.
- **Delete:** select and press Delete.
- **Look closer:** hold Ctrl and scroll over the Timeline, or use zoom in, zoom out and **Fit the whole song** at the top corner.

A keyframe's shape tells how the value moves on to the next one: a diamond is even, a square is hold then jump, a circle is a soft curve. Selected keyframes are highlighted. A small dot under a keyframe means it is anchored to the music (beat, bar); dragging it turns it into a time in seconds.

### Shaping the curve

When you select keyframes, the **Keyframe** section appears first in the right column:

- **Time** and **Value** (when one keyframe is selected).
- **Curve into this keyframe**: a graph with time across and value up. Drag the two round handles to shape how the value arrives at this keyframe (slow then fast, overshoot and settle…). The four fields **x1, y1, x2, y2** below take exact numbers. The first keyframe has nothing before it, so its curve can't be shaped.
- **Curve**: pick a ready-made curve (even, overshoot, bounce, spring…).
- **Between keyframes**: smooth to the next, hold then jump, or soft curve.
- **After the last keyframe**: stay, repeat, back and forth, or repeat and keep adding.

Select several keyframes and change a field to change all of them; a field where they differ reads **Several values**. Colours blend smoothly, without going muddy in the middle.

### Following the music

Click a property's name on the Timeline (not a keyframe), then choose **Follow the music** in the **Keyframe** section on the right. The value follows a source of the song's data: beat, bar, song progress, the number of notes sounding, the loudest note sounding, a note that just hit (jumps, then fades), a track's volume or pan automation, the loudness of the audio. You set where the source runs from and to and the matching values, for example glow from 0 to 1 when a note has just hit. On the Timeline that property shows a **Follows the music** bar instead of keyframes. **Stop animating** puts the property back to a fixed value.

The value always stays inside the property's valid range: pushing past a limit stops at the limit instead of breaking the picture. Different properties run independently, and Preview is identical to the exported video. The Piano roll and Sheet music accept only position, size, rotation and opacity (changing sheet-music properties means rewriting the score).
