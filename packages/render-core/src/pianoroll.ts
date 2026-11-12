// Bố cục Piano Roll thuần (không vẽ): trả danh sách hình chữ nhật theo pixel. Cùng đầu vào → cùng đầu ra ở Preview và Export.
import { notesInRange, type TimelineIndex } from './notes.ts';
import { trackBrightness, DEFAULT_BRIGHTNESS, type BrightnessConfig } from './brightness.ts';
import type { TempoPoint } from './types.ts';
import { glowAmount } from './glow.ts';
import { resolveNoteStyle, noteColor, shade, DEFAULT_KEYBOARD_STYLE, type StyleConfig, type KeyboardStyle } from './style.ts';

export interface PianoRollOptions {
  width: number; height: number;
  windowSeconds: number;       // độ dài cửa sổ nhìn
  playheadRatio: number;       // vị trí playhead trong cửa sổ, 0..1
  pitchMin: number; pitchMax: number; // đóng cả hai đầu
  brightness?: Record<string, BrightnessConfig>; // theo track.id; thiếu thì dùng mặc định
  style?: StyleConfig;         // kiểu dáng nốt; thiếu thì dùng mặc định
  left?: number;               // chừa bên trái (px) cho bàn phím; vùng cuộn nốt là [left, width]
}
export interface NoteRect { id: string; trackId: string; x: number; y: number; w: number; h: number; color: string; brightness: number; active: boolean; velocity: number;
  pitch: number; opacity: number; radius: number; glow: number; glowRadius: number; borderWidth: number; borderColor: string }

export function layoutPianoRoll(index: TimelineIndex, tempoMap: TempoPoint[], t: number, o: PianoRollOptions): NoteRect[] {
  const t0 = t - o.windowSeconds * o.playheadRatio, t1 = t0 + o.windowSeconds;
  const left = o.left ?? 0, pxPerSec = (o.width - left) / o.windowSeconds;
  const rows = o.pitchMax - o.pitchMin + 1, rowH = o.height / rows;
  const rects: NoteRect[] = [];
  for (const ti of index.tracks) {
    if (!ti.track.isVisible) continue;
    const cfg = o.brightness?.[ti.track.id] ?? DEFAULT_BRIGHTNESS;
    for (const n of notesInRange(ti, t0, t1)) {
      if (n.pitch < o.pitchMin || n.pitch > o.pitchMax) continue;
      const st = resolveNoteStyle(o.style, ti.track.id);
      const x = left + (n.startTimeSeconds - t0) * pxPerSec, h = Math.max(1, rowH * st.heightScale);
      const active = n.startTimeSeconds <= t && t < n.endTimeSeconds;
      const color = noteColor(st, ti.track.color, n.pitch, n.velocity), w = Math.max(1, (n.endTimeSeconds - n.startTimeSeconds) * pxPerSec);
      rects.push({
        id: n.id, trackId: ti.track.id, x, w, y: (o.pitchMax - n.pitch) * rowH + (rowH - h) / 2, h, color,
        brightness: trackBrightness(ti.track, tempoMap, Math.max(0, n.startTimeSeconds), cfg),
        active, velocity: n.velocity, pitch: n.pitch,
        opacity: st.opacity * (active ? 1 : st.inactiveOpacity), radius: Math.min(st.cornerRadius, h / 2, w / 2),
        glow: st.glow > 0 ? st.glow * glowAmount(st, { track: ti.track, note: n, t, tempoMap, pitchMin: o.pitchMin, pitchMax: o.pitchMax }) : 0, glowRadius: st.glowRadius,
        borderWidth: st.borderWidth, borderColor: st.borderColor || shade(color, 0.45),
      });
    }
  }
  return rects;
}

// ---- Bàn phím piano (widget): cùng trục cao độ với Piano Roll, phím sáng màu track khi có nốt đang phát.
const BLACK = new Set([1, 3, 6, 8, 10]);
export interface KeyRect { pitch: number; x: number; y: number; w: number; h: number; black: boolean; active: boolean; color: string }
export function layoutKeyboard(index: TimelineIndex, t: number, o: { height: number; pitchMin: number; pitchMax: number; style?: Partial<KeyboardStyle>; noteStyle?: StyleConfig }): KeyRect[] {
  const ks = { ...DEFAULT_KEYBOARD_STYLE, ...(o.style ?? {}) };
  const rows = o.pitchMax - o.pitchMin + 1, rowH = o.height / rows, activeBy = new Map<number, string>();
  for (const ti of index.tracks) {
    if (!ti.track.isVisible) continue;
    const st = resolveNoteStyle(o.noteStyle, ti.track.id);
    for (const n of notesInRange(ti, t, t)) if (n.startTimeSeconds <= t && t < n.endTimeSeconds && n.pitch >= o.pitchMin && n.pitch <= o.pitchMax)
      activeBy.set(n.pitch, ks.useTrackColor ? noteColor(st, ti.track.color, n.pitch, n.velocity) : '#7cc4ff');
  }
  const keys: KeyRect[] = [];
  for (let p = o.pitchMin; p <= o.pitchMax; p++) {
    const black = BLACK.has(p % 12), c = activeBy.get(p);
    keys.push({ pitch: p, x: 0, y: (o.pitchMax - p) * rowH, w: black ? ks.width * 0.62 : ks.width, h: rowH, black, active: c !== undefined, color: c ?? (black ? ks.blackColor : ks.whiteColor) });
  }
  return keys.sort((a, b) => Number(a.black) - Number(b.black)); // phím đen vẽ sau (nằm trên)
}
