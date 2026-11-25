# Writing a DawViz preset (scene JSON, schemaVersion 0.8.0)

The preset is the whole video design. The app reads it with a forgiving checker: wrong values fall back to defaults **with a warning**, unknown fields are dropped, and only broken structure is an error. Your goal is a preset with **no warnings**. The full JSON Schema is `presets/schema/scene.schema.json` in the repo; the examples in `../examples/` pass the repo's checker (`npm run preset:check -- --community file.json`).

## Skeleton

```json
{
  "schemaVersion": "0.8.0",
  "presetName": "My video",
  "author": "",
  "canvas": { "aspectRatio": "9:16", "designWidth": 1080, "designHeight": 1920, "backgroundColor": "#0c0e16", "backgroundImageData": null,
              "snapping": { "gridEnabled": true, "gridSize": 8, "smartGuidesEnabled": true } },
  "phases": [ { "name": "Intro", "start": 0 }, { "name": "Chorus", "start": 42.5 } ],
  "widgets": [ … layers … ],
  "comps": { … precomps … }
}
```

- **Canvas**: points, not pixels (export scales). 9:16 = 1080 × 1920, 16:9 = 1920 × 1080, 1:1 = 1080 × 1080. Any size 256–4096 works.
- **phases**: the song's sections, sorted by `start` (seconds). Each lasts until the next. Used by the text placeholders `{phase}`, `{next_phase}`, `{phase_remaining}`, and shown on the Timeline's Phases lane.
- `textStyles`, `tonic` (0 = C … 11 = B) and `noteNaming` are optional; leave them out unless needed.

## A layer (widget)

```json
{ "id": "title", "type": "TEXT", "name": "Title", "zIndex": 20, "visible": true,
  "layout": { "x": 90, "y": 240, "width": 900, "height": 200, "rotation": 0, "anchor": { "x": 0.5, "y": 0.5 } },
  "trackMappingMode": "ALL", "assignedTrackIndices": [],
  "properties": { "text": "{title}", "align": "center", "style": { "styleId": "title", "size": 110, "color": "#ffffff" } },
  "visibility": { "ranges": [ { "from": 0, "to": 8 } ], "fadeIn": 0.5, "fadeOut": 0.5 } }
```

- `id`: unique in its list, 1–64 characters, **no `/`**. `name`: optional label shown in the layer list (unique, ≤ 60 characters).
- `zIndex`: higher is drawn on top. `layout` is the box in canvas points; `x`, `y` is the top-left corner; `rotation` in degrees around `anchor` (0–1 of the box).
- `properties`: **only the ones you change**. Anything left out gets the widget's default, so a minimal layer is `{ "id", "type", "layout" }`.
- `trackMappingMode`: `ALL` (every visible track) or `MANUAL` with `assignedTrackIndices` (track numbers from the project, 0-based).
- `parent`: id of another layer in the same list; the child follows the parent's movement, rotation, scale and opacity changes.

### Layer types and the properties worth knowing

| type | what it shows | useful properties (defaults in brackets) |
|---|---|---|
| `PIANO_ROLL` | scrolling notes | `visibleSeconds` [4.3] seconds across the width, `scrollMode` `SCROLL`/`PAGE`, `pitchRangeMode` `CUSTOM`/`FIT_CONTENT` with `pitchMin`/`pitchMax` (MIDI), `keyboard.enabled`, `playheadPositionRatio` [0.3], `playheadVisible`, `noteStyle.base` (colours, glow, `cornerRadius`, `heightScale`) |
| `TEXT` | any text | `text` (with placeholders), `align` `left`/`center`/`right`, `style` `{ styleId, size, color, weight, italic, font }` |
| `TRACK_INFO` | title + artist | `titleText`, `artistText` (empty = from the project), `align` |
| `CHORD_DETECTION` | chord name | `mode` `sustained`/`strike`, `noChordText` ["N.C."], `alwaysShowNotes`, `nameStyle`, `notesStyle` |
| `PROGRESS_BAR` | progress line | `orientation`, `thickness` [12], `progressColor`, `trackColor`, `showTime`, `timeTemplate` ["{elapsed} / {total}"] |
| `TIME_BAR` | time / bar.beat | `showBars`, `barColor` |
| `EVENT_COUNTER` | notes played | `align`, `decimals` |
| `LIVE_TRIGGER` | notes being played | `mode` `list`/`inline`, `template`, `maxLines` |
| `NOTATION` | sheet music | `barsPerSystem` [2], `inkColor`, `activeColor` |
| `AUDIO_SPECTRUM` | spectrum (needs audio) | `style` `BARS`/`AREA`/`LINE`/`DOTS`/`SCOPE`/`WAVE`/`METER`, `shape` `LINE`/`CIRCLE`, `bars` [48], `color` |
| `PARTICLES` | particles on notes | `originX` `NOTE` (sparks where notes hit the playhead) |
| `SECTION`, `LYRICS`, `TEMPO_INFO`, `BAR_BEAT`, `KEY_SCALE`, `VELOCITY`, `DENSITY`, `PITCH_WHEEL`, `ARRANGEMENT`, `DRUM_PAD`, `AUTOMATION` | analysis widgets | leave properties out at first |

`IMAGE` needs an image file the user adds in the app; do not use it in a preset you write. Text styles available as `styleId`: `title`, `subtitle`, `heading`, `body`, `caption`, `label`, `counter`, `clock`, `tiny`. On a dark background always set a light `color`.

**Placeholders** in any text: `{title}` `{artist}` `{time}` `{elapsed}` `{remaining}` `{total_time}` `{bpm}` `{bar}` `{beat}` `{sig}` `{chord}` `{bass}` `{notes}` `{played}` `{total}` `{pct}` `{events}` `{phase}` `{next_phase}` `{phase_elapsed}` `{phase_remaining}` `{phase_no}`. Formats: `{bpm:0}`, `{remaining:m:ss}`. Unknown names give a warning.

