// Bộ chọn màu dùng chung (T-49, REQ-UI-11): thay mọi <input type="color">. Ô mở một bảng nổi gồm vùng độ bão hoà/độ sáng, thanh sắc màu,
// thanh alpha (khi ô nhận alpha), ô nhập mã (mọi định dạng của lib/color.ts), công tắc cách hiển thị HEX/RGB/HSL/HSV, sao chép,
// hút màu từ màn hình (EyeDropper, chỉ hiện khi trình duyệt có) và 12 màu dùng gần đây (localStorage, dùng chung mọi ô).
// Màu ra luôn là mã chuẩn #rrggbb / #rrggbbaa. Một lần kéo trên vùng màu hay thanh = một bước hoàn tác (GestureContext, như NumberField).
// Bàn phím: vùng màu ←/→ độ bão hoà, ↑/↓ độ sáng; thanh ←/→ (Shift ×10), Home/End; Esc đóng và trả tiêu điểm về ô.
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { COLOR_FORMATS, formatColor, fromHsva, normalizeColor, parseColor, toHex, toHsva, type ColorFormat, type Hsva } from '../lib/color.ts';
import { loadRecent, pushRecent, saveRecent } from '../lib/palette.ts';
import { GestureContext } from '../lib/storeReact.ts';
import { useMenuPlacement } from '../lib/useMenuPlacement.ts';
import { usePref } from '../lib/usePref.ts';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { StatusIcon } from './StatusIcon.tsx';
import { Duplicate, Pipette } from './Icons.tsx';

// ── màu gần đây: một danh sách dùng chung cho mọi ô màu (đọc localStorage một lần) ──
let recent: string[] | null = null;
const recentSubs = new Set<() => void>();
const getRecent = (): string[] => (recent ??= loadRecent());
const subscribeRecent = (f: () => void) => { recentSubs.add(f); return () => { recentSubs.delete(f); }; };
/** Ghi một màu vào danh sách gần đây (bảng màu cũng dùng khi áp). */
export function rememberColor(c: string): void { const next = pushRecent(getRecent(), c); if (next.join() === getRecent().join()) return; recent = next; saveRecent(next); recentSubs.forEach((f) => f()); }
const useRecent = () => useSyncExternalStore(subscribeRecent, getRecent, getRecent);

