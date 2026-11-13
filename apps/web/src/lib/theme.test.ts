import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { applyTheme, checkTheme, contrast, mix, PALETTES, resolveMode, sanitizeThemePref, STATE_RULES, THEME_STORAGE_KEY, THEME_TOKENS } from './theme.ts';

// Đọc giá trị thật của theme dựng sẵn từ index.css (nguồn duy nhất) và giải theo đúng thứ tự cascade của các khối :root.
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const blocks = [...css.matchAll(/(:root[^{]*)\{([^}]*)\}/g)].map(([, sel, body]) => ({
  sel: sel.trim(),
  vars: Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()])),
}));

function themeFor(mode: 'light' | 'dark', palette: string): Record<string, string> {
  const matches = (sel: string) => {
    const attrs = [...sel.matchAll(/\[data-(\w+)='(\w+)'\]/g)];
    return attrs.every(([, k, v]) => (k === 'theme' ? v === mode : k === 'palette' ? v === palette : false));
  };
  const spec = (sel: string) => sel.split('[').length; // :root + số thuộc tính
  const hits = blocks.map((b, i) => ({ ...b, i })).filter((b) => matches(b.sel)).sort((a, b) => spec(a.sel) - spec(b.sel) || a.i - b.i);
  const raw: Record<string, string> = {};
  for (const b of hits) Object.assign(raw, b.vars);
  const resolve = (v: string, depth = 0): string => {
    const m = /^var\(--([\w-]+)\)$/.exec(v);
    if (!m) return v;
    assert.ok(depth < 5 && raw[m[1]] !== undefined, `không giải được var(--${m[1]})`);
    return resolve(raw[m[1]], depth + 1);
  };
  return Object.fromEntries(THEME_TOKENS.map((k) => [k, resolve(raw[k] ?? 'missing')]));
}

for (const mode of ['light', 'dark'] as const) for (const palette of PALETTES) {
  test(`theme dựng sẵn ${palette}/${mode}: đủ token và đạt AA (UI-DIRECTION 5.4, D-55)`, () => {
    const colors = themeFor(mode, palette);
    const fails = checkTheme(colors).map((f) => `${f.fg} trên ${f.bg}: ${f.ratio.toFixed(2)} < ${f.need}`);
    assert.deepEqual(fails, []);
  });
}

test('theme: mỗi bảng màu có màu nhấn riêng cho sáng và tối, nền dùng chung', () => {
  const accents = new Set(PALETTES.flatMap((p) => [themeFor('light', p).accent, themeFor('dark', p).accent]));
  assert.equal(accents.size, PALETTES.length * 2);
  assert.equal(themeFor('light', 'riso').bg, themeFor('light', 'studio').bg);
  assert.notEqual(themeFor('light', 'studio').bg, themeFor('dark', 'studio').bg);
});

test('checkTheme: từ chối token thiếu/lạ, báo cặp trượt', () => {
  const ok = themeFor('dark', 'studio');
  assert.throws(() => checkTheme({ ...ok, 'font-size': '12px' }), /thừa \[font-size\]/);
  const { accent: _, ...missing } = ok;
  assert.throws(() => checkTheme(missing), /thiếu \[accent\]/);
  const bad = checkTheme({ ...ok, 'text-faint': '#3A3B3C' });
  assert.ok(bad.some((f) => f.fg === 'text-faint' && f.bg === 'surface-raised'));
});

test('trạng thái tô nhạt: mọi `<màu>/<độ đục>` trong mã nguồn đều có luật kiểm AA trong STATE_RULES', () => {
  const dir = new URL('../', import.meta.url);
  const files = (readdirSync(dir, { recursive: true }) as string[]).filter((f) => /\.(tsx|css)$/.test(f));
  const tints = new Set(['accent', 'danger', 'warning', 'success']);
  const used = new Set<string>();
  for (const f of files) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const [, tint, alpha] of src.matchAll(/\bbg-(accent|danger|warning|success)\/(\d+)\b/g)) if (tints.has(tint)) used.add(`${tint}/${alpha}`);
  }
  const covered = new Set(STATE_RULES.map((r) => `${r.tint}/${Math.round(r.alpha * 100)}`));
  assert.ok(used.size > 0, 'không tìm thấy trạng thái tô nhạt nào: biểu thức quét đã hỏng?');
  assert.deepEqual([...used].filter((u) => !covered.has(u)), []);
});

test('accent/90 (làm nhạt nút nhấn) bị cấm vì trượt AA ở Đồng sáng; vòng hover line-strong thì đạt', () => {
  const brass = themeFor('light', 'brass');
  assert.ok(contrast(brass['accent-text'], mix(brass.accent, brass['surface-raised'], 0.9)) < 4.5);
  assert.ok(!STATE_RULES.some((r) => r.tint === 'accent' && r.alpha === 0.9));
  for (const mode of ['light', 'dark'] as const) for (const p of PALETTES) {
    const c = themeFor(mode, p);
    for (const g of ['bg', 'surface'] as const) assert.ok(contrast(c['line-strong'], c[g]) >= 3, `${p}/${mode}`);
  }
});

test('checkTheme: trạng thái tô nhạt trượt thì bị báo', () => {
  const ok = themeFor('dark', 'studio');
  const bad = checkTheme({ ...ok, 'text-muted': '#8A8A88' });
  assert.ok(bad.some((f) => f.fg === 'text-muted' && f.bg.startsWith('danger/10')));
});

test('contrast: đúng công thức WCAG (đen/trắng 21:1), nhận hex và "r g b"', () => {
  assert.equal(Math.round(contrast('#000000', '#FFFFFF')), 21);
  assert.equal(contrast('255 255 255', '#FFFFFF'), 1);
});

test('lựa chọn theme: làm sạch, giải "theo hệ thống", áp lên phần tử gốc', () => {
  assert.deepEqual(sanitizeThemePref({ mode: 'neon', palette: 'gold' }), { mode: 'dark', palette: 'studio' });
  assert.deepEqual(sanitizeThemePref({ mode: 'system', palette: 'riso' }), { mode: 'system', palette: 'riso' });
  assert.equal(resolveMode('system', true), 'dark');
  assert.equal(resolveMode('system', false), 'light');
  assert.equal(resolveMode('light', true), 'light');
  const el = { dataset: {} as Record<string, string> } as unknown as HTMLElement;
  applyTheme(el, { mode: 'system', palette: 'brass' }, false);
  assert.deepEqual({ ...el.dataset }, { theme: 'light', palette: 'brass' });
});

test('theme-boot.js đọc đúng khoá và cùng tập giá trị với theme.ts', () => {
  const boot = readFileSync(new URL('../../public/theme-boot.js', import.meta.url), 'utf8');
  assert.ok(boot.includes(`'${THEME_STORAGE_KEY}'`));
  for (const p of PALETTES) assert.ok(boot.includes(`'${p}'`), p);
  assert.ok(boot.includes("mode = 'dark', palette = 'studio'"));
});
