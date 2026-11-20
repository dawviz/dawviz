// T-82: lịch phát, ghép lần gõ, trung vị, hồ sơ thiết bị. Dữ liệu gõ giả; đo trên thiết bị thật phải thử tay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BAR_SEC, BEAT_SEC, CAL, addProfile, activeOffsetMs, buildSchedule, clampDeviceOffset, matchTaps, median, parseProfile, removeProfile, sanitizeDevicePrefs, serializeProfile, summarize, uniqueProfileName, updateProfile, MAX_PROFILES } from './latencyCalibration.ts';

const near = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);

test('lịch phát: 110 BPM, 4 ô × (kick, kick, phách 3), cả 4 phách 3 đều được đo, không có ô khởi động', () => {
  near(BEAT_SEC, 60 / 110); near(BAR_SEC, 240 / 110);
  const { events, snares, end } = buildSchedule(1);
  assert.equal(events.length, 12);
  assert.deepEqual(events.slice(0, 3).map((e) => e.kind), ['kick', 'kick', 'snare']);
  assert.equal(events.filter((e) => e.kind === 'snare').length, 4);
  assert.equal(events.filter((e) => e.measured).length, 4);
  assert.equal(snares.length, 4);
  near(snares[0], 1 + 2 * BEAT_SEC); near(snares[3] - snares[0], 3 * BAR_SEC);
  near(end, 1 + 4 * BAR_SEC);
  assert.ok(events.every((e) => e.beat !== 3), 'phách 4 lặng');
});

test('matchTaps: chọn lần gõ gần snare nhất trong cửa sổ, mỗi lần gõ chỉ dùng một lần', () => {
  const S = [10, 12, 14, 16];
  const taps = [9.9, 11.5, 12.04, 14.44, 15.7, 16.4, 16.6]; // 11.5 trùng kick (ngoài −250…); 15.7 quá sớm so với snare 16; 16.6 ngoài +450
  assert.deepEqual(matchTaps(S, taps), [-100, 40, 440, 400]);
  assert.deepEqual(matchTaps(S, [12.7]), [null, null, null, null]);
  assert.deepEqual(matchTaps([5, 5.2], [5.1]), [100, null], 'hai snare gần nhau: lần gõ không bị dùng hai lần');
});

test('matchTaps: biên cửa sổ −250 / +450 ms', () => {
  assert.deepEqual(matchTaps([10], [9.75]), [-250]); assert.deepEqual(matchTaps([10], [9.7499]), [null]);
  assert.deepEqual(matchTaps([10], [10.45]), [450]); assert.deepEqual(matchTaps([10], [10.4501]), [null]);
});

test('trung vị', () => {
  assert.equal(median([3]), 3); assert.equal(median([5, 1, 3]), 3); assert.equal(median([4, 1, 3, 2]), 2.5); assert.ok(Number.isNaN(median([])));
});

test('summarize: ổn định, không ổn định (spread > 30 ms), thiếu lần đo (< 3 hợp lệ)', () => {
  const ok = summarize([10, 12, 14, 11]);
  assert.equal(ok.status, 'ok'); assert.equal(ok.offsetMs, 12); // trung vị 11,5 → làm tròn 12 assert.equal(ok.valid, 4); assert.equal(ok.spreadMs, 4);
  const edge = summarize([0, 30, 10, 20]); assert.equal(edge.status, 'ok', 'đúng 30 ms vẫn ổn');
  const bad = summarize([0, 31, 10, 20]); assert.equal(bad.status, 'unstable'); assert.equal(bad.offsetMs, 15);
  const three = summarize([10, null, 14, 12]); assert.equal(three.status, 'ok'); assert.equal(three.valid, 3); assert.equal(three.offsetMs, 12);
  const few = summarize([10, null, null, 12]); assert.equal(few.status, 'tooFew'); assert.equal(few.offsetMs, null);
  assert.equal(summarize([null, null, null, null]).spreadMs, 0);
  assert.equal(CAL.minValid, 3);
});

test('trung vị bền với một lần gõ lạc (lần xa lệch ra ngoài ngưỡng ổn định nhưng không kéo kết quả)', () => {
  const r = summarize([20, 22, 21, 180]);
  assert.equal(r.offsetMs, 22); // trung vị (21+22)/2 = 21,5 → làm tròn 22
  assert.equal(r.status, 'unstable');
});

test('độ lệch kẹp ±500 ms, làm tròn 1 ms, không hữu hạn → 0', () => {
  assert.equal(clampDeviceOffset(1234), 500); assert.equal(clampDeviceOffset(-1234), -500); assert.equal(clampDeviceOffset(12.6), 13); assert.equal(clampDeviceOffset(NaN), 0);
});

