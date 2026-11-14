import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumberInput as p, nudge, formatNumber, scrubValue } from './numberInput.ts';

const val = (r: ReturnType<typeof p>) => (r.ok ? r.value : r.reason);

test('numberInput: số, dấu phẩy thập phân, dấu âm', () => {
  assert.equal(val(p('0.7', 0)), 0.7);
  assert.equal(val(p('0,7', 0)), 0.7);
  assert.equal(val(p(' .5 ', 0)), 0.5);
  assert.equal(val(p('-3', 0)), -3);
  assert.equal(val(p('1,000.5', 0)), 'syntax'); // mơ hồ → từ chối, không đoán
  assert.equal(val(p('', 0)), 'empty');
});
test('numberInput: phép tính và ngoặc, không dùng eval', () => {
  assert.equal(val(p('1920/2', 0)), 960);
  assert.equal(val(p('(4+2)*3', 0)), 18);
  assert.equal(val(p('2+3*4', 0)), 14);
  assert.equal(val(p('1/0', 0)), 'nan');
  assert.equal(val(p('alert(1)', 0)), 'syntax');
  assert.equal(val(p('2**3', 0)), 'syntax');
  assert.equal(val(p('('.repeat(20) + '1' + ')'.repeat(20), 0)), 'syntax'); // quá sâu
});
test('numberInput: tương đối, đơn vị, kẹp, biểu thức chuyển đi', () => {
  assert.equal(val(p('+=10', 5)), 15);
  assert.equal(val(p('*=2', 5)), 10);
  assert.equal(val(p('/=0', 5)), 'nan');
  assert.equal(val(p('50%', 0, { units: { '%': 0.01 } })), 0.5);
  assert.equal(val(p('12px', 0, { units: { px: 1 } })), 12);
  assert.equal(val(p('12em', 0, { units: { px: 1 } })), 'unit');
  const c = p('5', 0, { min: 0, max: 1 });
  assert.ok(c.ok && c.value === 1 && c.clamped);
  assert.equal(val(p('=sin(t)', 0)), 'expr');
});
test('numberInput: nudge theo bước, Shift/Alt, làm tròn, kẹp; format theo bước', () => {
  assert.equal(nudge(0.2, 1, { step: 0.1 }), 0.3);
  assert.equal(nudge(0.5, 1, { step: 0.05, max: 1 }, { shift: true }), 1);
  assert.equal(nudge(4, -1, { step: 1 }, { alt: true }), 3.9);
  assert.equal(nudge(0, -1, { step: 1, min: 0 }), 0);
  assert.equal(formatNumber(0.7, 0.05), '0.70');
  assert.equal(formatNumber(12, 1), '12');
});
test('numberInput: scrubValue theo phạm vi mềm, Shift/Alt, làm tròn bước, kẹp cứng', () => {
  // 0–1 bước 0,05: 200 px đi hết phạm vi → 10 px một bước.
  assert.equal(scrubValue(0.5, 10, { step: 0.05, min: 0, max: 1 }, [0, 1]), 0.55);
  assert.equal(scrubValue(0.5, -4, { step: 0.05, min: 0, max: 1 }, [0, 1]), 0.5); // chưa đủ nửa bước
  assert.equal(scrubValue(0.5, 1000, { step: 0.05, min: 0, max: 1 }, [0, 1]), 1);
  // Không có phạm vi: một bước mỗi px; Shift ×10; Alt ×0,1 và bước nhỏ lại.
  assert.equal(scrubValue(100, 7, { step: 1 }), 107);
  assert.equal(scrubValue(100, 7, { step: 1 }, undefined, { shift: true }), 170);
  assert.equal(scrubValue(100, 7, { step: 1 }, undefined, { alt: true }), 100.7);
  // Phạm vi mềm 0–20, gõ tới 999: kéo vẫn vượt phạm vi mềm được tới giới hạn cứng.
  assert.equal(scrubValue(20, 400, { step: 1, min: 0, max: 999 }, [0, 20]), 60);
});
