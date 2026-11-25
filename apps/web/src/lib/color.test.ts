// T-49 (REQ-UI-11): đọc mã màu ở mọi định dạng của ô nhập, kể cả sai; xuất lại mã chuẩn #rrggbb / #rrggbbaa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, normalizeColor, formatColor, toHex, sameColor, toHsva, fromHsva, CSS_COLOR_NAMES, oklchToRgb } from './color.ts';

const N = (s: string) => normalizeColor(s);

test('HEX: #rgb, #rgba, #rrggbb, #rrggbbaa, hoa/thường, có/không #; alpha ff bỏ đuôi', () => {
  assert.equal(N('#f80'), '#ff8800');
  assert.equal(N('#f808'), '#ff880088');
  assert.equal(N('#FF8800'), '#ff8800');
  assert.equal(N('#ff880080'), '#ff880080');
  assert.equal(N('#ff8800ff'), '#ff8800');
  assert.equal(N('  ff8800  '), '#ff8800');
  assert.equal(N('112233'), '#112233', '6 chữ số không # là HEX');
  assert.equal(N('ff880080'), '#ff880080');
  assert.equal(N('abc'), '#aabbcc');
});

test('0xRRGGBB, 0xRRGGBBAA và số nguyên thập phân', () => {
  assert.equal(N('0xff8800'), '#ff8800');
  assert.equal(N('0XFF880080'), '#ff880080');
  assert.equal(N('0xff'), '#0000ff');
  assert.equal(N('16711680'), '#ff0000');
  assert.equal(N('255'), '#0000ff');
  assert.equal(N('0'), '#000000');
  assert.equal(N('16777216'), null, 'quá 0xFFFFFF');
});

test('rgb()/rgba(): dấu phẩy hoặc khoảng trắng, phần trăm, alpha qua / hoặc đối số thứ tư', () => {
  assert.equal(N('rgb(255 0 0)'), '#ff0000');
  assert.equal(N('rgb(255, 0, 0)'), '#ff0000');
  assert.equal(N('rgba(255, 0, 0, 0.5)'), '#ff000080');
  assert.equal(N('rgb(255 0 0 / 50%)'), '#ff000080');
  assert.equal(N('rgb(100% 50% 0%)'), '#ff8000');
  assert.equal(N('RGB(300, -5, 0)'), '#ff0000', 'kẹp về 0..255');
});

test('bộ số thập phân: 0..255 hoặc 0..1 (có dấu chấm), thêm alpha', () => {
  assert.equal(N('255, 0, 0'), '#ff0000');
  assert.equal(N('255 128 0'), '#ff8000');
  assert.equal(N('1.0, 0, 0'), '#ff0000');
  assert.equal(N('0.5, 0.5, 0.5'), '#808080');
  assert.equal(N('1.0, 0, 0, 0.5'), '#ff000080');
  assert.equal(N('255, 0, 0, 128'), '#ff000080');
  assert.equal(N('256, 0, 0'), null);
  assert.equal(N('1, 2'), null);
});

test('hsl()/hsla(): góc deg/turn/rad, phần trăm hoặc số trơn, alpha', () => {
  assert.equal(N('hsl(0 100% 50%)'), '#ff0000');
  assert.equal(N('hsl(120, 100%, 50%)'), '#00ff00');
  assert.equal(N('hsla(240, 100%, 50%, 0.5)'), '#0000ff80');
  assert.equal(N('hsl(0.5turn 100% 50%)'), '#00ffff');
  assert.equal(N('hsl(3.14159rad 100% 50%)'), '#00ffff');
  assert.equal(N('hsl(360 100 50)'), '#ff0000');
  assert.equal(N('hsl(0 0% 100%)'), '#ffffff');
});

test('hsv()/hsb()', () => {
  assert.equal(N('hsv(0 100% 100%)'), '#ff0000');
  assert.equal(N('hsb(60, 100%, 100%)'), '#ffff00');
  assert.equal(N('hsv(0 0% 50%)'), '#808080');
  assert.equal(N('hsva(240 100% 100% / 0.25)'), '#0000ff40');
});

test('oklch(): giá trị chuẩn CSS, phần trăm, alpha; ngoài gam màu thì kẹp', () => {
  assert.equal(N('oklch(62.8% 0.2577 29.23)'), '#ff0000');
  assert.equal(N('oklch(1 0 0)'), '#ffffff');
  assert.equal(N('oklch(0 0 0)'), '#000000');
  assert.equal(N('oklch(0.5198 0.1769 142.5 / 0.5)'), '#008000' + '80');
  const [r, g, b] = oklchToRgb(0.9, 0.5, 145); for (const v of [r, g, b]) assert.ok(v >= 0 && v <= 255);
});

test('tên màu CSS (148 tên + transparent), không phân biệt hoa thường', () => {
  assert.equal(CSS_COLOR_NAMES.length, 148);
  assert.equal(N('red'), '#ff0000');
  assert.equal(N('RebeccaPurple'), '#663399');
  assert.equal(N('cornflowerblue'), '#6495ed');
  assert.equal(N('transparent'), '#00000000');
  assert.equal(N('lightgoldenrodyellow'), '#fafad2');
});

test('sai định dạng → null', () => {
  for (const bad of ['', '   ', '#', '#12', '#12345', '#1234567', '#gg0000', 'đỏ', 'notacolor', 'rgb(1,2)', 'rgb(a,b,c)', 'rgb(1 2 3 / )', 'hsl(0 100%)', 'oklch()',
    'hsl(1 2 3 4 5)', 'rgb(1 2 3 / 4 / 5)', 'foo(1 2 3)', '0x', '0xgg', '1.2.3', '-1, 0, 0', 'x'.repeat(300)]) {
    assert.equal(parseColor(bad), null, JSON.stringify(bad));
  }
  assert.equal(parseColor(undefined as unknown as string), null);
});

test('xuất: toHex bỏ alpha khi cần; formatColor theo HEX/RGB/HSL/HSV; sameColor', () => {
  const c = parseColor('#ff880080')!;
  assert.equal(toHex(c, false), '#ff8800');
  assert.equal(formatColor(c, 'hex'), '#FF880080');
  assert.equal(formatColor(c, 'rgb'), 'rgb(255 136 0 / 0.5)');
  assert.equal(formatColor(parseColor('#ff0000')!, 'hsl'), 'hsl(0 100% 50%)');
  assert.equal(formatColor(parseColor('#ff0000')!, 'hsv'), 'hsv(0 100% 100%)');
  assert.equal(formatColor(c, 'rgb', false), 'rgb(255 136 0)');
  // Đọc lại chuỗi đã xuất ra được đúng màu (vòng tròn).
  for (const f of ['hex', 'rgb', 'hsl', 'hsv'] as const) for (const hex of ['#ff8800', '#12345678', '#00ff00', '#808080']) {
    const back = normalizeColor(formatColor(parseColor(hex)!, f))!;
    const d = (i: number) => Math.abs(parseInt(back.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16));
    assert.ok(d(1) <= 2 && d(3) <= 2 && d(5) <= 2, `${f} ${hex} → ${back}`);
  }
  assert.ok(sameColor('#F80', '#ff8800ff')); assert.ok(!sameColor('#ff8800', '#ff8801')); assert.ok(!sameColor('x', 'x'));
});

test('HSV của bảng chọn: Rgba ↔ Hsva khứ hồi', () => {
  for (const hex of ['#ff8800', '#336699cc', '#000000', '#ffffff']) assert.equal(toHex(fromHsva(toHsva(parseColor(hex)!))), hex);
});
