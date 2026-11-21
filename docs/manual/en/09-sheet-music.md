# Sheet music

The **Sheet music** widget writes the notes of your project as a two-staff score (treble and bass clef), like printed music. While the song plays, the sounding notes light up and grow, and played notes change colour. The exported video looks exactly like the Preview.

## Add sheet music

1. Open the **Editor** tab, press **Add** at the top of the Layers list and choose **Sheet music**.
2. The app writes the score from the notes of your tracks. This takes from under a second to a few seconds depending on the song; meanwhile **Settings** shows "Writing the sheet music…".
3. When it is done, **Settings** shows the number of pages, bars and the key (for example "64 pages, 128 bars, key A minor"). If something needs your attention, a yellow line below explains it.

The ink colour follows the frame background: dark ink on a light background, light ink on a dark one.

## Choose tracks

Under **Tracks**, keep **All showing** or press **Choose** and keep only the melody and chord tracks. Drum tracks (channel 10) are always left out. With many instruments, choosing fewer tracks gives an easier score, because every note goes onto two staves like a piano part.

## Common settings

- **Music font**: **Engraved** (like printed music), **Handwritten** (pen strokes, handwritten text) or **Old style** (thin lines).
- **Bars per line**: bars on one line; 0 fits them to the width. **Lines per page**: when a page ends the next one appears.
- **Ink colour**, **Colour of the playing note**. Choose **Track colour** to colour playing notes by track.
- **Playing note size**: 1 means no growth; 1.35 is a third bigger.
- **Glow**: brightness of the halo around playing notes; 0 turns it off.
- **Playhead**: **None** (only the notes light up) or a moving **Line**.
- **Whole-score opacity**: fades everything (notes, staff, glow, playhead); 1 is fully opaque. Use it to make the score a background for other widgets.
- **Hand-drawn wobble**: makes the staff lines and symbols wave slightly as if drawn by hand; 0 turns it off. Goes well with the **Handwritten** font.
- **Whole-score glow**: adds a glow around every stroke on the page, not only the playing notes.
  - **Always on**: glows for the whole song.
  - **Pulse on the beat**, **Pulse on the bar**, **Pulse by seconds**: lights up, then goes dark, and repeats with the song's beat or by seconds.
  - **One glow cycle every …** (shown with the pulse modes): beats, bars or seconds per cycle. For example Pulse by seconds with 4 glows and fades every 4 seconds; Pulse on the beat with 0.5 does it every half beat.
  - **Pulse style**: **Breathe** (fades up and down), **Flash** (bright at the start of the beat, then fades out), **On / off** (on for the first half, off for the second).

## In Advanced mode

- **Shortest note** (eighth, sixteenth, thirty-second), **Allow triplets**, **Prefer simple rhythm**: decide how rhythm is rounded when writing. A higher **Prefer simple rhythm** gives fewer odd note values.
- **Voices per staff** (1 or 2) and **Lowest note on the treble staff** (MIDI number; 60 is middle C).
- **Key**: **Guess** or **Set**. When set, choose the **Key signature** and turn on **Minor key** if needed.
- **Bar numbers**, **Bar number size** (1 is the default, small; 2 is double; from 0.5 to 4) and **Tempo mark** at the start. Bar numbers appear at the start of each line.
- Colour and opacity of played notes, opacity of coming notes, **Staff and static symbols opacity** (staff lines, clef, bar numbers, ties): lower it for a faint staff with clear notes.
- **Size change**: **Pop** (grows, then returns within **Pop length**) or **While held** (stays big while the note sounds).
- **Glow size**, **Glow look**: **Halo** or **Soft (slower)**. Soft makes export slower, especially in Firefox.
- Playhead colour and width.
- **Wobble changes per second**: 0 keeps the wobble still; 8 to 12 makes the drawing feel alive. **Wobble seed**: change it for a different wobble.
- **Place on page** (top or middle) and **Page turn fade**.
- With **Whole-score glow**:
  - **Whole-score glow strength** and **Lowest glow**. A lowest glow above 0 keeps a faint glow when the pulse is off.
  - **Whole-score glow colour**: untick it and each stroke glows in its own colour. On a light background the app picks the playing-note colour, because a glow in dark ink looks like a smudge.
  - Whole-score glow makes export slower: Always on takes about half as long again; the pulse styles cost less.

Settings at the start of the list (music font, bars per line, bar number size, shortest note, triplets, key…) make the app write the score again. Colours, size, glow, playhead and wobble change at once.

## When the score looks wrong

- **Notes still light up on time.** The app rounds the rhythm only to write a readable score. The moment a note lights up comes from the real note, so the picture never drifts from the sound.
- **"Only …% of the notes sit on the beat grid"**: the song was played freely, without a click (for example recorded from a keyboard with no metronome). The rhythm in the score will be wrong. Build a tempo map for the song in your DAW and export the file again.
- **Messy rhythm with odd triplets and ties**: the song was played slightly off the beat. In Advanced, choose an eighth or sixteenth as **Shortest note**, turn off **Allow triplets** and raise **Prefer simple rhythm**.
- **"The key of the song is unclear"** or a wrong-looking key signature: choose **Key** → **Set** and pick the key signature.
- Very high or very low notes show many ledger lines; this version has no 8va sign yet.

## Exporting video

The score in the video matches the Preview exactly. If the sheet music is still being written, the Export video dialog says "The sheet music is still being written" and waits before **Start export** can be pressed.
