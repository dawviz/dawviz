// XML scanner nhanh, không DOM, không mạng, không mở rộng entity tùy biến (an toàn trước XXE/billion-laughs).
// Nút: { n: tên, a: thuộc tính, c: con }. Văn bản thuần bị bỏ qua (Ableton/DAWproject lưu dữ liệu trong thuộc tính).
import { fail } from './errors.js';

const EMPTY_A = Object.freeze({});
const EMPTY_C = Object.freeze([]);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeEntities = (s) => s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (m, g) => {
  if (g[0] !== '#') return ENT[g];
  const cp = g[1] === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
  return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
});

function tagEnd(text, p) {
  const len = text.length;
  for (; p < len; p++) {
    const c = text.charCodeAt(p);
    if (c === 62) return p;
    if (c === 34 || c === 39) { const q = text.indexOf(c === 34 ? '"' : "'", p + 1); if (q < 0) return -1; p = q; }
  }
  return -1;
}

/**
 * @param {string} text
 * @param {{maxDepth?:number,maxNodes?:number,skip?:Set<string>|((name:string)=>boolean),onSkipped?:(name:string,start:number,end:number)=>void}} opts
 * skip: bỏ nguyên cả cây con (không dựng nút) — dùng để bỏ Devices/AudioTrack... trong file .als 10+ MB.
 */
export function parseXml(text, opts = {}) {
  const maxDepth = opts.maxDepth ?? 64, maxNodes = opts.maxNodes ?? 5e6;
  const skipFn = opts.skip instanceof Set ? (n) => opts.skip.has(n) : opts.skip;
  const root = { n: '#root', a: EMPTY_A, c: [] };
  const stack = [root];
  let nodes = 0, i = 0, skipDepth = 0, skipStart = 0, skipName = '';
  const len = text.length;
  const bad = (m) => fail('ERR_AST_INVALID', `XML không hợp lệ: ${m} (vị trí ${i})`);

  while (i < len) {
    const lt = text.indexOf('<', i);
    if (lt < 0) break;
    i = lt;
    const c1 = text.charCodeAt(lt + 1);
    if (c1 === 33) { // <! ...
      if (text.startsWith('<!--', lt)) { const e = text.indexOf('-->', lt + 4); if (e < 0) bad('chú thích không đóng'); i = e + 3; continue; }
      if (text.startsWith('<![CDATA[', lt)) { const e = text.indexOf(']]>', lt + 9); if (e < 0) bad('CDATA không đóng'); i = e + 3; continue; }
      // DOCTYPE: bỏ qua hoàn toàn (kể cả internal subset), không bao giờ mở rộng entity
      let e = text.indexOf('>', lt);
      const br = text.indexOf('[', lt);
      if (br >= 0 && br < e) e = text.indexOf(']>', br) + 1;
      if (e <= 0) bad('DOCTYPE không đóng');
      i = e + 1; continue;
    }
    if (c1 === 63) { const e = text.indexOf('?>', lt + 2); if (e < 0) bad('PI không đóng'); i = e + 2; continue; }
    if (c1 === 47) { // </name>
      const e = text.indexOf('>', lt + 2); if (e < 0) bad('thẻ đóng thiếu >');
      i = e + 1;
      if (skipDepth > 0) { if (--skipDepth === 0 && opts.onSkipped) opts.onSkipped(skipName, skipStart, i); continue; }
      if (stack.length > 1) stack.pop();
      continue;
    }
    // thẻ mở
    let p = lt + 1;
    while (p < len) { const c = text.charCodeAt(p); if (c <= 32 || c === 47 || c === 62) break; p++; }
    const name = text.slice(lt + 1, p);
    const end = tagEnd(text, p);
    if (end < 0) bad('thẻ mở không đóng');
    const selfClosing = text.charCodeAt(end - 1) === 47;
    i = end + 1;

    if (skipDepth > 0) { if (!selfClosing) skipDepth++; continue; }
    if (skipFn && skipFn(name)) {
      if (!selfClosing) { skipDepth = 1; skipStart = lt; skipName = name; }
      else if (opts.onSkipped) opts.onSkipped(name, lt, i);
      continue;
    }

    let attrs = EMPTY_A;
    let q = p;
    const aend = selfClosing ? end - 1 : end;
    while (q < aend) {
      let c = text.charCodeAt(q);
      if (c <= 32) { q++; continue; }
      const ns = q;
      while (q < aend) { c = text.charCodeAt(q); if (c === 61 || c <= 32) break; q++; }
      const an = text.slice(ns, q);
      while (q < aend && text.charCodeAt(q) <= 32) q++;
      if (text.charCodeAt(q) !== 61) { if (attrs === EMPTY_A) attrs = {}; attrs[an] = ''; continue; }
      q++;
      while (q < aend && text.charCodeAt(q) <= 32) q++;
      const quote = text.charCodeAt(q);
      if (quote !== 34 && quote !== 39) bad(`thuộc tính "${an}" thiếu dấu nháy`);
      const ve = text.indexOf(quote === 34 ? '"' : "'", q + 1);
      const raw = text.slice(q + 1, ve);
      if (attrs === EMPTY_A) attrs = {};
      attrs[an] = raw.indexOf('&') >= 0 ? decodeEntities(raw) : raw;
      q = ve + 1;
    }
    if (++nodes > maxNodes) fail('ERR_AST_TOO_LARGE', `XML có quá ${maxNodes} phần tử`);
    const node = { n: name, a: attrs, c: selfClosing ? EMPTY_C : [] };
    stack[stack.length - 1].c.push(node);
    if (!selfClosing) {
      stack.push(node);
      if (stack.length > maxDepth + 1) fail('ERR_AST_INVALID', `XML lồng quá ${maxDepth} cấp`);
    }
  }
  const top = root.c[0];
  if (!top) fail('ERR_AST_INVALID', 'XML rỗng');
  return top;
}

