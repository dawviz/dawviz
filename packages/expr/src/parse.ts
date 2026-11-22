// Tokenizer + parser Pratt viết tay (AD-13, EXPRESSIONS §4). Chỉ nhận ký tự ASCII in được và khoảng trắng; từ chối Unicode lạ và ký tự điều khiển
// ngay ở bước tách từ. Áp giới hạn cứng §3.4 (độ dài, số nút, độ sâu, số `let`). Tên có dấu chấm (`note.velocity`) là MỘT tên phẳng, không phải
// truy cập thuộc tính: không có cú pháp nào để với tới đối tượng JavaScript.

export const LIMITS = Object.freeze({ maxSource: 2000, maxNodes: 500, maxDepth: 32, maxLets: 16, maxSteps: 10_000 });

export type ExprErrorCode =
  | 'ERR_EXPR_CHAR' | 'ERR_EXPR_SYNTAX' | 'ERR_EXPR_TOO_LONG' | 'ERR_EXPR_TOO_MANY_NODES' | 'ERR_EXPR_TOO_DEEP' | 'ERR_EXPR_TOO_MANY_LETS'
  | 'ERR_EXPR_UNKNOWN_NAME' | 'ERR_EXPR_UNKNOWN_FUNCTION' | 'ERR_EXPR_ARGS' | 'ERR_EXPR_TYPE' | 'ERR_EXPR_BUDGET' | 'ERR_EXPR_VALUE';
/** Lỗi duy nhất mà package ném ra: có mã và vị trí (ký tự) trong mã nguồn. */
export class ExprError extends Error {
  code: ExprErrorCode; pos: number;
  constructor(code: ExprErrorCode, message: string, pos = 0) { super(message); this.name = 'ExprError'; this.code = code; this.pos = pos; }
}

type Tok =
  | { k: 'num'; v: number; p: number } | { k: 'name'; v: string; p: number } | { k: 'str'; v: string; p: number }
  | { k: 'color'; v: string; p: number } | { k: 'op'; v: string; p: number } | { k: 'eof'; p: number };

const OPS = ['**', '==', '!=', '<=', '>=', '&&', '||', '+', '-', '*', '/', '%', '<', '>', '!', '?', ':', '(', ')', ',', ';', '=', '[', ']'];
const isDigit = (c: string) => c >= '0' && c <= '9';
const isStart = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
const isPart = (c: string) => isStart(c) || isDigit(c);
const isHex = (c: string) => isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');

export function tokenize(src: string): Tok[] {
  if (typeof src !== 'string') throw new ExprError('ERR_EXPR_SYNTAX', 'biểu thức phải là chuỗi');
  if (src.length > LIMITS.maxSource) throw new ExprError('ERR_EXPR_TOO_LONG', `biểu thức dài quá ${LIMITS.maxSource} ký tự`, LIMITS.maxSource);
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i], code = src.charCodeAt(i);
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (code < 0x20 || code > 0x7e) throw new ExprError('ERR_EXPR_CHAR', `ký tự không được phép (U+${code.toString(16).toUpperCase().padStart(4, '0')})`, i);
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') { const cc = src.charCodeAt(i); if (cc !== 9 && (cc < 0x20 || cc > 0x7e)) throw new ExprError('ERR_EXPR_CHAR', 'ký tự không được phép trong chú thích', i); i++; } continue; }
    const p = i;
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1] ?? ''))) {
      while (isDigit(src[i] ?? '')) i++;
      if (src[i] === '.') { i++; while (isDigit(src[i] ?? '')) i++; }
      if (src[i] === 'e' || src[i] === 'E') { const j = i; i++; if (src[i] === '+' || src[i] === '-') i++; if (!isDigit(src[i] ?? '')) { i = j; } else while (isDigit(src[i] ?? '')) i++; }
      if (isStart(src[i] ?? '')) throw new ExprError('ERR_EXPR_SYNTAX', 'số dính liền chữ', i);
      const v = Number(src.slice(p, i));
      if (!Number.isFinite(v)) throw new ExprError('ERR_EXPR_VALUE', 'số quá lớn', p);
      out.push({ k: 'num', v, p }); continue;
    }
    if (isStart(c)) {
      for (;;) { while (isPart(src[i] ?? '')) i++; if (src[i] === '.' && isStart(src[i + 1] ?? '')) { i++; continue; } break; }
      out.push({ k: 'name', v: src.slice(p, i), p }); continue;
    }
    if (c === '#') {
      i++; while (isHex(src[i] ?? '')) i++;
      const h = src.slice(p + 1, i);
      if (h.length !== 6 && h.length !== 8) throw new ExprError('ERR_EXPR_SYNTAX', 'màu cần dạng #rrggbb hoặc #rrggbbaa', p);
      out.push({ k: 'color', v: h.toLowerCase(), p }); continue;
    }
    if (c === '"') {
      i++; const s = i;
      while (i < src.length && src[i] !== '"') { if (src[i] === '\\' || src[i] === '\n') throw new ExprError('ERR_EXPR_SYNTAX', 'chuỗi không được có \\ hoặc xuống dòng', i); i++; }
      if (src[i] !== '"') throw new ExprError('ERR_EXPR_SYNTAX', 'chuỗi chưa đóng', p);
      const v = src.slice(s, i); i++;
      if (v.length > 32 || !/^[A-Za-z][A-Za-z0-9]*$/.test(v)) throw new ExprError('ERR_EXPR_SYNTAX', 'chuỗi chỉ dùng cho tên hằng (chữ và số, ≤ 32 ký tự)', p);
      out.push({ k: 'str', v, p }); continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new ExprError('ERR_EXPR_SYNTAX', `ký hiệu lạ "${c}"`, i);
    out.push({ k: 'op', v: op, p }); i += op.length;
  }
  out.push({ k: 'eof', p: src.length });
  return out;
}

