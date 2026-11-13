#!/usr/bin/env node
// Sinh tệp mẫu TỰ TẠO (không có bên thứ ba, không vướng bản quyền) để thử giao diện với dữ liệu khó. Chạy:
//   node test/fixtures/generate-synthetic.mjs          (ghi vào test/fixtures/generated/, bị .gitignore: sinh lại bất cứ lúc nào)
//
// Ba thứ được tạo:
//   generated/synthetic-16-long-names.rpp     16 track tên rất dài (có tiếng Việt có dấu), mỗi track một item MIDI nhúng.
//                                             Dùng để thử: danh sách 15+ track, cắt chữ, cuộn inspector, ẩn/hiện/solo, kéo đổi thứ tự.
//   generated/synthetic-external-midi.rpp     dự án Reaper tham chiếu 9 tệp .mid NGOÀI (tên dài) mà không kèm theo.
//                                             Mở riêng thì hiện bảng "thiếu .mid" (danh sách dài, "+N tệp nữa", nút Nạp .mid).
//   generated/external-midi/*.mid             9 tệp .mid khớp với dự án trên: thả cùng dự án (hoặc nạp ở bảng thiếu .mid)
//                                             để thấy luồng "nạp thêm tại chỗ" chạy đến cùng.
// Dữ liệu nốt giả lập bằng bộ sinh số ngẫu nhiên có hạt giống cố định: lần nào chạy cũng ra đúng cùng một tệp.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'generated');
const PPQ = 480, BPM = 120, SECONDS = 24;
const TICKS = Math.round(SECONDS * (BPM / 60) * PPQ); // độ dài mỗi item, tính bằng tick

/** Bộ sinh số giả ngẫu nhiên (mulberry32) để kết quả tất định. */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Một dãy nốt: [{ tick, dur, pitch, vel }], mỗi track một giai điệu khác nhau theo `seed`. */
function melody(seed, lo, hi) {
  const r = rng(seed), notes = [];
  let tick = Math.floor(r() * 4) * (PPQ / 2), pitch = lo + Math.floor((hi - lo) / 2);
  while (tick < TICKS - PPQ) {
    const dur = [PPQ / 4, PPQ / 2, PPQ / 2, PPQ, PPQ * 2][Math.floor(r() * 5)];
    pitch = Math.min(hi, Math.max(lo, pitch + Math.round((r() - 0.5) * 8)));
    notes.push({ tick, dur: Math.min(dur, TICKS - tick), pitch, vel: 60 + Math.floor(r() * 60) });
    tick += dur + (r() < 0.3 ? PPQ / 2 : 0);
  }
  return notes;
}

// ---- Reaper .rpp ----
const hex2 = (n) => n.toString(16).padStart(2, '0');
function eventLines(notes) {
  const ev = [];
  for (const n of notes) { ev.push({ t: n.tick, s: 0x90, a: n.pitch, b: n.vel }, { t: n.tick + n.dur, s: 0x80, a: n.pitch, b: 0 }); }
  ev.sort((x, y) => x.t - y.t || (x.s === 0x80 ? -1 : 1));
  let last = 0;
  return ev.map((e) => { const d = e.t - last; last = e.t; return `        E ${d} ${hex2(e.s)} ${hex2(e.a)} ${hex2(e.b)}`; });
}
const guid = (a, b) => `{${[8, 4, 4, 4, 12].map((len, i) => (a * 7919 + b * 104729 + i * 31).toString(16).padStart(len, '0').slice(-len).toUpperCase()).join('-')}}`;
function trackBlock(i, name, sourceLines) {
  return [
    `  <TRACK ${guid(1, i)}`,
    `    NAME "${name}"`,
    '    VOLPAN 1 0 -1 -1 1',
    '    MUTESOLO 0 0 0',
    `    TRACKID ${guid(1, i)}`,
    '    <ITEM',
    '      POSITION 0',
    '      SNAPOFFS 0',
    `      LENGTH ${SECONDS}`,
    '      LOOP 0',
    '      MUTE 0 0',
    `      NAME "${name}"`,
    '      SOFFS 0 0',
    `      GUID ${guid(2, i)}`,
    ...sourceLines,
    '    >',
    '  >',
  ].join('\n');
}
const project = (tracks) => ['<REAPER_PROJECT 0.1 "7.85/win64" 1794473738 0', `  TEMPO ${BPM} 4 4 0`, ...tracks, '>', ''].join('\n');

