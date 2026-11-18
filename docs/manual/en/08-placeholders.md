# Putting live numbers into text

Text in the video can change with the music. Type the name of a value in curly brackets, for example `{bpm}`, and the video replaces it with the real value at every moment. It works in any text: a text box you add yourself, the title, clock labels, the note counter lines…

## Add a text box

1. Open the **Editor** tab, press **Add** at the top of the Layers list and choose **Text box**.
2. The new box appears in the middle of the frame. Type in the **Text** field under **Settings**. Press Enter for a new line; click outside the field to apply.
3. Font, colour, outline, shadow and so on are in the **Text** section like any other text. **Values in the text** lets the numbers have a different look from the rest.

For example `{title} - {bpm} BPM` becomes `Demo Song - 120 BPM`.

Type `{` and the app suggests the names; click one to insert it.

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
| `{chord}` | the chord being read; empty when there is none |
| `{notes}` | every note sounding now, low to high, like `C4 E4 G4` |
| `{played}`, `{total}` | notes played so far, all notes |
| `{pct}` | share of notes played, whole number |

`{tempo}` is the old name of `{bpm}`: it still works and gives exactly the same result, but the app no longer suggests it.

Values follow the tracks that are showing (see the [Preview tab](02-preview.md) to hide or solo tracks). To make one widget read only some tracks, use **Tracks** in its **Settings**: **Choose** and tick the tracks you want. The text box has it in Basic mode; the note counter, live notes and chord have it in Advanced.

Some widgets have names of their own, and those win over the general ones: live notes has `{name}`, `{velocity}`, `{track}`, `{pitch}`; the progress bar has `{elapsed}`, `{total}`, `{remaining}`, `{pct}` for the song's time (there `{total}` is the song length, not the note count).

## Choosing how a number looks

Add a colon and a pattern: `{name:pattern}`.

- **Numbers.** The zeros after the dot are the decimal places. The zeros before the dot are the minimum digits; shorter numbers get zeros in front.
  - `{bpm:0}` gives `120`, `{bpm:0.00}` gives `120.50`, `{bar:000}` gives `007`.
  - For `{bpm}`, `{tempo}`, `{bar}`, `{beat}`, `{played}`, `{total}`, `{pct}`.
- **Time.** `m` is minutes, `ss` seconds, `S` thousandths of a second (1 to 3 letters).
  - `{time:m:ss}` gives `2:05`, `{time:mm:ss}` gives `02:05`, `{time:m:ss.SSS}` gives `2:05.789`, `{time:h:mm:ss}` gives `1:02:05`.
  - For `{time}`, `{elapsed}`, `{remaining}`, `{total_time}`.
- **Note list.** What follows the colon goes between the notes: `{notes:, }` gives `C4, E4, G4`; `{notes:-}` gives `C4-E4-G4`.

With no pattern, the default look in the table above is used.

Percentages come without a `%` sign; type it yourself: `{pct}%`. (In the note counter and the progress bar, `{pct}` already includes `%`; the note counter also follows its **Decimal places** field. Type `{pct:0.0}` there for the bare number.)

## When you mistype

- An unknown name (`{bmp}`) or a wrong pattern (`{bpm:m:ss}`): the text stays as typed in the video and the app shows a warning when the preset opens.
- To show a real `{`, type two: `{{` gives `{`. For example `{{bpm}` gives `{bpm}`.
