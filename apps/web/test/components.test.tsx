// Kiểm thử thành phần bằng Vitest + Testing Library (chạy: npm run test:components -w @dawviz/web; cần đã `npm install`).
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { Transport } from '../src/components/Transport.tsx';
import { Notices } from '../src/components/Notices.tsx';
import { LanguageSelect } from '../src/components/LanguageSelect.tsx';
import { AppearanceSettings, ThemeToggle, useTheme } from '../src/components/ThemeSelect.tsx';
import { VideoStyles } from '../src/components/VideoStyles.tsx';
import { NOTE_PRESETS } from '../src/lib/videoScenes.ts';
import { createPlayback } from '../src/lib/playback.ts';
import { NumberField } from '../src/components/NumberField.tsx';
import { StylePanel } from '../src/components/StylePanel.tsx';
import { defaultStyleConfig, DEFAULT_KEYBOARD_STYLE, STYLE_PRESETS } from '@dawviz/render-core';

const wrap = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);
/** Gõ giá trị vào ô số rồi Enter (ô số thay thanh trượt, D-57). */
const typeIn = (el: HTMLElement, v: string) => { fireEvent.focus(el); fireEvent.change(el, { target: { value: v } }); fireEvent.keyDown(el, { key: 'Enter' }); fireEvent.blur(el); };

describe('Transport', () => {
  it('bấm nút gọi onToggle; kéo thanh gọi onSeek', () => {
    const pb = createPlayback({ request: () => 1, cancel: () => {}, now: () => 0 }); pb.reset(10);
    wrap(<Transport playback={pb} duration={10} />);
    fireEvent.click(screen.getByRole('button', { name: /^(Play|Phát)$/ }));
    expect(pb.get().playing).toBe(true);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4.5' } });
    expect(pb.get().t).toBe(4.5);
    expect(screen.getByTestId('transport-time').textContent).toBe('0:04.500');
    fireEvent.click(screen.getByRole('button', { name: /Forward 5|Tới 5/ })); expect(pb.get().t).toBe(9.5);
    fireEvent.click(screen.getByRole('button', { name: /Back 5|Lùi 5/ })); expect(pb.get().t).toBe(4.5);
  });
});
describe('Notices', () => {
  it('hiện văn bản đã dịch và chi tiết kỹ thuật', () => {
    wrap(<Notices problems={[{ kind: 'warning', code: 'WARN_X', text: 'Cảnh báo X', technical: 'raw' }]} />);
    expect(screen.getByText('Cảnh báo X')).toBeInTheDocument();
    expect(screen.getByText(/WARN_X: raw/)).toBeInTheDocument();
  });
});
describe('LanguageSelect', () => {
  it('liệt kê en và vi, đổi ngôn ngữ cập nhật thuộc tính lang của <html>', () => {
    wrap(<LanguageSelect />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'vi' } });
    expect(document.documentElement.lang).toBe('vi');
  });
});

describe('StylePanel', () => {
  it('ô số phát ra StyleConfig mới; bàn phím bật/tắt được', () => {
    let st = defaultStyleConfig(), kb = { ...DEFAULT_KEYBOARD_STYLE };
    wrap(<StylePanel style={st} keyboard={kb} onStyle={(n) => (st = n)} onKeyboard={(n) => (kb = n)} />);
    typeIn(screen.getByRole('spinbutton', { name: /^(Opacity|Độ đục(?! khi))/ }), '0.4');
    expect(st.base.opacity).toBe(0.4);
    fireEvent.click(screen.getByRole('checkbox', { name: /keyboard|bàn phím/i }));
    expect(kb.enabled).toBe(false);
  });
  it('Cơ bản ẩn dòng nâng cao (REQ-UI-13); Nâng cao hiện, không có nhãn NC/ADV ở đâu (D-57)', () => {
    const props = { style: defaultStyleConfig(), keyboard: { ...DEFAULT_KEYBOARD_STYLE }, onStyle: () => {}, onKeyboard: () => {} };
    const v = wrap(<StylePanel {...props} advanced={false} />);
    expect(screen.queryByRole('spinbutton', { name: /^(Glow size|Cỡ quầng sáng)/i })).toBeNull();
    expect(screen.getByRole('spinbutton', { name: /^(Glow|Phát sáng)$/i })).toBeInTheDocument();
    v.unmount();
    wrap(<StylePanel {...props} advanced />);
    expect(screen.getByRole('spinbutton', { name: /^(Glow size|Cỡ quầng sáng)/i })).toBeInTheDocument();
    expect(screen.queryAllByTitle(/Advanced setting|Thiết lập nâng cao/).length).toBe(0);
  });
});
describe('StylePanel: vị trí vạch phát khoá khi bật bàn phím (T-71)', () => {
  it('bàn phím tắt: chỉnh được, gửi tỉ lệ 0..1; bàn phím bật: ô số bị khoá, có chú thích nối bằng aria-describedby', () => {
    let ratio = 0.3, visible = true;
    const props = { style: defaultStyleConfig(), onStyle: () => {}, onKeyboard: () => {}, playhead: { ratio, visible, onChange: (r: number) => (ratio = r), onVisible: (v: boolean) => (visible = v) } };
    const v = wrap(<StylePanel {...props} keyboard={{ ...DEFAULT_KEYBOARD_STYLE, enabled: false }} />);
    const slider = () => document.getElementById('st-playhead') as HTMLInputElement;
    expect(slider().disabled).toBe(false);
    expect(screen.queryByTestId('playhead-locked')).toBeNull();
    typeIn(slider(), '45');
    expect(ratio).toBe(0.45);
    fireEvent.click(screen.getByTestId('playhead-visible'));
    expect(visible).toBe(false);
    v.rerender(<I18nProvider><StylePanel {...props} keyboard={{ ...DEFAULT_KEYBOARD_STYLE, enabled: true }} /></I18nProvider>);
    const note = screen.getByTestId('playhead-locked');
    expect(slider().disabled).toBe(true);
    expect(slider().getAttribute('aria-describedby')).toContain(note.id);
  });
});

