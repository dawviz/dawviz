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

To make a property **change over time or with the music** instead of staying still: select the widget, open **Animate properties**, pick a property and press **Add**. Any number or colour can be animated: position, size, rotation, the opacity of the whole widget, and every number or colour field in the widget's **Settings** (for example bar colour, line thickness, glow).

For each property you choose **How it changes**:

- **Keyframes**: press **Add keyframe here** to set the value at the moment you are viewing. Each keyframe has a time, a value and a **Curve** for getting to it (even, overshoot, bounce, spring…). Between two keyframes choose even, hold then jump, or soft curve. **After the last keyframe** the property stays, or repeats, goes back and forth, or repeats and keeps adding. Colours blend smoothly, without going muddy in the middle.
- **Follow the music**: the value follows a source of the song's data: beat, bar, song progress, the number of notes sounding, the loudest note sounding, a note that just hit (jumps, then fades), a track's volume or pan automation, the loudness of the audio. You set where the source runs from and to and the matching values, for example glow from 0 to 1 when a note has just hit.

The value always stays inside the property's valid range: pushing past a limit stops at the limit instead of breaking the picture. Different properties run independently, and Preview is identical to the exported video. The Piano roll and Sheet music accept only position, size, rotation and opacity (changing sheet-music properties means rewriting the score).
