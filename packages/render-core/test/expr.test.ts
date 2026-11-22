// T-29/T-30: biểu thức `{expr}` trong `WidgetSpec.animate` — kiểm khi đọc preset, tính mỗi khung, giá trị dự phòng khi lỗi, ngân sách bước cả khung (tất định).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, FRAME_BUDGET, EXPR_VARS, compileExpr, ADDABLE_WIDGETS, animatablePaths, createWidget, defaultScene, type WidgetSpec, type Animation } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const ast = synthAst({ duration: 20 });
const box = (id: string, animate: Record<string, unknown>, type = 'TEXT') => ({ id, type, layout: { x: 100, y: 100, width: 200, height: 100 }, properties: {}, animate });
const sceneOf = (widgets: object[]) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets });

test('đọc preset: biểu thức hợp lệ giữ nguyên; lỗi cú pháp/tên lạ/sai kiểu bị bỏ kèm cảnh báo có mã; lựa chọn không nhận biểu thức', () => {
  const r = sceneOf([box('a', {
    'layout.x': { expr: '100 + t * 50' }, opacity: { expr: 'clamp(note.hit, 0.2, 1)' },
    'layout.y': { expr: 'window.alert' }, 'layout.rotation': { expr: '#ff0000' }, 'layout.width': { expr: '(' },
    align: { expr: '1' },
  })]);
  const an = r.scene.widgets[0].animate!;
  assert.deepEqual(Object.keys(an).sort(), ['layout.x', 'opacity']);
  const msgs = r.warnings.map((w) => w.message).join(' | ');
  for (const c of ['ERR_EXPR_UNKNOWN_NAME', 'ERR_EXPR_TYPE', 'ERR_EXPR_SYNTAX']) assert.ok(msgs.includes(c), c);
  assert.throws(() => compileExpr('1', 'choice'));
  const again = sanitizeScene(JSON.parse(JSON.stringify(r.scene)));
  assert.deepEqual(again.warnings, []);
});

test('tính mỗi khung: vị trí theo t, màu và bật/tắt theo biểu thức; biến value = giá trị tĩnh; tất định, tua tới đâu cũng đúng', () => {
  const sc = sceneOf([box('a', { 'layout.x': { expr: 'value + t * 50' }, barColor: { expr: 't < 1 ? #ff0000 : mix(#000000, #ffffff, 1)' } }, 'TIME_BAR')]).scene;
  const at = (t: number) => layoutFrame(sc, derivedOf(ast), ast, t)[0].widget as WidgetSpec<{ barColor: string }>;
  assert.equal(at(2).layout.x, 200); assert.equal(at(0).layout.x, 100);
  assert.equal(at(0.5).properties.barColor.toLowerCase(), '#ff0000'); assert.equal(at(3).properties.barColor.toLowerCase(), '#ffffff');
  assert.deepEqual(layoutFrame(sc, derivedOf(ast), ast, 7.3), layoutFrame(sc, derivedOf(ast), ast, 7.3));
  const tb = sceneOf([box('b', { showBars: { expr: 'bar.index % 2 == 1' } }, 'TIME_BAR')]).scene;
  assert.equal(typeof (layoutFrame(tb, derivedOf(ast), ast, 0)[0].widget.properties as { showBars: unknown }).showBars, 'boolean');
});

test('NaN/∞ → giá trị tĩnh và báo; ngân sách cả khung hết thì widget sau dùng giá trị tĩnh — cùng chỗ cắt mỗi lần (tất định)', () => {
  const issues: string[] = [];
  const d = { ...derivedOf(ast), onExprIssue: (i: { widgetId: string; code: string }) => issues.push(`${i.widgetId}:${i.code}`) };
  const nan = sceneOf([box('a', { 'layout.x': { expr: '0 / 0' } })]).scene;
  assert.equal(layoutFrame(nan, d, ast, 1)[0].widget.layout.x, 100);
  assert.deepEqual(issues, ['a:ERR_EXPR_VALUE']);
  // Preset tối đa 64 widget × 24 hoạt hình × ≤ 500 bước ≈ 768.000 bước < FRAME_BUDGET: dựng thẳng scene lớn (không qua bộ đọc preset) để chạm ngân sách.
  const heavy = Array.from({ length: 150 }, () => 'sin(t)').join(' + '); // 449 nút ≈ 449 bước
  const one = sceneOf([box('w', { 'layout.x': { expr: heavy }, 'layout.y': { expr: heavy } })]).scene.widgets[0];
  const n = Math.ceil(FRAME_BUDGET / 449 / 2) + 50;
  const many = { ...nan, widgets: Array.from({ length: n }, (_, i) => ({ ...one, id: `w${i}`, zIndex: i })) };
  issues.length = 0;
  const f1 = layoutFrame(many, d, ast, 1).map((e) => [e.widget.layout.x, e.widget.layout.y]);
  const n1 = issues.length; issues.length = 0;
  assert.ok(n1 > 0 && issues.length === 0, 'phải có widget hết ngân sách');
  assert.ok(Math.abs(f1[0][0] - 150 * Math.sin(1)) < 1e-9); assert.equal(f1[n - 1][0], 100); // đầu: tính được; đuôi: giá trị tĩnh
  const f2 = layoutFrame(many, d, ast, 1).map((e) => [e.widget.layout.x, e.widget.layout.y]);
  assert.deepEqual(f1, f2); assert.equal(issues.length, n1);
  for (const [x, y] of f1) assert.ok(Number.isFinite(x) && Number.isFinite(y));
});

test('fuzz: biểu thức cực đoan cho mọi đường dẫn số/màu/bật-tắt của mọi loại widget — không ném, primitive hữu hạn', () => {
  const exprs: Record<string, string[]> = {
    number: ['1e308 * 10', '-1e9', 'noise(t * 100) * 1e6', 'value * random(-5, 5)', 'sqrt(-1)'],
    color: ['mix(#000000, #ffffff, note.hit)', 'hsl(t * 360, 1, 0.5)', 'lighten(#123456, 99)'],
    bool: ['note.active', 'fract(t) > 0.5', 'true'],
  };
  let n = 0;
  for (const type of ADDABLE_WIDGETS) {
    const base = defaultScene('16:9'), w0 = createWidget(base, type);
    for (const [path, kind] of animatablePaths(type)) {
      for (const expr of exprs[kind] ?? []) {
        const w: WidgetSpec = { ...w0, animate: { [path]: { expr } as Animation } };
        const f = layoutFrame({ ...base, widgets: [w] }, derivedOf(ast), ast, 1.7);
        for (const e of f) for (const p of e.prims) if (p.kind === 'rect') for (const v of [p.x, p.y, p.w, p.h, p.alpha]) assert.ok(Number.isFinite(v), `${type}.${path}=${expr}`);
        n++;
      }
    }
  }
  assert.ok(n > 500, `chỉ ${n}`);
  assert.ok(EXPR_VARS.has('note.velocity') && !EXPR_VARS.has('window'));
});
