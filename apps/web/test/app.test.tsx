// T-07: kiểm thử cấp ứng dụng cho hoàn tác. Dựng App thật (Render Core, store, phím tắt), chỉ giả phần tải tệp (Worker) và phông.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('../src/lib/parseInWorker.ts', async () => {
  const { synthAst } = await import('../../../packages/render-core/test/helpers.ts');
  return { parseInWorker: vi.fn(async () => ({ ast: synthAst(), warnings: [], format: 'rpp', ms: 1, midi: undefined })) };
});
vi.mock('../src/lib/fonts.ts', () => ({ useFontsStatus: () => 'ready', loadBundledFont: async () => {} }));

import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { App } from '../src/App.tsx';
import { PRESET_LIMITS } from '@dawviz/render-core';

const ctrlZ = (el: Element | Window = document.body, extra: object = {}) => fireEvent.keyDown(el, { key: 'z', ctrlKey: true, ...extra });
const radios = () => [...screen.getByTestId('video-styles').querySelectorAll<HTMLElement>('[role="radio"]')];
const checked = () => radios().findIndex((r) => r.getAttribute('aria-checked') === 'true');
/** Ô số thay thanh trượt (D-57): đọc giá trị dạng số, đặt bằng gõ + Enter. */
/** Mục Hình thức chỉ còn ở Editor khi chọn Piano Roll (D-57): mở thẻ Editor và chọn Piano Roll nếu chưa thấy mục đó. */
function toLook() {
  const tab = screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ });
  if (tab.getAttribute('aria-selected') !== 'true') fireEvent.click(tab);
  if (screen.getByTestId('editor-props').querySelector('[data-testid="style-panel"]')) return;
  const open = screen.queryByTestId('editor-open-look');
  if (open) { fireEvent.click(open); return; }
  const btn = [...screen.getByTestId('layers').querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find((x) => /Piano roll/.test(x.textContent ?? '') && !x.getAttribute('aria-label'))!;
  fireEvent.click(btn);
}
const field = (re: RegExp) => { toLook(); return screen.getAllByRole('spinbutton', { name: re })[0] as HTMLInputElement; };
const val = (re: RegExp) => String(Number(field(re).getAttribute('aria-valuenow'))); // giá trị đã chốt (không phải chữ đang gõ)
const setVal = (re: RegExp, v: string) => { const el = field(re); fireEvent.focus(el); fireEvent.change(el, { target: { value: v } }); fireEvent.keyDown(el, { key: 'Enter' }); fireEvent.blur(el); };
const OPACITY = /^(Opacity|Độ đục(?! khi))/, RADIUS = /^(Corner radius|Bo góc)/, GLOW = /^(Glow|Phát sáng)$/;
const undoBtn = () => screen.getByTestId('undo-button') as HTMLButtonElement;
const redoBtn = () => screen.getByTestId('redo-button') as HTMLButtonElement;

async function openProject(name = 'song.rpp') {
  render(<I18nProvider><App /></I18nProvider>);
  await pick(name);
}
async function pick(name: string) {
  const input = screen.getAllByTestId('file-input')[0];
  await act(async () => { fireEvent.change(input, { target: { files: [new File(['x'], name)] } }); });
  await screen.findByTestId('video-styles');
  await waitFor(() => expect(screen.getByTestId('inspector')).toBeInTheDocument());
}

beforeEach(() => { localStorage.clear(); });

