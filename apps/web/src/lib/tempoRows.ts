// Ghi đè tempo từ bảng dòng người dùng gõ (T-10, REQ-PARSER-07, D-24/D-29). Thuần: dùng chung với Project Pack.
import { resolveTempoRows } from '@dawviz/parser';

export type TempoPoint = { tick?: number; beat?: number; timeSeconds?: number; bpm: number; num?: number; den?: number };
export type TempoOverride = number | TempoPoint[];
export type TempoUnit = 'time' | 'reaper' | 'sixteenth';
export interface TempoRow { pos: string; bpm: string; sig: string }
export interface TempoDraft { unit: TempoUnit; rows: TempoRow[] }

export const emptyDraft = (): TempoDraft => ({ unit: 'time', rows: [{ pos: '', bpm: '', sig: '' }] });
export const BPM_MIN = 10, BPM_MAX = 1000;

/** BPM có thể gõ dấu phẩy (vi) hoặc chấm. */
export const readBpm = (t: string): number => Number(t.trim().replace(',', '.'));
export const bpmOk = (b: number) => Number.isFinite(b) && b >= BPM_MIN && b <= BPM_MAX;

export type DraftResult = { ok: true; override: TempoOverride } | { ok: false; row: number; code: 'bpm' | 'position' | 'signature' | 'empty'; message?: string };

/** Một dòng chỉ có BPM (không vị trí, không dấu nhịp) → số BPM; nhiều dòng → mảng điểm đã đổi vị trí. */
export function draftToOverride(d: TempoDraft): DraftResult {
  const rows = d.rows.filter((r) => r.pos.trim() || r.bpm.trim() || r.sig.trim());
  if (!rows.length) return { ok: false, row: 0, code: 'empty' };
  for (const [i, r] of rows.entries()) if (!bpmOk(readBpm(r.bpm))) return { ok: false, row: i, code: 'bpm' };
  if (rows.length === 1 && !rows[0].pos.trim() && !rows[0].sig.trim()) return { ok: true, override: readBpm(rows[0].bpm) };
  try {
    const pts = resolveTempoRows(rows.map((r) => ({ pos: r.pos.trim(), bpm: readBpm(r.bpm), sig: r.sig.trim() || undefined })), { unit: d.unit });
    return { ok: true, override: pts };
  } catch (e) {
    const x = e as { message?: string; details?: { text?: string } };
    const text = x.details?.text;
    const at = text === undefined ? -1 : rows.findIndex((r) => r.pos.trim() === text || r.sig.trim() === text);
    return { ok: false, row: Math.max(0, at), code: /dấu nhịp/.test(x.message ?? '') ? 'signature' : 'position', message: x.message };
  }
}

/** Bảng gõ được lưu nguyên (đơn vị + dòng) trong phiên/Project Pack để mở lại đúng như người dùng nhập; `override` chỉ là kết quả đã đổi. */
export function sanitizeDraft(v: unknown): TempoDraft {
  const d = v as Partial<TempoDraft> | null;
  const unit: TempoUnit = d?.unit === 'reaper' || d?.unit === 'sixteenth' ? d.unit : 'time';
  const rows = Array.isArray(d?.rows) ? d!.rows!.slice(0, 64).map((r) => ({ pos: String(r?.pos ?? '').slice(0, 24), bpm: String(r?.bpm ?? '').slice(0, 12), sig: String(r?.sig ?? '').slice(0, 8) })) : [];
  return { unit, rows: rows.length ? rows : emptyDraft().rows };
}

export const sourceNeedsTempo = (source: string | undefined): boolean => source === 'fallback' || source === 'midi-default';
