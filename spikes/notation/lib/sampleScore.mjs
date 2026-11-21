// Bản mẫu S1: khuông đôi 2 ô nhịp, có tam liên, nối chùm, dấu nối, hợp âm, dấu hoá, nốt lặng, tempo.
// Dùng chung cho Node (RecordingContext) và trình duyệt (CanvasContext/SVGContext thật) để so ảnh.
export function drawSample(VF, ctx, { frame = (el) => el.setContext(ctx).draw() } = {}) {
  const { Stave, StaveNote, Voice, Formatter, Beam, Tuplet, StaveTie, StaveConnector, Accidental } = VF;
  const n = (keys, duration, clef = 'treble', id) => {
    const s = new StaveNote({ keys, duration, clef });
    if (id) s.setAttribute('id', id);
    return s;
  };
  const W = 360, X0 = 20, Y0 = 40, GAP = 110;
  const t1 = new Stave(X0, Y0, W).addClef('treble').addKeySignature('F').addTimeSignature('4/4').setTempo({ duration: 'q', bpm: 180 }, -10).setMeasure(1);
  const b1 = new Stave(X0, Y0 + GAP, W).addClef('bass').addKeySignature('F').addTimeSignature('4/4');
  const t2 = new Stave(X0 + W, Y0, 300);
  const b2 = new Stave(X0 + W, Y0 + GAP, 300);

  // Ô 1, khoá Sol
  const tri = [n(['c/5'], '8', 'treble', 'n1'), n(['d/5'], '8', 'treble', 'n2'), n(['e/5'], '8', 'treble', 'n3')];
  const q1 = n(['b/4'], 'q', 'treble', 'n4');
  const e2 = [n(['f/5'], '8', 'treble', 'n5'), n(['g/5'], '8', 'treble', 'n6')];
  const ch1 = n(['a/4', 'c/5', 'f/5'], 'q', 'treble', 'n7');
  const tv1 = [...tri, q1, ...e2, ch1];
  // Ô 2, khoá Sol
  const ch2 = n(['a/4', 'c/5', 'f/5'], 'q', 'treble', 'n8');
  const s16 = [n(['g/5'], '16', 'treble', 'n9'), n(['f/5'], '16', 'treble', 'n10'), n(['e/5'], '16', 'treble', 'n11'), n(['d/5'], '16', 'treble', 'n12')];
  const h2 = n(['c#/5'], 'h', 'treble', 'n13');
  const tv2 = [ch2, ...s16, h2];
  // Khoá Fa
  const bv1 = [n(['f/2', 'c/3', 'f/3'], 'w', 'bass', 'n14')];
  const bv2 = [n(['b/2', 'd/3'], 'h', 'bass', 'n15'), n(['d/3'], 'qr', 'bass', 'r1'), n(['c/3'], 'q', 'bass', 'n16')];

  const tuplet = new Tuplet(tri); // phải tạo trước khi thêm vào Voice (đổi số tick)
  const voice = (notes) => new Voice({ numBeats: 4, beatValue: 4 }).addTickables(notes);
  const T1 = voice(tv1), B1 = voice(bv1), T2 = voice(tv2), B2 = voice(bv2);
  Accidental.applyAccidentals([T1, B1], 'F');
  Accidental.applyAccidentals([T2, B2], 'F');
  const beams = [...Beam.generateBeams(tv1), ...Beam.generateBeams(tv2)];

  // Căn hai khuông cùng một Formatter cho mỗi ô
  const fmt = (top, bot, staveT, staveB) => {
    const f = new Formatter();
    f.joinVoices([top]).joinVoices([bot]);
    const startX = Math.max(staveT.getNoteStartX(), staveB.getNoteStartX());
    staveT.setNoteStartX(startX); staveB.setNoteStartX(startX);
    f.format([top, bot], staveT.getNoteEndX() - startX - 10);
  };
  fmt(T1, B1, t1, b1);
  fmt(T2, B2, t2, b2);

  for (const s of [t1, b1, t2, b2]) frame(s);
  const brace = new StaveConnector(t1, b1).setType('brace');
  const left = new StaveConnector(t1, b1).setType('singleLeft');
  const right = new StaveConnector(t2, b2).setType('singleRight');
  for (const c of [brace, left, right]) frame(c);

  T1.draw(ctx, t1); B1.draw(ctx, b1); T2.draw(ctx, t2); B2.draw(ctx, b2);
  beams.forEach((b) => b.setContext(ctx).drawWithStyle());
  tuplet.setContext(ctx).drawWithStyle();
  new StaveTie({ firstNote: ch1, lastNote: ch2, firstIndexes: [0, 1, 2], lastIndexes: [0, 1, 2] }).setContext(ctx).drawWithStyle();
  return { width: X0 + W + 300 + 20, height: Y0 + GAP + 120 };
}
