// Parser nhị phân khai báo: một file JSON mô tả cấu trúc byte + cách ánh xạ sang UnifiedProjectAST.
// An toàn theo R-05/D-18: KHÔNG eval/new Function; biểu thức do bộ phân tích riêng đánh giá, chỉ dùng danh sách hàm trắng,
// có giới hạn độ sâu, số nút, số phép tính, và mọi đọc byte đều bị chặn trong "vùng" (region) hợp lệ.
// Xem schemas/README.md để biết đặc tả đầy đủ.
import { fail, warn, resolveLimits, toU8, PPQ, buildAST, normalizeTempoOverride } from '@dawviz/parser-core';

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const INT = { u8: [1, 'Uint8'], i8: [1, 'Int8'], u16: [2, 'Uint16'], i16: [2, 'Int16'], u32: [4, 'Uint32'], i32: [4, 'Int32'], f32: [4, 'Float32'], f64: [8, 'Float64'], u64: [8, 'BigUint64'], i64: [8, 'BigInt64'] };
const STRINGS = { ascii: 'latin1', latin1: 'latin1', utf8: 'utf-8', utf16le: 'utf-16le', utf16be: 'utf-16be' };
const sbad = (m, p) => fail('ERR_SCHEMA_INVALID', p ? `${m} (tại ${p})` : m);

// ======================= biểu thức =======================
const FUNCS = {
  min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, round: Math.round, abs: Math.abs,
  len: (a) => (a && typeof a.length === 'number' ? a.length : 0),
  beatsToTicks: (b) => b * PPQ,
  clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
};
const cache = new Map();

function tokenizeExpr(src) {
  const out = []; let i = 0;
  const re = /\s*(?:(0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)|([A-Za-z_$][\w$]*)|'([^']*)'|"([^"]*)"|(\|\||&&|==|!=|<=|>=|<<|>>|[-+*\/%()\[\].,?:<>!~&|^]))/y;
  while (i < src.length) {
    re.lastIndex = i; const m = re.exec(src);
    if (!m) { if (/^\s*$/.test(src.slice(i))) break; sbad(`biểu thức không hợp lệ: ${JSON.stringify(src)}`, `ký tự ${i}`); }
    i = re.lastIndex;
    if (m[1] !== undefined) out.push({ t: 'n', v: Number(m[1]) });
    else if (m[2] !== undefined) out.push({ t: 'i', v: m[2] });
    else if (m[3] !== undefined || m[4] !== undefined) out.push({ t: 's', v: m[3] ?? m[4] });
    else out.push({ t: 'o', v: m[5] });
  }
  return out;
}

function compileExpr(src) {
  if (typeof src === 'number' || typeof src === 'boolean') return { k: 'lit', v: src };
  if (typeof src !== 'string') sbad('biểu thức phải là chuỗi hoặc số');
  if (src.length > 500) sbad('biểu thức quá dài');
  if (cache.has(src)) return cache.get(src);
  const tk = tokenizeExpr(src); let p = 0;
  const peek = () => tk[p], isOp = (v) => tk[p] && tk[p].t === 'o' && tk[p].v === v;
  const eat = (v) => { if (!isOp(v)) sbad(`biểu thức ${JSON.stringify(src)}: cần "${v}"`); p++; };
  const levels = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '<=', '>', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']];
  function bin(lv) {
    if (lv >= levels.length) return unary();
    let l = bin(lv + 1);
    while (tk[p] && tk[p].t === 'o' && levels[lv].includes(tk[p].v)) { const op = tk[p++].v; l = { k: 'bin', op, l, r: bin(lv + 1) }; }
    return l;
  }
  function ternary() { const c = bin(0); if (isOp('?')) { p++; const a = ternary(); eat(':'); const b = ternary(); return { k: 'if', c, a, b }; } return c; }
  function unary() { if (tk[p] && tk[p].t === 'o' && ['-', '!', '~'].includes(tk[p].v)) { const op = tk[p++].v; return { k: 'un', op, e: unary() }; } return postfix(primary()); }
  function primary() {
    const t = tk[p++];
    if (!t) sbad(`biểu thức ${JSON.stringify(src)} kết thúc đột ngột`);
    if (t.t === 'n') return { k: 'lit', v: t.v };
    if (t.t === 's') return { k: 'lit', v: t.v };
    if (t.t === 'i') {
      if (t.v === 'true') return { k: 'lit', v: true };
      if (t.v === 'false') return { k: 'lit', v: false };
      if (isOp('(')) { if (!Object.hasOwn(FUNCS, t.v)) sbad(`hàm "${t.v}" không nằm trong danh sách trắng`); p++; const args = []; if (!isOp(')')) { do { args.push(ternary()); } while (isOp(',') && ++p); } eat(')'); return { k: 'call', f: t.v, args }; }
      if (FORBIDDEN.has(t.v)) sbad(`tên bị cấm: ${t.v}`);
      return { k: 'id', n: t.v };
    }
    if (t.v === '(') { const e = ternary(); eat(')'); return e; }
    return sbad(`biểu thức ${JSON.stringify(src)}: token không mong đợi "${t.v}"`);
  }
  function postfix(e) {
    for (;;) {
      if (isOp('.')) { p++; const t = tk[p++]; if (!t || t.t !== 'i') sbad(`biểu thức ${JSON.stringify(src)}: cần tên sau "."`); if (FORBIDDEN.has(t.v)) sbad(`tên bị cấm: ${t.v}`); e = { k: 'mem', o: e, n: t.v }; }
      else if (isOp('[')) { p++; const i = ternary(); eat(']'); e = { k: 'idx', o: e, i }; }
      else return e;
    }
  }
  const ast = ternary();
  if (p < tk.length) sbad(`biểu thức ${JSON.stringify(src)}: thừa token "${tk[p].v}"`);
  cache.set(src, ast);
  return ast;
}

