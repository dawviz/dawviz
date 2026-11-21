// Sinh out/short.mid: 8 ô 4/4 ở 100 BPM (~19 s), tay phải giai điệu (móc đơn, liên ba, nốt nối qua vạch nhịp), tay trái hợp âm.
// Nội dung tự soạn để thử xuất video; không phải tệp của bên thứ ba.
import { writeFileSync, mkdirSync } from 'node:fs';
const PPQ = 480;
const ev = []; // [tick, bytes]
const note = (tick, dur, pitch, vel = 90) => { ev.push([tick, [0x90, pitch, vel]]); ev.push([tick + dur, [0x80, pitch, 0]]); };
const q = PPQ, e = PPQ / 2, t3 = PPQ / 3;
const mel = [ // [beat offset (đen), độ dài (tick), cao độ]
  [0, e, 72], [0.5, e, 74], [1, q, 76], [2, e, 77], [2.5, e, 79], [3, q * 2, 81], // nối qua vạch ô 1→2
  [5, e, 79], [5.5, e, 77], [6, t3, 76], [6 + 1 / 3, t3, 77], [6 + 2 / 3, t3, 76], [7, q, 74],
  [8, q, 72], [9, e, 71], [9.5, e, 72], [10, q * 2, 74],
  [12, t3, 76], [12 + 1 / 3, t3, 74], [12 + 2 / 3, t3, 72], [13, q, 71], [14, q * 2, 72],
];
for (let rep = 0; rep < 2; rep++) for (const [b, d, p] of mel) note(Math.round((b + rep * 16) * PPQ), d, p);
const chords = [[48, 55, 64], [53, 57, 65], [55, 59, 62], [48, 52, 55]];
for (let bar = 0; bar < 8; bar++) { const c = chords[bar % 4]; for (const h of [0, 2]) for (const p of c) note((bar * 4 + h) * PPQ, 2 * PPQ, p, 70); }
ev.sort((a, b) => a[0] - b[0] || (a[1][0] === 0x80 ? -1 : 1));
const vlq = (n) => { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out; };
const data = [0, 0xff, 0x51, 3, ...[600000 >> 16, (600000 >> 8) & 255, 600000 & 255], 0, 0xff, 0x58, 4, 4, 2, 24, 8];
let last = 0;
for (const [tick, bytes] of ev) { data.push(...vlq(tick - last), ...bytes); last = tick; }
data.push(0, 0xff, 0x2f, 0);
const hdr = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, PPQ >> 8, PPQ & 255];
const trk = [0x4d, 0x54, 0x72, 0x6b, (data.length >>> 24) & 255, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255];
mkdirSync('out', { recursive: true });
writeFileSync('out/short.mid', Buffer.from([...hdr, ...trk, ...data]));
console.log('out/short.mid', data.length, 'bytes');