describe('VideoStyles', () => {
  it('cột chỉ chứa phong cách video (scene): Paper và Mặc định, không có kiểu nốt; "đã chỉnh" hiện ở mục đang chọn', () => {
    let picked = '';
    const v = wrap(<VideoStyles value="paper" edited={false} onPick={(id) => (picked = id)} />);
    expect(screen.getAllByRole('radio').length).toBe(2);
    expect(screen.queryByRole('radio', { name: /Neon|Flat|Outline/ })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Dark|Tối/ })); expect(picked).toBe('default');
    v.rerender(<I18nProvider><VideoStyles value="default" edited onPick={() => {}} /></I18nProvider>);
    expect(screen.getByRole('radio', { name: /Dark|Tối/ }).textContent).toMatch(/edited|đã chỉnh/);
  });
});

describe('StylePanel: kiểu nốt dựng sẵn thuộc mục Hình thức', () => {
  it('chọn Neon đổi NoteStyle; kiểu đã chỉnh tay hiện "Tuỳ chỉnh"', () => {
    let picked = '';
    const props = { style: defaultStyleConfig(), keyboard: { ...DEFAULT_KEYBOARD_STYLE }, onStyle: () => {}, onKeyboard: () => {}, notePresets: NOTE_PRESETS, onNotePreset: (id: string) => (picked = id) };
    const v = wrap(<StylePanel {...props} />);
    fireEvent.change(screen.getByTestId('note-preset'), { target: { value: 'neon' } }); expect(picked).toBe('neon');
    expect((screen.getByTestId('note-preset') as HTMLSelectElement).value).toBe('default');
    const st = { ...defaultStyleConfig(), base: { ...defaultStyleConfig().base, opacity: 0.123 } };
    v.rerender(<I18nProvider><StylePanel {...props} style={st} /></I18nProvider>);
    expect((screen.getByTestId('note-preset') as HTMLSelectElement).value).toBe('custom');
    expect(STYLE_PRESETS.neon).toBeTruthy();
  });
});

describe('VideoStyles: ảnh thu nhỏ (T-69)', () => {
  it('có ảnh thu nhỏ thì hiện trong từng mục, ảnh trang trí (alt rỗng) và không đổi tên truy cập; không có thì chỉ chữ', () => {
    const thumbs: Record<string, string> = { paper: 'data:image/png;base64,AAAA' };
    wrap(<VideoStyles value="paper" edited={false} onPick={() => {}} thumb={(id) => thumbs[id]} />);
    expect(screen.getByTestId('style-thumb-paper')).toHaveAttribute('src', thumbs.paper);
    expect(screen.getByTestId('style-thumb-paper')).toHaveAttribute('alt', '');
    expect(screen.queryByTestId('style-thumb-default')).toBeNull();
    expect(screen.getByRole('radio', { name: /^(Paper|Bản in)$/ })).toBeInTheDocument();
  });
});