const BIN = {
  '||': (a, b) => a || b, '&&': (a, b) => a && b, '|': (a, b) => a | b, '^': (a, b) => a ^ b, '&': (a, b) => a & b, '==': (a, b) => a == b, '!=': (a, b) => a != b, // eslint-disable-line eqeqeq
  '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, '<<': (a, b) => a << b, '>>': (a, b) => a >> b,
  '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b, '%': (a, b) => a % b,
};

/** scope: { vars, parent, special } ; tìm biến từ trong ra ngoài. */
function evalNode(n, scope, budget) {
  if (--budget.ops < 0) fail('ERR_AST_TOO_LARGE', 'vượt giới hạn số phép tính biểu thức');
  switch (n.k) {
    case 'lit': return n.v;
    case 'id': {
      if (n.n[0] === '$') { for (let s = scope; s; s = s.parent) if (s.special && n.n in s.special) { const v = s.special[n.n]; return typeof v === 'function' ? v() : v; } return undefined; }
      if (n.n === 'parent') return scope.parent ? scope.parent.vars : undefined;
      if (n.n === 'root') { let s = scope; while (s.parent) s = s.parent; return s.vars; }
      for (let s = scope; s; s = s.parent) if (Object.hasOwn(s.vars, n.n)) return s.vars[n.n];
      return undefined;
    }
    case 'mem': { const o = evalNode(n.o, scope, budget); return o !== null && typeof o === 'object' && Object.hasOwn(o, n.n) ? o[n.n] : undefined; }
    case 'idx': { const o = evalNode(n.o, scope, budget), i = evalNode(n.i, scope, budget); return Array.isArray(o) || ArrayBuffer.isView(o) ? o[i] : undefined; }
    case 'un': { const v = evalNode(n.e, scope, budget); return n.op === '-' ? -v : n.op === '!' ? !v : ~v; }
    case 'if': return evalNode(n.c, scope, budget) ? evalNode(n.a, scope, budget) : evalNode(n.b, scope, budget);
    case 'call': return FUNCS[n.f](...n.args.map((a) => evalNode(a, scope, budget)));
    case 'bin': {
      if (n.op === '&&') { const l = evalNode(n.l, scope, budget); return l ? evalNode(n.r, scope, budget) : l; }
      if (n.op === '||') { const l = evalNode(n.l, scope, budget); return l ? l : evalNode(n.r, scope, budget); }
      return BIN[n.op](evalNode(n.l, scope, budget), evalNode(n.r, scope, budget));
    }
    default: return fail('ERR_AST_INVALID', 'nút biểu thức lạ');
  }
}
const ev = (src, scope, budget) => evalNode(compileExpr(src), scope, budget);

