# The Settings tab

[Contents](README.md) · [Tiếng Việt](../04-cai-dat.md)

## App appearance

- **Light or dark:** Light, Dark, or Match system (follows your computer's setting). The moon/sun button at the top switches quickly too.
- **Accent colour:** the colour of buttons, the selected tab and other highlights.

These change the app only. The colours in the video come from the video style.

## Stage

**Print-proof frame around the preview:** adds crop marks at the four corners and a size label around the preview, like a print proof. They are never part of the exported video.

## Device latency

Sound always reaches you a little late through speakers or headphones, and the browser can only guess how late. If the picture in Preview doesn't line up with the sound (common with wireless headphones), measure the offset of the device you are using.

- Choose **Measure**, put on the device you listen with, then **tap the big button (or press Space) on beat 3 of every bar**. The test plays at 110 BPM for four bars, each being kick, kick, a snare sound on beat 3, then a rest. Tapping on the kicks too is fine; the app only uses the tap closest to beat 3.
- The result is the median of the four measurements, and at least three must be valid. If your taps differ by more than 30 ms, the app warns that the result may be off and suggests measuring again.
- **Save as new device** names the result (for example "Sony headphones"). If a device is already selected, **Update** writes the result into it. You can edit the name and the offset (ms) by hand at any time.
- In **Device**, pick the one you are using. **Automatic** adds no correction. The app can't tell devices apart by itself, so change this when you switch headphones.
- **Save device file** and **Open device file** move a device between computers. You can keep up to 16 devices.

The ↺ button next to the **Offset (ms)** field sets that device's offset back to 0.

This offset only shifts the picture against the sound while previewing on this computer. It doesn't change the audio, isn't part of the project's **Audio offset**, and isn't in presets, project packs or exported video.

The result is an estimate: it also includes the delay of your keyboard or mouse and whether you tend to tap early or late. If the picture still seems off, nudge it by a few milliseconds by hand.

The app saves your work in this browser about half a second after your last change. Next time you open the page, the song, audio, background image, tempo, layout and video style come back as you left them. Nothing is sent anywhere.

- **Save project pack** downloads a `.zip` with everything in the session: the project file, extra `.mid` files, audio, images and fonts you added, background image, the tempo you set, loaded schemas and the layout. Open the pack on another computer to get the same session.
- **Open project pack** loads such a pack. A pack that is damaged, edited, or made by a newer version of the app is refused with a message.
- **Discard saved session** deletes the copy kept in this browser (your own files are not touched). It asks once before deleting, because this cannot be undone.
- **Session files** lists the images and fonts you added (name, kind, size); the × button removes one from the session. A widget using a removed image goes blank, and the Export video dialog warns you before exporting.
- When browser storage is almost full, the app saves only the layout and settings; next time you have to load the project file and audio again. The app says which files.

## Preset (Video styles column)

A preset is a `.json` file that stores how the video is laid out: style, widget positions, note look, text styles. It never contains your project or audio, so it's safe to share.

Presets live in the **Video styles** column of the Preview tab, below Paper and Dark, not in Settings.

- **The plus tile** (dashed frame): pick a preset `.json` file (or a `.dawviz-preset.zip` pack, see below). It becomes a new tile, is applied to the open song and is remembered in this browser. You can undo it.
- **Paste preset** (below the plus tile): paste a preset's JSON text directly (for example one an AI chatbot wrote, see [Using an AI agent](11-ai-agent.md)) and press **Add preset**. Same result as picking a file; Ctrl+Enter adds it, Esc closes the box.
- **Each tile keeps its own work in progress.** Edit Paper, switch to Dark, and when you return to Paper your changes are still there; the tile shows "edited". Per-track colour overrides belong to the song and don't count as edits of the tile.
- Hover a tile to see its buttons: **↓ download** a `.json` of what you see (including edits), **×** (only shown when the tile is edited) returns the tile to its **original**, and your own presets also have a **bin** to remove them from the list. Reverting can still be undone with Ctrl+Z.
- The **duplicate** button (two stacked squares) creates a new preset from what you see, including edits. The source tile returns to its original and the edits move to the new tile.
- **Share as preset…** (below the plus tile): fill in **Name**, **Author**, **Licence (SPDX)** and **Description**, then **Download pack**. You get a `.dawviz-preset.zip` with the current frame plus the images (Image widget) and loaded fonts it uses. The licence is required and must allow sharing (CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, MIT, Apache-2.0, OFL-1.1, BSD, ISC). Only share images and fonts you are allowed to share.
- **Export presets…** (below that button): tick your saved presets, fill in **Name**, **Author**, **Licence** and **Description**, then **Download pack**. The pack holds several presets plus the images and fonts they use, **without** the project's timing and **without** any audio or DAW file. Picking exactly one preset gives a single-preset pack like the button above. To share how presets are used over time, share the whole project (Project Pack).
- **Opening a preset pack with several presets:** use the plus tile as for a single preset. All presets are added to the column, not applied to the song, and marked as not reviewed. If a preset has the **same name but different content**, the app asks for each one: **Overwrite** or **Rename** (keep both, the new one gets “(2)”). The default is Rename; nothing is overwritten unless you choose it.
- The plus tile also opens `.dawviz-preset.zip` packs. Images and fonts in the pack are added to the session. A pack with a note style, an easing curve or a particle setup is applied accordingly (note style on the Piano roll, curve into the Easing library, particles as a new Particles widget). Presets opened from a pack are always marked "not reviewed"; a pack that was edited (hash mismatch) or has a licence that is not allowed won't open.
- Every tile's work in progress is remembered in this browser, so reloading the page keeps it; clearing browser data removes it.
- Presets from an older version still open; the app says it upgraded them. Save again to keep the upgrade.
- Presets from a newer version need a newer app.
- If a preset uses a font the app doesn't have, the app tells you and draws the text with the default font. The font name stays in the preset.
- Values in a preset that are damaged or out of range are replaced with defaults, and the app lists where.
