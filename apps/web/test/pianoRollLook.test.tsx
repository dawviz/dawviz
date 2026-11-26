// T-129: ô Nốt thấp nhất/cao nhất kéo được (hiện tên nốt, gõ tên nốt hoặc số MIDI), lựa chọn nhanh 88 phím / toàn dải,
// và dải màu hai đầu của chế độ màu Theo cao độ / Theo cường độ.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { StylePanel } from '../src/components/StylePanel.tsx';
import type { PitchRange } from '../src/lib/commands.ts';
import { defaultStyleConfig, DEFAULT_KEYBOARD_STYLE, type StyleConfig } from '@dawviz/render-core';

const typeIn = (el: HTMLElement, v: string) => { fireEvent.focus(el); fireEvent.change(el, { target: { value: v } }); fireEvent.keyDown(el, { key: 'Enter' }); fireEvent.blur(el); };

function setup(init: PitchRange = { mode: 'CUSTOM', min: 21, max: 108 }, style: StyleConfig = defaultStyleConfig()) {
  const s = { range: init, style };
  const ui = () => <I18nProvider><StylePanel style={s.style} keyboard={{ ...DEFAULT_KEYBOARD_STYLE }} onStyle={(n) => { s.style = n; }} onKeyboard={() => {}}
    pitchRange={{ value: s.range, onChange: (n) => { s.range = n; } }} /></I18nProvider>;
  const view = render(ui());
  return { s, rerender: () => view.rerender(ui()) };
}

describe('Dải cao độ Piano Roll (T-129)', () => {
  it('ô hiện tên nốt; gõ tên nốt hoặc số MIDI; sai thì báo lỗi và giữ giá trị', () => {
    const { s, rerender } = setup();
    const lo = () => screen.getByTestId('st-pitch-min') as HTMLInputElement;
    expect(lo().value).toBe('A0');
    expect(lo()).toHaveAttribute('role', 'spinbutton');
    expect(lo()).toHaveAttribute('aria-valuetext', 'A0');
    typeIn(lo(), 'C2'); expect(s.range.min).toBe(36); rerender();
    expect(lo().value).toBe('C2');
    typeIn(lo(), '0'); expect(s.range.min).toBe(0); rerender();
    expect(lo().value).toBe('C-1');
    typeIn(lo(), 'H9');
    expect(lo()).toHaveAttribute('aria-invalid', 'true');
    expect(s.range.min).toBe(0);
  });

  it('kéo lên/xuống đổi theo nửa cung, Shift nhanh hơn; thấp không vượt cao', () => {
    const { s, rerender } = setup({ mode: 'CUSTOM', min: 60, max: 72 });
    const lo = () => screen.getByTestId('st-pitch-min');
    lo().setPointerCapture = () => {};
    fireEvent.pointerDown(lo(), { button: 0, pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 100 });
    fireEvent.pointerMove(lo(), { pointerId: 1, clientX: 10, clientY: 90 }); // lên 10 px ≈ 6 nửa cung (toàn dải 0–127 trên 200 px)
    expect(s.range.min).toBe(66);
    expect(Number.isInteger(s.range.min)).toBe(true);
    fireEvent.pointerUp(lo(), { pointerId: 1 }); rerender();
    fireEvent.pointerDown(lo(), { button: 0, pointerId: 2, pointerType: 'mouse', clientX: 10, clientY: 100 });
    fireEvent.pointerMove(lo(), { pointerId: 2, clientX: 10, clientY: 90, shiftKey: true }); // Shift ×10
    expect(s.range.min).toBe(127);
    expect(s.range.max).toBe(127); // kéo thấp vượt cao thì cao đi theo
    fireEvent.pointerUp(lo(), { pointerId: 2 });
  });

  it('lựa chọn nhanh: Toàn dải (0–127) và 88 phím; nút đang đúng dải thì tắt', () => {
    const { s, rerender } = setup();
    expect(screen.getByTestId('pitch-preset-21-108')).toBeDisabled();
    fireEvent.click(screen.getByTestId('pitch-preset-0-127'));
    expect(s.range).toEqual({ mode: 'CUSTOM', min: 0, max: 127 }); rerender();
    expect(screen.getByTestId('pitch-preset-0-127')).toBeDisabled();
    fireEvent.click(screen.getByTestId('pitch-preset-21-108'));
    expect(s.range).toEqual({ mode: 'CUSTOM', min: 21, max: 108 });
  });

  it('Vừa nội dung: không có ô nốt và lựa chọn nhanh', () => {
    setup({ mode: 'FIT_CONTENT', min: 21, max: 108 });
    expect(screen.queryByTestId('st-pitch-min')).toBeNull();
    expect(screen.queryByTestId('pitch-preset-0-127')).toBeNull();
  });
});

describe('Dải màu nốt (T-129)', () => {
  const withMode = (colorMode: 'track' | 'pitch' | 'velocity', extra = {}) => { const st = defaultStyleConfig(); st.base = { ...st.base, colorMode, ...extra }; return st; };
  it('chỉ hiện khi màu Theo cao độ / Theo cường độ (D-72)', () => {
    setup(undefined, withMode('track'));
    expect(screen.queryByTestId('note-gradient')).toBeNull();
  });
  it('bật dải màu đặt hai màu mặc định, hiện hai ô màu theo chế độ; tắt thì về rỗng (cách tô cũ)', () => {
    const { s, rerender } = setup(undefined, withMode('pitch'));
    expect(screen.queryByTestId('st-gradientFrom')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Own colour range|Dải màu riêng/ }));
    expect(s.style.base.gradientFrom).toMatch(/^#[0-9a-f]{6}$/);
    expect(s.style.base.gradientTo).toMatch(/^#[0-9a-f]{6}$/); rerender();
    expect(screen.getByRole('button', { name: /Lowest note colour|Màu nốt thấp nhất/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Highest note colour|Màu nốt cao nhất/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Own colour range|Dải màu riêng/ }));
    expect(s.style.base.gradientFrom).toBe(''); expect(s.style.base.gradientTo).toBe('');
  });
  it('chế độ Theo cường độ gọi hai đầu là nốt nhẹ nhất / mạnh nhất', () => {
    setup(undefined, withMode('velocity', { gradientFrom: '#000000', gradientTo: '#ffffff' }));
    expect(screen.getByRole('button', { name: /Softest note colour|Màu nốt nhẹ nhất/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Loudest note colour|Màu nốt mạnh nhất/ })).toBeInTheDocument();
  });
});