describe('NumberField trong StylePanel (REQ-UI-15)', () => {
  it('gõ phép tính rồi Enter áp giá trị; ngoài giới hạn cứng thì kẹp; ↑ bước theo step; Esc huỷ; sai cú pháp giữ giá trị cũ', () => {
    let st = defaultStyleConfig();
    const view = wrap(<StylePanel style={st} keyboard={{ ...DEFAULT_KEYBOARD_STYLE }} onStyle={(n) => (st = n)} onKeyboard={() => {}} />);
    const rerender = () => view.rerender(<I18nProvider><StylePanel style={st} keyboard={{ ...DEFAULT_KEYBOARD_STYLE }} onStyle={(n) => (st = n)} onKeyboard={() => {}} /></I18nProvider>);
    const box = () => screen.getByRole('spinbutton', { name: /^(Glow size|Cỡ quầng sáng)/i });
    fireEvent.focus(box()); fireEvent.change(box(), { target: { value: '10*3' } }); fireEvent.keyDown(box(), { key: 'Enter' });
    expect(st.base.glowRadius).toBe(30); rerender();
    fireEvent.change(box(), { target: { value: '500' } }); fireEvent.keyDown(box(), { key: 'Enter' });
    expect(st.base.glowRadius).toBe(64); rerender();
    fireEvent.keyDown(box(), { key: 'ArrowDown', shiftKey: true });
    expect(st.base.glowRadius).toBe(54); rerender();
    fireEvent.change(box(), { target: { value: 'abc' } }); fireEvent.keyDown(box(), { key: 'Enter' });
    expect(box()).toHaveAttribute('aria-invalid', 'true'); expect(st.base.glowRadius).toBe(54);
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect((box() as HTMLInputElement).value).toBe('54');
  });
});

import { TrackPanel, TrackLayoutBar, effectiveColumns } from '../src/components/TrackPanel.tsx';
import { DEFAULT_BRIGHTNESS } from '@dawviz/render-core';
describe('TrackPanel: Track Info và ngưỡng độ sáng (T-03)', () => {
  const tr = { id: 't1', index: 0, name: 'Piano', color: '#4aa8f5', isMuted: true, isVisible: true, pitchRange: { min: 48, max: 72 },
    notes: [{ id: 'n', pitch: 60, startTick: 0, endTick: 960, startTimeSeconds: 0, endTimeSeconds: 0.5, velocity: 100 }],
    mix: { volumeDb: -12, pan: 0 } };
  const tempo = [{ tick: 0, timeSeconds: 0, bpm: 120 }];
  it('hiện tầm cao độ, fader, trạng thái tắt tiếng; độ sáng hiện tại theo ngưỡng; ô nhập đổi sàn dB', () => {
    let patches: any[] = [];
    const cfg = { t1: { ...DEFAULT_BRIGHTNESS, source: 'static' as const, floorDb: -24, ceilDb: 0 } };
    wrap(<TrackPanel tracks={[tr as any]} config={cfg} overrides={{}} onChange={(_, p) => patches.push(p)} onStyle={() => {}} t={0.1} tempoMap={tempo} advanced />);
    const box = screen.getByTestId('track-details-t1');
    expect(box.textContent).toMatch(/C3 – C5/);
    expect(box.textContent).toMatch(/-12 dB/);
    // -12 dB giữa sàn -24 và trần 0 → u = 0.5 → 0.25 + 0.75*0.5 = 62.5% → hiển thị 63%
    expect(screen.getByTestId('brightness-now-t1').textContent).toMatch(/63\s?%/);
    const floor = screen.getByRole('spinbutton', { name: /^(Floor|Sàn)/ });
    fireEvent.focus(floor); fireEvent.change(floor, { target: { value: '-30' } }); fireEvent.keyDown(floor, { key: 'Enter' });
    expect(patches.at(-1)).toEqual({ floorDb: -30 });
  });
  it('nguồn off thì ẩn các thanh ngưỡng', () => {
    wrap(<TrackPanel tracks={[tr as any]} config={{ t1: { ...DEFAULT_BRIGHTNESS, source: 'off' } }} overrides={{}} onChange={() => {}} onStyle={() => {}} advanced />);
    expect(screen.queryByRole('spinbutton', { name: /^(Floor|Sàn)/ })).toBeNull();
    expect(screen.queryByTestId('brightness-now-t1')).toBeNull(); // "đều nhau": không có số độ sáng
  });
});

