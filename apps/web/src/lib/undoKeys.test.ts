// T-07: phím tắt hoàn tác. Chạy cả khi focus ở nút/radio/thanh trượt (vừa bấm xong vẫn hoàn tác được); KHÔNG chạy khi đang gõ ở ô chữ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { undoAction, bindUndoKeys, shortcutLabels } from './undoKeys.ts';
import { isTextEntry } from './a11y.ts';

const k = (key: string, m: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...m });

test('undoAction: Ctrl/Cmd+Z hoàn tác; Ctrl/Cmd+Shift+Z và Ctrl+Y làm lại; tổ hợp khác bị bỏ qua', () => {
  assert.equal(undoAction(k('z', { ctrlKey: true })), 'undo');
  assert.equal(undoAction(k('z', { metaKey: true })), 'undo');
  assert.equal(undoAction(k('Z', { ctrlKey: true, shiftKey: true })), 'redo'); // Shift làm key thành 'Z'
  assert.equal(undoAction(k('z', { metaKey: true, shiftKey: true })), 'redo');
  assert.equal(undoAction(k('y', { ctrlKey: true })), 'redo');
  assert.equal(undoAction(k('y', { metaKey: true })), null);
  for (const e of [k('z'), k('y'), k('z', { ctrlKey: true, altKey: true }), k('x', { ctrlKey: true }), k('Enter', { ctrlKey: true }), k('y', { ctrlKey: true, shiftKey: true })]) assert.equal(undoAction(e), null, JSON.stringify(e));
});

test('shortcutLabels: Cmd trên macOS, Ctrl nơi khác', () => {
  assert.deepEqual(shortcutLabels(false), { undo: 'Ctrl+Z', redo: 'Ctrl+Shift+Z' });
  assert.deepEqual(shortcutLabels(true), { undo: '⌘Z', redo: '⇧⌘Z' });
});

// Bộ giả tối thiểu cho HTMLElement để chạy ở Node: isTextEntry kiểm `instanceof HTMLElement`, `isContentEditable`, `matches`.
class FakeEl { tag: string; type: string; isContentEditable: boolean;
  constructor(tag: string, type = '', ce = false) { this.tag = tag; this.type = type; this.isContentEditable = ce; }
  matches(sel: string) { const t = this.tag + (this.tag === 'input' ? `[type="${this.type}"]` : '');
    return sel.split(',').map((x) => x.trim()).some((x) => x === this.tag || (this.tag === 'input' && ((x === 'input:not([type])' && !this.type) || x === `input[type="${this.type}"]`)) || x === t); } }
(globalThis as any).HTMLElement = FakeEl;

function fire(target: unknown, key: string, mods: object = {}) {
  const calls: string[] = []; let handler: ((e: any) => void) | undefined; let prevented = false;
  const un = bindUndoKeys({ addEventListener: (_: string, f: any) => { handler = f; }, removeEventListener: () => { handler = undefined; } } as any, { undo: () => calls.push('undo'), redo: () => calls.push('redo') });
  handler!({ key, ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, isComposing: false, defaultPrevented: false, target, preventDefault: () => { prevented = true; }, ...mods });
  un(); assert.equal(handler, undefined);
  return { calls, prevented };
}

test('không chạy khi đang gõ ở ô chữ/số/textarea/contentEditable; có chạy khi focus ở nút, radio, thanh trượt, danh sách chọn, thân trang', () => {
  for (const el of [new FakeEl('input', 'text'), new FakeEl('input', 'number'), new FakeEl('input'), new FakeEl('textarea'), new FakeEl('div', '', true)]) {
    assert.equal(isTextEntry(el), true);
    assert.deepEqual(fire(el, 'z'), { calls: [], prevented: false }, `${el.tag}/${el.type}`);
  }
  for (const el of [new FakeEl('button'), new FakeEl('input', 'range'), new FakeEl('input', 'checkbox'), new FakeEl('input', 'color'), new FakeEl('select'), new FakeEl('body'), null]) {
    assert.equal(isTextEntry(el), false);
    assert.deepEqual(fire(el, 'z'), { calls: ['undo'], prevented: true });
  }
  assert.deepEqual(fire(new FakeEl('button'), 'Z', { shiftKey: true }).calls, ['redo']);
  assert.deepEqual(fire(new FakeEl('button'), 'y').calls, ['redo']);
});

test('bỏ qua khi sự kiện đã bị chặn, đang gõ IME, hoặc phím khác', () => {
  assert.deepEqual(fire(new FakeEl('button'), 'z', { defaultPrevented: true }).calls, []);
  assert.deepEqual(fire(new FakeEl('button'), 'z', { isComposing: true }).calls, []);
  assert.deepEqual(fire(new FakeEl('button'), 'a').calls, []);
});
