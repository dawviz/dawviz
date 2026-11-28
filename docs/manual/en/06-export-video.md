# Exporting video

[Contents](README.md) · [Tiếng Việt](../06-xuat-video.md)

Click **Export video** at the top right (open a project first). The export dialog appears.

## Choose the settings

- **Size:** 720p, 1080p or 4K, measured on the short side of the frame. A square 1:1 frame gives 1080×1080, a wide 16:9 frame gives 1920×1080. The long side is at most 4096 px; odd numbers are rounded to even ones, and the dialog tells you when that happens.
- **Custom…** (last item of Size): type any **Width** and **Height** in pixels. While **Keep the video frame's shape** is on, changing one box works out the other from the ratio chosen in **Aspect ratio**: **Same as the video frame**, a ready-made ratio (16:9, 9:16, 1:1, 4:3, 3:4, 4:5, 21:9, 2.39:1) or **Other (W:H)…** to type your own such as `21:9` or `2.39`. Turn it off to enter a size with a different shape (for example 1080×1080 from a 16:9 frame): the video frame is centred and the rest is filled with the background colour, and the dialog says so. The short side must be at least 128 px and the long side at most 4096 px; odd numbers are rounded down to even ones. If the size is too small, **Start export** is disabled and the dialog says why.
- **Frame rate:** 24, 30 or 60.
- **Export:** **Whole song** (the default) or **A section**. Pick **A section**, then type the **Start** and **End** as `1:05.5` (minutes:seconds) or a number of seconds. The video and the audio cover exactly that section. The end must be at least one frame after the start, otherwise **Start export** is disabled.
- **Quality:** Low, Medium or High. High gives a larger file.

The summary line shows the real size, the length, the number of frames and the estimated file size. For the whole song the video runs 2 seconds past the end; if you loaded audio that is longer than the project, the video follows the audio.

The **File name** line shows the name the file will get: the project name, the size and the frame rate, for example `My-song_1920x1080_30fps.mp4`; a section adds the section, for example `My-song_1920x1080_30fps_0m45s-1m45s.mp4`. The name is fixed before the export starts, so Chrome and Edge suggest the right name when they ask where to save.

## Choose layers

**Layers (5/5)** lists the layers of the frame (top layer first), each with a tick box; all are ticked by default. Untick a layer to leave it out of this export; your project is unchanged. A precomp counts as one layer: ticking it includes the layers inside it. **Select all** ticks every layer again. At least one layer must stay ticked.

This list is there when the frame has two or more layers, for **Transparent PNG sequence** (in both modes) and for video in Advanced mode. A common use: export twice with the same size, frame rate and section, first only the background layer, then the other layers as a transparent PNG sequence, and stack them in your editor.

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

## Transparent PNG sequence

To lay DAW Visualizer's graphics over another video (After Effects, Premiere, DaVinci Resolve), choose **Transparent PNG sequence** at the top of the dialog. Each frame becomes a PNG with a transparent background (the frame's background colour and image are not drawn), named `name_1920x1080_30fps_000001.png`, `name_1920x1080_30fps_000002.png`… at the frame rate you chose.

- **Include the audio as a .wav file:** writes the audio of exactly the exported range as a `.wav` next to the images, so it lines up when you put it back together.
- In Chrome and Edge, press **Start export** and pick a folder: the images are written straight into it without using memory. Other browsers get one `.zip` file, which is kept in memory until it is ready, so the dialog warns when the estimate goes over 1 GB.
- The estimate line shows the number of images and the size (a generous estimate; usually smaller, since transparent areas compress very well).
- The dialog also tells you whether the browser can encode transparent WebM video (VP9 with alpha). This version always exports a PNG sequence.

In After Effects: **File › Import**, pick the first image, tick **PNG Sequence**, then set the frame rate to the one you exported at.

If an **Image** widget uses a picture that is not in this session (for example a preset opened from another computer), the dialog warns you before exporting; that widget stays blank in the video until you pick the file again.

## Check this computer

The **Check this computer** button at the bottom of the settings really encodes a few frames and one second of audio, then gives you a result you can copy. Use it when export doesn't work or when you want to help with testing: see [Testing video export](07-testing-export.md).

## Export and cancel

1. Click **Start export**. On Chrome and Edge the app first asks where to save the file, and writes the video straight to disk. Firefox and other browsers can't do this: the video is kept in memory and the **Save file** button, where you pick the location, only appears when the export has finished. This is normal, not an error.
2. The dialog shows a small picture of the frame being exported (refreshed about twice a second) with a tag naming the style, size, frame rate and format. Under it is the progress bar with the percentage, the frame count and the estimated time left.
3. **Cancel export** stops right away and leaves no half-written file. Your project is unchanged.

Click **Technical details** under the progress bar to see the speed (for example 2× means twice as fast as real time), the draw and encode time per frame, the number of font faces and the codecs in use. The drawing time turns yellow, with a note, when drawing is slowing down compared with the start. **Copy export report** copies a short text (no file names or project content) you can paste into a bug report.

Firefox is usually slower than Chrome. One known cause is that Firefox draws text more and more slowly on long songs; the app now reduces this, so a song of about 2.5 minutes takes around half a minute on our test machine, but it is still slower than Chrome. Saving after the export is not the cause.

Keep this tab open while exporting. The screen is kept awake when the browser allows it.

If an export is much slower than real time while your computer is idle, please report it with the result of the **Check this computer** button and the video style you used.

If a file is larger than 1 GB and the browser can't write straight to disk, the app warns you because memory may run out. Lower the size or use Chrome/Edge.

## Audio on Linux

On Ubuntu, both Chrome and Firefox currently report that they can't encode AAC. This is a browser limit; there is no fix inside the app, and we haven't found a library you could install that helps. In Basic mode the app steps down to another codec inside the MP4 (usually Opus), so the file still has sound. Opus plays in Chrome, Firefox, VLC, mpv and recent editors; older software may not open Opus audio in MP4. In that case use Advanced mode and pick **MOV** or **MKV** with **PCM** (uncompressed: a big file, but readable almost everywhere).

## With sheet music

If the frame has a Sheet music widget whose score is still being written, the dialog says "The sheet music is still being written" and lets you press **Start export** only once it is done, so the video does not miss the score.

## One export at a time

The app lets only one tab export at a time. A second tab says "Another tab is exporting a video" and disables **Start export** until the first one is done. Two exports at once compete for the encoder so both slow down a lot, and if both save to the same file name the one that finishes last silently overwrites the other.
