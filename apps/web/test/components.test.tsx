// Kiểm thử thành phần bằng Vitest + Testing Library (chạy: npm run test:components -w @dawviz/web; cần đã `npm install`).
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { Transport } from '../src/components/Transport.tsx';
import { Notices } from '../src/components/Notices.tsx';
import { LanguageSelect } from '../src/components/LanguageSelect.tsx';
import { AppearanceSettings, ThemeToggle, useTheme } from '../src/components/ThemeSelect.tsx';
import { AspectSwitch } from '../src/components/AspectSwitch.tsx';
import { VideoStyles } from '../src/components/VideoStyles.tsx';
import { NOTE_PRESETS, PAPER_SCENE } from '../src/lib/videoScenes.ts';
import { createPlayback } from '../src/lib/playback.ts';
import { NumberField } from '../src/components/NumberField.tsx';
import { StylePanel } from '../src/components/StylePanel.tsx';
import { TextPanel } from '../src/components/TextPanel.tsx';
import { ExportDialog } from '../src/components/ExportDialog.tsx';
import { DeviceLatency } from '../src/components/DeviceLatency.tsx';
import { BackgroundSection } from '../src/components/BackgroundSection.tsx';
import { summarize, addProfile, DEFAULT_DEVICE_PREFS, serializeProfile, type DevicePrefs } from '../src/lib/latencyCalibration.ts';
import type { Calibration, CalStatus } from '../src/lib/calibrationRunner.ts';
import { synthAst } from '../../../packages/render-core/test/helpers.ts';
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
    expect((screen.getByTestId('transport-time') as HTMLInputElement).value).toBe('0:04.500');
    fireEvent.click(screen.getByRole('button', { name: /Forward 5|Tới 5/ })); expect(pb.get().t).toBe(9.5);
    fireEvent.click(screen.getByRole('button', { name: /Back 5|Lùi 5/ })); expect(pb.get().t).toBe(4.5);
  });
  it('gõ thời gian vào ô thời gian rồi Enter thì tua tới đó; sai hoặc quá độ dài bài thì báo và giữ chỗ cũ; Esc huỷ', () => {
    const pb = createPlayback({ request: () => 1, cancel: () => {}, now: () => 0 }); pb.reset(100);
    wrap(<Transport playback={pb} duration={100} />);
    const box = screen.getByTestId('transport-time') as HTMLInputElement;
    fireEvent.focus(box); fireEvent.change(box, { target: { value: '1:05.25' } }); fireEvent.keyDown(box, { key: 'Enter' });
    expect(pb.get().t).toBe(65.25);
    fireEvent.focus(box); fireEvent.change(box, { target: { value: '9:99:99' } }); fireEvent.keyDown(box, { key: 'Enter' });
    expect(pb.get().t).toBe(65.25); expect(box).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(box, { target: { value: '500' } }); fireEvent.keyDown(box, { key: 'Enter' });
    expect(pb.get().t).toBe(65.25);
    fireEvent.change(box, { target: { value: '12' } }); fireEvent.keyDown(box, { key: 'Escape' });
    expect(pb.get().t).toBe(65.25); expect(box.value).toBe('1:05.250');
    fireEvent.focus(box); fireEvent.change(box, { target: { value: '7' } }); fireEvent.blur(box);
    expect(pb.get().t).toBe(7);
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
describe('StylePanel: ô vạch phát ẩn khi bật bàn phím (T-71)', () => {
  it('bàn phím tắt: chỉnh được, gửi tỉ lệ 0..1; bàn phím bật: cả ô Hiện vạch phát và Vị trí vạch phát đều ẩn', () => {
    let ratio = 0.3, visible = true;
    const props = { style: defaultStyleConfig(), onStyle: () => {}, onKeyboard: () => {}, playhead: { ratio, visible, scrollMode: 'SCROLL' as const, onScrollMode: () => {}, visibleSeconds: 4, onVisibleSeconds: () => {}, onChange: (r: number) => (ratio = r), onVisible: (v: boolean) => (visible = v) } };
    const v = wrap(<StylePanel {...props} keyboard={{ ...DEFAULT_KEYBOARD_STYLE, enabled: false }} />);
    const slider = () => document.getElementById('st-playhead') as HTMLInputElement | null;
    expect(slider()!.disabled).toBe(false);
    typeIn(slider()!, '45');
    expect(ratio).toBe(0.45);
    fireEvent.click(screen.getByTestId('playhead-visible'));
    expect(visible).toBe(false);
    v.rerender(<I18nProvider><StylePanel {...props} keyboard={{ ...DEFAULT_KEYBOARD_STYLE, enabled: true }} /></I18nProvider>);
    expect(slider()).toBeNull();
    expect(screen.queryByTestId('playhead-visible')).toBeNull();
    expect(screen.queryByTestId('playhead-locked')).toBeNull();
  });
});

describe('StylePanel: cách nốt chạy Cuộn/Trang', () => {
  it('chọn Trang gửi PAGE; chế độ Trang: ô vị trí vạch phát ẩn, ô Hiện vạch phát còn kể cả khi bật bàn phím; ô thời gian đổi nhãn thành độ dài trang', () => {
    let mode: 'SCROLL' | 'PAGE' = 'SCROLL', secs = 4;
    const base = { ratio: 0.3, visible: true, onScrollMode: (m: 'SCROLL' | 'PAGE') => (mode = m), visibleSeconds: 4, onVisibleSeconds: (n: number) => (secs = n), onChange: () => {}, onVisible: () => {} };
    const props = { style: defaultStyleConfig(), onStyle: () => {}, onKeyboard: () => {}, keyboard: { ...DEFAULT_KEYBOARD_STYLE, enabled: true } };
    const v = wrap(<StylePanel {...props} playhead={{ ...base, scrollMode: 'SCROLL' }} />);
    expect(screen.queryByTestId('playhead-visible')).toBeNull(); // cuộn + bàn phím: vạch ghim ở mép phím
    fireEvent.click(screen.getByTestId('scroll-PAGE')); expect(mode).toBe('PAGE');
    v.rerender(<I18nProvider><StylePanel {...props} playhead={{ ...base, scrollMode: 'PAGE' }} /></I18nProvider>);
    expect(screen.getByTestId('playhead-visible')).toBeInTheDocument();
    expect(document.getElementById('st-playhead')).toBeNull();
    typeIn(document.getElementById('st-visible') as HTMLInputElement, '2.5'); expect(secs).toBe(2.5);
    expect(screen.getByTestId('field-st-visible').textContent).toMatch(/Page length|Độ dài trang/);
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

describe('VideoStyles: bộ preset (T-111, D-66)', () => {
  const base = { items: [{ id: 'u1', name: 'Mở đầu' }, { id: 'u2', name: 'Điệp khúc' }], dirty: [], onPick: () => {}, onAddFile: () => {}, onDownload: () => {}, onDuplicate: () => {}, onRevert: () => {}, onDelete: () => {}, problems: [] };
  it('xuất bộ: chọn preset, bắt buộc tên và tác giả; trả đúng các id đã chọn', async () => {
    const calls: { ids: string[]; name: string }[] = [];
    wrap(<VideoStyles value="paper" edited={false} onPick={() => {}} presets={{ ...base, onExportCollection: async (info, ids) => { calls.push({ ids, name: info.name }); } }} />);
    fireEvent.click(screen.getByTestId('collection-open'));
    fireEvent.click(screen.getByTestId('collection-pick-u2')); // bỏ chọn Điệp khúc
    fireEvent.change(screen.getByTestId('collection-name'), { target: { value: 'Bộ của tôi' } });
    fireEvent.change(screen.getByTestId('collection-author'), { target: { value: 'An' } });
    fireEvent.submit(screen.getByTestId('collection-form'));
    await waitFor(() => expect(calls).toEqual([{ ids: ['u1'], name: 'Bộ của tôi' }]));
  });
  it('xuất bộ: không chọn preset nào thì báo, không gọi onExport', () => {
    let n = 0;
    wrap(<VideoStyles value="paper" edited={false} onPick={() => {}} presets={{ ...base, onExportCollection: async () => { n++; } }} />);
    fireEvent.click(screen.getByTestId('collection-open'));
    fireEvent.click(screen.getByTestId('collection-pick-u1')); fireEvent.click(screen.getByTestId('collection-pick-u2'));
    fireEvent.submit(screen.getByTestId('collection-form'));
    expect(screen.getByTestId('collection-error')).toBeTruthy(); expect(n).toBe(0);
  });
  it('tên trùng: mặc định là đổi tên (không ghi đè thầm lặng); chọn ghi đè rồi nhập thì trả đúng lựa chọn; huỷ gọi onCancel', () => {
    const got: Record<string, string>[] = []; let cancelled = 0;
    wrap(<VideoStyles value="paper" edited={false} onPick={() => {}} presets={{ ...base, pendingCollection: { conflicts: ['Mở đầu', 'Điệp khúc'] }, onResolveCollection: (c) => got.push(c), onCancelCollection: () => cancelled++ }} />);
    fireEvent.click(screen.getByTestId('collection-apply'));
    expect(got[0]).toEqual({ 'Mở đầu': 'rename', 'Điệp khúc': 'rename' });
    fireEvent.click(screen.getByTestId('conflict-overwrite-1')); fireEvent.click(screen.getByTestId('collection-apply'));
    expect(got[1]).toEqual({ 'Mở đầu': 'rename', 'Điệp khúc': 'overwrite' });
    fireEvent.click(screen.getByTestId('collection-cancel')); expect(cancelled).toBe(1);
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
  it('dòng track: mắt và S bật/tắt (REQ-UI-12); tay nắm đổi thứ tự bằng Alt+↓ ở cả Cơ bản lẫn Nâng cao; không có khoá', () => {
    const calls: string[] = [];
    const base = { tracks: trs, config: cfg, overrides: {}, onChange: () => {}, onStyle: () => {}, layout: { mode: 'list' as const, columns: 'auto' as const },
      view: { hidden: new Set(['t1']), solo: new Set<string>() },
      onToggleHidden: (id: string) => calls.push(`hide:${id}`), onToggleSolo: (id: string) => calls.push(`solo:${id}`), onMove: (id: string, to: number) => calls.push(`move:${id}:${to}`) };
    wrap(<TrackPanel {...base} />);
    expect(screen.getByRole('button', { name: /(Hide|Ẩn) Track 1/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /(Hide|Ẩn) Track 0/ }));
    fireEvent.click(screen.getByRole('button', { name: /Solo Track 2/ }));
    expect(screen.queryByRole('button', { name: /lock|khoá/i })).toBeNull();
    fireEvent.keyDown(screen.getByRole('button', { name: /(Reorder|Đổi thứ tự) Track 3/ }), { key: 'ArrowDown', altKey: true });
    expect(calls).toEqual(['hide:t0', 'solo:t2', 'move:t3:4']);
  });
  it('kéo qua các mắt: đặt cùng một giá trị cho mọi track đi qua, một cử chỉ; bấm chuột không đảo hai lần', () => {
    const calls: string[] = [], g: string[] = [];
    const base = { tracks: trs, config: cfg, overrides: {}, onChange: () => {}, onStyle: () => {}, layout: { mode: 'list' as const, columns: 'auto' as const },
      view: { hidden: new Set<string>(), solo: new Set<string>() }, onToggleHidden: (id: string) => calls.push(`toggle:${id}`), onToggleSolo: () => {},
      onPaint: (k: string, id: string, on: boolean) => calls.push(`${k}:${id}:${on}`), gesture: { begin: () => g.push('b'), end: () => g.push('e') } };
    wrap(<TrackPanel {...base} />);
    const eye = (n: number) => screen.getByRole('button', { name: new RegExp(`(Hide|Ẩn) Track ${n}`) });
    fireEvent.pointerDown(eye(0), { button: 0, isPrimary: true, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(window);
    fireEvent.click(eye(0), { detail: 1 }); // chuột: pointerdown đã xử lý
    expect(calls).toEqual(['hide:t0:true']);
    expect(g).toEqual(['b', 'e']);
    fireEvent.click(eye(1), { detail: 0 }); // bàn phím
    expect(calls).toEqual(['hide:t0:true', 'toggle:t1']);
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
  it('màn đầu tiên nói rõ FL Studio thả thẳng .flp (D-62), không dùng chữ mono', () => {
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
    const box = screen.getByRole('spinbutton', { name: 'Độ đục' }); act(() => box.focus());
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

describe('TextPanel (T-72)', () => {
  const chord = () => PAPER_SCENE.widgets.find((w) => w.type === 'CHORD_DETECTION')!;
  it('Cơ bản: đổi cỡ thành ghi đè; ↺ bỏ ghi đè; chọn dòng chữ khác; căn lề là thuộc tính widget', () => {
    const calls: [string, unknown, string][] = []; const props: Record<string, unknown>[] = [];
    let w = chord();
    const ui = (adv = false) => <TextPanel widget={w} styles={PAPER_SCENE.textStyles!} advanced={adv} onRef={(f, r, p) => calls.push([f, r, p])} onStyles={() => {}} onProps={(p) => props.push(p)} />;
    const v = wrap(ui());
    typeIn(screen.getByRole('spinbutton', { name: /^(Size|Cỡ)$/ }), '48');
    expect(calls.at(-1)).toEqual(['nameStyle', { styleId: 'heading', size: 48 }, 'size']);
    expect(screen.queryByTestId('text-style-actions')).toBeNull(); // Cơ bản: không có phần nâng cao
    w = { ...w, properties: { ...(w.properties as object), nameStyle: { styleId: 'heading', size: 48 } } };
    v.rerender(<I18nProvider>{ui()}</I18nProvider>);
    fireEvent.click(screen.getByTestId('text-size').querySelector('[data-testid="reset"]')!);
    expect(calls.at(-1)).toEqual(['nameStyle', { styleId: 'heading' }, 'size']);
    fireEvent.click(screen.getByRole('radio', { name: /^(Left|Trái)$/ }));
    expect(props.at(-1)).toEqual({ align: 'left' });
    fireEvent.change(screen.getByTestId('text-slot'), { target: { value: 'bassStyle' } });
    expect(screen.queryByTestId('text-styleId')).toBeNull(); // đoạn: không chọn kiểu riêng, theo dòng
    typeIn(screen.getByRole('spinbutton', { name: /^(Size|Cỡ)$/ }), '20');
    expect(calls.at(-1)).toEqual(['bassStyle', { size: 20 }, 'size']);
  });
  it('Nâng cao: bật đổ bóng, Lưu thành kiểu mới gửi bộ kiểu có kiểu mới', () => {
    const calls: unknown[][] = []; const saves: unknown[][] = [];
    const w = { ...chord(), properties: { ...(chord().properties as object), nameStyle: { styleId: 'heading', italic: true } } };
    wrap(<TextPanel widget={w} styles={PAPER_SCENE.textStyles!} advanced onRef={(...a) => calls.push(a)} onStyles={(...a) => saves.push(a)} onProps={() => {}} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /^(Drop shadow|Đổ bóng)$/ }));
    expect(calls.at(-1)).toEqual(['nameStyle', { styleId: 'heading', italic: true, shadow: { enabled: true } }, 'shadow.enabled']);
    fireEvent.click(screen.getByTestId('text-save-style'));
    fireEvent.change(screen.getByTestId('text-new-name'), { target: { value: 'Hợp âm nghiêng' } });
    fireEvent.keyDown(screen.getByTestId('text-new-name'), { key: 'Enter' });
    const [set, field, ref, kind] = saves.at(-1) as [Record<string, { italic: boolean; name: string }>, string, unknown, string];
    expect([field, ref, kind, set['hop-am-nghieng'].italic, set['hop-am-nghieng'].name]).toEqual(['nameStyle', { styleId: 'hop-am-nghieng' }, 'save', true, 'Hợp âm nghiêng']);
  });
});

describe('ExportDialog (T-09)', () => {
  const ast = synthAst();
  const derived = { index: {}, brightness: {} } as never;
  /** Mở hộp thoại rồi chờ các dò khả năng bất đồng bộ (VP9 alpha, bộ mã hoá, khoá xuất) cập nhật xong, để không có cập nhật nào nằm ngoài act. */
  const open = async () => { const r = wrap(<ExportDialog scene={PAPER_SCENE} ast={ast} derived={derived} audio={null} offsetMs={0} projectSec={30} fileName="Song.rpp" onClose={() => {}} />); await act(async () => { await new Promise((res) => setTimeout(res, 0)); }); return r; };

  it('hiện kích thước thực, số khung và dung lượng; đổi cỡ/FPS cập nhật ngay', async () => {
    await open();
    const sum = () => screen.getByTestId('export-summary').textContent ?? '';
    expect(sum()).toMatch(/1080.1080.*30 fps.*0:32.*960/); // (30 + 2) s × 30 fps
    fireEvent.change(screen.getByLabelText(/Size|Kích thước/), { target: { value: '720' } });
    fireEvent.change(screen.getByLabelText(/Frame rate|Số khung/), { target: { value: '60' } });
    expect(sum()).toMatch(/720.720.*60 fps.*1[.,]920/);
  });

  it('T-55: chuỗi PNG trong suốt — ẩn chất lượng/codec, hiện số ảnh và dung lượng ước tính; không cần bộ mã hoá video', async () => {
    await open();
    fireEvent.click(screen.getByTestId('export-kind-png'));
    expect(screen.queryByLabelText(/Quality|Chất lượng/)).toBeNull();
    expect(screen.getByTestId('export-png-summary').textContent).toMatch(/960/); // (30 + 2) s × 30 fps ảnh
    expect(screen.getByTestId('export-png-wav')).toBeDisabled(); // chưa có âm thanh
    expect(screen.getByTestId('export-start')).not.toBeDisabled(); // jsdom không có WebCodecs vẫn xuất PNG được
    expect(await screen.findByTestId('export-vp9-alpha')).toHaveTextContent(/cannot|không/);
  });

  it('trình duyệt không có WebCodecs: báo ERR_NO_SUPPORTED_ENCODER và khoá nút Bắt đầu', async () => {
    await open();
    expect(await screen.findByRole('alert')).toHaveTextContent(/can't encode video|không mã hoá được video/);
    expect(screen.getByTestId('export-start')).toBeDisabled();
  });

  it('Nâng cao: ba ô phụ thuộc nhau (định dạng → codec video → codec âm thanh), chỉ liệt kê codec hợp lệ và máy hỗ trợ; Cơ bản không có ba ô', async () => {
    const g = globalThis as Record<string, unknown>, old = [g.VideoEncoder, g.AudioEncoder];
    g.VideoEncoder = { isConfigSupported: async (c: { codec: string }) => ({ supported: c.codec.startsWith('avc1') || c.codec.startsWith('vp0') }) };
    g.AudioEncoder = { isConfigSupported: async (c: { codec: string }) => ({ supported: c.codec === 'opus' }) };
    try {
      const mk = (advanced: boolean) => wrap(<ExportDialog scene={PAPER_SCENE} ast={ast} derived={derived} audio={null} offsetMs={0} projectSec={30} fileName="Song.rpp" advanced={advanced} onClose={() => {}} />);
      const basic = mk(false);
      expect(await screen.findByText(/MP4 · H\.264/)).toBeInTheDocument();
      expect(screen.queryByTestId('export-format-pickers')).toBeNull();
      basic.unmount();
      mk(true);
      const pickers = await screen.findByTestId('export-format-pickers');
      const opts = (el: HTMLElement) => [...el.querySelectorAll('option')].map((o) => o.textContent);
      const container = screen.getByLabelText(/File format|Định dạng tệp/), video = screen.getByLabelText(/Video codec|Codec video/);
      expect(opts(container)).toEqual(['MP4', 'WebM', 'MOV', 'MKV']);
      expect(opts(video)).toEqual(['H.264', 'VP9']);
      fireEvent.change(container, { target: { value: 'webm' } });
      expect(opts(screen.getByLabelText(/Video codec|Codec video/))).toEqual(['VP9']);
      expect(screen.getByLabelText(/Audio codec|Codec âm thanh/)).toBeDisabled(); // dự án không có âm thanh
      expect(pickers).toBeInTheDocument();
    } finally { g.VideoEncoder = old[0]; g.AudioEncoder = old[1]; }
  });

  it('Esc đóng hộp thoại khi chưa xuất', async () => {
    let closed = 0;
    wrap(<ExportDialog scene={PAPER_SCENE} ast={ast} derived={derived} audio={null} offsetMs={0} projectSec={30} fileName="a.rpp" onClose={() => { closed++; }} />);
    await act(async () => { await new Promise((res) => setTimeout(res, 0)); });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(1);
  });
});

describe('Độ trễ thiết bị (T-82)', () => {
  /** Bộ đo giả: ghi các lần gõ; `finish` cho `poll()` trả kết quả ở lần gọi kế. */
  function fake(result: ReturnType<typeof summarize>) {
    const f = { taps: [] as number[], aborted: false, done: false, phase: 'idle' as CalStatus['phase'] };
    const cal: Calibration = {
      async start() { f.phase = 'running'; }, tap(ms) { f.taps.push(ms); return true; },
      status: () => ({ phase: f.phase, bar: 2, taps: f.taps.length }),
      poll: () => { if (!f.done) return null; f.phase = 'done'; return result; }, result: () => null, abort() { f.aborted = true; f.phase = 'idle'; },
    };
    return { f, cal };
  }
  function host(initial: DevicePrefs, make: () => Calibration) {
    let prefs = initial; const calls: DevicePrefs[] = [];
    const ui = () => <DeviceLatency prefs={prefs} onChange={(p) => { prefs = p; calls.push(p); view.rerender(<I18nProvider>{ui()}</I18nProvider>); }} makeCalibration={make} />;
    const view = render(<I18nProvider>{ui()}</I18nProvider>);
    return { get prefs() { return prefs; }, calls };
  }
  const OK = summarize([18, 20, 22, 21]);

  it('đo xong thì lưu thành thiết bị mới có tên; thiết bị đó thành thiết bị đang chọn', async () => {
    const { f, cal } = fake(OK); const h = host(DEFAULT_DEVICE_PREFS, () => cal);
    fireEvent.click(screen.getByTestId('latency-start'));
    await screen.findByTestId('latency-pad');
    fireEvent.pointerDown(screen.getByTestId('latency-pad')); expect(f.taps).toHaveLength(1);
    f.done = true;
    await screen.findByTestId('latency-result', undefined, { timeout: 2000 });
    fireEvent.change(screen.getByTestId('latency-name'), { target: { value: 'Tai nghe' } });
    fireEvent.click(screen.getByTestId('latency-save'));
    await waitFor(() => expect(h.prefs.profiles).toHaveLength(1));
    expect(h.prefs.profiles[0]).toMatchObject({ name: 'Tai nghe', offsetMs: 21 }); expect(h.prefs.activeId).toBe(h.prefs.profiles[0].id);
    expect(screen.queryByTestId('latency-result')).toBeNull();
  });

  it('kết quả không ổn định hoặc thiếu lần đo: có cảnh báo; thiếu lần đo thì không cho lưu', async () => {
    const few = fake(summarize([10, null, null, 12])); host(DEFAULT_DEVICE_PREFS, () => few.cal);
    fireEvent.click(screen.getByTestId('latency-start')); await screen.findByTestId('latency-pad'); few.f.done = true;
    const r = await screen.findByTestId('latency-result', undefined, { timeout: 2000 });
    expect(r.textContent).toMatch(/2.*4/); expect(screen.queryByTestId('latency-save')).toBeNull();
  });

  it('có thiết bị đang chọn: kết quả cập nhật chính thiết bị đó (thay hẳn, không cộng dồn)', async () => {
    const start = addProfile(DEFAULT_DEVICE_PREFS, 'Loa', 100, 'a')!;
    const { f, cal } = fake(OK); const h = host(start, () => cal);
    fireEvent.click(screen.getByTestId('latency-start')); await screen.findByTestId('latency-pad'); f.done = true;
    await screen.findByTestId('latency-result', undefined, { timeout: 2000 });
    fireEvent.click(screen.getByTestId('latency-apply'));
    await waitFor(() => expect(h.prefs.profiles[0].offsetMs).toBe(21)); expect(h.prefs.profiles).toHaveLength(1);
  });

  it('huỷ giữa chừng: dừng bộ đo, không đổi gì', async () => {
    const { f, cal } = fake(OK); const h = host(DEFAULT_DEVICE_PREFS, () => cal);
    fireEvent.click(screen.getByTestId('latency-start')); await screen.findByTestId('latency-pad');
    fireEvent.click(screen.getByTestId('latency-cancel'));
    expect(f.aborted).toBe(true); expect(screen.queryByTestId('latency-run')).toBeNull(); expect(h.calls).toHaveLength(0);
  });

  it('sửa tên và độ lệch bằng tay; chọn "Tự động" thì ẩn mục sửa; xoá thiết bị', () => {
    const start = addProfile(DEFAULT_DEVICE_PREFS, 'Loa', 100, 'a')!;
    const h = host(start, () => fake(OK).cal);
    const off = screen.getByRole('spinbutton', { name: /^(Offset|Độ lệch)/ }) as HTMLInputElement;
    typeIn(off, '55'); expect(h.prefs.profiles[0].offsetMs).toBe(55);
    const name = screen.getByTestId('device-name') as HTMLInputElement; fireEvent.change(name, { target: { value: 'Loa bàn' } }); fireEvent.blur(name);
    expect(h.prefs.profiles[0].name).toBe('Loa bàn');
    fireEvent.change(screen.getByTestId('device-select'), { target: { value: '' } });
    expect(h.prefs.activeId).toBeNull(); expect(screen.queryByTestId('device-edit')).toBeNull();
    fireEvent.change(screen.getByTestId('device-select'), { target: { value: 'a' } });
    fireEvent.click(screen.getByTestId('device-delete')); expect(h.prefs.profiles).toHaveLength(0);
  });

  it('mở tệp thiết bị: hợp lệ thì thêm; hỏng thì báo lý do đã dịch', async () => {
    const h = host(DEFAULT_DEVICE_PREFS, () => fake(OK).cal);
    const input = screen.getByTestId('device-file');
    await act(async () => { fireEvent.change(input, { target: { files: [new File([serializeProfile({ name: 'Tai nghe BT', offsetMs: 170 })], 'a.json')] } }); });
    await waitFor(() => expect(h.prefs.profiles).toHaveLength(1)); expect(h.prefs.profiles[0]).toMatchObject({ name: 'Tai nghe BT', offsetMs: 170 });
    await act(async () => { fireEvent.change(input, { target: { files: [new File(['{ không phải json'], 'b.json')] } }); });
    await waitFor(() => expect(screen.getByTestId('latency-note').textContent).toMatch(/(damaged|hỏng)/i)); expect(h.prefs.profiles).toHaveLength(1);
  });
});

describe('Ảnh nền (T-21)', () => {
  const mount = (state: { name: string | null; busy: boolean; error: string | null }, spec?: { fit: 'COVER' | 'CONTAIN' | 'STRETCH'; opacity: number; dim: number }) => {
    const calls = { pick: [] as File[], removed: 0, spec: [] as object[] };
    wrap(<BackgroundSection n={4} state={state} spec={spec} onPick={(f) => calls.pick.push(f)} onRemove={() => { calls.removed++; }} onSpec={(p) => calls.spec.push(p)} />);
    return calls;
  };
  it('chưa có ảnh: chỉ có nút chọn ảnh; chọn tệp gọi onPick; chưa hiện cách đặt', () => {
    const c = mount({ name: null, busy: false, error: null });
    expect(screen.queryByTestId('bg-fit')).toBeNull(); expect(screen.queryByTestId('bg-remove')).toBeNull();
    const f = new File(['x'], 'a.png'); fireEvent.change(screen.getByTestId('bg-input'), { target: { files: [f] } });
    expect(c.pick).toEqual([f]);
  });
  it('có ảnh: hiện tên, cách đặt, độ đục, làm tối; đổi cách đặt/độ đục/làm tối gửi bản vá; bỏ ảnh', () => {
    const c = mount({ name: 'nen.jpg', busy: false, error: null });
    expect(screen.getByTestId('bg-name').textContent).toBe('nen.jpg');
    fireEvent.click(screen.getByTestId('bg-fit-CONTAIN')); expect(c.spec.at(-1)).toEqual({ fit: 'CONTAIN' });
    typeIn(screen.getByRole('spinbutton', { name: /^(Darken|Làm tối)$/ }), '40'); expect(c.spec.at(-1)).toEqual({ dim: 0.4 });
    typeIn(screen.getByRole('spinbutton', { name: /^(Opacity|Độ đục)$/ }), '75'); expect(c.spec.at(-1)).toEqual({ opacity: 0.75 });
    fireEvent.click(screen.getByTestId('bg-remove')); expect(c.removed).toBe(1);
  });
  it('lỗi: báo bằng chữ đã dịch theo mã', () => {
    mount({ name: null, busy: false, error: 'ERR_ASSET_TOO_LARGE' });
    expect(screen.getByTestId('bg-error').textContent).toMatch(/(20 MB)/);
  });
});

describe('AspectSwitch', () => {
  it('đánh dấu tỉ lệ hiện tại, bấm tỉ lệ khác gọi onChange; kích thước tuỳ biến thì không ô nào được chọn nhưng vẫn Tab vào được', () => {
    const calls: string[] = [];
    const v = wrap(<AspectSwitch value="1:1" onChange={(a) => calls.push(a)} />);
    expect(screen.getByTestId('aspect-1:1')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('aspect-9:16')).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByTestId('aspect-9:16'));
    expect(calls).toEqual(['9:16']);
    v.rerender(<I18nProvider><AspectSwitch value="1000:700" onChange={() => {}} /></I18nProvider>);
    expect(['9:16', '1:1', '16:9'].map((a) => screen.getByTestId(`aspect-${a}`).getAttribute('aria-checked'))).toEqual(['false', 'false', 'false']);
    expect(screen.getByTestId('aspect-9:16')).toHaveAttribute('tabindex', '0');
  });
});

describe('Panel đổi cỡ và mục thu gọn (Editor)', () => {
  it('Splitter: phím mũi tên đổi 8 px (Shift 32) theo chiều lớn lên, Home/End, Enter thu gọn, nhấp đúp về mặc định', async () => {
    const { Splitter } = await import('../src/components/Splitter.tsx');
    const calls: number[] = []; let toggled = 0, reset = 0;
    render(<Splitter axis="x" grow={-1} label="Đổi cỡ" value={300} min={200} max={500} controls="p" onResize={(v) => calls.push(v)} onReset={() => { reset++; }} onToggle={() => { toggled++; }} />);
    const sep = screen.getByRole('separator', { name: 'Đổi cỡ' });
    expect(sep).toHaveAttribute('aria-valuenow', '300');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    fireEvent.keyDown(sep, { key: 'ArrowLeft' }); // panel bên phải: sang trái là lớn lên
    fireEvent.keyDown(sep, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(sep, { key: 'Home' }); fireEvent.keyDown(sep, { key: 'End' });
    expect(calls).toEqual([308, 268, 200, 500]);
    fireEvent.keyDown(sep, { key: 'Enter' }); fireEvent.doubleClick(sep);
    expect(toggled).toBe(1); expect(reset).toBe(1);
  });
  it('InspectorSection: nhấp tiêu đề gấp/mở mục, aria-expanded đúng, nhớ trạng thái cho mục cùng id', async () => {
    const { InspectorSection } = await import('../src/components/Inspector.tsx');
    const ui = () => <I18nProvider><InspectorSection n={3} id="test-fold" title="Mục thử"><p>nội dung</p></InspectorSection></I18nProvider>;
    const { unmount } = render(ui());
    const head = screen.getByTestId('section-toggle-test-fold');
    expect(head).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('nội dung')).toBeInTheDocument();
    fireEvent.click(head);
    expect(head).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('nội dung')).toBeNull();
    unmount(); render(ui());
    expect(screen.getByTestId('section-toggle-test-fold')).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByTestId('section-toggle-test-fold'));
    expect(screen.getByText('nội dung')).toBeInTheDocument();
  });
});

describe('Graph Editor cơ bản (T-33)', () => {
  const widgetWith = (animate: Record<string, unknown>) => ({ id: 'w1', type: 'TIME_BAR', zIndex: 1, visible: true, layout: { x: 0, y: 0, width: 300, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: {}, animate }) as never;
  const scale = { keys: [{ at: { sec: 0 }, value: 100 }, { at: { sec: 2 }, value: 200 }, { at: { sec: 4 }, value: 150 }] };
  const tm = [{ tick: 0, bpm: 120, num: 4, den: 4 }] as never;
  it('vẽ đường cong của dòng chọn; chọn keyframe hiện ô vận tốc/ảnh hưởng; đổi ảnh hưởng ghi cubicBezier vào easing của đoạn', async () => {
    const { GraphEditor } = await import('../src/components/GraphEditor.tsx');
    const edits: Record<string, unknown>[] = [];
    let sel = { keys: [] as string[], row: 'scale' as string | null };
    const ui = () => <I18nProvider><GraphEditor widget={widgetWith({ scale })} tempoMap={tm} duration={10} playback={createPlayback()} locked={false}
      sel={sel} onSel={(s) => { sel = s; }} onAnimateMany={(ch) => edits.push(ch)} gesture={{ begin() {}, end() {} }} /></I18nProvider>;
    const { rerender } = render(ui());
    expect(screen.getByTestId('graph-curve-scale')).toBeInTheDocument();
    expect(screen.getAllByTestId('graph-key')).toHaveLength(3);
    fireEvent.pointerDown(screen.getAllByTestId('graph-key')[1], { button: 0, clientX: 0, clientY: 0 });
    expect(sel.keys).toEqual(['scale#1']);
    rerender(ui());
    const box = screen.getByTestId('graph-velocity');
    const fields = box.querySelectorAll('input');
    expect(fields).toHaveLength(4); // vào: vận tốc, ảnh hưởng; ra: vận tốc, ảnh hưởng
    expect((fields[0] as HTMLInputElement).value).toBe('50'); // đoạn đều: (200 − 100) / 2 s
    fireEvent.change(fields[1], { target: { value: '60' } }); fireEvent.keyDown(fields[1], { key: 'Enter' });
    const last = edits.at(-1) as { scale: { keys: { ease?: { cubicBezier: number[] } }[] } };
    expect(last.scale.keys[1].ease?.cubicBezier[2]).toBeCloseTo(0.4);
  });
  it('dán easing áp cho đoạn kết thúc ở keyframe chọn; thuộc tính màu không có đồ thị', async () => {
    const { GraphEditor } = await import('../src/components/GraphEditor.tsx');
    const { easeClipboard } = await import('../src/lib/graphEditor.ts');
    const edits: Record<string, unknown>[] = [];
    const anim = { keys: [{ at: { sec: 0 }, value: 100 }, { at: { sec: 2 }, value: 200, ease: 'easeInQuad' }, { at: { sec: 4 }, value: 150 }] };
    easeClipboard.clear();
    const ui = (keys: string[]) => <I18nProvider><GraphEditor widget={widgetWith({ scale: anim })} tempoMap={tm} duration={10} playback={createPlayback()} locked={false}
      sel={{ keys, row: 'scale' }} onSel={() => {}} onAnimateMany={(ch) => edits.push(ch)} gesture={{ begin() {}, end() {} }} /></I18nProvider>;
    const { rerender, unmount } = render(ui(['scale#1']));
    expect(screen.getByTestId('graph-paste-ease')).toBeDisabled();
    fireEvent.click(screen.getByTestId('graph-copy-ease'));
    rerender(ui(['scale#2']));
    fireEvent.click(screen.getByTestId('graph-paste-ease'));
    expect((edits.at(-1) as { scale: { keys: { ease?: unknown }[] } }).scale.keys[2].ease).toBe('easeInQuad');
    unmount();
    render(<I18nProvider><GraphEditor widget={widgetWith({ color: { kind: 'color', keys: [{ at: { sec: 0 }, value: '#ffffff' }] } })} tempoMap={tm} duration={10} playback={createPlayback()} locked={false}
      sel={{ keys: [], row: null }} onSel={() => {}} onAnimateMany={() => {}} gesture={{ begin() {}, end() {} }} /></I18nProvider>);
    expect(screen.getByTestId('graph-empty')).toBeInTheDocument();
  });
});

describe('Tài nguyên của phiên (T-21)', () => {
  it('widget Ảnh: chọn tệp thêm vào phiên và gán cho widget; tệp bị từ chối báo theo mã; danh sách Tệp của phiên bỏ được', async () => {
    const { WidgetSettings } = await import('../src/components/WidgetSettings.tsx');
    const { SessionSettings } = await import('../src/components/SessionSettings.tsx');
    const { AssetsContext } = await import('../src/lib/assetsRuntime.ts');
    const { AssetError } = await import('../src/lib/sessionAssets.ts');
    const { createWidget, defaultScene } = await import('@dawviz/render-core');
    const id = 'sha256:' + 'a'.repeat(64);
    let list = [] as { id: string; kind: 'image'; name: string; size: number }[];
    const removed: string[] = [];
    const api = {
      get list() { return list; },
      add: async (f: File) => { if (f.name.endsWith('.exe')) throw new AssetError('ERR_ASSET_UNSUPPORTED', 'x'); const m = { id, kind: 'image' as const, name: f.name, size: 1234567 }; list = [m]; return m; },
      remove: (x: string) => { removed.push(x); }, exportPayload: async () => ({ images: [], fonts: [] }),
    };
    const w = createWidget(defaultScene('16:9'), 'IMAGE'), patches: Record<string, unknown>[] = [];
    const ui = () => wrap(<AssetsContext.Provider value={api}><WidgetSettings widget={w} advanced={false} onProps={(p) => patches.push(p)} /><SessionSettings hasProject busy={false} state={{ kind: 'idle' }} missing={[]} onSavePack={() => {}} onOpenPack={() => {}} onDiscard={() => {}} /></AssetsContext.Provider>);
    const { unmount } = ui();
    expect(screen.getByTestId('session-files').textContent).toMatch(/No images|Chưa thêm/);
    const file = screen.getByTestId('ws-asset-file');
    fireEvent.change(file, { target: { files: [new File(['x'], 'virus.exe')] } });
    expect(await screen.findByTestId('ws-asset-error')).toHaveTextContent(/not supported|không dùng được/);
    fireEvent.change(file, { target: { files: [new File(['x'], 'logo.png')] } });
    await waitFor(() => expect(patches.at(-1)).toEqual({ asset: id }));
    unmount(); ui();
    const row = screen.getByTestId('session-files');
    expect(row.textContent).toMatch(/logo\.png/); expect(row.textContent).toMatch(/1[.,]2 MB/);
    fireEvent.click(screen.getByRole('button', { name: /Remove logo.png|Bỏ logo.png/ }));
    expect(removed).toEqual([id]);
  });
});
