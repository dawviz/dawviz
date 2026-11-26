---
name: dawviz
description: Make music-visualizer videos with DAW Visualizer (DawViz) from a DAW project file (Ableton .als/.alp, Reaper .rpp, FL Studio .flp, .dawproject, .mid). Use when the user wants a piano-roll / sheet-music / lyric / chord video of their song, wants to design or edit a DawViz preset (layers, timing, precomps, keyframes, phases), or wants an agent to drive the DawViz app and export MP4/WebM.
---

# DawViz: music videos from DAW projects

DAW Visualizer runs entirely in the browser: it reads the user's DAW project (notes, tempo, tracks), draws a video frame as a pure function of time, and exports MP4/WebM with WebCodecs. Nothing is uploaded anywhere. **Never send the user's project or audio files to any other service.**

Everything you design is one **preset JSON** (scene document, `schemaVersion` `0.8.0`): canvas, layers (widgets), when each layer appears, keyframes, precomps and phases. The same preset works in all three ways of working below. Read [references/preset.md](references/preset.md) before writing one; start from an example in `examples/`.

## 1. Pick how you will work

Check what tools you have, then follow one path:

| You have | Path | Read |
|---|---|---|
| Only chat (no browser, no terminal) | **A. Write the preset, the user loads it** | [references/preset.md](references/preset.md) |
| A browser you control (e.g. Claude in Chrome) | **B. Drive the app in the browser** | [references/gui.md](references/gui.md), and [references/api.md](references/api.md) if you can run JavaScript in the page |
| A terminal with Node 22+ | **C. Run the script** | [references/api.md](references/api.md), `scripts/dawviz.mjs --help` |

Where the app is: the public build at **https://dawviz.github.io/dawviz/app/** (no install, nothing is uploaded: it runs in the browser). Use another address only if the user gives one. In a clone of the repo, `npm install` then `npm run dev` serves it at `http://localhost:5173/`. Paths B and C add `?agent=1` to the address; that turns on `window.dawviz` and shows a banner telling the user an agent can control the window.

## 2. Workflow (all paths)

1. **Learn the song.** Ask for the project file (and the mixed audio if they want sound and the spectrum/level widgets). Path B/C: load it and read `status()` (duration, tracks, note counts). Path A: ask the user the song length, track names and the sections with their start times.
2. **Agree on a plan in one short message**: frame shape (9:16 for Shorts/Reels/TikTok, 16:9, 1:1), which layers, and when each appears (map them to the song's sections as phases). Keep the default look unless they ask for a style.
3. **Write the preset**, starting from the closest file in `examples/`. Use only fields described in `references/preset.md`; do not invent fields (unknown fields are dropped with a warning).
4. **Check it.** Path B/C: `validate(json)` must return `ok: true` with no warnings you did not intend. Path A: walk the checklist at the end of `references/preset.md`.
5. **Look at it.** Path B/C: grab frames at the start of each section with `frame(t)` (or `--frames` in the script) and look at them before going on. Fix overlaps, text that is too small or off the frame, and dark text on dark backgrounds.
6. **Export** only when the user wants the video: Path B/C `exportVideo({ resolution, fps, quality })`; Path A tell the user to press **Export video**.
7. **Report**: what you made, where the file is, and anything you could not do (for example, no H.264 encoder, so the file is WebM).

## 3. Path A: chat only

Give the user the preset in one ```json block, then these steps (use their language; button names are in [references/gui.md](references/gui.md)):

1. Open DAW Visualizer and press **Open file** to load the project (and add the mixed audio in **Song** if they have it).
2. In the **Video styles** column, press **Paste preset**, paste the JSON, press **Add preset**. Warnings appear under the column; send them back to you if there are any.
3. Check it in the **Editor** tab (the Timeline shows each layer's bars), then press **Export video**.

## 4. Path B: browser

- Open the app address with `?agent=1` (for the public build: `https://dawviz.github.io/dawviz/app/?agent=1`). If you can run JavaScript in the page, prefer `window.dawviz` ([references/api.md](references/api.md)): it is exact and every change is one undo step the user can see and undo.
- Otherwise click through [references/gui.md](references/gui.md). Prefer `data-testid` selectors and the visible button names listed there.
- Loading files: the user picks the project in the browser's file dialog (**Open file**); you cannot read files from their disk yourself. Then paste your preset with **Paste preset**.

## 5. Path C: terminal

```bash
cd <skill>/scripts && npm install          # once: installs playwright-core
node dawviz.mjs --repo /path/to/dawviz \
  --project song.rpp --audio mix.wav --preset my-video.json \
  --frames 0,8,40 --out-dir out --export out/video.mp4 --resolution 1080 --fps 30
```

Prints one JSON line (`ok`, project info, preset warnings, frame files, export file). Look at the frame PNGs before exporting a long video. With no `--url` and no `--repo`, it opens the public build. Use `--url` when the app is already running somewhere else, `--repo` to start it from a clone. MP4 (H.264) needs a browser with an H.264 encoder: Google Chrome (`--channel chrome`, tried first) and Playwright's Chromium both gave MP4 on Linux when tested; a browser without H.264 falls back to WebM and the script says so. Audio inside the MP4 is AAC when the machine can encode it, otherwise Opus (check `mime` and `ffprobe`). `node dawviz.mjs --validate my-video.json --repo …` checks a preset without a project. `--size 1080x1350` exports a custom width × height, `--range 45-105` only that section (seconds).

## Rules

- All times in the preset are **seconds from the start of the song** (inside a precomp: from the precomp's start). Beat/bar keyframe times stay tied to the music.
- Stay inside the limits in `references/preset.md` (64 layers per list, 32 precomps, 4 levels of nesting, 512 layers in total).
- Keep presets free of URLs, track names and file paths, so they can be shared.
- Changing something the user already edited by hand? Say what you will change first.
