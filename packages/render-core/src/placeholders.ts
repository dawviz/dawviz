// Chỗ giữ trong mẫu chữ (T-73, SRS REQ-GRAPHICS-19, BRD D-60/OI-18): `{tên}`, `{tên:định_dạng}`, `{{` ra dấu `{`.
// Hàm thuần, không phụ thuộc widget: phân tích mẫu, kiểm định dạng, định dạng giá trị. Bộ giá trị chung nằm ở hud.ts (cần dữ liệu dự án).
import { clockMs } from './text.ts';

/** Giá trị của một chỗ giữ. Chữ trơn: không nhận định dạng. Số: `{bpm:0.0}`. Thời gian (giây): `{time:m:ss}`. Danh sách: `{notes:, }` (dấu phân cách). */
export type PV =
  | string | number
  | { kind: 'num'; num: number; text: string }
  | { kind: 'time'; num: number; text: string }
  | { kind: 'list'; items: readonly string[] };

export type PlaceholderKind = 'text' | 'num' | 'time' | 'list';
/** Số có chữ mặc định riêng (ví dụ phần trăm kèm "%"); có định dạng thì dùng `num`. */
export const numV = (num: number, text?: string): PV => ({ kind: 'num', num, text: text ?? String(num) });
/** Thời gian theo giây; mặc định `m:ss` (làm tròn xuống). */
export const timeV = (sec: number): PV => ({ kind: 'time', num: sec, text: clockMs(sec) });
export const listV = (items: readonly string[]): PV => ({ kind: 'list', items });

/** Dấu phân cách tối đa 16 ký tự (định dạng của danh sách). */
const MAX_SEP = 16;
const NUM_FMT = /^(0{1,8})(?:\.(0{1,4}))?$/;
const TIME_FMT = /^(?:(h):)?(m|mm):ss(?:\.(S{1,3}))?$/;

/** Kiểu của giá trị. */
export function kindOf(v: PV): PlaceholderKind {
  return typeof v === 'string' ? 'text' : typeof v === 'number' ? 'num' : v.kind;
}
/** Định dạng này có hợp lệ với kiểu giá trị không (kiểm lúc đọc preset, không cần giá trị). */
export function formatValid(kind: PlaceholderKind, fmt: string): boolean {
  if (kind === 'num') return NUM_FMT.test(fmt);
  if (kind === 'time') return TIME_FMT.test(fmt);
  if (kind === 'list') return fmt.length <= MAX_SEP;
  return false;
}
const finite = (n: number) => (Number.isFinite(n) ? n : 0);

function formatNum(n: number, fmt: string): string {
  const m = NUM_FMT.exec(fmt)!, intLen = m[1].length, dec = m[2]?.length ?? 0;
  const s = Math.abs(finite(n)).toFixed(dec), [i, f] = s.split('.');
  return `${finite(n) < 0 && Number(s) !== 0 ? '-' : ''}${i.padStart(intLen, '0')}${f ? `.${f}` : ''}`;
}
function formatTime(sec: number, fmt: string): string {
  const m = TIME_FMT.exec(fmt)!;
  const ms = Math.floor(Math.max(0, finite(sec)) * 1000 + 1e-6); // số nguyên ms: không lệch do dấu phẩy động
  const h = Math.floor(ms / 3600000), mins = m[1] ? Math.floor(ms / 60000) % 60 : Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60;
  const mm = m[2] === 'mm' ? String(mins).padStart(2, '0') : String(mins);
  const frac = m[3] ? `.${String(ms % 1000).padStart(3, '0').slice(0, m[3].length)}` : '';
  return `${m[1] ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}${frac}`;
}

/** Giá trị → chữ. Không có định dạng thì dùng mặc định của giá trị. Định dạng sai kiểu → null (chỗ gọi giữ nguyên chữ của mẫu). */
export function formatValue(v: PV, fmt?: string): string | null {
  const k = kindOf(v);
  if (fmt === undefined) {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return v.kind === 'list' ? v.items.join(' ') : v.text;
  }
  if (!formatValid(k, fmt)) return null;
  const x = v as Exclude<PV, string | number>;
  if (typeof v === 'number') return formatNum(v, fmt);
  return x.kind === 'num' ? formatNum(x.num, fmt) : x.kind === 'time' ? formatTime(x.num, fmt) : x.items.join(fmt);
}

