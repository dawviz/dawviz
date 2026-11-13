// T-69: preset và kiểu nốt cũ không đổi kết quả vẽ. Mã băm lấy từ mã TRƯỚC T-69 (commit 29f5d0e) trên cùng tệp mẫu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { parseProject } from '@dawviz/parser';
import { buildIndex, defaultScene, renderFrame, sanitizeStyle, resolveNoteStyle, STYLE_PRESETS, DEFAULT_BRIGHTNESS, DEFAULT_CHORD, sanitizeScene, layoutFrame } from '../src/index.ts';

const fixtures = new URL('../../../test/fixtures/', import.meta.url);
function rec() { // cùng định dạng với lúc lấy mã băm cũ
  const log: string[] = [];
  const f = (v: unknown) => (typeof v === 'number' ? String(Math.round(v * 1e4) / 1e4) : JSON.stringify(v));
  const ctx: any = new Proxy({}, { get: (_, k) => (k === 'then' ? undefined : (...a: unknown[]) => { log.push(`${String(k)}(${a.map(f).join(',')})`); }), set: (_, k, v) => { log.push(`${String(k)}=${f(v)}`); return true; } });
  return { ctx, log };
}
const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const GOLDEN: Record<string, string> = {
  'default@0': 'bc13453459eafe8b', 'default@3.3': '7252c7c0fad34a20', 'default@10': 'd0e8ed5f373ad5f7', 'default@25': '4c799086cf8f1cf2',
  'style:neon@10': '07b89e59d64d97cf', 'style:soft@10': '95c823f911b54fdd', 'style:flat@10': 'adf9b4d478597977', 'style:outline@10': 'fd740f3970c58aff',
};

test('preset cũ và bốn kiểu dựng sẵn vẽ ra đúng chuỗi lệnh như trước T-69 (màu theo trạng thái = null)', async () => {
  const { ast } = await parseProject('BigProject4b.rpp', fs.readFileSync(new URL('BigProject4b.rpp', fixtures)), {});
  const derived = { index: buildIndex(ast.tracks, ast.meta.totalDurationSeconds), brightness: Object.fromEntries(ast.tracks.map((t: any) => [t.id, { ...DEFAULT_BRIGHTNESS }])) };
  for (const t of [0, 3.3, 10, 25]) { const { ctx, log } = rec(); renderFrame(defaultScene(), derived, ast, t, { ctx, width: 1920, height: 1080 }, 1); assert.equal(hash(log.join('\n')), GOLDEN[`default@${t}`], `default@${t}`); }
  for (const [name, patch] of Object.entries(STYLE_PRESETS)) {
    const s = defaultScene(); const w: any = s.widgets[0];
    w.properties.noteStyle = { base: { ...w.properties.noteStyle.base, ...(patch as object) }, tracks: {} };
    const { ctx, log } = rec(); renderFrame(s, derived, ast, 10, { ctx, width: 1920, height: 1080 }, 1); assert.equal(hash(log.join('\n')), GOLDEN[`style:${name}@10`], name);
  }
});

test('kiểu nốt cũ thiếu ba trường màu trạng thái: được điền null, không đổi gì khác', () => {
  const old: any = { ...resolveNoteStyle(undefined, 'x') }; delete old.playedColor; delete old.activeColor; delete old.upcomingColor;
  const s = sanitizeStyle(old);
  assert.deepEqual([s.playedColor, s.activeColor, s.upcomingColor], [null, null, null]);
  assert.equal(sanitizeStyle({ ...old, playedColor: 'red', activeColor: '#12345', upcomingColor: 5 as any }).playedColor, null); // sai định dạng → null
});

test('Chord: preset cũ thiếu "alwaysShowNotes" vẽ như trước (tắt); dòng nốt chỉ hiện khi bật', () => {
  const raw = { schemaVersion: '0.4.0', canvas: {}, widgets: [{ type: 'CHORD_DETECTION', id: 'c', layout: { x: 0, y: 0, width: 400, height: 100 } }] };
  const { scene, warnings } = sanitizeScene(raw);
  assert.deepEqual(warnings, []); assert.equal((scene.widgets[0].properties as any).alwaysShowNotes, false);
  assert.deepEqual(scene.widgets[0].properties, DEFAULT_CHORD);
});
