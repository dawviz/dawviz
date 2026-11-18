// Thẻ Cài đặt, mục "Phiên làm việc" (T-10): lưu/mở Project Pack, xoá phiên đã lưu trong trình duyệt, trạng thái tự lưu.
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';

export type SaveState = { kind: 'idle' } | { kind: 'saved'; at: number } | { kind: 'degraded' } | { kind: 'failed' };

export function SessionSettings({ hasProject, busy, state, missing, onSavePack, onOpenPack, onDiscard }: {
  hasProject: boolean; busy: boolean; state: SaveState; missing: string[]; onSavePack(): void; onOpenPack(file: File): void; onDiscard(): void;
}) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3" data-testid="session-settings">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost border border-control" disabled={!hasProject || busy} onClick={onSavePack} data-testid="pack-save">{i18n.t('web.session.savePack')}</button>
        <button type="button" className="btn-ghost border border-control" disabled={busy} onClick={() => input.current?.click()} data-testid="pack-open">{i18n.t('web.session.openPack')}</button>
        <button type="button" className="btn-ghost" onClick={onDiscard} data-testid="session-discard">{i18n.t('web.session.discard')}</button>
        <input ref={input} type="file" accept=".zip,application/zip" hidden data-testid="pack-input" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onOpenPack(f); }} />
      </div>
      <p className="text-xs text-muted" role="status" data-testid="session-state">
        {state.kind === 'saved' ? i18n.t('web.session.saving') : state.kind === 'degraded' ? i18n.t('warn.WARN_STORAGE_LOW') : state.kind === 'failed' ? i18n.t('errors.ERR_STORAGE_FAILED') : ''}
      </p>
      {missing.length > 0 && <p className="text-xs text-warning" role="status" data-testid="session-missing">{i18n.t('web.session.missing', { files: missing.join(', ') })}</p>}
    </div>
  );
}
