// Độ sáng track theo automation (SRS REQ-GRAPHICS-06, BRD D-33). Hàm thuần của (track, t, cấu hình): tất định giữa Preview và Export.
import { sampleLane, volumeToUnit, dbToGain, secToTick } from '@dawviz/parser-core';
import type { ProjectTrack, TempoPoint } from './types.ts';

export type BrightnessSource = 'volume' | 'pan' | 'mute' | 'static' | 'off';
export interface BrightnessConfig {
  source: BrightnessSource;
  floorDb: number; ceilDb: number; // chỉ dùng cho volume/static
  minBrightness: number; maxBrightness: number;
  invert: boolean;
}
export const DEFAULT_BRIGHTNESS: Readonly<BrightnessConfig> = Object.freeze({
  source: 'volume', floorDb: -36, ceilDb: 0, minBrightness: 0.25, maxBrightness: 1, invert: false,
});

/** Giá trị nguồn chuẩn hoá 0..1 tại giây `t`; undefined nếu track không có dữ liệu cho nguồn đó. */
export function sourceUnit(track: ProjectTrack, tempoMap: TempoPoint[], t: number, cfg: BrightnessConfig): number | undefined {
  const range = { floorDb: cfg.floorDb, ceilDb: cfg.ceilDb };
  switch (cfg.source) {
    case 'off': return undefined;
    case 'static': return track.mix ? volumeToUnit(dbToGain(track.mix.volumeDb), range) : undefined;
    case 'volume': {
      const lane = track.automation?.volume;
      if (lane) return volumeToUnit(sampleLane(lane, secToTick(tempoMap, t)), range);
      return track.mix ? volumeToUnit(dbToGain(track.mix.volumeDb), range) : undefined;
    }
    case 'pan': { // thử nghiệm: chiều pan chưa kiểm (SOI-19); dùng độ lệch khỏi giữa
      const lane = track.automation?.pan;
      const v = lane ? sampleLane(lane, secToTick(tempoMap, t)) : track.mix?.pan;
      return v === undefined ? undefined : Math.min(1, Math.abs(v));
    }
    case 'mute': { // thử nghiệm: nghĩa giá trị mute chưa kiểm (SOI-19); coi giá trị > 0.5 là "đang bật tiếng"
      const lane = track.automation?.mute;
      if (!lane) return undefined;
      return sampleLane(lane, secToTick(tempoMap, t)) > 0.5 ? 1 : 0;
    }
  }
}

/** Độ sáng B(t) trong [minBrightness, maxBrightness]; track không có dữ liệu nguồn → 1 (hình ảnh không đổi). */
export function trackBrightness(track: ProjectTrack, tempoMap: TempoPoint[], t: number, cfg: BrightnessConfig = DEFAULT_BRIGHTNESS): number {
  const u = sourceUnit(track, tempoMap, t, cfg);
  if (u === undefined) return 1;
  const k = cfg.invert ? 1 - u : u;
  return cfg.minBrightness + (cfg.maxBrightness - cfg.minBrightness) * k;
}