## When a layer appears: `visibility`

```json
"visibility": { "ranges": [ { "from": 8, "to": 40 }, { "from": 60, "to": null } ], "fadeIn": 0.5, "fadeOut": 0.5 }
```

- Seconds; `to: null` = until the end. Leave `visibility` out to show the layer for the whole song. Up to 32 ranges; `to` must be after `from`.
- `fadeIn`/`fadeOut` (0–30 s) apply at the edges of every range. These are the bars and fade handles on the Timeline.

## Colours

A colour is `#rrggbb`, or `#rrggbbaa` when it should be translucent (`aa` is the alpha, `ff` opaque). Both forms are accepted for widget, text and note colours; `canvas.backgroundColor` stays `#rrggbb`. A preset with only `#rrggbb` renders exactly as before.

## Animation

**Keyframes** (`animate`, path → track). Paths: `layout.x`, `layout.y`, `layout.width`, `layout.height`, `layout.rotation`, `opacity` (0–1), `scale` (percent, 100 = normal), and number/colour properties by name (e.g. `color`, `thickness`, `glow`).

```json
"animate": {
  "opacity": { "keys": [ { "at": { "sec": 8 }, "value": 0 }, { "at": { "sec": 9 }, "value": 1, "ease": "easeOutCubic" } ] },
  "scale":   { "keys": [ { "at": { "bar": 17 }, "value": 100 }, { "at": { "bar": 17, "beat": 3 }, "value": 120, "interp": "smooth" } ] }
}
```

- `at`: `{ "sec": s }`, or musical `{ "bar": n, "beat": b }` (1-based), `{ "beat": n }` (0-based), `{ "tick": n }`. Musical times follow tempo changes.
- `ease` (on the key you arrive at): a name — `linear`, `easeIn|Out|InOut` + `Sine|Quad|Cubic|Quart|Quint|Expo|Circ|Back|Elastic|Bounce` (e.g. `easeOutCubic`), `hold` — or an object: `{ "cubicBezier": [x1, y1, x2, y2] }`, `{ "steps": 4 }`, `{ "spring": { "stiffness": 170, "damping": 26 } }`. Anything else falls back to linear with a warning. `interp`: `linear` (default), `hold` (jump), `smooth`.
- Up to 24 animated paths per layer, 256 keys each.

**Follow the music** instead of keyframes: `{ "bind": "<source>", "from": [a, b], "to": [c, d] }` maps the source range to the value range. Sources: `beat.phase`, `bar.phase` (0→1 each beat/bar), `progress` (song 0→1), `notes.count`, `notes.velocity`, `note.hit` (jumps on each note then decays), `track.volume`, `track.pan`, `audio.level` (needs audio).

**Motion** (entrance, exit, loop) for any layer:

```json
"motion": { "enter": { "effect": "slide-from-bottom", "sec": 0.6, "ease": "easeOutCubic" },
            "exit": { "effect": "fade", "sec": 0.4, "ease": "easeInCubic" },
            "loop": { "effect": "breathe", "amount": 0.1, "every": 1, "unit": "BEATS" } }
```

Enter/exit effects: `fade`, `slide-from-left`, `slide-from-right`, `slide-from-top`, `slide-from-bottom`, `pop`, `zoom`, `drop`, `spin`; they play at the start/end of each visibility range. Loops: `breathe`, `float`, `sway`, `pulse`, `blink`, `wobble`. Use `null` for a part you do not want.

## Precomps (groups with their own timeline)

A precomp is a list of layers stored once in `comps` and placed on the timeline by a layer of type `COMP`:

```json
"widgets": [
  { "id": "intro", "type": "COMP", "name": "Intro", "zIndex": 50, "visible": true,
    "layout": { "x": 0, "y": 0, "width": 1920, "height": 1080, "rotation": 0, "anchor": { "x": 0.5, "y": 0.5 } },
    "trackMappingMode": "ALL", "assignedTrackIndices": [],
    "properties": { "comp": "intro", "start": 0, "speed": 1 },
    "visibility": { "ranges": [ { "from": 0, "to": 8 } ], "fadeIn": 0.6, "fadeOut": 0.8 } }
],
"comps": { "intro": { "name": "Intro", "widgets": [ … layers of the intro … ] } }
```

- The COMP layer is always the size of the canvas (`layout.width/height` = canvas). Move, rotate, fade, `scale` (keyframes), `motion` and `visibility` on it apply to everything inside.
- Inside the comp, times count from the comp's `start` (seconds on the parent timeline), multiplied by `speed` (0.1–10). Musical keyframes, notes and chords still follow the song.
- Comps can contain COMP layers (up to 4 levels, no loops). One comp may be placed by several COMP layers.
- Limits: 32 comps, 64 layers per list, 512 layers once everything is expanded.
- Good uses: an intro card group, one look per section of the song (one precomp per section, each with its own range).

## Checklist before handing over

1. `schemaVersion` is `"0.8.0"`, `canvas` matches the shape the user wants.
2. Every `id` is unique in its list and has no `/`; every `parent` and every COMP `properties.comp` exists.
3. Every layer box is inside the canvas (unless it slides in on purpose); nothing important overlaps.
4. Text has a size and a colour that reads on the background; placeholders are from the list above.
5. Visibility ranges and keyframes are in seconds within the song length; phases are sorted.
6. No URLs, file paths or the user's private data in the preset.
7. Path B/C: `validate()` returned `ok: true` and no warnings; you looked at frames at the start of every section.
