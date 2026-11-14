// Mục "Preset" ở thẻ Settings (T-07, REQ-STORAGE-02): mở và lưu preset .json. Cảnh báo WARN_PRESET_* và lỗi hiện ngay tại đây.
// Preset chỉ chứa bố cục khung video và kiểu nốt; không chứa dự án hay nhạc của người dùng.
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { Notices } from './Notices.tsx';
import type { Problem } from '../lib/problems.ts';

const btn = 'rounded border border-control bg-raised px-3 py-1.5 text-[13px] font-medium text-fg transition hover:border-line-strong';

export function PresetSettings({ onOpen, onSave, problems, opened }: { onOpen(file: File): void; onSave(): void; problems: Problem[]; opened: string | null }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3" data-testid="preset-settings">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => input.current?.click()} data-testid="preset-open">{i18n.t('web.preset.open')}</button>
        <button type="button" className={btn} onClick={onSave} data-testid="preset-save">{i18n.t('web.preset.save')}</button>
        <input ref={input} type="file" accept=".json,application/json" className="hidden" tabIndex={-1} data-testid="preset-input"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onOpen(f); }} />
      </div>
      <div role="status" className="text-xs text-muted" data-testid="preset-status">{opened ? i18n.t('web.preset.opened', { name: opened }) : ''}</div>
      <Notices problems={problems} basic={false} />
    </div>
  );
}
