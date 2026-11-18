import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
export const FIX = path.join(import.meta.dirname, 'fixtures');
import { test as nodeTest } from 'node:test';

// Tệp mẫu của bên thứ ba (chưa xác nhận quyền phân phối) KHÔNG được commit: chúng nằm trong
// test/fixtures/third-party/ (bị .gitignore). Thiếu tệp -> fx() trả Buffer rỗng và test dùng tệp đó bị bỏ qua.
export const THIRD_PARTY = ['Demo.als', 'Oboe_MIDI_001.mid', 'ode_to_zb.RPP', 'prutypils.rpp', 'siderite_oneD-8.RPP',
  'tmf-small.RPP', 'youdreamarked-midi.RPP', 'big roar.flp', '11-7-26 ambient vocal.flp', 'yawwapsy.zip', '3x OSC Abuse.flp', 'Ction_35.flp', 'HOUSE, TRANCE (SB, KS10, SIR)_21_NEW.flp', 'fun song.flp', 'TS404 Template_v20.8.flp', 'Promise.flp', 'TRANCECRAFTER_37.flp', 'bitwig-5.0-example.project.xml', 'reaper-doc-sample.txt'];
const tpDir = path.join(FIX, 'third-party');
const missing = new Set(THIRD_PARTY.filter((n) => !fs.existsSync(path.join(tpDir, n))));
export const fx = (n) => {
  if (THIRD_PARTY.includes(n)) return missing.has(n) ? Buffer.alloc(0) : fs.readFileSync(path.join(tpDir, n));
  return fs.readFileSync(path.join(FIX, n));
};
// test(): như node:test nhưng tự bỏ qua test có nhắc đến tệp bên thứ ba đang thiếu (quét mã nguồn hàm test).
const needs = (src) => [...missing].some((n) => src.includes(n.replace(/\.[^.]+$/, '').replace(/[-.]/g, (c) => c)) && src.includes(n.split('.')[0]))
  || (missing.has('Demo.als') && /\bDEMO\b/.test(src)) || (missing.has('bitwig-5.0-example.project.xml') && /\bBITWIG\b/.test(src));
export const test = (name, opts, fn) => {
  if (typeof opts === 'function') { fn = opts; opts = {}; }
  const miss = needs(fn.toString());
  return nodeTest(name, miss ? { ...opts, skip: 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' } : opts, fn);
};

// ---- FLP writer (tối thiểu, đủ cho test parser). Mỗi sự kiện: flpEv(id, giá trị | Buffer | string utf16 ) ; flp({ppq, events}) -> Buffer
const leb = (n) => { const b = []; do { let x = n & 0x7f; n >>>= 7; if (n) x |= 0x80; b.push(x); } while (n); return Buffer.from(b); };
export const flpEv = (id, v) => {
  if (id < 64) return Buffer.from([id, v]);
  if (id < 128) { const b = Buffer.alloc(3); b[0] = id; b.writeUInt16LE(v, 1); return b; }
  if (id < 192) { const b = Buffer.alloc(5); b[0] = id; b.writeUInt32LE(v, 1); return b; }
  const body = typeof v === 'string' ? Buffer.from(id === 199 ? v + '\0' : v + '\0', id === 199 ? 'latin1' : 'utf16le') : Buffer.from(v);
  return Buffer.concat([Buffer.from([id]), leb(body.length), body]);
};
/** nốt FLP: 24 byte. */
export const flpNote = ({ pos, rack = 0, dur = 24, key = 60, vel = 100 }) => { const b = Buffer.alloc(24); b.writeUInt32LE(pos, 0); b.writeUInt16LE(16384, 4); b.writeUInt16LE(rack, 6); b.writeUInt32LE(dur, 8); b.writeUInt16LE(key, 12); b[16] = 120; b[21] = vel; b[22] = 128; b[23] = 128; return b; };
/** clip Playlist 32 byte (FL < 20.99): pat = số pattern; so = startoffset. */
export const flpClip = ({ pos, len = 384, pat = 1, lane = 499, so = 0xffffffff, flags = 64 }) => { const b = Buffer.alloc(32); b.writeUInt32LE(pos, 0); b.writeUInt16LE(20480, 4); b.writeUInt16LE(20480 + pat, 6); b.writeUInt32LE(len, 8); b.writeUInt32LE(lane, 12); b.writeUInt16LE(flags, 18); b.writeUInt32LE(so, 24); b.writeUInt32LE(0xffffffff, 28); return b; };
/** điểm automation (sự kiện 234): pts = [[delta_beat, giá_trị 0..1]] */
export const flpAuto = (pts) => { const b = Buffer.alloc(21 + pts.length * 24); b.writeUInt32LE(1, 0); b.writeUInt32LE(pts.length, 17); pts.forEach(([dt, v], i) => { b.writeDoubleLE(dt, 21 + i * 24); b.writeDoubleLE(v, 29 + i * 24); }); return b; };
/** điều khiển từ xa (sự kiện 227): chan = kênh automation, group/ctl = đích (xem schemas/flp.schema.json) */
export const flpRemote = (chan, group, ctl) => { const b = Buffer.alloc(20); b.writeUInt32LE(chan, 2); b.writeUInt32LE(((group << 16) | ctl) >>> 0, 8); b.writeUInt32LE(8, 12); return b; };
/** clip Playlist của kênh (âm thanh/automation): idx = số kênh, stride = 32 (FL < 20.99) hoặc 60/80 */
export const flpChanClip = ({ pos, len, chan, stride = 32 }) => { const b = Buffer.alloc(stride); b.writeUInt32LE(pos, 0); b.writeUInt16LE(20480, 4); b.writeUInt16LE(chan, 6); b.writeUInt32LE(len, 8); b.writeUInt32LE(499, 12); b.writeUInt16LE(64, 18); b.writeUInt32LE(0xffffffff, 24); b.writeUInt32LE(0xffffffff, 28); return b; };
export function flp({ ppq = 96, events }) {
  const data = Buffer.concat(events);
  const h = Buffer.alloc(14); h.write('FLhd', 0); h.writeUInt32LE(6, 4); h.writeUInt16LE(0, 8); h.writeUInt16LE(2, 10); h.writeUInt16LE(ppq, 12);
  const d = Buffer.alloc(8); d.write('FLdt', 0); d.writeUInt32LE(data.length, 4);
  return Buffer.concat([h, d, data]);
}

// ---- MIDI writer. tracks: [[{tick, bytes:[...]}]]  (đã gồm meta); trả Buffer SMF
const vlq = (n) => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
export function smf({ format = 1, ppq = 480, tracks }) {
  const chunks = tracks.map((evs) => {
    const sorted = [...evs].sort((a, b) => a.tick - b.tick); let last = 0; const body = [];
    for (const e of sorted) { body.push(...vlq(e.tick - last), ...e.bytes); last = e.tick; }
    body.push(0, 0xff, 0x2f, 0);
    return Buffer.from([0x4d, 0x54, 0x72, 0x6b, (body.length >>> 24) & 255, (body.length >> 16) & 255, (body.length >> 8) & 255, body.length & 255, ...body]);
  });
  const head = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, format, 0, tracks.length, ppq >> 8, ppq & 255]);
  return Buffer.concat([head, ...chunks]);
}
export const tempoEv = (tick, bpm) => { const us = Math.round(60000000 / bpm); return { tick, bytes: [0xff, 0x51, 3, us >> 16, (us >> 8) & 255, us & 255] }; };
export const sigEv = (tick, num, denPow) => ({ tick, bytes: [0xff, 0x58, 4, num, denPow, 24, 8] });
export const nameEv = (name) => ({ tick: 0, bytes: [0xff, 0x03, name.length, ...Buffer.from(name)] });
export const on = (tick, key, vel = 100, ch = 0) => ({ tick, bytes: [0x90 | ch, key, vel] });
export const off = (tick, key, ch = 0) => ({ tick, bytes: [0x80 | ch, key, 0] });

