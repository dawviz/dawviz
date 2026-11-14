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

The left column lists the video styles. Each thumbnail is drawn from your own song. Click one to switch. A style sets the background colour, the note look, the text and where each block sits on the frame.

Once you change something, the style name shows "edited". Picking another style replaces everything, but Ctrl+Z brings the previous one back.

Above the frame you can see its size and shape (for example `1,080 × 1,080 · 1:1`) and the name of the style in use.

## Song

The **Song** section on the right shows the file name, format, length, tempo, number of tracks and number of notes.

### Load audio

Click **Load audio** and choose the mix of the song (WAV, MP3, OGG, FLAC or M4A). It plays along with the video. This is optional: without audio the video still plays.

- **Replace audio** chooses another file, **Remove** takes it away.
- If the audio is noticeably longer or shorter than the song, the app tells you. A steady ratio usually means the tempo was read wrong; a big gap may mean the wrong file.
- **Offset** (Advanced): use it when audio and notes don't line up. Type milliseconds or press −/+. Each press is 1 ms; hold Shift for 10 ms, Alt for 100 ms. The line below says how early or late the audio is.

## Tracks

The **Tracks** section lists the tracks that have notes. Choose **List** or **Grid**:

- **List:** one compact row per track in the right column.
- **Grid:** one card per track, under the preview. Pick the number of columns or leave it on Auto. If the window is too narrow, fewer columns are shown and the app tells you.

For each track:

- **Colour swatch:** change the track's colour in the video. **Use project colour** goes back to the original.
- **Eye:** hide or show the track in the video.
- **S (solo):** only soloed tracks are shown.
- The top row controls all tracks: the eye hides or shows them all, S clears every solo.
- **Reorder** (Advanced): drag the six-dot handle, or select a row and press Alt+Up / Alt+Down. When notes overlap, the higher track is drawn on top.

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
