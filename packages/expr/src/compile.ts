// Kiểm ngữ nghĩa + "biên dịch" thành cây closure (AD-13, EXPRESSIONS §3–4). KHÔNG sinh chuỗi JavaScript, không eval/new Function.
// Bảng biến và hàm là Map: tra cứu không bao giờ chạm prototype. Kiểu được suy ra lúc biên dịch (số, đúng/sai, màu, vec2, tên hằng),
// nên lỗi kiểu và số đối số báo ngay khi người dùng gõ; lúc chạy chỉ còn đếm bước và thay NaN/∞ bằng giá trị dự phòng.
import { ExprError, LIMITS, parse, type Node } from './parse.ts';

export type Type = 'num' | 'bool' | 'color' | 'vec' | 'str';
/** Màu: sRGB 0..1 + alpha. Vec2: x, y. Biểu thức chỉ thấy các giá trị này, không thấy đối tượng nào của ứng dụng. */
export interface Color { readonly kind: 'color'; readonly r: number; readonly g: number; readonly b: number; readonly a: number }
export interface Vec { readonly kind: 'vec'; readonly x: number; readonly y: number }
export type Value = number | boolean | string | Color | Vec;

/** Ngân sách bước dùng chung (vd. cả một khung hình, EXPRESSIONS §3.4: 2.000.000). Hết thì ném ERR_EXPR_BUDGET. */
export interface Budget { left: number }
export const FRAME_BUDGET = 2_000_000;

/** Dữ liệu một lần đánh giá: biến (bản chụp số), `seed` của phần tử, và các móc tuỳ chọn đọc keyframe/tempo của chính thuộc tính. */
export interface EvalCtx {
  get(name: string): number | boolean | undefined;
  seed?: number;
  valueAt?(t: number): number;
  loop?(mode: 'cycle' | 'pingpong' | 'offset'): number;
  beatsToSec?(b: number): number;
  secToBeats?(s: number): number;
}
export interface CompileOptions {
  /** Biến đọc được và kiểu của chúng (danh sách trắng). `t` phải có nếu dùng wiggle/oscillate. */
  vars: ReadonlyMap<string, 'num' | 'bool'>;
  /** Kiểu kết quả mong muốn: sai kiểu thì báo ERR_EXPR_TYPE lúc biên dịch. Vắng = nhận mọi kiểu trừ tên hằng. */
  result?: Exclude<Type, 'str'>;
  /** Hàm easing theo tên (người gọi cung cấp, vd. EASINGS của Render Core) cho `ease(x, "tên")`. */
  easings?: ReadonlyMap<string, (x: number) => number>;
}
export interface Compiled { readonly type: Type; readonly nodes: number; evaluate(ctx: EvalCtx, budget?: Budget): Value }

// ───────────── màu ─────────────
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const color = (r: number, g: number, b: number, a = 1): Color => ({ kind: 'color', r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(a) });
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055);
type Lab = [number, number, number];
function toLab(c: Color): Lab {
  const r = toLin(c.r), g = toLin(c.g), b = toLin(c.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, A, B]: Lab, alpha: number): Color {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return color(toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), alpha);
}
const toLch = (c: Color): Lab => { const [L, A, B] = toLab(c); return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI]; };
const fromLch = (L: number, C: number, H: number, a: number) => fromLab([L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)], a);
function hsl(h: number, s: number, l: number): Color {
  const hh = (((h % 360) + 360) % 360) / 60, c = (1 - Math.abs(2 * clamp01(l) - 1)) * clamp01(s), x = c * (1 - Math.abs((hh % 2) - 1)), m = clamp01(l) - c / 2;
  const [r, g, b] = hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] : hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] : hh < 5 ? [x, 0, c] : [c, 0, x];
  return color(r + m, g + m, b + m);
}
const hex2 = (x: number) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
/** Màu → `#rrggbb` (như Render Core nhận); alpha bỏ. */
export const colorToHex = (c: Color): string => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
export function hexToColor(h: string): Color | null {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(h); if (!m) return null;
  const n = parseInt(m[1], 16);
  return color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, m[2] ? parseInt(m[2], 16) / 255 : 1);
}