// ---- ZIP writer: entries { name: Buffer|string }, opts.store = true để không nén
export function zip(entries, { store = false } = {}) {
  const locals = [], central = []; let off = 0;
  for (const [name, data] of Object.entries(entries)) {
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const comp = store ? raw : zlib.deflateRawSync(raw);
    const nm = Buffer.from(name), crc = zlib.crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(store ? 0 : 8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    locals.push(lh, nm, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(store ? 0 : 8, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, nm);
    off += 30 + nm.length + comp.length;
  }
  const cen = Buffer.concat(central);
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(Object.keys(entries).length, 8); eocd.writeUInt16LE(Object.keys(entries).length, 10); eocd.writeUInt32LE(cen.length, 12); eocd.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cen, eocd]);
}
export const gz = (b) => zlib.gzipSync(Buffer.isBuffer(b) ? b : Buffer.from(b));

// ---- kiểm tra bất biến của AST
export function assertAstInvariants(assert, ast) {
  assert.equal(ast.meta.internalPPQ, 960);
  assert.ok(ast.tempoMap.length >= 1 && ast.tempoMap[0].tick === 0);
  for (let i = 1; i < ast.tempoMap.length; i++) { assert.ok(ast.tempoMap[i].tick > ast.tempoMap[i - 1].tick); assert.ok(ast.tempoMap[i].timeSeconds > ast.tempoMap[i - 1].timeSeconds); }
  for (const t of ast.tracks) {
    let prev = -1;
    for (const n of t.notes) {
      assert.ok(Number.isInteger(n.startTick) && Number.isInteger(n.durationTick) && n.startTick >= 0 && n.durationTick >= 1, `tick không hợp lệ ${JSON.stringify(n)}`);
      assert.equal(n.endTick, n.startTick + n.durationTick);
      assert.ok(n.pitch >= 0 && n.pitch <= 127 && n.velocity >= 1 && n.velocity <= 127);
      assert.ok(Number.isFinite(n.startTimeSeconds) && n.endTimeSeconds > n.startTimeSeconds);
      assert.ok(n.startTick >= prev, 'nốt chưa sắp theo startTick'); prev = n.startTick;
    }
  }
}
