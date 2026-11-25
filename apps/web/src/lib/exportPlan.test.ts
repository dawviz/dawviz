// T-09 (phần lõi thuần): kích thước, khung hình, codec, dòng chảy, tiến độ, khối âm thanh.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  audibleSeconds, audioBlocks, sliceAudioForRange, chooseCodec, createBackpressure, createProgress, estimateBytes, exportDuration, frameCount,
  detectSupport, frameDurationUs, frameTimestampUs, h264Candidates, manualChoice, normalizeSelection, optionsFor, usableContainers, isKeyFrame, parseAspect, preflight, renderAudioBlock, sizeForClass,
  sizeFromCustom, videoBitrate, normalizeRange, exportBaseName, fitRect, heightForWidth, widthForHeight, type CodecProbe,
} from './exportPlan.ts';
import { exportSegments } from './audioMap.ts';

test('sizeForClass: bảng REQ-EXPORT-00', () => {
  const dims = (a: number, b: number, c: 720 | 1080 | 2160) => {
    const s = sizeForClass(a, b, c);
    return [s.width, s.height];
  };
  assert.deepEqual(dims(16, 9, 720), [1280, 720]);
  assert.deepEqual(dims(16, 9, 1080), [1920, 1080]);
  assert.deepEqual(dims(16, 9, 2160), [3840, 2160]);
  assert.deepEqual(dims(9, 16, 1080), [1080, 1920]);
  assert.deepEqual(dims(9, 16, 2160), [2160, 3840]);
  assert.deepEqual(dims(1, 1, 720), [720, 720]);
  assert.deepEqual(sizeForClass(16, 9, 1080).notes, []);
});

test('sizeForClass: cạnh dài > 4096 thu nhỏ đồng tỉ lệ, số lẻ làm chẵn lên', () => {
  const s = sizeForClass(21, 9, 2160);
  assert.equal(s.width, 4096);
  assert.equal(s.height % 2, 0);
  assert.ok(Math.abs(s.width / s.height - 21 / 9) < 0.01);
  assert.deepEqual(s.notes.sort(), ['ROUNDED_EVEN', 'SCALED_DOWN']);
  const odd = sizeForClass(4, 3, 1080); // 1440 × 1080: không cần làm chẵn
  assert.deepEqual([odd.width, odd.height, odd.notes.length], [1440, 1080, 0]);
  const r = sizeForClass(1.91, 1, 720); // 1375,2 → 1375 lẻ → 1376
  assert.equal(r.width, 1376);
  assert.deepEqual(r.notes, ['ROUNDED_EVEN']);
  assert.throws(() => sizeForClass(0, 9, 720));
});

test('sizeFromCustom: làm chẵn xuống, kẹp 4096, chặn cạnh ngắn < 128', () => {
  assert.deepEqual(sizeFromCustom(1921, 1081), { width: 1920, height: 1080, notes: ['ROUNDED_EVEN'] });
  assert.deepEqual(sizeFromCustom(1920, 1080), { width: 1920, height: 1080, notes: [] });
  const big = sizeFromCustom(8192, 4320)!;
  assert.equal(big.width, 4096);
  assert.ok(big.notes.includes('SCALED_DOWN'));
  assert.equal(sizeFromCustom(1000, 127), null);
  assert.equal(sizeFromCustom(NaN, 100), null);
  assert.equal(sizeFromCustom(-5, 100), null);
});

test('parseAspect: W:H, W/H, số thập phân, dấu phẩy', () => {
  assert.deepEqual(parseAspect('21:9'), [21, 9]);
  assert.deepEqual(parseAspect('2.39:1'), [2.39, 1]);
  assert.deepEqual(parseAspect('2,39 : 1'), [2.39, 1]);
  assert.deepEqual(parseAspect('1.91'), [1.91, 1]);
  assert.equal(parseAspect('0:9'), null);
  assert.equal(parseAspect('abc'), null);
});

