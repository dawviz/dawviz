# Putting live numbers into text

Text in the video can change with the music. Type the name of a value in curly brackets, for example `{bpm}`, and the video replaces it with the real value at every moment. It works in any text: a text box you add yourself, the title, clock labels, the note counter lines…

## Add a text box

1. Open the **Editor** tab, press **Add** at the top left of the Timeline and choose **Text box**.
2. The new box appears in the middle of the frame. Type in the **Text** field under **Settings**. Press Enter for a new line; click outside the field to apply.
3. Font, colour, outline, shadow and so on are in the **Text** section like any other text. **Values in the text** lets the numbers have a different look from the rest.

For example `{title} - {bpm} BPM` becomes `Demo Song - 120 BPM`.

Under each text box, the `{bpm}` and `{title}` buttons insert that name at the cursor with one click. Or type `{` and the app suggests the names; click one to insert it.

## In the built-in widgets

Built-in widgets look the same as before. In **Advanced** mode, the text of every line (title, artist, clock labels, the "no chord" text, and the templates of the note counter, live notes, chord and progress bar) can be edited and can use any value below.

## Values

| Type | Gives |
|---|---|
| `{title}`, `{artist}` | title and artist from the project |
| `{time}` | the playing position, like `1:35` |
| `{elapsed}` | same as `{time}` |
| `{remaining}` | time left |
| `{total_time}` | length of the whole song |
| `{bpm}` | tempo at that moment (up to two decimal places, trailing zeros dropped) |
| `{sig}` | time signature, like `4/4` |
| `{bar}`, `{beat}` | current bar and beat |
| `{phase}`, `{next_phase}` | name of the current phase and of the next one (empty when none) |
| `{phase_remaining}` | time until the next phase starts (last phase: until the end of the song) |
| `{phase_elapsed}` | time spent in the current phase |
| `{phase_no}` | phase number (1 is the first phase, 0 means before the first one) |
| `{chord}` | the chord being read; empty when there is none |
| `{notes}` | every note sounding now, low to high, like `C4 E4 G4` |
| `{rhythm}` | gaps between the most recent note onsets, in **sixteenth notes** (a sixteenth of a 4/4 bar), like `3 3 2`. Notes off the grid show a decimal (`2.5`) |
| `{bass}` | the lowest note of each recent onset: the degree against the **key note** (`1 1 4 ♭2`) when you set the key in the Editor, otherwise note names (`C2 C2 F2`) |
| `{lengths}` | lengths of the most recent notes as **fractions of a quarter note**, like `1/2 1/8 3/2` |
| `{pitch_classes}` | names of the notes sounding now, without octave, low to high: `C E G` |
| `{played}`, `{total}` | notes played so far, all notes |
| `{events_pct}` | percent of events so far (with `%` in the note counter, like `{pct}`) |
| `{events}`, `{events_total}` | events so far, all events; each note has two events (start and end), so the total is twice the note count |
| `{pct}` | share of notes played, whole number |
| `{key}` | the name of the key's tonic note (without major/minor); empty if unknown |
| `{degree}` | the degree of the sounding chord in the key, for example `VIm7`; if the key is unknown, the chord name |
| `{next_chord}`, `{next_degree}` | the next chord (a name different from the sounding chord) and its degree |
| `{chord_count}` | how many times the chord has changed up to now |
| `{lows}`, `{mids}`, `{highs}` | percent of the audio energy in the low (below 250 Hz), middle and high (above 4 kHz) bands |
| `{level}` | the current sound level in dB, over the last 400 ms |
| `{level_avg}`, `{peak_db}` | the average and the peak sound level in dB |

`{tempo}` is the old name of `{bpm}`: it still works and gives exactly the same result, but the app no longer suggests it.

Values follow the tracks that are showing (see the [Preview tab](02-preview.md) to hide or solo tracks). To make one widget read only some tracks, use **Tracks** in its **Settings**: **Choose** and click the tracks you want. Press and hold, then drag over several rows to select or clear them quickly (the whole drag is one undo step); **Select all** and **Clear all** sit above the list. The ↺ button beside **Tracks** (or Alt+click on that word) goes back to **All showing**. The text box has it in Basic mode; the note counter, live notes and chord have it in Advanced.

Note and chord names in the placeholders (`{notes}`, `{chord}`, `{bass}`, `{pitch_classes}`, `{name}`) follow the project-wide **Note names** setting. The [analysis widgets](10-analysis-widgets.md) have names of their own: Key (`{key}`, `{scale}`, `{confidence}`), Section name (`{section}`, `{next}`, `{next_in}`, `{section_no}`, `{section_elapsed}`), the Note grid's notes-sounding line (`{poly}`).

Some widgets have names of their own, and those win over the general ones: live notes has `{name}`, `{velocity}`, `{track}`, `{pitch}`; the progress bar has `{elapsed}`, `{total}`, `{remaining}`, `{pct}` for the song's time (there `{total}` is the song length, not the note count).

The key behind `{key}`, `{degree}` and `{next_degree}` is the tonic you set in the Editor; if none is set, it is found from the last 16 seconds.

`{lows}`, `{mids}`, `{highs}`, `{level}`, `{level_avg}` and `{peak_db}` need an audio file; with no audio they show "—". The level is dBFS from the average loudness (RMS), **not LUFS** (no ear-weighting filter).

## Choosing how a number looks

Add a colon and a pattern: `{name:pattern}`.

- **Numbers.** The zeros after the dot are the decimal places. The zeros before the dot are the minimum digits; shorter numbers get zeros in front.
  - `{bpm:0}` gives `120`, `{bpm:0.00}` gives `120.50`, `{bar:000}` gives `007`.
  - For `{bpm}`, `{tempo}`, `{bar}`, `{beat}`, `{played}`, `{total}`, `{pct}`, `{phase_no}`.
- **Time.** `m` is minutes, `ss` seconds, `S` thousandths of a second (1 to 3 letters).
  - `{time:m:ss}` gives `2:05`, `{time:mm:ss}` gives `02:05`, `{time:m:ss.SSS}` gives `2:05.789`, `{time:h:mm:ss}` gives `1:02:05`.
  - For `{time}`, `{elapsed}`, `{remaining}`, `{total_time}`, `{phase_elapsed}`, `{phase_remaining}`.
- **Note list.** What follows the colon goes between the notes: `{notes:, }` gives `C4, E4, G4`; `{notes:-}` gives `C4-E4-G4`. Works for `{notes}`, `{rhythm}`, `{bass}`, `{lengths}`, `{pitch_classes}`; for example `{bass: → }` gives `1 → 1 → 4 → ♭2`. These values use the 8 most recent note onsets of the visible tracks (or the tracks chosen for the widget).

With no pattern, the default look in the table above is used.

Percentages come without a `%` sign; type it yourself: `{pct}%`. (In the note counter and the progress bar, `{pct}` already includes `%`; the note counter also follows its **Decimal places** field. Type `{pct:0.0}` there for the bare number.)

## When you mistype

- An unknown name (`{bmp}`) or a wrong pattern (`{bpm:m:ss}`): the text stays as typed in the video and the app shows a warning when the preset opens.
- To show a real `{`, type two: `{{` gives `{`. For example `{{bpm}` gives `{bpm}`.
