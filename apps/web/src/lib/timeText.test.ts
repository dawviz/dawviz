import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, parseTime, parseTimeInput } from './timeText.ts';

test('parseTime: giây, m:ss, h:mm:ss, phần lẻ, dấu phẩy', () => {
  assert.equal(parseTime('90'), 90); assert.equal(parseTime(' 90.5 '), 90.5); assert.equal(parseTime('1:30'), 90);
  assert.equal(parseTime('1:30.25'), 90.25); assert.equal(parseTime('1:30,5'), 90.5); assert.equal(parseTime('1:02:03'), 3723); assert.equal(parseTime('0:05'), 5);
});
test('parseTime: sai → null', () => {
  for (const bad of ['', 'abc', '-5', '1:60', '1:2:3:4', '1:75:00', '1.5:30', '1:30.1234', '１２']) assert.equal(parseTime(bad), null, bad);
});
test('formatTime: m:ss, phần lẻ không thừa số 0, giờ', () => {
  assert.equal(formatTime(0), '0:00'); assert.equal(formatTime(90), '1:30'); assert.equal(formatTime(90.5), '1:30.5'); assert.equal(formatTime(90.25), '1:30.25');
  assert.equal(formatTime(3723), '1:02:03'); assert.equal(formatTime(-4), '0:00'); assert.equal(formatTime(NaN), '0:00');
  for (const x of [0, 5, 59.999, 61.5, 3599, 7322.04]) assert.equal(parseTime(formatTime(x)), Math.round(x * 1000) / 1000);
});

test('parseTimeInput: phép tính và dạng tương đối', () => {
  assert.equal(parseTimeInput('1:30+15', 0), 105);
  assert.equal(parseTimeInput('(2:00-0:10)/2', 0), 55);
  assert.equal(parseTimeInput('+=10', 60), 70);
  assert.equal(parseTimeInput('-=0:05', 60), 55);
  assert.equal(parseTimeInput('*=2', 30), 60);
  assert.equal(parseTimeInput('/=2', 30), 15);
  assert.equal(parseTimeInput('1:30', null), 90);
});
test('parseTimeInput: từ chối sai cú pháp, số âm, chia 0, thiếu giá trị hiện tại', () => {
  for (const [t, c] of [['1:30+', 0], ['-=100', 60], ['/=0', 60], ['+=5', null], ['abc', 0]] as const) assert.equal(parseTimeInput(t, c), null, t);
});
