// Thống kê xuất (T-09): trung bình trượt 30 khung, phát hiện "vẽ chậm dần", rút gọn đường cong, báo cáo chẩn đoán.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLOWING_MIN_FRAME, createStats, downsample, formatExportReport, isSlowing, type ExportReport } from './exportStats.ts';

test('createStats: trung bình trượt theo 30 khung gần nhất; trung bình "đầu" chỉ tính 30 khung đầu', () => {
  const s = createStats();
  for (let i = 0; i < 30; i++) s.addDraw(2);
  for (let i = 0; i < 30; i++) s.addDraw(10);
  const sn = s.snapshot(60);
  assert.equal(sn.drawMs, 10, 'cửa sổ trượt chỉ còn 30 khung sau');
  assert.equal(sn.drawFirstMs, 2, '30 khung đầu giữ nguyên');
  assert.equal(createStats().snapshot(0).drawFirstMs, null, 'chưa đủ 30 khung thì chưa có mốc đầu');
  s.addEncode(3); s.addEncode(5);
  assert.equal(s.snapshot(61).encodeMs, 4);
});

test('isSlowing: chỉ báo khi đủ khung và vẽ gấp ≥ 3 lần lúc đầu và hơn ≥ 6 ms', () => {
  assert.equal(isSlowing(SLOWING_MIN_FRAME, 5, 20), true, '5 → 20 ms: đúng kiểu Firefox');
  assert.equal(isSlowing(SLOWING_MIN_FRAME - 1, 5, 20), false, 'chưa đủ khung');
  assert.equal(isSlowing(1000, 5, 12), false, 'chưa gấp 3 lần');
  assert.equal(isSlowing(1000, 1, 4), false, 'cảnh đầu rất nhẹ: gấp 4 lần nhưng chỉ hơn 3 ms, không báo');
  assert.equal(isSlowing(1000, null, 100), false, 'chưa có mốc đầu');
});

test('downsample: giữ điểm đầu và cuối, tối đa `max` điểm, làm tròn 0,1', () => {
  const pts = Array.from({ length: 100 }, (_, i) => [i * 30, i + 0.123] as [number, number]);
  const d = downsample(pts, 10);
  assert.equal(d.length, 10);
  assert.deepEqual(d[0], [0, 0.1]);
  assert.deepEqual(d.at(-1), [2970, 99.1]);
  assert.equal(downsample(pts.slice(0, 5), 10).length, 5);
});

test('series: mỗi snapshot ghi một điểm theo số khung', () => {
  const s = createStats();
  for (let f = 1; f <= 40; f++) { s.addDraw(f); if (f % 10 === 0) s.snapshot(f); }
  const series = s.series();
  assert.deepEqual(series.map((p) => p[0]), [10, 20, 30, 40]);
  assert.ok(series[3][1] > series[0][1]);
});

test('formatExportReport: có mọi trường cần để đối chiếu lỗi người thử gửi về, không có tên tệp', () => {
  const r: ExportReport = {
    stats: { drawMs: 40.26, encodeMs: 2.1, drawFirstMs: 5, slowing: true, fontFaces: 2, container: 'mp4', videoCodec: 'avc1.640028', audioCodec: 'opus' },
    series: [[30, 5], [2000, 20], [4500, 44.2]], frames: 4620, fps: 30, width: 1080, height: 1080, totalMs: 120_000, bytes: 34_000_000, style: 'paper',
  };
  const t = formatExportReport(r, { userAgent: 'Firefox/154', cores: 22, appVersion: '0.1.0' });
  for (const want of ['0.1.0', 'Firefox/154', 'Cores: 22', '1080x1080 @ 30 fps', 'MP4', 'avc1.640028', 'audio opus', 'style paper', '4620', '38.5 fps', 'start 5 ms', 'middle 20 ms @ frame 2000', 'end 44.2 ms @ frame 4500', 'slowing down over time: YES', 'Font faces loaded in worker: 2', '30:5 2000:20 4500:44.2']) assert.ok(t.includes(want), `thiếu: ${want}\n${t}`);
  assert.ok(!/\.rpp|\.mid|\.als/.test(t));
  assert.ok(formatExportReport({ ...r, stats: { ...r.stats, slowing: false } }, { userAgent: 'x', cores: null, appVersion: '1' }).includes('slowing down over time: no'));
});