import { MissingMidiPanel } from '../src/components/MissingMidiPanel.tsx';
describe('MissingMidiPanel (REQ-UI-08)', () => {
  it('liệt kê file thiếu, nạp thêm chỉ nhận .mid; chỉ còn tệp không dùng thì không có nút nạp', () => {
    let added: File[] = [];
    const v = wrap(<MissingMidiPanel info={{ referenced: ['Oboe MIDI 001.mid'], missing: ['Oboe MIDI 001.mid'], unused: [] }} level="error" busy={false} onAdd={(f) => (added = f)} />);
    expect(screen.getByTestId('missing-midi').textContent).toMatch(/Oboe MIDI 001\.mid/);
    fireEvent.change(screen.getByTestId('missing-midi-input'), { target: { files: [new File(['x'], 'a.mid'), new File(['x'], 'b.png')] } });
    expect(added.map((f) => f.name)).toEqual(['a.mid']);
    v.unmount();
    wrap(<MissingMidiPanel info={{ referenced: ['a.mid'], missing: [], unused: ['x.mid'] }} level="warning" busy={false} onAdd={() => {}} />);
    expect(screen.getByTestId('missing-midi-unused').textContent).toMatch(/x\.mid/);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Danh sách track: lưới N cột / danh sách gọn (REQ-UI-14 sửa)', () => {
  const mkTr = (i: number) => ({ id: `t${i}`, index: i, name: `Track ${i}`, color: '#4aa8f5', isMuted: false, isVisible: true, pitchRange: { min: 60, max: 72 }, notes: [] });
  const trs = [0, 1, 2, 3, 4].map(mkTr) as any[];
  const cfg = Object.fromEntries(trs.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS }]));
  it('effectiveColumns: theo người dùng chọn, không vượt số thẻ vừa bề rộng; tự động = vừa bề rộng nhưng không quá số track', () => {
    expect(effectiveColumns(3, 1000, 15)).toEqual({ cols: 3, limited: false });
    expect(effectiveColumns(8, 1000, 15)).toEqual({ cols: 4, limited: true });   // 1000 px chỉ vừa 4 thẻ 224 px
    expect(effectiveColumns(20, 6000, 30).cols).toBe(20);                        // không có trần cứng
    expect(effectiveColumns('auto', 1000, 2)).toEqual({ cols: 2, limited: false });
  });
  it('lưới đặt số cột theo lựa chọn; danh sách: dòng gọn, bấm/Enter mở phần chỉnh', () => {
    const v = wrap(<TrackPanel tracks={trs} config={cfg} overrides={{}} onChange={() => {}} onStyle={() => {}} layout={{ mode: 'grid', columns: 2 }} />);
    expect(screen.getByTestId('track-grid').getAttribute('data-cols')).toBe('2');
    v.unmount();
    wrap(<TrackPanel tracks={trs} config={cfg} overrides={{}} onChange={() => {}} onStyle={() => {}} layout={{ mode: 'list', columns: 'auto' }} />);
    expect(screen.getByTestId('track-list')).toBeInTheDocument();
    expect(screen.queryByTestId('track-details-t2')).toBeNull();
    const row = screen.getAllByRole('button', { expanded: false })[2];
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(screen.getByTestId('track-details-t2')).toBeInTheDocument();
  });
  it('danh sách >6 track: một trạng thái cho giới hạn 6 dòng; mở chi tiết thì "Thu gọn"; không có nút nào bấm mà không tác dụng', () => {
    const many = Array.from({ length: 10 }, (_, i) => mkTr(i)) as any[];
    const cfgM = Object.fromEntries(many.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS }]));
    wrap(<TrackPanel tracks={many} config={cfgM} overrides={{}} onChange={() => {}} onStyle={() => {}} layout={{ mode: 'list', columns: 'auto' }} />);
    const list = screen.getByTestId('track-list');
    const btn = () => screen.getByTestId('track-list-all');
    const capped = () => list.style.maxHeight !== '';
    const rowBtn = (i: number) => screen.getAllByRole('button').filter((b) => b.hasAttribute('data-track-focus'))[i];
    expect(capped()).toBe(true);
    expect(btn().textContent).toMatch(/10/);
    expect(btn().className).toMatch(/min-h-\[var\(--hit\)\]/);        // vùng bấm ≥ 24 px (DESIGN.md, 24-Pixel Hit Rule)
    // Hiện tất cả <-> Thu gọn
    fireEvent.click(btn()); expect(capped()).toBe(false); expect(btn().getAttribute('aria-expanded')).toBe('true'); expect(btn().textContent).not.toMatch(/10/);
    fireEvent.click(btn()); expect(capped()).toBe(true); expect(btn().getAttribute('aria-expanded')).toBe('false');
    // Mở chi tiết khi đang thu gọn -> "hiện tất cả", nút thành "Thu gọn"
    fireEvent.click(rowBtn(3));
    expect(screen.getByTestId('track-details-t3')).toBeInTheDocument();
    expect(capped()).toBe(false); expect(btn().getAttribute('aria-expanded')).toBe('true');
    const labelOpen = btn().textContent;
    // Đóng chi tiết bằng tay giữ nguyên trạng thái danh sách
    fireEvent.click(rowBtn(3));
    expect(capped()).toBe(false); expect(btn().textContent).toBe(labelOpen);
    // Mở lại rồi bấm "Thu gọn": về 6 dòng, đóng dòng đang mở, nút đổi chữ
    fireEvent.click(rowBtn(3));
    fireEvent.click(btn());
    expect(capped()).toBe(true);
    expect(btn().getAttribute('aria-expanded')).toBe('false'); expect(btn().textContent).not.toBe(labelOpen); expect(btn().textContent).toMatch(/10/);
    expect(rowBtn(3).getAttribute('aria-expanded')).toBe('false');
    // Nút luôn có tác dụng: mỗi lần bấm đổi trạng thái
    for (let i = 0; i < 3; i++) { const before = capped(); fireEvent.click(btn()); expect(capped()).toBe(!before); }
  });
  it('thanh trình bày: đổi kiểu, bỏ "tự động" rồi gõ số cột (tối đa = số track)', () => {
    let v: any = { mode: 'grid', columns: 'auto' };
    const r = wrap(<TrackLayoutBar value={v} onChange={(n) => (v = n)} count={15} />);
    fireEvent.click(screen.getByRole('checkbox')); expect(v.columns).toBe(3);
    r.rerender(<I18nProvider><TrackLayoutBar value={v} onChange={(n) => (v = n)} count={15} /></I18nProvider>);
    const box = screen.getByRole('spinbutton'); fireEvent.focus(box); fireEvent.change(box, { target: { value: '99' } }); fireEvent.keyDown(box, { key: 'Enter' });
    expect(v.columns).toBe(15);
    fireEvent.click(screen.getByRole('radio', { name: /List|Danh sách/ })); expect(v.mode).toBe('list');
  });
  it('dòng track: mắt và S bật/tắt (REQ-UI-12); tay nắm đổi thứ tự bằng Alt+↓ chỉ ở Nâng cao; không có khoá', () => {
    const calls: string[] = [];
    const base = { tracks: trs, config: cfg, overrides: {}, onChange: () => {}, onStyle: () => {}, layout: { mode: 'list' as const, columns: 'auto' as const },
      view: { hidden: new Set(['t1']), solo: new Set<string>() },
      onToggleHidden: (id: string) => calls.push(`hide:${id}`), onToggleSolo: (id: string) => calls.push(`solo:${id}`), onMove: (id: string, to: number) => calls.push(`move:${id}:${to}`) };
    const v = wrap(<TrackPanel {...base} />);
    expect(screen.getByRole('button', { name: /(Hide|Ẩn) Track 1/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /(Hide|Ẩn) Track 0/ }));
    fireEvent.click(screen.getByRole('button', { name: /Solo Track 2/ }));
    expect(screen.queryByRole('button', { name: /(Reorder|Đổi thứ tự)/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /lock|khoá/i })).toBeNull();
    v.unmount();
    wrap(<TrackPanel {...base} advanced />);
    fireEvent.keyDown(screen.getByRole('button', { name: /(Reorder|Đổi thứ tự) Track 3/ }), { key: 'ArrowDown', altKey: true });
    expect(calls).toEqual(['hide:t0', 'solo:t2', 'move:t3:4']);
  });
  it('hàng đầu: mắt hiện hết trước khi còn track ẩn, ẩn hết khi đã hiện hết; S bỏ mọi solo (mờ khi không có solo); chỉ biểu tượng + chú thích', () => {
    const calls: string[] = [];
    const base = { tracks: trs, config: cfg, overrides: {}, onChange: () => {}, onStyle: () => {}, layout: { mode: 'list' as const, columns: 'auto' as const },
      onToggleHidden: () => {}, onToggleSolo: () => {}, onToggleAllHidden: () => calls.push('all'), onClearSolo: () => calls.push('clear') };
    const v = wrap(<TrackPanel {...base} view={{ hidden: new Set(['t1']), solo: new Set<string>() }} />);
    const eye = screen.getByTestId('track-all-hidden');
    expect(eye).toHaveAttribute('aria-pressed', 'mixed');
    expect(eye.getAttribute('title')).toMatch(/Show all|Hiện tất cả/);
    expect(eye.textContent).toBe('');
    expect(screen.getByTestId('track-clear-solo')).toBeDisabled();
    fireEvent.click(eye);
    v.rerender(<I18nProvider><TrackPanel {...base} view={{ hidden: new Set<string>(), solo: new Set(['t2']) }} /></I18nProvider>);
    expect(screen.getByTestId('track-all-hidden').getAttribute('title')).toMatch(/Hide all|Ẩn tất cả/);
    fireEvent.click(screen.getByTestId('track-clear-solo'));
    expect(calls).toEqual(['all', 'clear']);
  });
  it('hàng đầu: cột số nốt hiện tổng số nốt; nút "Hiện tất cả N track" nằm ở hàng đầu khi có hơn 6 track', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ ...trs[0], id: `m${i}`, name: `M${i}`, notes: trs[0].notes.slice(0, i + 1) }));
    const total = many.reduce((n, t) => n + t.notes.length, 0);
    wrap(<TrackPanel tracks={many as any} config={{}} overrides={{}} onChange={() => {}} onStyle={() => {}} layout={{ mode: 'list', columns: 'auto' }}
      onToggleHidden={() => {}} onToggleSolo={() => {}} onToggleAllHidden={() => {}} onClearSolo={() => {}} />);
    const head = screen.getByTestId('track-head');
    expect(screen.getByTestId('track-total-notes').textContent).toMatch(new RegExp(`^${total}`));
    expect(head.contains(screen.getByTestId('track-list-all'))).toBe(true);
  });
});

