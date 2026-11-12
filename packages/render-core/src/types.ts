// Kiểu tối thiểu của UnifiedProjectAST mà Render Core cần (khớp docs/product/SRS.md, mục ProjectTrack/ASTNote).
export interface ASTNote { id: string; pitch: number; startTick: number; endTick: number; startTimeSeconds: number; endTimeSeconds: number; velocity: number }
export interface LanePoint { tick: number; timeSeconds: number; value: number; shape: number; tension?: number }
// REQ-AST-02: lane tuỳ ý (send, tham số plugin, MIDI CC…). Parser hiện chỉ sinh volume/pan/mute (T-66).
export interface AutomationLane { kind: 'volume' | 'pan' | 'mute' | 'send' | 'plugin' | 'midi-cc' | 'pitch-bend' | 'other'; name?: string; range?: { min: number; max: number; unit?: string }; points: LanePoint[] }
export interface ProjectTrack {
  id: string; index: number; name: string; color: string; isMuted: boolean; isVisible: boolean;
  notes: ASTNote[]; pitchRange: { min: number; max: number };
  mix?: { volumeDb: number; pan: number };
  automation?: { volume?: AutomationLane; pan?: AutomationLane; mute?: AutomationLane; [laneId: string]: AutomationLane | undefined };
}
export interface TempoPoint { tick: number; timeSeconds: number; bpm: number }
export interface UnifiedProjectAST {
  meta: { title: string; totalDurationSeconds: number; totalTicks: number; internalPPQ: number };
  tempoMap: TempoPoint[]; tracks: ProjectTrack[];
}
