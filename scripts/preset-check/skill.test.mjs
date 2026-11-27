// Skill dawviz cho AI agent (T-113): SKILL.md đúng chuẩn, preset mẫu qua bộ kiểm cộng đồng, tài liệu API liệt kê đủ hàm của window.dawviz.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkPreset } from './check.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const skill = path.join(root, 'plugins/dawviz/skills/dawviz');
const read = (p) => fs.readFileSync(path.join(skill, p), 'utf8');

test('SKILL.md: frontmatter name/description, liên kết tới tệp có thật', () => {
  const md = read('SKILL.md');
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(md);
  assert.ok(fm, 'thiếu frontmatter');
  assert.match(fm[1], /^name: dawviz$/m);
  const desc = /^description: (.+)$/m.exec(fm[1])?.[1] ?? '';
  assert.ok(desc.length > 40 && desc.length <= 1024, 'description 40–1024 ký tự');
  for (const [, href] of md.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) if (!/^https?:/.test(href)) assert.ok(fs.existsSync(path.join(skill, href)), `liên kết hỏng: ${href}`);
  for (const f of ['references/preset.md', 'references/gui.md', 'references/api.md', 'scripts/dawviz.mjs', 'scripts/package.json']) assert.ok(fs.existsSync(path.join(skill, f)), f);
  const pj = JSON.parse(fs.readFileSync(path.join(root, 'plugins/dawviz/.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(pj.name, 'dawviz');
  const mk = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.ok(mk.plugins.some((p) => p.name === 'dawviz' && fs.existsSync(path.join(root, p.source, '.claude-plugin/plugin.json'))));
});

test('preset mẫu của skill: qua bộ kiểm cộng đồng, không cảnh báo, lược đồ hiện tại', () => {
  const dir = path.join(skill, 'examples'), files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 2);
  for (const f of files) {
    const r = checkPreset(f, fs.readFileSync(path.join(dir, f)), { community: true });
    assert.deepEqual(r.errors, [], f); assert.deepEqual(r.warnings, [], f);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).schemaVersion, '0.9.0', f);
  }
});

test('references/api.md liệt kê đủ mọi hàm của window.dawviz (lib/agentApi.ts)', () => {
  const src = fs.readFileSync(path.join(root, 'apps/web/src/lib/agentApi.ts'), 'utf8');
  const body = src.slice(src.indexOf('return Object.freeze({'));
  const methods = [...body.matchAll(/^\s{4}(?:\/\*\*[^\n]*\*\/\s*)?([a-zA-Z]+): async/gm)].map((m) => m[1]);
  for (const m of [...body.matchAll(/, ([a-zA-Z]+): async/g)]) methods.push(m[1]);
  assert.ok(methods.length >= 15, `tìm thấy ${methods.length} hàm`);
  const doc = read('references/api.md');
  for (const m of new Set(methods)) assert.ok(doc.includes(`\`${m}(`), `api.md thiếu ${m}()`);
  // và các testid ở gui.md có thật trong mã giao diện
  const ui = fs.readdirSync(path.join(root, 'apps/web/src/components')).map((f) => fs.readFileSync(path.join(root, 'apps/web/src/components', f), 'utf8')).join('\n') + fs.readFileSync(path.join(root, 'apps/web/src/App.tsx'), 'utf8');
  for (const [, id] of read('references/gui.md').matchAll(/`([a-z][a-z-]+)`/g)) {
    if (!/-/.test(id) || /^(fade-in|fade-out|phase|data-clip-of|data-testid)$/.test(id)) continue;
    assert.ok(ui.includes(`"${id}"`) || ui.includes(`'${id}'`) || ui.includes(`\`${id}`), `gui.md: testid "${id}" không có trong giao diện`);
  }
});
