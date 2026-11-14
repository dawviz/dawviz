// Phần trình bày báo cáo kiểm tra máy (phần thử mã hoá cần trình duyệt nên không test ở đây).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReport } from './exportDiagnostics.ts';

test('formatReport: đủ thông tin, phân biệt không hỗ trợ / lỗi mã hoá, không có tên tệp', () => {
  const r = formatReport(
    { userAgent: 'UA/1', cores: 8, memoryGb: null, fileSystemAccess: true, wakeLock: false, offscreenCanvas: true },
    [
      { name: 'video avc1.640028 1920x1080', supported: true, encode: 'ok', detail: '30 packets', ms: 12.4 },
      { name: 'audio mp4a.40.2 64 kbps stereo 48 kHz', supported: true, encode: 'fail', detail: 'EncodingError' },
      { name: 'audio opus 128 kbps stereo 48 kHz', supported: false, encode: 'skipped' },
    ], '0.1.0');
  assert.match(r, /User agent: UA\/1/);
  assert.match(r, /memory \(GB, approx\): n\/a/);
  assert.match(r, /avc1\.640028 1920x1080: supported; encode ok \(12 ms\) — 30 packets/);
  assert.match(r, /64 kbps stereo 48 kHz: supported; encode fail — EncodingError/);
  assert.match(r, /opus 128 kbps stereo 48 kHz: NOT supported; encode skipped/);
});