export type Token = { kind: 'text'; text: string } | { kind: 'ph'; raw: string; name: string; fmt?: string };
/** Tách mẫu: `{{` → chữ `{`; `{tên}` / `{tên:định_dạng}` → chỗ giữ (tên chữ-số-gạch dưới, bắt đầu bằng chữ). Còn lại là chữ. */
export function parseTemplate(template: string): Token[] {
  const out: Token[] = []; let last = 0;
  const push = (text: string) => { if (!text) return; const p = out[out.length - 1]; if (p && p.kind === 'text') p.text += text; else out.push({ kind: 'text', text }); };
  for (const m of template.matchAll(/\{\{|\{([A-Za-z][A-Za-z0-9_]*)(?::([^{}]*))?\}/g)) {
    push(template.slice(last, m.index)); last = m.index! + m[0].length;
    if (m[0] === '{{') push('{');
    else out.push({ kind: 'ph', raw: m[0], name: m[1], fmt: m[2] });
  }
  push(template.slice(last));
  return out;
}

/** Kiểu giá trị mà từng tên chỗ giữ có thể mang (một tên có thể hai kiểu: `{total}` là số nốt ở bộ đếm, là thời lượng ở thanh tiến độ). */
export const PLACEHOLDER_KINDS: Readonly<Record<string, readonly PlaceholderKind[]>> = Object.freeze({
  time: ['time'], elapsed: ['time'], remaining: ['time'], total_time: ['time'],
  bpm: ['num'], tempo: ['num'], bar: ['num'], beat: ['num'], sig: ['text'],
  title: ['text'], artist: ['text'], chord: ['text'], notes: ['list'],
  played: ['num'], total: ['num', 'time'], pct: ['num'],
  rhythm: ['list'], bass: ['list'], lengths: ['list'], pitch_classes: ['list'], phase: ['text'], next_phase: ['text'], phase_elapsed: ['time'], phase_remaining: ['time'], phase_no: ['num'],
  name: ['text'], velocity: ['num'], track: ['text'], pitch: ['num'],
  // widget phân tích (insight.ts)
  key: ['text'], scale: ['text'], confidence: ['num'], poly: ['num'], section: ['text'], next: ['text'], next_in: ['time'], section_no: ['num'], section_elapsed: ['time'],
});
/** Tên chỗ giữ dùng chung, dùng được ở mọi chữ (D-60). Widget có thể che bằng giá trị riêng cùng tên. */
export const GLOBAL_KEYS = ['time', 'elapsed', 'remaining', 'total_time', 'bpm', 'bar', 'beat', 'sig', 'title', 'artist', 'chord', 'notes', 'played', 'total', 'pct', 'events', 'events_total', 'events_pct', 'phase', 'next_phase', 'phase_elapsed', 'phase_remaining', 'phase_no', 'rhythm', 'bass', 'lengths', 'pitch_classes'] as const;

/** Tên cũ còn đọc được nhưng không gợi ý: `{tempo}` = `{bpm}` (cùng giá trị, cùng cách hiện) để preset cũ không hỏng. */
export const ALIAS_KEYS = ['tempo'] as const;

/** Chỗ giữ lạ và định dạng sai trong mẫu (để cảnh báo khi đọc preset). `known`: tên được phép. */
export function checkTemplate(template: string, known: readonly string[]): { unknown: string[]; badFormat: string[] } {
  const unknown: string[] = [], badFormat: string[] = [];
  for (const t of parseTemplate(template)) {
    if (t.kind !== 'ph') continue;
    if (!known.includes(t.name)) { unknown.push(t.name); continue; }
    if (t.fmt !== undefined && !(PLACEHOLDER_KINDS[t.name] ?? []).some((k) => formatValid(k, t.fmt!))) badFormat.push(t.raw);
  }
  return { unknown, badFormat };
}