test('exportDuration: cả bài = max(dự án, âm thanh) + 2 s; đoạn = độ dài đoạn', () => {
  assert.deepEqual(exportDuration({ projectSec: 30 }), { start: 0, duration: 32 });
  assert.deepEqual(exportDuration({ projectSec: 30, audioSec: 40 }), { start: 0, duration: 42 });
  assert.deepEqual(exportDuration({ projectSec: 30, range: { start: 5, end: 12.5 } }), { start: 5, duration: 7.5 });
  assert.deepEqual(exportDuration({ projectSec: 30, range: { start: 9, end: 3 } }), { start: 9, duration: 0 });
});

test('khung hình: N, timestamp µs, keyframe mỗi 2 s, không thừa khung do sai số nhị phân', () => {
  assert.equal(frameCount(10, 30), 300);
  assert.equal(frameCount(0.1, 30), 3, '0,1 × 30 = 3,0000000000000004 không được ra 4');
  assert.equal(frameCount(10.01, 30), 301);
  assert.equal(frameCount(0, 30), 0);
  assert.equal(frameTimestampUs(1, 30), 33_333);
  assert.equal(frameTimestampUs(3, 30), 100_000);
  assert.equal(frameDurationUs(60), 16_667);
  assert.equal(frameTimestampUs(59, 24), Math.round((59 * 1e6) / 24));
  assert.deepEqual([0, 1, 59, 60, 61, 120].map((k) => isKeyFrame(k, 30)), [true, false, false, true, false, true]);
});

test('bitrate và dung lượng theo lớp, nhân chất lượng', () => {
  assert.equal(videoBitrate(1280, 720, 'medium'), 6_000_000);
  assert.equal(videoBitrate(1920, 1080, 'medium'), 12_000_000);
  assert.equal(videoBitrate(3840, 2160, 'medium'), 35_000_000);
  assert.equal(videoBitrate(1920, 1080, 'low'), 6_000_000);
  assert.equal(videoBitrate(1920, 1080, 'high'), 18_000_000);
  assert.equal(videoBitrate(1080, 1920, 'medium'), 12_000_000, 'tính theo cạnh ngắn');
  assert.equal(estimateBytes({ bitrate: 8_000_000, duration: 10, hasAudio: false }), 10_000_000);
  assert.equal(estimateBytes({ bitrate: 8_000_000, duration: 10, hasAudio: true }), 10_160_000);
});

test('preflight: cảnh báo RAM chỉ khi không có File System Access và > 1 GB', () => {
  const base = { width: 3840, height: 2160, fps: 60 as const, quality: 'high' as const, duration: 600, hasAudio: true };
  const big = preflight({ ...base, hasFileSystemAccess: false });
  assert.deepEqual(big.warnings, ['LARGE_IN_MEMORY']);
  assert.equal(big.frames, 36_000);
  assert.deepEqual(preflight({ ...base, hasFileSystemAccess: true }).warnings, []);
  assert.deepEqual(preflight({ ...base, duration: 5, hasFileSystemAccess: false }).warnings, []);
});

test('h264Candidates: level nhỏ nhất đủ dùng, profile cao → thấp', () => {
  const c1080p60 = h264Candidates(1920, 1080, 60);
  assert.equal(c1080p60[0], 'avc1.64002a', 'High, level 4.2');
  assert.ok(c1080p60.includes('avc1.4d002a') && c1080p60.includes('avc1.42002a'));
  assert.ok(!c1080p60.some((c) => c.endsWith('1f') || c.endsWith('28')), 'level 3.1/4.0 không đủ cho 1080p60');
  assert.equal(h264Candidates(1280, 720, 30)[0], 'avc1.64001f', '720p30: level 3.1');
  assert.equal(h264Candidates(1920, 1080, 30)[0], 'avc1.640028', '1080p30: 4.0');
  assert.equal(h264Candidates(3840, 2160, 30)[0], 'avc1.640033', '4K30: 5.1 (32 400 MB vượt MaxFS 22 080 của 5.0)');
  assert.equal(h264Candidates(3840, 2160, 60)[0], 'avc1.640034', '4K60: 5.2');
  assert.deepEqual(h264Candidates(4096, 4096, 60), [], 'vượt level 5.2');
});

const probeOf = (video: (c: string) => boolean, audio: (c: string) => boolean): CodecProbe => ({
  video: async (c) => video(c.codec),
  audio: async (c) => audio(c.codec),
});
const cfg = { width: 1920, height: 1080, fps: 30, bitrate: 12_000_000, hasAudio: true };

