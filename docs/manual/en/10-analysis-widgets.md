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
