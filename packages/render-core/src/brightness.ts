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
  // 'off' = mọi nốt sáng đều nhau (mặc định từ 2026-11-12, REQ-GRAPHICS-06 sửa)
  source: 'off', floorDb: -36, ceilDb: 0, minBrightness: 0.25, maxBrightness: 1, invert: false,
});

/** Giới hạn ngưỡng dB cho ô nhập và cho sanitize (khớp REQ-GRAPHICS-06). Khoảng cách tối thiểu giữa sàn và trần: 1 dB. */
export const BRIGHTNESS_DB_RANGE = Object.freeze({ min: -120, max: 24, minGap: 1 });

/**
 * Đưa cấu hình độ sáng về hợp lệ: dB trong [-120, 24], sàn < trần ít nhất 1 dB, độ sáng trong [0, 1], min ≤ max.
 * `edited` là trường người dùng vừa đổi: trường đó được giữ, trường đối diện bị đẩy theo (kéo sàn vượt trần thì trần lùi theo).
 * Không có `edited` thì giữ sàn/min và đẩy trần/max. Giá trị không phải số hữu hạn lấy mặc định.
 */
export function sanitizeBrightness(cfg: BrightnessConfig, edited?: keyof BrightnessConfig): BrightnessConfig {
  const { min: dLo, max: dHi, minGap } = BRIGHTNESS_DB_RANGE;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  let floorDb = cl(num(cfg.floorDb, DEFAULT_BRIGHTNESS.floorDb), dLo, dHi - minGap);
  let ceilDb = cl(num(cfg.ceilDb, DEFAULT_BRIGHTNESS.ceilDb), dLo + minGap, dHi);
  if (ceilDb - floorDb < minGap) { if (edited === 'ceilDb') floorDb = ceilDb - minGap; else ceilDb = floorDb + minGap; }
  let minB = cl(num(cfg.minBrightness, DEFAULT_BRIGHTNESS.minBrightness), 0, 1);
  let maxB = cl(num(cfg.maxBrightness, DEFAULT_BRIGHTNESS.maxBrightness), 0, 1);
  if (minB > maxB) { if (edited === 'maxBrightness') minB = maxB; else maxB = minB; }
  const SOURCES: BrightnessSource[] = ['volume', 'pan', 'mute', 'static', 'off'];
  return { source: SOURCES.includes(cfg.source) ? cfg.source : DEFAULT_BRIGHTNESS.source, floorDb, ceilDb, minBrightness: minB, maxBrightness: maxB, invert: !!cfg.invert };
}

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
  cfg = sanitizeBrightness(cfg); // chặn chia cho 0 khi sàn = trần, và cấu hình hỏng từ preset/tệp phiên
  const u = sourceUnit(track, tempoMap, t, cfg);
  if (u === undefined) return 1;
  const k = cfg.invert ? 1 - u : u;
  return cfg.minBrightness + (cfg.maxBrightness - cfg.minBrightness) * k;
}