test('chooseCodec: ưu tiên H.264 + AAC trong MP4', async () => {
  const r = await chooseCodec(probeOf((c) => c.startsWith('avc1'), (c) => c === 'mp4a.40.2'), cfg);
  assert.deepEqual(r, { container: 'mp4', video: 'avc', videoCodec: 'avc1.640028', audioCodec: 'aac', notices: [] });
});

test('chooseCodec: hạ profile khi High không được hỗ trợ', async () => {
  const r = await chooseCodec(probeOf((c) => c.startsWith('avc1.42'), () => true), cfg);
  assert.equal(r?.videoCodec, 'avc1.420028');
});

test('chooseCodec: dự án không có âm thanh thì không cần codec âm thanh, không thông báo', async () => {
  const r = await chooseCodec(probeOf((c) => c.startsWith('avc1'), () => false), { ...cfg, hasAudio: false });
  assert.equal(r?.container, 'mp4');
  assert.equal(r?.audioCodec, null);
  assert.deepEqual(r?.notices, []);
});

test('chooseCodec: thiếu AAC thì hạ dần trong MP4 (MP3 → Opus → FLAC) và báo AUDIO_FALLBACK', async () => {
  const opus = await chooseCodec(probeOf((c) => c.startsWith('avc1'), (c) => c === 'opus'), cfg);
  assert.deepEqual(opus, { container: 'mp4', video: 'avc', videoCodec: 'avc1.640028', audioCodec: 'opus', notices: ['AUDIO_FALLBACK'] });
  const mp3 = await chooseCodec(probeOf((c) => c.startsWith('avc1'), (c) => c === 'mp3' || c === 'opus'), cfg);
  assert.equal(mp3?.audioCodec, 'mp3');
  const flac = await chooseCodec(probeOf((c) => c.startsWith('avc1'), (c) => c === 'flac'), cfg);
  assert.equal(flac?.audioCodec, 'flac');
});

test('chooseCodec: không codec âm thanh nào (PCM không tự chọn) → MP4 không tiếng kèm NO_AUDIO_ENCODER', async () => {
  const r = await chooseCodec(probeOf((c) => c.startsWith('avc1'), () => false), cfg);
  assert.deepEqual(r, { container: 'mp4', video: 'avc', videoCodec: 'avc1.640028', audioCodec: null, notices: ['NO_AUDIO_ENCODER'] });
});

test('chooseCodec: không có H.264 → WebM theo thứ tự VP9, AV1, VP8; Opus hoặc không tiếng', async () => {
  const vp9 = await chooseCodec(probeOf((c) => c.startsWith('vp0') || c.startsWith('av01') || c === 'vp8', (c) => c === 'opus'), cfg);
  assert.deepEqual(vp9, { container: 'webm', video: 'vp9', videoCodec: 'vp09.00.10.08', audioCodec: 'opus', notices: ['WEBM_NO_H264'] });
  const av1 = await chooseCodec(probeOf((c) => c.startsWith('av01.0.08'), () => false), cfg);
  assert.equal(av1?.video, 'av1'); assert.equal(av1?.videoCodec, 'av01.0.08M.08');
  const vp8 = await chooseCodec(probeOf((c) => c === 'vp8', () => false), cfg);
  assert.deepEqual(vp8, { container: 'webm', video: 'vp8', videoCodec: 'vp8', audioCodec: null, notices: ['WEBM_NO_H264', 'NO_AUDIO_ENCODER'] });
});

test('HEVC không bao giờ được tự chọn ở chế độ Cơ bản (nhiều trình duyệt không phát được)', async () => {
  assert.equal(await chooseCodec(probeOf((c) => c.startsWith('hvc1'), () => true), cfg), null);
});

