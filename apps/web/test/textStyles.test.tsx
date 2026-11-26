// T-126 (D-73): thanh Kiểu ở đầu mục Chữ — chấm báo đã sửa, menu ⋯ (cập nhật có số chỗ dùng, xoá có xác nhận, đổi tên), Thư viện của tôi.
import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { TextPanel, type TextPanelProps } from '../src/components/TextPanel.tsx';
import { PAPER_SCENE } from '../src/lib/videoScenes.ts';
import { loadLibrary } from '../src/lib/textStyles.ts';
import type { TextRef, TextStyleSet } from '@dawviz/render-core';

const chord = () => PAPER_SCENE.widgets.find((w) => w.type === 'CHORD_DETECTION')!;
const STYLES: TextStyleSet = { ...PAPER_SCENE.textStyles!, mine: { ...PAPER_SCENE.textStyles!.heading, name: 'Của tôi' } };
const setup = (nameStyle: TextRef, over: Partial<TextPanelProps> = {}) => {
  const calls = { ref: [] as unknown[][], styles: [] as unknown[][], rename: [] as unknown[][], del: [] as string[] };
  const w = { ...chord(), properties: { ...(chord().properties as object), nameStyle } };
  render(<I18nProvider><TextPanel widget={w} styles={STYLES} advanced={false} onRef={(...a) => calls.ref.push(a)} onStyles={(...a) => calls.styles.push(a)} onProps={() => {}}
    onRenameStyle={(...a) => calls.rename.push(a)} onDeleteStyle={(id) => calls.del.push(id)} {...over} /></I18nProvider>);
  return calls;
};
const openMenu = () => { fireEvent.click(screen.getByTestId('text-style-menu')); return screen.getByTestId('text-style-menu-list'); };

beforeEach(() => localStorage.clear());

