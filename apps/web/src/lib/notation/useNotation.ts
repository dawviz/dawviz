// Hook dựng bản nhạc cho mọi widget Bản nhạc của scene (D-63). Dựng lại chỉ khi đổi thứ ảnh hưởng bản dựng
// (dự án, tempo, tập track, thuộc tính NOTATION_ENGRAVE_KEYS); đổi màu/phóng to/nét tay chỉ vẽ lại. Giữ bản cũ tới khi bản mới xong.
import { createContext, useEffect, useMemo, useState } from 'react';
import { tracksFor, type NotationLayout, type NotationProps, type SceneDocument, type TimelineIndex, type UnifiedProjectAST, type WidgetSpec } from '@dawviz/render-core';
import { notationKey, type NotationRequest } from './key.ts';
import { notationClient } from './notationWorker.ts';

export interface NotationState { layouts: ReadonlyMap<string, NotationLayout>; busy: ReadonlySet<string>; errors: ReadonlyMap<string, string> }
/** Trạng thái dựng cho mục Thiết lập của widget Bản nhạc (đang viết, lỗi, số trang, cảnh báo). */
export const NotationStatusContext = createContext<NotationState | null>(null);

/** Yêu cầu dựng cho một widget (thuần: test được). */
export function notationRequestFor(w: WidgetSpec<NotationProps>, ast: UnifiedProjectAST, index: TimelineIndex): { tracks: number[]; req: NotationRequest } {
  const tis = tracksFor(w, index).filter((ti) => ti.track.isVisible && !ti.notes.every((n) => n.channel === 9)); // bỏ track trống (kênh 10)
  const notes = tis.flatMap((ti) => ti.notes.map((n) => ({ id: n.id, pitch: n.pitch, startTick: n.startTick, endTick: n.endTick, startTimeSeconds: n.startTimeSeconds, endTimeSeconds: n.endTimeSeconds, velocity: n.velocity, track: ti.track.index })));
  const p = w.properties;
  return { tracks: tis.map((ti) => ti.track.index), req: { notes, tempoMap: ast.tempoMap, props: { division: p.division, triplets: p.triplets, simplify: p.simplify, splitPitch: p.splitPitch, voices: p.voices, keyMode: p.keyMode, keyFifths: p.keyFifths, keyMinor: p.keyMinor, layoutMode: p.layoutMode, barsPerSystem: p.barsPerSystem, systemsPerPage: p.systemsPerPage, musicFont: p.musicFont, measureNumbers: p.measureNumbers, measureNumberSize: p.measureNumberSize, tempoMark: p.tempoMark } } };
}

export function useNotation(scene: SceneDocument, ast: UnifiedProjectAST | null, index: TimelineIndex | null, projectId: string): NotationState {
  const jobs = useMemo(() => {
    if (!ast || !index) return [];
    const tempoSig = JSON.stringify(ast.tempoMap.map((p) => [p.tick, p.bpm, p.timeSigNumerator, p.timeSigDenominator]));
    return scene.widgets.filter((w): w is WidgetSpec<NotationProps> => w.type === 'NOTATION').map((w) => {
      const { tracks, req } = notationRequestFor(w, ast, index);
      return { id: w.id, key: notationKey(projectId + '|' + tempoSig, tracks, w.properties), req };
    });
  }, [scene.widgets, ast, index, projectId]);
  const sig = jobs.map((j) => j.id + '=' + j.key).join('\n');
  const [done, setDone] = useState<ReadonlyMap<string, { key: string; layout: NotationLayout }>>(new Map());
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(() => {
    let live = true;
    for (const j of jobs) {
      notationClient.get(j.key, j.req).then(
        (layout) => { if (live) { setDone((m) => new Map(m).set(j.id, { key: j.key, layout })); setErrors((m) => { if (!m.has(j.id)) return m; const n = new Map(m); n.delete(j.id); return n; }); } },
        (e: Error) => { if (live) setErrors((m) => new Map(m).set(j.id, e.message)); },
      );
    }
    return () => { live = false; };
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const layouts = new Map<string, NotationLayout>(), busy = new Set<string>();
    for (const j of jobs) {
      const d = done.get(j.id);
      if (d) layouts.set(j.id, d.layout);
      if (!d || d.key !== j.key) busy.add(j.id);
    }
    return { layouts, busy, errors };
  }, [jobs, done, errors]);
}