test('optionsFor/usableContainers: chỉ codec vừa hợp định dạng vừa được máy hỗ trợ (Nâng cao, ba ô phụ thuộc nhau)', async () => {
  const sup = await detectSupport(probeOf((c) => c.startsWith('avc1') || c.startsWith('vp0') || c.startsWith('hvc1'), (c) => c === 'opus'), cfg);
  assert.deepEqual(usableContainers(sup), ['mp4', 'webm', 'mov', 'mkv']);
  assert.deepEqual(optionsFor('mp4', sup), { videos: ['avc', 'hevc', 'vp9'], audios: ['opus'] });
  assert.deepEqual(optionsFor('webm', sup), { videos: ['vp9'], audios: ['opus'] });
  assert.deepEqual(optionsFor('mov', sup), { videos: ['avc', 'hevc'], audios: ['pcm'] }, 'PCM chạy bằng bộ ghi của Mediabunny nên luôn có');
  const noAv = await detectSupport(probeOf((c) => c === 'vp8', () => false), cfg);
  assert.deepEqual(usableContainers(noAv), ['webm', 'mkv'], 'MP4/MOV không có codec video nào dùng được thì ẩn');
});

test('normalizeSelection/manualChoice: đổi định dạng thì giữ codec cũ nếu còn hợp, không thì lấy codec đầu danh sách', async () => {
  const sup = await detectSupport(probeOf((c) => c.startsWith('avc1') || c.startsWith('vp0'), (c) => c === 'aac' || c === 'opus'), cfg);
  const toWebm = normalizeSelection({ container: 'webm', video: 'avc', audio: 'aac' }, sup, true);
  assert.deepEqual(toWebm, { container: 'webm', video: 'vp9', audio: 'opus' });
  const keep = normalizeSelection({ container: 'mkv', video: 'vp9', audio: 'opus' }, sup, true);
  assert.deepEqual(keep, { container: 'mkv', video: 'vp9', audio: 'opus' });
  assert.equal(normalizeSelection({ container: 'mp4', video: 'avc', audio: 'aac' }, sup, false)?.audio, 'none', 'không có âm thanh dự án thì không codec âm thanh');
  const c = manualChoice(sup, { container: 'mkv', video: 'avc', audio: 'none' }, true);
  assert.deepEqual(c, { container: 'mkv', video: 'avc', videoCodec: 'avc1.640028', audioCodec: null, notices: [] }, 'chọn "Không có âm thanh" là có chủ ý: không báo');
  const none = await detectSupport(probeOf((c) => c.startsWith('avc1'), () => false), cfg);
  assert.equal(manualChoice({ ...none, audio: new Set() }, { container: 'mp4', video: 'avc', audio: 'aac' }, true)?.notices[0], 'NO_AUDIO_ENCODER');
  assert.equal(manualChoice({ video: {}, audio: new Set() }, { container: 'mp4', video: 'avc', audio: 'aac' }, true), null);
});

test('chooseCodec: không có encoder → null (ERR_NO_SUPPORTED_ENCODER); isConfigSupported ném lỗi coi như không hỗ trợ', async () => {
  assert.equal(await chooseCodec(probeOf(() => false, () => false), cfg), null);
  const throwing: CodecProbe = { video: async () => { throw new Error('boom'); }, audio: async () => { throw new Error('boom'); } };
  assert.equal(await chooseCodec(throwing, cfg), null);
});

test('createBackpressure: dừng khi > 8, chỉ chạy lại khi ≤ 2 (trễ hai ngưỡng)', () => {
  const b = createBackpressure();
  assert.deepEqual([0, 5, 8].map((q) => b.update(q)), [false, false, false]);
  assert.equal(b.update(9), true);
  assert.equal(b.update(5), true, 'giữa hai ngưỡng vẫn dừng');
  assert.equal(b.update(3), true);
  assert.equal(b.update(2), false);
  assert.equal(b.update(8), false, 'chạy lại rồi thì chỉ dừng lại khi > 8');
  assert.equal(b.paused, false);
});

test('createProgress: phân số, fps, bội số thời gian thực, ETR theo cửa sổ trượt', () => {
  const p = createProgress(300, 30);
  const first = p.update(0, 0);
  assert.deepEqual([first.fps, first.speed, first.etrSec, first.fraction], [null, null, null, 0]);
  const a = p.update(60, 1000); // 60 khung/s = 2x
  assert.equal(a.fps, 60);
  assert.equal(a.speed, 2);
  assert.equal(a.etrSec, 4);
  assert.equal(a.fraction, 0.2);
  // sau cửa sổ 5 s, tốc độ cũ bị bỏ: chỉ tính tốc độ gần đây (30 khung/s)
  p.update(60 + 30 * 10, 11_000);
  const b = p.update(60 + 30 * 11, 12_000);
  assert.ok(Math.abs(b.fps! - 30) < 1e-9);
  assert.equal(p.update(300, 20_000).fraction, 1);
  assert.equal(createProgress(0, 30).update(0, 5).fraction, 1);
});