describe('Thanh Kiểu (T-126)', () => {
  it('có ở Cơ bản; chấm • chỉ hiện khi có ghi đè, chú thích nói số thuộc tính đã sửa', () => {
    setup({ styleId: 'heading' });
    expect(screen.getByTestId('text-style-bar')).toBeTruthy();
    expect(screen.queryByTestId('text-style-modified')).toBeNull();
  });
  it('chấm báo đã sửa', () => {
    setup({ styleId: 'heading', size: 50, italic: true });
    expect(screen.getByTestId('text-style-modified').getAttribute('title')).toMatch(/2/);
  });
  it('Cập nhật kiểu nói rõ số chỗ dùng trong dự án; không có ghi đè thì bị vô hiệu', () => {
    setup({ styleId: 'heading' }, { uses: { heading: 5 } });
    const upd = within(openMenu()).getByTestId('text-update-style');
    expect(upd.textContent).toMatch(/5/);
    expect(upd.getAttribute('aria-disabled')).toBe('true');
    expect(upd.getAttribute('title')).toBeTruthy(); // nói vì sao không bấm được
  });
  it('Cập nhật kiểu khi có ghi đè gửi bộ kiểu mới', () => {
    const c = setup({ styleId: 'heading', size: 50 }, { uses: { heading: 3 } });
    fireEvent.click(within(openMenu()).getByTestId('text-update-style'));
    const [set, field, ref, kind] = c.styles.at(-1) as [TextStyleSet, string, TextRef, string];
    expect([field, ref, kind, set.heading.size]).toEqual(['nameStyle', { styleId: 'heading' }, 'update', 50]);
    expect(screen.queryByTestId('text-style-menu-list')).toBeNull(); // menu đóng sau khi chọn
  });
  it('Xoá kiểu dựng sẵn bị vô hiệu', () => {
    const c = setup({ styleId: 'heading' });
    const del = within(openMenu()).getByTestId('text-delete-style');
    expect(del.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(del);
    expect(c.del).toEqual([]);
  });
  it('Xoá kiểu đang được dùng hỏi xác nhận; Huỷ thì không xoá, Xoá thì gọi onDeleteStyle', () => {
    const c = setup({ styleId: 'mine' }, { uses: { mine: 4 } });
    fireEvent.click(within(openMenu()).getByTestId('text-delete-style'));
    const dlg = screen.getByTestId('text-delete-confirm');
    expect(dlg.textContent).toMatch(/4/);
    fireEvent.click(screen.getByTestId('text-delete-confirm-cancel'));
    expect(c.del).toEqual([]);
    fireEvent.click(within(openMenu()).getByTestId('text-delete-style'));
    fireEvent.click(screen.getByTestId('text-delete-confirm-ok'));
    expect(c.del).toEqual(['mine']);
  });
  it('Xoá kiểu không ai dùng thì xoá ngay, không hỏi', () => {
    const c = setup({ styleId: 'mine' }, { uses: { mine: 0 } });
    fireEvent.click(within(openMenu()).getByTestId('text-delete-style'));
    expect(screen.queryByTestId('text-delete-confirm')).toBeNull();
    expect(c.del).toEqual(['mine']);
  });
  it('Đổi tên: ô tên điền sẵn tên cũ, Enter gửi tên mới', () => {
    const c = setup({ styleId: 'mine' });
    fireEvent.click(within(openMenu()).getByTestId('text-rename-style'));
    const input = screen.getByTestId('text-new-name') as HTMLInputElement;
    expect(input.value).toBe('Của tôi');
    fireEvent.change(input, { target: { value: 'Tên mới' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(c.rename).toEqual([['mine', 'Tên mới']]);
  });
  it('Esc đóng menu', () => {
    setup({ styleId: 'heading' });
    fireEvent.keyDown(openMenu(), { key: 'Escape' });
    expect(screen.queryByTestId('text-style-menu-list')).toBeNull();
  });
});

describe('Thư viện của tôi (T-126)', () => {
  it('Lưu vào thư viện → nhóm riêng trong ô chọn; chọn thì chép vào dự án (id mới, giữ tên) và áp cho chỗ chữ', () => {
    const c = setup({ styleId: 'mine', italic: true });
    fireEvent.click(within(openMenu()).getByTestId('text-save-library'));
    expect(loadLibrary().map((x) => [x.name, x.style.italic])).toEqual([['Của tôi', true]]);
    expect(screen.getByTestId('text-style-note').textContent).toMatch(/Của tôi/);
    const group = screen.getByTestId('text-library-group');
    const opt = within(group).getByRole('option', { name: 'Của tôi' }) as HTMLOptionElement;
    fireEvent.change(screen.getByTestId('text-styleId'), { target: { value: opt.value } });
    const [set, field, ref, kind] = c.styles.at(-1) as [TextStyleSet, string, TextRef, string];
    expect(kind).toBe('library'); expect(field).toBe('nameStyle');
    expect(ref.styleId).not.toBe('mine'); expect(STYLES[ref.styleId!]).toBeUndefined();
    expect(set[ref.styleId!].name).toBe('Của tôi'); expect(set[ref.styleId!].italic).toBe(true);
    expect(ref.italic).toBe(true); // ghi đè đang có vẫn giữ, như khi chọn kiểu khác
  });
  it('Xoá khỏi thư viện: chọn kiểu trong danh sách rồi xác nhận', () => {
    setup({ styleId: 'heading' });
    const remove = within(openMenu()).getByTestId('text-remove-library');
    expect(remove.getAttribute('aria-disabled')).toBe('true'); // thư viện rỗng
    fireEvent.click(within(screen.getByTestId('text-style-menu-list')).getByTestId('text-save-library'));
    expect(loadLibrary()).toHaveLength(1);
    const id = loadLibrary()[0].id;
    fireEvent.click(within(openMenu()).getByTestId('text-remove-library'));
    fireEvent.click(within(screen.getByTestId('text-style-menu-list')).getByTestId(`text-library-item-${id}`));
    fireEvent.click(screen.getByTestId('text-lib-remove-confirm-ok'));
    expect(loadLibrary()).toEqual([]);
    expect(screen.queryByTestId('text-library-group')).toBeNull();
  });
});
