// T-29 (AD-13, EXPRESSIONS §4): kiểm bắt buộc — đối chứng số học, bộ tấn công mẫu, giới hạn cứng, kiểu, tất định, fuzz có seed, quét mã cấm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { compile, colorToHex, ExprError, LIMITS, BUILTIN_NAMES, type EvalCtx, type Value } from '../src/index.ts';

const VARS = new Map<string, 'num' | 'bool'>([['t', 'num'], ['beat.phase', 'num'], ['note.velocity', 'num'], ['note.pitch', 'num'], ['note.active', 'bool'], ['note.sinceEnd', 'num'], ['track.pan', 'num'], ['value', 'num']]);
const EASE = new Map<string, (x: number) => number>([['linear', (x) => x], ['easeOutCubic', (x) => 1 - (1 - x) ** 3]]);
const data: Record<string, number | boolean> = { t: 1.25, 'beat.phase': 0.25, 'note.velocity': 96, 'note.pitch': 60, 'note.active': false, 'note.sinceEnd': 0.2, 'track.pan': -0.5, value: 10 };
const ctx: EvalCtx = { get: (n) => data[n], seed: 42, valueAt: (t) => t * 2, loop: () => 7, beatsToSec: (b) => b / 2, secToBeats: (s) => s * 2 };
const run = (src: string, result?: 'num' | 'bool' | 'color' | 'vec'): Value => compile(src, { vars: VARS, easings: EASE, result }).evaluate(ctx);
const code = (src: string): string => { try { compile(src, { vars: VARS, easings: EASE }); return 'ok'; } catch (e) { assert.ok(e instanceof ExprError, `lỗi lạ cho ${JSON.stringify(src).slice(0, 80)}: ${e}`); return (e as ExprError).code; } };
const near = (a: Value, b: number, e = 1e-9) => assert.ok(typeof a === 'number' && Math.abs(a - b) <= e, `${a} ≉ ${b}`);

test('đối chứng số học và thứ tự ưu tiên', () => {
  near(run('1 + 2 * 3'), 7); near(run('(1 + 2) * 3'), 9); near(run('2 ** 3 ** 2'), 512); near(run('-2 ** 2'), -4); near(run('-2 * 3'), -6);
  near(run('10 % 4'), 2); near(run('7 / 2'), 3.5); near(run('1e3 + .5'), 1000.5);
  assert.equal(run('1 < 2 && !(3 >= 4) || false'), true);
  near(run('note.active ? 1 : 0.5'), 0.5); near(run('true ? 1 : false ? 2 : 3'), 1);
  near(run('0.5 + note.velocity / 127 * (1 + 0.3 * sin(beat.phase * TAU))'), 0.5 + (96 / 127) * 1.3, 1e-12);
  near(run('let a = 2; let b = a * 3; a + b;'), 8);
  near(run('clamp(5, 0, 1) + min(2, 3) + max(2, 3) + abs(-1) + floor(1.7) + mod(-1, 3)'), 1 + 2 + 3 + 1 + 1 + 2);
  near(run('map(5, 0, 10, 100, 200)'), 150); near(run('linear(20, 0, 10, 0, 1)'), 1); near(run('smoothstep(0, 1, 0.5)'), 0.5);
  near(run('ease(0.5, "easeOutCubic")'), 0.875); near(run('ease(5, 0, 10, 0, 100, "linear")'), 50);
  near(run('valueAt(3) + loop("pingpong") + beatsToSec(4) + secToBeats(1)'), 6 + 7 + 2 + 2);
  near(run('length(vec(3, 4)) + dot([1, 2], [3, 4])'), 5 + 11);
  near(run('note.active ? 1 : ease(clamp(1 - note.sinceEnd / 0.5, 0, 1), "easeOutCubic")'), 1 - (1 - 0.6) ** 3, 1e-12);
});