describe('hoàn tác trong ứng dụng (T-07)', () => {
  it('đổi phong cách video rồi Ctrl+Z trở về kiểu cũ; Ctrl+Shift+Z và Ctrl+Y làm lại', async () => {
    await openProject();
    expect(checked()).toBe(0);
    fireEvent.click(radios()[1]);
    expect(checked()).toBe(1);
    ctrlZ(radios()[1]); // focus vẫn ở nút radio vừa bấm
    expect(checked()).toBe(0);
    ctrlZ(document.body, { shiftKey: true, key: 'Z' });
    expect(checked()).toBe(1);
    ctrlZ(); expect(checked()).toBe(0);
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(checked()).toBe(1);
    fireEvent.keyDown(document.body, { key: 'z', metaKey: true }); expect(checked()).toBe(0); // Cmd+Z
  });

  it('chỉnh tay, chọn bộ "Neon" ở mục 02, rồi Ctrl+Z: các chỉnh tay trở lại đủ', async () => {
    await openProject();
    setVal(OPACITY, '0.4');
    setVal(RADIUS, '9');
    setVal(GLOW, '0.6');
    const hand = [val(OPACITY), val(RADIUS), val(GLOW)];
    expect(hand).toEqual(['0.4', '9', '0.6']);
    const select = screen.getByTestId('note-preset') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'neon' } });
    expect(select.value).toBe('neon');
    expect([val(OPACITY), val(RADIUS), val(GLOW)]).not.toEqual(hand);
    ctrlZ(select); // focus còn ở danh sách chọn: vẫn phải hoàn tác được
    expect([val(OPACITY), val(RADIUS), val(GLOW)]).toEqual(hand);
    expect(select.value).toBe('custom');
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(select.value).toBe('neon');
  });

  it('đổi phong cách khi đang chỉnh tay: có thông báo nhỏ kèm phím tắt, không chặn; hoàn tác trả lại chỉnh tay và thông báo biến mất', async () => {
    await openProject();
    expect(screen.queryByTestId('style-notice')).toBeNull();
    setVal(OPACITY, '0.3');
    fireEvent.click(radios()[1]);
    expect(screen.getByTestId('style-notice').textContent).toMatch(/Ctrl\+Z|⌘Z/);
    expect(screen.getByTestId('style-notice')).not.toHaveTextContent(/undefined|web\./);
    expect(screen.queryByRole('dialog')).toBeNull();
    ctrlZ();
    expect(screen.queryByTestId('style-notice')).toBeNull();
    expect(checked()).toBe(0); expect(val(OPACITY)).toBe('0.3');
    // đổi khi chưa chỉnh gì: không có thông báo
    ctrlZ(); fireEvent.click(radios()[1]);
    expect(screen.queryByTestId('style-notice')).toBeNull();
  });

  it('kéo trên ô số (pointerdown → nhiều lần di chuyển → pointerup) là MỘT bước hoàn tác', async () => {
    await openProject();
    const s = field(OPACITY), start = val(OPACITY);
    s.setPointerCapture = () => {};
    fireEvent.pointerDown(s, { button: 0, pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 200 });
    for (const y of [210, 230, 250, 270]) fireEvent.pointerMove(s, { pointerId: 1, clientX: 10, clientY: y });
    fireEvent.pointerUp(s, { pointerId: 1 });
    const after = val(OPACITY);
    expect(after).not.toBe(start);
    ctrlZ();
    expect(val(OPACITY)).toBe(start);
    // chỉ một bước: nút Hoàn tác đã tắt, làm lại trả đúng giá trị sau khi kéo
    expect(undoBtn()).toBeDisabled();
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true }); expect(val(OPACITY)).toBe(after);
  });

  it('Ctrl+Z không chạy khi đang gõ trong ô số (để trình duyệt hoàn tác chữ)', async () => {
    await openProject();
    setVal(OPACITY, '0.4');
    const box = field(OPACITY);
    box.focus();
    fireEvent.change(box, { target: { value: '0.2' } });
    const ev = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
    box.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(val(OPACITY)).toBe('0.4');
    // Enter chốt một giá trị: một bước; rời ô rồi Ctrl+Z hoàn tác bước đó
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(val(OPACITY)).toBe('0.2');
    box.blur(); ctrlZ();
    expect(val(OPACITY)).toBe('0.4');
  });

  it('nút Hoàn tác/Làm lại ở thanh trên: tên kèm phím tắt, bật/tắt theo lịch sử, bấm được', async () => {
    await openProject();
    expect(undoBtn()).toBeDisabled(); expect(redoBtn()).toBeDisabled();
    expect(undoBtn().getAttribute('aria-label')).toMatch(/^(Undo|Hoàn tác) \((Ctrl\+Z|⌘Z)\)$/);
    expect(redoBtn().getAttribute('aria-label')).toMatch(/^(Redo|Làm lại) \((Ctrl\+Shift\+Z|⇧⌘Z)\)$/);
    fireEvent.click(radios()[1]);
    expect(undoBtn()).toBeEnabled(); expect(undoBtn().title).toMatch(/(video style|phong cách video)/i);
    fireEvent.click(undoBtn());
    expect(checked()).toBe(0); expect(undoBtn()).toBeDisabled(); expect(redoBtn()).toBeEnabled();
    fireEvent.click(redoBtn()); expect(checked()).toBe(1);
    expect(screen.getByRole('button', { name: /^(Undo|Hoàn tác) \(/ }).closest('header')).not.toBeNull();
  });

  it('ẩn/hiện và solo track hoàn tác được', async () => {
    await openProject();
    const eye = () => screen.getAllByRole('button', { name: /^(Hide|Ẩn)/ })[0];
    const solo = () => screen.getAllByRole('button', { name: /^(Solo)/ })[0];
    expect(eye()).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(eye()); expect(eye()).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(solo()); expect(solo()).toHaveAttribute('aria-pressed', 'true');
    ctrlZ(); expect(solo()).toHaveAttribute('aria-pressed', 'false'); expect(eye()).toHaveAttribute('aria-pressed', 'true');
    ctrlZ(); expect(eye()).toHaveAttribute('aria-pressed', 'false');
  });

  it('nạp dự án mới xoá lịch sử hoàn tác; thiết lập đã lưu (kiểu nốt đã chỉnh) vẫn còn', async () => {
    await openProject();
    setVal(OPACITY, '0.35');
    fireEvent.click(radios()[1]); ctrlZ(); // có cả hoàn tác lẫn làm lại
    expect(undoBtn()).toBeEnabled(); expect(redoBtn()).toBeEnabled();
    await pick('other.rpp');
    expect(undoBtn()).toBeDisabled(); expect(redoBtn()).toBeDisabled();
    expect(val(OPACITY)).toBe('0.35');
    ctrlZ(); fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(val(OPACITY)).toBe('0.35');
  });

  it('mở lại ứng dụng: kiểu nốt đã lưu nạp vào store, lịch sử bắt đầu trống', async () => {
    const first = render(<I18nProvider><App /></I18nProvider>);
    await pick('song.rpp');
    setVal(OPACITY, '0.45');
    first.unmount();
    await openProject();
    expect(val(OPACITY)).toBe('0.45');
    expect(undoBtn()).toBeDisabled();
  });
});

