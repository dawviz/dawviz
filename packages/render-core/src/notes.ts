// Truy cập ngẫu nhiên theo thời gian (NFR-PERF-05): chỉ mục nốt theo track, tìm nốt đang vang tại t bằng tìm nhị phân.
import type { ASTNote, ProjectTrack } from './types.ts';

export interface TrackIndex { track: ProjectTrack; notes: ASTNote[]; maxDur: number }
export interface TimelineIndex { tracks: TrackIndex[]; duration: number }

export function buildIndex(tracks: ProjectTrack[], duration: number): TimelineIndex {
  return {
    duration,
    tracks: tracks.map((track) => {
      const notes = [...track.notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.pitch - b.pitch);
      let maxDur = 0; for (const n of notes) maxDur = Math.max(maxDur, n.endTimeSeconds - n.startTimeSeconds);
      return { track, notes, maxDur };
    }),
  };
}

/** Chỉ số nốt đầu tiên có startTimeSeconds >= t. */
function lowerBound(notes: ASTNote[], t: number): number {
  let lo = 0, hi = notes.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (notes[mid].startTimeSeconds < t) lo = mid + 1; else hi = mid; }
  return lo;
}

/** Các nốt trong [t0, t1] (giao với khoảng), theo thứ tự bắt đầu. Dùng cho cửa sổ nhìn của Piano Roll. */
export function notesInRange(ti: TrackIndex, t0: number, t1: number): ASTNote[] {
  const out: ASTNote[] = [];
  for (let i = lowerBound(ti.notes, t0 - ti.maxDur); i < ti.notes.length; i++) {
    const n = ti.notes[i];
    if (n.startTimeSeconds > t1) break;
    if (n.endTimeSeconds >= t0) out.push(n);
  }
  return out;
}

/** Nốt đang vang tại t: start <= t < end. */
export function activeNotes(ti: TrackIndex, t: number): ASTNote[] {
  return notesInRange(ti, t, t).filter((n) => n.startTimeSeconds <= t && t < n.endTimeSeconds);
}