describe('Ô số kéo được và nút ↺ (D-57)', () => {
  it('kéo lên tăng, kéo xuống giảm theo phạm vi mềm; nhấp không kéo thì vào chế độ gõ; chạm thì không kéo', () => {
    let v = 0.5;
    const r = wrap(<NumberField label="Độ đục" value={v} range={[0, 1]} spec={{ min: 0, max: 1, step: 0.05 }} onChange={(n) => (v = n)} />);
    const box = screen.getByRole('spinbutton', { name: 'Độ đục' });
    box.setPointerCapture = () => {};
    fireEvent.pointerDown(box, { button: 0, pointerId: 1, pointerType: 'mouse', clientX: 50, clientY: 100 });
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 50, clientY: 80 }); // lên 20 px = 2 bước
    expect(v).toBe(0.6);
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 50, clientY: 130 }); // xuống 30 px so với lúc bắt đầu
    expect(v).toBe(0.35);
    fireEvent.pointerUp(box, { pointerId: 1 });
    expect(document.activeElement).not.toBe(box);
    r.rerender(<I18nProvider><NumberField label="Độ đục" value={v} range={[0, 1]} spec={{ min: 0, max: 1, step: 0.05 }} onChange={(n) => (v = n)} /></I18nProvider>);
    fireEvent.pointerDown(box, { button: 0, pointerId: 2, pointerType: 'mouse', clientX: 50, clientY: 100 });
    fireEvent.pointerUp(box, { pointerId: 2 });
    expect(document.activeElement).toBe(box);
  });
  it('↺ chỉ hiện khi khác giá trị bộ dựng sẵn và đưa đúng về đó', () => {
    let st = defaultStyleConfig();
    const ref = { ...st.base };
    const props = () => ({ style: st, keyboard: { ...DEFAULT_KEYBOARD_STYLE }, onStyle: (n: any) => (st = n), onKeyboard: () => {}, reference: ref, advanced: true });
    const v = wrap(<StylePanel {...props()} />);
    expect(screen.queryByRole('button', { name: /(Reset|Đưa) (Opacity|Độ đục)/ })).toBeNull();
    typeIn(screen.getByRole('spinbutton', { name: /^(Opacity|Độ đục(?! khi))/ }), '0.3');
    v.rerender(<I18nProvider><StylePanel {...props()} /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: /(Reset|Đưa) (Opacity|Độ đục)/ }));
    expect(st.base.opacity).toBe(ref.opacity);
  });
});
describe('Phát sáng động (REQ-GRAPHICS-17)', () => {
  it('mặc định đều nhau; chọn "động khi chạm" hiện nguồn, chọn automation hiện lane', () => {
    let st = defaultStyleConfig();
    const props = () => ({ style: st, keyboard: { ...DEFAULT_KEYBOARD_STYLE }, onStyle: (n: any) => (st = n), onKeyboard: () => {}, lanes: ['volume'] });
    const v = wrap(<StylePanel {...props()} />);
    expect(st.base.glowMode).toBe('uniform');
    expect(screen.queryByRole('combobox', { name: /Driven by|Theo/ })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Dynamic|Động/ })); expect(st.base.glowMode).toBe('dynamic');
    v.rerender(<I18nProvider><StylePanel {...props()} /></I18nProvider>);
    fireEvent.change(screen.getByRole('combobox', { name: /Driven by|Theo/ }), { target: { value: 'automation' } });
    expect(st.base.glowSource).toBe('automation');
    v.rerender(<I18nProvider><StylePanel {...props()} /></I18nProvider>);
    expect(screen.getByRole('combobox', { name: /^Lane/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: /Driven by|Theo/ }), { target: { value: 'pan' } });
    v.rerender(<I18nProvider><StylePanel {...props()} /></I18nProvider>);
    fireEvent.change(screen.getByRole('combobox', { name: /Pan reading|Cách đọc pan/ }), { target: { value: 'spread' } });
    expect(st.base.glowPanMode).toBe('spread');
  });
});
function ThemeHarness() { const [p, set] = useTheme(); return <><ThemeToggle pref={p} onChange={set} /><AppearanceSettings pref={p} onChange={set} /></>; }
describe('Giao diện ứng dụng', () => {
  it('Settings đổi sáng/tối và bảng màu áp ngay lên <html> và lưu (REQ-UI-10); nút ở thanh trên đổi sáng/tối', () => {
    localStorage.clear();
    wrap(<ThemeHarness />);
    const root = document.documentElement;
    expect(root.dataset.theme).toBe('dark'); expect(root.dataset.palette).toBe('studio');
    fireEvent.click(screen.getByRole('radio', { name: /^(Light|Sáng)$/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Riso/ }));
    expect(root.dataset.theme).toBe('light'); expect(root.dataset.palette).toBe('riso');
    expect(JSON.parse(localStorage.getItem('dawviz.prefs.v1.theme') ?? '{}')).toEqual({ mode: 'light', palette: 'riso' });
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(root.dataset.theme).toBe('dark');
  });
});
describe('Notices', () => {
  it('cảnh báo gộp thành một dòng thu gọn; lỗi hiện riêng', () => {
    wrap(<Notices problems={[{ kind: 'warning', code: 'W1', text: 'A' }, { kind: 'warning', code: 'W2', text: 'B' }, { kind: 'error', code: 'E', text: 'Lỗi E' }]} />);
    expect(screen.getByTestId('notices-warnings').textContent).toMatch(/2/);
    expect(screen.getByTestId('notices-warnings')).not.toHaveAttribute('open');
    expect(screen.getByRole('alert').textContent).toMatch(/Lỗi E/);
  });
});
describe('NumberField', () => {
  it('giá trị không đọc được: báo bằng chữ qua aria-describedby, rời ô thì nói đã giữ giá trị cũ (WCAG 1.4.1)', () => {
    let v = 0.5;
    wrap(<NumberField label="Độ đục" value={v} spec={{ min: 0, max: 1, step: 0.05 }} onChange={(x) => (v = x)} />);
    const input = screen.getByRole('spinbutton', { name: 'Độ đục' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const msg = document.getElementById(input.getAttribute('aria-describedby')!)!;
    expect(msg.textContent).toMatch(/1920\/2/);
    fireEvent.blur(input);
    expect(v).toBe(0.5);
    expect((input as HTMLInputElement).value).toBe('0.50');
    expect(msg.textContent).toMatch(/(Kept the previous value|Đã giữ giá trị cũ)/);
    fireEvent.change(input, { target: { value: '0.7' } });
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});

import { FileDrop } from '../src/components/FileDrop.tsx';
import { isTypingTarget, spaceBelongsToTransport } from '../src/lib/a11y.ts';
import { bindTransportKeys } from '../src/lib/transportKeys.ts';
import { useEffect, useRef, useState } from 'react';
describe('Sau critique T-70', () => {
  it('nhóm radio: một điểm Tab, phím mũi tên chuyển và chọn (WAI-ARIA)', () => {
    let picked = 'paper';
    const v = wrap(<VideoStyles value={picked} edited={false} onPick={(id) => (picked = id)} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true'); // Paper là phong cách đầu và mặc định (D-51)
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(picked).toBe('default');
    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(picked).toBe('default');
    v.unmount();
  });
  it('thông báo nhỏ sau khi đổi phong cách làm mất chỉnh tay: không chặn, không có nút hoàn tác riêng (hoàn tác thật nằm ở thanh trên)', () => {
    wrap(<VideoStyles value="neon" edited={false} onPick={() => {}} notice="Style changed. Ctrl+Z to undo." />);
    expect(screen.getByTestId('style-notice')).toHaveTextContent('Ctrl+Z');
    expect(screen.queryByRole('button', { name: /Undo|Hoàn tác/ })).toBeNull();
  });
  it('màn đầu tiên hướng dẫn FL Studio xuất .mid (D-19), không dùng chữ mono', () => {
    wrap(<FileDrop onPick={() => {}} busy={false} />);
    expect(screen.getByTestId('file-drop').textContent).toMatch(/FL Studio/);
    expect(screen.getByTestId('file-drop').querySelector('.font-mono')).toBeNull();
  });
  it('phím tắt toàn cục không nuốt phím khi đang gõ hoặc ở điều khiển', () => {
    const input = document.createElement('input'), btn = document.createElement('button'), div = document.createElement('div');
    expect(isTypingTarget(input)).toBe(true); expect(isTypingTarget(btn)).toBe(true); expect(isTypingTarget(div)).toBe(false);
  });
});

describe('Space làm phím phát/dừng (critique P1)', () => {
  const trs = [0, 1].map((i) => ({ id: `t${i}`, index: i, name: `Track ${i}`, color: '#4aa8f5', isMuted: false, isVisible: true, pitchRange: { min: 60, max: 72 }, notes: [] })) as any[];
  const cfg = Object.fromEntries(trs.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS }]));
  let pb: ReturnType<typeof createPlayback>;
  /** `keyboardFocus`: giả lập kết quả `:focus-visible` (jsdom không có heuristic chuột/bàn phím của trình duyệt). */
  function Harness({ keyboardFocus }: { keyboardFocus: boolean }) {
    const [solo, setSolo] = useState<ReadonlySet<string>>(new Set());
    const playback = useRef(createPlayback({ request: () => 1, cancel: () => {}, now: () => 0 })).current;
    pb = playback;
    useEffect(() => { playback.reset(10); return bindTransportKeys(window, playback, () => keyboardFocus); }, [playback, keyboardFocus]);
    return <TrackPanel tracks={trs} config={cfg} overrides={{}} onChange={() => {}} onStyle={() => {}} layout={{ mode: 'list', columns: 'auto' }}
      view={{ hidden: new Set(), solo }} onToggleSolo={(id) => setSolo((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })} onToggleHidden={() => {}} />;
  }
  const soloBtn = () => screen.getByRole('button', { name: /Solo Track 0/ });
  /** Nhấn Space như trình duyệt: keydown → (nếu chưa chặn) keyup rồi click lên nút đang focus. */
  const pressSpace = (el: Element) => {
    const notPrevented = fireEvent.keyDown(el, { code: 'Space', key: ' ' });
    const upOk = fireEvent.keyUp(el, { code: 'Space', key: ' ' });
    if (notPrevented && upOk && el instanceof HTMLButtonElement) fireEvent.click(el);
    return notPrevented;
  };

  it('bấm CHUỘT vào S rồi Space: phát nhạc và GIỮ solo (không bấm lại nút)', () => {
    wrap(<Harness keyboardFocus={false} />);
    const b = soloBtn();
    fireEvent.mouseDown(b); b.focus(); fireEvent.click(b);          // chuột: bật solo
    expect(b).toHaveAttribute('aria-pressed', 'true');
    expect(pb.get().playing).toBe(false);
    expect(pressSpace(b)).toBe(false);                               // keydown bị chặn
    expect(pb.get().playing).toBe(true);
    expect(b).toHaveAttribute('aria-pressed', 'true');               // solo còn nguyên
    pressSpace(b);
    expect(pb.get().playing).toBe(false);
  });

  it('Tab tới S rồi Space: bấm nút như chuẩn (solo bật/tắt), không đụng thanh phát', () => {
    wrap(<Harness keyboardFocus />);
    const b = soloBtn(); b.focus();
    expect(b).toHaveAttribute('aria-pressed', 'false');
    expect(pressSpace(b)).toBe(true);                                // không chặn
    expect(b).toHaveAttribute('aria-pressed', 'true');
    pressSpace(b);
    expect(b).toHaveAttribute('aria-pressed', 'false');
    expect(pb.get().playing).toBe(false);
  });

  it('ô gõ chữ giữ nguyên Space; thân trang (không focus gì) thì phát/dừng; giữ phím không bật/tắt liên tục', () => {
    wrap(<><Harness keyboardFocus={false} /><NumberField label="Độ đục" value={0.5} spec={{ min: 0, max: 1, step: 0.05 }} onChange={() => {}} /></>);
    const box = screen.getByRole('spinbutton', { name: 'Độ đục' }); box.focus();
    expect(fireEvent.keyDown(box, { code: 'Space', key: ' ' })).toBe(true);
    expect(pb.get().playing).toBe(false);
    expect(fireEvent.keyDown(document.body, { code: 'Space', key: ' ' })).toBe(false);
    expect(pb.get().playing).toBe(true);
    fireEvent.keyDown(document.body, { code: 'Space', key: ' ', repeat: true });
    expect(pb.get().playing).toBe(true);
  });

  it('spaceBelongsToTransport: radio/thẻ/ô đánh dấu theo cùng luật với nút; select và ô gõ không bao giờ', () => {
    const mk = (html: string) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild as HTMLElement; };
    const radio = mk('<button role="radio" aria-checked="true"></button>'), tab = mk('<button role="tab"></button>');
    const check = mk('<input type="checkbox">'), sel = mk('<select></select>'), text = mk('<input type="text">'), range = mk('<input type="range">');
    for (const el of [radio, tab, check]) {
      expect(spaceBelongsToTransport(el, () => false)).toBe(true);   // focus bằng chuột
      expect(spaceBelongsToTransport(el, () => true)).toBe(false);   // focus bằng bàn phím
    }
    for (const el of [sel, text]) { expect(spaceBelongsToTransport(el, () => false)).toBe(false); expect(spaceBelongsToTransport(el, () => true)).toBe(false); }
    expect(spaceBelongsToTransport(range, () => true)).toBe(true);   // Space không làm gì trên thanh trượt
    expect(spaceBelongsToTransport(null)).toBe(true);
  });
});