test('hồ sơ: thêm tên duy nhất, đổi tên/độ lệch, xoá, độ lệch đang áp', () => {
  let p = addProfile({ profiles: [], activeId: null }, 'AirPods', 80, 'a')!;
  assert.equal(activeOffsetMs(p), 80);
  p = addProfile(p, 'airpods', 120, 'b')!; // trùng tên không phân biệt hoa/thường
  assert.deepEqual(p.profiles.map((x) => x.name), ['AirPods', 'airpods 2']); assert.equal(p.activeId, 'b');
  p = updateProfile(p, 'b', { name: 'Loa bàn', offsetMs: 9999 });
  assert.deepEqual(p.profiles[1], { id: 'b', name: 'Loa bàn', offsetMs: 500 });
  p = updateProfile(p, 'b', { name: 'airpods' }); assert.equal(p.profiles[1].name, 'airpods 2');
  p = removeProfile(p, 'b'); assert.equal(p.activeId, null); assert.equal(activeOffsetMs(p), 0);
  assert.equal(uniqueProfileName([{ id: 'x', name: 'A', offsetMs: 0 }], 'A', 'x'), 'A');
});

test('hồ sơ: tối đa 16', () => {
  let p = { profiles: [], activeId: null } as ReturnType<typeof sanitizeDevicePrefs>;
  for (let i = 0; i < MAX_PROFILES; i++) p = addProfile(p, `D${i}`, i, `id${i}`)!;
  assert.equal(addProfile(p, 'thêm', 1, 'zz'), null);
});

test('sanitizeDevicePrefs: bỏ mục hỏng/trùng, activeId mồ côi về null', () => {
  const p = sanitizeDevicePrefs({ profiles: [{ id: 'a', name: ' Tai   nghe ', offsetMs: 40.4 }, { id: 'a', name: 'trùng id', offsetMs: 1 }, { id: 'b', name: 'tai nghe', offsetMs: 2 },
    { id: 'c', name: '', offsetMs: 1 }, { id: 'd', name: 'x', offsetMs: 'y' }, null, 5, { id: 'e', name: 'Loa', offsetMs: 7000 }], activeId: 'zzz' });
  assert.deepEqual(p.profiles, [{ id: 'a', name: 'Tai nghe', offsetMs: 40 }, { id: 'e', name: 'Loa', offsetMs: 500 }]); assert.equal(p.activeId, null);
  assert.deepEqual(sanitizeDevicePrefs('lạ'), { profiles: [], activeId: null }); assert.equal(sanitizeDevicePrefs({ profiles: [{ id: 'a', name: 'x', offsetMs: 1 }], activeId: 'a' }).activeId, 'a');
});

test('tệp hồ sơ: ghi rồi đọc lại; từ chối sai định dạng, phiên bản, giá trị, JSON hỏng, quá lớn', () => {
  const text = serializeProfile({ name: 'Tai nghe  Sony', offsetMs: 63.2 });
  assert.deepEqual(parseProfile(text), { ok: true, name: 'Tai nghe Sony', offsetMs: 63 });
  const bad = (o: unknown) => parseProfile(JSON.stringify(o));
  assert.equal(bad({ format: 'x', version: 1, name: 'a', offsetMs: 1 }).ok, false);
  assert.deepEqual(bad({ format: 'dawviz-device-latency', version: 2, name: 'a', offsetMs: 1 }), { ok: false, reason: 'version' });
  assert.deepEqual(bad({ format: 'dawviz-device-latency', version: 1, name: '', offsetMs: 1 }), { ok: false, reason: 'value' });
  assert.deepEqual(bad({ format: 'dawviz-device-latency', version: 1, name: 'a', offsetMs: 501 }), { ok: false, reason: 'value' });
  assert.deepEqual(bad({ format: 'dawviz-device-latency', version: 1, name: 'a', offsetMs: '5' }), { ok: false, reason: 'value' });
  assert.deepEqual(parseProfile('{không'), { ok: false, reason: 'json' }); assert.deepEqual(parseProfile('[]'), { ok: false, reason: 'format' });
  assert.deepEqual(parseProfile(' '.repeat(5000)), { ok: false, reason: 'tooLarge' });
  assert.deepEqual(parseProfile('{"format":"dawviz-device-latency","version":1,"name":"a","offsetMs":1,"__proto__":{"x":1}}'), { ok: true, name: 'a', offsetMs: 1 });
});
