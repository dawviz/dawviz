// T-09: vòng xuất với sink giả (không cần trình duyệt).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExportCancelled, runExport, type AudioSink, type VideoSink } from './exportEngine.ts';

const mk = () => {
  const log: string[] = [];
  const times: number[] = [];
  const video: VideoSink = { add: async (ts, dur, o) => { log.push(`v${times.length - 1}${o.keyFrame ? 'K' : ''}@${ts.toFixed(4)}+${dur.toFixed(4)}`); } };
  const audio: AudioSink = { add: async (p, sr, ts) => { log.push(`a@${ts}:${p[0].length}/${p.length}ch`); } };
  return { log, times, video, audio, draw: (t: number) => { times.push(t); } };
};

test('runExport: khung k vẽ ở start + k/fps, timestamp µs, keyframe mỗi 2 s', async () => {
  const m = mk();
  const n = await runExport({ fps: 2, start: 10, duration: 5, draw: m.draw, video: m.video });
  assert.equal(n, 10);
  assert.deepEqual(m.times, [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5]);
  assert.deepEqual(m.log.filter((l) => l.includes('K')).map((l) => l.split('@')[0]), ['v0K', 'v4K', 'v8K']);
});

test('runExport: khối âm thanh 1 s đi trước khung đầu của giây đó, mẫu đầu timestamp 0', async () => {
  const m = mk();
  const sr = 100;
  const ch = [Float32Array.from({ length: 350 }, (_, i) => i + 1)];
  await runExport({ fps: 2, start: 0, duration: 3, draw: m.draw, video: m.video, audio: { sink: m.audio, input: { channels: ch, sampleRate: sr, offsetMs: 0 } } });
  const audio = m.log.filter((l) => l.startsWith('a'));
  assert.deepEqual(audio, ['a@0:100/1ch', 'a@1:100/1ch', 'a@2:100/1ch']);
  assert.ok(m.log[0].startsWith('a@0'), 'âm thanh đầu tiên trước video đầu tiên');
  assert.ok(m.log.indexOf('a@1:100/1ch') < m.log.findIndex((l) => l.startsWith('v2')), 'khối giây 1 trước khung 2');
});

test('runExport: âm thanh dài hơn video thì đẩy nốt khối còn lại; không có khung thì không lỗi', async () => {
  const m = mk();
  const ch = [new Float32Array(500)];
  await runExport({ fps: 1, start: 0, duration: 1, draw: m.draw, video: m.video, audio: { sink: m.audio, input: { channels: ch, sampleRate: 100, offsetMs: 0 } } });
  assert.equal(m.log.filter((l) => l.startsWith('a')).length, 1);
  assert.equal(await runExport({ fps: 30, start: 0, duration: 0, draw: m.draw, video: m.video }), 0);
});

test('runExport: huỷ giữa chừng dừng ngay và ném ExportCancelled', async () => {
  const m = mk();
  const signal = { aborted: false };
  const video: VideoSink = { add: async () => { if (m.times.length === 3) signal.aborted = true; } };
  await assert.rejects(runExport({ fps: 30, start: 0, duration: 10, draw: m.draw, video, signal }), ExportCancelled);
  assert.equal(m.times.length, 3);
});

test('runExport: báo tiến độ có tần suất tối thiểu và luôn báo 100% ở cuối', async () => {
  const m = mk();
  let clock = 0;
  const seen: number[] = [];
  await runExport({ fps: 10, start: 0, duration: 3, draw: m.draw, video: m.video, now: () => (clock += 40), progressEveryMs: 100, onProgress: (p) => seen.push(p.fraction) });
  assert.ok(seen.length < 30 && seen.length > 3);
  assert.equal(seen[seen.length - 1], 1);
});

test('runExport: lỗi của sink được truyền ra, không nuốt', async () => {
  const m = mk();
  const video: VideoSink = { add: async () => { throw new Error('encoder'); } };
  await assert.rejects(runExport({ fps: 30, start: 0, duration: 1, draw: m.draw, video }), /encoder/);
});
