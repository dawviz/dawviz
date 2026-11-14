# Opening a project

[Contents](README.md) · [Tiếng Việt](../01-mo-du-an.md)

## Open a file

Drop your project file in the middle of the screen, or click there to choose one. When a project is already open, use **Open file** at the top to open another. If the new file can't be opened, the current project stays open.

The app reads:

| Software | File |
|---|---|
| Ableton Live | `.als`, `.alp` packs |
| Reaper | `.rpp` |
| Bitwig Studio, Studio One and other software that saves DAWproject | `.dawproject` |
| Any software that exports MIDI | `.mid` |

**FL Studio:** `.flp` files can't be opened directly yet. In FL Studio choose File → Export → MIDI file, then open the `.mid` you exported.

**Bitwig:** `.bwproject` files can't be opened directly yet. Save as `.dawproject` instead (File → Export → DAWproject).

**Ableton Live:** only clips in Arrangement view are read. Clips that exist only in Session view won't show.

**`.alp` packs** can hold several songs. The app picks the largest one and tells you.

## Reaper projects that use external `.mid` files

Some Reaper projects don't keep their notes inside the `.rpp` file; they point to `.mid` files next to it. In that case the app shows a box listing the files it still needs.

- Click **Add .mid files…** or drop the files on the box. You don't need to choose the `.rpp` again.
- The files are usually next to the project file or in the project's Media folder.
- Names are matched ignoring upper and lower case; spaces and underscores count as the same.
- You can also choose the `.rpp` and its `.mid` files together from the start.

## Warnings

If something in the file needs your attention, a yellow bar appears above the preview, for example "2 warnings". Click it to see the full list. Each warning has a **Technical detail** part in case you want to report a problem.

Warnings don't stop you from working. Common ones:

- **No tempo found:** 120 BPM is used. If the song isn't at 120 BPM, the notes will drift from the audio.
- **Some notes never ended:** those notes are extended to the end of the song.
- **Some automation isn't read yet:** the picture is still right; only brightness that follows automation may be missing.
- Warnings marked **[to be verified]** are places where the app had to guess how to read the file. If notes look off exactly there, please tell us, with the file if you can.

## No notes at all

If the file opens but no notes are found:

- Reaper: check whether external `.mid` files are missing (see above).
- `.alp` packs: try another song in the pack.
- Ableton Live: check that the clips are in Arrangement view.
- A `.mid` from other software: open it again in that software and check it has notes.
