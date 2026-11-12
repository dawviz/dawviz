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
    fireEvent.change(screen.getByLabelText(/^(Opacity|Độ đục(?! khi))/), { target: { value: '0.4' } });
    expect(st.base.opacity).toBe(0.4);
    fireEvent.click(screen.getByRole('button', { name: /Neon/ }));
    expect(st.base.glow).toBe(STYLE_PRESETS.neon.glow);
    fireEvent.click(screen.getByRole('checkbox', { name: /keyboard|bàn phím/i }));
    expect(kb.enabled).toBe(false);
  });
});
