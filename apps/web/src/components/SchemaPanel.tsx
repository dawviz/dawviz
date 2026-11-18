// Nạp schema nhị phân (T-10, REQ-PARSER-05, D-28): hiện khi định dạng không có parser dựng sẵn (`probeProject().needs.schema`).
// Đọc tệp .json, kiểm bằng `validateSchema` (không eval), giữ trong phiên; khi có schema khớp thì dự án được phân tích lại.
import { useRef, useState } from 'react';
import { validateSchema } from '@dawviz/parser';
import { useI18n } from '../i18n/I18nProvider.tsx';

const MAX_SCHEMA_BYTES = 1e6;
export type SchemaRead = { ok: true; schema: object; name: string } | { ok: false; code: 'ERR_SCHEMA_INVALID' | 'ERR_FILE_TOO_LARGE'; message: string };

/** Đọc và kiểm một tệp schema. Thuần theo đầu vào chữ (tách khỏi File để test). */
export function readSchemaText(text: string, size = text.length): SchemaRead {
  if (size > MAX_SCHEMA_BYTES) return { ok: false, code: 'ERR_FILE_TOO_LARGE', message: `${size} > ${MAX_SCHEMA_BYTES}` };
  let raw: unknown;
  try { raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); } catch (e) { return { ok: false, code: 'ERR_SCHEMA_INVALID', message: (e as Error).message }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, code: 'ERR_SCHEMA_INVALID', message: 'schema phải là đối tượng JSON' };
  try { validateSchema(raw); } catch (e) { return { ok: false, code: 'ERR_SCHEMA_INVALID', message: (e as Error).message }; }
  const s = raw as { id?: unknown; name?: unknown };
  return { ok: true, schema: raw, name: String(s.name ?? s.id ?? 'schema').slice(0, 60) };
}

export function SchemaPanel({ schemas, busy, onAdd, onRemove }: { schemas: { name: string }[]; busy: boolean; onAdd(schema: object): void; onRemove(index: number): void }) {
  const { i18n } = useI18n();
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const pick = async (f?: File | null) => {
    if (ref.current) ref.current.value = '';
    if (!f) return;
    const r = readSchemaText(await f.text(), f.size);
    if (r.ok) { setError(null); onAdd(r.schema); } else setError(i18n.t(`errors.${r.code}`));
  };
  return (
    <section className="space-y-2 rounded border border-warning/60 bg-warning/10 px-4 py-3 text-sm text-fg" role="region" aria-label={i18n.t('web.schema.title')} data-testid="schema-panel">
      <h2 className="text-[15px] font-semibold">{i18n.t('web.schema.title')}</h2>
      <p className="text-[13px] text-muted">{i18n.t('web.schema.need')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="field px-3 py-1.5 text-[13px] font-semibold" disabled={busy} onClick={() => ref.current?.click()} data-testid="schema-load">{i18n.t('web.schema.load')}</button>
        <input ref={ref} type="file" accept=".json,application/json" hidden onChange={(e) => void pick(e.target.files?.[0])} data-testid="schema-input" />
      </div>
      {schemas.length > 0 && <ul className="space-y-1 text-xs">{schemas.map((s, i) => (
        <li key={i} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{s.name}</span><button type="button" className="btn-ghost" onClick={() => onRemove(i)}>{i18n.t('web.schema.remove')}</button></li>))}</ul>}
      {error && <p role="alert" className="text-xs text-danger" data-testid="schema-error">{error}</p>}
    </section>
  );
}
