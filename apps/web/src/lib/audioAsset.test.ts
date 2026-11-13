// T-08: nạp tệp âm thanh: thứ tự kiểm, mã lỗi, nhánh metadata không đọc được (MP3 VBR).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioLoadError, loadAudioAsset, type LoadDeps, type PcmBuffer } from './audioAsset.ts';
import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS, MAX_UNKNOWN_DURATION_BYTES, hasAudioExtension } from './audioLimits.ts';

const pcm = (sec: number): PcmBuffer => ({ duration: sec, sampleRate: 48000, numberOfChannels: 2, length: Math.round(sec * 48000), getChannelData: () => new Float32Array(0) });
const file = (name: string, size: number) => ({ name, size, arrayBuffer: async () => new ArrayBuffer(Math.min(size, 16)) }) as unknown as File;
const deps = (o: Partial<LoadDeps> & { calls?: string[] } = {}): LoadDeps => ({
  probeDuration: async () => { o.calls?.push('probe'); return 60; },
  decode: async () => { o.calls?.push('decode'); return pcm(60); },
  sha256: async () => 'abc',
  ...o,
});
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { assert.ok(e instanceof AudioLoadError); return (e as AudioLoadError).code; } };

test('tệp hợp lệ: trả tài sản với SHA-256, tên, thời lượng; giữ tham chiếu File', async () => {
  const f = file('mix.wav', 1000), a = await loadAudioAsset(f, deps());
  assert.equal(a.id, 'abc'); assert.equal(a.name, 'mix.wav'); assert.equal(a.durationSec, 60); assert.equal(a.file, f);
});
test('tệp quá lớn → ERR_FILE_TOO_LARGE trước khi đọc nội dung', async () => {
  const calls: string[] = [];
  assert.equal(await code(loadAudioAsset(file('x.wav', MAX_AUDIO_BYTES + 1), deps({ calls }))), 'ERR_FILE_TOO_LARGE');
  assert.deepEqual(calls, [], 'không dò, không giải mã');
});
test('tệp rỗng / sai đuôi → ERR_AUDIO_DECODE', async () => {
  assert.equal(await code(loadAudioAsset(file('x.wav', 0), deps())), 'ERR_AUDIO_DECODE');
  assert.equal(await code(loadAudioAsset(file('x.txt', 10), deps())), 'ERR_AUDIO_DECODE');
  assert.equal(hasAudioExtension('A.MP3'), true); assert.equal(hasAudioExtension('a.mid'), false);
});
test('metadata báo quá dài → ERR_AUDIO_TOO_LONG, KHÔNG giải mã', async () => {
  const calls: string[] = [];
  assert.equal(await code(loadAudioAsset(file('x.flac', 5000), deps({ calls, probeDuration: async () => MAX_AUDIO_SECONDS + 1 }))), 'ERR_AUDIO_TOO_LONG');
  assert.ok(!calls.includes('decode'));
});
test('giải mã lỗi → ERR_AUDIO_DECODE; buffer rỗng → ERR_AUDIO_DECODE', async () => {
  assert.equal(await code(loadAudioAsset(file('x.mp3', 5000), deps({ decode: async () => { throw new Error('EncodingError'); } }))), 'ERR_AUDIO_DECODE');
  assert.equal(await code(loadAudioAsset(file('x.mp3', 5000), deps({ decode: async () => pcm(0) }))), 'ERR_AUDIO_DECODE');
});
test('MP3 VBR không đọc được metadata (Infinity/NaN/null/lỗi): giải mã rồi mới kiểm giới hạn', async () => {
  for (const probe of [async () => Infinity, async () => NaN, async () => null, async () => { throw new Error('x'); }]) {
    const calls: string[] = [];
    const a = await loadAudioAsset(file('vbr.mp3', 10_000_000), deps({ calls, probeDuration: probe as LoadDeps['probeDuration'], decode: async () => { calls.push('decode'); return pcm(300); } }));
    assert.equal(a.durationSec, 300); assert.ok(calls.includes('decode'));
  }
  assert.equal(await code(loadAudioAsset(file('vbr.mp3', 10_000_000), deps({ probeDuration: async () => null, decode: async () => pcm(MAX_AUDIO_SECONDS + 5) }))), 'ERR_AUDIO_TOO_LONG', 'dài thật sự thì bị chặn sau giải mã');
});
test('không biết độ dài mà tệp quá nhiều byte → không giải mã mù, ERR_AUDIO_TOO_LONG', async () => {
  const calls: string[] = [];
  assert.equal(await code(loadAudioAsset(file('big.mp3', MAX_UNKNOWN_DURATION_BYTES + 1), deps({ calls, probeDuration: async () => null }))), 'ERR_AUDIO_TOO_LONG');
  assert.ok(!calls.includes('decode'));
});