// ───────────── ngẫu nhiên tất định ─────────────
function hash(a: number, b: number, c: number): number {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x27d4eb2f, 0x165667b1);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
const fade = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
function noise1(x: number, seed: number): number { const i = Math.floor(x), f = x - i; const a = hash(i, 0, seed), b = hash(i + 1, 0, seed); return a + (b - a) * fade(f); }
function noise2(x: number, y: number, seed: number): number {
  const i = Math.floor(x), j = Math.floor(y), fx = fade(x - i), fy = fade(y - j);
  const a = hash(i, j, seed), b = hash(i + 1, j, seed), c = hash(i, j + 1, seed), d = hash(i + 1, j + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

// ───────────── hàm có sẵn ─────────────
type Fn = (args: Value[], ctx: EvalCtx, site: number) => Value;
interface Sig { args: Type[]; ret: Type; fn: Fn; consts?: readonly (readonly string[] | null)[] }
const N = (x: Value) => x as number, C = (x: Value) => x as Color, V = (x: Value) => x as Vec;
const vec = (x: number, y: number): Vec => ({ kind: 'vec', x, y });
const num1 = (f: (x: number) => number): Sig => ({ args: ['num'], ret: 'num', fn: (a) => f(N(a[0])) });
const num2 = (f: (x: number, y: number) => number): Sig => ({ args: ['num', 'num'], ret: 'num', fn: (a) => f(N(a[0]), N(a[1])) });
const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (e0: number, e1: number, x: number) => { if (e0 === e1) return x < e0 ? 0 : 1; const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const mapR = (v: number, a: number, b: number, c: number, d: number) => (a === b ? c : c + ((v - a) / (b - a)) * (d - c));
const LOOPS = ['cycle', 'pingpong', 'offset'] as const, WAVES = ['sine', 'triangle', 'square', 'saw'] as const;
const wave = (shape: string, ph: number) => { const f = ph - Math.floor(ph); return shape === 'triangle' ? 1 - 4 * Math.abs(f - 0.5) : shape === 'square' ? (f < 0.5 ? 1 : -1) : shape === 'saw' ? 2 * f - 1 : Math.sin(2 * Math.PI * ph); };
const tOf = (ctx: EvalCtx) => { const t = ctx.get('t'); return typeof t === 'number' ? t : 0; };

const BUILTINS: ReadonlyMap<string, readonly Sig[]> = new Map<string, Sig[]>([
  ['abs', [num1(Math.abs), { args: ['vec'], ret: 'vec', fn: (a) => vec(Math.abs(V(a[0]).x), Math.abs(V(a[0]).y)) }]],
  ['sign', [num1(Math.sign)]], ['floor', [num1(Math.floor)]], ['ceil', [num1(Math.ceil)]], ['round', [num1(Math.round)]], ['fract', [num1((x) => x - Math.floor(x))]],
  ['sqrt', [num1(Math.sqrt)]], ['exp', [num1(Math.exp)]], ['log', [num1(Math.log)]], ['sin', [num1(Math.sin)]], ['cos', [num1(Math.cos)]], ['tan', [num1(Math.tan)]],
  ['asin', [num1(Math.asin)]], ['acos', [num1(Math.acos)]], ['atan', [num1(Math.atan)]], ['atan2', [num2(Math.atan2)]], ['pow', [num2(Math.pow)]],
  ['mod', [num2((x, y) => (y === 0 ? NaN : ((x % y) + y) % y))]], ['min', [num2(Math.min)]], ['max', [num2(Math.max)]],
  ['clamp', [{ args: ['num', 'num', 'num'], ret: 'num', fn: (a) => Math.min(Math.max(N(a[0]), N(a[1])), N(a[2])) }]],
  ['step', [num2((e, x) => (x < e ? 0 : 1))]],
  ['smoothstep', [{ args: ['num', 'num', 'num'], ret: 'num', fn: (a) => smooth(N(a[0]), N(a[1]), N(a[2])) }]],
  ['map', [{ args: ['num', 'num', 'num', 'num', 'num'], ret: 'num', fn: (a) => mapR(N(a[0]), N(a[1]), N(a[2]), N(a[3]), N(a[4])) }]],
  ['linear', [{ args: ['num', 'num', 'num', 'num', 'num'], ret: 'num', fn: (a) => { const k = N(a[1]) === N(a[2]) ? 1 : clamp01((N(a[0]) - N(a[1])) / (N(a[2]) - N(a[1]))); return mixN(N(a[3]), N(a[4]), k); } }]],
  ['random', [{ args: [], ret: 'num', fn: (_a, c, site) => hash(c.seed ?? 0, site, 0x5eed) }, { args: ['num', 'num'], ret: 'num', fn: (a, c, site) => mixN(N(a[0]), N(a[1]), hash(c.seed ?? 0, site, 0x5eed)) }]],
  ['noise', [{ args: ['num'], ret: 'num', fn: (a, c) => noise1(N(a[0]), c.seed ?? 0) }, { args: ['num', 'num'], ret: 'num', fn: (a, c) => noise2(N(a[0]), N(a[1]), c.seed ?? 0) }]],
  ['wiggle', [{ args: ['num', 'num'], ret: 'num', fn: (a, c, site) => (noise1(tOf(c) * N(a[0]), (c.seed ?? 0) + site * 7919) * 2 - 1) * N(a[1]) }]],
  ['oscillate', [{ args: ['num', 'num'], ret: 'num', fn: (a, c) => wave('sine', tOf(c) * N(a[0])) * N(a[1]) },
    { args: ['num', 'num', 'str'], ret: 'num', consts: [null, null, WAVES], fn: (a, c) => wave(a[2] as string, tOf(c) * N(a[0])) * N(a[1]) }]],
  ['loop', [{ args: ['str'], ret: 'num', consts: [LOOPS], fn: (a, c) => (c.loop ? c.loop(a[0] as 'cycle') : NaN) }]],
  ['valueAt', [{ args: ['num'], ret: 'num', fn: (a, c) => (c.valueAt ? c.valueAt(N(a[0])) : NaN) }]],
  ['beatsToSec', [{ args: ['num'], ret: 'num', fn: (a, c) => (c.beatsToSec ? c.beatsToSec(N(a[0])) : NaN) }]],
  ['secToBeats', [{ args: ['num'], ret: 'num', fn: (a, c) => (c.secToBeats ? c.secToBeats(N(a[0])) : NaN) }]],
  ['rgb', [{ args: ['num', 'num', 'num'], ret: 'color', fn: (a) => color(N(a[0]) / 255, N(a[1]) / 255, N(a[2]) / 255) },
    { args: ['num', 'num', 'num', 'num'], ret: 'color', fn: (a) => color(N(a[0]) / 255, N(a[1]) / 255, N(a[2]) / 255, N(a[3])) }]],
  ['hsl', [{ args: ['num', 'num', 'num'], ret: 'color', fn: (a) => hsl(N(a[0]), N(a[1]), N(a[2])) }]],
  ['oklch', [{ args: ['num', 'num', 'num'], ret: 'color', fn: (a) => fromLch(N(a[0]), Math.max(0, N(a[1])), N(a[2]), 1) }]],
  ['lighten', [{ args: ['color', 'num'], ret: 'color', fn: (a) => { const [L, A, B] = toLab(C(a[0])); return fromLab([L + N(a[1]), A, B], C(a[0]).a); } }]],
  ['darken', [{ args: ['color', 'num'], ret: 'color', fn: (a) => { const [L, A, B] = toLab(C(a[0])); return fromLab([L - N(a[1]), A, B], C(a[0]).a); } }]],
  ['saturate', [{ args: ['color', 'num'], ret: 'color', fn: (a) => { const [L, Ch, H] = toLch(C(a[0])); return fromLch(L, Math.max(0, Ch * (1 + N(a[1]))), H, C(a[0]).a); } }]],
  ['hue', [{ args: ['color', 'num'], ret: 'color', fn: (a) => { const [L, Ch, H] = toLch(C(a[0])); return fromLch(L, Ch, H + N(a[1]), C(a[0]).a); } }]],
  ['alpha', [{ args: ['color', 'num'], ret: 'color', fn: (a) => color(C(a[0]).r, C(a[0]).g, C(a[0]).b, N(a[1])) }]],
  ['vec', [{ args: ['num', 'num'], ret: 'vec', fn: (a) => vec(N(a[0]), N(a[1])) }]],
  ['length', [{ args: ['vec'], ret: 'num', fn: (a) => Math.hypot(V(a[0]).x, V(a[0]).y) }]],
  ['normalize', [{ args: ['vec'], ret: 'vec', fn: (a) => { const v = V(a[0]), l = Math.hypot(v.x, v.y); return l > 0 ? vec(v.x / l, v.y / l) : vec(0, 0); } }]],
  ['dot', [{ args: ['vec', 'vec'], ret: 'num', fn: (a) => V(a[0]).x * V(a[1]).x + V(a[0]).y * V(a[1]).y }]],
  ['rotate', [{ args: ['vec', 'num'], ret: 'vec', fn: (a) => { const v = V(a[0]), r = (N(a[1]) * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return vec(v.x * c - v.y * s, v.x * s + v.y * c); } }]],
]);
const MIX: Sig[] = [
  { args: ['num', 'num', 'num'], ret: 'num', fn: (a) => mixN(N(a[0]), N(a[1]), N(a[2])) },
  { args: ['color', 'color', 'num'], ret: 'color', fn: (a) => { const p = toLab(C(a[0])), q = toLab(C(a[1])), k = N(a[2]); return fromLab([mixN(p[0], q[0], k), mixN(p[1], q[1], k), mixN(p[2], q[2], k)], mixN(C(a[0]).a, C(a[1]).a, k)); } },
  { args: ['vec', 'vec', 'num'], ret: 'vec', fn: (a) => vec(mixN(V(a[0]).x, V(a[1]).x, N(a[2])), mixN(V(a[0]).y, V(a[1]).y, N(a[2]))) },
];
/** Tên hàm có sẵn (cho gợi ý, tài liệu và kiểm duyệt). */
export const BUILTIN_NAMES: readonly string[] = Object.freeze([...BUILTINS.keys(), 'mix', 'lerp', 'ease'].sort());
const CONSTS: ReadonlyMap<string, number> = new Map([['PI', Math.PI], ['TAU', 2 * Math.PI]]);

// ───────────── biên dịch ─────────────
type Ev = (ctx: EvalCtx, env: Value[], b: Budget) => Value;
const step = (b: Budget, p: number) => { if (--b.left < 0) throw new ExprError('ERR_EXPR_BUDGET', 'vượt ngân sách tính', p); };
const tname: Record<Type, string> = { num: 'số', bool: 'đúng/sai', color: 'màu', vec: 'vec2', str: 'tên hằng' };

export function compile(src: string, opts: CompileOptions): Compiled {
  const prog = parse(src);
  const scope = new Map<string, { slot: number; type: Type }>();
  let site = 0;
  const easings = opts.easings ?? new Map<string, (x: number) => number>();

  function build(n: Node): { type: Type; ev: Ev } {
    switch (n.t) {
      case 'num': { const v = n.v; return { type: 'num', ev: () => v }; }
      case 'bool': { const v = n.v; return { type: 'bool', ev: () => v }; }
      case 'str': { const v = n.v; return { type: 'str', ev: () => v }; }
      case 'color': { const c = hexToColor(n.v)!; return { type: 'color', ev: () => c }; }
      case 'vec': { const x = need(n.x, 'num'), y = need(n.y, 'num'), p = n.p; return { type: 'vec', ev: (c, e, b) => { step(b, p); return vec(N(x(c, e, b)), N(y(c, e, b))); } }; }
      case 'name': {
        const local = scope.get(n.v); if (local) { const s = local.slot; return { type: local.type, ev: (_c, e) => e[s] }; }
        const k = CONSTS.get(n.v); if (k !== undefined) return { type: 'num', ev: () => k };
        const vt = opts.vars.get(n.v);
        if (!vt) throw new ExprError('ERR_EXPR_UNKNOWN_NAME', `không có biến "${n.v}"`, n.p);
        const name = n.v, fallback = vt === 'bool' ? false : 0, p = n.p;
        return { type: vt, ev: (c, _e, b) => { step(b, p); const v = c.get(name); return typeof v === (vt === 'bool' ? 'boolean' : 'number') ? (v as number | boolean) : fallback; } };
      }
      case 'un': {
        const a = build(n.a), p = n.p, av = a.ev;
        if (n.op === '!') { if (a.type !== 'bool') throw typeErr(n.p, '!', a.type); return { type: 'bool', ev: (c, e, b) => { step(b, p); return !av(c, e, b); } }; }
        if (a.type === 'num') return { type: 'num', ev: (c, e, b) => { step(b, p); return -N(av(c, e, b)); } };
        if (a.type === 'vec') return { type: 'vec', ev: (c, e, b) => { step(b, p); const v = V(av(c, e, b)); return vec(-v.x, -v.y); } };
        throw typeErr(n.p, '-', a.type);
      }
      case 'bin': return binary(n.op, build(n.a), build(n.b), n.p);
      case 'cond': {
        const cc = need(n.c, 'bool'), a = build(n.a), bb = build(n.b), p = n.p;
        if (a.type !== bb.type || a.type === 'str') throw new ExprError('ERR_EXPR_TYPE', `hai nhánh của ? : phải cùng kiểu (${tname[a.type]} / ${tname[bb.type]})`, n.p);
        const av = a.ev, bv = bb.ev;
        return { type: a.type, ev: (c, e, b) => { step(b, p); return cc(c, e, b) ? av(c, e, b) : bv(c, e, b); } };
      }
      case 'call': return call(n);
    }
  }
  function need(n: Node, t: Type): Ev { const r = build(n); if (r.type !== t) throw new ExprError('ERR_EXPR_TYPE', `cần ${tname[t]}, có ${tname[r.type]}`, n.p); return r.ev; }
  function typeErr(p: number, op: string, a: Type, b?: Type) { return new ExprError('ERR_EXPR_TYPE', `không dùng "${op}" cho ${tname[a]}${b ? ` và ${tname[b]}` : ''}`, p); }
  function binary(op: string, A: { type: Type; ev: Ev }, B: { type: Type; ev: Ev }, p: number): { type: Type; ev: Ev } {
    const a = A.ev, b2 = B.ev, ta = A.type, tb = B.type;
    const nn = (f: (x: number, y: number) => number | boolean, t: Type) => ({ type: t, ev: ((c, e, b) => { step(b, p); return f(N(a(c, e, b)), N(b2(c, e, b))); }) as Ev });
    switch (op) {
      case '+': case '-':
        if (ta === 'num' && tb === 'num') return nn(op === '+' ? (x, y) => x + y : (x, y) => x - y, 'num');
        if (ta === 'vec' && tb === 'vec') { const s = op === '+' ? 1 : -1; return { type: 'vec', ev: (c, e, b) => { step(b, p); const u = V(a(c, e, b)), w = V(b2(c, e, b)); return vec(u.x + s * w.x, u.y + s * w.y); } }; }
        throw typeErr(p, op, ta, tb);
      case '*':
        if (ta === 'num' && tb === 'num') return nn((x, y) => x * y, 'num');
        if ((ta === 'vec' && tb === 'num') || (ta === 'num' && tb === 'vec')) { const vf = ta === 'vec'; return { type: 'vec', ev: (c, e, b) => { step(b, p); const x = a(c, e, b), y = b2(c, e, b); const v = V(vf ? x : y), k = N(vf ? y : x); return vec(v.x * k, v.y * k); } }; }
        throw typeErr(p, op, ta, tb);
      case '/':
        if (ta === 'num' && tb === 'num') return nn((x, y) => x / y, 'num');
        if (ta === 'vec' && tb === 'num') return { type: 'vec', ev: (c, e, b) => { step(b, p); const v = V(a(c, e, b)), k = N(b2(c, e, b)); return vec(v.x / k, v.y / k); } };
        throw typeErr(p, op, ta, tb);
      case '%': if (ta === 'num' && tb === 'num') return nn((x, y) => x % y, 'num'); throw typeErr(p, op, ta, tb);
      case '**': if (ta === 'num' && tb === 'num') return nn((x, y) => x ** y, 'num'); throw typeErr(p, op, ta, tb);
      case '<': case '<=': case '>': case '>=':
        if (ta !== 'num' || tb !== 'num') throw typeErr(p, op, ta, tb);
        return nn(op === '<' ? (x, y) => x < y : op === '<=' ? (x, y) => x <= y : op === '>' ? (x, y) => x > y : (x, y) => x >= y, 'bool');
      case '==': case '!=': {
        if (ta !== tb || ta === 'color' || ta === 'vec') throw typeErr(p, op, ta, tb);
        const eq = op === '==';
        return { type: 'bool', ev: (c, e, b) => { step(b, p); return (a(c, e, b) === b2(c, e, b)) === eq; } };
      }
      case '&&': case '||': {
        if (ta !== 'bool' || tb !== 'bool') throw typeErr(p, op, ta, tb);
        return op === '&&' ? { type: 'bool', ev: (c, e, b) => { step(b, p); return !!a(c, e, b) && !!b2(c, e, b); } } : { type: 'bool', ev: (c, e, b) => { step(b, p); return !!a(c, e, b) || !!b2(c, e, b); } };
      }
    }
    throw new ExprError('ERR_EXPR_SYNTAX', `toán tử lạ "${op}"`, p);
  }
  function call(n: Extract<Node, { t: 'call' }>): { type: Type; ev: Ev } {
    const args = n.args.map(build), types = args.map((a) => a.type), p = n.p, me = site++;
    if (n.f === 'ease') return easeCall(n, args);
    const sigs = n.f === 'mix' || n.f === 'lerp' ? MIX : BUILTINS.get(n.f);
    if (!sigs) throw new ExprError('ERR_EXPR_UNKNOWN_FUNCTION', `không có hàm "${n.f}"`, p);
    const sig = sigs.find((s) => s.args.length === types.length && s.args.every((t, i) => t === types[i]));
    if (!sig) {
      const arity = sigs.some((s) => s.args.length === types.length);
      throw new ExprError(arity ? 'ERR_EXPR_TYPE' : 'ERR_EXPR_ARGS', `${n.f}(${types.map((t) => tname[t]).join(', ')}) không hợp lệ; dùng ${sigs.map((s) => `${n.f}(${s.args.map((t) => tname[t]).join(', ')})`).join(' hoặc ')}`, p);
    }
    sig.consts?.forEach((allowed, i) => {
      if (!allowed) return;
      const a = n.args[i];
      if (a.t !== 'str' || !allowed.includes(a.v)) throw new ExprError('ERR_EXPR_ARGS', `đối số ${i + 1} của ${n.f} phải là một trong ${allowed.map((x) => `"${x}"`).join(', ')}`, a.p);
    });
    const evs = args.map((a) => a.ev), fn = sig.fn;
    return { type: sig.ret, ev: (c, e, b) => { step(b, p); return fn(evs.map((f) => f(c, e, b)), c, me); } };
  }
  function easeCall(n: Extract<Node, { t: 'call' }>, args: { type: Type; ev: Ev }[]): { type: Type; ev: Ev } {
    const last = n.args[n.args.length - 1], p = n.p;
    if (!(n.args.length === 2 || n.args.length === 6)) throw new ExprError('ERR_EXPR_ARGS', 'ease(x, "tên") hoặc ease(v, a, b, c, d, "tên")', p);
    if (last.t !== 'str') throw new ExprError('ERR_EXPR_ARGS', 'đối số cuối của ease phải là tên easing trong ngoặc kép', last.p);
    const f = easings.get(last.v);
    if (!f) throw new ExprError('ERR_EXPR_ARGS', `không có easing "${last.v}"`, last.p);
    if (args.slice(0, -1).some((a) => a.type !== 'num')) throw new ExprError('ERR_EXPR_TYPE', 'ease cần số', p);
    const evs = args.slice(0, -1).map((a) => a.ev);
    if (evs.length === 1) return { type: 'num', ev: (c, e, b) => { step(b, p); return f(clamp01(N(evs[0](c, e, b)))); } };
    return { type: 'num', ev: (c, e, b) => { step(b, p); const [v, a0, a1, c0, c1] = evs.map((x) => N(x(c, e, b))); const k = a0 === a1 ? 1 : clamp01((v - a0) / (a1 - a0)); return mixN(c0, c1, f(k)); } };
  }

  const lets: Ev[] = [];
  for (const l of prog.lets) {
    if (opts.vars.has(l.name) || CONSTS.has(l.name) || BUILTINS.has(l.name)) throw new ExprError('ERR_EXPR_SYNTAX', `"${l.name}" trùng tên có sẵn`, l.p);
    const r = build(l.value);
    if (r.type === 'str') throw new ExprError('ERR_EXPR_TYPE', 'biến không giữ tên hằng', l.p);
    scope.set(l.name, { slot: lets.length, type: r.type }); lets.push(r.ev);
  }
  const body = build(prog.body);
  if (body.type === 'str') throw new ExprError('ERR_EXPR_TYPE', 'kết quả không được là tên hằng', prog.body.p);
  if (opts.result && body.type !== opts.result) throw new ExprError('ERR_EXPR_TYPE', `kết quả phải là ${tname[opts.result]}, đang là ${tname[body.type]}`, prog.body.p);
  const ev = body.ev, nlet = lets.length;
  return {
    type: body.type, nodes: prog.nodes,
    evaluate(ctx, budget) {
      const b = budget ?? { left: LIMITS.maxSteps };
      const local: Budget = { left: Math.min(LIMITS.maxSteps, b.left) }, start = local.left;
      const env: Value[] = new Array(nlet);
      try {
        for (let i = 0; i < nlet; i++) env[i] = lets[i](ctx, env, local);
        return ev(ctx, env, local);
      } finally { b.left -= start - local.left; if (b.left < 0) b.left = 0; }
    },
  };
}

/** Kết quả hữu hạn? (NaN/∞ hoặc màu/vec có thành phần NaN → người gọi dùng giá trị dự phòng.) */
export function isFiniteValue(v: Value): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'object') return v.kind === 'vec' ? Number.isFinite(v.x) && Number.isFinite(v.y) : [v.r, v.g, v.b, v.a].every(Number.isFinite);
  return true;
}
