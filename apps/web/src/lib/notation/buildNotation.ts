// Dựng bản nhạc cho một widget Bản nhạc: nốt của các track được gán → lượng tử (Render Core) → engrave (VexFlow) → NotationLayout.
// Hàm thuần theo đầu vào (tất định), chạy trong notation.worker.ts. Cảnh báo theo mã, giao diện dịch.
import { quantize, type NotationLayout, type TempoPoint, type NotationWarning } from '@dawviz/render-core';
import { engrave } from './engrave.ts';
import type { NotationRequest } from './key.ts';

export { notationKey, type NotationNote, type NotationEngraveProps, type NotationRequest } from './key.ts';

/** Giây của một tick theo tempoMap (đoạn tempo hằng, như parser). */
export function tickToSecFn(tempoMap: readonly TempoPoint[], ppq = 960): (tick: number) => number {
  const pts = tempoMap.length ? tempoMap : [{ tick: 0, timeSeconds: 0, bpm: 120 }];
  return (tick) => {
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (pts[m].tick <= tick) lo = m; else hi = m - 1; }
    const p = pts[lo];
    return p.timeSeconds + ((tick - p.tick) / ppq) * (60 / p.bpm);
  };
}

/** Ngưỡng cảnh báo: dưới 30% nốt đúng lưới = có lẽ chơi tự do không theo nhịp (cần bản nhạc có tempo map). */
export const OFFGRID_RATIO = 0.3;
export const KEY_CONFIDENCE_MIN = 0.05;

export function buildNotation(req: NotationRequest): NotationLayout {
  const { notes, tempoMap, props } = req;
  const toSec = tickToSecFn(tempoMap);
  const warnings: NotationWarning[] = [];
  const sm = quantize({ notes: notes.map((n) => ({ ...n })), tempoMap }, {
    maxDivision: props.division, triplets: props.triplets, simplicity: props.simplify, splitPitch: props.splitPitch, maxVoices: props.voices,
    ...(props.keyMode === 'MANUAL' ? { key: { fifths: props.keyFifths, mode: props.keyMinor ? 'minor' : 'major' } } : {}),
  });
  const info = new Map(notes.map((n) => [n.id, { on: n.startTimeSeconds, off: n.endTimeSeconds, track: n.track }]));
  const lay = engrave(sm, {
    width: req.width ?? 1200, barsPerSystem: props.barsPerSystem, systemsPerPage: props.systemsPerPage, musicFont: props.musicFont,
    measureNumbers: props.measureNumbers, measureNumberScale: props.measureNumberSize, tempoBpm: props.tempoMark && tempoMap.length ? tempoMap[0].bpm : undefined,
    tickToSec: toSec, noteInfo: (id) => info.get(id),
  });
  if (!notes.length) warnings.push({ code: 'WARN_NOTATION_EMPTY', message: 'không có nốt nào trong các track được gán' });
  else if (notes.length >= 50 && sm.stats.exactOnsets / notes.length < OFFGRID_RATIO)
    warnings.push({ code: 'WARN_NOTATION_OFFGRID', message: 'phần lớn nốt không nằm trên lưới phách: bài có lẽ chơi tự do, không theo nhịp; bản nhạc sẽ sai nhịp', details: { onGridPct: Math.round((100 * sm.stats.exactOnsets) / notes.length) } });
  if (sm.key.estimated && notes.length && sm.key.confidence < KEY_CONFIDENCE_MIN) warnings.push({ code: 'WARN_NOTATION_KEY_GUESS', message: 'không chắc giọng của bài; hãy đặt giọng bằng tay nếu hoá biểu sai' });
  return { ...lay, warnings: [...warnings, ...lay.warnings] };
}