test('màu: rgb, hsl, mix OKLab, lighten/darken, xuất #rrggbb; vec và kiểu kết quả', () => {
  const hex = (s: string) => colorToHex(run(s, 'color') as never);
  assert.equal(hex('#ff0000'), '#ff0000'); assert.equal(hex('rgb(0, 128, 255)'), '#0080ff'); assert.equal(hex('hsl(120, 1, 0.5)'), '#00ff00');
  assert.equal(hex('mix(#000000, #ffffff, 0)'), '#000000'); assert.equal(hex('mix(#000000, #ffffff, 1)'), '#ffffff');
  assert.ok(hex('lighten(#404040, 0.2)') > hex('#404040')); assert.ok(hex('darken(#808080, 0.2)') < hex('#808080'));
  assert.equal(hex('mix(#4aa8f5, #ff6b9d, smoothstep(48, 72, note.pitch))'), hex('mix(#4aa8f5, #ff6b9d, 0.5)'));
  const v = run('rotate(vec(1, 0), 90)') as { x: number; y: number }; near(v.x, 0, 1e-12); near(v.y, 1, 1e-12);
  assert.equal(code('mix(#000000, 1, 0.5)'), 'ERR_EXPR_TYPE');
  assert.throws(() => compile('1 + 1', { vars: VARS, result: 'color' }), (e: ExprError) => e.code === 'ERR_EXPR_TYPE');
});

test('bộ tấn công mẫu: mọi mẫu bị từ chối khi phân tích (chỉ ExprError có mã) hoặc cho giá trị hữu hạn/dự phòng', () => {
  const attacks = [
    'constructor', '__proto__', 'prototype', 'this', 'globalThis', 'window', 'self', 'import', 'eval("1")', 'Function("x")', 'note.constructor', 'beat.__proto__',
    't["con"+"structor"]', 't.constructor', '(1).constructor', 'note.velocity.toString()', 'sin.call(1)', 'require("fs")', 'process.exit()', 'import("x")',
    'ｃonstructor', 'a\u0000b', '1​+1', '"\\x41"', '`1`', "'a'", 'x => x', 'function(){}', '{}', 'a = 1', 'let t = 1; t', 'let sin = 1; sin',
    'note.velocity++', '1 | 2', '1 & 2', '~1', 'a.b()', 'valueAt', '#12', '#gggggg', '"constructor"', 'loop("constructor")', 'ease(1, "constructor")',
    'x'.repeat(5000), '('.repeat(100) + '1' + ')'.repeat(100), Array(600).fill('1').join('+'), Array(20).fill(0).map((_, i) => `let v${i} = ${i};`).join('') + '1',
  ];
  for (const a of attacks) assert.notEqual(code(a), 'ok', `chấp nhận nhầm: ${JSON.stringify(a).slice(0, 60)}`);
  // Hợp lệ về cú pháp nhưng giá trị bệnh lý: chạy không ném lỗi lạ, cho NaN/∞ để người gọi thay bằng giá trị dự phòng
  for (const s of ['1/0', '-1/0', '0/0', '10 ** 400', 'log(-1)', 'sqrt(-1)', 'mod(1, 0)']) { const v = run(s); assert.equal(typeof v, 'number'); }
  assert.equal(code('x'.repeat(LIMITS.maxSource + 1)), 'ERR_EXPR_TOO_LONG');
  assert.equal(code('('.repeat(40) + '1' + ')'.repeat(40)), 'ERR_EXPR_TOO_DEEP');
  assert.equal(code(Array(600).fill('1').join('+')), 'ERR_EXPR_TOO_MANY_NODES');
  assert.equal(code(Array(17).fill(0).map((_, i) => `let v${i} = ${i};`).join('') + '1'), 'ERR_EXPR_TOO_MANY_LETS');
  assert.equal(code('ｃonstructor'), 'ERR_EXPR_CHAR'); assert.equal(code('window'), 'ERR_EXPR_UNKNOWN_NAME'); assert.equal(code('eval(1)'), 'ERR_EXPR_UNKNOWN_FUNCTION');
  assert.equal(code('sin(1, 2)'), 'ERR_EXPR_ARGS'); assert.equal(code('sin(true)'), 'ERR_EXPR_TYPE'); assert.equal(code('oscillate(1, 1, "zigzag")'), 'ERR_EXPR_ARGS');
});

