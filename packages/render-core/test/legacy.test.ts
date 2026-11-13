// T-69: preset và kiểu nốt cũ không đổi kết quả vẽ. Mã băm gốc lấy từ mã TRƯỚC T-69 (commit 29f5d0e) trên cùng tệp mẫu; lấy lại ở T-71 (xem dưới).
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
// T-71 đổi chủ ý ba điều nên mã băm lấy lại: (1) bàn phím bật (mặc định) → vạch phát ở mép bàn phím; (2) nốt đang phát vẽ sau cùng;
// (3) tỉ lệ thời gian = bề rộng widget / visibleSeconds, không trừ bề rộng bàn phím.
// Đã kiểm khi tắt bàn phím: mã trước và sau T-71 vẽ cùng tập lệnh, chỉ khác thứ tự. In mã băm mới: PRINT_HASH=1.
const GOLDEN: Record<string, string> = {
  'default@0': '029e1707a2958a2b', 'default@3.3': '8dd6ab8cc67542ee', 'default@10': 'cd3c97b628b38349', 'default@25': 'a382c07956646c48',
  'style:neon@10': 'd5d6f082c08f26e9', 'style:soft@10': '7a74e9471d825802', 'style:flat@10': 'ccb573f6e204ceeb', 'style:outline@10': '083b13140edaf24c',
};

test('preset cũ và bốn kiểu dựng sẵn vẽ ra đúng chuỗi lệnh như trước T-69 (màu theo trạng thái = null)', async () => {
  const { ast } = await parseProject('BigProject4b.rpp', fs.readFileSync(new URL('BigProject4b.rpp', fixtures)), {});
  const derived = { index: buildIndex(ast.tracks, ast.meta.totalDurationSeconds), brightness: Object.fromEntries(ast.tracks.map((t: any) => [t.id, { ...DEFAULT_BRIGHTNESS }])) };
  for (const t of [0, 3.3, 10, 25]) { const { ctx, log } = rec(); renderFrame(defaultScene(), derived, ast, t, { ctx, width: 1920, height: 1080 }, 1); { const h = hash(log.join('\n')); if (process.env.PRINT_HASH) console.log(`default@${t}`, h); else assert.equal(h, GOLDEN[`default@${t}`], `default@${t}`); } }
  for (const [name, patch] of Object.entries(STYLE_PRESETS)) {
    const s = defaultScene(); const w: any = s.widgets[0];
    w.properties.noteStyle = { base: { ...w.properties.noteStyle.base, ...(patch as object) }, tracks: {} };
    const { ctx, log } = rec(); renderFrame(s, derived, ast, 10, { ctx, width: 1920, height: 1080 }, 1); const h = hash(log.join('\n')); if (process.env.PRINT_HASH) console.log(`style:${name}@10`, h); else assert.equal(h, GOLDEN[`style:${name}@10`], name);
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
