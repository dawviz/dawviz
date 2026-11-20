# The Preview tab

[Contents](README.md) · [Tiếng Việt](../02-xem-truoc.md)

The Preview tab shows what the video will look like and lets you make quick changes that belong to the song: video style, audio, which tracks show.

## Playback

The transport sits under the preview.

| Button | What it does |
|---|---|
| ⏮ | Back to the start (Home key) |
| « / » | Back or forward 5 seconds |
| ▶ | Play or pause (Space) |
| Seek bar | Drag or click to jump |
| ⟳ | Turn looping on or off |

The current time is on the left of the seek bar, the song length on the right.

## Video styles

The left column lists the video styles. Each thumbnail is drawn from your own song (all thumbnails share the same wide frame, whether the style is vertical, square or wide). Click one to switch. A style sets the background colour, the note look, the text and where each block sits on the frame.

Once you change something, the style name shows "edited". Each style keeps its own work in progress: switch to another style and back and your changes are still there. To return a style to its original, hover its tile and press **×**; Ctrl+Z still undoes it. Work in progress on every tile is remembered in this browser (it survives a reload). The duplicate button on a tile makes a new preset from what you see. The plus tile below the list adds a preset from a `.json` file (see [Settings](04-settings.md)).

Above the frame you can see its size and shape (for example `1,080 × 1,080 · 1:1`) and the name of the style in use.

## Frame ratio

The **9:16 · 1:1 · 16:9** switch at the top of the frame changes the video's shape: 9:16 for TikTok, Shorts and Reels, 1:1 for a square frame, 16:9 for widescreen. The blocks on the frame scale to the new shape; adjust their positions in the Editor tab if needed. Each video style remembers its own ratio. Press **Undo** to go back.

## Song

The **Song** section on the right shows the file name, format, length, tempo, number of tracks and number of notes.

### Tempo

In Advanced, the tempo table sits in the collapsible **Edit tempo** part of the **Song** section: click to open it. It opens by itself when the file has no tempo or you have set your own.

If the file has no tempo (some MIDI files), the app uses 120 BPM for now and says so in the **Song** section; type the real tempo in the **BPM** box and press **Apply tempo**. The song is read again with the new tempo and your other settings stay. **Use the file's tempo** removes the tempo you set.

Advanced mode has a tempo table for songs that change tempo or meter: each row is a position, a BPM and a time signature (for example `3/4`, `6/8`). Type positions as **Time** (`1:30.5`), **Reaper** (`5.3.50`) or **Bar.beat.sixteenth** (`5.3.2`). The tempo you set replaces the tempo in the file entirely.

### Load audio

Click **Load audio** and choose the mix of the song (WAV, MP3, OGG, FLAC or M4A). It plays along with the video. This is optional: without audio the video still plays.

- **Replace audio** chooses another file, **Remove** takes it away.
- If the audio is noticeably longer or shorter than the song, the app tells you. A steady ratio usually means the tempo was read wrong; a big gap may mean the wrong file.
- **Offset** (Advanced): use it when audio and notes don't line up. Type milliseconds or press −/+. Each press is 1 ms; hold Shift for 10 ms, Alt for 100 ms. The line below says how early or late the audio is. The ↺ button next to Offset goes back to 0.

## Tracks

The **Tracks** section lists the tracks that have notes. Choose **List** or **Grid**:

- **List:** one compact row per track in the right column.
- **Grid:** one card per track, under the preview. Pick the number of columns or leave it on Auto. If the window is too narrow, fewer columns are shown and the app tells you.
- The ↺ button next to the layout or the number of columns goes back to the default (List, automatic columns).

For each track:

- **Colour swatch:** change the track's colour in the video. **Use project colour** goes back to the original.
- **Eye:** hide or show the track in the video.
- **S (solo):** only soloed tracks are shown.
- The top row controls all tracks: the eye hides or shows them all, S clears every solo.
- **Quick hide or solo:** press and hold an eye (or S) and drag up or down over other tracks; every track you pass gets the same state as the first one you pressed. The whole drag is one undo step.
- **Reorder** (Basic and Advanced): drag the six-dot handle, or select a row and press Alt+Up / Alt+Down. When notes overlap, the higher track is drawn on top.

Hiding, soloing and reordering only change the video, never your project file.

### Track details

Click a track name (or **Details**) to see its pitch range, fader level, pan, the automation it has and whether it is muted in your DAW.

**Base brightness** (Advanced): by default every note is equally bright. You can make notes brighter or dimmer with the track's volume:

- **Volume:** follows the volume automation in the project, changing through the song.
- **Fader level:** follows the fader position, the same for the whole song.
- **Pan**, **Mute:** experimental.
- **Floor** and **Ceiling** (dB): at or below Floor is darkest, at or above Ceiling is brightest.
- **Min / Max brightness:** limits how dark or bright notes get.
- **Invert:** loud is dark, quiet is bright.
- **Now** shows the track's brightness at the current position.