test('ngân sách bước: dùng chung qua nhiều lần đánh giá, hết thì ERR_EXPR_BUDGET; ngân sách mỗi lần không vượt LIMITS.maxSteps', () => {
  const c = compile('sin(t) + cos(t) * 2', { vars: VARS });
  const budget = { left: 50 };
  let ok = 0;
  assert.throws(() => { for (let i = 0; i < 100; i++) { c.evaluate(ctx, budget); ok++; } }, (e: ExprError) => e.code === 'ERR_EXPR_BUDGET');
  assert.ok(ok > 0 && ok < 50); assert.equal(budget.left, 0);
});

test('tất định: cùng biểu thức + cùng dữ liệu → cùng kết quả; random/noise/wiggle phụ thuộc seed, không phụ thuộc thời gian thật', () => {
  const src = 'random() + random(10, 20) + noise(t * 3) + noise(t, 2) + wiggle(4, 10) + oscillate(2, 1, "triangle")';
  const a = run(src), b = run(src);
  assert.equal(a, b);
  const c2 = compile(src, { vars: VARS }).evaluate({ ...ctx, seed: 43 });
  assert.notEqual(c2, a);
  const r1 = run('random()'), r2 = run('random() * 0 + random()'); // hai lời gọi random() khác chỗ cho số khác nhau
  assert.notEqual(r1, (r2 as number));
  for (let s = 0; s < 200; s++) { const v = compile('random()', { vars: VARS }).evaluate({ ...ctx, seed: s }) as number; assert.ok(v >= 0 && v < 1); }
});

test('fuzz có seed: 60.000 biểu thức sinh ngẫu nhiên — chỉ ExprError có mã, không treo, không vượt ngân sách', () => {
  let s = 1234567;
  const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const atoms = ['1', '0.5', '-3', 't', 'note.velocity', 'note.active', 'true', '#ff00aa', 'PI', '"sine"', 'vec(1,2)', '[1, 2]', 'beat.phase', 'zz', '1e309'];
  const ops = ['+', '-', '*', '/', '%', '**', '<', '==', '&&', '||', '?', ':', '(', ')', ',', '!', ';', '='];
  const fns = [...BUILTIN_NAMES, 'nope', 'let'];
  const gen = (d: number): string => {
    const r = rnd();
    if (d > 6 || r < 0.3) return pick(atoms);
    if (r < 0.55) return `${gen(d + 1)} ${pick(ops)} ${gen(d + 1)}`;
    if (r < 0.75) return `${pick(fns)}(${Array.from({ length: Math.floor(rnd() * 4) }, () => gen(d + 1)).join(', ')})`;
    if (r < 0.85) return `(${gen(d + 1)})`;
    if (r < 0.92) return `${gen(d + 1)} ? ${gen(d + 1)} : ${gen(d + 1)}`;
    return String.fromCharCode(Math.floor(rnd() * 160)) + gen(d + 1);
  };
  let compiled = 0;
  for (let i = 0; i < 60_000; i++) {
    const src = rnd() < 0.1 ? `let a = ${gen(0)}; ${gen(0)}` : gen(0);
    let c;
    try { c = compile(src, { vars: VARS, easings: EASE }); } catch (e) { assert.ok(e instanceof ExprError, `${src}: ${e}`); continue; }
    compiled++;
    const budget = { left: 1_000_000 };
    try { c.evaluate(ctx, budget); } catch (e) { assert.ok(e instanceof ExprError, `${src}: ${e}`); }
    assert.ok(budget.left >= 0);
  }
  assert.ok(compiled > 1000, `chỉ ${compiled} biểu thức hợp lệ`);
});

test('quét mã nguồn: không eval, new Function, with, Proxy, Reflect, import động, Date, Math.random, performance', () => {
  const dir = path.join(import.meta.dirname, '../src');
  for (const f of fs.readdirSync(dir)) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, '""');
    for (const bad of [/\beval\s*\(/, /new\s+Function/, /\bFunction\s*\(/, /\bwith\s*\(/, /\bProxy\b/, /\bReflect\b/, /\bimport\s*\(/, /\bDate\b/, /Math\.random/, /\bperformance\b/, /setTimeout|setInterval/])
      assert.ok(!bad.test(src), `${f}: ${bad}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined, 'phải zero-dependency');
});
