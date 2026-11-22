import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packOf, sessionFromPack, snapshotOf, bytesOf, type SessionParts } from './session.ts';

const parts = (): SessionParts => ({
  title: 'Bài', source: new File([new TextEncoder().encode('<REAPER_PROJECT>')], 'a.rpp'), extras: [new File([new Uint8Array([1, 2])], 'Oboe 1.mid')],
  schemas: [{ name: 'demo', schema: { schemaVersion: 1, name: 'demo' } }], tempo: { override: 128, draft: { unit: 'time', rows: [{ pos: '', bpm: '128', sig: '' }] } },
  scene: { schemaVersion: '0.6.0' }, workspace: { order: ['t1'], tempoDraft: { unit: 'time', rows: [{ pos: '', bpm: '128', sig: '' }] } }, audio: new File([new Uint8Array([7, 7, 7])], 'mix.wav'), audioOffsetMs: 30, background: null,
});

test('session: Pack ⇄ phiên giữ nguồn, .mid phụ, schema, tempo, âm thanh và offset', async () => {
  const { data, warnings } = await sessionFromPack(await packOf(parts(), new Date('2026-11-18T00:00:00Z')));
  assert.deepEqual(warnings, []);
  assert.equal(data.source.name, 'a.rpp');
  assert.equal(new TextDecoder().decode(await bytesOf(data.source)), '<REAPER_PROJECT>');
  assert.deepEqual(data.extras.map((f) => f.name), ['Oboe 1.mid']);
  assert.equal(data.schemas.length, 1); assert.equal(data.schemas[0].name, 'demo');
  assert.equal(data.tempo?.override, 128); assert.equal(data.tempo?.draft.rows[0].bpm, '128');
  assert.equal(data.audio?.file.name, 'mix.wav'); assert.equal(data.audio?.offsetMs, 30);
  assert.deepEqual(data.scene, { schemaVersion: '0.6.0' });
});

test('session: snapshot liệt kê Blob (nguồn, âm thanh, .mid phụ) và mang schema trong workspace', async () => {
  const s = await snapshotOf(parts());
  assert.deepEqual(s.blobs.map((b) => b.id), ['source', 'audio', 'extra:0']);
  assert.equal(s.tempoOverride, 128);
  assert.equal((s.workspace as { schemas: unknown[] }).schemas.length, 1);
});

test('session: ảnh nền đi theo Blob của phiên và Pack (tên chuẩn hoá background.<đuôi>), không có thì không có gì', async () => {
  const bg = new File([new Uint8Array([9, 8, 7, 6])], 'Ảnh Của Tôi.JPEG');
  const s = await snapshotOf({ ...parts(), background: bg });
  assert.deepEqual(s.blobs.map((b) => b.id), ['source', 'audio', 'background', 'extra:0']);
  const { data } = await sessionFromPack(await packOf({ ...parts(), background: bg }, new Date('2026-11-20T00:00:00Z')));
  assert.equal(data.background?.name, 'background.jpg'); assert.deepEqual([...(await bytesOf(data.background!))], [9, 8, 7, 6]);
  assert.equal((await sessionFromPack(await packOf(parts(), new Date()))).data.background, undefined);
});

test('session: tài nguyên của phiên (T-21) đi vào blob tự lưu và Project Pack, đọc lại đủ byte và tên', async () => {
  const { acceptAsset } = await import('./sessionAssets.ts');
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 4, 5]), font = new TextEncoder().encode('wOF2abc');
  const a = (await acceptAsset([], 'logo.png', png)).meta, f = (await acceptAsset([a], 'Brand.woff2', font)).meta;
  const p = { ...parts(), assets: [{ meta: a, file: new File([png], 'logo.png') }, { meta: f, file: new File([font], 'Brand.woff2') }] };
  const snap = await snapshotOf(p);
  assert.deepEqual(snap.blobs.filter((b) => b.id.startsWith('asset:')).map((b) => [b.id, b.name]), [[`asset:${a.id.slice(7)}`, 'logo.png'], [`asset:${f.id.slice(7)}`, 'Brand.woff2']]);
  const { data, warnings } = await sessionFromPack(await packOf(p, new Date('2026-11-22T00:00:00Z')));
  assert.deepEqual(warnings, []);
  assert.deepEqual(data.assets!.map((x) => x.name).sort(), ['Brand.woff2', 'logo.png']);
  assert.deepEqual([...await bytesOf(data.assets!.find((x) => x.name === 'logo.png')!)], [...png]);
});