// ---- Tệp 1: 16 track tên dài ----
const LONG_NAMES = [
  'Lead Synth – Chorus Layer (Detuned Supersaw, Heavily Sidechained to Kick)',
  'Đàn bầu chính – lớp hoà âm rất dài dùng để thử cắt chữ số 02',
  'Sub Bass 808 (Glide, Distorted, Mono Below 120 Hz, Mastering Bus Send)',
  'Arpeggiator Pluck – Verse 1 + Verse 2 + Pre-Chorus Automation Lane',
  'Pad Chords: Fmaj7 / Em7 / Dm9 / Cadd9 (Warm Analog Strings, Slow Attack)',
  'Bells & Glockenspiel – Intro Motif Reprise (Pitch-Shifted +12 Semitones)',
  'Drums – Kick Layer A (Punchy) + Layer B (Sub Tail) + Transient Shaper',
  'Hi-Hats Closed/Open Groove Humanized 16th Swing 58% Velocity Randomized',
  'Snare + Clap + Rimshot Stack với reverb ngắn và gate nhịp phách hai bốn',
  'Vocal Chop Sample "ah" – Formant Shifted, Granular, Reversed Tails Only',
  'Piano (Felt, Close-Mic) – Left Hand Ostinato Pattern in Dorian Mode',
  'Strings Ensemble Legato – Violins I+II, Violas, Cellos, Basses Combined',
  'FX Risers & Impacts – Transition Between Verse and Drop (Noise Sweep Up)',
  'Guitar Harmonics (Clean DI, Chorus Pedal) – Bridge Counter-Melody Only',
  'Cồng chiêng và trống cái – nhịp nền Tây Nguyên, lớp thứ hai, giảm âm lượng',
  'Mix Bus Automation Dummy Track With An Exceptionally Long Name To Test Truncation',
];
const ranges = [[60, 84], [55, 79], [28, 48], [60, 90], [48, 72], [72, 96], [36, 40], [42, 46], [38, 42], [60, 75], [40, 64], [50, 80], [60, 61], [52, 76], [45, 55], [60, 72]];
const longTracks = LONG_NAMES.map((name, i) => {
  const notes = melody(1000 + i, ...ranges[i]);
  return trackBlock(i, name, ['      <SOURCE MIDI', `        HASDATA 1 ${PPQ} QN`, ...eventLines(notes), '      >']);
});

// ---- Tệp 2: dự án tham chiếu .mid ngoài ----
const EXTERNAL = [
  'drums-kick-layer-a-punchy-01.mid', 'drums-snare-clap-rimshot-stack-02.mid', 'hi-hats-closed-open-groove-03.mid',
  'sub-bass-808-glide-distorted-04.mid', 'lead-synth-chorus-layer-detuned-05.mid', 'pad-chords-fmaj7-em7-dm9-06.mid',
  'arpeggiator-pluck-verse-one-07.mid', 'bells-glockenspiel-intro-motif-08.mid', 'vocal-chop-ah-formant-shifted-09.mid',
];
const externalTracks = EXTERNAL.map((file, i) => trackBlock(i, file.replace(/\.mid$/, '').replace(/-/g, ' '), ['      <SOURCE MIDI', `        FILE "Media\\${file}" QN`, '      >']));

// ---- .mid (SMF định dạng 0) ----
const vlq = (n) => { const o = [n & 0x7f]; while ((n >>= 7)) o.unshift((n & 0x7f) | 0x80); return o; };
function smf(name, notes) {
  const ev = [];
  for (const n of notes) { ev.push({ t: n.tick, b: [0x90, n.pitch, n.vel] }, { t: n.tick + n.dur, b: [0x80, n.pitch, 0] }); }
  ev.sort((x, y) => x.t - y.t || (x.b[0] === 0x80 ? -1 : 1));
  const nameBytes = [...Buffer.from(name, 'utf8')];
  const body = [0x00, 0xff, 0x03, ...vlq(nameBytes.length), ...nameBytes, 0x00, 0xff, 0x51, 0x03, ...[(60000000 / BPM) >> 16 & 255, (60000000 / BPM) >> 8 & 255, (60000000 / BPM) & 255]];
  let last = 0;
  for (const e of ev) { body.push(...vlq(e.t - last), ...e.b); last = e.t; }
  body.push(0x00, 0xff, 0x2f, 0x00);
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  return Buffer.from([0x4d, 0x54, 0x68, 0x64, ...u32(6), 0, 0, 0, 1, (PPQ >> 8) & 255, PPQ & 255, 0x4d, 0x54, 0x72, 0x6b, ...u32(body.length), ...body]);
}

mkdirSync(join(OUT, 'external-midi'), { recursive: true });
writeFileSync(join(OUT, 'synthetic-16-long-names.rpp'), project(longTracks));
writeFileSync(join(OUT, 'synthetic-external-midi.rpp'), project(externalTracks));
EXTERNAL.forEach((file, i) => writeFileSync(join(OUT, 'external-midi', file), smf(file.replace(/\.mid$/, ''), melody(2000 + i, 40 + (i % 5) * 6, 64 + (i % 5) * 6))));
console.log(`Đã ghi 2 dự án .rpp và ${EXTERNAL.length} tệp .mid vào ${OUT}`);
