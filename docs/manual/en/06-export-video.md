# Exporting video

[Contents](README.md) · [Tiếng Việt](../06-xuat-video.md)

Click **Export video** at the top right (open a project first). The export dialog appears.

## Choose the settings

- **Size:** 720p, 1080p or 4K, measured on the short side of the frame. A square 1:1 frame gives 1080×1080, a wide 16:9 frame gives 1920×1080. The long side is at most 4096 px; odd numbers are rounded to even ones, and the dialog tells you when that happens.
- **Frame rate:** 24, 30 or 60.
- **Quality:** Low, Medium or High. High gives a larger file.

The summary line shows the real size, the length, the number of frames and the estimated file size. The video runs 2 seconds past the end of the song. If you loaded audio that is longer than the project, the video follows the audio.

## Format

**Basic mode:** the app picks the best format your browser can encode, in the same priority order popular video editors use:

1. **MP4 (H.264 + AAC)**, opens almost everywhere.
2. If the computer can't encode AAC, it's still **MP4 H.264** but the sound steps down to MP3, then Opus, then FLAC. The dialog tells you which one is used. Only if no audio codec works is the file silent.
3. If the browser can't encode H.264, the file is **WebM** (VP9, AV1 or VP8, with Opus). The app says so.

If none work, the app says so and suggests a smaller size or Chrome/Edge.

**Advanced mode:** three dependent drop-downs appear, top to bottom:

- **File format:** MP4, WebM, MOV or MKV.
- **Video codec:** only codecs that suit the chosen format and that this computer can encode (H.264, H.265, VP9, AV1, VP8).
- **Audio codec:** only codecs that suit the chosen format and that this computer can encode (AAC, MP3, Opus, FLAC, or uncompressed PCM for MOV and MKV), or **No audio**. It's locked if no audio is loaded.

When you change the format, the app keeps your codec if it still fits, otherwise it picks the first one in the list. Formats this computer can't encode video for aren't shown. PCM is uncompressed, so the file is much larger.

## Check this computer

The **Check this computer** button at the bottom of the settings really encodes a few frames and one second of audio, then gives you a result you can copy. Use it when export doesn't work or when you want to help with testing: see [Testing video export](07-testing-export.md).

## Export and cancel

1. Click **Start export**. On Chrome and Edge the app first asks where to save the file, and writes the video straight to disk. Firefox and other browsers can't do this: the video is kept in memory and the **Save file** button, where you pick the location, only appears when the export has finished. This is normal, not an error.
2. The progress bar shows the current frame, the speed (for example 2× means twice as fast as real time) and the estimated time left.
3. **Cancel export** stops right away and leaves no half-written file. Your project is unchanged.

Firefox is usually slower than Chrome (about twice as slow for the same scene in our tests) because encoding and drawing frames is slower there. Saving after the export is not the cause.

Keep this tab open while exporting. The screen is kept awake when the browser allows it.

If an export is much slower than real time while your computer is idle, please report it with the result of the **Check this computer** button and the video style you used.

If a file is larger than 1 GB and the browser can't write straight to disk, the app warns you because memory may run out. Lower the size or use Chrome/Edge.

## Audio on Linux

On Ubuntu, both Chrome and Firefox currently report that they can't encode AAC. This is a browser limit; there is no fix inside the app, and we haven't found a library you could install that helps. In Basic mode the app steps down to another codec inside the MP4 (usually Opus), so the file still has sound. Opus plays in Chrome, Firefox, VLC, mpv and recent editors; older software may not open Opus audio in MP4. In that case use Advanced mode and pick **MOV** or **MKV** with **PCM** (uncompressed: a big file, but readable almost everywhere).

## One export at a time

The app lets only one tab export at a time. A second tab says "Another tab is exporting a video" and disables **Start export** until the first one is done. Two exports at once compete for the encoder so both slow down a lot, and if both save to the same file name the one that finishes last silently overwrites the other.
