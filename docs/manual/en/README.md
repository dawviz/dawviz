# DAW Visualizer user guide

DAW Visualizer turns your music project file into a video: notes scroll across a piano roll, with the song title, chords, a note counter and a clock. Everything runs in your browser. Your files are not sent anywhere.

This guide grows with the app. If something isn't in the app yet, it isn't described here.

[Tiếng Việt](../README.md)

## Contents

1. [Opening a project](01-open-a-project.md): which files open, missing `.mid` files, reading warnings.
2. [The Preview tab](02-preview.md): playback, video styles, audio, hiding or soloing tracks.
3. [The Editor tab](03-editor.md): arranging the blocks on the video frame, changing how notes look.
4. [The Settings tab](04-settings.md): light or dark, accent colour, opening and saving presets.
5. [Keyboard shortcuts](05-shortcuts.md).
6. [Exporting video](06-export-video.md): choose the size and format, follow progress, cancel.
7. [Testing video export](07-testing-export.md): help us try export on your computer and send the results.
8. [Putting live numbers into text](08-placeholders.md): the text box, `{bpm}`, `{title}`, `{notes}` and how to choose the number style.
9. [Sheet music](09-sheet-music.md): writing the notes as a score, playing notes that light up and grow, a hand-drawn look.
10. [Analysis widgets](10-analysis-widgets.md): tempo, bar and beat, key, velocity, density, pitch wheel, sections, lyrics, automation, note names.
11. [Using an AI agent](11-ai-agent.md): let an AI write presets or drive the app, three ways, `?agent=1`.

## Good to know

- **Basic and Advanced.** The first time you open the app, a dialog asks how you want to start: **I'm new to this** (Basic) or **I know video editing software** (Advanced); Esc means Basic. The app remembers your choice and doesn't ask again. After that, use the **Basic · Advanced** switch at the top right. Basic shows what you use most. Advanced shows every option. Switch any time; your settings stay.
- **Find a setting.** The **Find a setting…** box sits at the top of the right-hand panel (the Preview inspector and the Editor's widget properties). Type part of a setting's name, with or without accents: only the matching sections and boxes stay. In Basic mode, Advanced-only boxes that match still show up, without pressing **More options**. Type a section name (for example `Settings`) to see that whole section. Press Esc or clear the text to go back.
- **Undo.** Almost every change can be undone with Ctrl+Z (⌘Z on Mac). The clock button next to Undo/Redo lists your steps; click one to go back to that point.
- **The ↺ button.** It appears next to a setting you have changed, in every section (Position, Settings, Text, note look…). Click it to return that setting to the value of the video style or preset you applied last; for a widget you just added, to the default for its type. A faster way: hold Alt (Option on Mac) and click the setting's **label text** (not the input box). Each reset is its own undo step.
- **Hover over a button** to see its name and shortcut.

## Number fields

All number fields work the same way:

- Click the field, type a number, press Enter.
- You can type a sum: `120+40`, `1920/2`.
- Time fields (`1:30`, `90.5`) also accept arithmetic (`1:30+15`, `(2:00-0:10)/2`) and `+=10`, `-=0:05`, `*=2`, `/=2` like number fields.
- Type `+=10` to add 10 to the current value, `-=10` to subtract, `*=2` to double, `/=2` to halve.
- Hold the mouse on the field and drag up or down to change the value. Hold Shift while dragging for 10× faster, Alt for 10× slower.
- If the input can't be read, the field keeps its old value and says why just below.

## Known limits (demo)

- **Video export** is tested most on Chrome. Firefox exports more slowly (about twice as slow) and only asks where to save after the export finishes.
- **AAC audio** hasn't been tested on Windows and macOS. On Linux, Chrome and Firefox can't encode AAC, so the app uses another codec automatically (see [Export video](06-export-video.md)).
- **Sessions aren't saved:** closing or reloading the page loses your edits. Export the video before you close.
- **Phones and tablets aren't supported**; please use a computer.
- Only one tab can export a video at a time.

## Credits

Authors, the source of the Paper style, and fonts: [CREDITS.md](../../../CREDITS.md).
