// Khoá đệm và kiểu yêu cầu dựng bản nhạc: module NHẸ (không import VexFlow) để luồng chính dùng được mà không kéo engraver vào bundle chính.
import { NOTATION_ENGRAVE_KEYS, type NotationProps, type TempoPoint } from '@dawviz/render-core';

export interface NotationNote { id: string; pitch: number; startTick: number; endTick: number; startTimeSeconds: number; endTimeSeconds: number; velocity: number; track: number }
export type NotationEngraveProps = Pick<NotationProps, typeof NOTATION_ENGRAVE_KEYS[number]>;
export interface NotationRequest { notes: NotationNote[]; tempoMap: TempoPoint[]; props: NotationEngraveProps; width?: number }

/** Khoá đệm của một bản dựng: thuộc tính ảnh hưởng bản dựng + tập track + định danh dự án. */
export function notationKey(projectKey: string, trackIdx: readonly number[], props: NotationProps): string {
  return JSON.stringify([projectKey, [...trackIdx].sort((a, b) => a - b), NOTATION_ENGRAVE_KEYS.map((k) => props[k])]);
}