// ======================= kiểm tra schema =======================
export function validateSchema(schema) {
  if (!schema || typeof schema !== 'object') sbad('schema phải là object');
  if (schema.schemaVersion !== 1) sbad('schemaVersion phải là 1');
  if (!schema.root || !Array.isArray(schema.root.fields)) sbad('thiếu root.fields');
  const types = schema.types || {};
  for (const k of Object.keys(types)) { if (!NAME_RE.test(k) || FORBIDDEN.has(k)) sbad(`tên kiểu không hợp lệ: ${k}`); if (!Array.isArray(types[k].fields)) sbad(`kiểu ${k} thiếu fields`); }
  const checkType = (t, path) => {
    if (typeof t === 'string') { if (!(t in INT) && !(t in STRINGS) && !['vlq', 'leb128', 'cstring', 'bytes', 'skip', 'computed', 'struct', 'array', 'switch'].includes(t) && !Object.hasOwn(types, t)) sbad(`kiểu không biết: ${t}`, path); }
    else if (t && typeof t === 'object') checkField(t, path, true); else sbad('đặc tả kiểu không hợp lệ', path);
  };
  const checkField = (f, path, anon = false) => {
    if (f.assert !== undefined) { compileExpr(f.assert); return; }
    if (!anon && !(f.type === 'skip' && f.name === undefined)) { if (typeof f.name !== 'string' || !NAME_RE.test(f.name) || FORBIDDEN.has(f.name)) sbad(`tên trường không hợp lệ: ${JSON.stringify(f.name)}`, path); }
    checkType(f.type, `${path}.type`);
    for (const k of ['length', 'count', 'when', 'offset', 'expr', 'on', 'size']) if (f[k] !== undefined) compileExpr(f[k]);
    if (f.endian !== undefined && !['big', 'little'].includes(f.endian)) sbad('endian phải là big|little', path);
    if (f.type === 'struct' && !Array.isArray(f.fields)) sbad('struct cần fields', path);
    if (f.type === 'array') { if (f.of === undefined) sbad('array cần "of"', path); checkType(f.of, `${path}.of`); if (f.count === undefined && f.until === undefined && f.size === undefined) sbad('array cần count, size hoặc until', path); if (typeof f.until === 'string' && f.until !== 'end') compileExpr(f.until); }
    if (f.type === 'switch') { if (f.on === undefined || !f.cases) sbad('switch cần on và cases', path); for (const [k, v] of Object.entries(f.cases)) checkType(v, `${path}.cases.${k}`); if (f.default !== undefined) checkType(f.default, `${path}.default`); }
    if (f.type === 'computed' && f.expr === undefined) sbad('computed cần expr', path);
    if (f.fields) f.fields.forEach((x, i) => checkField(x, `${path}.fields[${i}]`));
  };
  schema.root.fields.forEach((f, i) => checkField(f, `root.fields[${i}]`));
  for (const [k, t] of Object.entries(types)) t.fields.forEach((f, i) => checkField(f, `types.${k}.fields[${i}]`));
  if (schema.ast) validateMapping(schema.ast);
  return schema;
}
function validateMapping(a) {
  for (const k of ['title', 'ppq']) if (a[k] !== undefined) compileExpr(a[k]);
  const rule = (r, keys, path) => { if (r.each !== undefined) compileExpr(r.each); if (r.filter !== undefined) compileExpr(r.filter); if (r.as !== undefined && !NAME_RE.test(r.as)) sbad('"as" không hợp lệ', path); for (const k of keys) if (r[k] !== undefined && typeof r[k] !== 'object') compileExpr(r[k]); };
  const T = Array.isArray(a.tempo) ? a.tempo : a.tempo ? [a.tempo] : [];
  T.forEach((r, i) => rule(r, ['tick', 'bpm', 'num', 'den'], `ast.tempo[${i}]`));
  if (a.tracks) { rule(a.tracks, ['name', 'muted'], 'ast.tracks'); if (a.tracks.notes) rule(a.tracks.notes, ['pitch', 'startTick', 'durationTick', 'endTick', 'velocity', 'channel'], 'ast.tracks.notes'); }
}

// ======================= đọc nhị phân =======================
class Ctx {
  constructor(u8, limits) { this.u8 = u8; this.dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); this.pos = 0; this.limits = limits; this.nodes = 0; this.budget = { ops: 5e7 }; }
}
const rbad = (c, m) => fail('ERR_AST_INVALID', `schema nhị phân: ${m} (offset ${c.pos})`, { offset: c.pos });