describe('danh sách lịch sử (T-07 bước 2b)', () => {
  const toggle = () => screen.getByTestId('history-toggle');
  const items = () => screen.getAllByTestId('history-item');
  const eye = () => screen.getAllByRole('button', { name: /^(Hide|Ẩn)/ })[0];
  const solo = () => screen.getAllByRole('button', { name: /^Solo/ })[0];
  const pressed = (b: HTMLElement) => b.getAttribute('aria-pressed') === 'true';
  /** 6 bước: ẩn, solo, bỏ ẩn, bỏ solo, ẩn, đổi phong cách. */
  async function sixSteps() {
    await openProject();
    fireEvent.click(eye()); fireEvent.click(solo()); fireEvent.click(eye()); fireEvent.click(solo()); fireEvent.click(eye());
    fireEvent.click(radios()[1]);
  }

  it('lịch sử mới chỉ có mốc đầu: nút vẫn bấm được, danh sách chỉ hiện "Mở dự án" (bước hiện tại)', async () => {
    await openProject();
    expect(undoBtn()).toBeDisabled(); expect(toggle()).toBeEnabled();
    expect(toggle()).toHaveAttribute('aria-haspopup', 'menu'); expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle().getAttribute('aria-label')).toMatch(/^(Edit history|Lịch sử chỉnh sửa)$/); expect(toggle().getAttribute('title')).toBe(toggle().getAttribute('aria-label'));
    expect(toggle().textContent).toBe(''); // chỉ có biểu tượng
    fireEvent.click(toggle());
    expect(items()).toHaveLength(1);
    expect(items()[0].textContent).toMatch(/^(Open project|Mở dự án)/); expect(items()[0]).toHaveAttribute('aria-current', 'step');
    fireEvent.keyDown(screen.getByTestId('history-menu'), { key: 'Escape' });
    expect(document.activeElement).toBe(toggle());
  });

  it('nút lịch sử nằm bên phải cả cụm Hoàn tác / Làm lại; mở bằng nút: mới nhất ở trên, mốc đầu "Mở dự án" ở cuối, bước hiện tại có aria-current', async () => {
    await sixSteps();
    expect(redoBtn().compareDocumentPosition(toggle()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(undoBtn().compareDocumentPosition(redoBtn()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const li = items();
    expect(li).toHaveLength(7);
    expect(li[0].textContent).toMatch(/^(Video style|Phong cách video)/);
    expect(li[6].textContent).toMatch(/^(Open project|Mở dự án)/);
    expect(li.filter((e) => e.getAttribute('aria-current') === 'step')).toEqual([li[0]]);
    expect(li[0].className).toMatch(/bg-selection/); expect(li[0].className).not.toMatch(/bg-accent(?!\/)/);
    expect(li[0].querySelector('span[aria-hidden].bg-accent')).not.toBeNull(); // vạch nhỏ màu nhấn
    expect(li.slice(1).every((e) => e.getAttribute('aria-current') === null)).toBe(true);
  });

  it('bấm một bước: lùi liên tiếp tới đó, các bước sau hiện mờ; tới bước mới nhất thì làm lại hết', async () => {
    await sixSteps();
    expect(checked()).toBe(1);
    fireEvent.click(toggle()); fireEvent.click(items()[4]); // vị trí 2: sau "ẩn" và "solo"
    expect(checked()).toBe(0); expect(pressed(eye())).toBe(true); expect(pressed(solo())).toBe(true);
    fireEvent.click(toggle());
    const li = items();
    expect(li.filter((e) => e.getAttribute('aria-current') === 'step').map((e) => e.dataset.position)).toEqual(['2']);
    expect(li.filter((e) => /text-faint/.test(e.className)).map((e) => e.dataset.position)).toEqual(['6', '5', '4', '3']);
    fireEvent.click(li[0]); // bước mới nhất
    expect(checked()).toBe(1); expect(pressed(eye())).toBe(true); expect(pressed(solo())).toBe(false);
    fireEvent.click(toggle()); fireEvent.click(items()[6]); // mốc đầu
    expect(pressed(eye())).toBe(false); expect(pressed(solo())).toBe(false); expect(checked()).toBe(0);
    expect(undoBtn()).toBeDisabled();
  });

  it('thao tác mới sau khi lùi thì bỏ các bước làm lại (lịch sử một nhánh)', async () => {
    await sixSteps();
    fireEvent.click(toggle()); fireEvent.click(items()[3]); // vị trí 3
    expect(redoBtn()).toBeEnabled();
    fireEvent.click(solo());
    expect(redoBtn()).toBeDisabled();
    fireEvent.click(toggle());
    expect(items()).toHaveLength(5); // 3 bước cũ + bước mới + mốc đầu
    expect(items().some((e) => /text-faint/.test(e.className))).toBe(false);
  });

  it('bàn phím: ArrowDown mở; ↑/↓/Home/End đi trong danh sách; Enter nhảy tới bước; Esc đóng và trả focus; thông báo bước vừa tới', async () => {
    await sixSteps();
    toggle().focus();
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' });
    const li = () => items();
    expect(document.activeElement).toBe(li()[0]); // focus vào bước hiện tại
    const menu = screen.getByTestId('history-menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); expect(document.activeElement).toBe(li()[1]);
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); expect(document.activeElement).toBe(li()[2]);
    fireEvent.keyDown(menu, { key: 'ArrowUp' }); expect(document.activeElement).toBe(li()[1]);
    fireEvent.keyDown(menu, { key: 'End' }); expect(document.activeElement).toBe(li()[6]);
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); expect(document.activeElement).toBe(li()[0]); // vòng
    fireEvent.keyDown(menu, { key: 'ArrowUp' }); expect(document.activeElement).toBe(li()[6]);
    fireEvent.keyDown(menu, { key: 'Home' }); expect(document.activeElement).toBe(li()[0]);
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByTestId('history-menu')).toBeNull(); expect(document.activeElement).toBe(toggle()); expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    // Enter trên một dòng = bấm dòng đó (nút gốc): nhảy về vị trí 1 (sau "ẩn")
    fireEvent.keyDown(toggle(), { key: 'ArrowDown' });
    const target = li().find((e) => e.dataset.position === '1')!;
    target.focus(); fireEvent.click(target); // trình duyệt đổi Enter/Space thành click trên <button>
    expect(pressed(eye())).toBe(true); expect(pressed(solo())).toBe(false); expect(checked()).toBe(0);
    expect(screen.queryByTestId('history-menu')).toBeNull(); expect(document.activeElement).toBe(toggle());
    expect(screen.getByTestId('history-announce').textContent).toMatch(/^(Now at|Đã tới bước): (Hide|Ẩn) /);
  });

  it('Esc không làm gì khi danh sách đóng; bấm ra ngoài thì đóng; hoàn tác/làm lại cũng thông báo', async () => {
    await sixSteps();
    fireEvent.click(toggle()); expect(screen.getByTestId('history-menu')).toBeInTheDocument();
    fireEvent.pointerDown(document.body); expect(screen.queryByTestId('history-menu')).toBeNull();
    ctrlZ();
    expect(screen.getByTestId('history-announce').textContent).toMatch(/^(Undone|Đã hoàn tác): (Video style|Phong cách video)/);
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(screen.getByTestId('history-announce').textContent).toMatch(/^(Redone|Đã làm lại): /);
    fireEvent.click(redoBtn());
  });

  it('đổi ngôn ngữ thì nhãn trong danh sách đổi theo; nhãn có "trước → sau" cho giá trị số', async () => {
    await openProject();
    setVal(OPACITY, '0.7');
    fireEvent.click(toggle());
    const text = (e: HTMLElement) => e.querySelector('span.truncate')!.textContent;
    const first = () => text(items()[0]);
    const lang = screen.getAllByRole('combobox').find((c) => [...(c as HTMLSelectElement).options].some((o) => o.value === 'vi')) as HTMLSelectElement;
    fireEvent.change(lang, { target: { value: 'en' } });
    expect(first()).toBe('Opacity 1 → 0.70');
    fireEvent.change(lang, { target: { value: 'vi' } });
    expect(first()).toBe('Độ đục 1 → 0,70');
    expect(text(items().at(-1)!)).toBe('Mở dự án');
    fireEvent.change(lang, { target: { value: 'en' } });
    expect(text(items().at(-1)!)).toBe('Open project');
  });
});

describe('preset .json trong ứng dụng (T-07)', () => {
  const openSettings = async () => { fireEvent.click(screen.getByRole('tab', { name: /^(Settings|Cài đặt)/ })); await screen.findByTestId('preset-settings'); };
  const feed = async (text: string, size = text.length) => {
    const f = new File([text], 'p.json', { type: 'application/json' }); Object.defineProperty(f, 'size', { value: size });
    await act(async () => { fireEvent.change(screen.getByTestId('preset-input'), { target: { files: [f] } }); });
  };
  const valid = (extra: object = {}) => JSON.stringify({ schemaVersion: '0.4.0', presetName: 'Test X', canvas: { designWidth: 1280, designHeight: 720 }, widgets: [], ...extra });

  it('preset hợp lệ: nạp được, báo đã mở, hoàn tác được; lưu tạo tệp tải xuống', async () => {
    await openProject(); await openSettings();
    await feed(valid());
    await waitFor(() => expect(screen.getByTestId('preset-status').textContent).toMatch(/Test X/));
    expect(screen.queryByText(/WARN_|ERR_/)).toBeNull();
    expect(undoBtn()).toBeEnabled();
    ctrlZ();
    expect(screen.getByTestId('preset-status')).toBeInTheDocument();
    // lưu
    const created: Blob[] = [];
    (URL as any).createObjectURL = (b: Blob) => { created.push(b); return 'blob:x'; }; (URL as any).revokeObjectURL = () => {};
    const names: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
    fireEvent.click(screen.getByTestId('preset-save'));
    click.mockRestore();
    expect(created).toHaveLength(1); expect(names).toEqual(['paper.json']) // đã hoàn tác về Paper;
    const saved = JSON.parse(await created[0].text());
    expect(saved.schemaVersion).toBe('0.4.0'); expect(saved.widgets.length).toBeGreaterThan(0);
  });

  it('preset cũ 0.3.0: nạp và hiện cảnh báo đã nâng phiên bản', async () => {
    await openProject(); await openSettings();
    await feed(valid({ schemaVersion: '0.3.0' }));
    const box = await screen.findByTestId('preset-settings');
    await waitFor(() => expect(box.textContent).toMatch(/0\.3\.0/));
    expect(box.textContent).toMatch(/0\.4\.0/);
  });

  it('preset hỏng, quá lớn, mới hơn: hiện lỗi đã dịch, không đổi scene, không thêm bước hoàn tác', async () => {
    await openProject(); await openSettings();
    for (const [text, size, re] of [
      ['{ không phải json', undefined, /(damaged|hỏng)/i],
      [valid(), PRESET_LIMITS.maxBytes + 1, /(larger|lớn hơn)/i],
      [valid({ schemaVersion: '0.9.0' }), undefined, /(newer|mới hơn)/i],
    ] as [string, number | undefined, RegExp][]) {
      await feed(text, size);
      await waitFor(() => expect(screen.getByTestId('preset-settings').textContent).toMatch(re));
    }
    expect(undoBtn()).toBeDisabled();
  });

  it('preset độc hại: khoá __proto__ bị bỏ và có cảnh báo; không làm bẩn Object.prototype', async () => {
    await openProject(); await openSettings();
    await feed('{"schemaVersion":"0.4.0","__proto__":{"polluted":1},"canvas":{},"widgets":[]}');
    await waitFor(() => expect(screen.getByTestId('preset-settings').textContent).toMatch(/(not allowed|không được phép)/));
    expect(({} as any).polluted).toBeUndefined();
  });
});

describe('thẻ Editor (T-68)', () => {
  const layerBtn = (re: RegExp) => [...screen.getByTestId('layers').querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find((b) => re.test(b.textContent ?? '') && !b.getAttribute('aria-label'))!;
  it('chọn từ Lớp, gõ Y ra ngoài khung → cảnh báo + "Đưa vào khung"; một bước hoàn tác mỗi lần', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    expect(screen.getByTestId('editor-noselection')).toBeInTheDocument();
    fireEvent.click(layerBtn(/Piano roll/));
    const y = screen.getByRole('spinbutton', { name: /^(Y position|Vị trí Y)$/ }) as HTMLInputElement;
    fireEvent.focus(y); fireEvent.change(y, { target: { value: '5000' } }); fireEvent.keyDown(y, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('editor-outside')).toBeInTheDocument());
    expect(undoBtn().title).toMatch(/Move Piano roll to|Dời Piano roll tới/);
    fireEvent.click(screen.getByRole('button', { name: /Bring into frame|Đưa vào khung/ }));
    await waitFor(() => expect(screen.queryByTestId('editor-outside')).toBeNull());
    ctrlZ(); await waitFor(() => expect(screen.getByTestId('editor-outside')).toBeInTheDocument());
  });
  it('khoá ở Lớp: vẫn chọn được, ô số bị khoá, có nút Mở khoá; điểm neo chỉ hiện ở Nâng cao', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    fireEvent.click(screen.getByRole('button', { name: /^(Lock|Khoá) Piano roll$/ }));
    fireEvent.click(layerBtn(/Piano roll/));
    expect(screen.getByTestId('editor-locked')).toBeInTheDocument();
    expect((screen.getByRole('spinbutton', { name: /^(X position|Vị trí X)$/ }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByTestId('anchor-picker')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^(Unlock|Mở khoá)$/ }));
    expect((screen.getByRole('spinbutton', { name: /^(X position|Vị trí X)$/ }) as HTMLInputElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('radio', { name: /Advanced|Nâng cao/ }));
    expect(screen.getByTestId('anchor-picker')).toBeInTheDocument();
  });
  it('thứ tự lớp: nút lên/xuống một bậc, Ctrl+Shift+] lên trên cùng, Alt+↓ trên dòng Lớp, kéo thả dòng; mỗi lần một bước hoàn tác', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    const names = () => [...screen.getByTestId('layers').querySelectorAll('li')].map((li) => li.querySelector('button')!.textContent);
    const start = names();
    const last = start.at(-1)!;
    fireEvent.click(layerBtn(new RegExp(`^${last}$`)));
    expect(screen.getByTestId('layer-down')).toBeDisabled();
    fireEvent.click(screen.getByTestId('layer-up'));
    expect(names().at(-2)).toBe(last);
    fireEvent.keyDown(screen.getByTestId('editor'), { code: 'BracketRight', key: ']', ctrlKey: true, shiftKey: true });
    expect(names()[0]).toBe(last);
    expect(screen.getByTestId('layer-front')).toBeDisabled();
    fireEvent.keyDown(layerBtn(new RegExp(`^${last}$`)), { key: 'ArrowDown', altKey: true });
    expect(names()[1]).toBe(last);
    // Kéo dòng đầu thả vào dòng cuối. jsdom không có DragEvent nên không có clientY: coi như nửa trên → chèn TRƯỚC dòng cuối.
    const rows = () => [...screen.getByTestId('layers').querySelectorAll('li')];
    const top = names()[0], dt = { data: {} as Record<string, string>, types: ['text/x-dawviz-layer'], setData(k: string, v: string) { this.data[k] = v; }, getData(k: string) { return this.data[k]; }, effectAllowed: '', dropEffect: '' };
    fireEvent.dragStart(rows()[0], { dataTransfer: dt });
    const end = rows().at(-1)!;
    fireEvent.dragOver(end, { dataTransfer: dt });
    expect(screen.getByTestId('layer-drop')).toBeInTheDocument();
    fireEvent.drop(end, { dataTransfer: dt });
    expect(names().at(-2)).toBe(top);
    expect(screen.queryByTestId('layer-drop')).toBeNull();
    for (let i = 0; i < 4; i++) ctrlZ();
    expect(names()).toEqual(start);
  });
  it('Lớp: mỗi dòng có tay nắm 6 chấm; hàng đầu có mắt (hiện hết trước rồi ẩn hết, hoàn tác được) và khoá tổng', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    const rows = screen.getByTestId('layers').querySelectorAll('li');
    expect(screen.getAllByTestId('layer-grip').length).toBe(rows.length);
    const hidden = () => screen.getByTestId('layers').querySelectorAll('.line-through').length;
    fireEvent.click(screen.getByTestId('layers-all-visible'));
    expect(hidden()).toBe(rows.length);
    ctrlZ(); expect(hidden()).toBe(0);
    fireEvent.click(screen.getByTestId('layers-lock-all'));
    expect(screen.getByTestId('layers-lock-all')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(layerBtn(/Piano roll/));
    expect(screen.getByTestId('editor-locked')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('layers-lock-all'));
    expect(screen.queryByTestId('editor-locked')).toBeNull();
  });
  it('tên widget ở đầu bảng, mục 01 là "Vị trí và kích thước"; ↺ ở X/Y/W/H và Góc chỉ hiện khi đã đổi, đưa về bố cục của phong cách', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    fireEvent.click(layerBtn(/Piano roll/));
    expect(screen.getByTestId('editor-selected').textContent).toMatch(/Piano roll/);
    expect(screen.getByTestId('section-transform').textContent).toMatch(/Position and size|Vị trí và kích thước/);
    const props = screen.getByTestId('editor-props');
    const resets = () => [...props.querySelectorAll('[data-testid="section-transform"] [data-testid="reset"], [data-testid="section-rotation"] [data-testid="reset"]')];
    expect(resets().length).toBe(0);
    const wbox = screen.getByRole('spinbutton', { name: /^(Width|Chiều rộng)$/ });
    const w0 = wbox.getAttribute('aria-valuenow');
    fireEvent.focus(wbox); fireEvent.change(wbox, { target: { value: '300' } }); fireEvent.keyDown(wbox, { key: 'Enter' }); fireEvent.blur(wbox);
    const ang = screen.getByRole('spinbutton', { name: /^(Angle|Góc)$/ });
    fireEvent.focus(ang); fireEvent.change(ang, { target: { value: '30' } }); fireEvent.keyDown(ang, { key: 'Enter' }); fireEvent.blur(ang);
    expect(resets().length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: /(Width|Chiều rộng)/ }));
    expect(screen.getByRole('spinbutton', { name: /^(Width|Chiều rộng)$/ }).getAttribute('aria-valuenow')).toBe(w0);
    fireEvent.click(screen.getByRole('button', { name: /(Reset angle|Đưa góc về 0)/ }));
    expect(resets().length).toBe(0);
  });
  it('lớp đã khoá đứng yên trong danh sách: không có tay nắm, không kéo được, nút và phím đổi thứ tự không có tác dụng', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    const names = () => [...screen.getByTestId('layers').querySelectorAll('li')].map((li) => li.querySelector('button')!.textContent);
    const start = names(), last = start.at(-1)!;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^(Lock|Khoá) ${last}$`) }));
    const row = screen.getByTestId('layers').querySelector(`li[data-locked]`)!;
    expect(row.getAttribute('draggable')).toBe('false');
    expect(row.querySelector('[data-testid="layer-grip"]')).toBeNull();
    expect(screen.getAllByTestId('layer-grip').length).toBe(start.length - 1);
    fireEvent.click(layerBtn(new RegExp(`^${last}$`)));
    expect(screen.getByTestId('layer-up')).toBeDisabled();
    fireEvent.keyDown(screen.getByTestId('editor'), { code: 'BracketRight', key: ']', ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(layerBtn(new RegExp(`^${last}$`)), { key: 'ArrowUp', altKey: true });
    expect(names()).toEqual(start);
  });
  it('neo X/Y có nút ↺ riêng, chỉ hiện khi lệch tâm, đưa đúng trục đó về 50%', async () => {
    await openProject();
    fireEvent.click(screen.getByRole('radio', { name: /Advanced|Nâng cao/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    fireEvent.click(layerBtn(/Piano roll/));
    const ax = () => screen.getByRole('spinbutton', { name: /^(Anchor X|Neo X)$/ });
    const resetX = () => screen.queryByRole('button', { name: /(Anchor X|Neo X).*50%/ });
    expect(resetX()).toBeNull();
    fireEvent.focus(ax()); fireEvent.change(ax(), { target: { value: '100' } }); fireEvent.keyDown(ax(), { key: 'Enter' }); fireEvent.blur(ax());
    expect(ax().getAttribute('aria-valuenow')).toBe('100');
    fireEvent.click(resetX()!);
    expect(ax().getAttribute('aria-valuenow')).toBe('50');
    expect(resetX()).toBeNull();
  });
  it('Hình thức chỉ ở Editor (D-57): Preview không có; chưa chọn gì thì có lối tắt chọn Piano Roll; mục Hình thức đứng ngay sau Vị trí', async () => {
    await openProject();
    expect(screen.getByTestId('inspector').querySelector('[data-testid="style-panel"]')).toBeNull();
    expect(screen.getByTestId('inspector').querySelector('[data-testid="section-look"]')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Editor|Chỉnh sửa/ }));
    fireEvent.click(screen.getByTestId('editor-open-look'));
    const props = screen.getByTestId('editor-props');
    const ids = [...props.querySelectorAll('section')].map((x) => x.getAttribute('data-testid'));
    expect(ids.slice(0, 2)).toEqual(['section-transform', 'section-look']);
    setVal(OPACITY, '0.25');
    expect(val(OPACITY)).toBe('0.25');
    fireEvent.click(layerBtn(/Title|Tên bài/));
    expect(props.querySelector('[data-testid="style-panel"]')).toBeNull();
  });
});
