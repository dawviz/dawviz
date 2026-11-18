# The Settings tab

[Contents](README.md) · [Tiếng Việt](../04-cai-dat.md)

## App appearance

- **Light or dark:** Light, Dark, or Match system (follows your computer's setting). The moon/sun button at the top switches quickly too.
- **Accent colour:** the colour of buttons, the selected tab and other highlights.

These change the app only. The colours in the video come from the video style.

## Stage

**Print-proof frame around the preview:** adds crop marks at the four corners and a size label around the preview, like a print proof. They are never part of the exported video.

## Session

The app saves your work in this browser about half a second after your last change. Next time you open the page, the song, audio, tempo, layout and video style come back as you left them. Nothing is sent anywhere.

- **Save project pack** downloads a `.zip` with everything in the session: the project file, extra `.mid` files, audio, the tempo you set, loaded schemas and the layout. Open the pack on another computer to get the same session.
- **Open project pack** loads such a pack. A pack that is damaged, edited, or made by a newer version of the app is refused with a message.
- **Discard saved session** deletes the copy kept in this browser (your own files are not touched).
- When browser storage is almost full, the app saves only the layout and settings; next time you have to load the project file and audio again. The app says which files.

## Preset

A preset is a `.json` file that stores how the video is laid out: style, widget positions, note look, text styles. It never contains your project or audio, so it's safe to share.

- **Save preset…** downloads a preset of the video you're working on.
- **Open preset…** applies a preset to the open song. You can undo it.
- Presets from an older version still open; the app says it upgraded them. Save again to keep the upgrade.
- Presets from a newer version need a newer app.
- If a preset uses a font the app doesn't have, the app tells you and draws the text with the default font. The font name stays in the preset.
- Values in a preset that are damaged or out of range are replaced with defaults, and the app lists where.