test('audioBlocks: khối 1 s liền nhau, khối cuối ngắn', () => {
  const b = audioBlocks(2.5, 48_000);
  assert.deepEqual(b, [{ start: 0, length: 48_000 }, { start: 48_000, length: 48_000 }, { start: 96_000, length: 24_000 }]);
  assert.deepEqual(audioBlocks(0, 48_000), []);
});

/** Buffer thử: mẫu thứ i có giá trị i + 1 (khác 0 để phân biệt với im lặng). */
const ramp = (n: number) => Float32Array.from({ length: n }, (_, i) => i + 1);

test('renderAudioBlock: offset dương chêm im lặng đầu, âm cắt đầu, thiếu cuối chêm im lặng', () => {
  const sr = 100;
  const ch = [ramp(300)]; // 3 s
  // offset +0,5 s: 50 mẫu đầu im lặng, rồi mẫu 1, 2, …
  const [a] = renderAudioBlock(ch, sr, 0, 500, { start: 0, length: 100 });
  assert.equal(a[49], 0);
  assert.equal(a[50], 1);
  assert.equal(a[99], 50);
  // offset −0,5 s: bỏ 50 mẫu đầu của buffer
  const [b] = renderAudioBlock(ch, sr, 0, -500, { start: 0, length: 100 });
  assert.equal(b[0], 51);
  // tới cuối buffer thì im lặng
  const [c] = renderAudioBlock(ch, sr, 0, 0, { start: 250, length: 100 });
  assert.equal(c[49], 300);
  assert.equal(c[50], 0);
  assert.equal(c.length, 100);
});

test('renderAudioBlock: các khối nối liền khớp từng mẫu với việc dựng một lần, cả hai kênh', () => {
  const sr = 100;
  const n = 250;
  const L = ramp(n);
  const R = L.map((v) => -v);
  const rangeStart = 0.37;
  const offsetMs = 120;
  const blocks = audioBlocks(3, sr, 1);
  const parts = blocks.map((bl) => renderAudioBlock([L, R], sr, rangeStart, offsetMs, bl));
  const whole = renderAudioBlock([L, R], sr, rangeStart, offsetMs, { start: 0, length: 300 });
  for (let c = 0; c < 2; c++) {
    const joined = Float32Array.from(parts.flatMap((p) => Array.from(p[c])));
    assert.deepEqual(joined, whole[c]);
  }
  assert.equal(whole[1][whole[0].findIndex((v) => v > 0)], -whole[0][whole[0].findIndex((v) => v > 0)]);
});

test('renderAudioBlock khớp exportSegments: cùng chỗ có tiếng, cùng chỗ im lặng (Preview = Export)', () => {
  const sr = 1000;
  const bufDur = 2;
  const ch = [ramp(bufDur * sr)];
  const rangeStart = 1;
  const dur = 4;
  const offsetMs = 750;
  const out = renderAudioBlock(ch, sr, rangeStart, offsetMs, { start: 0, length: dur * sr })[0];
  const segs = exportSegments(rangeStart, rangeStart + dur, offsetMs, bufDur);
  for (const s of segs) {
    const i0 = Math.round(s.at * sr);
    const i1 = Math.round((s.at + s.length) * sr);
    const slice = out.subarray(i0, i1);
    if (s.kind === 'silence') assert.ok(slice.every((v) => v === 0), `im lặng ${s.at}`);
    else assert.ok(slice.every((v) => v !== 0), `có tiếng ${s.at}`);
  }
});

test('audibleSeconds: đoạn xuất nằm ngoài âm thanh thì 0', () => {
  assert.equal(audibleSeconds(0, 10, 0, 4), 4);
  assert.equal(audibleSeconds(10, 5, 0, 4), 0);
  assert.equal(audibleSeconds(0, 10, 2000, 4), 4);
});

