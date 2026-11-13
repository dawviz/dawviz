// Nhãn danh sách lịch sử (T-07 bước 2b). Dựng LÚC HIỂN THỊ từ loại lệnh + tham số + giá trị trước/sau, qua locales/,
// nên đổi ngôn ngữ thì nhãn đổi theo (không lưu chuỗi đã dịch trong lịch sử). Ví dụ: "Độ đục 0,70 → 0,85".
import type { I18n } from '@dawviz/i18n';
import type { Cmd } from './commands.ts';
import type { History } from './store.ts';

export interface LabelCtx { i18n: Pick<I18n, 't' | 'has' | 'number'>; trackName(id: string): string; widgetName?(id: string): string }

/** Tên trường → khoá hiển thị. Trường không có trong bảng hiện đúng tên mã. */
const NOTE_FIELD: Record<string, string> = {
  opacity: 'web.style.opacity', inactiveOpacity: 'web.style.inactiveOpacity', heightScale: 'web.style.heightScale', cornerRadius: 'web.style.cornerRadius',
  glow: 'web.style.glow', glowRadius: 'web.style.glowRadius', borderWidth: 'web.style.borderWidth', glowActiveOnly: 'web.style.glowActiveOnly',
  colorMode: 'web.style.colorMode', customColor: 'web.style.customColor', glowMode: 'web.glow.mode', glowSource: 'web.glow.source',
  glowPanMode: 'web.glow.panMode', glowLane: 'web.glow.lane', glowMin: 'web.glow.min', glowMax: 'web.glow.max', glowInvert: 'web.glow.invert', glowRelease: 'web.glow.release',
};
const KEYBOARD_FIELD: Record<string, string> = { enabled: 'web.keyboard.show' };
const BRIGHTNESS_FIELD: Record<string, string> = { source: 'web.brightness.source', floorDb: 'web.brightness.floorDb', ceilDb: 'web.brightness.ceilDb', minBrightness: 'web.brightness.min', maxBrightness: 'web.brightness.max', invert: 'web.brightness.invert' };
/** Trường có giá trị chữ dịch được: tiền tố khoá của giá trị. */
const VALUE_PREFIX: Record<string, string> = { colorMode: 'web.style.mode.', glowMode: 'web.glow.mode.', glowSource: 'web.glow.source.', glowPanMode: 'web.glow.panMode.', source: 'web.brightness.' };

const obj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});
const changedKeys = (a: unknown, b: unknown): string[] => {
  const x = obj(a), y = obj(b);
  return Object.keys({ ...x, ...y }).filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k]));
};

