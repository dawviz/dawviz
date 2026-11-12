// Phát sáng động khi thanh phát chạm nốt (SRS REQ-GRAPHICS-17). Hàm thuần của (kiểu, track, nốt, t): tất định.
// Mặc định 'uniform': mọi nốt sáng như nhau (chỉ phụ thuộc glowActiveOnly và glowRelease).
// 'dynamic': cường độ = glowMin..glowMax theo một nguồn giá trị chuẩn hoá 0..1.
import { sampleLane, secToTick, volumeToUnit } from '@dawviz/parser-core';
import type { ASTNote, AutomationLane, ProjectTrack, TempoPoint } from './types.ts';
import type { NoteStyle } from './style.ts';

export interface GlowCtx { track: ProjectTrack; note: ASTNote; t: number; tempoMap: TempoPoint[]; pitchMin: number; pitchMax: number }

/** Giá trị lane automation tại t, chuẩn hoá 0..1 theo loại lane. Không có lane → undefined. */
export function laneUnit(track: ProjectTrack, name: string, tempoMap: TempoPoint[], t: number): number | undefined {
  const lane: AutomationLane | undefined = track.automation?.[name];
  if (!lane || !lane.points.length) return undefined;
  const v = sampleLane(lane, secToTick(tempoMap, Math.max(0, t)));
  if (lane.kind === 'volume') return volumeToUnit(v);          // gain tuyến tính → dB → 0..1 trong [-36, 0] dB
  if (lane.kind === 'pan') return clamp01((v + 1) / 2);         // -1 (trái) .. 1 (phải) → 0..1 [VERIFY chiều pan, SOI-19]
  if (lane.kind === 'midi-cc') return clamp01(v / 127);
  if (lane.kind === 'pitch-bend') return clamp01((v + 8192) / 16383);
  if (lane.range && lane.range.max !== lane.range.min) return clamp01((v - lane.range.min) / (lane.range.max - lane.range.min));
  return clamp01(v);                                            // mute, send, plugin không có range: coi như đã chuẩn hoá 0..1 [VERIFY]
}

/** Giá trị nguồn 0..1 cho nốt tại t; undefined = không có dữ liệu (khi đó coi như 1: sáng như chế độ đều nhau). */
export function glowSourceValue(st: NoteStyle, c: GlowCtx): number | undefined {
  const { note: n, t } = c;
  switch (st.glowSource) {
    case 'velocity': return clamp01(n.velocity / 127);
    case 'pitch': return c.pitchMax > c.pitchMin ? clamp01((n.pitch - c.pitchMin) / (c.pitchMax - c.pitchMin)) : 1;
    case 'pan': {
      const lane = laneUnit(c.track, 'pan', c.tempoMap, n.startTimeSeconds); // pan lấy tại lúc nốt bắt đầu
      const u = lane ?? (c.track.mix ? clamp01((c.track.mix.pan + 1) / 2) : undefined);
      return u === undefined ? undefined : panUnit(u, st);
    }
    case 'fade': { // sáng nhất lúc chạm, tắt dần đến cuối nốt
      const d = n.endTimeSeconds - n.startTimeSeconds;
      if (t < n.startTimeSeconds) return 1;
      return d > 0 ? clamp01(1 - (t - n.startTimeSeconds) / d) : 0;
    }
    case 'automation': {
      const u = laneUnit(c.track, st.glowLane, c.tempoMap, t);
      const kind = c.track.automation?.[st.glowLane]?.kind;
      return u !== undefined && kind === 'pan' ? panUnit(u, st) : u;
    }
  }
}

/** Hệ số nhân 0..1 cho `glow` của nốt tại t (đã gồm bao thời gian: đang phát / tắt dần sau nốt / luôn sáng). */
export function glowAmount(st: NoteStyle, c: GlowCtx): number {
  const { note: n, t } = c;
  const active = n.startTimeSeconds <= t && t < n.endTimeSeconds;
  let env: number;
  if (active || !st.glowActiveOnly) env = 1;
  else if (st.glowRelease > 0 && t >= n.endTimeSeconds && t < n.endTimeSeconds + st.glowRelease) env = 1 - (t - n.endTimeSeconds) / st.glowRelease;
  else return 0;
  if (st.glowMode !== 'dynamic') return env;
  const raw = glowSourceValue(st, c);
  const s = raw === undefined ? 1 : st.glowInvert ? 1 - raw : raw;
  return env * (st.glowMin + (st.glowMax - st.glowMin) * s);
}

/** u = pan đã chuẩn hoá 0..1 (0 trái, 0,5 giữa, 1 phải). 'lr' giữ nguyên; 'spread' = độ lệch khỏi giữa |2u − 1|. */
export function panUnit(u: number, st: Pick<NoteStyle, 'glowPanMode'>): number {
  return st.glowPanMode === 'spread' ? clamp01(Math.abs(2 * u - 1)) : u;
}

function clamp01(v: number) { return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0; }