// ---- truy cập nhanh
export const kid = (n, name) => { if (!n) return undefined; for (const x of n.c) if (x.n === name) return x; return undefined; };
export const kids = (n, name) => (n ? n.c.filter((x) => x.n === name) : []);
export const at = (n, path) => { let cur = n; for (const p of path.split('/')) { cur = kid(cur, p); if (!cur) return undefined; } return cur; };
/** Giá trị thuộc tính (mặc định "Value") của nút tại path. */
export const val = (n, path, def, attr = 'Value') => { const x = path ? at(n, path) : n; return x && x.a[attr] !== undefined ? x.a[attr] : def; };
export const num = (n, path, def) => { const v = parseFloat(val(n, path, undefined)); return Number.isFinite(v) ? v : def; };
export function* descendants(n, name) { for (const c of n.c) { if (!name || c.n === name) yield c; yield* descendants(c, name); } }

/**
 * Kiểm kê đường dẫn: mỗi đường dẫn duy nhất -> số lần xuất hiện + thuộc tính mẫu.
 * Dùng để đối chiếu [VERIFY] với file thật (thay cho "dump tree" cũ vốn không in được cấu trúc lặp).
 */
export function pathInventory(root, { maxDepth = 12 } = {}) {
  const map = new Map();
  const walk = (n, path, depth) => {
    const key = path + '/' + n.n;
    let rec = map.get(key);
    if (!rec) { rec = { path: key, count: 0, attrs: Object.keys(n.a).slice(0, 6), sample: {} }; for (const k of rec.attrs) rec.sample[k] = String(n.a[k]).slice(0, 30); map.set(key, rec); }
    rec.count++;
    if (depth < maxDepth) for (const c of n.c) walk(c, key, depth + 1);
  };
  walk(root, '', 0);
  return [...map.values()];
}
export const formatInventory = (inv) => inv.map((r) => `${r.path}  ×${r.count}${r.attrs.length ? '  {' + r.attrs.map((k) => `${k}=${r.sample[k]}`).join(', ') + '}' : ''}`).join('\n');
