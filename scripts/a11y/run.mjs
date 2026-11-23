// Kiểm trợ năng tự động (M5, G8): axe-core (WCAG 2.0/2.1/2.2 mức A–AA, gồm vùng bấm 24 px `target-size`) trên ứng dụng thật (Vite dev + Chromium),
// ở thẻ Xem trước, Chỉnh sửa (widget đang chọn, Timeline mở), Cài đặt và hộp thoại Xuất video; theme tối và sáng. Kèm một vòng phím Tab:
// mỗi điểm dừng phải có vòng focus nhìn thấy. Không phải mã ứng dụng, không vào bản build.
// node scripts/a11y/run.mjs [tệp dự án] [--json]   (thoát mã 1 nếu có vi phạm mức serious/critical, hoặc điểm dừng Tab không thấy focus)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const axeSource = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const root = path.resolve(import.meta.dirname, '../..');
const file = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? path.join(root, 'test/fixtures/Reaper/BigProject4.rpp');
const asJson = process.argv.includes('--json');
const PORT = 5299;
const vite = spawn(path.join(root, 'node_modules/.bin/vite'), ['--port', String(PORT), '--strictPort'], { cwd: path.join(root, 'apps/web'), stdio: ['ignore', 'pipe', 'pipe'] });
process.on('exit', () => vite.kill());
await new Promise((ok) => { vite.stdout.on('data', (d) => { if (String(d).includes('Local')) ok(); }); setTimeout(ok, 20000); });

const b = await chromium.launch();
const results = [];
const audit = async (pg, state) => {
  await pg.addScriptTag({ content: axeSource });
  const r = await pg.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' '), summary: n.failureSummary?.split('\n').slice(0, 2).join(' ') })), count: v.nodes.length }));
  });
  results.push({ state, violations: r });
};
// Vòng Tab: tối đa 60 điểm dừng; mỗi điểm phải đổi outline hoặc box-shadow so với lúc không focus (vòng focus nhìn thấy).
const tabWalk = async (pg, state) => {
  const bad = [];
  await pg.mouse.click(2, 2);
  for (let i = 0; i < 60; i++) {
    await pg.keyboard.press('Tab');
    const info = await pg.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none') || el.matches(':focus-visible') && (cs.borderColor !== '' );
      const r = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), testid: el.getAttribute('data-testid'), visible: !!visible, w: Math.round(r.width), h: Math.round(r.height) };
    });
    if (!info) continue;
    if (!info.visible) bad.push(info);
  }
  results.push({ state: `${state} · Tab`, tabProblems: bad });
};

for (const theme of ['dark', 'light']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN' });
  await ctx.addInitScript((th) => { localStorage.setItem('dawviz.prefs.v1.theme', JSON.stringify({ mode: th, palette: 'studio' })); localStorage.setItem('dawviz.lang', 'vi'); }, theme);
  const pg = await ctx.newPage();
  await pg.goto(`http://localhost:${PORT}/`, { timeout: 120000 });
  await pg.locator('[data-testid="file-input"]').first().setInputFiles(file);
  await pg.waitForTimeout(2500);
  await audit(pg, `${theme} · Xem trước`);
  if (theme === 'dark') await tabWalk(pg, `${theme} · Xem trước`);
  await pg.locator('#tab-editor').click(); await pg.waitForTimeout(500);
  await pg.locator('li[data-layer] button[aria-pressed]').first().click(); await pg.waitForTimeout(300);
  if (!(await pg.locator('[data-testid="timeline-panel"][data-open]').count())) await pg.locator('[data-testid="timeline-toggle"]').click();
  await pg.waitForTimeout(300);
  await audit(pg, `${theme} · Chỉnh sửa`);
  await pg.locator('#tab-settings').click(); await pg.waitForTimeout(500);
  await audit(pg, `${theme} · Cài đặt`);
  await pg.locator('#tab-preview').click(); await pg.waitForTimeout(300);
  await pg.locator('button', { hasText: /Xuất video/ }).first().click(); await pg.locator('[data-testid="export-dialog"]').waitFor();
  await pg.waitForTimeout(600);
  await audit(pg, `${theme} · Hộp thoại Xuất`);
  await ctx.close();
}
await b.close(); vite.kill();

let serious = 0, tabBad = 0;
if (asJson) console.log(JSON.stringify(results, null, 2));
else for (const r of results) {
  if (r.tabProblems) { tabBad += r.tabProblems.length; console.log(`\n# ${r.state}: ${r.tabProblems.length ? `${r.tabProblems.length} điểm dừng không thấy focus` : 'mọi điểm dừng có focus'}`); for (const t of r.tabProblems) console.log(`  - <${t.tag}> ${t.testid ?? ''} "${t.label}" ${t.w}×${t.h}`); continue; }
  console.log(`\n# ${r.state}: ${r.violations.length} quy tắc vi phạm`);
  for (const v of r.violations) {
    if (v.impact === 'serious' || v.impact === 'critical') serious++;
    console.log(`  [${v.impact}] ${v.id} (${v.count}): ${v.help}`);
    for (const n of v.nodes) console.log(`      ${n.target} — ${n.summary ?? ''}`);
  }
}
process.exit(serious || tabBad ? 1 : 0);
