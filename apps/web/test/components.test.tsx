// Kiểm thử thành phần bằng Vitest + Testing Library (chạy: npm run test:components -w @dawviz/web; cần đã `npm install`).
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { Transport } from '../src/components/Transport.tsx';
import { Notices } from '../src/components/Notices.tsx';
import { LanguageSelect } from '../src/components/LanguageSelect.tsx';
import { StylePanel } from '../src/components/StylePanel.tsx';
import { defaultStyleConfig, DEFAULT_KEYBOARD_STYLE, STYLE_PRESETS } from '@dawviz/render-core';

const wrap = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

describe('Transport', () => {
  it('bấm nút gọi onToggle; kéo thanh gọi onSeek', () => {
    let toggled = 0, sought = -1;
    wrap(<Transport t={1} duration={10} playing={false} onToggle={() => toggled++} onSeek={(t) => (sought = t)} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4.5' } });
    expect(toggled).toBe(1); expect(sought).toBe(4.5);
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
  it('thanh trượt và bộ dựng sẵn phát ra StyleConfig mới; bàn phím bật/tắt được', () => {
    let st = defaultStyleConfig(), kb = { ...DEFAULT_KEYBOARD_STYLE };
    wrap(<StylePanel style={st} keyboard={kb} onStyle={(n) => (st = n)} onKeyboard={(n) => (kb = n)} />);
    fireEvent.change(screen.getByRole('slider', { name: /^(Opacity|Độ đục(?! khi))/ }), { target: { value: '0.4' } });
    expect(st.base.opacity).toBe(0.4);
    fireEvent.click(screen.getByRole('button', { name: /Neon/ }));
    expect(st.base.glow).toBe(STYLE_PRESETS.neon.glow);
    fireEvent.click(screen.getByRole('checkbox', { name: /keyboard|bàn phím/i }));
    expect(kb.enabled).toBe(false);
  });
});

describe('NumberField trong StylePanel (REQ-UI-15)', () => {
  it('gõ phép tính rồi Enter áp giá trị; ngoài giới hạn cứng thì kẹp; ↑ bước theo step; Esc huỷ; sai cú pháp giữ giá trị cũ', () => {
    let st = defaultStyleConfig();
    const view = wrap(<StylePanel style={st} keyboard={{ ...DEFAULT_KEYBOARD_STYLE }} onStyle={(n) => (st = n)} onKeyboard={() => {}} />);
    const rerender = () => view.rerender(<I18nProvider><StylePanel style={st} keyboard={{ ...DEFAULT_KEYBOARD_STYLE }} onStyle={(n) => (st = n)} onKeyboard={() => {}} /></I18nProvider>);
    const box = () => screen.getByRole('textbox', { name: /^(Glow size|Cỡ quầng sáng)/i });
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
    wrap(<TrackPanel tracks={[tr as any]} config={cfg} overrides={{}} onChange={(_, p) => patches.push(p)} onStyle={() => {}} t={0.1} tempoMap={tempo} />);
    const box = screen.getByTestId('track-details-t1');
    expect(box.textContent).toMatch(/C3 – C5/);
    expect(box.textContent).toMatch(/-12 dB/);
    // -12 dB giữa sàn -24 và trần 0 → u = 0.5 → 0.25 + 0.75*0.5 = 62.5% → hiển thị 63%
    expect(screen.getByTestId('brightness-now-t1').textContent).toMatch(/63\s?%/);
    const floor = screen.getByRole('textbox', { name: /^(Floor|Sàn)/ });
    fireEvent.focus(floor); fireEvent.change(floor, { target: { value: '-30' } }); fireEvent.keyDown(floor, { key: 'Enter' });
    expect(patches.at(-1)).toEqual({ floorDb: -30 });
  });
  it('nguồn off thì ẩn các thanh ngưỡng', () => {
    wrap(<TrackPanel tracks={[tr as any]} config={{ t1: { ...DEFAULT_BRIGHTNESS, source: 'off' } }} overrides={{}} onChange={() => {}} onStyle={() => {}} />);
    expect(screen.queryByRole('textbox', { name: /^(Floor|Sàn)/ })).toBeNull();
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
  it('thanh trình bày: đổi kiểu, bỏ "tự động" rồi gõ số cột (tối đa = số track)', () => {
    let v: any = { mode: 'grid', columns: 'auto' };
    const r = wrap(<TrackLayoutBar value={v} onChange={(n) => (v = n)} count={15} />);
    fireEvent.click(screen.getByRole('checkbox')); expect(v.columns).toBe(3);
    r.rerender(<I18nProvider><TrackLayoutBar value={v} onChange={(n) => (v = n)} count={15} /></I18nProvider>);
    const box = screen.getByRole('textbox'); fireEvent.focus(box); fireEvent.change(box, { target: { value: '99' } }); fireEvent.keyDown(box, { key: 'Enter' });
    expect(v.columns).toBe(15);
    fireEvent.click(screen.getByRole('radio', { name: /List|Danh sách/ })); expect(v.mode).toBe('list');
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
