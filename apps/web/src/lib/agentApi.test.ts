// API cho AI agent (T-113): chỉ bật với ?agent=1; tệp từ base64/text; kiểm preset không áp; các hàm gọi đúng host.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE_SCHEMA_VERSION, defaultScene } from '@dawviz/render-core';
import { agentEnabled, createAgentApi, toFile, validateScene, type AgentHost } from './agentApi.ts';

test('agentEnabled: chỉ khi URL có agent=1', () => {
  assert.equal(agentEnabled('?agent=1'), true);
  assert.equal(agentEnabled('?x=2&agent=1'), true);
  assert.equal(agentEnabled(''), false); assert.equal(agentEnabled('?agent=0'), false); assert.equal(agentEnabled('?agent'), false);
});

test('toFile: base64 và text thành File; File giữ nguyên', async () => {
  const a = toFile({ name: 'a.mid', base64: Buffer.from([1, 2, 3]).toString('base64') });
  assert.equal(a.name, 'a.mid'); assert.deepEqual([...new Uint8Array(await a.arrayBuffer())], [1, 2, 3]);
  const b = toFile({ name: 'p.json', text: '{"x":1}' });
  assert.equal(await b.text(), '{"x":1}'); assert.equal(b.type, 'application/json');
  const f = new File(['z'], 'z.txt'); assert.equal(toFile(f), f);
});

test('validateScene: hợp lệ kèm cảnh báo có đường dẫn; JSON hỏng hoặc phiên bản mới hơn là lỗi có mã', () => {
  const ok = validateScene({ ...defaultScene(), widgets: [{ id: 'a', type: 'TEXT', layout: { x: 0, y: 0, width: 10, height: 10 }, properties: { text: '{nope}' } }] });
  assert.equal(ok.ok, true);
  assert.ok(ok.ok && ok.warnings.some((w) => w.code.startsWith('WARN_') && w.path?.startsWith('$.widgets[0]')));
  const bad = validateScene('{ not json');
  assert.equal(bad.ok, false); assert.ok(!bad.ok && bad.error.code === 'ERR_PRESET_JSON');
  const newer = validateScene({ schemaVersion: '9.0.0', canvas: {}, widgets: [] });
  assert.ok(!newer.ok && newer.error.code === 'ERR_SCHEMA_NEWER');
  assert.equal(validateScene(JSON.stringify(defaultScene())).ok, true);
  assert.equal(SCENE_SCHEMA_VERSION, '0.9.0');
});

test('createAgentApi: setScene chỉ áp khi hợp lệ; loadProject chờ phân tích xong; lastExport trả base64', async () => {
  const calls: string[] = [];
  let busy = true;
  const host = {
    status: () => ({ busy, t: 0 }) as never,
    loadProject: async (fs: File[]) => { calls.push(`load:${fs.map((f) => f.name).join(',')}`); setTimeout(() => { busy = false; }, 30); },
    openScene: () => calls.push('open'),
    exportVideo: async () => ({ blob: new Blob(['abc'], { type: 'video/mp4' }), name: 'v.mp4', bytes: 3, ms: 1 }),
  } as unknown as AgentHost;
  const api = createAgentApi(() => host);
  await api.loadProject({ name: 's.mid', base64: '' }, { name: 'x.json', text: '{}' });
  assert.deepEqual(calls, ['load:s.mid,x.json']); assert.equal(busy, false);
  assert.equal((await api.setScene('{bad')).ok, false); assert.equal(calls.includes('open'), false);
  assert.equal((await api.setScene(defaultScene())).ok, true); assert.ok(calls.includes('open'));
  const r = await api.exportVideo({ download: false });
  assert.deepEqual(r, { name: 'v.mp4', bytes: 3, ms: 1, mime: 'video/mp4' });
  assert.equal(Buffer.from((await api.lastExport())!.base64, 'base64').toString(), 'abc');
});
