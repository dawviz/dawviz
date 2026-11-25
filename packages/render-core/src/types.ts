// Kiểu tối thiểu của UnifiedProjectAST mà Render Core cần (khớp docs/product/SRS.md, mục ProjectTrack/ASTNote).
export interface ASTNote { id: string; pitch: number; startTick: number; endTick: number; startTimeSeconds: number; endTimeSeconds: number; velocity: number; channel?: number /* kênh MIDI 0–15; 9 = kênh 10 (trống GM) */ }
export interface LanePoint { tick: number; timeSeconds: number; value: number; shape: number; tension?: number }
// REQ-AST-02: lane tuỳ ý (send, tham số plugin, MIDI CC…). Parser sinh volume/pan/mute (Reaper, FL) và MIDI CC (`cc<n>`) + pitch bend (`pitchBend`) từ .mid (T-66).
// Giá trị thô theo `range` (CC 0–127, pitch bend −8192..8191); chuẩn hoá về 0..1 ở laneNorm (glow.ts).
export interface AutomationLane {
  kind: 'volume' | 'pan' | 'mute' | 'send' | 'plugin' | 'midi-cc' | 'pitch-bend' | 'other'; name?: string; range?: { min: number; max: number; unit?: string };
  plugin?: { name: string; vendor?: string }; param?: { name?: string; index?: number }; points: LanePoint[];
}
export interface ProjectTrack {
  id: string; index: number; name: string; color: string; isMuted: boolean; isVisible: boolean;
  notes: ASTNote[]; pitchRange: { min: number; max: number };
  mix?: { volumeDb: number; pan: number };
  automation?: { volume?: AutomationLane; pan?: AutomationLane; mute?: AutomationLane; [laneId: string]: AutomationLane | undefined };
}
export interface TempoPoint { tick: number; timeSeconds: number; bpm: number; timeSigNumerator?: number; timeSigDenominator?: number }
export interface UnifiedProjectAST {
  meta: { title: string; artist?: string; totalDurationSeconds: number; totalTicks: number; internalPPQ: number; /** Nguồn tempo (REQ-PARSER-07): 'file' | 'midi-default' | 'fallback' | 'user'. */ tempoSource?: string;
    /** P-10: đoạn/marker của dự án (đã sắp theo thời gian). */ markers?: { tick: number; timeSeconds: number; name: string }[];
    /** P-11: lời bài hát theo âm tiết (MIDI Lyric/Text). */ lyrics?: { tick: number; timeSeconds: number; text: string }[] };
  tempoMap: TempoPoint[]; tracks: ProjectTrack[];
}