function fmt(c: LabelCtx, key: string, v: unknown): string {
  const { i18n } = c;
  if (typeof v === 'number') return i18n.number(v, { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); // 0,70 → 0,85; số nguyên không thêm ",00"
  if (typeof v === 'boolean') return i18n.t(v ? 'web.hist.on' : 'web.hist.off');
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') { const k = VALUE_PREFIX[key] ? VALUE_PREFIX[key] + v : ''; return k && i18n.has(k) ? i18n.t(k) : v; }
  return JSON.stringify(v);
}

/** Nhãn của một trường đổi trong `fields` (tên trường → khoá), kèm "trước → sau". Nhiều trường: "{what}: n thay đổi". */
function changeLabel(c: LabelCtx, what: string, fields: Record<string, string>, cmd: Cmd, where?: string): string {
  const { i18n } = c;
  const keys = changedKeys(cmd.before, cmd.after);
  if (keys.length === 1) {
    const k = keys[0], name = fields[k] && i18n.has(fields[k]) ? i18n.t(fields[k]) : k;
    const from = fmt(c, k, obj(cmd.before)[k]), to = fmt(c, k, obj(cmd.after)[k]);
    return where ? i18n.t('web.hist.changeIn', { where, name, from, to }) : i18n.t('web.hist.change', { name, from, to });
  }
  return i18n.t('web.hist.many', { what: where ? `${where} · ${what}` : what, n: keys.length });
}

/** Tên điểm neo: một trong 9 điểm chuẩn ("Tâm", "Trên trái"…) hoặc phần trăm. */
function anchorName(c: LabelCtx, a: unknown): string {
  const { x, y } = obj(a) as { x?: number; y?: number };
  const i = [0, 0.5, 1].indexOf(Number(y)) * 3 + [0, 0.5, 1].indexOf(Number(x));
  if ([0, 0.5, 1].includes(Number(x)) && [0, 0.5, 1].includes(Number(y))) return c.i18n.t(`web.editor.anchorPt.${i}`);
  return `${c.i18n.number(Math.round(Number(x) * 100))}% · ${c.i18n.number(Math.round(Number(y) * 100))}%`;
}
/** Nhãn của một lần đổi layout, theo thao tác người dùng làm: xoay, đổi neo, đổi cỡ hay di chuyển. */
function layoutLabel(c: LabelCtx, widget: string, before: unknown, after: unknown): string {
  const { i18n } = c, a = obj(after), keys = changedKeys(before, after);
  const n = (v: unknown) => i18n.number(Math.round(Number(v)));
  if (keys.includes('anchor')) return i18n.t('web.hist.anchor', { widget, point: anchorName(c, a.anchor) });
  if (keys.includes('width') || keys.includes('height')) return i18n.t('web.hist.resize', { widget, w: n(a.width), h: n(a.height) });
  if (keys.includes('rotation')) return i18n.t('web.hist.rotate', { widget, from: n(obj(before).rotation), to: n(a.rotation) });
  return i18n.t('web.hist.moveWidget', { widget, x: n(a.x), y: n(a.y) });
}

export function describeCommand(cmd: Cmd, c: LabelCtx): string {
  const { i18n } = c, p = obj(cmd.params);
  const track = typeof p.track === 'string' ? c.trackName(p.track) : '';
  const widget = typeof p.widget === 'string' ? (c.widgetName?.(p.widget) ?? p.widget) : '';
  switch (cmd.type) {
    case 'patchNoteStyle': return changeLabel(c, i18n.t('web.hist.what.noteStyle'), NOTE_FIELD, cmd);
    case 'patchKeyboard': return changeLabel(c, i18n.t('web.hist.what.keyboard'), KEYBOARD_FIELD, cmd);
    case 'patchTrackStyle':
      return cmd.after === undefined ? i18n.t('web.hist.trackStyleClear', { track }) : changeLabel(c, i18n.t('web.hist.what.trackStyle'), NOTE_FIELD, cmd, track);
    case 'patchBrightness': return changeLabel(c, i18n.t('web.hist.what.brightness'), BRIGHTNESS_FIELD, cmd, track);
    case 'applyNotePreset': {
      const id = typeof p.preset === 'string' ? p.preset : '';
      return i18n.t('web.hist.notePreset', { name: id && i18n.has(`web.style.preset.${id}`) ? i18n.t(`web.style.preset.${id}`) : (id || '…') });
    }
    case 'setVideoStyle': {
      const b = obj(cmd.before), a = obj(cmd.after);
      const name = (o: Record<string, unknown>) => { const id = String(o.videoStyle); return i18n.has(`web.style.video.${id}`) ? i18n.t(`web.style.video.${id}`) : String(obj(o.scene).presetName ?? id); };
      return i18n.t('web.hist.videoStyle', { from: name(b), to: name(a) });
    }
    case 'loadPreset': return i18n.t('web.hist.loadPreset', { name: String(obj(obj(cmd.after).scene).presetName ?? '') });
    case 'toggleHidden': return i18n.t(p.on ? 'web.hist.hide' : 'web.hist.show', { track });
    case 'toggleSolo': return i18n.t(p.on ? 'web.hist.soloOn' : 'web.hist.soloOff', { track });
    case 'setAllHidden': return i18n.t(p.hidden ? 'web.hist.hideAll' : 'web.hist.showAll');
    case 'moveTrack': return i18n.t('web.hist.move', { track, from: String(p.from), to: String(p.to) });
    case 'patchLayout': return layoutLabel(c, widget, cmd.before, cmd.after);
    case 'patchLayouts': {
      const ids = Array.isArray(p.widgets) ? (p.widgets as string[]) : [];
      if (ids.length === 1) return layoutLabel(c, widget, obj(cmd.before)[ids[0]], obj(cmd.after)[ids[0]]);
      const rotated = ids.some((id) => changedKeys(obj(cmd.before)[id], obj(cmd.after)[id]).includes('rotation'));
      return i18n.t(rotated ? 'web.hist.rotateMany' : 'web.hist.moveMany', { n: ids.length });
    }
    case 'patchWidgetProps': return changeLabel(c, i18n.t('web.hist.what.widgetProps'), {}, cmd, widget);
    case 'setWidgetVisible': return i18n.t(cmd.after ? 'web.hist.widgetShow' : 'web.hist.widgetHide', { widget });
    case 'reorderZ': return i18n.t('web.hist.reorderZ', { widget });
    case 'setPlayheadRatio': {
      const pct = (v: unknown) => i18n.number(Math.round(Number(v) * 100));
      return i18n.t('web.hist.change', { name: i18n.t('web.playhead.position'), from: `${pct(cmd.before)}%`, to: `${pct(cmd.after)}%` });
    }
    case 'setPlayheadVisible': return i18n.t('web.hist.change', { name: i18n.t('web.playhead.show'), from: fmt(c, '', cmd.before), to: fmt(c, '', cmd.after) });
    case 'setAudioOffset': return i18n.t('web.hist.audioOffset', { from: fmt(c, 'ms', cmd.before), to: fmt(c, 'ms', cmd.after) });
    case 'patchSnapping': return changeLabel(c, i18n.t('web.hist.what.snapping'), {}, cmd);
    default: return i18n.has(cmd.label) ? i18n.t(cmd.label) : cmd.type;
  }
}

export interface HistoryItem { position: number; label: string; redo: boolean }

/** Dòng danh sách từ dòng thời gian: mới nhất trước, mốc đầu ở cuối. */
export function historyItems(h: Pick<History<unknown>, 'timeline' | 'position'>, label: (i: number) => string, origin: string): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (let i = h.timeline.length - 1; i >= 0; i--) out.push({ position: i + 1, label: label(i), redo: i + 1 > h.position });
  out.push({ position: 0, label: origin, redo: false });
  return out;
}

