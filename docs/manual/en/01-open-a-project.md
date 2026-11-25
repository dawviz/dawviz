# Opening a project

[Contents](README.md) · [Tiếng Việt](../01-mo-du-an.md)

## Open a file

Drop your project file in the middle of the screen, or click there to choose one. When a project is already open, use **Open file** at the top to open another. If the new file can't be opened, the current project stays open.

The app reads:

| Software | File |
|---|---|
| Ableton Live | `.als`, `.alp` packs |
| Reaper | `.rpp` |
| FL Studio 12 or newer | `.flp` |
| Bitwig Studio, Studio One and other software that saves DAWproject | `.dawproject` |
| Any software that exports MIDI | `.mid`, `.midi`, or `.kar` (karaoke MIDI: the same format as `.mid`, with the lyrics stored in the file) |

Don't have a project at hand? On the first screen click **Try the sample project** to open a ready-made one.

**FL Studio:** `.flp` files from version 12 or newer open directly. Each instrument in the Channel Rack becomes a track, and only the notes of Patterns placed on the Playlist are shown. Audio clips and plugins are not read, and automation is read only for track volume and pan (other kinds are skipped, with a warning). The tempo is the project's starting tempo; if the song changes tempo along the way, enter the tempo in the **BPM** box or use the tempo table in Advanced mode (see [Preview](02-preview.md)). For versions older than 12, or to show Patterns that aren't on the Playlist: in FL Studio choose File → Export → MIDI file, then open the `.mid` you exported.

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

## Formats that need a schema

A file with an unknown extension, or a binary format with no built-in reader (for example `.flp`, `.bwproject`), shows the **This format needs a schema** box. Press **Load schema** and choose a `.json` file that describes your file's structure ([how to write a schema](https://github.com/dawviz/dawviz/blob/main/schemas/README.md)). The schema is checked before use; if it doesn't match, the app says so and the file isn't read. Press **Remove** to unload a schema. Schemas travel with the project pack when you save one.

## No notes at all

If the file opens but no notes are found:

- Reaper: check whether external `.mid` files are missing (see above).
- `.alp` packs: try another song in the pack.
- Ableton Live: check that the clips are in Arrangement view.
- A `.mid` from other software: open it again in that software and check it has notes.
