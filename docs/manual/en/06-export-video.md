# Exporting video

[Contents](README.md) · [Tiếng Việt](../06-xuat-video.md)

Click **Export video** at the top right (open a project first). The export dialog appears.

## Choose the settings

- **Size:** 720p, 1080p or 4K, measured on the short side of the frame. A square 1:1 frame gives 1080×1080, a wide 16:9 frame gives 1920×1080. The long side is at most 4096 px; odd numbers are rounded to even ones, and the dialog tells you when that happens.
- **Frame rate:** 24, 30 or 60.
- **Quality:** Low, Medium or High. High gives a larger file.

The summary line shows the real size, the length, the number of frames and the estimated file size. The video runs 2 seconds past the end of the song. If you loaded audio that is longer than the project, the video follows the audio.

## Format

The app picks the best format your browser can encode:

1. **MP4 (H.264 + AAC)**, which plays almost everywhere.
2. **MP4 without sound**, when the computer can't encode AAC. The app says so.
3. **WebM (VP9 or VP8 + Opus)**, when the browser can't encode H.264. The app says so.

If none of the three works, the app tells you and suggests a smaller size or using Chrome or Edge.

## Check this computer

The **Check this computer** button at the bottom of the settings really encodes a few frames and one second of audio, then gives you a result you can copy. Use it when export doesn't work or when you want to help with testing: see [Testing video export](07-testing-export.md).

## Export and cancel

1. Click **Start export**. On Chrome and Edge the app first asks where to save the file, and writes the video straight to disk. Other browsers keep the file in memory and give you **Save file** when it's done.
2. The progress bar shows the current frame, the speed (for example 2× means twice as fast as real time) and the estimated time left.
3. **Cancel export** stops right away and leaves no half-written file. Your project is unchanged.

Keep this tab open while exporting. The screen is kept awake when the browser allows it.

If a file is larger than 1 GB and the browser can't write straight to disk, the app warns you because memory may run out. Lower the size or use Chrome/Edge.