test('sliceAudioForRange: bản cắt dựng ra đúng từng mẫu như bản gốc, ở nhiều offset và đoạn', () => {
  const sr = 1000;
  const L = ramp(5 * sr);
  const R = L.map((v) => -v);
  for (const offsetMs of [0, 750, -1200, 3333]) {
    for (const [start, dur] of [[0, 4], [1.5, 2], [6, 2], [0.25, 8]] as const) {
      const whole = renderAudioBlock([L, R], sr, start, offsetMs, { start: 0, length: Math.round(dur * sr) });
      const sl = sliceAudioForRange([L, R], sr, start, dur, offsetMs);
      if (!sl) { assert.ok(whole[0].every((v) => v === 0), `không tiếng ${offsetMs}/${start}`); continue; }
      assert.ok(sl.channels[0].length < L.length || dur >= 5, 'chỉ cắt phần cần');
      const part = renderAudioBlock(sl.channels, sr, start, sl.offsetMs, { start: 0, length: Math.round(dur * sr) });
      assert.deepEqual(part[0], whole[0], `L ${offsetMs}/${start}`);
      assert.deepEqual(part[1], whole[1], `R ${offsetMs}/${start}`);
    }
  }
  assert.equal(sliceAudioForRange([ramp(100)], 100, 10, 2, 0), null);
});

test('normalizeRange: kẹp đoạn Start→End trong [0, độ dài cả bài]; rỗng hoặc ngắn hơn một khung thì không hợp lệ', () => {
  assert.deepEqual(normalizeRange({ start: 10, end: 20 }, 32), { start: 10, end: 20, ok: true });
  assert.deepEqual(normalizeRange({ start: -5, end: 99 }, 32), { start: 0, end: 32, ok: true });
  assert.equal(normalizeRange({ start: 20, end: 10 }, 32).ok, false);
  assert.equal(normalizeRange({ start: 5, end: 5 }, 32).ok, false);
  assert.equal(normalizeRange({ start: 5, end: 5.01 }, 32, 1 / 30).ok, false);
  assert.equal(normalizeRange({ start: 5, end: 5 + 1 / 30 }, 32, 1 / 30).ok, true);
  assert.equal(normalizeRange({ start: Number.NaN, end: 3 }, 32).start, 0);
  // đoạn khớp exportDuration: độ dài đúng đoạn
  const r = normalizeRange({ start: 45, end: 105 }, 200);
  assert.deepEqual(exportDuration({ projectSec: 198, range: r }), { start: 45, duration: 60 });
});

test('exportBaseName: tên chốt trước khi render gồm rộng×cao, fps và đoạn (D-26)', () => {
  assert.equal(exportBaseName('Song', { width: 1920, height: 1080, fps: 30 }), 'Song_1920x1080_30fps');
  assert.equal(exportBaseName('Song', { width: 1080, height: 1920, fps: 60, range: { start: 45, end: 105 } }), 'Song_1080x1920_60fps_0m45s-1m45s');
  assert.equal(exportBaseName('a', { width: 720, height: 720, fps: 24, range: { start: 5.5, end: 65.25 } }), 'a_720x720_24fps_0m05.5s-1m05.25s');
  assert.doesNotMatch(exportBaseName('a', { width: 2, height: 2, fps: 24, range: { start: 0, end: 3600.001 } }), /[:\\/]/);
});

test('fitRect: cùng tỉ lệ thì vẽ thẳng; khác tỉ lệ thì vừa khít, căn giữa (viền)', () => {
  assert.deepEqual(fitRect(1920, 1080, 1280, 720), { x: 0, y: 0, w: 1280, h: 720, fits: true });
  assert.equal(fitRect(1920, 1080, 1281, 720).fits, true); // lệch 1 điểm ảnh do làm chẵn: không viền
  assert.deepEqual(fitRect(1920, 1080, 1080, 1080), { x: 0, y: 236, w: 1080, h: 608, fits: false });
  assert.deepEqual(fitRect(1080, 1920, 1920, 1080), { x: 656, y: 0, w: 608, h: 1080, fits: false });
  assert.equal(heightForWidth(1280, 1920, 1080), 720);
  assert.equal(widthForHeight(1920, 1080, 1920), 1080);
});