function readNumber(c, type, endian, end) {
  const [size, name] = INT[type];
  if (c.pos + size > end) rbad(c, `đọc ${type} vượt quá vùng (còn ${end - c.pos} byte)`);
  const le = endian === 'little';
  const v = name === 'BigUint64' || name === 'BigInt64' ? c.dv[`get${name}`](c.pos, le) : name === 'Uint8' || name === 'Int8' ? c.dv[`get${name}`](c.pos) : c.dv[`get${name}`](c.pos, le);
  c.pos += size;
  if (typeof v === 'bigint') { if (v > BigInt(Number.MAX_SAFE_INTEGER) || v < -BigInt(Number.MAX_SAFE_INTEGER)) rbad(c, `${type} vượt 2^53`); return Number(v); }
  return v;
}

function readValue(c, spec, scope, end, endian, schema, depth) {
  if (++c.nodes > c.limits.maxBinaryNodes) fail('ERR_AST_TOO_LARGE', `schema nhị phân: vượt ${c.limits.maxBinaryNodes} nút`);
  if (depth > c.limits.maxBinaryDepth) fail('ERR_AST_INVALID', 'schema nhị phân: lồng quá sâu');
  const f = typeof spec === 'string' ? { type: spec } : spec;
  const en = f.endian || endian;
  const t = f.type;
  const lenOf = () => { const n = ev(f.length, scope, c.budget); if (!Number.isInteger(n) || n < 0) rbad(c, `length không hợp lệ: ${n}`); return n; };
  if (t in INT) return readNumber(c, t, en, end);
  if (t in STRINGS) { const n = lenOf(); if (c.pos + n > end) rbad(c, 'chuỗi vượt quá vùng'); const s = new TextDecoder(STRINGS[t]).decode(c.u8.subarray(c.pos, c.pos + n)); c.pos += n; return s.replace(/\0+$/, ''); }
  if (t === 'cstring') { let q = c.pos; while (q < end && c.u8[q] !== 0) q++; if (q >= end) rbad(c, 'cstring không có byte 0 kết thúc'); const s = new TextDecoder('utf-8').decode(c.u8.subarray(c.pos, q)); c.pos = q + 1; return s; }
  if (t === 'bytes') { const n = lenOf(); if (c.pos + n > end) rbad(c, 'bytes vượt quá vùng'); const b = c.u8.subarray(c.pos, c.pos + n); c.pos += n; return b; }
  if (t === 'skip') { const n = lenOf(); if (c.pos + n > end) rbad(c, 'skip vượt quá vùng'); c.pos += n; return undefined; }
  if (t === 'vlq') { let v = 0, n = 0, b; do { if (c.pos >= end || n++ >= 5) rbad(c, 'vlq hỏng'); b = c.u8[c.pos++]; v = v * 128 + (b & 0x7f); } while (b & 0x80); return v; }
  if (t === 'leb128') { let v = 0, sh = 1, n = 0, b; do { if (c.pos >= end || n++ >= 8) rbad(c, 'leb128 hỏng'); b = c.u8[c.pos++]; v += (b & 0x7f) * sh; sh *= 128; } while (b & 0x80); return v; }
  if (t === 'computed') return ev(f.expr, scope, c.budget);

  // ---- kiểu phức hợp: có thể bị giới hạn vùng bằng "length"
  let rEnd = end;
  if (f.length !== undefined && (t === 'struct' || t === 'array' || t === 'switch' || Object.hasOwn(schema.types || {}, t))) { const n = lenOf(); if (c.pos + n > end) rbad(c, 'vùng con vượt quá vùng cha'); rEnd = c.pos + n; }
  let result;
  if (t === 'struct') result = readStruct(c, f.fields, scope, rEnd, en, schema, depth + 1);
  else if (t === 'array') {
    const out = [];
    const ofSpec = f.of;
    const item = (i) => { const sc = { vars: {}, parent: scope, special: { $index: i, $pos: () => c.pos, $remaining: () => rEnd - c.pos } }; return readValue(c, ofSpec, sc, rEnd, en, schema, depth + 1); };
    if (f.count !== undefined) {
      const n = ev(f.count, scope, c.budget);
      if (!Number.isInteger(n) || n < 0 || n > c.limits.maxBinaryNodes) rbad(c, `count không hợp lệ: ${n}`);
      for (let i = 0; i < n; i++) out.push(item(i));
    } else if (f.size !== undefined) {
      const n = ev(f.size, scope, c.budget); const stop = c.pos + n; if (stop > rEnd) rbad(c, 'size vượt quá vùng');
      for (let i = 0; c.pos < stop; i++) { const before = c.pos; out.push(item(i)); if (c.pos === before) rbad(c, 'phần tử mảng không tiến con trỏ'); }
    } else {
      for (let i = 0; ; i++) {
        if (f.until === 'end' && c.pos >= rEnd) break;
        const before = c.pos; out.push(item(i));
        if (c.pos === before) rbad(c, 'phần tử mảng không tiến con trỏ');
        if (f.until !== 'end' && ev(f.until, { vars: { $item: out[out.length - 1] }, parent: scope, special: {} }, c.budget)) break;
        if (c.pos > rEnd) rbad(c, 'mảng vượt quá vùng');
      }
    }
    result = out;
  } else if (t === 'switch') {
    const key = String(ev(f.on, scope, c.budget));
    const target = Object.hasOwn(f.cases, key) ? f.cases[key] : f.default;
    if (target === undefined) rbad(c, `switch không có case cho giá trị ${key}`);
    result = readValue(c, target, scope, rEnd, en, schema, depth + 1);
  } else if (Object.hasOwn(schema.types || {}, t)) result = readStruct(c, schema.types[t].fields, scope, rEnd, schema.types[t].endian || en, schema, depth + 1);
  else rbad(c, `kiểu không biết: ${t}`);
  if (rEnd !== end || f.length !== undefined) { if (c.pos > rEnd) rbad(c, 'đọc lố vùng'); c.pos = rEnd; }
  return result;
}

