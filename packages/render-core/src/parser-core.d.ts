declare module '@dawviz/parser-core' {
  export function sampleLane(lane: { kind: string; points: { tick: number; value: number; shape: number; tension?: number }[] } | undefined, tick: number): number;
  export function volumeToUnit(gain: number, o?: { floorDb?: number; ceilDb?: number }): number;
  export function dbToGain(db: number): number;
  export function secToTick(map: { tick: number; timeSeconds: number; bpm: number }[], sec: number): number;
}
