# `window.dawviz` (paths B and C)

Available only when the app address has `?agent=1` (a banner says so). Every method is `async`; results are plain JSON. Every change goes through the same undoable commands as the buttons, so the user sees it and can press Ctrl+Z. Files are passed as a real `File`, or as `{ name, base64 }` / `{ name, text }` when your tool can only send JSON.

| Method | Does | Returns |
|---|---|---|
| `status()` | current state | `{ version, busy, project: { name, duration, tracks: [{ id, name, notes }] } \| null, audio, tab, t, playing, videoStyle, styles, userPresets, history, problems }` |
| `loadProject(main, ...extras)` | load a DAW project (`.als .alp .rpp .flp .dawproject .mid`; extras: external MIDI, schema), waits until parsed | `status()` |
| `loadAudio(file)` | load the mixed audio (WAV, MP3, FLAC, OGG, M4A) | `status()` |
| `getScene()` | the scene in use (preset JSON) | scene |
| `validate(json)` | check a preset without applying it (object or JSON text) | `{ ok: true, warnings: [{ code, message, path }], scene }` or `{ ok: false, error: { code, message, path } }` |
| `setScene(json)` | apply a preset as one undo step | `{ ok, warnings }` or the error |
| `addPreset(json, name?)` | add it to the **Video styles** column (like the + button) and apply it | `status()` |
| `pickStyle(id)` / `pickPreset(id)` | click a built-in style (`status().styles`) / a saved preset (`status().userPresets`) | `status()` |
| `seek(t)`, `play()`, `pause()` | playhead (seconds) | |
| `setTab('preview' \| 'editor' \| 'settings')` | switch tab | |
| `undo()`, `redo()` | history | `{ canUndo, canRedo, undoLabel }` |
| `frame(t?, width = 960)` | render the frame at `t` (default: playhead) | PNG data URL, so you can look at the result |
| `exportVideo({ resolution: 720\|1080\|2160, fps: 24\|30\|60, quality: 'low'\|'medium'\|'high', kind: 'video'\|'png', download = true })` | export without any save dialog; `download` saves it like the **Save file** button | `{ name, bytes, ms, mime }` |
| `lastExport()` | the last exported file | `{ name, mime, base64 }` or `null` |

Typical session (Claude in Chrome's JavaScript tool, or `page.evaluate` in Playwright):

```js
await dawviz.status();                       // has the user opened the project yet?
const v = await dawviz.validate(myPreset);   // fix every warning first
await dawviz.setScene(myPreset);
const png = await dawviz.frame(8);           // look at it
await dawviz.exportVideo({ resolution: 1080, fps: 30 });
```

Notes:

- `exportVideo` picks MP4 (H.264 + AAC) when the browser has the encoders, otherwise WebM; check `mime`. Exports run in a worker: a 3-minute 1080p video takes a few minutes. One export at a time per browser.
- `problems` in `status()` are the warnings/errors the app is showing (parse warnings, preset warnings, export issues).
- Path C wraps all of this in `scripts/dawviz.mjs`; run it with `--help`.