interface EyeDropperCtor { new (): { open(): Promise<{ sRGBHex: string }> } }
const eyeDropper = (): EyeDropperCtor | undefined => (globalThis as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;

/** Ô màu nhìn thấy: màu phủ trên nền ô cờ (thấy được alpha). */
export function ColorChip({ color, className = 'h-3.5 w-3.5 rounded-sm' }: { color: string; className?: string }) {
  return <span aria-hidden className={`color-chip block shrink-0 ${className}`} style={{ '--chip': normalizeColor(color) ?? '#000000' } as CSSProperties} />;
}

export interface ColorFieldProps {
  label: string; value: string; onChange(v: string): void;
  /** Ô nhận alpha (#rrggbbaa); false: luôn ra #rrggbb, không có thanh alpha. */
  alpha?: boolean; disabled?: boolean;
  /** 'field': ô cao 24 px có mã màu (mặc định); 'swatch': chấm tròn 14 px trong vùng bấm 24 px (dòng track); 'compact': ô màu thấp 20 px (Timeline). */
  variant?: 'field' | 'swatch' | 'compact';
  title?: string; testId?: string; className?: string;
}

export function ColorField({ label, value, onChange, alpha = true, disabled, variant = 'field', title, testId, className = '' }: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const shown = (normalizeColor(value, alpha) ?? '#000000').toUpperCase();
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const close = (refocus: boolean) => { setOpen(false); if (refocus) btn.current?.focus(); };
  const common = {
    ref: btn, type: 'button' as const, 'aria-label': label, 'aria-haspopup': 'dialog' as const, 'aria-expanded': open, disabled, title: title ?? shown, 'data-testid': testId,
    onClick: () => setOpen((o) => !o),
  };
  return (
    <>
      {variant === 'swatch'
        ? <button {...common} className={`color-swatch ${className}`}><ColorChip color={value} className="h-3.5 w-3.5 rounded-full" /></button>
        : variant === 'compact'
        ? <button {...common} className={`relative h-5 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-sm border border-control disabled:cursor-default ${className}`}><ColorChip color={value} className="absolute inset-0 h-full w-full" /></button>
        : <button {...common} className={`field flex min-h-[var(--hit)] w-full min-w-0 items-center gap-1.5 px-1.5 text-left text-xs tabular-nums hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
            <ColorChip color={value} /><span className="min-w-0 truncate">{shown}</span>
          </button>}
      {open && createPortal(<ColorPopover anchor={btn} label={label} value={value} alpha={alpha} onChange={onChange} onClose={close} />, document.body)}
    </>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Bước của phím trên thanh/vùng màu: ±1 đơn vị, Shift ±10, PageUp/PageDown ±10, Home/End về hai đầu. null: phím khác. */
function keyStep(e: KeyboardEvent, axis: 'x' | 'y' | 'both'): { dx: number; dy: number; home?: boolean; end?: boolean } | null {
  const k = e.shiftKey ? 10 : 1;
  switch (e.key) {
    case 'ArrowRight': return { dx: k, dy: 0 };
    case 'ArrowLeft': return { dx: -k, dy: 0 };
    case 'ArrowUp': return axis === 'both' ? { dx: 0, dy: k } : { dx: k, dy: 0 };
    case 'ArrowDown': return axis === 'both' ? { dx: 0, dy: -k } : { dx: -k, dy: 0 };
    case 'PageUp': return { dx: 10, dy: 0 };
    case 'PageDown': return { dx: -10, dy: 0 };
    case 'Home': return { dx: 0, dy: 0, home: true };
    case 'End': return { dx: 0, dy: 0, end: true };
    default: return null;
  }
}

function ColorPopover({ anchor, label, value, alpha, onChange, onClose }: { anchor: RefObject<HTMLButtonElement | null>; label: string; value: string; alpha: boolean; onChange(v: string): void; onClose(refocus: boolean): void }) {
  const { i18n } = useI18n();
  const gesture = useContext(GestureContext);
  const menu = useRef<HTMLDivElement>(null), sv = useRef<HTMLDivElement>(null);
  const place = useMenuPlacement(true, menu, { anchor, fixed: true });
  const [pref, setPref] = usePref<{ format: ColorFormat }>('colorFormat', { format: 'hex' }, (r) => ({ format: COLOR_FORMATS.includes(r.format as ColorFormat) ? r.format as ColorFormat : 'hex' }));
  const fmt = pref.format;
  const recentList = useRecent();
  const [hsv, setHsv] = useState<Hsva>(() => toHsva(parseColor(value) ?? { r: 0, g: 0, b: 0, a: 1 }));
  const cur = toHex(fromHsva(hsv), alpha);
  const opened = useRef(normalizeColor(value, alpha));
  const latest = useRef(value); latest.current = value;
  // Màu đổi từ ngoài (hoàn tác, ô khác): đồng bộ, giữ sắc màu khi màu mới là xám/đen (sắc màu không xác định).
  useEffect(() => {
    const v = normalizeColor(value, alpha);
    if (!v || v === cur) return;
    const n = toHsva(parseColor(v)!);
    setHsv((p) => ({ ...n, h: n.s === 0 || n.v === 0 ? p.h : n.h, s: n.v === 0 ? p.s : n.s }));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (next: Hsva) => {
    const h = { h: next.h, s: clamp01(next.s), v: clamp01(next.v), a: alpha ? clamp01(next.a) : 1 };
    setHsv(h);
    const hex = toHex(fromHsva(h), alpha);
    if (hex !== normalizeColor(latest.current, alpha)) onChange(hex);
  };
  const applyHex = (hex: string) => { const c = parseColor(hex); if (!c) return; gesture.begin(); apply(toHsva(c)); gesture.end(); };

  // Đóng: nhấp ra ngoài (không lấy tiêu điểm), Esc (trả tiêu điểm về ô). Đóng thì ghi màu vào danh sách gần đây nếu đã đổi.
  useEffect(() => {
    const down = (e: globalThis.PointerEvent) => { const t = e.target as Node; if (!menu.current?.contains(t) && !anchor.current?.contains(t)) onClose(false); };
    document.addEventListener('pointerdown', down, true);
    return () => document.removeEventListener('pointerdown', down, true);
  }, [anchor, onClose]);
  useEffect(() => () => { const v = normalizeColor(latest.current, alpha); if (v && v !== opened.current) rememberColor(v); }, [alpha]);
  useLayoutEffect(() => { sv.current?.focus({ preventScroll: true }); }, []);

  // Kéo trên vùng màu / thanh: một cử chỉ = một bước hoàn tác.
  const drag = (pick: (fx: number, fy: number) => Hsva) => ({
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault(); e.currentTarget.focus({ preventScroll: true }); e.currentTarget.setPointerCapture?.(e.pointerId);
      gesture.begin();
      const r = e.currentTarget.getBoundingClientRect();
      apply(pick(clamp01((e.clientX - r.left) / (r.width || 1)), clamp01((e.clientY - r.top) / (r.height || 1))));
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
      const r = e.currentTarget.getBoundingClientRect();
      apply(pick(clamp01((e.clientX - r.left) / (r.width || 1)), clamp01((e.clientY - r.top) / (r.height || 1))));
    },
    onPointerUp: () => gesture.end(), onPointerCancel: () => gesture.end(),
  });
  const keyed = (fn: (s: NonNullable<ReturnType<typeof keyStep>>) => Hsva, axis: 'x' | 'both' = 'x') => (e: KeyboardEvent<HTMLDivElement>) => {
    const s = keyStep(e, axis); if (!s) return;
    e.preventDefault(); gesture.begin(); apply(fn(s)); gesture.end();
  };

  const pct = (v: number) => Math.round(v * 100);
  const hueDeg = Math.round(hsv.h) % 360;
  const pure = toHex(fromHsva({ h: hsv.h, s: 1, v: 1, a: 1 }));
  const opaque = toHex(fromHsva({ ...hsv, a: 1 }));
  const thumb = 'pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ring-1 ring-black/60';
  const bar = 'relative h-3 w-full cursor-pointer touch-none rounded-sm border border-control';
  const svgText = i18n.t('web.color.svValue', { s: String(pct(hsv.s)), v: String(pct(hsv.v)) });

  return (
    <div ref={menu} role="dialog" aria-label={i18n.t('web.color.dialog', { name: label })} data-testid="color-popover" style={place.style}
      className="z-50 w-56 space-y-2 overflow-auto rounded-md border border-control bg-surface p-2 text-xs text-fg"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(true); } }}>
      <div ref={sv} role="slider" tabIndex={0} aria-label={i18n.t('web.color.sv')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct(hsv.s)} aria-valuetext={svgText}
        data-testid="color-sv" className="relative h-32 w-full cursor-crosshair touch-none rounded-sm border border-control"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${pure}` }}
        {...drag((fx, fy) => ({ ...hsv, s: fx, v: 1 - fy }))}
        onKeyDown={keyed((s) => ({ ...hsv, s: s.home ? 0 : s.end ? 1 : hsv.s + s.dx / 100, v: s.home ? 1 : s.end ? 0 : hsv.v + s.dy / 100 }), 'both')}>
        <span className={thumb} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: opaque }} />
      </div>
      <div role="slider" tabIndex={0} aria-label={i18n.t('web.color.hue')} aria-valuemin={0} aria-valuemax={360} aria-valuenow={hueDeg} aria-valuetext={`${hueDeg}°`}
        data-testid="color-hue" className={bar}
        style={{ background: 'linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)' }}
        {...drag((fx) => ({ ...hsv, h: Math.min(359.9, fx * 360) }))}
        onKeyDown={keyed((s) => ({ ...hsv, h: s.home ? 0 : s.end ? 359 : (hsv.h + s.dx + 360) % 360 }))}>
        <span className={`${thumb} top-1/2`} style={{ left: `${(hsv.h / 360) * 100}%`, background: pure }} />
      </div>
      {alpha && (
        <div role="slider" tabIndex={0} aria-label={i18n.t('web.color.alpha')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct(hsv.a)} aria-valuetext={`${pct(hsv.a)}%`}
          data-testid="color-alpha" className={bar} style={{ background: `linear-gradient(to right, transparent, ${opaque}), var(--checker)` }}
          {...drag((fx) => ({ ...hsv, a: fx }))}
          onKeyDown={keyed((s) => ({ ...hsv, a: s.home ? 0 : s.end ? 1 : hsv.a + s.dx / 100 }))}>
          <span className={`${thumb} top-1/2`} style={{ left: `${hsv.a * 100}%`, background: opaque }} />
        </div>
      )}
      <div className="flex items-center gap-1">
        <div className="seg flex-1" role="radiogroup" aria-label={i18n.t('web.color.format')} onKeyDown={radioKeys}>
          {COLOR_FORMATS.map((f) => (
            <button key={f} type="button" role="radio" aria-checked={fmt === f} tabIndex={radioTab(fmt === f)} className="seg-btn flex-1 !px-1" onClick={() => setPref({ format: f })}>{i18n.t(`web.color.format.${f}`)}</button>
          ))}
        </div>
        <CopyButton text={formatColor(fromHsva(hsv), fmt, alpha)} />
        {eyeDropper() && (
          <button type="button" className="tog" aria-label={i18n.t('web.color.eyedropper')} title={i18n.t('web.color.eyedropper')} data-testid="color-eyedropper"
            onClick={() => { const E = eyeDropper(); if (E) new E().open().then((r) => applyHex(r.sRGBHex)).catch(() => { /* người dùng bấm Esc */ }); }}>
            <Pipette className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <ColorText key={fmt} color={formatColor(fromHsva(hsv), fmt, alpha)} alpha={alpha} label={i18n.t('web.color.input')} onCommit={applyHex} />
      {recentList.length > 0 && (
        <div role="group" aria-label={i18n.t('web.color.recent')}>
          <div className="mb-1 text-[11px] text-muted">{i18n.t('web.color.recent')}</div>
          <div className="grid grid-cols-6 gap-1">
            {recentList.map((c) => (
              <button key={c} type="button" className="grid h-6 w-6 place-items-center rounded-sm hover:bg-raised" aria-label={i18n.t('web.color.useRecent', { color: c.toUpperCase() })} title={c.toUpperCase()}
                onClick={() => applyHex(c)}><ColorChip color={c} className="h-4 w-4 rounded-sm" /></button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ô nhập mã màu: Enter hoặc rời ô để áp; không đọc được thì báo bằng chữ + biểu tượng và giữ màu cũ. */
function ColorText({ color, alpha, label, onCommit }: { color: string; alpha: boolean; label: string; onCommit(hex: string): void }) {
  const { i18n } = useI18n();
  const msgId = useId();
  const [text, setText] = useState(color), [editing, setEditing] = useState(false), [error, setError] = useState(false);
  useEffect(() => { if (!editing) setText(color); }, [color, editing]);
  const commit = () => {
    const t = text.trim(); if (!t) { setText(color); setError(false); return; }
    const hex = normalizeColor(t, alpha);
    if (!hex) { setError(true); return; }
    setError(false); onCommit(hex);
  };
  return (
    <div>
      <input type="text" spellCheck={false} autoComplete="off" aria-label={label} value={text} data-testid="color-text"
        aria-invalid={error || undefined} aria-describedby={error ? msgId : undefined}
        className={`field min-h-[var(--hit)] w-full px-1.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-focus ${error ? '!border-danger' : ''}`}
        onFocus={(e) => { setEditing(true); e.currentTarget.select(); }}
        onChange={(e) => { setText(e.target.value); setError(false); }}
        onBlur={() => { commit(); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
      <span id={msgId} role="status" aria-live="polite" className={error ? 'mt-1 flex gap-1.5 text-xs leading-snug text-fg' : 'sr-only'} data-testid="color-error">
        {error && <><StatusIcon kind="error" className="mt-px h-3.5 w-3.5 shrink-0 text-danger" /><span>{i18n.t('web.color.invalid')}</span></>}
      </span>
    </div>
  );
}

/** Sao chép màu ở cách hiển thị đang chọn. Báo "Đã sao chép" qua chú thích và vùng đọc màn hình. */
function CopyButton({ text }: { text: string }) {
  const { i18n } = useI18n();
  const [done, setDone] = useState('');
  useEffect(() => { if (!done) return; const id = setTimeout(() => setDone(''), 1500); return () => clearTimeout(id); }, [done]);
  const clip = (globalThis.navigator as Navigator | undefined)?.clipboard;
  if (!clip) return null;
  return (
    <>
      <button type="button" className="tog" aria-label={i18n.t('web.color.copy')} title={done ? i18n.t('web.color.copied', { value: done }) : i18n.t('web.color.copy')}
        onClick={() => { clip.writeText(text).then(() => setDone(text)).catch(() => { /* không có quyền ghi bộ nhớ tạm */ }); }}>
        <Duplicate className="h-3.5 w-3.5" />
      </button>
      <span role="status" aria-live="polite" className="sr-only">{done ? i18n.t('web.color.copied', { value: done }) : ''}</span>
    </>
  );
}