export type Node =
  | { t: 'num'; v: number; p: number } | { t: 'bool'; v: boolean; p: number } | { t: 'str'; v: string; p: number } | { t: 'color'; v: string; p: number }
  | { t: 'name'; v: string; p: number } | { t: 'vec'; x: Node; y: Node; p: number }
  | { t: 'un'; op: string; a: Node; p: number } | { t: 'bin'; op: string; a: Node; b: Node; p: number }
  | { t: 'cond'; c: Node; a: Node; b: Node; p: number } | { t: 'call'; f: string; args: Node[]; p: number };
export interface Program { lets: { name: string; value: Node; p: number }[]; body: Node; nodes: number }

const BP: Record<string, number> = { '?': 1, '||': 2, '&&': 3, '==': 4, '!=': 4, '<': 5, '<=': 5, '>': 5, '>=': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7, '**': 8 };
const KEYWORDS = new Set(['let', 'true', 'false']);

export function parse(src: string): Program {
  const toks = tokenize(src);
  let i = 0, nodes = 0, depth = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const isOp = (v: string) => { const t = toks[i]; return t.k === 'op' && t.v === v; };
  const expect = (v: string) => { const t = next(); if (t.k !== 'op' || t.v !== v) throw new ExprError('ERR_EXPR_SYNTAX', `cần "${v}"`, t.p); };
  const node = <N extends Node>(n: N): N => { if (++nodes > LIMITS.maxNodes) throw new ExprError('ERR_EXPR_TOO_MANY_NODES', `biểu thức có hơn ${LIMITS.maxNodes} phần`, n.p); return n; };
  const enter = (p: number) => { if (++depth > LIMITS.maxDepth) throw new ExprError('ERR_EXPR_TOO_DEEP', `lồng sâu quá ${LIMITS.maxDepth} tầng`, p); };

  function primary(): Node {
    const t = next();
    switch (t.k) {
      case 'num': return node({ t: 'num', v: t.v, p: t.p });
      case 'str': return node({ t: 'str', v: t.v, p: t.p });
      case 'color': return node({ t: 'color', v: t.v, p: t.p });
      case 'name': {
        if (t.v === 'true' || t.v === 'false') return node({ t: 'bool', v: t.v === 'true', p: t.p });
        if (t.v === 'let') throw new ExprError('ERR_EXPR_SYNTAX', '"let" chỉ đứng ở đầu biểu thức', t.p);
        if (isOp('(')) {
          if (t.v.includes('.')) throw new ExprError('ERR_EXPR_UNKNOWN_FUNCTION', `không gọi được "${t.v}"`, t.p);
          next(); const args: Node[] = [];
          if (!isOp(')')) for (;;) { args.push(expr(0)); if (isOp(',')) { next(); continue; } break; }
          expect(')');
          if (args.length > 8) throw new ExprError('ERR_EXPR_ARGS', 'quá nhiều đối số', t.p);
          return node({ t: 'call', f: t.v, args, p: t.p });
        }
        return node({ t: 'name', v: t.v, p: t.p });
      }
      case 'op':
        if (t.v === '(') { const e = expr(0); expect(')'); return e; }
        if (t.v === '[') { const x = expr(0); expect(','); const y = expr(0); expect(']'); return node({ t: 'vec', x, y, p: t.p }); }
        // một ngôi: dưới ** (−2**2 = −4), trên * / %
        if (t.v === '-' || t.v === '!' || t.v === '+') { enter(t.p); const a = expr(7); depth--; return t.v === '+' ? a : node({ t: 'un', op: t.v, a, p: t.p }); }
        throw new ExprError('ERR_EXPR_SYNTAX', `không mong "${t.v}"`, t.p);
      case 'eof': throw new ExprError('ERR_EXPR_SYNTAX', 'biểu thức kết thúc giữa chừng', t.p);
    }
  }
  function expr(minBp: number): Node {
    enter(peek().p);
    let left = primary();
    for (;;) {
      const t = peek();
      if (t.k !== 'op' || BP[t.v] === undefined) break;
      const bp = BP[t.v];
      if (bp <= minBp) break; // ** và ?: kết hợp phải nhờ gọi vế phải với bp − 1
      next();
      if (t.v === '?') { const a = expr(0); expect(':'); const b = expr(bp - 1); left = node({ t: 'cond', c: left, a, b, p: t.p }); continue; }
      const right = expr(t.v === '**' ? bp - 1 : bp);
      left = node({ t: 'bin', op: t.v, a: left, b: right, p: t.p });
    }
    depth--;
    return left;
  }

  const lets: Program['lets'] = [];
  while (peek().k === 'name' && (peek() as { v: string }).v === 'let') {
    const kw = next(), nm = next();
    if (nm.k !== 'name' || nm.v.includes('.') || KEYWORDS.has(nm.v)) throw new ExprError('ERR_EXPR_SYNTAX', 'tên biến không hợp lệ', nm.p);
    if (lets.length >= LIMITS.maxLets) throw new ExprError('ERR_EXPR_TOO_MANY_LETS', `quá ${LIMITS.maxLets} biến`, kw.p);
    if (lets.some((l) => l.name === nm.v)) throw new ExprError('ERR_EXPR_SYNTAX', `biến "${nm.v}" khai báo hai lần`, nm.p);
    expect('=');
    lets.push({ name: nm.v, value: expr(0), p: kw.p });
    expect(';');
  }
  const body = expr(0);
  if (isOp(';')) next();
  if (peek().k !== 'eof') throw new ExprError('ERR_EXPR_SYNTAX', 'thừa ký tự sau biểu thức', peek().p);
  return { lets, body, nodes };
}