function readStruct(c, fields, parentScope, end, endian, schema, depth) {
  const vars = {};
  const scope = { vars, parent: parentScope, special: { $pos: () => c.pos, $remaining: () => end - c.pos } };
  for (const f of fields) {
    if (f.assert !== undefined) { if (!ev(f.assert, scope, c.budget)) rbad(c, f.message || `assert thất bại: ${f.assert}`); continue; }
    if (f.when !== undefined && !ev(f.when, scope, c.budget)) continue;
    let save = -1;
    if (f.offset !== undefined) { const o = ev(f.offset, scope, c.budget); if (!Number.isInteger(o) || o < 0 || o > c.u8.length) rbad(c, `offset không hợp lệ: ${o}`); save = c.pos; c.pos = o; }
    const v = readValue(c, f, scope, f.offset !== undefined ? c.u8.length : end, endian, schema, depth);
    if (save >= 0 && f.peek) c.pos = save;
    if (f.align) { const a = f.align; if (Number.isInteger(a) && a > 0) c.pos = Math.min(end, Math.ceil(c.pos / a) * a); }
    if (f.name !== undefined && v !== undefined && f.type !== 'skip') vars[f.name] = v;
  }
  return vars;
}

export function readBinary(buffer, schema, options = {}) {
  validateSchema(schema);
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte`);
  if (schema.magic && !matchMagic(u8, schema.magic)) fail('ERR_UNSUPPORTED_FORMAT', `magic bytes không khớp schema "${schema.id || schema.name || ''}"`);
  const c = new Ctx(u8, limits);
  const root = readStruct(c, schema.root.fields, null, u8.length, schema.endian || 'big', schema, 0);
  return { root, bytesRead: c.pos, budget: c.budget };
}

function matchMagic(u8, m) {
  const off = m.offset || 0;
  const bytes = m.hex ? (m.hex.match(/../g) || []).map((h) => parseInt(h, 16)) : [...new TextEncoder().encode(m.ascii || '')];
  return bytes.length > 0 && bytes.every((b, i) => u8[off + i] === b);
}

/** Chọn schema theo phần mở rộng + magic. */
export function matchSchema(fileName, u8, schemas = []) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return schemas.find((s) => (s.extensions || []).map((e) => e.replace(/^\./, '').toLowerCase()).includes(ext) && (!s.magic || matchMagic(u8, s.magic))) || null;
}

// ======================= ánh xạ sang AST =======================
export async function parseBinaryWithSchema(buffer, schema, options = {}) {
  const limits = resolveLimits(options.limits);
  const { root, budget } = readBinary(buffer, schema, options);
  const warnings = [];
  const a = schema.ast;
  if (!a || !a.tracks) fail('ERR_SCHEMA_INVALID', 'schema thiếu mục "ast.tracks" để ánh xạ sang AST');
  const top = { vars: root, parent: null, special: {} };
  const E = (src, sc) => ev(src, sc, budget);
  const ppq = a.ppq !== undefined ? Number(E(a.ppq, top)) : PPQ;
  if (!(ppq > 0)) fail('ERR_AST_INVALID', `ppq không hợp lệ: ${ppq}`);
  const unit = a.timeUnit || 'ticks';
  if (!['ticks', 'beats'].includes(unit)) fail('ERR_SCHEMA_INVALID', 'timeUnit phải là ticks|beats');
  const toTicks = unit === 'beats' ? (x) => x * PPQ : (x) => (x * PPQ) / ppq;
  const iter = (rule, sc, cb) => {
    const arr = E(rule.each, sc);
    if (!Array.isArray(arr)) fail('ERR_AST_INVALID', `"each": ${rule.each} không trả về mảng`);
    arr.forEach((item, i) => { const s2 = { vars: { [rule.as || 'it']: item }, parent: sc, special: { $index: i } }; if (rule.filter !== undefined && !E(rule.filter, s2)) return; cb(s2, item); });
  };

  const ov = normalizeTempoOverride(options.tempoOverride);
  let tempoPoints = [], tempoSource = 'file';
  const T = Array.isArray(a.tempo) ? a.tempo : a.tempo ? [a.tempo] : [];
  for (const r of T) {
    if (r.each) iter(r, top, (s) => tempoPoints.push({ tick: Math.round(toTicks(r.tick !== undefined ? E(r.tick, s) : 0)), bpm: Number(E(r.bpm, s)), num: r.num !== undefined ? E(r.num, s) : 4, den: r.den !== undefined ? E(r.den, s) : 4 }));
    else tempoPoints.push({ tick: r.tick !== undefined ? Math.round(toTicks(E(r.tick, top))) : 0, bpm: Number(E(r.bpm, top)), num: r.num !== undefined ? E(r.num, top) : 4, den: r.den !== undefined ? E(r.den, top) : 4 });
  }
  if (ov) { tempoPoints = ov; tempoSource = 'user'; }
  else if (!tempoPoints.length || tempoPoints.some((p) => !Number.isFinite(p.bpm))) { tempoPoints = [{ tick: 0, bpm: 120, num: 4, den: 4 }]; tempoSource = 'fallback'; }

  const tracks = [];
  let total = 0;
  iter(a.tracks, top, (ts, item) => {
    const tr = a.tracks;
    const notes = [];
    if (tr.notes) iter(tr.notes, ts, (ns) => {
      const r = tr.notes;
      const start = toTicks(Number(E(r.startTick, ns)));
      const end = r.endTick !== undefined ? toTicks(Number(E(r.endTick, ns))) : start + toTicks(Number(E(r.durationTick, ns)));
      notes.push({ pitch: Number(E(r.pitch, ns)), startTick: start, endTick: end, velocity: r.velocity !== undefined ? Number(E(r.velocity, ns)) : 100, ...(r.channel !== undefined ? { channel: Number(E(r.channel, ns)) } : {}) });
      if (++total > limits.maxNotes) fail('ERR_AST_TOO_LARGE', `vượt ${limits.maxNotes} nốt`);
    });
    tracks.push({ name: tr.name !== undefined ? String(E(tr.name, ts)) : '', muted: tr.muted !== undefined ? !!E(tr.muted, ts) : false, notes });
  });
  const title = options.title || (a.title !== undefined ? String(E(a.title, top)) : schema.name || 'Binary project');
  const { ast } = buildAST({ title, sourceFormat: 'custom_binary', sourceVersion: `${schema.id || schema.name || 'schema'}@${schema.version || 1}`, sourcePPQ: ppq, tempoPoints, tempoSource, tracks, warnings }, { maxNotes: limits.maxNotes, showMuted: options.showMuted });
  return { ast, warnings, info: { schema: schema.id || schema.name } };
}
