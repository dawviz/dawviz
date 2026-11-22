import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_LIMITS, AssetError, acceptAsset, checkImageSize, fontFamilyFor, missingAssets, packAssetName, parsePackAssetName, sha256Id, sniff, svgProblems } from './sessionAssets.ts';

const enc = (s: string) => new TextEncoder().encode(s);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

test('nhận dạng bằng magic bytes, không tin đuôi tệp', () => {
  assert.deepEqual(sniff(png), { kind: 'image', ext: 'png' });
  assert.equal(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))!.ext, 'jpg');
  assert.equal(sniff(enc('GIF89a....'))!.ext, 'gif');
  assert.equal(sniff(enc('RIFF\0\0\0\0WEBPVP8 '))!.ext, 'webp');
  assert.equal(sniff(enc('wOF2xxxx'))!.kind, 'font'); assert.equal(sniff(new Uint8Array([0, 1, 0, 0, 9]))!.ext, 'ttf'); assert.equal(sniff(enc('OTTO'))!.ext, 'otf');
  assert.equal(sniff(enc('﻿<?xml version="1.0"?>\n<!-- c --><svg xmlns="http://www.w3.org/2000/svg"></svg>'))!.kind, 'svg');
  assert.equal(sniff(enc('<html><svg></svg></html>')), null);
  assert.equal(sniff(enc('hello')), null);
});

test('SVG nguy hiểm bị chỉ ra; SVG thường thì sạch', () => {
  assert.deepEqual(svgProblems('<svg><rect fill="url(#g)"/><use href="#a"/><image href="data:image/png;base64,AA"/></svg>'), []);
  const bad = svgProblems('<svg onload="x()"><script>1</script><foreignObject/><a xlink:href="https://evil"/><!ENTITY x "y"><a href="javascript:1"/><rect style="fill:url(http://x)"/></svg>');
  for (const p of ['script', 'event-handler', 'foreignObject', 'external-link', 'entity', 'javascript-url', 'external-url']) assert.ok(bad.includes(p), p);
});

test('nhận tài nguyên: SHA-256 nội dung, nạp trùng không nhân đôi, phông có họ không trùng; quá cỡ/không rõ/SVG độc/phiên đầy bị từ chối có mã', async () => {
  const a = await acceptAsset([], 'logo.png', png);
  assert.ok(a.added && /^sha256:[0-9a-f]{64}$/.test(a.meta.id) && a.meta.kind === 'image' && a.meta.size === png.length);
  assert.equal(a.meta.id, await sha256Id(png));
  const again = await acceptAsset([a.meta], 'logo-copy.png', png);
  assert.equal(again.added, false); assert.equal(again.meta, a.meta);
  const f1 = await acceptAsset([], 'My Font!.woff2', enc('wOF2abc'));
  const f2 = await acceptAsset([f1.meta], 'My Font!.ttf', new Uint8Array([0, 1, 0, 0, 7]));
  assert.equal(f1.meta.family, 'My Font'); assert.equal(f2.meta.family, 'My Font 2');
  const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { assert.ok(e instanceof AssetError); return (e as AssetError).code; } };
  assert.equal(await code(acceptAsset([], 'x.png', new Uint8Array(ASSET_LIMITS.maxBytes + 1))), 'ERR_ASSET_TOO_LARGE');
  assert.equal(await code(acceptAsset([], 'x.exe', enc('MZ......'))), 'ERR_ASSET_UNSUPPORTED');
  assert.equal(await code(acceptAsset([], 'x.svg', enc('<svg><script>alert(1)</script></svg>'))), 'ERR_ASSET_UNSAFE');
  assert.equal(await code(acceptAsset([], 'x.png', new Uint8Array(0))), 'ERR_ASSET_DECODE');
  const full = [{ id: 'sha256:' + '0'.repeat(64), kind: 'image' as const, name: 'big', size: ASSET_LIMITS.maxSessionBytes - 4 }];
  assert.equal(await code(acceptAsset(full, 'y.png', png)), 'ERR_ASSET_SESSION_FULL');
  assert.throws(() => checkImageSize('x', 9000, 10), (e: AssetError) => e.code === 'ERR_ASSET_TOO_LARGE');
  assert.throws(() => checkImageSize('x', 0, 10), (e: AssetError) => e.code === 'ERR_ASSET_DECODE');
});

test('tên tệp trong Project Pack đọc lại được; pre-flight chỉ ra ảnh thiếu', async () => {
  const id = await sha256Id(png), n = packAssetName({ id, name: 'logo cũ (1).png' });
  assert.deepEqual(parsePackAssetName(n), { short: id.slice(7, 23), name: 'logo_c_1_.png' });
  assert.equal(parsePackAssetName('background.png'), null);
  assert.equal(fontFamilyFor('.ttf', new Set()), 'Font');
  const scene = { widgets: [{ type: 'IMAGE', properties: { asset: id } }, { type: 'IMAGE', properties: { asset: '' } }, { type: 'TEXT', properties: {} }] };
  assert.deepEqual(missingAssets(scene, new Set()), [id]); assert.deepEqual(missingAssets(scene, new Set([id])), []);
});
